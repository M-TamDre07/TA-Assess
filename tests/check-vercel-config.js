// TA Assess — Vercel configuration validation
// Run: node tests/check-vercel-config.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
} catch (error) {
  console.error('VERCEL CONFIG CHECK FAILED: vercel.json tidak valid:', error.message);
  process.exitCode = 1;
  return;
}

assert(Array.isArray(config.rewrites), 'vercel.json harus memiliki rewrites[].');
assert(Array.isArray(config.headers), 'vercel.json harus memiliki headers[].');

const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
const requiredRewrites = [
  ['/admin', '/pages/admin.html'],
  ['/admin-dashboard', '/pages/admin-dashboard.html'],
  ['/account', '/pages/account.html'],
  ['/account-results', '/pages/account-results.html'],
  ['/account-insights', '/pages/account-insights.html'],
  ['/docs', '/pages/docs.html'],
  ['/result', '/pages/result.html'],
  ['/test', '/pages/test.html'],
  ['/verify', '/pages/verify.html'],
  ['/api/question-bank', '/api/data/question-bank'],
  ['/api/assessment-session', '/api/assessment/session'],
  ['/api/assessment-submit', '/api/assessment/submit'],
  ['/api/assessment-event', '/api/assessment/event'],
  ['/api/system-health', '/api/system/health']
];

for (const [source, destination] of requiredRewrites) {
  assert(rewrites.some(r => r && r.source === source && r.destination === destination), `Rewrite salah/hilang: ${source} -> ${destination}`);
}

for (const rewrite of rewrites) {
  if (!rewrite || typeof rewrite !== 'object') {
    assert(false, 'Setiap rewrite harus berupa object.');
    continue;
  }
  const destination = String(rewrite.destination || '');
  assert(Boolean(rewrite.source), 'Rewrite source kosong.');
  assert(Boolean(destination), `Rewrite destination kosong untuk ${rewrite.source || '(unknown)'}.`);
  if (destination.startsWith('/pages/')) assert(exists(destination.slice(1)), `Destination page tidak ada: ${destination}`);
  if (destination.startsWith('/api/')) assert(exists(`${destination.slice(1)}.js`) || exists(destination.slice(1)), `Destination API tidak ada: ${destination}`);
}

const securityHeaderBlock = (config.headers || []).find(h => h && h.source === '/(.*)');
assert(Boolean(securityHeaderBlock), 'Security header block /(.*) tidak ditemukan.');
const headerMap = new Map(((securityHeaderBlock && securityHeaderBlock.headers) || []).map(h => [h.key, h.value]));
for (const key of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
  assert(headerMap.has(key), `Security header ${key} belum dikonfigurasi.`);
}
assert(String(headerMap.get('X-Content-Type-Options') || '').toLowerCase() === 'nosniff', 'X-Content-Type-Options harus nosniff.');
assert(String(headerMap.get('X-Frame-Options') || '').toUpperCase() === 'DENY', 'X-Frame-Options harus DENY.');
assert(String(headerMap.get('Permissions-Policy') || '').includes('camera=(self)'), 'Kamera asesmen harus diizinkan untuk origin sendiri.');
assert(!JSON.stringify(config).includes('TA_ASSESS_SERVER_SECRET='), 'Secret tidak boleh ditaruh di vercel.json.');

if (errors.length) {
  console.error(`VERCEL CONFIG CHECK FAILED: ${errors.length} error(s)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('VERCEL CONFIG CHECK PASSED: rewrites, destinations, and security headers are consistent.');
  process.exitCode = 0;
}
