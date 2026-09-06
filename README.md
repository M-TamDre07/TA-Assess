# TA Assess

TA Assess adalah platform web untuk **self-assessment**, eksplorasi diri, dan penyajian hasil asesmen terstruktur yang dikembangkan oleh Tama Andrea Studio.

> **Status: Development / Pilot**
>
> TA Assess bukan lembaga psikologi. Hasilnya adalah self-assessment dan bukan diagnosis psikologis, sertifikat psikologi, atau pengganti pemeriksaan oleh Psikolog.

## Tentang proyek

TA Assess dibuat sebagai proyek yang transparan dan dapat dikembangkan bertahap. Instrumen yang tersedia berstatus **DEMO** atau **PILOT** dan tidak diklaim tervalidasi secara psikometrik.

Fokus aplikasi saat ini meliputi:

- katalog asesmen dan alur consent → pertanyaan → hasil;
- scoring engine dengan validasi rentang dan reverse scoring;
- fallback Question Bank lokal;
- report ID, verifikasi laporan, dan PDF;
- Google Apps Script + Google Sheets sebagai backend tahap development/pilot;
- rule-based Smart Insight dan recommendation engine;
- modul akun dan panel admin terpisah;
- gateway Vercel untuk session, submission, event, Question Bank, dan health check;
- dokumentasi teknis yang dipisahkan menurut topik.

## Instrumen

| ID | Instrumen | Status | Soal |
|---|---|---:|---:|
| `PERSONALITY-01` | Big Five Personality: Eksplorasi 30 Soal | PILOT | 30 |
| `CAREER-01` | Eksplorasi Minat Karier | DEMO/PILOT | mengikuti Question Bank |
| `LEARNING-01` | Preferensi Belajar | DEMO/PILOT | mengikuti Question Bank |

Informasi metodologi dan batasan instrumen tersedia di [pusat dokumentasi](docs.html) dan dokumentasi teknis `docs/assessment/`.

## Struktur repository

```text
TA-Assess/
├── .github/                 # CI, CodeQL, template, Dependabot
├── api/                     # Vercel Functions / gateway Node.js
├── assets/                  # aset statis
├── backend/
│   ├── apps-script/        # source Google Apps Script
│   │   └── index.html       # editor Question Bank HTMLService
│   └── php/                # boundary source PHP, belum runtime
├── css/                    # stylesheet
├── docs/
│   ├── assessment/         # metodologi dan Question Bank
│   ├── security/           # privasi dan keamanan
│   ├── development/       # kontribusi dan struktur repository
│   ├── deployment/         # setup dan kesiapan deployment
│   └── testing/            # laporan pengujian
├── js/                     # frontend, engine, account, admin, security
├── tests/                  # pemeriksaan repository dan test engine
├── index.html              # beranda
├── test.html               # pengerjaan asesmen
├── result.html              # hasil asesmen
├── verify.html              # verifikasi laporan
├── account*.html            # halaman akun
├── admin*.html              # halaman admin
├── docs.html               # dokumentasi UI publik
├── 404.html
├── vercel.json
├── README.md
└── LICENSE
```

Entry point HTML utama tetap di root agar path static hosting/Vercel tidak berubah. `backend/apps-script/index.html` adalah file berbeda: itu adalah editor Question Bank untuk HTMLService Apps Script.

Peta lengkap repository: [`docs/development/REPOSITORY-STRUCTURE.md`](docs/development/REPOSITORY-STRUCTURE.md).

## Runtime dan backend

- **HTML/CSS** — frontend dan presentasi.
- **JavaScript / Node.js 24.x** — frontend engine dan Vercel Functions.
- **Google Apps Script** — backend Results, Account, dan Question Bank yang dideploy sebagai service terpisah.
- **PHP** — boundary source untuk pengembangan berikutnya; belum menjadi endpoint Vercel.

Apps Script yang memiliki `doGet`/`doPost` sendiri tetap dideploy sebagai project Web App terpisah. Source-nya boleh berada dalam satu folder GitHub agar mudah dirawat.

## Konfigurasi

Endpoint publik dipusatkan di `js/runtime-config.js`. File tersebut boleh berisi URL Web App dan link publik, tetapi **tidak boleh berisi secret**.

Shared secret submission menggunakan dua nama sesuai runtime:

```text
Vercel:       TA_ASSESS_SERVER_SECRET
Apps Script:  TA_SERVER_SHARED_SECRET
```

Nilainya harus sama persis. Nilai produksi hanya disimpan di Vercel Environment Variables dan Apps Script Script Properties.

`CONFIG.ACCOUNT_API` dibiarkan kosong sampai Account Web App benar-benar dideploy. Jangan menebak URL deployment.

## Google Apps Script

Source utama berada di `backend/apps-script/`:

- `results-backend.gs` — hasil, verifikasi, dan submission;
- `account-backend.gs` — akun dan operasi admin;
- `question-bank-backend.gs` — Question Bank;
- `index.html` — editor Question Bank;
- `maintenance.gs` — audit dan recovery workbook;
- `personality-30-seed.gs` — seed personality pilot.

Question Bank backend memanggil editor dengan:

```javascript
HtmlService.createHtmlOutputFromFile('index')
```

Jadi nama file editor **harus `index.html`** di dalam project Apps Script Question Bank.

## Quality checks

Jalankan:

```bash
node tests/run-tests.js
node tests/check-repository.js
php -l backend/php/bootstrap.php
```

GitHub Actions juga menjalankan pemeriksaan source untuk JavaScript, Vercel Functions, Apps Script, dan scaffold PHP.

CI hanya membuktikan konsistensi source dan struktur repository. CI tidak membuktikan deployment Vercel, Google Apps Script, Google Sheets, PDF, kamera, atau browser e2e.

## Dokumentasi teknis

- [Dokumentasi publik](docs.html)
- [Assessment](docs/assessment/)
- [Security](docs/security/)
- [Development](docs/development/)
- [Deployment](docs/deployment/)
- [Testing](docs/testing/)

## Batasan penting

- Bukan alat diagnosis psikologis.
- Bukan pengganti konsultasi profesional.
- Instrumen belum diklaim tervalidasi secara psikometrik.
- Skor 0–100 bersifat relatif terhadap skala aplikasi, bukan persentil populasi.
- Smart Insight dan rekomendasi bersifat rule-based untuk eksplorasi.
- Google Sheets digunakan sebagai data store ringan untuk tahap development/pilot.

## Lisensi

TA Assess dirilis di bawah **MIT License**. Lihat [`LICENSE`](LICENSE).

## Pengembang

**Tama Andrea Studio**
