// TA ASSESS — repository integrity checks
// Run: node tests/check-repository.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const requiredFiles = [
  'index.html',
  'docs.html',
  '404.html',
  'favicon.svg',
  'site.webmanifest',
  'robots.txt',
  'CODEOWNERS',
  'test.html',
  'result.html',
  'verify.html',
  'admin.html',
  'admin-dashboard.html',
  'assets/docs-hero.svg',
  'css/styles.css',
  'js/assessments-data.js',
  'js/script.js',
  'js/test-engine.js',
  'js/result-engine.js',
  'js/insight-engine.js',
  'js/recommendation-engine.js',
  'js/runtime-config.js',
  'js/assessment-calibration.js',
  'js/security-hardening.js',
  'js/client-diagnostics.js',
  'js/admin-dashboard.js',
  'api/assessment-session.js',
  'api/assessment-submit.js',
  'api/assessment-event.js',
  'api/system-health.js',
  'tests/run-tests.js',
  'backend/apps-script/results-backend.gs',
  'backend/apps-script/account-backend.gs',
  'backend/apps-script/question-bank-backend.gs',
  'backend/apps-script/index.html',
  'backend/apps-script/maintenance.gs',
  'backend/apps-script/personality-30-seed.gs',
  'backend/php/bootstrap.php',
  'README.md',
  'docs/SETUP.md',
  'docs/PRIVACY.md',
  'docs/ASSESSMENT-METHODOLOGY.md',
  'docs/ACCOUNT-SECURITY.md',
  'docs/SECURITY-DEPLOYMENT.md',
  'docs/CONTRIBUTING.md',
  'docs/SECURITY.md',
  'docs/SEO-DEPLOYMENT.md',
  'docs/REPOSITORY-STRUCTURE.md'
];

requiredFiles.forEach(file => {
  assert(exists(file), `File wajib tidak ditemukan: ${file}`);
});

const htmlFiles = [
  'index.html',
  'docs.html',
  'test.html',
  'result.html',
  'verify.html',
  'admin.html',
  'admin-dashboard.html'
];

const referencePattern = /(?:href|src)\s*=\s*["']([^"'#?]+)(?:[#?][^"']*)?["']/gi;

for (const htmlFile of htmlFiles) {
  if (!exists(htmlFile)) continue;

  const html = read(htmlFile);
  let match;

  while ((match = referencePattern.exec(html)) !== null) {
    const target = match[1].trim();

    if (
      !target ||
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('tel:') ||
      target.startsWith('javascript:')
    ) {
      continue;
    }

    assert(
      exists(target),
      `${htmlFile}: local reference tidak ditemukan -> ${target}`
    );
  }
}

for (const htmlFile of [
  'index.html',
  'test.html',
  'result.html',
  'verify.html',
  'admin-dashboard.html'
]) {
  if (!exists(htmlFile)) continue;

  assert(
    read(htmlFile).includes('js/runtime-config.js'),
    `${htmlFile}: runtime-config.js belum dimuat`
  );
}

const runtimeConfig = read('js/runtime-config.js');
const forbiddenSecrets = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /xox[baprs]-[A-Za-z0-9-]{10,}/
];

forbiddenSecrets.forEach(pattern => {
  assert(
    !pattern.test(runtimeConfig),
    `runtime-config.js terdeteksi pola secret: ${pattern}`
  );
});

assert(
  runtimeConfig.includes('CONFIG.GOOGLE_SHEETS_API'),
  'runtime-config.js tidak mendefinisikan CONFIG.GOOGLE_SHEETS_API'
);

const latestBackend = 'https://script.google.com/macros/s/AKfycbybvP-FJvO1ruHoGjikM60Y99ofiu9YrWkIXgl410ua1sxt96sgt8tCXCRYzLy8bwEx/exec';
const previousBackend = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';

assert(
  runtimeConfig.includes(latestBackend),
  'runtime-config.js belum memakai endpoint Apps Script terbaru'
);
assert(
  !runtimeConfig.includes(previousBackend),
  'runtime-config.js masih menyimpan endpoint Apps Script lama'
);
assert(
  runtimeConfig.includes('CONFIG.FORMSPREE_LINK'),
  'runtime-config.js tidak mendefinisikan CONFIG.FORMSPREE_LINK'
);
assert(
  runtimeConfig.includes('CONFIG.SAWERIA_LINK'),
  'runtime-config.js tidak mendefinisikan CONFIG.SAWERIA_LINK'
);
assert(
  runtimeConfig.includes('CONFIG.ASSESSMENT_SECURITY_API'),
  'runtime-config.js tidak mendefinisikan security endpoint'
);
assert(
  runtimeConfig.includes('CONFIG.ASSESSMENT_EVENT_API'),
  'runtime-config.js tidak mendefinisikan event gateway'
);
assert(
  runtimeConfig.includes('CONFIG.SYSTEM_HEALTH_API'),
  'runtime-config.js tidak mendefinisikan system health endpoint'
);
assert(
  runtimeConfig.includes('CONFIG.MRD_COMMUNITY_LINK'),
  'runtime-config.js tidak mendefinisikan link komunitas MRD'
);

const verify = read('verify.html');
assert(
  verify.includes('action=verify'),
  'verify.html belum memanggil action=verify backend'
);
assert(
  verify.includes('CONFIG.GOOGLE_SHEETS_API'),
  'verify.html belum menggunakan runtime backend endpoint'
);
assert(
  !verify.includes('getDemoVerificationAdapter'),
  'verify.html masih memakai adapter verifikasi lokal lama'
);

const test = read('test.html');
assert(
  test.includes('js/assessment-calibration.js'),
  'test.html belum memuat assessment calibration'
);
assert(
  test.includes('js/security-hardening.js'),
  'test.html belum memuat security hardening'
);
assert(
  test.includes('js/client-diagnostics.js'),
  'test.html belum memuat client diagnostics'
);
assert(
  test.includes('js/personality-fallback-30.js'),
  'test.html belum memuat fallback personality 30 item'
);

const backend = read('backend/apps-script/results-backend.gs');
assert(
  backend.includes('TA_SERVER_SHARED_SECRET'),
  'backend belum memiliki shared secret submission'
);
assert(
  backend.includes('requireServerProof_'),
  'backend belum menegakkan server proof'
);

const questionBank = read('backend/apps-script/question-bank-backend.gs');
assert(
  questionBank.includes("createHtmlOutputFromFile('index')"),
  'Question Bank belum memakai index.html sebagai editor'
);

const maintenance = read('backend/apps-script/maintenance.gs');
assert(
  maintenance.includes('runMaintenanceAudit'),
  'maintenance backend belum memiliki audit entry point'
);
assert(
  maintenance.includes('repairHeader_'),
  'maintenance backend belum memiliki safe header recovery'
);
assert(
  maintenance.includes('updateAnalytics_'),
  'maintenance backend belum merebuild analytics'
);

const account = read('backend/apps-script/account-backend.gs');
assert(
  account.includes('adminDeleteReport_'),
  'account backend belum memiliki admin delete report'
);
assert(
  account.includes('adminDeleteUser_'),
  'account backend belum memiliki admin delete user'
);
assert(
  account.includes('adminSetUserStatus_'),
  'account backend belum memiliki admin status control'
);
assert(
  account.includes('adminRevokeSession_'),
  'account backend belum memiliki session revoke control'
);
assert(
  account.includes("if(sheetName==='Accounts')"),
  'account backend belum meredaksi field sensitif Accounts'
);
assert(
  account.includes("if(sheetName==='Sessions')"),
  'account backend belum meredaksi field sensitif Sessions'
);
assert(
  !account.includes("headers=values[0]||[],rows=values.slice(1).reverse().slice(0,limit)"),
  'account backend masih mengembalikan seluruh field sheet secara generik'
);

const health = read('api/system-health.js');
assert(
  health.includes(latestBackend),
  'health endpoint belum menunjuk backend hasil terbaru'
);
assert(
  health.includes('AKfycbyT0jepU01BljPXNgMyUaAkgQ5U-j8X5n_kjh3pCosMhOv6hUAUA6uKETaAn7OlXTK9'),
  'health endpoint belum menunjuk Question Bank yang benar'
);
assert(
  health.includes('TA_ASSESS_SERVER_SECRET'),
  'health endpoint belum memeriksa server secret'
);
assert(
  health.includes('questionBank'),
  'health endpoint belum memeriksa Question Bank'
);
assert(
  health.includes('overall'),
  'health endpoint belum memiliki status keseluruhan'
);

const session = read('api/assessment-session.js');
assert(
  session.includes(latestBackend),
  'assessment session gateway masih menunjuk backend lama'
);
assert(
  !session.includes(previousBackend),
  'assessment session gateway masih menyimpan endpoint backend lama'
);
assert(
  session.includes('uaHash'),
  'assessment session belum memiliki browser fingerprint binding'
);
assert(
  session.includes('429'),
  'assessment session belum memiliki rate limit'
);

const submit = read('api/assessment-submit.js');
assert(
  submit.includes(latestBackend),
  'assessment submit gateway masih menunjuk backend lama'
);
assert(
  !submit.includes(previousBackend),
  'assessment submit gateway masih menyimpan endpoint backend lama'
);
assert(
  submit.includes('currentUaHash'),
  'assessment submit belum memeriksa browser fingerprint'
);
assert(
  submit.includes('MAX_SUBMITS_PER_WINDOW'),
  'assessment submit belum memiliki rate limit'
);

const event = read('api/assessment-event.js');
assert(
  event.includes(latestBackend),
  'assessment event gateway masih menunjuk backend lama'
);
assert(
  !event.includes(previousBackend),
  'assessment event gateway masih menyimpan endpoint backend lama'
);

const vercel = read('vercel.json');
assert(
  vercel.includes('"/admin"'),
  'vercel.json belum menyediakan route /admin'
);
assert(
  vercel.includes('"/admin/"'),
  'vercel.json belum menyediakan route /admin/'
);
assert(
  vercel.includes('camera=(self)'),
  'vercel.json memblokir kamera yang dibutuhkan asesmen'
);

const index = read('index.html');
assert(
  index.includes('site.webmanifest'),
  'index.html belum memuat web manifest'
);
assert(
  index.includes('favicon.svg'),
  'index.html belum memuat favicon'
);
assert(
  index.includes('docs.html#privacy'),
  'footer belum mengarah ke UI dokumentasi privasi'
);
assert(
  index.includes('docs.html#algorithm'),
  'footer belum mengarah ke dokumentasi algoritma'
);
assert(
  index.includes('Dokumentasi'),
  'navigasi utama belum memiliki link dokumentasi'
);
assert(
  index.includes('application/ld+json'),
  'index.html belum memiliki structured data'
);

const docs = read('docs.html');
assert(docs.includes('id="privacy"'), 'docs.html belum memiliki section privasi');
assert(docs.includes('id="methodology"'), 'docs.html belum memiliki section metodologi');
assert(docs.includes('id="security"'), 'docs.html belum memiliki section keamanan akun');
assert(docs.includes('id="backend"'), 'docs.html belum memiliki section setup backend');
assert(docs.includes('id="algorithm"'), 'docs.html belum memiliki section algoritma');
assert(docs.includes('id="health"'), 'docs.html belum memiliki section pemeriksaan sistem');
assert(docs.includes('assets/docs-hero.svg'), 'docs.html belum memakai aset hero lokal');
assert(docs.includes('<img src="assets/docs-hero.svg"'), 'docs.html belum menampilkan aset hero sebagai gambar yang terlihat');
assert(docs.includes('docs-button'), 'docs.html belum memiliki komponen tombol UI');
assert(!docs.includes('docs/PRIVACY.md">Baca sumber'), 'docs.html masih melempar pengunjung ke Markdown mentah');

const codeowners = read('CODEOWNERS');
assert(codeowners.includes('@M-TamDre07'), 'CODEOWNERS belum menunjuk maintainer');

const php = read('backend/php/bootstrap.php');
assert(php.includes('<?php'), 'PHP scaffold tidak valid');
assert(php.includes('declare(strict_types=1);'), 'PHP scaffold belum menggunakan strict types');
assert(!php.includes('http_response_code('), 'PHP scaffold tidak boleh menjadi endpoint aktif pada maintenance ini');

const env = read('.env.example');
assert(env.includes('TA_ASSESS_SERVER_SECRET='), '.env.example belum mendokumentasikan secret gateway Vercel');
assert(env.includes('TA_SERVER_SHARED_SECRET='), '.env.example belum mendokumentasikan shared secret Apps Script');
assert(env.includes('use-the-same-long-random-secret-as-vercel'), '.env.example belum menjelaskan bahwa kedua secret harus memiliki nilai yang sama');

if (errors.length) {
  console.error(`REPOSITORY CHECK FAILED: ${errors.length} error(s)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    'REPOSITORY CHECK PASSED: structure, links, docs UI, backend endpoint consistency, health, maintenance recovery, admin redaction, SEO assets, security wiring, runtime config, verification wiring, backend organization, and PHP boundary are consistent.'
  );
  process.exitCode = 0;
}
