const crypto = require('crypto');

function json(res, status, data) {
  res.status(status).json(data);
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { success:false, error:'Method tidak didukung.' });

  const secret = process.env.TA_ASSESS_SERVER_SECRET || '';
  if (secret.length < 32) return json(res, 503, { success:false, error:'Server security secret belum dikonfigurasi.' });

  const assessmentId = String(req.query?.assessmentId || '').trim();
  const mode = String(req.query?.mode || 'guest').trim().toLowerCase();
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(assessmentId)) return json(res, 400, { success:false, error:'assessmentId tidak valid.' });
  if (!['guest','account'].includes(mode)) return json(res, 400, { success:false, error:'Mode akses tidak valid.' });

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 45 * 60;
  const sessionId = crypto.randomUUID();
  const payload = Buffer.from(JSON.stringify({ sessionId, assessmentId, mode, issuedAt, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  return json(res, 200, {
    success:true,
    securityVersion:'1.0',
    token:`${payload}.${signature}`,
    expiresAt:new Date(expiresAt * 1000).toISOString()
  });
};
