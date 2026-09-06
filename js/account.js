/* TA ASSESS — Account UI client */
(function () {
  'use strict';

  const API = (typeof CONFIG !== 'undefined' && CONFIG.ACCOUNT_API) || '';
  const TOKEN_KEY = 'ta_assess_session';
  const USER_KEY = 'ta_assess_user';

  const $ = (id) => document.getElementById(id);

  function setMessage(text, type) {
    const el = $('accountMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'account-message ' + (type || '');
  }

  function apiReady() {
    if (API) return true;
    setMessage('Backend akun belum dikonfigurasi. Tambahkan URL Web App Account API ke js/runtime-config.js setelah account.gs dideploy.', 'warning');
    return false;
  }

  async function request(payload) {
    if (!apiReady()) throw new Error('Account API belum dikonfigurasi.');
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data || data.success !== true) throw new Error(data && data.error ? data.error : 'Permintaan gagal.');
    return data;
  }

  function normalizeNameInput(value) {
    return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  function showUser(user) {
    const box = $('loggedInBox');
    const name = $('loggedInName');
    if (!box || !name) return;
    name.textContent = user.displayName;
    box.hidden = false;
    $('authForms').hidden = true;
  }

  function showForms() {
    if ($('loggedInBox')) $('loggedInBox').hidden = true;
    if ($('authForms')) $('authForms').hidden = false;
  }

  function saveSession(data) {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    showUser(data.user);
  }

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  async function restoreSession() {
    const t = token();
    if (!t || !API) return;
    try {
      const data = await request({ action: 'me', token: t });
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showUser(data.user);
    } catch (_) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  }

  $('displayName')?.addEventListener('input', function () {
    const normalized = normalizeNameInput(this.value);
    const hint = $('nameHint');
    if (hint && normalized !== this.value.trim()) {
      hint.textContent = 'Saran penulisan: ' + normalized;
    } else if (hint) {
      hint.textContent = 'Nama akan dinormalisasi untuk mengurangi spasi ganda/karakter tidak perlu.';
    }
  });

  $('registerForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const displayName = normalizeNameInput($('displayName').value);
    const username = $('registerUsername').value.trim().toLowerCase();
    const password = $('registerPassword').value;
    const confirm = $('registerPasswordConfirm').value;

    if (password !== confirm) return setMessage('Konfirmasi password tidak sama.', 'error');
    if (!displayName) return setMessage('Nama wajib diisi.', 'error');

    setMessage('Membuat akun…', 'loading');
    try {
      const data = await request({ action: 'register', displayName, username, password });
      setMessage('Akun berhasil dibuat. Silakan login.', 'success');
      $('loginUsername').value = username;
      $('registerForm').reset();
    } catch (error) {
      setMessage(error.message, 'error');
    }
  });

  $('loginForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = $('loginUsername').value.trim().toLowerCase();
    const password = $('loginPassword').value;
    setMessage('Memeriksa akun…', 'loading');
    try {
      const data = await request({ action: 'login', username, password });
      saveSession(data);
      $('loginForm').reset();
      setMessage('Login berhasil.', 'success');
    } catch (error) {
      setMessage(error.message, 'error');
    }
  });

  $('logoutButton')?.addEventListener('click', async function () {
    const t = token();
    try { if (t && API) await request({ action: 'logout', token: t }); } catch (_) {}
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    showForms();
    setMessage('Anda sudah logout.', 'success');
  });

  restoreSession();
})();
