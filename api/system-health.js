const MAIN_BACKEND = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
const QUESTION_BANK = 'https://script.google.com/macros/s/AKfycbyT0jepU01BljPXNgMyUaAkgQ5U-j8X5n_kjh3pCosMhOv6hUAUA6uKETaAn7OlXTK9/exec';

function safeError(error) {
  return String(error && error.message ? error.message : error || 'Unknown error').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 240);
}

async function probe(url) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    return { ok: response.ok && Boolean(data && data.success), httpStatus: response.status, latencyMs: Date.now() - started, data: data ? { success: data.success, service: data.service, version: data.version, submissionSecurity: data.submissionSecurity } : null };
  } catch (error) {
    return { ok: false, httpStatus: 0, latencyMs: Date.now() - started, error: safeError(error) };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method tidak didukung.' });

  const main = await probe(`${MAIN_BACKEND}?action=health`);
  const bank = await probe(`${QUESTION_BANK}?action=health`);
  const secretConfigured = Boolean(process.env.TA_ASSESS_SERVER_SECRET && process.env.TA_ASSESS_SERVER_SECRET.length >= 32);

  return res.status(200).json({
    success: true,
    service: 'TA Assess System Health',
    checkedAt: new Date().toISOString(),
    gateway: { serverSecretConfigured: secretConfigured },
    mainBackend: main,
    questionBank: bank,
    overall: main.ok && bank.ok && secretConfigured ? 'healthy' : 'degraded'
  });
};
