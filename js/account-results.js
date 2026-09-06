/* TA ASSESS — Persistent result viewer */
(function(){
  'use strict';
  const API=(typeof CONFIG!=='undefined'&&CONFIG.ACCOUNT_API)||'';
  const TOKEN_KEY='ta_assess_session';
  const $=id=>document.getElementById(id);
  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  async function load(){
    const id=new URLSearchParams(location.search).get('id');
    if(!API||!token()||!id){return fail('Sesi akun atau laporan tidak tersedia.');}
    try{
      const res=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'myReport',token:token(),reportId:id})});
      const data=await res.json(); if(!data.success) throw new Error(data.error||'Laporan tidak ditemukan.');
      render(data.report);
    }catch(e){fail(e.message);}
  }
  function fail(msg){$('message').innerHTML=`<div class="error">${esc(msg)}</div>`;}
  function render(r){
    $('result').hidden=false;$('title').textContent=r.assessmentName||'Hasil Asesmen';
    $('meta').textContent=`ID ${r.reportId} · ${r.timestamp} · ${r.answeredCount}/${r.totalQuestions} soal · Versi instrumen ${r.instrumentVersion||'-'}`;
    const profile=r.profile||{};
    $('scores').innerHTML=Object.entries(profile).map(([name,v])=>{const score=Number(v.meanScore);const pct=Number.isFinite(score)?Math.max(0,Math.min(100,score/5*100)):0;return `<div class="score-card"><strong>${esc(name)}</strong><div class="score">${Number.isFinite(score)?score.toFixed(2):'-'}</div><div>${esc(v.levelLabel||v.level||'Belum ditentukan')}</div><div class="bar"><div class="fill" style="width:${pct}%"></div></div></div>`;}).join('');
    const interp=r.interpretations||{};
    $('interpretations').innerHTML=Object.entries(interp).map(([name,v])=>`<article style="margin-bottom:18px"><h3>${esc(name)}</h3><p class="muted">${esc(v.interpretation||'Interpretasi belum tersedia.')}</p></article>`).join('');
    const i=r.integrity||{};
    $('integrity').innerHTML=`<p class="muted">Level: <strong>${esc(i.level||'normal')}</strong> · Sinyal: ${esc(i.suspiciousSignals||0)} · Perpindahan tab: ${esc(i.tabSwitches||0)} · Jawaban sangat cepat: ${esc(i.rapidAnswers||0)}</p>`;
  }
  document.addEventListener('DOMContentLoaded',load);
})();
