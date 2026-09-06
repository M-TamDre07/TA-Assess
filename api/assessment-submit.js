const crypto = require('crypto');

const UPSTREAM = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
const RATE_WINDOW_MS = 5 * 60 * 1000;
const MAX_SUBMITS_PER_WINDOW = 8;
const submitBuckets = new Map();

function response(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}
function safe(value, max=240) { return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max); }
function requestKey(req) { return safe(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',120); }
function allowSubmit(req) {
  const now = Date.now();
  const key = requestKey(req);
  const previous = submitBuckets.get(key) || [];
  const recent = previous.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= MAX_SUBMITS_PER_WINDOW) { submitBuckets.set(key, recent); return false; }
  recent.push(now);
  submitBuckets.set(key, recent);
  if (submitBuckets.size > 5000) submitBuckets.clear();
  return true;
}
function verifySession(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sessionId || !data.assessmentId || Number(data.expiresAt) < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (_) { return null; }
}
function currentUaHash(req) {
  return crypto.createHash('sha256').update(safe(req.headers['user-agent'],300)).digest('hex').slice(0,32);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TA-Assessment-Session');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return response(res, 405, { success:false, error:'Method tidak didukung.' });

  const secret = process.env.TA_ASSESS_SERVER_SECRET || '';
  if (secret.length < 32) return response(res, 503, { success:false, error:'Server security secret belum dikonfigurasi.' });
  if (!allowSubmit(req)) return response(res, 429, { success:false, error:'Terlalu banyak pengiriman. Coba lagi setelah beberapa menit.' });

  const session = verifySession(req.headers['x-ta-assessment-session'], secret);
  if (!session) return response(res, 403, { success:false, error:'Sesi asesmen tidak valid atau sudah berakhir.' });
  if (session.uaHash && session.uaHash !== currentUaHash(req)) return response(res, 403, { success:false, error:'Sesi asesmen tidak cocok dengan perangkat browser saat sesi dibuat.' });

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return null; } })() : req.body;
  if (!body || body.action !== 'submitResult') return response(res, 400, { success:false, error:'Payload submission tidak valid.' });
  if (String(body.assessmentId || '') !== String(session.assessmentId)) return response(res, 403, { success:false, error:'Asesmen tidak cocok dengan sesi.' });

  const reportId = String(body.reportId || '').slice(0, 120);
  const issuedAt = String(body.timestamp || '').slice(0, 80);
  const assessmentId = String(body.assessmentId || '').slice(0, 120);
  if (!reportId || !issuedAt || !assessmentId) return response(res, 400, { success:false, error:'Data laporan tidak lengkap.' });

  const serverProof = crypto.createHmac('sha256', secret).update(`${reportId}|${issuedAt}|${assessmentId}|${session.sessionId}`).digest('hex');
  const forwarded = { ...body, serverProof, securitySessionId: session.sessionId, securityVersion:'1.2' };

  try {
    const upstream = await fetch(UPSTREAM, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(forwarded),
      redirect:'follow'
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { return response(res, 502, { success:false, error:'Backend hasil mengembalikan respons yang tidak valid.' }); }
    return response(res, upstream.ok ? 200 : 502, data);
  } catch (error) {
    console.error('[TA ASSESS] assessment submit proxy error:', error);
    return response(res, 502, { success:false, error:'Gagal menghubungi backend hasil.' });
  }
};
