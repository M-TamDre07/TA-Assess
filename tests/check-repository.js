// TA Assess — repository integrity checks
// Run: node tests/check-repository.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const requiredFiles = [
  'index.html', '404.html', 'favicon.svg', 'site.webmanifest', 'robots.txt',
  'pages/README.md', 'pages/account.html', 'pages/account-results.html',
  'pages/account-insights.html', 'pages/admin.html', 'pages/admin-dashboard.html',
  'pages/docs.html', 'pages/result.html', 'pages/test.html', 'pages/verify.html',
  'assets/docs-hero.svg', 'css/styles.css', 'js/runtime-config.js', 'js/script.js',
  'js/test-engine.js', 'js/result-engine.js', 'js/insight-engine.js',
  'js/recommendation-engine.js', 'js/assessment-calibration.js',
  'js/security-hardening.js', 'js/client-diagnostics.js', 'js/admin-dashboard.js',
  'api/README.md', 'api/assessment/session.js', 'api/assessment/submit.js',
  'api/assessment/event.js', 'api/data/question-bank.js', 'api/system/health.js',
  'tests/run-tests.js', 'tests/check-repository.js',
  'backend/apps-script/results-backend.gs', 'backend/apps-script/account-backend.gs',
  'backend/apps-script/question-bank-backend.gs', 'backend/apps-script/index.html',
  'backend/apps-script/maintenance.gs', 'backend/apps-script/personality-30-seed.gs',
  'backend/php/bootstrap.php', 'docs/README.md',
  'docs/assessment/ASSESSMENT-METHODOLOGY.md', 'docs/assessment/QUESTION-BANK.md',
  'docs/security/PRIVACY.md', 'docs/security/ACCOUNT-SECURITY.md',
  'docs/security/SECURITY.md', 'docs/security/SECURITY-DEPLOYMENT.md',
  'docs/development/CONTRIBUTING.md', 'docs/development/COMMUNITY.md',
  'docs/development/REPOSITORY-STRUCTURE.md', 'docs/deployment/SETUP.md',
  'docs/deployment/SEO-DEPLOYMENT.md', 'docs/deployment/PUBLISH-READINESS.md',
  'docs/testing/TEST_REPORT.md', 'README.md', 'vercel.json'
];

requiredFiles.forEach(file => assert(exists(file), `File wajib tidak ditemukan: ${file}`));

for (const legacy of [
  'account.html', 'account-results.html', 'account-insights.html', 'admin.html',
  'admin-dashboard.html', 'docs.html', 'result.html', 'test.html', 'verify.html',
  'api/assessment-session.js', 'api/assessment-submit.js', 'api/assessment-event.js',
  'api/question-bank.js', 'api/system-health.js', 'google-apps-script/code.gs'
]) {
  assert(!exists(legacy), `Path lama masih tersisa: ${legacy}`);
}

const publicPages = [
  'index.html', 'pages/docs.html', 'pages/test.html', 'pages/result.html',
  'pages/verify.html', 'pages/account.html', 'pages/admin.html', 'pages/admin-dashboard.html'
];

const referencePattern = /(?:href|src)\s*=\s*["']([^"'#?]+)(?:[#?][^"']*)?["']/gi;
for (const htmlFile of publicPages) {
  if (!exists(htmlFile)) continue;
  const html = read(htmlFile);
  let match;
  while ((match = referencePattern.exec(html)) !== null) {
    const target = match[1].trim();
    if (!target || /^https?:\/\//i.test(target) || /^(mailto|tel|javascript):/i.test(target)) continue;
    // Page URLs are intentionally root-relative from the browser's public URL.
    if (/^(account|account-results|account-insights|admin|admin-dashboard|docs|result|test|verify)(\.html)?$/i.test(target)) continue;
    assert(exists(target), `${htmlFile}: local reference tidak ditemukan -> ${target}`);
  }
}

const runtimeConfig = read('js/runtime-config.js');
const latestBackend = 'https://script.google.com/macros/s/AKfycbybvP-FJvO1ruHoGjikM60Y99ofiu9YrWkIXgl410ua1sxt96sgt8tCXCRYzLy8bwEx/exec';
const previousBackend = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
assert(runtimeConfig.includes('CONFIG.GOOGLE_SHEETS_API'), 'Results endpoint tidak ada');
assert(runtimeConfig.includes(latestBackend), 'Endpoint Apps Script terbaru tidak dipakai');
assert(!runtimeConfig.includes(previousBackend), 'Endpoint Apps Script lama masih tersimpan');
for (const key of ['QUESTION_BANK_API', 'ASSESSMENT_SECURITY_API', 'ASSESSMENT_SUBMIT_API', 'ASSESSMENT_EVENT_API', 'SYSTEM_HEALTH_API']) {
  assert(runtimeConfig.includes(`CONFIG.${key}`), `runtime-config.js tidak mendefinisikan ${key}`);
}

const questionBank = read('backend/apps-script/question-bank-backend.gs');
assert(questionBank.includes("createHtmlOutputFromFile('index')"), 'Question Bank belum memakai index.html');
assert(!exists('backend/apps-script/question-bank-editor.html'), 'Editor Question Bank lama masih tersisa');

const results = read('backend/apps-script/results-backend.gs');
assert(results.includes('TA_SERVER_SHARED_SECRET'), 'Shared secret submission belum tersedia');
assert(results.includes('requireServerProof_'), 'Server proof belum ditegakkan');

const account = read('backend/apps-script/account-backend.gs');
for (const key of ['adminDeleteReport_', 'adminDeleteUser_', 'adminSetUserStatus_', 'adminRevokeSession_']) {
  assert(account.includes(key), `Account backend belum memiliki ${key}`);
}

const maintenance = read('backend/apps-script/maintenance.gs');
for (const key of ['runMaintenanceAudit', 'repairHeader_', 'updateAnalytics_']) {
  assert(maintenance.includes(key), `Maintenance backend belum memiliki ${key}`);
}

const apiChecks = [
  ['api/assessment/session.js', ['uaHash', 'MAX_ISSUES_PER_WINDOW', latestBackend]],
  ['api/assessment/submit.js', ['currentUaHash', 'MAX_SUBMITS_PER_WINDOW', latestBackend]],
  ['api/assessment/event.js', [latestBackend]],
  ['api/system/health.js', [latestBackend, 'TA_ASSESS_SERVER_SECRET', 'questionBank']],
  ['api/data/question-bank.js', ['question-bank']]
];
for (const [file, patterns] of apiChecks) {
  const source = read(file);
  patterns.forEach(pattern => assert(source.includes(pattern), `${file}: tidak ditemukan ${pattern}`));
}

const vercel = read('vercel.json');
for (const route of ['/admin', '/account.html', '/docs.html', '/result.html', '/test.html', '/verify.html', '/api/question-bank', '/api/assessment-session', '/api/assessment-submit', '/api/assessment-event', '/api/system-health']) {
  assert(vercel.includes(`"source": "${route}"`), `Rewrite lama belum dipertahankan: ${route}`);
}
assert(vercel.includes('camera=(self)'), 'Permissions-Policy tidak mengizinkan kamera untuk asesmen');

const test = read('pages/test.html');
for (const script of ['js/assessment-calibration.js', 'js/security-hardening.js', 'js/client-diagnostics.js', 'js/personality-fallback-30.js']) {
  assert(test.includes(script), `pages/test.html belum memuat ${script}`);
}

const verify = read('pages/verify.html');
assert(verify.includes('action=verify'), 'Halaman verifikasi belum memanggil action=verify');
assert(verify.includes('CONFIG.GOOGLE_SHEETS_API'), 'Halaman verifikasi belum memakai runtime config');

const docs = read('pages/docs.html');
for (const id of ['privacy', 'methodology', 'algorithm', 'security', 'backend', 'health']) {
  assert(docs.includes(`id="${id}"`), `pages/docs.html belum memiliki section ${id}`);
}
assert(docs.includes('assets/docs-hero.svg'), 'Hero dokumentasi lokal tidak dipakai');

const php = read('backend/php/bootstrap.php');
assert(php.includes('<?php') && php.includes('declare(strict_types=1);'), 'PHP scaffold tidak valid');
assert(!php.includes('http_response_code('), 'PHP scaffold tidak boleh menjadi endpoint aktif');

const env = read('.env.example');
assert(env.includes('TA_ASSESS_SERVER_SECRET='), 'Vercel secret belum didokumentasikan');
assert(env.includes('TA_SERVER_SHARED_SECRET='), 'Apps Script shared secret belum didokumentasikan');

if (errors.length) {
  console.error(`REPOSITORY CHECK FAILED: ${errors.length} error(s)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('REPOSITORY CHECK PASSED: structure, rewrites, backend wiring, security boundaries, documentation, and legacy paths are consistent.');
  process.exitCode = 0;
}
