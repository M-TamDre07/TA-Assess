/**
 * TA ASSESS — Account & Security API
 * Google Apps Script Web App module.
 *
 * Deploy this file as a separate Web App using the same Spreadsheet ID as
 * the main TA Assess backend. Keeping authentication separate lets the
 * existing assessment/verification deployment remain stable.
 *
 * Required Script Property:
 *   SPREADSHEET_ID
 *
 * Security model:
 * - Passwords are never stored in plaintext.
 * - Passwords use a unique salt + repeated SHA-256 derivation.
 * - Session tokens are random and only their SHA-256 hashes are stored.
 * - Sessions expire and can be revoked.
 * - Failed login attempts trigger a temporary account lock.
 * - Audit events contain metadata only; never passwords or tokens.
 * - No raw assessment answers are stored by this module.
 *
 * NOTE: Google Sheets is a lightweight data store, not a dedicated
 * authentication database. For higher-assurance production authentication,
 * use a managed identity provider or dedicated auth/database service.
 */

const ACC = {
  VERSION: '1.0.0',
  PROP_SHEET_ID: 'SPREADSHEET_ID',
  SHEETS: {
    ACCOUNTS: 'Accounts',
    SESSIONS: 'Sessions',
    SECURITY: 'Security Events'
  },
  ACCOUNT_HEADERS: [
    'userId','username','usernameNormalized','displayName','displayNameNormalized',
    'passwordSalt','passwordHash','createdAt','lastLoginAt','status',
    'failedAttempts','lockUntil','sessionVersion','lastActivityAt'
  ],
  SESSION_HEADERS: [
    'tokenHash','userId','createdAt','expiresAt','revokedAt','lastUsedAt'
  ],
  SECURITY_HEADERS: [
    'timestamp','eventId','eventName','userId','usernameNormalized','success','metadataJson'
  ],
  SESSION_TTL_MS: 24 * 60 * 60 * 1000,
  LOCK_MS: 15 * 60 * 1000,
  MAX_FAILED: 5,
  HASH_ROUNDS: 12000,
  MAX_BODY: 30000
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) return out_({success:false,error:'Server sedang sibuk.'});
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > ACC.MAX_BODY) return out_({success:false,error:'Payload tidak valid.'});
    const data = parse_(body);
    if (!data) return out_({success:false,error:'JSON tidak valid.'});
    ensure_();

    const action = String(data.action || '');
    if (action === 'register') return out_(register_(data));
    if (action === 'login') return out_(login_(data));
    if (action === 'me') return out_(me_(data));
    if (action === 'logout') return out_(logout_(data));
    if (action === 'checkUsername') return out_(checkUsername_(data));
    if (action === 'normalizeName') return out_(normalizeName_(data));
    if (action === 'event') return out_(event_(data));
    return out_({success:false,error:'Action tidak didukung.'});
  } catch (err) {
    console.error(err);
    return out_({success:false,error:'Terjadi kesalahan server.'});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet(e) {
  try {
    ensure_();
    const p = e && e.parameter ? e.parameter : {};
    if (String(p.action || 'health') === 'health') {
      return out_({success:true,service:'TA Assess Account API',version:ACC.VERSION,timestamp:new Date().toISOString()});
    }
    return out_({success:false,error:'Action GET tidak didukung.'});
  } catch (_) {
    return out_({success:false,error:'Terjadi kesalahan server.'});
  }
}

function register_(d) {
  const username = normalizeUsername_(d.username);
  const displayName = normalizeDisplayName_(d.displayName);
  const password = String(d.password || '');
  const validation = validateCredentials_(username, displayName, password);
  if (!validation.ok) return validation;

  const sh = sheet_(ACC.SHEETS.ACCOUNTS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === username) return {success:false,error:'Username sudah digunakan.'};
  }

  const salt = randomHex_(16);
  const hash = derivePassword_(password, salt);
  const userId = 'USR-' + Utilities.getUuid().replace(/-/g,'').substring(0,16).toUpperCase();
  const now = new Date();

  sh.appendRow([
    userId, username, username, displayName, normalizeNameFingerprint_(displayName),
    salt, hash, now, '', 'ACTIVE', 0, '', 1, now
  ]);

  securityEvent_('account_created', userId, username, true, {nameNormalized:true});
  return {success:true,user:{userId:userId,displayName:displayName,username:username}};
}

function login_(d) {
  const username = normalizeUsername_(d.username);
  const password = String(d.password || '');
  if (!username || !password) return {success:false,error:'Username dan password wajib diisi.'};

  const found = findAccount_(username);
  if (!found) return {success:false,error:'Username atau password salah.'};
  const row = found.row;
  const sh = found.sheet;
  const now = Date.now();
  const lockUntil = Date.parse(String(row[11] || '')) || 0;

  if (String(row[9]) !== 'ACTIVE') return {success:false,error:'Akun tidak aktif.'};
  if (lockUntil > now) return {success:false,error:'Terlalu banyak percobaan. Coba lagi setelah beberapa menit.'};

  const expected = String(row[6] || '');
  const actual = derivePassword_(password, String(row[5] || ''));
  if (!safeEqual_(actual, expected)) {
    const failures = Number(row[10] || 0) + 1;
    const newLock = failures >= ACC.MAX_FAILED ? new Date(now + ACC.LOCK_MS) : '';
    sh.getRange(found.index, 11).setValue(failures);
    sh.getRange(found.index, 12).setValue(newLock);
    securityEvent_('login_failed', String(row[0]), username, false, {attempt:failures});
    return {success:false,error:'Username atau password salah.'};
  }

  sh.getRange(found.index, 9).setValue(new Date());
  sh.getRange(found.index, 11).setValue(0);
  sh.getRange(found.index, 12).setValue('');
  sh.getRange(found.index, 14).setValue(new Date());

  const token = randomHex_(32) + Utilities.getUuid().replace(/-/g,'');
  const tokenHash = sha256_(token);
  const expires = new Date(now + ACC.SESSION_TTL_MS);
  sheet_(ACC.SHEETS.SESSIONS).appendRow([tokenHash,String(row[0]),new Date(now),expires,'',new Date(now)]);
  securityEvent_('login_success', String(row[0]), username, true, {});

  return {
    success:true,
    token:token,
    expiresAt:expires.toISOString(),
    user:{userId:String(row[0]),username:username,displayName:String(row[3])}
  };
}

function me_(d) {
  const session = authenticate_(d.token);
  if (!session.ok) return session;
  touchSession_(session.sessionIndex);
  const account = findAccountById_(session.userId);
  if (!account) return {success:false,error:'Akun tidak ditemukan.'};
  return {success:true,user:{userId:String(account.row[0]),username:String(account.row[1]),displayName:String(account.row[3])}};
}

function logout_(d) {
  const token = String(d.token || '');
  if (!token) return {success:true};
  const hash = sha256_(token);
  const sh = sheet_(ACC.SHEETS.SESSIONS);
  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][0]) === hash && !rows[i][4]) {
      sh.getRange(i+1,5).setValue(new Date());
      securityEvent_('logout', String(rows[i][1]), '', true, {});
      break;
    }
  }
  return {success:true};
}

function checkUsername_(d) {
  const username = normalizeUsername_(d.username);
  if (!username) return {success:false,error:'Username tidak valid.'};
  return {success:true,available:!findAccount_(username)};
}

function normalizeName_(d) {
  const input = String(d.displayName || '');
  if (!input.trim()) return {success:false,error:'Nama wajib diisi.'};
  const normalized = normalizeDisplayName_(input);
  const suggestions = [];
  if (normalized !== input.trim().replace(/\s+/g,' ')) suggestions.push(normalized);
  return {success:true,input:input.trim(),normalized:normalized,suggestions:suggestions};
}

function event_(d) {
  const session = authenticate_(d.token);
  if (!session.ok) return session;
  const name = clean_(d.eventName,80);
  const allowed = ['assessment_opened','assessment_started','assessment_paused','assessment_resumed','answer_changed','assessment_submitted','result_viewed'];
  if (allowed.indexOf(name) === -1) return {success:false,error:'Event tidak diizinkan.'};
  securityEvent_(name, session.userId, '', true, sanitize_(d.metadata));
  touchSession_(session.sessionIndex);
  return {success:true};
}

function authenticate_(token) {
  if (!token || String(token).length < 40) return {success:false,error:'Sesi tidak valid.'};
  const hash = sha256_(String(token));
  const sh = sheet_(ACC.SHEETS.SESSIONS);
  const rows = sh.getDataRange().getValues();
  const now = Date.now();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][0]) !== hash) continue;
    const expires = Date.parse(String(rows[i][3] || '')) || 0;
    if (rows[i][4] || expires <= now) return {success:false,error:'Sesi telah berakhir. Silakan login kembali.'};
    return {ok:true,userId:String(rows[i][1]),sessionIndex:i+1};
  }
  return {success:false,error:'Sesi tidak valid.'};
}

function touchSession_(index) {
  sheet_(ACC.SHEETS.SESSIONS).getRange(index,6).setValue(new Date());
}

function validateCredentials_(username, displayName, password) {
  if (!/^[a-z0-9._-]{4,32}$/.test(username)) return {success:false,error:'Username 4–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda minus.'};
  if (displayName.length < 2 || displayName.length > 80) return {success:false,error:'Nama harus 2–80 karakter.'};
  if (password.length < 10) return {success:false,error:'Password minimal 10 karakter.'};
  if (password.length > 128) return {success:false,error:'Password terlalu panjang.'};
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return {success:false,error:'Password harus memiliki huruf dan angka.'};
  return {success:true};
}

function findAccount_(username) {
  const sh = sheet_(ACC.SHEETS.ACCOUNTS);
  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) if (String(rows[i][2]) === username) return {row:rows[i],index:i+1,sheet:sh};
  return null;
}

function findAccountById_(userId) {
  const sh = sheet_(ACC.SHEETS.ACCOUNTS);
  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) if (String(rows[i][0]) === userId) return {row:rows[i],index:i+1,sheet:sh};
  return null;
}

function securityEvent_(name,userId,username,success,metadata) {
  sheet_(ACC.SHEETS.SECURITY).appendRow([
    new Date(),Utilities.getUuid(),name,clean_(userId,80),clean_(username,80),Boolean(success),JSON.stringify(sanitize_(metadata))
  ]);
}

function ensure_() {
  const ss = spreadsheet_();
  ensureSheet_(ss,ACC.SHEETS.ACCOUNTS,ACC.ACCOUNT_HEADERS);
  ensureSheet_(ss,ACC.SHEETS.SESSIONS,ACC.SESSION_HEADERS);
  ensureSheet_(ss,ACC.SHEETS.SECURITY,ACC.SECURITY_HEADERS);
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(ACC.PROP_SHEET_ID);
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('SPREADSHEET_ID belum dikonfigurasi.');
  return active;
}

function sheet_(name) {
  const sh = spreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Sheet '+name+' belum tersedia.');
  return sh;
}

function ensureSheet_(ss,name,headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,headers.length).setFontWeight('bold');
}

function normalizeUsername_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDisplayName_(value) {
  return String(value || '').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g,'').replace(/\s+/g,' ').trim().substring(0,80);
}

function normalizeNameFingerprint_(value) {
  return normalizeDisplayName_(value).toLocaleLowerCase('id-ID').replace(/[^a-z0-9]/g,'');
}

function derivePassword_(password,salt) {
  let value = String(salt) + '|' + String(password);
  for (let i=0;i<ACC.HASH_ROUNDS;i++) value = sha256_(value + '|' + salt);
  return value;
}

function sha256_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8).map(function(b){
    const n=b<0?b+256:b; const h=n.toString(16); return h.length===1?'0'+h:h;
  }).join('');
}

function randomHex_(bytes) {
  return sha256_(Utilities.getUuid()+'|'+Utilities.getUuid()+'|'+new Date().getTime()).substring(0,bytes*2);
}

function safeEqual_(a,b) {
  a=String(a); b=String(b); if(a.length!==b.length) return false;
  let diff=0; for(let i=0;i<a.length;i++) diff |= a.charCodeAt(i)^b.charCodeAt(i); return diff===0;
}

function sanitize_(obj) {
  const out={}; if(!obj || typeof obj!=='object') return out;
  Object.keys(obj).slice(0,12).forEach(function(k){
    const v=obj[k]; if(typeof v==='string'||typeof v==='number'||typeof v==='boolean') out[clean_(k,60)]=v;
  }); return out;
}

function clean_(v,max) { return String(v==null?'':v).trim().substring(0,max); }
function parse_(raw) { try{return JSON.parse(raw);}catch(_){return null;} }
function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
