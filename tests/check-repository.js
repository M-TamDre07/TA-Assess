// TA ASSESS — repository integrity checks
// No external dependency. Run: node tests/check-repository.js

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
    if (!condition) errors.push(message);
}

const requiredFiles = [
    'index.html',
    'test.html',
    'result.html',
    'verify.html',
    'css/styles.css',
    'js/assessments-data.js',
    'js/script.js',
    'js/test-engine.js',
    'js/result-engine.js',
    'js/insight-engine.js',
    'js/recommendation-engine.js',
    'js/runtime-config.js',
    'tests/run-tests.js',
    'google-apps-script/code.gs',
    'README.md',
    'docs/SETUP.md',
    'docs/PRIVACY.md',
    'docs/ASSESSMENT-METHODOLOGY.md'
];

requiredFiles.forEach(file => assert(exists(file), `File wajib tidak ditemukan: ${file}`));

// Validate local href/src references in all HTML files.
const htmlFiles = ['index.html', 'test.html', 'result.html', 'verify.html'];
const referencePattern = /(?:href|src)\s*=\s*["']([^"'#?]+)(?:[#?][^"']*)?["']/gi;

for (const htmlFile of htmlFiles) {
    if (!exists(htmlFile)) continue;
    const html = read(htmlFile);
    let match;
    while ((match = referencePattern.exec(html)) !== null) {
        const target = match[1].trim();
        if (!target || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('javascript:')) continue;
        assert(exists(target), `${htmlFile}: local reference tidak ditemukan -> ${target}`);
    }
}

// Runtime configuration must be present on pages that need CONFIG.
for (const htmlFile of ['index.html', 'test.html', 'result.html', 'verify.html']) {
    if (!exists(htmlFile)) continue;
    const html = read(htmlFile);
    assert(html.includes('js/runtime-config.js'), `${htmlFile}: runtime-config.js belum dimuat`);
}

// Public runtime config must not contain common secret formats.
const runtimeConfig = read('js/runtime-config.js');
const forbiddenSecrets = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
    /xox[baprs]-[A-Za-z0-9-]{10,}/
];
forbiddenSecrets.forEach(pattern => assert(!pattern.test(runtimeConfig), `runtime-config.js terdeteksi pola secret: ${pattern}`));

assert(runtimeConfig.includes('CONFIG.GOOGLE_SHEETS_API'), 'runtime-config.js tidak mendefinisikan CONFIG.GOOGLE_SHEETS_API');
assert(runtimeConfig.includes('CONFIG.FORMSPREE_LINK'), 'runtime-config.js tidak mendefinisikan CONFIG.FORMSPREE_LINK');
assert(runtimeConfig.includes('CONFIG.SAWERIA_LINK'), 'runtime-config.js tidak mendefinisikan CONFIG.SAWERIA_LINK');

// Verification page must use the backend adapter, not the old local-only demo adapter.
const verify = read('verify.html');
assert(verify.includes('action=verify'), 'verify.html belum memanggil action=verify backend');
assert(verify.includes('CONFIG.GOOGLE_SHEETS_API'), 'verify.html belum menggunakan runtime backend endpoint');
assert(!verify.includes('getDemoVerificationAdapter'), 'verify.html masih memakai adapter verifikasi lokal lama');

if (errors.length) {
    console.error(`REPOSITORY CHECK FAILED: ${errors.length} error(s)`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log('REPOSITORY CHECK PASSED: structure, local links, runtime config, and verification wiring are consistent.');
    process.exitCode = 0;
}
