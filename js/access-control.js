/* TA ASSESS | Access mode, account gate, and guest policy */
(function () {
  'use strict';

  const TOKEN_KEY = 'ta_assess_session';
  const USER_KEY = 'ta_assess_user';
  const GUEST_USED_KEY = 'ta_assess_guest_used';
  const CHOICE_KEY = 'ta_assess_access_choice';

  function getUser() {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; }
  }
  function getToken() { return sessionStorage.getItem(TOKEN_KEY) || ''; }
  function isLoggedIn() { return Boolean(getToken() && getUser()); }
  function guestUsed() { return sessionStorage.getItem(GUEST_USED_KEY) === '1'; }
  function setGuestUsed() { sessionStorage.setItem(GUEST_USED_KEY, '1'); }
  function clearGuestState() { sessionStorage.removeItem(GUEST_USED_KEY); }
  function accessChoice() { return sessionStorage.getItem(CHOICE_KEY) || ''; }
  function setAccessChoice(mode) { sessionStorage.setItem(CHOICE_KEY, mode); sessionStorage.setItem('ta_assess_access_mode', mode); }

  function accountUrl(next) {
    return `account.html${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  }

  function startAsGuest(assessmentId) {
    setAccessChoice('guest');
    if (!assessmentId) { closeGate(); return; }
    if (guestUsed()) {
      showGateMessage('Mode tamu pada sesi ini sudah digunakan. Untuk menyimpan beberapa hasil dan membuka riwayat lengkap, silakan masuk atau buat akun.');
      return;
    }
    sessionStorage.setItem('ta_assess_access_mode', 'guest');
    sessionStorage.setItem('ta_assess_guest_assessment', assessmentId);
    window.location.href = `test.html?id=${encodeURIComponent(assessmentId)}&mode=guest`;
  }

  function startAsAccount(assessmentId) {
    setAccessChoice('account');
    if (!isLoggedIn()) {
      window.location.href = accountUrl(assessmentId ? `test.html?id=${encodeURIComponent(assessmentId)}&mode=account` : 'index.html');
      return;
    }
    if (!assessmentId) { closeGate(); return; }
    sessionStorage.setItem('ta_assess_access_mode', 'account');
    window.location.href = `test.html?id=${encodeURIComponent(assessmentId)}&mode=account`;
  }

  function fillGate(assessmentId) {
    const modal = document.getElementById('accessGateModal');
    if (!modal) return;
    modal.dataset.assessmentId = assessmentId || '';
    const user = getUser();
    const logged = isLoggedIn();
    const accountBtn = document.getElementById('gateAccountButton');
    const accountText = document.getElementById('gateAccountText');
    const guestBtn = document.getElementById('gateGuestButton');
    const warning = document.getElementById('gateGuestWarning');
    const title = document.getElementById('accessGateTitle');

    if (title) title.textContent = assessmentId ? 'Sebelum memulai asesmen' : 'Pilih cara menggunakan TA Assess';
    if (accountBtn) accountBtn.textContent = logged ? 'Lanjut dengan Akun' : 'Masuk atau Buat Akun';
    if (accountText) accountText.textContent = logged ? `Akun aktif: ${user.displayName}` : 'Simpan riwayat hasil dan buka Profil Lengkap setelah tiga jenis asesmen selesai.';
    if (guestBtn) guestBtn.disabled = Boolean(assessmentId && guestUsed());
    if (warning) warning.textContent = assessmentId && guestUsed()
      ? 'Mode tamu sudah digunakan pada sesi browser ini. Masuk akun untuk melanjutkan asesmen berikutnya.'
      : 'Mode tamu memberikan satu hasil sementara. Unduh hasil sebelum meninggalkan sesi.';

    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function openGate(assessmentId) { fillGate(assessmentId); }
  function openWelcomeGate() {
    if (accessChoice()) return;
    fillGate('');
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
    document.getElementById('gateAccountButton')?.addEventListener('click', () => startAsAccount(modal.dataset.assessmentId || ''));
    document.getElementById('gateGuestButton')?.addEventListener('click', () => startAsGuest(modal.dataset.assessmentId || ''));
    modal.addEventListener('click', e => { if (e.target === modal) closeGate(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeGate(); });
    window.setTimeout(openWelcomeGate, 450);
  }

  window.TA_ACCESS = { getUser, getToken, isLoggedIn, guestUsed, setGuestUsed, clearGuestState, accessChoice, accountUrl, startAsGuest, startAsAccount, openGate, openWelcomeGate, closeGate };
  document.addEventListener('DOMContentLoaded', bind);
})();
