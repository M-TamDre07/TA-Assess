# Struktur Repository TA Assess

Dokumen ini menjadi peta pemeliharaan repository. Struktur dibuat sederhana agar path Vercel dan halaman statis tetap stabil, sementara source backend dipisahkan menurut runtime.

## Prinsip

- Halaman HTML yang menjadi entry point tetap di root karena dipanggil langsung oleh static hosting/Vercel.
- `css/` hanya berisi stylesheet.
- `js/` hanya berisi logic frontend dan engine.
- `api/` hanya berisi Vercel Functions/gateway Node.js.
- `backend/apps-script/` berisi source Google Apps Script untuk version control; deployment runtime tetap berada di project Apps Script.
- `backend/php/` adalah boundary source PHP. Saat ini hanya berisi scaffold non-runtime dan tidak menambah endpoint aplikasi.
- `docs/` berisi dokumentasi teknis Markdown.
- `assets/` berisi aset statis non-kode.
- `tests/` berisi pemeriksaan repository dan test engine.
- `.github/` berisi workflow, template, dan konfigurasi repository.

## Peta file utama

```text
TA-Assess/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/                 # CI + CodeQL
│   ├── dependabot.yml
│   └── pull_request_template.md
├── api/                            # Vercel Functions / gateway Node.js
│   ├── assessment-session.js       # Membuat sesi asesmen
│   ├── assessment-submit.js        # Validasi sesi + server proof + submit
│   ├── assessment-event.js         # Gateway event keamanan/diagnostik
│   ├── question-bank.js            # Proxy Question Bank
│   └── system-health.js            # Probe kesehatan backend
├── assets/                          # Aset statis
├── backend/
│   ├── apps-script/                # Source Google Apps Script
│   │   ├── results-backend.gs       # Backend hasil + verifikasi
│   │   ├── account-backend.gs       # Backend akun/admin
│   │   ├── question-bank-backend.gs # Backend Question Bank
│   │   ├── question-bank-editor.html# Editor Question Bank
│   │   ├── personality-30-seed.gs   # Seed personality pilot 30 item
│   │   └── maintenance.gs           # Audit/recovery workbook
│   └── php/
│       └── bootstrap.php            # Boundary PHP; belum menjadi endpoint runtime
├── css/
│   ├── styles.css                  # Style umum
│   └── test-responsive.css          # Layout khusus halaman asesmen
├── docs/                            # Dokumentasi teknis
├── js/                              # Frontend, engine, account, admin, security
├── tests/                            # Repository checks + test engine
├── index.html                        # Beranda
├── account.html                      # Login/register/dashboard akun
├── account-results.html              # Viewer hasil tersimpan
├── account-insights.html             # Profil lengkap
├── test.html                         # Pengerjaan asesmen
├── result.html                       # Hasil sementara
├── verify.html                       # Verifikasi laporan
├── admin.html                        # Pintu masuk admin
├── admin-dashboard.html              # Dashboard admin
├── docs.html                         # Dokumentasi UI publik
├── 404.html                          # Halaman error
├── vercel.json                       # Route/header Vercel
├── robots.txt                        # Crawler directives
├── site.webmanifest                  # Web app metadata
├── favicon.svg                       # Favicon
├── README.md
└── LICENSE
```

## Bahasa dan runtime

- **HTML/CSS** — halaman dan presentasi frontend.
- **JavaScript / Node.js** — frontend engine dan Vercel Functions yang aktif.
- **Google Apps Script** — backend Google Sheets dan service Question Bank/Account yang dideploy terpisah.
- **PHP** — disiapkan sebagai boundary source untuk pengembangan berikutnya. Scaffold PHP saat ini tidak dipasang sebagai route Vercel dan tidak mengubah alur aplikasi.

Node.js 24.x tetap menjadi runtime Vercel Functions yang aktif. Menambahkan scaffold PHP tidak boleh mengubah runtime Node.js atau routing yang sudah berjalan.

## Aturan integrasi

### Backend hasil

`js/runtime-config.js` adalah sumber endpoint publik untuk frontend. Gateway di `api/` juga harus menunjuk deployment Apps Script hasil yang sama. Jangan menyisakan deployment lama di salah satu gateway.

### Question Bank

Question Bank berjalan sebagai service terpisah dari backend hasil. Browser memakai `/api/question-bank`, sedangkan gateway tersebut meneruskan request ke Web App Question Bank.

### Account API

`account-backend.gs` merupakan service terpisah. `CONFIG.ACCOUNT_API` baru dapat diisi setelah Web App Account benar-benar dideploy. Jangan menebak URL deployment.

### Apps Script

`results-backend.gs`, `account-backend.gs`, dan `question-bank-backend.gs` masing-masing memiliki `doGet`/`doPost` dan secara operasional harus dideploy sebagai project Web App Apps Script yang terpisah bila semuanya digunakan. Nama file di repository tidak mengubah kebutuhan pemisahan deployment.

### PHP

PHP hanya menjadi source boundary pada tahap maintenance ini. Jangan menambahkan route PHP ke `vercel.json` atau mengganti gateway Node.js hanya untuk membuat PHP terlihat aktif. Setiap integrasi PHP di masa depan harus melalui keputusan deployment yang terpisah dan diuji tanpa memutus gateway Node.js.

### Question fallback

`test-engine.js` mencoba Question Bank terlebih dahulu dan memakai fallback lokal ketika service tidak tersedia. Karena itu perubahan metadata jumlah soal harus diperiksa terhadap fallback lokal dan Question Bank; jangan mengubah angka hanya untuk membuat tampilan terlihat benar.

## Checklist maintenance

1. Periksa tree dan path lokal.
2. Periksa seluruh `href`/`src` lokal.
3. Periksa endpoint Apps Script agar tidak kembali ke deployment lama.
4. Periksa integrasi `runtime-config.js` dengan gateway Vercel.
5. Periksa environment secret tanpa pernah menaruh nilainya di repository.
6. Periksa fallback Question Bank dan versioning instrumen.
7. Periksa syntax JavaScript, Apps Script, dan scaffold PHP.
8. Jalankan `node tests/check-repository.js`.
9. Jalankan `node tests/run-tests.js`.
10. Periksa CI/CodeQL setelah commit.
11. Periksa health endpoint setelah deployment.
12. Periksa Google Apps Script deployment dan Script Properties secara terpisah.
13. Jangan menganggap status CI sebagai bukti deployment backend atau browser e2e.
