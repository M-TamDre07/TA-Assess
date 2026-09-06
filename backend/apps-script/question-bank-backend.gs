/**
 * TA ASSESS Question Bank Service
 *
 * Menyimpan bank soal di Google Sheets dan menyediakan panel editor berbasis
 * HTMLService untuk kontributor.
 *
 * Sheet yang dibuat otomatis:
 * Question Bank
 * Question Options
 * Assessment Catalog
 * Dimension Catalog
 * Scoring Rules
 * Question Change Log
 *
 * Script Property:
 * SPREADSHEET_ID
 * QUESTION_BANK_ADMIN_KEY
 *
 * QUESTION_BANK_ADMIN_KEY hanya dipakai untuk operasi tulis dari panel editor.
 * Jangan pernah menaruh nilai key di repository atau runtime-config.js.
 */

const QB = {
  VERSION: '1.0.0',
  PROP_SHEET_ID: 'SPREADSHEET_ID',
  PROP_ADMIN_KEY: 'QUESTION_BANK_ADMIN_KEY',
  SHEETS: {
    QUESTIONS: 'Question Bank',
    OPTIONS: 'Question Options',
    ASSESSMENTS: 'Assessment Catalog',
    DIMENSIONS: 'Dimension Catalog',
    SCORING: 'Scoring Rules',
    LOG: 'Question Change Log'
  },
  TYPES: ['likert','single_choice','multi_choice','binary','essay','yes_no'],
  STATUSES: ['DRAFT','PILOT','ACTIVE','ARCHIVED'],
  QUESTION_HEADERS: [
    'questionId','assessmentId','version','orderIndex','itemType','text',
    'dimension','required','reverse','pairId','pairRole','tagsJson',
    'optionsJson','scoringJson','status','author','notes','updatedAt'
  ],
  OPTION_HEADERS: ['questionId','optionId','label','value','scoreJson','orderIndex','active'],
  ASSESSMENT_HEADERS: [
    'assessmentId','name','category','description','status','version',
    'targetPopulation','estimatedMinutes','scaleJson','lastUpdated'
  ],
  DIMENSION_HEADERS: ['assessmentId','dimensionId','name','description','orderIndex','active'],
  SCORING_HEADERS: ['assessmentId','dimensionId','ruleType','configJson','version','active','updatedAt'],
  LOG_HEADERS: ['timestamp','eventId','action','questionId','assessmentId','actor','metadataJson']
};

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = String(p.action || 'editor');

  if (action === 'questions') {
    return json_(getQuestions_(clean_(p.assessmentId,120), p.version ? clean_(p.version,40) : ''));
  }
  if (action === 'catalog') {
    return json_(getCatalog_());
  }
  if (action === 'health') {
    return json_({success:true,service:'TA Assess Question Bank',version:QB.VERSION,timestamp:new Date().toISOString()});
  }

  return HtmlService.createHtmlOutputFromFile('question-bank')
    .setTitle('TA Assess Question Bank')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > 50000) return json_({success:false,error:'Payload tidak valid.'});
    const data = parse_(body);
    if (!data) return json_({success:false,error:'JSON tidak valid.'});
    return json_(handleWrite_(data));
  } catch (err) {
    console.error(err);
    return json_({success:false,error:'Terjadi kesalahan server.'});
  }
}

function getQuestions_(assessmentId, version) {
  if (!assessmentId) return {success:false,error:'assessmentId wajib diisi.'};
  const rows = readRows_(QB.SHEETS.QUESTIONS);
  const out = [];

  for (let i=1;i<rows.length;i++) {
    const r=rows[i];
    if (String(r[1]) !== assessmentId) continue;
    if (version && String(r[2]) !== version) continue;
    const status=String(r[14] || 'ACTIVE');
    if (['ACTIVE','PILOT','DEMO'].indexOf(status) === -1) continue;
    out.push({
      id:String(r[0]), assessmentId:String(r[1]), version:String(r[2]), order:Number(r[3])||0,
      type:String(r[4]), text:String(r[5]), dimension:String(r[6]),
      required:r[7] !== false && String(r[7]).toLowerCase() !== 'false',
      reverse:r[8] === true || String(r[8]).toLowerCase() === 'true',
      pairId:String(r[9]||''), pairRole:String(r[10]||''), tags:parseJson_(r[11],[]),
      options:parseJson_(r[12],[]), scoring:parseJson_(r[13],{})
    });
  }

  out.sort(function(a,b){return a.order-b.order;});
  return {success:true,service:'TA Assess Question Bank',version:QB.VERSION,assessmentId:assessmentId,questionVersion:version || (out[0] ? out[0].version : ''),count:out.length,questions:out};
}

function getCatalog_() {
  const assessments=readRows_(QB.SHEETS.ASSESSMENTS).slice(1).map(function(r){
    return {assessmentId:String(r[0]),name:String(r[1]),category:String(r[2]),description:String(r[3]),status:String(r[4]),version:String(r[5]),targetPopulation:String(r[6]),estimatedMinutes:Number(r[7])||null,scale:parseJson_(r[8],{})};
  }).filter(function(x){return x.assessmentId;});
  return {success:true,version:QB.VERSION,assessments:assessments};
}

function saveQuestionFromEditor(q, adminKey) {
  if (!authorizeWrite_(adminKey)) return {success:false,error:'Akses editor tidak sah.'};
  return upsertQuestion_(q);
}

function archiveQuestionFromEditor(questionId, adminKey) {
  if (!authorizeWrite_(adminKey)) return {success:false,error:'Akses editor tidak sah.'};
  return archiveQuestion_(questionId);
}

function listQuestionsForEditor(assessmentId) {
  const id=clean_(assessmentId||'',120);
  const rows=readRows_(QB.SHEETS.QUESTIONS);
  const questions=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    if(id && String(r[1])!==id) continue;
    questions.push({
      questionId:String(r[0]),assessmentId:String(r[1]),version:String(r[2]),order:Number(r[3])||0,
      itemType:String(r[4]),text:String(r[5]),dimension:String(r[6]),
      required:r[7]!==false && String(r[7]).toLowerCase()!=='false',
      reverse:r[8]===true || String(r[8]).toLowerCase()==='true',pairId:String(r[9]||''),
      pairRole:String(r[10]||''),tags:parseJson_(r[11],[]),options:parseJson_(r[12],[]),
      scoring:parseJson_(r[13],{}),status:String(r[14]||'DRAFT'),notes:String(r[16]||'')
    });
  }
  questions.sort(function(a,b){return a.order-b.order || a.questionId.localeCompare(b.questionId);});
  return {success:true,questions:questions};
}

function handleWrite_(d) {
  const action=String(d.action||'');
  if(!authorizeWrite_(d.adminKey)) return {success:false,error:'Akses editor tidak sah.'};
  if(action==='upsertQuestion') return upsertQuestion_(d.question||{});
  if(action==='deleteQuestion') return archiveQuestion_(d.questionId);
  if(action==='upsertAssessment') return upsertAssessment_(d.assessment||{});
  if(action==='seedDemoQuestions') return seedDemoQuestions_();
  if(action==='seedCatalog') return seedCatalog_();
  return {success:false,error:'Action tidak didukung.'};
}

function upsertQuestion_(q) {
  const normalized=normalizeQuestion_(q);
  if(!normalized.ok) return normalized;
  const sh=sheet_(QB.SHEETS.QUESTIONS);
  const rows=sh.getDataRange().getValues();
  let rowNumber=-1;
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===normalized.question.questionId){rowNumber=i+1;break;}
  const r=normalized.question;
  const values=[[r.questionId,r.assessmentId,r.version,r.orderIndex,r.itemType,r.text,r.dimension,r.required,r.reverse,r.pairId,r.pairRole,JSON.stringify(r.tags),JSON.stringify(r.options),JSON.stringify(r.scoring),r.status,r.author,r.notes,new Date()]];
  if(rowNumber===-1){sh.getRange(sh.getLastRow()+1,1,1,values[0].length).setValues(values);syncOptions_(r);logChange_('CREATE',r);}
  else{sh.getRange(rowNumber,1,1,values[0].length).setValues(values);syncOptions_(r);logChange_('UPDATE',r);}
  return {success:true,action:rowNumber===-1?'created':'updated',question:r};
}

function archiveQuestion_(questionId) {
  const id=clean_(questionId,120);
  if(!id) return {success:false,error:'questionId wajib diisi.'};
  const sh=sheet_(QB.SHEETS.QUESTIONS); const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===id){sh.getRange(i+1,15).setValue('ARCHIVED');logChange_('ARCHIVE',{questionId:id,assessmentId:String(rows[i][1])});return {success:true,questionId:id,status:'ARCHIVED'};}
  return {success:false,error:'Soal tidak ditemukan.'};
}

function normalizeQuestion_(q) {
  const itemType=clean_(q.itemType,40).toLowerCase();
  if(QB.TYPES.indexOf(itemType)===-1) return {success:false,error:'Jenis soal tidak didukung.'};
  const text=clean_(q.text,1000),assessmentId=clean_(q.assessmentId,120),questionId=clean_(q.questionId,120);
  if(!questionId||!assessmentId||!text) return {success:false,error:'questionId, assessmentId, dan text wajib diisi.'};
  const options=Array.isArray(q.options)?q.options.slice(0,20).map(function(o,i){return {id:clean_(o.id||('OPT-'+(i+1)),60),label:clean_(o.label,200),value:clean_(o.value==null?String(i+1):o.value,60),score:o.score&&typeof o.score==='object'?o.score:{}};}).filter(function(o){return o.label;}):[];
  if(['single_choice','multi_choice','binary','yes_no'].indexOf(itemType)!==-1&&options.length<2) return {success:false,error:'Soal pilihan harus memiliki minimal dua opsi.'};
  const tags=Array.isArray(q.tags)?q.tags.slice(0,12).map(function(x){return clean_(x,50);}).filter(Boolean):[];
  return {ok:true,question:{
    questionId:questionId,assessmentId:assessmentId,version:clean_(q.version||'1.0',40),orderIndex:Math.max(0,Number(q.orderIndex)||0),itemType:itemType,text:text,dimension:clean_(q.dimension||'',120),required:q.required!==false,reverse:Boolean(q.reverse),pairId:clean_(q.pairId||'',120),pairRole:clean_(q.pairRole||'',40),tags:tags,options:options,scoring:q.scoring&&typeof q.scoring==='object'?q.scoring:{},status:QB.STATUSES.indexOf(String(q.status||'DRAFT').toUpperCase())>=0?String(q.status||'DRAFT').toUpperCase():'DRAFT',author:clean_(q.author||'TA Assess Contributor',120),notes:clean_(q.notes||'',1000)
  }};
}

function upsertAssessment_(a) {
  const id=clean_(a.assessmentId,120),name=clean_(a.name,200);
  if(!id||!name) return {success:false,error:'assessmentId dan name wajib diisi.'};
  const row=[id,name,clean_(a.category||'',100),clean_(a.description||'',500),clean_(a.status||'DRAFT',30),clean_(a.version||'1.0',40),clean_(a.targetPopulation||'',120),Number(a.estimatedMinutes)||'',JSON.stringify(a.scale&&typeof a.scale==='object'?a.scale:{}),new Date()];
  const sh=sheet_(QB.SHEETS.ASSESSMENTS),rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===id){sh.getRange(i+1,1,1,row.length).setValues([row]);return {success:true,action:'updated',assessmentId:id};}
  sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]); return {success:true,action:'created',assessmentId:id};
}

function seedCatalog_() {
  const samples=[
    ['PERSONALITY-01','Big Five Personality','Personal Exploration','Eksplorasi kecenderungan lima dimensi kepribadian.','DEMO','0.2','Umum 13+',5,'{"min":1,"max":5,"labels":["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]}'],
    ['CAREER-01','Career Interest Exploration','Career Exploration','Eksplorasi minat aktivitas kerja berbasis RIASEC.','DEMO','0.2','SMA ke atas',5,'{"min":1,"max":5}'],
    ['LEARNING-01','Learning Preferences','Education','Eksplorasi preferensi strategi belajar.','PILOT','0.2','Pelajar',5,'{"min":1,"max":5}']
  ];
  samples.forEach(function(r){upsertAssessment_({assessmentId:r[0],name:r[1],category:r[2],description:r[3],status:r[4],version:r[5],targetPopulation:r[6],estimatedMinutes:r[7],scale:parseJson_(r[8],{})});});
  return {success:true,count:samples.length};
}

function seedDemoQuestions_() {
  const questions=[
    {questionId:'PERSONALITY-01-Q01',assessmentId:'PERSONALITY-01',orderIndex:1,itemType:'likert',text:'Saya banyak melakukan hal-hal kreatif dan imajinatif.',dimension:'Openness',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q02',assessmentId:'PERSONALITY-01',orderIndex:2,itemType:'likert',text:'Saya adalah orang yang terorganisir dan disiplin.',dimension:'Conscientiousness',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q03',assessmentId:'PERSONALITY-01',orderIndex:3,itemType:'likert',text:'Saya senang menghabiskan waktu bersama orang lain dan acara sosial.',dimension:'Extraversion',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q04',assessmentId:'PERSONALITY-01',orderIndex:4,itemType:'likert',text:'Saya peduli dan berempati terhadap perasaan orang lain.',dimension:'Agreeableness',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q05',assessmentId:'PERSONALITY-01',orderIndex:5,itemType:'likert',text:'Saya sering merasa cemas atau khawatir tentang berbagai hal.',dimension:'Neuroticism',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q06',assessmentId:'PERSONALITY-01',orderIndex:6,itemType:'likert',text:'Saya selalu mencari pengalaman dan hal baru.',dimension:'Openness',reverse:false,status:'DEMO',tags:['positive_keyed']},
    {questionId:'PERSONALITY-01-Q07',assessmentId:'PERSONALITY-01',orderIndex:7,itemType:'likert',text:'Saya sering menunda-nunda tugas atau pekerjaan.',dimension:'Conscientiousness',reverse:true,status:'DEMO',tags:['reverse_keyed']},
    {questionId:'PERSONALITY-01-Q08',assessmentId:'PERSONALITY-01',orderIndex:8,itemType:'likert',text:'Saya lebih suka berada di rumah daripada bergaul dengan banyak orang.',dimension:'Extraversion',reverse:true,status:'DEMO',tags:['reverse_keyed']},
    {questionId:'PERSONALITY-01-Q09',assessmentId:'PERSONALITY-01',orderIndex:9,itemType:'likert',text:'Saya tidak terlalu peduli dengan kebutuhan orang lain.',dimension:'Agreeableness',reverse:true,status:'DEMO',tags:['reverse_keyed']},
    {questionId:'PERSONALITY-01-Q10',assessmentId:'PERSONALITY-01',orderIndex:10,itemType:'likert',text:'Saya merasa diri saya stabil dan emosi terkontrol.',dimension:'Neuroticism',reverse:true,status:'DEMO',tags:['reverse_keyed']},
    {questionId:'CAREER-01-Q01',assessmentId:'CAREER-01',orderIndex:1,itemType:'likert',text:'Saya senang bekerja dengan tangan dan alat.',dimension:'Realistic',status:'DEMO',tags:['activity_preference']},
    {questionId:'CAREER-01-Q02',assessmentId:'CAREER-01',orderIndex:2,itemType:'likert',text:'Saya menyukai menganalisis data dan memecahkan masalah kompleks.',dimension:'Investigative',status:'DEMO',tags:['activity_preference']},
    {questionId:'CAREER-01-Q03',assessmentId:'CAREER-01',orderIndex:3,itemType:'likert',text:'Saya senang mengekspresikan diri melalui seni atau kreativitas.',dimension:'Artistic',status:'DEMO',tags:['activity_preference']},
    {questionId:'CAREER-01-Q04',assessmentId:'CAREER-01',orderIndex:4,itemType:'likert',text:'Saya senang membantu orang lain dan memberikan dukungan.',dimension:'Social',status:'DEMO',tags:['activity_preference']},
    {questionId:'CAREER-01-Q05',assessmentId:'CAREER-01',orderIndex:5,itemType:'likert',text:'Saya termotivasi oleh tantangan dan pencapaian target.',dimension:'Enterprising',status:'DEMO',tags:['activity_preference']},
    {questionId:'CAREER-01-Q06',assessmentId:'CAREER-01',orderIndex:6,itemType:'likert',text:'Saya menyukai bekerja dengan sistem, aturan, dan organisasi yang jelas.',dimension:'Conventional',status:'DEMO',tags:['activity_preference']},
    {questionId:'LEARNING-01-Q01',assessmentId:'LEARNING-01',orderIndex:1,itemType:'likert',text:'Saya lebih mudah memahami dengan melihat diagram atau gambar.',dimension:'Visual',status:'PILOT',tags:['preference']},
    {questionId:'LEARNING-01-Q02',assessmentId:'LEARNING-01',orderIndex:2,itemType:'likert',text:'Saya belajar lebih baik melalui diskusi dan mendengarkan penjelasan.',dimension:'Auditory',status:'PILOT',tags:['preference']},
    {questionId:'LEARNING-01-Q03',assessmentId:'LEARNING-01',orderIndex:3,itemType:'likert',text:'Saya suka membaca dan menulis untuk memahami konsep baru.',dimension:'Reading/Writing',status:'PILOT',tags:['preference']},
    {questionId:'LEARNING-01-Q04',assessmentId:'LEARNING-01',orderIndex:4,itemType:'likert',text:'Saya belajar paling baik dengan melakukan praktik langsung.',dimension:'Kinesthetic',status:'PILOT',tags:['preference']}
  ];
  let count=0;
  questions.forEach(function(q){const r=normalizeQuestion_(q);if(r.ok){upsertQuestion_(r.question);count++;}});
  return {success:true,count:count};
}

function syncOptions_(q) {
  const sh=sheet_(QB.SHEETS.OPTIONS), rows=sh.getDataRange().getValues();
  for(let i=rows.length-1;i>=1;i--) if(String(rows[i][0])===q.questionId) sh.deleteRow(i+1);
  if(!q.options.length) return;
  const values=q.options.map(function(o,i){return [q.questionId,o.id,o.label,o.value,JSON.stringify(o.score||{}),i+1,true];});
  sh.getRange(sh.getLastRow()+1,1,values.length,values[0].length).setValues(values);
}

function authorizeWrite_(key) {
  const expected=PropertiesService.getScriptProperties().getProperty(QB.PROP_ADMIN_KEY);
  if(!expected||!key) return false;
  return safeEqual_(String(key),String(expected));
}

function logChange_(action,q) {
  sheet_(QB.SHEETS.LOG).appendRow([new Date(),Utilities.getUuid(),action,clean_(q.questionId||'',120),clean_(q.assessmentId||'',120),getActor_(),JSON.stringify({version:q.version||'',status:q.status||''})]);
}
function getActor_(){try{return Session.getActiveUser().getEmail()||'webapp-user';}catch(_){return 'webapp-user';}}
function ensureWorkbook_(){const ss=spreadsheet_();ensureSheet_(ss,QB.SHEETS.QUESTIONS,QB.QUESTION_HEADERS);ensureSheet_(ss,QB.SHEETS.OPTIONS,QB.OPTION_HEADERS);ensureSheet_(ss,QB.SHEETS.ASSESSMENTS,QB.ASSESSMENT_HEADERS);ensureSheet_(ss,QB.SHEETS.DIMENSIONS,QB.DIMENSION_HEADERS);ensureSheet_(ss,QB.SHEETS.SCORING,QB.SCORING_HEADERS);ensureSheet_(ss,QB.SHEETS.LOG,QB.LOG_HEADERS);}
function spreadsheet_(){const id=PropertiesService.getScriptProperties().getProperty(QB.PROP_SHEET_ID);if(id)return SpreadsheetApp.openById(id);const active=SpreadsheetApp.getActiveSpreadsheet();if(!active)throw new Error('SPREADSHEET_ID belum dikonfigurasi.');return active;}
function sheet_(name){ensureWorkbook_();const sh=spreadsheet_().getSheetByName(name);if(!sh)throw new Error('Sheet '+name+' belum tersedia.');return sh;}
function readRows_(name){const sh=sheet_(name);return sh.getDataRange().getValues();}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold');}
function parse_(raw){try{return JSON.parse(raw);}catch(_){return null;}}
function parseJson_(value,fallback){try{return JSON.parse(String(value||''));}catch(_){return fallback;}}
function clean_(value,max){return String(value==null?'':value).trim().substring(0,max);}
function safeEqual_(a,b){a=String(a);b=String(b);if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
