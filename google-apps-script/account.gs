/**
 * TA ASSESS — Account, User Results & Admin API
 * Google Apps Script Web App.
 *
 * Required Script Property: SPREADSHEET_ID
 *
 * One-time bootstrap for administrator:
 *   Run promoteUserToAdmin('username') manually from the Apps Script editor.
 *
 * Assessment answers are never stored here; only report summaries are persisted.
 */
const ACC={
 VERSION:'2.0.0',PROP_SHEET_ID:'SPREADSHEET_ID',SHEETS:{ACCOUNTS:'Accounts',SESSIONS:'Sessions',SECURITY:'Security Events',REPORTS:'User Reports'},
 ACCOUNT_HEADERS:['userId','username','usernameNormalized','displayName','displayNameNormalized','passwordSalt','passwordHash','createdAt','lastLoginAt','status','failedAttempts','lockUntil','sessionVersion','lastActivityAt','role'],
 SESSION_HEADERS:['tokenHash','userId','createdAt','expiresAt','revokedAt','lastUsedAt'],
 SECURITY_HEADERS:['timestamp','eventId','eventName','userId','usernameNormalized','success','metadataJson'],
 REPORT_HEADERS:['reportId','userId','assessmentId','assessmentName','timestamp','durationMs','answeredCount','totalQuestions','instrumentVersion','scoringVersion','reportVersion','questionVersion','profileJson','interpretationsJson','integrityJson','linkedAt'],
 SESSION_TTL_MS:24*60*60*1000,IDLE_TTL_MS:4*60*60*1000,LOCK_MS:15*60*1000,MAX_FAILED:5,HASH_ROUNDS:12000,MAX_BODY:60000,MAX_REPORTS_PER_USER:100
};

function doPost(e){
 const lock=LockService.getScriptLock();
 try{
  if(!lock.tryLock(10000))return out_({success:false,error:'Server sedang sibuk.'});
  const body=e&&e.postData&&e.postData.contents;if(!body||body.length>ACC.MAX_BODY)return out_({success:false,error:'Payload tidak valid.'});
  const data=parse_(body);if(!data)return out_({success:false,error:'JSON tidak valid.'});ensure_();
  const handlers={register:register_,login:login_,me:me_,logout:logout_,checkUsername:checkUsername_,normalizeName:normalizeName_,event:event_,linkReport:linkReport_,myReports:myReports_,myReport:myReport_,adminOverview:adminOverview_,adminList:adminList_,adminDeleteReport:adminDeleteReport_,adminDeleteUser:adminDeleteUser_,adminSetUserStatus:adminSetUserStatus_,adminRevokeSession:adminRevokeSession_};
  const action=String(data.action||'');if(!handlers[action])return out_({success:false,error:'Action tidak didukung.'});
  return out_(handlers[action](data));
 }catch(err){console.error(err);return out_({success:false,error:'Terjadi kesalahan server.'});}
 finally{try{lock.releaseLock();}catch(_) {}}
}

function doGet(e){try{ensure_();const p=e&&e.parameter?e.parameter:{};if(String(p.action||'health')==='health')return out_({success:true,service:'TA Assess Account API',version:ACC.VERSION,timestamp:new Date().toISOString()});return out_({success:false,error:'Action GET tidak didukung.'});}catch(_){return out_({success:false,error:'Terjadi kesalahan server.'});}}

function register_(d){
 const username=normalizeUsername_(d.username),displayName=normalizeDisplayName_(d.displayName),password=String(d.password||''),validation=validateCredentials_(username,displayName,password);if(!validation.ok)return validation;
 const sh=sheet_(ACC.SHEETS.ACCOUNTS),rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][2])===username)return {success:false,error:'Username sudah digunakan.'};
 const salt=randomHex_(16),hash=derivePassword_(password,salt),userId='USR-'+Utilities.getUuid().replace(/-/g,'').substring(0,16).toUpperCase(),now=new Date();
 sh.appendRow([userId,username,username,displayName,normalizeNameFingerprint_(displayName),salt,hash,now,'','ACTIVE',0,'',1,now,'USER']);
 securityEvent_('account_created',userId,username,true,{nameNormalized:true});return {success:true,user:{userId,displayName,username,role:'USER'}};
}

function login_(d){
 const username=normalizeUsername_(d.username),password=String(d.password||'');if(!username||!password)return {success:false,error:'Username dan password wajib diisi.'};
 const found=findAccount_(username);if(!found)return {success:false,error:'Username atau password salah.'};const row=found.row,sh=found.sheet,now=Date.now(),lockUntil=Date.parse(String(row[11]||''))||0;
 if(String(row[9]||'ACTIVE')!=='ACTIVE')return {success:false,error:'Akun tidak aktif.'};if(lockUntil>now)return {success:false,error:'Terlalu banyak percobaan. Coba lagi setelah beberapa menit.'};
 const expected=String(row[6]||''),actual=derivePassword_(password,String(row[5]||''));
 if(!safeEqual_(actual,expected)){const failures=Number(row[10]||0)+1,newLock=failures>=ACC.MAX_FAILED?new Date(now+ACC.LOCK_MS):'';sh.getRange(found.index,11).setValue(failures);sh.getRange(found.index,12).setValue(newLock);securityEvent_('login_failed',String(row[0]),username,false,{attempt:failures});return {success:false,error:'Username atau password salah.'};}
 sh.getRange(found.index,9).setValue(new Date());sh.getRange(found.index,11).setValue(0);sh.getRange(found.index,12).setValue('');sh.getRange(found.index,14).setValue(new Date());
 const token=randomHex_(32)+Utilities.getUuid().replace(/-/g,''),tokenHash=sha256_(token),expires=new Date(now+ACC.SESSION_TTL_MS);sheet_(ACC.SHEETS.SESSIONS).appendRow([tokenHash,String(row[0]),new Date(now),expires,'',new Date(now)]);securityEvent_('login_success',String(row[0]),username,true,{role:role_(row)});
 return {success:true,token,expiresAt:expires.toISOString(),user:{userId:String(row[0]),username,displayName:String(row[3]),role:role_(row)}};
}

function me_(d){const session=authenticate_(d.token);if(!session.ok)return session;touchSession_(session.sessionIndex);const account=findAccountById_(session.userId);if(!account)return {success:false,error:'Akun tidak ditemukan.'};return {success:true,user:publicUser_(account.row)};}
function logout_(d){const token=String(d.token||'');if(!token)return {success:true};const hash=sha256_(token),sh=sheet_(ACC.SHEETS.SESSIONS),rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][0])===hash&&!rows[i][4]){sh.getRange(i+1,5).setValue(new Date());securityEvent_('logout',String(rows[i][1]),'',true,{});break;}return {success:true};}
function checkUsername_(d){const username=normalizeUsername_(d.username);if(!username)return {success:false,error:'Username tidak valid.'};return {success:true,available:!findAccount_(username)};}
function normalizeName_(d){const input=String(d.displayName||'');if(!input.trim())return {success:false,error:'Nama wajib diisi.'};const normalized=normalizeDisplayName_(input),suggestions=[];if(normalized!==input.trim().replace(/\s+/g,' '))suggestions.push(normalized);return {success:true,input:input.trim(),normalized,suggestions};}

function event_(d){const session=authenticate_(d.token);if(!session.ok)return session;const name=clean_(d.eventName,80),allowed=['assessment_opened','assessment_started','assessment_paused','assessment_resumed','answer_changed','assessment_submitted','result_viewed','security_signal'];if(allowed.indexOf(name)===-1)return {success:false,error:'Event tidak diizinkan.'};securityEvent_(name,session.userId,'',true,sanitize_(d.metadata));touchSession_(session.sessionIndex);return {success:true};}

function linkReport_(d){
 const session=authenticate_(d.token);if(!session.ok)return session;const r=d.report;if(!r||!clean_(r.reportId,100)||!clean_(r.assessmentId,120))return {success:false,error:'Data laporan tidak lengkap.'};
 const userId=session.userId,sh=sheet_(ACC.SHEETS.REPORTS),rows=sh.getDataRange().getValues();
 for(let i=1;i<rows.length;i++)if(String(rows[i][0])===clean_(r.reportId,100)){if(String(rows[i][1])!==userId)return {success:false,error:'Laporan sudah terhubung ke akun lain.'};return {success:true,alreadyLinked:true,reportId:String(r.reportId)};}
 const userCount=rows.slice(1).filter(row=>String(row[1])===userId).length;if(userCount>=ACC.MAX_REPORTS_PER_USER)return {success:false,error:'Batas penyimpanan laporan akun tercapai.'};
 sh.appendRow([clean_(r.reportId,100),userId,clean_(r.assessmentId,120),clean_(r.assessmentName,200),clean_(r.timestamp,60),Number(r.durationMs)||0,Number(r.answeredCount)||0,Number(r.totalQuestions)||0,clean_(r.instrumentVersion,40),clean_(r.scoringVersion,40),clean_(r.reportVersion,40),clean_(r.questionVersion,40),safeJson_(r.profile,{}),safeJson_(r.interpretations,{}),safeJson_(r.integrity,{}),new Date()]);
 securityEvent_('report_linked',userId,'',true,{reportId:clean_(r.reportId,100),assessmentId:clean_(r.assessmentId,120)});return {success:true,reportId:String(r.reportId)};
}
function myReports_(d){const session=authenticate_(d.token);if(!session.ok)return session;const rows=readRows_(ACC.SHEETS.REPORTS),reports=[];for(let i=1;i<rows.length;i++)if(String(rows[i][1])===session.userId)reports.push(reportObject_(rows[i],false));reports.sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp)));return {success:true,reports};}
function myReport_(d){const session=authenticate_(d.token);if(!session.ok)return session;const id=clean_(d.reportId,100),rows=readRows_(ACC.SHEETS.REPORTS);for(let i=1;i<rows.length;i++)if(String(rows[i][0])===id&&String(rows[i][1])===session.userId)return {success:true,report:reportObject_(rows[i],true)};return {success:false,error:'Laporan tidak ditemukan pada akun ini.'};}

function adminOverview_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const ss=spreadsheet_(),names=['Accounts','Sessions','Security Events','User Reports','Results','Dimension Scores','Verification','Events','Assessments','Analytics','Config','Question Bank','Question Options','Assessment Catalog','Dimension Catalog','Scoring Rules','Question Change Log'],counts={};names.forEach(name=>{const sh=ss.getSheetByName(name);counts[name]=sh?Math.max(0,sh.getLastRow()-1):0;});return {success:true,version:ACC.VERSION,counts,timestamp:new Date().toISOString()};}
function adminList_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const allowed=['Accounts','User Reports','Results','Dimension Scores','Verification','Events','Security Events','Sessions'],sheetName=clean_(d.sheet,60);if(allowed.indexOf(sheetName)===-1)return {success:false,error:'Sheet admin tidak diizinkan.'};const sh=spreadsheet_().getSheetByName(sheetName);if(!sh)return {success:true,sheet:sheetName,headers:[],rows:[]};const values=sh.getDataRange().getDisplayValues(),limit=Math.min(200,Math.max(1,Number(d.limit)||50));return {success:true,sheet:sheetName,headers:values[0]||[],rows:values.slice(1).reverse().slice(0,limit)};}
function adminDeleteReport_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const reportId=clean_(d.reportId,100);if(!reportId)return {success:false,error:'Report ID wajib diisi.'};let removed=0;removed+=deleteByValue_('User Reports',0,reportId);removed+=deleteByValue_('Results',2,reportId);removed+=deleteByValue_('Dimension Scores',1,reportId);removed+=deleteByValue_('Verification',0,reportId);removed+=deleteByValue_('Events',3,reportId);securityEvent_('admin_delete_report',auth.userId,'',true,{reportId});return {success:true,reportId,removed};}
function adminDeleteUser_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const userId=clean_(d.userId,80);if(!userId||userId===auth.userId)return {success:false,error:'User ID tidak valid.'};const removedReports=deleteByValue_('User Reports',1,userId),removedSessions=deleteByValue_('Sessions',1,userId),removedAccount=deleteByValue_('Accounts',0,userId);securityEvent_('admin_delete_user',auth.userId,'',true,{userId,removedReports,removedSessions,removedAccount});return {success:true,userId,removedReports,removedSessions,removedAccount};}
function adminSetUserStatus_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const userId=clean_(d.userId,80),status=clean_(d.status,20).toUpperCase();if(['ACTIVE','SUSPENDED'].indexOf(status)<0||!userId||userId===auth.userId)return {success:false,error:'Status atau User ID tidak valid.'};const account=findAccountById_(userId);if(!account)return {success:false,error:'Akun tidak ditemukan.'};account.sheet.getRange(account.index,10).setValue(status);securityEvent_('admin_set_user_status',auth.userId,'',true,{userId,status});return {success:true,userId,status};}
function adminRevokeSession_(d){const auth=requireAdmin_(d.token);if(!auth.ok)return auth;const userId=clean_(d.userId,80);if(!userId||userId===auth.userId)return {success:false,error:'User ID tidak valid.'};const sh=sheet_(ACC.SHEETS.SESSIONS),rows=sh.getDataRange().getValues();let count=0;for(let i=1;i<rows.length;i++)if(String(rows[i][1])===userId&&!rows[i][4]){sh.getRange(i+1,5).setValue(new Date());count++;}securityEvent_('admin_revoke_sessions',auth.userId,'',true,{userId,count});return {success:true,userId,count};}
function requireAdmin_(token){const session=authenticate_(token);if(!session.ok)return session;const account=findAccountById_(session.userId);if(!account||role_(account.row)!=='ADMIN')return {success:false,error:'Akses admin ditolak.'};return {ok:true,userId:session.userId,sessionIndex:session.sessionIndex};}
function promoteUserToAdmin(username){const found=findAccount_(normalizeUsername_(username));if(!found)throw new Error('Username tidak ditemukan.');found.sheet.getRange(found.index,15).setValue('ADMIN');securityEvent_('admin_promoted',String(found.row[0]),String(found.row[1]),true,{manual:true});return 'OK: '+String(found.row[1])+' sekarang ADMIN.';}

function authenticate_(token){if(!token||String(token).length<40)return {success:false,error:'Sesi tidak valid.'};const hash=sha256_(String(token)),sh=sheet_(ACC.SHEETS.SESSIONS),rows=sh.getDataRange().getValues(),now=Date.now();for(let i=1;i<rows.length;i++){if(String(rows[i][0])!==hash)continue;const expires=Date.parse(String(rows[i][3]||''))||0,lastUsed=Date.parse(String(rows[i][5]||''))||Date.parse(String(rows[i][2]||''))||0;if(rows[i][4]||expires<=now||(lastUsed+ACC.IDLE_TTL_MS)<=now)return {success:false,error:'Sesi telah berakhir. Silakan login kembali.'};const account=findAccountById_(String(rows[i][1]));if(!account||String(account.row[9]||'ACTIVE')!=='ACTIVE')return {success:false,error:'Akun tidak aktif.'};return {ok:true,userId:String(rows[i][1]),sessionIndex:i+1};}return {success:false,error:'Sesi tidak valid.'};}
function touchSession_(index){sheet_(ACC.SHEETS.SESSIONS).getRange(index,6).setValue(new Date());}
function validateCredentials_(username,displayName,password){if(!/^[a-z0-9._-]{4,32}$/.test(username))return {success:false,error:'Username 4–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda minus.'};if(displayName.length<2||displayName.length>80)return {success:false,error:'Nama harus 2–80 karakter.'};if(password.length<10)return {success:false,error:'Password minimal 10 karakter.'};if(password.length>128)return {success:false,error:'Password terlalu panjang.'};if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return {success:false,error:'Password harus memiliki huruf dan angka.'};return {success:true};}
function findAccount_(username){const sh=sheet_(ACC.SHEETS.ACCOUNTS),rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][2])===username)return {row:rows[i],index:i+1,sheet:sh};return null;}
function findAccountById_(userId){const sh=sheet_(ACC.SHEETS.ACCOUNTS),rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][0])===userId)return {row:rows[i],index:i+1,sheet:sh};return null;}
function publicUser_(row){return {userId:String(row[0]),username:String(row[1]),displayName:String(row[3]),role:role_(row)};}
function role_(row){return String(row[14]||'USER').toUpperCase()==='ADMIN'?'ADMIN':'USER';}
function readRows_(name){return sheet_(name).getDataRange().getValues();}
function reportObject_(r,full){const out={reportId:String(r[0]),assessmentId:String(r[2]),assessmentName:String(r[3]),timestamp:String(r[4]),durationMs:Number(r[5])||0,answeredCount:Number(r[6])||0,totalQuestions:Number(r[7])||0,instrumentVersion:String(r[8]),scoringVersion:String(r[9]),reportVersion:String(r[10]),questionVersion:String(r[11])};if(full){out.profile=parseJson_(r[12],{});out.interpretations=parseJson_(r[13],{});out.integrity=parseJson_(r[14],{});}return out;}
function deleteByValue_(sheetName,columnIndex,value){const sh=spreadsheet_().getSheetByName(sheetName);if(!sh)return 0;const rows=sh.getDataRange().getValues();let count=0;for(let i=rows.length-1;i>=1;i--)if(String(rows[i][columnIndex])===String(value)){sh.deleteRow(i+1);count++;}return count;}
function securityEvent_(name,userId,username,success,metadata){sheet_(ACC.SHEETS.SECURITY).appendRow([new Date(),Utilities.getUuid(),name,clean_(userId,80),clean_(username,80),Boolean(success),JSON.stringify(sanitize_(metadata))]);}
function ensure_(){const ss=spreadsheet_();ensureSheet_(ss,ACC.SHEETS.ACCOUNTS,ACC.ACCOUNT_HEADERS);ensureSheet_(ss,ACC.SHEETS.SESSIONS,ACC.SESSION_HEADERS);ensureSheet_(ss,ACC.SHEETS.SECURITY,ACC.SECURITY_HEADERS);ensureSheet_(ss,ACC.SHEETS.REPORTS,ACC.REPORT_HEADERS);migrateAccountsHeader_(ss.getSheetByName(ACC.SHEETS.ACCOUNTS));}
function migrateAccountsHeader_(sh){const last=sh.getLastColumn();if(last<ACC.ACCOUNT_HEADERS.length)sh.getRange(1,last+1,1,ACC.ACCOUNT_HEADERS.length-last).setValues([ACC.ACCOUNT_HEADERS.slice(last)]);const values=sh.getDataRange().getValues();for(let i=1;i<values.length;i++)if(!values[i][14])sh.getRange(i+1,15).setValue('USER');}
function spreadsheet_(){const id=PropertiesService.getScriptProperties().getProperty(ACC.PROP_SHEET_ID);if(id)return SpreadsheetApp.openById(id);const active=SpreadsheetApp.getActiveSpreadsheet();if(!active)throw new Error('SPREADSHEET_ID belum dikonfigurasi.');return active;}
function sheet_(name){const sh=spreadsheet_().getSheetByName(name);if(!sh)throw new Error('Sheet '+name+' belum tersedia.');return sh;}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold');}
function normalizeUsername_(value){return String(value||'').trim().toLowerCase();}
function normalizeDisplayName_(value){return String(value||'').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g,'').replace(/\s+/g,' ').trim().substring(0,80);}
function normalizeNameFingerprint_(value){return normalizeDisplayName_(value).toLocaleLowerCase('id-ID').replace(/[^a-z0-9]/g,'');}
function derivePassword_(password,salt){let value=String(salt)+'|'+String(password);for(let i=0;i<ACC.HASH_ROUNDS;i++)value=sha256_(value+'|'+salt);return value;}
function sha256_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8).map(function(b){const n=b<0?b+256:b,h=n.toString(16);return h.length===1?'0'+h:h;}).join('');}
function randomHex_(bytes){return sha256_(Utilities.getUuid()+'|'+Utilities.getUuid()+'|'+new Date().getTime()).substring(0,bytes*2);}
function safeEqual_(a,b){a=String(a);b=String(b);if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function sanitize_(obj){const out={};if(!obj||typeof obj!=='object')return out;Object.keys(obj).slice(0,12).forEach(function(k){const v=obj[k];if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')out[clean_(k,60)]=v;});return out;}
function safeJson_(obj,fallback){try{return JSON.stringify(obj&&typeof obj==='object'?obj:fallback).substring(0,45000);}catch(_){return JSON.stringify(fallback);}}
function parseJson_(value,fallback){try{return JSON.parse(String(value||''));}catch(_){return fallback;}}
function clean_(v,max){return String(v==null?'':v).trim().substring(0,max);}
function parse_(raw){try{return JSON.parse(raw);}catch(_){return null;}}
function out_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
