const crypto = require('crypto');

const UPSTREAM = 'https://script.google.com/macros/s/AKfycbybvP-FJvO1ruHoGjikM60Y99ofiu9YrWkIXgl410ua1sxt96sgt8tCXCRYzLy8bwEx/exec';
const ALLOWED = new Set([
  'assessment_session_issued', 'assessment_calibration_passed', 'assessment_calibration_failed',
  'camera_face_check_passed', 'camera_face_check_failed', 'camera_face_check_off_center',
  'camera_face_check_unavailable', 'camera_face_check_error', 'bot_risk_detected',
  'client_error', 'unhandled_rejection', 'resource_error', 'security_warning'
]);

function reply(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
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

function sanitize(value, max = 300) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TA-Assessment-Session');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return reply(res, 405, { success:false, error:'Method tidak didukung.' });

  const secret = process.env.TA_ASSESS_SERVER_SECRET || '';
  if (secret.length < 32) return reply(res, 503, { success:false, error:'Server security secret belum dikonfigurasi.' });

  const session = verifySession(req.headers['x-ta-assessment-session'], secret);
  if (!session) return reply(res, 403, { success:false, error:'Sesi asesmen tidak valid atau sudah berakhir.' });

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return null; } })() : req.body;
  const eventName = sanitize(body?.eventName, 80);
  if (!body || !ALLOWED.has(eventName)) return reply(res, 400, { success:false, error:'Event tidak didukung.' });
  if (String(body.assessmentId || '') !== String(session.assessmentId)) return reply(res, 403, { success:false, error:'Asesmen tidak cocok dengan sesi.' });

  const metadata = {};
  const input = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  Object.keys(input).slice(0, 12).forEach(key => {
    const k = sanitize(key, 60);
    const value = input[key];
    if (!k || value == null) return;
    if (typeof value === 'string') metadata[k] = sanitize(value, 240);
    else if (typeof value === 'number' && Number.isFinite(value)) metadata[k] = value;
    else if (typeof value === 'boolean') metadata[k] = value;
  });
  metadata.securitySessionId = session.sessionId;
  metadata.securityVersion = '1.1';

  try {
    const upstream = await fetch(UPSTREAM, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'logEvent',
        eventName,
        assessmentId:session.assessmentId,
        reportId:sanitize(body.reportId,120),
        source:'security-gateway',
        metadata
      }),
      redirect:'follow'
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { return reply(res, 502, { success:false, error:'Backend event mengembalikan respons tidak valid.' }); }
    return reply(res, upstream.ok ? 200 : 502, data);
  } catch (error) {
    console.error('[TA ASSESS] event gateway error:', error);
    return reply(res, 502, { success:false, error:'Gagal mengirim event keamanan.' });
  }
};
