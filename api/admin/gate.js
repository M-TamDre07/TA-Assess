const crypto = require('crypto');

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_SECONDS = 15 * 60;
const buckets = new Map();

function clean(value, max = 160) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function reply(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}

function requestKey(req) {
  return clean(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown', 120);
}

function allow(req) {
  const now = Date.now();
  const key = requestKey(req);
  const current = (buckets.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (current.length >= MAX_ATTEMPTS) {
    buckets.set(key, current);
    return false;
  }
  current.push(now);
  buckets.set(key, current);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return reply(res, 405, { success: false, error: 'Method tidak didukung.' });

  const adminPassword = process.env.TA_ADMIN_PASSWORD || '';
  const serverSecret = process.env.TA_ASSESS_SERVER_SECRET || '';
  if (adminPassword.length < 10 || serverSecret.length < 32) {
    return reply(res, 503, { success: false, error: 'Proteksi admin belum dikonfigurasi di server.' });
  }
  if (!allow(req)) return reply(res, 429, { success: false, error: 'Terlalu banyak percobaan admin. Coba lagi beberapa menit.' });

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return null; } })() : req.body;
  const password = body && typeof body === 'object' && !Array.isArray(body) ? String(body.password || '') : '';
  if (!password || password.length > 128) return reply(res, 400, { success: false, error: 'Password admin tidak valid.' });

  const supplied = crypto.createHash('sha256').update(password).digest();
  const expected = crypto.createHash('sha256').update(adminPassword).digest();
  if (!crypto.timingSafeEqual(supplied, expected)) return reply(res, 403, { success: false, error: 'Password admin salah.' });

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ scope: 'admin-ui', issuedAt: now, expiresAt: now + TOKEN_TTL_SECONDS })).toString('base64url');
  return reply(res, 200, {
    success: true,
    token: `${payload}.${sign(payload, serverSecret)}`,
    expiresAt: new Date((now + TOKEN_TTL_SECONDS) * 1000).toISOString()
  });
};
