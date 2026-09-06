/* TA ASSESS — post-submission access policy */
(function(){
  'use strict';
  const API=(typeof CONFIG!=='undefined'&&CONFIG.ACCOUNT_API)||'';
  const TOKEN_KEY='ta_assess_session';
  const MODE_KEY='ta_assess_access_mode';
  const GUEST_USED_KEY='ta_assess_guest_used';
  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}
  function mode(){return sessionStorage.getItem(MODE_KEY)||'guest';}
  function guest(){return mode()==='guest'||!token();}
  function persistResult(result){
    if(guest()){sessionStorage.setItem(GUEST_USED_KEY,'1');return;}
    if(!API||!token()||!result)return;
    fetch(API,{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'linkReport',token:token(),report:{reportId:result.reportId,assessmentId:result.assessmentId,assessmentName:result.assessmentName,timestamp:result.timestamp,durationMs:result.durationMs,answeredCount:result.answeredCount,totalQuestions:result.totalQuestions,instrumentVersion:result.instrumentVersion,scoringVersion:result.scoringVersion,reportVersion:result.reportVersion,questionVersion:result.questionVersion,profile:result.profile,interpretations:result.interpretations,integrity:result.integrity}})}).catch(error=>console.warn('[TA ASSESS] Gagal menyimpan riwayat akun:',error));
  }
  document.addEventListener('DOMContentLoaded',function(){
    if(typeof TA_ASSESS==='undefined'||typeof TA_ASSESS.saveToSessionStorage!=='function')return;
    const original=TA_ASSESS.saveToSessionStorage;
    TA_ASSESS.saveToSessionStorage=function(key,value){original.call(TA_ASSESS,key,value);if(key==='assessmentResult')persistResult(value);};
  });
})();
