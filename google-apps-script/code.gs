/**
 * TA ASSESS — Google Apps Script Backend v3
 * Multifungsi, server-side, dan tanpa menyimpan jawaban mentah.
 *
 * SHEETS OTOMATIS:
 * Results            -> 1 baris per laporan
 * Dimension Scores   -> 1 baris per dimensi
 * Verification      -> metadata publik untuk verifikasi
 * Events             -> audit/event log non-sensitif
 * Assessments        -> registry instrumen
 * Analytics          -> snapshot statistik
 * Config             -> konfigurasi dokumentasi
 *
 * SCRIPT PROPERTIES:
 * SPREADSHEET_ID       (opsional bila script bound ke Spreadsheet)
 * TA_VERIFY_SECRET     (disarankan; membuat signature HMAC-SHA256)
 * TA_SERVER_SHARED_SECRET (wajib untuk enforcement gateway submission)
 * TELEGRAM_BOT_TOKEN   (opsional)
 * TELEGRAM_CHAT_ID     (opsional)
 * TELEGRAM_ENABLED     (true/false; default false)
 */

const TA = {
  VERSION: '0.4.0',
  PROP_SHEET_ID: 'SPREADSHEET_ID',
  PROP_VERIFY_SECRET: 'TA_VERIFY_SECRET',
  PROP_SERVER_SHARED_SECRET: 'TA_SERVER_SHARED_SECRET',
  PROP_TG_TOKEN: 'TELEGRAM_BOT_TOKEN',
  PROP_TG_CHAT: 'TELEGRAM_CHAT_ID',
  PROP_TG_ENABLED: 'TELEGRAM_ENABLED',
  MAX_BODY: 100000,
  SHEETS: { RESULTS:'Results', DIMENSIONS:'Dimension Scores', VERIFY:'Verification', EVENTS:'Events', ASSESSMENTS:'Assessments', ANALYTICS:'Analytics', CONFIG:'Config' },
  RESULT_HEADERS: ['recordedAt','issuedAt','reportId','assessmentId','assessmentName','instrumentVersion','scoringVersion','reportVersion','appVersion','answeredCount','totalQuestions','completionRate','durationMs','avgResponseMs','profileMean','profileMedian','profileStdDev','profileMin','profileMax','profileRange','topDimension','topScore','status','signature'],
  DIMENSION_HEADERS: ['recordedAt','reportId','assessmentId','dimension','meanScore','normalizedScore','level','itemCount','expectedItemCount'],
  VERIFY_HEADERS: ['reportId','issuedAt','assessmentId','assessmentName','instrumentVersion','scoringVersion','reportVersion','status','signature','lastUpdated'],
  EVENT_HEADERS: ['timestamp','eventId','eventName','reportId','assessmentId','source','metadataJson'],
  ASSESSMENT_HEADERS: ['assessmentId','assessmentName','developmentStatus','validationStatus','instrumentVersion','scoringVersion','lastUpdated','active','notes'],
  ANALYTICS_HEADERS: ['generatedAt','totalResults','uniqueReports','demoReports','pilotReports','validReports','revokedReports','avgDurationMs','avgCompletionRate','avgProfileMean'],
  CONFIG_HEADERS: ['key','value','description'],
  STATUS: ['DEMO','PILOT','VALID','REVOKED']
};

function doPost(e) {
  const lock=LockService.getScriptLock();
  try {
    if(!lock.tryLock(10000))return response_({success:false,error:'Server sedang sibuk.'});
    const body=e&&e.postData&&e.postData.contents;
    if(!body)return response_({success:false,error:'Payload kosong.'});
    if(body.length>TA.MAX_BODY)return response_({success:false,error:'Payload terlalu besar.'});
    const data=parse_(body);
    if(!data)return response_({success:false,error:'Payload bukan JSON yang valid.'});
    ensureWorkbook_();
    const action=String(data.action||'submitResult');
    if(action==='submitResult'){
      const gate=requireServerProof_(data);
      if(!gate.ok)return response_(gate);
      return response_(submitResult_(data));
    }
    if(action==='logEvent')return response_(logEvent_(data));
    return response_({success:false,error:'Action tidak didukung.'});
  }catch(err){console.error(err);return response_({success:false,error:safeError_(err)});}
  finally{try{lock.releaseLock();}catch(_) {}}
}

function doGet(e){
  try{
    ensureWorkbook_();
    const p=e&&e.parameter?e.parameter:{};
    const action=String(p.action||'health');
    if(action==='health')return response_({success:true,service:'TA Assess Google Apps Script',version:TA.VERSION,timestamp:new Date().toISOString(),verificationMode:verificationMode_(),submissionSecurity:serverProofMode_(),sheets:sheetNames_()});
    if(action==='verify'){
      const reportId=clean_(p.reportId,120);
      if(!reportId)return response_({success:false,error:'reportId wajib diisi.'});
      return response_(verify_(reportId));
    }
    return response_({success:false,error:'Action GET tidak didukung.'});
  }catch(err){console.error(err);return response_({success:false,error:safeError_(err)});}
}

function requireServerProof_(data){
  const secret=PropertiesService.getScriptProperties().getProperty(TA.PROP_SERVER_SHARED_SECRET)||'';
  if(!secret)return {ok:false,success:false,error:'Submission gateway belum dikonfigurasi di backend.'};
  const sessionId=clean_(data.securitySessionId,160);
  const proof=clean_(data.serverProof,200);
  const reportId=clean_(data.reportId,120);
  const issuedAt=clean_(data.timestamp,80);
  const assessmentId=clean_(data.assessmentId,120);
  if(!sessionId||!proof||!reportId||!issuedAt||!assessmentId)return {ok:false,success:false,error:'Server proof submission tidak lengkap.'};
  const expected=bytesHex_(Utilities.computeHmacSha256Signature(reportId+'|'+issuedAt+'|'+assessmentId+'|'+sessionId,secret,Utilities.Charset.UTF_8));
  if(proof!==expected)return {ok:false,success:false,error:'Server proof tidak valid.'};
  return {ok:true};
}

function serverProofMode_(){
  return PropertiesService.getScriptProperties().getProperty(TA.PROP_SERVER_SHARED_SECRET)?'REQUIRED':'NOT_CONFIGURED';
}

function submitResult_(data){
  const v=validate_(data);if(!v.ok)return {success:false,error:v.error};
  const r=normalizeResult_(data);
  if(findVerifyRow_(r.reportId))return {success:false,error:'reportId sudah tercatat.',reportId:r.reportId};
  const s=sheets_(),now=new Date(),sig=signature_(r.reportId,r.issuedAt,r.assessmentId),stats=profileStats_(r.scores);
  s.results.appendRow([now,r.issuedAt,r.reportId,r.assessmentId,r.assessmentName,r.instrumentVersion,r.scoringVersion,r.reportVersion,r.appVersion,r.answeredCount,r.totalQuestions,r.completionRate,r.durationMs,r.avgResponseMs,stats.mean,stats.median,stats.stdDev,stats.min,stats.max,stats.range,stats.topDimension,stats.topScore,r.status,sig]);
  const rows=dimensionRows_(r,now);
  if(rows.length)s.dimensions.getRange(s.dimensions.getLastRow()+1,1,rows.length,TA.DIMENSION_HEADERS.length).setValues(rows);
  s.verify.appendRow([r.reportId,r.issuedAt,r.assessmentId,r.assessmentName,r.instrumentVersion,r.scoringVersion,r.reportVersion,r.status,sig,now]);
  updateRegistry_(r);updateAnalytics_();
  const insight=smartInsight_(r.assessmentId,r.assessmentName,r.scores);
  logEvent_({eventName:'assessment_submitted',reportId:r.reportId,assessmentId:r.assessmentId,source:'webapp',metadata:{answeredCount:r.answeredCount,totalQuestions:r.totalQuestions,completionRate:r.completionRate,durationMs:r.durationMs,securitySessionId:clean_(data.securitySessionId,160),securityVersion:clean_(data.securityVersion,20)}});
  sendTelegram_(r);
  return {success:true,reportId:r.reportId,status:r.status,verificationMode:verificationMode_(),submissionSecurity:serverProofMode_(),profileAnalytics:stats,smartInsight:insight};
}

function validate_(d){
  if(!d||typeof d!=='object')return {ok:false,error:'Payload tidak valid.'};
  const reportId=clean_(d.reportId,120),assessmentId=clean_(d.assessmentId,120);
  if(!reportId)return {ok:false,error:'reportId wajib diisi.'};
  if(!assessmentId)return {ok:false,error:'assessmentId wajib diisi.'};
  if(!/^[A-Za-z0-9._-]+$/.test(reportId))return {ok:false,error:'Format reportId tidak valid.'};
  if(!/^[A-Za-z0-9._/-]+$/.test(assessmentId))return {ok:false,error:'Format assessmentId tidak valid.'};
  if(!d.scores||typeof d.scores!=='object')return {ok:false,error:'scores wajib object.'};
  const keys=Object.keys(d.scores);
  if(!keys.length||keys.length>30)return {ok:false,error:'Jumlah dimensi tidak valid.'};
  for(let i=0;i<keys.length;i++){const n=Number(d.scores[keys[i]]);if(!isFinite(n)||n<0||n>5)return {ok:false,error:'Semua meanScore harus berada pada 0–5.'};}
  const answered=Number(d.answersCount),total=Number(d.totalQuestions);
  if(!Number.isInteger(answered)||answered<0)return {ok:false,error:'answersCount tidak valid.'};
  if(!Number.isInteger(total)||total<=0)return {ok:false,error:'totalQuestions tidak valid.'};
  if(answered>total)return {ok:false,error:'answersCount melebihi totalQuestions.'};
  const status=String(d.status||'DEMO').toUpperCase();
  if(TA.STATUS.indexOf(status)===-1)return {ok:false,error:'Status tidak didukung.'};
  return {ok:true};
}

function normalizeResult_(d){
  const answered=Number(d.answersCount),total=Number(d.totalQuestions),duration=duration_(d.duration),itemCounts=normalizeCounts_(d.dimensionStats);
  return {reportId:clean_(d.reportId,120),assessmentId:clean_(d.assessmentId,120),assessmentName:clean_(d.assessmentName||'TA Assess',200),issuedAt:iso_(d.timestamp),instrumentVersion:clean_(d.instrumentVersion||'unknown',40),scoringVersion:clean_(d.scoringVersion||'unknown',40),reportVersion:clean_(d.reportVersion||'0.1',40),appVersion:clean_(d.appVersion||TA.VERSION,40),answeredCount:answered,totalQuestions:total,completionRate:round_((answered/total)*100,2),durationMs:duration,avgResponseMs:(duration!==null&&answered>0)?Math.round(duration/answered):null,status:String(d.status||'DEMO').toUpperCase(),scores:normalizeScores_(d.scores),itemCounts:itemCounts};
}
function normalizeScores_(scores){const out={};Object.keys(scores).sort().forEach(function(k){const key=clean_(k,100);if(key)out[key]=round_(Number(scores[k]),4);});return out;}
function normalizeCounts_(stats){const out={};if(!stats||typeof stats!=='object')return out;Object.keys(stats).slice(0,30).forEach(function(k){if(!stats[k]||typeof stats[k]!=='object')return;out[clean_(k,100)]={itemCount:isFinite(Number(stats[k].itemCount))?Number(stats[k].itemCount):null,expectedItemCount:isFinite(Number(stats[k].expectedItemCount))?Number(stats[k].expectedItemCount):null};});return out;}

function profileStats_(scores){
  const entries=Object.keys(scores).map(function(k){return {dimension:k,score:Number(scores[k])};}).filter(function(x){return isFinite(x.score);});
  if(!entries.length)return {mean:null,median:null,stdDev:null,min:null,max:null,range:null,topDimension:null,topScore:null};
  const values=entries.map(function(x){return x.score;}),sorted=values.slice().sort(function(a,b){return a-b;}),mean=avg_(values),median=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2,variance=values.reduce(function(s,v){return s+Math.pow(v-mean,2);},0)/values.length,top=entries.slice().sort(function(a,b){return b.score-a.score;})[0];
  return {mean:round_(mean,4),median:round_(median,4),stdDev:round_(Math.sqrt(variance),4),min:round_(Math.min.apply(null,values),4),max:round_(Math.max.apply(null,values),4),range:round_(Math.max.apply(null,values)-Math.min.apply(null,values),4),topDimension:top.dimension,topScore:round_(top.score,4)};
}
function dimensionRows_(r,now){return Object.keys(r.scores).map(function(dimension){const mean=Number(r.scores[dimension]),stat=r.itemCounts[dimension]||{};return [now,r.reportId,r.assessmentId,dimension,round_(mean,4),normalize100_(mean,1,5),level_(mean),stat.itemCount!=null?stat.itemCount:'',stat.expectedItemCount!=null?stat.expectedItemCount:''];});}
function normalize100_(score,min,max){if(!isFinite(Number(score))||max===min)return null;const n=Math.max(min,Math.min(max,Number(score)));return round_(((n-min)/(max-min))*100,1);}
function level_(score){const n=Number(score);if(!isFinite(n))return 'Belum dapat ditentukan';if(n<=2.5)return 'Rendah';if(n<=3.4)return 'Sedang';return 'Tinggi';}
function avg_(a){return a.length?a.reduce(function(s,v){return s+v;},0)/a.length:null;}

function smartInsight_(assessmentId,assessmentName,scores){
  const stats=profileStats_(scores);
  if(!stats.topDimension)return {type:'rule-based',summary:'Belum ada skor yang dapat diringkas.',highlights:[],reflections:[],disclaimer:'Smart Insight adalah analisis berbasis aturan, bukan diagnosis atau interpretasi profesional.'};
  const ranked=Object.keys(scores).map(function(k){return {dimension:k,score:Number(scores[k])};}).sort(function(a,b){return b.score-a.score;}),top=ranked.slice(0,Math.min(3,ranked.length)),bottom=ranked.slice(-Math.min(2,ranked.length)).reverse();
  const highlights=['Dimensi dengan skor relatif lebih tinggi: '+top.map(function(x){return x.dimension+' ('+x.score.toFixed(2)+')';}).join(', ')+'.','Rentang skor antar-dimensi: '+stats.range.toFixed(2)+' poin.'];
  if(ranked.length>=2&&Math.abs(ranked[0].score-ranked[1].score)<0.25)highlights.push('Dua skor teratas relatif berdekatan; tidak tampak satu dimensi yang jauh mendominasi profil ini.');
  return {type:'rule-based',assessmentId:assessmentId,assessmentName:assessmentName,summary:'Ringkasan otomatis menunjukkan kecenderungan relatif dalam profil. Gunakan sebagai bahan eksplorasi, bukan kesimpulan mutlak.',highlights:highlights,reflections:['Aktivitas apa yang paling menarik bagi Anda ketika menggunakan area '+top[0].dimension+'?','Apa yang ingin Anda eksplorasi lebih lanjut pada area '+bottom[0].dimension+'?'],disclaimer:'Smart Insight dibuat dari skor yang dikirim aplikasi. Ini bukan model AI klinis, bukan diagnosis, dan tidak menentukan keputusan pendidikan atau karier.'};
}

function verify_(reportId){
  const row=findVerifyRow_(reportId);if(!row)return {success:true,found:false,status:'NOT_FOUND',reportId:reportId};
  const valid=verifySignature_(row.reportId,row.issuedAt,row.assessmentId,row.signature);
  return {success:true,found:true,status:valid?row.status:'INTEGRITY_ERROR',reportId:row.reportId,issuedAt:row.issuedAt,assessmentId:row.assessmentId,assessmentName:row.assessmentName,instrumentVersion:row.instrumentVersion,scoringVersion:row.scoringVersion,reportVersion:row.reportVersion,signatureValid:valid,verificationMode:verificationMode_()};
}
function findVerifyRow_(reportId){
  const values=sheets_().verify.getDataRange().getValues();
  for(let i=1;i<values.length;i++)if(String(values[i][0])===String(reportId))return {reportId:String(values[i][0]),issuedAt:isoFromCell_(values[i][1]),assessmentId:String(values[i][2]),assessmentName:String(values[i][3]),instrumentVersion:String(values[i][4]),scoringVersion:String(values[i][5]),reportVersion:String(values[i][6]),status:String(values[i][7]),signature:String(values[i][8]),lastUpdated:isoFromCell_(values[i][9])};
  return null;
}
function signature_(reportId,issuedAt,assessmentId){const secret=PropertiesService.getScriptProperties().getProperty(TA.PROP_VERIFY_SECRET),message=reportId+'|'+issuedAt+'|'+assessmentId;if(!secret)return 'DEMO-'+sha256_(message+'|DEMO');return 'HMAC-SHA256-'+bytesHex_(Utilities.computeHmacSha256Signature(message,secret,Utilities.Charset.UTF_8));}
function verifySignature_(reportId,issuedAt,assessmentId,stored){if(!stored)return false;return signature_(reportId,issuedAt,assessmentId)===stored;}
function verificationMode_(){return PropertiesService.getScriptProperties().getProperty(TA.PROP_VERIFY_SECRET)?'BACKEND-SIGNED':'DEMO-CHECKSUM';}

function updateRegistry_(r){
  const sh=sheets_().assessments,values=sh.getDataRange().getValues();let row=-1;
  for(let i=1;i<values.length;i++)if(String(values[i][0])===r.assessmentId){row=i+1;break;}
  if(row<0)sh.appendRow([r.assessmentId,r.assessmentName,r.status,'Not validated',r.instrumentVersion,r.scoringVersion,new Date(),true,'Registry otomatis dari submission.']);
  else sh.getRange(row,2,1,6).setValues([[r.assessmentName,values[row-1][2],values[row-1][3],r.instrumentVersion,r.scoringVersion,new Date()]]);
}
function updateAnalytics_(){
  const data=sheets_().results.getDataRange().getValues();let total=0,demo=0,pilot=0,valid=0,revoked=0,durSum=0,durN=0,compSum=0,meanSum=0,meanN=0;const unique={};
  for(let i=1;i<data.length;i++){const row=data[i];if(!row[2])continue;total++;unique[String(row[2])]=true;const status=String(row[22]||'').toUpperCase();if(status==='DEMO')demo++;if(status==='PILOT')pilot++;if(status==='VALID')valid++;if(status==='REVOKED')revoked++;const dur=Number(row[12]);if(isFinite(dur)){durSum+=dur;durN++;}const comp=Number(row[11]);if(isFinite(comp))compSum+=comp;const mean=Number(row[14]);if(isFinite(mean)){meanSum+=mean;meanN++;}}
  const a=sheets_().analytics,old=Math.max(a.getLastRow()-1,0);if(old)a.getRange(2,1,old,TA.ANALYTICS_HEADERS.length).clearContent();a.getRange(2,1,1,TA.ANALYTICS_HEADERS.length).setValues([[new Date(),total,Object.keys(unique).length,demo,pilot,valid,revoked,durN?Math.round(durSum/durN):null,total?round_(compSum/total,2):null,meanN?round_(meanSum/meanN,4):null]]);
}
function logEvent_(data){const name=clean_(data.eventName,100);if(!name)return {success:false,error:'eventName wajib diisi.'};const metadata=sanitizeMetadata_(data.metadata);sheets_().events.appendRow([new Date(),Utilities.getUuid(),name,clean_(data.reportId,120),clean_(data.assessmentId,120),clean_(data.source||'webapp',40),JSON.stringify(metadata)]);return {success:true};}
function sendTelegram_(r){const p=PropertiesService.getScriptProperties(),enabled=String(p.getProperty(TA.PROP_TG_ENABLED)||'false').toLowerCase()==='true',token=p.getProperty(TA.PROP_TG_TOKEN),chat=p.getProperty(TA.PROP_TG_CHAT);if(!enabled||!token||!chat)return;const text=['TA Assess — Submission Baru','Report ID: '+r.reportId,'Assessment: '+r.assessmentName,'Status: '+r.status,'Waktu: '+r.issuedAt].join('\n');try{UrlFetchApp.fetch('https://api.telegram.org/bot'+encodeURIComponent(token)+'/sendMessage',{method:'post',payload:{chat_id:chat,text:text},muteHttpExceptions:true});}catch(err){console.warn('[TA ASSESS] Telegram notification failed:',err);}}

function setupTAAssess(){ensureWorkbook_();seedConfig_();seedAssessments_();updateAnalytics_();return {success:true,version:TA.VERSION,sheets:sheetNames_(),submissionSecurity:serverProofMode_()};}
function ensureWorkbook_(){const ss=spreadsheet_();ensureSheet_(ss,TA.SHEETS.RESULTS,TA.RESULT_HEADERS);ensureSheet_(ss,TA.SHEETS.DIMENSIONS,TA.DIMENSION_HEADERS);ensureSheet_(ss,TA.SHEETS.VERIFY,TA.VERIFY_HEADERS);ensureSheet_(ss,TA.SHEETS.EVENTS,TA.EVENT_HEADERS);ensureSheet_(ss,TA.SHEETS.ASSESSMENTS,TA.ASSESSMENT_HEADERS);ensureSheet_(ss,TA.SHEETS.ANALYTICS,TA.ANALYTICS_HEADERS);ensureSheet_(ss,TA.SHEETS.CONFIG,TA.CONFIG_HEADERS);}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold');try{const filter=sh.getFilter();if(!filter&&sh.getLastColumn()>0)sh.getRange(1,1,Math.max(sh.getLastRow(),2),sh.getLastColumn()).createFilter();}catch(_){}try{sh.autoResizeColumns(1,headers.length);}catch(_) {}}
function sheets_(){const ss=spreadsheet_();return {results:ss.getSheetByName(TA.SHEETS.RESULTS),dimensions:ss.getSheetByName(TA.SHEETS.DIMENSIONS),verify:ss.getSheetByName(TA.SHEETS.VERIFY),events:ss.getSheetByName(TA.SHEETS.EVENTS),assessments:ss.getSheetByName(TA.SHEETS.ASSESSMENTS),analytics:ss.getSheetByName(TA.SHEETS.ANALYTICS),config:ss.getSheetByName(TA.SHEETS.CONFIG)};}
function spreadsheet_(){const props=PropertiesService.getScriptProperties(),id=props.getProperty(TA.PROP_SHEET_ID);if(id)return SpreadsheetApp.openById(id);const active=SpreadsheetApp.getActiveSpreadsheet();if(!active)throw new Error('Spreadsheet tidak ditemukan. Bind script ke Spreadsheet atau set Script Property SPREADSHEET_ID.');return active;}
function sheetNames_(){return spreadsheet_().getSheets().map(function(sh){return sh.getName();});}
function seedConfig_(){const sh=sheets_().config;if(sh.getLastRow()>1)return;sh.getRange(2,1,8,3).setValues([['APP_VERSION',TA.VERSION,'Versi backend TA Assess.'],['VERIFICATION_MODE',verificationMode_(),'BACKEND-SIGNED jika TA_VERIFY_SECRET tersedia.'],['SUBMISSION_SECURITY',serverProofMode_(),'REQUIRED jika TA_SERVER_SHARED_SECRET tersedia.'],['RAW_ANSWERS_STORAGE','DISABLED','Jawaban mentah tidak disimpan.'],['PUBLIC_VERIFY_FIELDS','reportId,issuedAt,assessmentId,assessmentName,versions,status','Field minimum endpoint verify.'],['SPREADSHEET_ID','(Script Property)','ID spreadsheet bila script tidak bound.'],['TA_VERIFY_SECRET','(Script Property)','Secret untuk HMAC-SHA256 signature.'],['TA_SERVER_SHARED_SECRET','(Script Property)','Secret bersama gateway submission.']]);}
function seedAssessments_(){const sh=sheets_().assessments;if(sh.getLastRow()>1)return;sh.getRange(2,1,3,TA.ASSESSMENT_HEADERS.length).setValues([['PERSONALITY-01','Big Five Personality — Demo','DEMO','Not validated','0.1','0.1',new Date(),true,'Adaptasi non-resmi untuk eksplorasi diri.'],['CAREER-01','Career Interest Exploration — Demo','DEMO','Not validated','0.1','0.1',new Date(),true,'Adaptasi non-resmi untuk eksplorasi awal.'],['LEARNING-01','Learning Preferences — Demo','PILOT','Not validated','0.1','0.1',new Date(),true,'Adaptasi non-resmi untuk refleksi strategi belajar.']]);}
function sanitizeMetadata_(obj){if(!obj||typeof obj!=='object')return {};const out={};Object.keys(obj).slice(0,20).forEach(function(k){const v=obj[k];if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')out[clean_(k,80)]=v;});return out;}
function clean_(v,max){if(v===null||v===undefined)return '';return String(v).trim().substring(0,max);}
function duration_(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return isFinite(n)&&n>=0&&n<=86400000?Math.round(n):null;}
function iso_(v){if(!v)return new Date().toISOString();const d=new Date(v);return isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function isoFromCell_(v){if(!v)return '';if(Object.prototype.toString.call(v)==='[object Date]'&&!isNaN(v.getTime()))return v.toISOString();const d=new Date(v);return isNaN(d.getTime())?String(v):d.toISOString();}
function round_(n,d){if(!isFinite(Number(n)))return null;const f=Math.pow(10,d||0);return Math.round(Number(n)*f)/f;}
function parse_(raw){try{return JSON.parse(raw);}catch(_){return null;}}
function safeError_(e){return e&&e.message?clean_(e.message,500):'Terjadi kesalahan server.';}
function response_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sha256_(text){return bytesHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8));}
function bytesHex_(bytes){return bytes.map(function(b){const n=b<0?b+256:b,h=n.toString(16);return h.length===1?'0'+h:h;}).join('');}
function revokeReport(reportId,reason){const lock=LockService.getScriptLock();lock.waitLock(10000);try{const sh=sheets_().verify,values=sh.getDataRange().getValues();for(let i=1;i<values.length;i++)if(String(values[i][0])===String(reportId)){sh.getRange(i+1,8).setValue('REVOKED');sh.getRange(i+1,10).setValue(new Date());logEvent_({eventName:'report_revoked',reportId:reportId,assessmentId:String(values[i][2]||''),source:'admin',metadata:{reason:clean_(reason||'Tidak disebutkan',300)}});updateAnalytics_();return {success:true,reportId:reportId,status:'REVOKED'};}return {success:false,error:'reportId tidak ditemukan.'};}finally{lock.releaseLock();}}
