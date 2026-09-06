/* TA ASSESS | Client diagnostics
 * Captures technical failures only. Do not collect answers or camera frames here.
 */
(function(){
  'use strict';
  const sent=new Set();
  function clean(v,n=240){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);}
  function send(eventName,metadata){
    if(sent.size>80)return;
    const key=eventName+'|'+clean(metadata&&metadata.message,120);
    if(sent.has(key))return;sent.add(key);
    const token=window.__TA_ASSESS_SERVER_SESSION_TOKEN;
    const cfg=window.CONFIG;
    if(!token||!cfg||!cfg.ASSESSMENT_EVENT_API)return;
    const body=JSON.stringify({eventName,assessmentId:typeof testState!=='undefined'?testState.assessmentId:'',metadata:{
      message:clean(metadata&&metadata.message),source:clean(metadata&&metadata.source,80),line:Number(metadata&&metadata.line)||0,column:Number(metadata&&metadata.column)||0,type:clean(metadata&&metadata.type,80)
    }});
    try{fetch(cfg.ASSESSMENT_EVENT_API,{method:'POST',headers:{'Content-Type':'application/json','X-TA-Assessment-Session':token},body,keepalive:true}).catch(()=>{});}catch(_){ }
  }
  window.addEventListener('error',function(e){
    if(e.target&&e.target!==window){send('resource_error',{source:e.target.tagName+' '+clean(e.target.src||e.target.href,160),type:'resource'});return;}
    send('client_error',{message:e.message,source:e.filename,line:e.lineno,column:e.colno,type:'runtime'});
  },true);
  window.addEventListener('unhandledrejection',function(e){
    const reason=e.reason&&e.reason.message?e.reason.message:String(e.reason||'Unhandled rejection');
    send('unhandled_rejection',{message:reason,type:'promise'});
  });
  window.TA_DIAGNOSTICS={report:function(message,type){send('client_error',{message,type:type||'manual'});}};
})();
