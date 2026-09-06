/* TA ASSESS — Access mode, account gate, and guest policy */
(function () {
  'use strict';

  const TOKEN_KEY = 'ta_assess_session';
  const USER_KEY = 'ta_assess_user';
  const GUEST_USED_KEY = 'ta_assess_guest_used';

  function getUser() {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; }
  }
  function getToken() { return sessionStorage.getItem(TOKEN_KEY) || ''; }
  function isLoggedIn() { return Boolean(getToken() && getUser()); }
  function guestUsed() { return sessionStorage.getItem(GUEST_USED_KEY) === '1'; }
  function setGuestUsed() { sessionStorage.setItem(GUEST_USED_KEY, '1'); }
  function clearGuestState() { sessionStorage.removeItem(GUEST_USED_KEY); }

  function accountUrl(next) {
    return `account.html${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  }

  function startAsGuest(assessmentId) {
    if (guestUsed()) {
      showGateMessage('Mode tamu pada sesi ini sudah digunakan. Untuk menyimpan beberapa hasil dan membuka riwayat lengkap, silakan masuk atau buat akun.');
      return;
    }
    sessionStorage.setItem('ta_assess_access_mode', 'guest');
    sessionStorage.setItem('ta_assess_guest_assessment', assessmentId);
    window.location.href = `test.html?id=${encodeURIComponent(assessmentId)}&mode=guest`;
  }

  function startAsAccount(assessmentId) {
    if (!isLoggedIn()) {
      window.location.href = accountUrl(`test.html?id=${encodeURIComponent(assessmentId)}&mode=account`);
      return;
    }
    sessionStorage.setItem('ta_assess_access_mode', 'account');
    window.location.href = `test.html?id=${encodeURIComponent(assessmentId)}&mode=account`;
  }

  function openGate(assessmentId) {
    const modal = document.getElementById('accessGateModal');
    if (!modal) return startAsGuest(assessmentId);
    modal.dataset.assessmentId = assessmentId;
    const user = getUser();
    const logged = isLoggedIn();
    const accountBtn = document.getElementById('gateAccountButton');
    const accountText = document.getElementById('gateAccountText');
    const guestBtn = document.getElementById('gateGuestButton');
    const warning = document.getElementById('gateGuestWarning');

    if (accountBtn) accountBtn.textContent = logged ? 'Mulai dengan Akun' : 'Masuk atau Buat Akun';
    if (accountText) accountText.textContent = logged ? `Akun aktif: ${user.displayName}` : 'Simpan riwayat hasil dan akses hasil kembali kapan saja.';
    if (guestBtn) guestBtn.disabled = guestUsed();
    if (warning) warning.textContent = guestUsed()
      ? 'Mode tamu sudah digunakan pada sesi browser ini. Masuk akun untuk melanjutkan asesmen berikutnya.'
      : 'Mode tamu hanya memberikan satu hasil dalam satu sesi browser. Hasil tamu tidak menjadi riwayat akun.';

    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeGate() {
    const modal = document.getElementById('accessGateModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function showGateMessage(message) {
    const el = document.getElementById('gateGuestWarning');
    if (el) el.textContent = message;
    const modal = document.getElementById('accessGateModal');
    if (modal) modal.hidden = false;
  }

  function bind() {
    const modal = document.getElementById('accessGateModal');
    if (!modal) return;
    document.getElementById('gateClose')?.addEventListener('click', closeGate);
    document.getElementById('gateAccountButton')?.addEventListener('click', () => {
      const id = modal.dataset.assessmentId;
      if (id) startAsAccount(id);
    });
    document.getElementById('gateGuestButton')?.addEventListener('click', () => {
      const id = modal.dataset.assessmentId;
      if (!id) return;
      closeGate();
      startAsGuest(id);
    });
    modal.addEventListener('click', e => { if (e.target === modal) closeGate(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeGate();
    });
  }

  window.TA_ACCESS = { getUser, getToken, isLoggedIn, guestUsed, setGuestUsed, clearGuestState, accountUrl, startAsGuest, startAsAccount, openGate, closeGate };
  document.addEventListener('DOMContentLoaded', bind);
})();
