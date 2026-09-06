// TA ASSESS — repository integrity checks
// No external dependency. Run: node tests/check-repository.js

const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const errors=[];
function exists(relativePath){return fs.existsSync(path.join(ROOT,relativePath));}
function read(relativePath){return fs.readFileSync(path.join(ROOT,relativePath),'utf8');}
function assert(condition,message){if(!condition)errors.push(message);}

const requiredFiles=['index.html','docs.html','404.html','favicon.svg','site.webmanifest','robots.txt','CODEOWNERS','test.html','result.html','verify.html','admin.html','admin-dashboard.html','css/styles.css','js/assessments-data.js','js/script.js','js/test-engine.js','js/result-engine.js','js/insight-engine.js','js/recommendation-engine.js','js/runtime-config.js','js/assessment-calibration.js','js/security-hardening.js','js/client-diagnostics.js','js/admin-dashboard.js','api/assessment-session.js','api/assessment-submit.js','api/assessment-event.js','tests/run-tests.js','google-apps-script/code.gs','google-apps-script/account.gs','README.md','docs/SETUP.md','docs/PRIVACY.md','docs/ASSESSMENT-METHODOLOGY.md','docs/ACCOUNT-SECURITY.md','docs/SECURITY-DEPLOYMENT.md','docs/CONTRIBUTING.md','docs/SECURITY.md','docs/SEO-DEPLOYMENT.md'];
requiredFiles.forEach(file=>assert(exists(file),`File wajib tidak ditemukan: ${file}`));

const htmlFiles=['index.html','docs.html','test.html','result.html','verify.html','admin.html','admin-dashboard.html'];
const referencePattern=/(?:href|src)\s*=\s*["']([^"'#?]+)(?:[#?][^"']*)?["']/gi;
for(const htmlFile of htmlFiles){
  if(!exists(htmlFile))continue;
  const html=read(htmlFile);let match;
  while((match=referencePattern.exec(html))!==null){
    const target=match[1].trim();
    if(!target||target.startsWith('http://')||target.startsWith('https://')||target.startsWith('mailto:')||target.startsWith('tel:')||target.startsWith('javascript:'))continue;
    assert(exists(target),`${htmlFile}: local reference tidak ditemukan -> ${target}`);
  }
}
for(const htmlFile of ['index.html','test.html','result.html','verify.html','admin-dashboard.html']){if(!exists(htmlFile))continue;assert(read(htmlFile).includes('js/runtime-config.js'),`${htmlFile}: runtime-config.js belum dimuat`);}

const runtimeConfig=read('js/runtime-config.js');
const forbiddenSecrets=[/sk-[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9_]{20,}/,/AIza[0-9A-Za-z_-]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,/xox[baprs]-[A-Za-z0-9-]{10,}/];
forbiddenSecrets.forEach(pattern=>assert(!pattern.test(runtimeConfig),`runtime-config.js terdeteksi pola secret: ${pattern}`));
assert(runtimeConfig.includes('CONFIG.GOOGLE_SHEETS_API'),'runtime-config.js tidak mendefinisikan CONFIG.GOOGLE_SHEETS_API');
assert(runtimeConfig.includes('CONFIG.FORMSPREE_LINK'),'runtime-config.js tidak mendefinisikan CONFIG.FORMSPREE_LINK');
assert(runtimeConfig.includes('CONFIG.SAWERIA_LINK'),'runtime-config.js tidak mendefinisikan CONFIG.SAWERIA_LINK');
assert(runtimeConfig.includes('CONFIG.ASSESSMENT_SECURITY_API'),'runtime-config.js tidak mendefinisikan security endpoint');
assert(runtimeConfig.includes('CONFIG.ASSESSMENT_EVENT_API'),'runtime-config.js tidak mendefinisikan event gateway');
assert(runtimeConfig.includes('CONFIG.MRD_COMMUNITY_LINK'),'runtime-config.js tidak mendefinisikan link komunitas MRD');

const verify=read('verify.html');
assert(verify.includes('action=verify'),'verify.html belum memanggil action=verify backend');
assert(verify.includes('CONFIG.GOOGLE_SHEETS_API'),'verify.html belum menggunakan runtime backend endpoint');
assert(!verify.includes('getDemoVerificationAdapter'),'verify.html masih memakai adapter verifikasi lokal lama');

const test=read('test.html');
assert(test.includes('js/assessment-calibration.js'),'test.html belum memuat assessment calibration');
assert(test.includes('js/security-hardening.js'),'test.html belum memuat security hardening');
assert(test.includes('js/client-diagnostics.js'),'test.html belum memuat client diagnostics');

const backend=read('google-apps-script/code.gs');
assert(backend.includes('TA_SERVER_SHARED_SECRET'),'backend belum memiliki shared secret submission');
assert(backend.includes('requireServerProof_'),'backend belum menegakkan server proof');

const account=read('google-apps-script/account.gs');
assert(account.includes('adminDeleteReport_'),'account backend belum memiliki admin delete report');
assert(account.includes('adminDeleteUser_'),'account backend belum memiliki admin delete user');
assert(account.includes('adminSetUserStatus_'),'account backend belum memiliki admin status control');
assert(account.includes('adminRevokeSession_'),'account backend belum memiliki session revoke control');
assert(account.includes("if(sheetName==='Accounts')"),'account backend belum meredaksi field sensitif Accounts');
assert(account.includes("if(sheetName==='Sessions')"),'account backend belum meredaksi field sensitif Sessions');
assert(!account.includes("headers=values[0]||[],rows=values.slice(1).reverse().slice(0,limit)"),'account backend masih mengembalikan seluruh field sheet secara generik');

const vercel=read('vercel.json');
assert(vercel.includes('"/admin"'),'vercel.json belum menyediakan route /admin');
assert(vercel.includes('"/admin/"'),'vercel.json belum menyediakan route /admin/');
assert(vercel.includes('camera=(self)'),'vercel.json memblokir kamera yang dibutuhkan asesmen');

const index=read('index.html');
assert(index.includes('site.webmanifest'),'index.html belum memuat web manifest');
assert(index.includes('favicon.svg'),'index.html belum memuat favicon');
assert(index.includes('docs.html#privacy'),'footer belum mengarah ke UI dokumentasi privasi');
assert(index.includes('application/ld+json'),'index.html belum memiliki structured data');

const docs=read('docs.html');
assert(docs.includes('id="privacy"'),'docs.html belum memiliki section privasi');
assert(docs.includes('id="methodology"'),'docs.html belum memiliki section metodologi');
assert(docs.includes('id="account-security"'),'docs.html belum memiliki section keamanan akun');
assert(docs.includes('id="setup"'),'docs.html belum memiliki section setup backend');

const codeowners=read('CODEOWNERS');
assert(codeowners.includes('@M-TamDre07'),'CODEOWNERS belum menunjuk maintainer');

if(errors.length){console.error(`REPOSITORY CHECK FAILED: ${errors.length} error(s)`);errors.forEach(error=>console.error(`- ${error}`));process.exitCode=1;}else{console.log('REPOSITORY CHECK PASSED: structure, links, admin redaction, SEO assets, security wiring, runtime config, and verification wiring are consistent.');process.exitCode=0;}
