# Struktur Repository TA Assess

Dokumen ini menjadi peta pemeliharaan repository. Struktur dipertahankan sederhana agar path Vercel dan halaman statis tidak mudah rusak.

## Prinsip

- Halaman HTML yang menjadi entry point tetap di root karena dipanggil langsung oleh static hosting/Vercel.
- `css/` hanya berisi stylesheet.
- `js/` hanya berisi logic frontend dan engine.
- `api/` hanya berisi Vercel Functions/gateway server-side.
- `google-apps-script/` berisi source backend Apps Script yang disimpan untuk version control; deployment runtime tetap berada di project Apps Script.
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
├── api/                            # Gateway Vercel
│   ├── assessment-session.js       # Membuat sesi asesmen
│   ├── assessment-submit.js        # Validasi sesi + server proof + submit
│   ├── assessment-event.js         # Gateway event keamanan/diagnostik
│   ├── question-bank.js             # Proxy Question Bank
│   └── system-health.js             # Probe kesehatan backend
├── assets/                          # Aset statis
├── css/
│   ├── styles.css                  # Style umum
│   └── test-responsive.css          # Layout khusus halaman asesmen
├── docs/                            # Dokumentasi teknis
├── google-apps-script/              # Source backend Apps Script
│   ├── code.gs                      # Backend hasil + verifikasi
│   ├── account.gs                   # Backend akun/admin
│   ├── question-bank.gs              # Backend Question Bank
│   ├── question-bank.html            # Editor Question Bank
│   ├── personality-30-seed.gs        # Seed personality pilot 30 item
│   └── maintenance.gs                # Audit/recovery workbook
├── js/                              # Frontend
│   ├── assessments-data.js           # Data instrumen/fallback dasar
│   ├── assessment-publish-config.js  # Metadata publik instrumen
│   ├── test-engine.js                # Mesin pengerjaan asesmen
│   ├── result-engine.js              # Tampilan hasil + PDF
│   ├── insight-engine.js             # Smart Insight rule-based
│   ├── recommendation-engine.js      # Rekomendasi eksplorasi
│   ├── access-control.js              # Mode akun/tamu
│   ├── account*.js                    # UI akun dan hasil tersimpan
│   ├── admin-dashboard.js             # Dashboard admin
│   ├── runtime-config.js              # Endpoint/link publik saja
│   └── security/client diagnostics   # Modul hardening dan diagnostik
├── tests/                            # Repository checks + test engine
├── index.html                         # Beranda
├── account.html                       # Login/register/dashboard akun
├── account-results.html               # Viewer hasil tersimpan
├── account-insights.html              # Profil lengkap
├── test.html                          # Pengerjaan asesmen
├── result.html                        # Hasil sementara
├── verify.html                        # Verifikasi laporan
├── admin.html                         # Pintu masuk admin
├── admin-dashboard.html               # Dashboard admin
├── docs.html                          # Dokumentasi UI publik
├── 404.html                           # Halaman error
├── vercel.json                        # Route/header Vercel
├── robots.txt                         # Crawler directives
├── site.webmanifest                   # Web app metadata
├── favicon.svg                        # Favicon
├── README.md
└── LICENSE
```

## Aturan integrasi

### Backend hasil

`js/runtime-config.js` adalah sumber endpoint publik untuk frontend. Gateway di `api/` juga harus menunjuk deployment Apps Script hasil yang sama. Jangan menyisakan deployment lama di salah satu gateway.

### Question Bank

Question Bank berjalan sebagai service terpisah dari backend hasil. Browser memakai `/api/question-bank`, sedangkan gateway tersebut meneruskan request ke Web App Question Bank.

### Account API

`account.gs` merupakan service terpisah. `CONFIG.ACCOUNT_API` baru dapat diisi setelah Web App Account benar-benar dideploy. Jangan menebak URL deployment.

### Apps Script

`code.gs`, `account.gs`, dan `question-bank.gs` memiliki `doGet`/`doPost` masing-masing dan karena itu secara operasional harus dideploy sebagai project Web App yang terpisah bila semuanya digunakan. Source tetap boleh berada dalam satu folder repository.

### Question fallback

`test-engine.js` mencoba Question Bank terlebih dahulu dan memakai fallback lokal ketika service tidak tersedia. Karena itu perubahan metadata jumlah soal harus diperiksa terhadap fallback lokal dan Question Bank; jangan mengubah angka hanya untuk membuat tampilan terlihat benar.

## Checklist maintenance

1. Periksa tree dan path lokal.
2. Periksa seluruh `href`/`src` lokal.
3. Periksa endpoint Apps Script agar tidak kembali ke deployment lama.
4. Periksa integrasi `runtime-config.js` dengan gateway Vercel.
5. Periksa fallback Question Bank dan versioning instrumen.
6. Jalankan `node tests/check-repository.js`.
7. Jalankan `node tests/run-tests.js`.
8. Jalankan syntax check JavaScript yang berubah.
9. Periksa CI/CodeQL setelah commit.
10. Periksa health endpoint setelah deployment.
11. Periksa Google Apps Script deployment dan Script Properties secara terpisah.
12. Jangan menganggap status CI sebagai bukti deployment backend atau browser e2e.
