/* TA ASSESS | Account dashboard */
(function () {
  'use strict';
  const API = (typeof CONFIG !== 'undefined' && CONFIG.ACCOUNT_API) || '';
  const TOKEN_KEY = 'ta_assess_session';
  const USER_KEY = 'ta_assess_user';
  const $ = id => document.getElementById(id);

  function token() { return sessionStorage.getItem(TOKEN_KEY) || ''; }
  async function request(payload) {
    if (!API || !token()) throw new Error('Sesi akun belum tersedia.');
    const response = await fetch(API, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload) });
    const data = await response.json();
    if (!data || data.success !== true) throw new Error(data && data.error ? data.error : 'Permintaan gagal.');
    return data;
  }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function setMessage(text, type='') { const el=$('dashboardMessage'); if(el){el.textContent=text||'';el.className='dashboard-message '+type;} }

  function updateCompleteProfile(reports) {
    const ids = [...new Set((reports || []).map(r => String(r.assessmentId || '')))];
    if (window.TA_ACCOUNT_PROFILE && typeof window.TA_ACCOUNT_PROFILE.showIfComplete === 'function') {
      window.TA_ACCOUNT_PROFILE.showIfComplete(ids);
    }
    const hint = $('profileHint');
    if (hint) {
      const missing = ['PERSONALITY-01','CAREER-01','LEARNING-01'].filter(id => !ids.includes(id));
      hint.textContent = missing.length
        ? `Profil Lengkap akan terbuka setelah ${missing.length} jenis asesmen lagi selesai.`
        : 'Tiga jenis asesmen sudah lengkap. Profil Lengkap Anda tersedia.';
    }
  }

  async function loadReports() {
    if (!$('reportHistory')) return;
    try {
      const data = await request({action:'myReports', token:token()});
      const reports = data.reports || [];
      updateCompleteProfile(reports);
      $('reportCount').textContent = `${reports.length} laporan tersimpan`;
      if (!reports.length) {
        $('reportHistory').innerHTML = '<div class="empty-history">Belum ada hasil yang tersimpan. Setelah menyelesaikan asesmen dengan akun, hasil akan muncul di sini.</div>';
        return;
      }
      $('reportHistory').innerHTML = reports.map(r => `<article class="history-card"><div><strong>${escapeHtml(r.assessmentName)}</strong><div class="history-meta">${escapeHtml(r.timestamp)} · ${escapeHtml(r.answeredCount)}/${escapeHtml(r.totalQuestions)} soal · ID ${escapeHtml(r.reportId)}</div></div><button type="button" class="history-button" data-report="${escapeHtml(r.reportId)}">Lihat Hasil</button></article>`).join('');
      $('reportHistory').querySelectorAll('[data-report]').forEach(btn => btn.addEventListener('click', () => openReport(btn.dataset.report)));
    } catch (error) { setMessage(error.message, 'error'); }
  }

  async function openReport(reportId) {
    setMessage('Memuat hasil…', 'loading');
    try {
      const data = await request({action:'myReport', token:token(), reportId});
      sessionStorage.setItem('ta_assess_persisted_report', JSON.stringify(data.report));
      window.location.href = `account-results.html?id=${encodeURIComponent(reportId)}`;
    } catch (error) { setMessage(error.message, 'error'); }
  }

  function handleNextRedirect() {
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next) return;
    const loginForm = $('loginForm');
    if (!loginForm) return;
    loginForm.addEventListener('submit', () => {
      window.setTimeout(() => {
        const user = (() => { try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null');}catch(_){return null;} })();
        if (user) window.location.href = next;
      }, 900);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleNextRedirect();
    loadReports();
  });

  window.TA_ACCOUNT_DASHBOARD = { loadReports, openReport };
})();
