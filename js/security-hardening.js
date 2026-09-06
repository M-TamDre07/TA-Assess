/* TA ASSESS — layered browser-side integrity controls
 * These controls are signals and deterrents only. They are not proof of cheating.
 */
(function(){
  'use strict';
  const CHANNEL='ta-assess-integrity';
  const TAB_KEY='ta_assess_tab_id';
  let channel=null;
  let tabId=sessionStorage.getItem(TAB_KEY);
  if(!tabId){tabId=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());sessionStorage.setItem(TAB_KEY,tabId);}

  function active(){return typeof testState!=='undefined' && testState.startTime && !testState.submitted;}
  function signal(name,meta={}){if(typeof registerIntegritySignal==='function')registerIntegritySignal(name,meta);}

  function setup(){
    if(typeof BroadcastChannel==='function'){
      try{
        channel=new BroadcastChannel(CHANNEL);
        channel.onmessage=e=>{if(active()&&e.data&&e.data.tabId!==tabId&&e.data.assessmentId===testState.assessmentId){signal('parallel_tab_detected');showCalmMessage('Sesi asesmen terdeteksi terbuka pada tab lain. Sebaiknya gunakan satu tab agar hasil tetap konsisten.');}};
        if(active())channel.postMessage({tabId,assessmentId:testState.assessmentId});
      }catch(_){ }
    }

    document.addEventListener('copy',e=>{if(!active())return;e.preventDefault();signal('copy_blocked');});
    document.addEventListener('cut',e=>{if(!active())return;e.preventDefault();signal('cut_blocked');});
    document.addEventListener('contextmenu',e=>{if(!active())return;e.preventDefault();signal('context_menu_blocked');});
    document.addEventListener('dragstart',e=>{if(!active())return;e.preventDefault();signal('drag_blocked');});
    document.addEventListener('keydown',e=>{
      if(!active())return;
      const k=String(e.key||'').toLowerCase();
      const blocked=(e.ctrlKey&&['c','x','v','u','s','p'].includes(k)) || (e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(k)) || k==='f12';
      if(blocked){e.preventDefault();signal('restricted_shortcut',{key:k});}
    },true);

    window.addEventListener('blur',()=>{if(active())signal('window_blur');});
    window.addEventListener('focus',()=>{if(active())signal('window_focus_return');});
    document.addEventListener('fullscreenchange',()=>{if(active()&&!document.fullscreenElement)signal('fullscreen_exited');});
    window.addEventListener('pagehide',()=>{if(active())signal('page_hidden');});

    setInterval(()=>{
      if(active()&&channel)channel.postMessage({tabId,assessmentId:testState.assessmentId});
    },10000);
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,250));
})();
