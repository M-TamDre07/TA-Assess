/* TA ASSESS | Complete profile from the three persisted assessment types */
(function(){
  'use strict';
  const API=(typeof CONFIG!=='undefined'&&CONFIG.ACCOUNT_API)||'';
  const TOKEN_KEY='ta_assess_session';
  const $=id=>document.getElementById(id);
  const IDS={personality:'PERSONALITY-01',career:'CAREER-01',learning:'LEARNING-01'};

  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function fail(message){if($('message'))$('message').innerHTML=`<div class="error">${esc(message)}</div>`;}
  async function request(payload){
    if(!API||!token())throw new Error('Sesi akun belum tersedia. Silakan masuk kembali.');
    const response=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const data=await response.json();
    if(!data||!data.success)throw new Error(data&&data.error?data.error:'Permintaan gagal.');
    return data;
  }
  function scoreCards(target,profile){
    const box=$(target); if(!box)return;
    const entries=Object.entries(profile||{});
    box.innerHTML=entries.length?entries.map(([name,v])=>{
      const score=Number(v&&v.meanScore);
      const pct=Number.isFinite(score)?Math.max(0,Math.min(100,score/5*100)):0;
      return `<article class="profile-item"><strong>${esc(name)}</strong><div class="profile-score">${Number.isFinite(score)?score.toFixed(2):'Belum tersedia'}</div><div>${esc(v&&v.levelLabel||v&&v.level||'Belum ditentukan')}</div><div class="profile-bar"><div class="profile-fill" style="width:${pct}%"></div></div></article>`;
    }).join(''):'<p class="muted">Belum ada data untuk bagian ini.</p>';
  }
  function reflectionBlock(reports){
    const top=[];
    reports.forEach(r=>Object.entries(r.profile||{}).forEach(([name,v])=>{
      const score=Number(v&&v.meanScore); if(Number.isFinite(score))top.push({assessment:r.assessmentId,name,score});
    }));
    top.sort((a,b)=>b.score-a.score);
    const unique=[]; const seen=new Set();
    top.forEach(x=>{const key=x.assessment+'|'+x.name;if(!seen.has(key)){seen.add(key);unique.push(x);}});
    $('reflection').innerHTML=`<p class="muted">Profil ini dibentuk dari tiga hasil yang tersimpan. Dimensi yang relatif menonjol dapat menjadi bahan untuk memilih aktivitas yang ingin Anda eksplorasi lebih lanjut.</p><ul>${unique.slice(0,5).map(x=>`<li>${esc(x.name)} pada ${esc(labelAssessment(x.assessment))}: <strong>${x.score.toFixed(2)}</strong></li>`).join('')}</ul>`;
  }
  function labelAssessment(id){return id===IDS.personality?'kepribadian':id===IDS.career?'minat karier':id===IDS.learning?'preferensi belajar':id;}

  async function load(){
    try{
      const data=await request({action:'myReports',token:token()});
      const summaries=data.reports||[];
      const byId={}; summaries.forEach(r=>{if(!byId[r.assessmentId])byId[r.assessmentId]=r;});
      const missing=Object.values(IDS).filter(id=>!byId[id]);
      if(missing.length){throw new Error('Profil lengkap baru tersedia setelah ketiga jenis asesmen selesai. Masih ada '+missing.length+' asesmen yang belum tersimpan.');}
      const reports=[];
      for(const id of Object.values(IDS)){
        const full=await request({action:'myReport',token:token(),reportId:byId[id].reportId});
        reports.push(full.report);
      }
      const person=reports.find(r=>r.assessmentId===IDS.personality);
      const career=reports.find(r=>r.assessmentId===IDS.career);
      const learning=reports.find(r=>r.assessmentId===IDS.learning);
      scoreCards('personalityScores',person&&person.profile);
      scoreCards('careerScores',career&&career.profile);
      scoreCards('learningScores',learning&&learning.profile);
      reflectionBlock(reports);
      $('profileMeta').textContent=`Tiga hasil tersimpan berhasil digabungkan. Pembaruan terakhir: ${new Date().toLocaleString('id-ID')}.`;
      $('profileContent').hidden=false;
    }catch(e){fail(e.message);}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
