/* TA ASSESS | Layered browser integrity controls
 * These controls deter copying and signal suspicious conditions.
 * They are not proof of cheating and must not change the assessment score by themselves.
 */
(function(){
  'use strict';
  const CHANNEL='ta-assess-integrity';
  const TAB_KEY='ta_assess_tab_id';
  let channel=null;
  let tabId=sessionStorage.getItem(TAB_KEY);
  let overlay=null;
  let serverSessionToken='';
  const originalFetch=window.fetch.bind(window);
  if(!tabId){tabId=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());sessionStorage.setItem(TAB_KEY,tabId);}

  function active(){return typeof testState!=='undefined'&&testState.startTime&&!testState.submitted;}
  function signal(name,meta={}){if(typeof registerIntegritySignal==='function')registerIntegritySignal(name,meta);}
  async function sendGatewayEvent(eventName,metadata={}){
    if(!serverSessionToken||typeof CONFIG==='undefined'||!CONFIG.ASSESSMENT_EVENT_API)return;
    try{
      await originalFetch(CONFIG.ASSESSMENT_EVENT_API,{method:'POST',headers:{'Content-Type':'application/json','X-TA-Assessment-Session':serverSessionToken},body:JSON.stringify({eventName,assessmentId:typeof testState!=='undefined'?testState.assessmentId:'',reportId:typeof testState!=='undefined'?testState.reportId:'',metadata}) ,keepalive:true});
    }catch(_){ }
  }
  function ensureOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='taIntegrityOverlay';overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText='display:none;position:fixed;inset:0;z-index:9998;background:rgba(20,32,44,.96);color:#fff;align-items:center;justify-content:center;text-align:center;padding:28px;font:600 1rem/1.6 system-ui,sans-serif;';
    overlay.innerHTML='<div><div style="font-size:1.15rem;margin-bottom:8px">Sesi asesmen sedang dijeda</div><div>Halaman ini disembunyikan sementara karena jendela tidak sedang aktif. Kembali ke halaman asesmen untuk melanjutkan.</div></div>';
    document.body.appendChild(overlay);return overlay;
  }
  function setHidden(hidden){ensureOverlay().style.display=hidden?'flex':'none';}
  function shuffleQuestions(){
    if(typeof testState==='undefined'||!Array.isArray(testState.questions)||testState.questions.length<2)return;
    for(let i=testState.questions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[testState.questions[i],testState.questions[j]]=[testState.questions[j],testState.questions[i]];}
    testState.currentQuestion=0;
  }
  function requestFullscreen(){try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});}catch(_){} }
  function watermark(){
    const header=document.querySelector('.test-header');if(!header||header.querySelector('.ta-session-watermark'))return;
    const mark=document.createElement('div');mark.className='ta-session-watermark';mark.textContent=`Sesi ${tabId.slice(0,8)}`;mark.style.cssText='font-size:.72rem;opacity:.58;margin-top:8px;user-select:none;';header.appendChild(mark);
  }
  async function initServerSession(){
    if(typeof CONFIG==='undefined'||!CONFIG.ASSESSMENT_SECURITY_API||typeof testState==='undefined')return;
    const mode=sessionStorage.getItem('ta_assess_access_mode')||'guest';
    try{
      const url=`${CONFIG.ASSESSMENT_SECURITY_API}?assessmentId=${encodeURIComponent(testState.assessmentId)}&mode=${encodeURIComponent(mode)}`;
      const res=await originalFetch(url,{method:'GET',cache:'no-store'});
      const data=await res.json();
      if(data&&data.success&&data.token){
        serverSessionToken=data.token;
        window.__TA_ASSESS_SERVER_SESSION_TOKEN=serverSessionToken;
        signal('server_session_ready');
        sendGatewayEvent('assessment_session_issued',{mode,botRisk:data.botRisk||'unknown'});
      }else signal('server_session_unavailable');
    }catch(_){signal('server_session_unavailable');}
  }
  function installSubmitProxy(){
    if(window.__TA_ASSESS_FETCH_GUARD)return;
    window.__TA_ASSESS_FETCH_GUARD=true;
    window.fetch=async function(input,init){
      try{
        const target=typeof input==='string'?input:(input&&input.url)||'';
        const body=init&&typeof init.body==='string'?init.body:'';
        const mainApi=typeof CONFIG!=='undefined'?CONFIG.GOOGLE_SHEETS_API:'';
        const proxy=typeof CONFIG!=='undefined'?CONFIG.ASSESSMENT_SUBMIT_API:'';
        if(serverSessionToken&&mainApi&&proxy&&target===mainApi&&body){
          const parsed=JSON.parse(body);
          if(parsed&&parsed.action==='submitResult'){
            signal('submission_routed_through_server');
            const nextInit={...(init||{}),method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8','X-TA-Assessment-Session':serverSessionToken},body};
            delete nextInit.mode;
            return originalFetch(proxy,nextInit);
          }
        }
      }catch(_){ }
      return originalFetch(input,init);
    };
  }

  function setup(){
    installSubmitProxy();
    initServerSession();
    if(typeof BroadcastChannel==='function'){
      try{
        channel=new BroadcastChannel(CHANNEL);
        channel.onmessage=e=>{if(active()&&e.data&&e.data.tabId!==tabId&&e.data.assessmentId===testState.assessmentId){signal('parallel_tab_detected');sendGatewayEvent('security_warning',{type:'parallel_tab'});showCalmMessage('Sesi asesmen terdeteksi terbuka pada tab lain. Sebaiknya gunakan satu tab agar hasil tetap konsisten.');}};
        if(active())channel.postMessage({tabId,assessmentId:testState.assessmentId});
      }catch(_){ }
    }

    document.addEventListener('copy',e=>{if(!active())return;e.preventDefault();signal('copy_blocked');});
    document.addEventListener('cut',e=>{if(!active())return;e.preventDefault();signal('cut_blocked');});
    document.addEventListener('paste',e=>{if(!active())return;e.preventDefault();signal('paste_blocked');});
    document.addEventListener('contextmenu',e=>{if(!active())return;e.preventDefault();signal('context_menu_blocked');});
    document.addEventListener('dragstart',e=>{if(!active())return;e.preventDefault();signal('drag_blocked');});
    document.addEventListener('selectstart',e=>{if(active()&&e.target&&!['TEXTAREA','INPUT'].includes(e.target.tagName))e.preventDefault();});
    document.addEventListener('keydown',e=>{
      if(!active())return;
      const k=String(e.key||'').toLowerCase();
      const blocked=(e.ctrlKey&&['c','x','v','u','s','p'].includes(k))||(e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(k))||k==='f12';
      if(blocked){e.preventDefault();signal('restricted_shortcut',{key:k});}
    },true);
    window.addEventListener('blur',()=>{if(active()){signal('window_blur');setHidden(true);}});
    window.addEventListener('focus',()=>{if(active()){signal('window_focus_return');setHidden(false);}});
    document.addEventListener('visibilitychange',()=>{if(!active())return;if(document.hidden){signal('visibility_hidden');setHidden(true);}else{signal('visibility_returned');setHidden(false);}});
    document.addEventListener('fullscreenchange',()=>{if(active()&&!document.fullscreenElement)signal('fullscreen_exited');});
    window.addEventListener('beforeprint',()=>{if(active()){signal('print_attempt');document.body.style.display='none';}});
    window.addEventListener('afterprint',()=>{document.body.style.display='';});
    window.addEventListener('pagehide',()=>{if(active())signal('page_hidden');});

    const originalStart=window.startTest;
    if(typeof originalStart==='function'&&!originalStart.__taGuardWrapped){
      const wrapped=function(){shuffleQuestions();requestFullscreen();const result=originalStart.apply(this,arguments);setTimeout(watermark,100);return result;};
      wrapped.__taGuardWrapped=true;window.startTest=wrapped;
    }
    setInterval(()=>{if(active()&&channel)channel.postMessage({tabId,assessmentId:testState.assessmentId});},10000);
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,250));
})();
