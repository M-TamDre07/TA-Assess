# TA Assess

[![TA Assess CI](https://github.com/M-TamDre07/TA-Assess/actions/workflows/ci.yml/badge.svg)](https://github.com/M-TamDre07/TA-Assess/actions/workflows/ci.yml)

**TA Assess** adalah platform web untuk **self-assessment**, eksplorasi diri, dan penyajian hasil asesmen terstruktur yang dikembangkan oleh **Tama Andrea Studio**.

> **Status proyek: Development / Demo**
>
> TA Assess bukan lembaga psikologi. Hasil asesmen adalah hasil self-assessment dan **bukan diagnosis psikologis, sertifikat psikologi, atau pengganti pemeriksaan oleh Psikolog**.

## ✦ Tentang Proyek

TA Assess dirancang sebagai proyek yang transparan dan dapat dikembangkan secara bertahap. Fokus awalnya adalah menyediakan pengalaman asesmen digital yang sederhana, terstruktur, dan mudah dipahami, sekaligus menjaga batasan penggunaan instrumen dan hasilnya tetap jelas.

Instrumen yang tersedia saat ini berstatus **DEMO** atau **PILOT**. Status tersebut tidak boleh dianggap sebagai bukti validitas psikometrik.

## Fitur

- Katalog asesmen dan detail instrumen
- Alur consent → pertanyaan → hasil
- Scoring engine dengan validasi rentang dan reverse scoring
- Penanganan jawaban kosong tanpa menghasilkan `NaN`/`Infinity`
- Autosave progres sesi pada browser
- Report ID yang konsisten di alur hasil
- Generate laporan PDF melalui `html2pdf.js`
- QR code untuk halaman verifikasi
- Backend verification melalui Google Apps Script
- Google Sheets sebagai penyimpanan terstruktur dengan beberapa sheet otomatis
- Statistik profil: mean, median, standard deviation, min, max, range, completion rate, dan response time
- Rule-based Smart Insight dan recommendation engine
- Validasi konsistensi metadata dan jumlah soal
- Konfigurasi publik dipisahkan dari source engine melalui `js/runtime-config.js`
- Modul akun terpisah dengan password hashing, session expiry, lockout, dan audit metadata minimum
- Normalisasi nama tampilan untuk mengurangi typo sederhana seperti spasi ganda/karakter tidak perlu
- Audit aktivitas asesmen yang tidak mencatat password, token, atau jawaban mentah

## Instrumen Saat Ini

| ID | Instrumen | Status | Soal | Dimensi |
|---|---|---:|---:|---:|
| `PERSONALITY-01` | Big Five Personality — Demo | DEMO | 10 | 5 |
| `CAREER-01` | Career Interest Exploration — Demo | DEMO | 6 | 6 |
| `LEARNING-01` | Learning Preferences — Demo | PILOT | 4 | 4 |

### Catatan metodologi

Instrumen di atas merupakan adaptasi non-resmi untuk eksplorasi diri. TA Assess **tidak mengklaim** bahwa instrumen tersebut telah divalidasi secara psikometrik, disertifikasi, atau setara dengan instrumen profesional/komersial tertentu.

Informasi metodologi dan batasan penggunaan tersedia di:

- [`docs/ASSESSMENT-METHODOLOGY.md`](docs/ASSESSMENT-METHODOLOGY.md)
- [`docs/PRIVACY.md`](docs/PRIVACY.md)
- [`docs/ACCOUNT-SECURITY.md`](docs/ACCOUNT-SECURITY.md)
- [`docs/SETUP.md`](docs/SETUP.md)

## Struktur Repository

```text
TA-Assess/
├── .github/
│   └── workflows/
│       └── ci.yml
├── index.html
├── account.html
├── test.html
├── result.html
├── verify.html
├── css/
│   └── styles.css
├── js/
│   ├── account.js
│   ├── assessments-data.js
│   ├── insight-engine.js
│   ├── recommendation-engine.js
│   ├── result-engine.js
│   ├── runtime-config.js
│   ├── script.js
│   └── test-engine.js
├── tests/
│   ├── check-repository.js
│   └── run-tests.js
├── google-apps-script/
│   ├── account.gs
│   └── code.gs
├── docs/
│   ├── ACCOUNT-SECURITY.md
│   ├── ASSESSMENT-METHODOLOGY.md
│   ├── PRIVACY.md
│   ├── SETUP.md
│   └── TEST_REPORT.md
├── assets/
│   └── README.md
├── .gitignore
├── LICENSE
└── README.md
```

`google-apps-script/code.gs` disimpan di repository sebagai **source/version-control**. `google-apps-script/account.gs` adalah backend akun terpisah yang dapat memakai Spreadsheet yang sama. Kode yang dieksekusi tetap berada pada project Google Apps Script yang telah dideploy.

## Quality Checks

Repository memiliki pemeriksaan otomatis untuk mengurangi risiko link/path/config yang rusak:

```bash
node tests/run-tests.js
node tests/check-repository.js
node --check google-apps-script/code.gs
node --check google-apps-script/account.gs
```

GitHub Actions menjalankan pemeriksaan tersebut pada setiap push ke `main` dan setiap pull request ke `main`, termasuk syntax check untuk JavaScript frontend dan source Apps Script.

`tests/check-repository.js` memeriksa file wajib, referensi lokal `href/src`, keberadaan `runtime-config.js` pada halaman aplikasi, pola secret umum di runtime config, serta wiring halaman verifikasi ke backend.

> **Catatan:** CI membuktikan konsistensi source code dan struktur repository. CI tidak dapat membuktikan deployment Google Apps Script, Google Sheets, Vercel, PDF, atau browser secara nyata tanpa pengujian integrasi/e2e terpisah.

## Menjalankan Secara Lokal

Karena proyek ini bersifat statis, tidak diperlukan build system untuk menjalankan versi dasarnya.

Untuk pengujian logika:

```bash
node tests/run-tests.js
```

Untuk pemeriksaan struktur dan tautan lokal:

```bash
node tests/check-repository.js
```

Untuk penggunaan melalui browser, jalankan proyek menggunakan static server sederhana atau hosting statis seperti GitHub Pages, Vercel, atau Netlify.

## Konfigurasi

Engine utama berada di `js/script.js`. Endpoint dan tautan publik deployment berada di `js/runtime-config.js`.

`runtime-config.js` hanya boleh berisi informasi yang memang aman terlihat oleh publik, seperti URL Web App, Formspree, Saweria, dan nantinya URL publik Account API.

**Jangan pernah menaruh API key, token bot, password, `SPREADSHEET_ID`, atau secret lain di file JavaScript frontend.**

## Backend Google Sheets

Backend utama menyiapkan:

```text
Results
Dimension Scores
Verification
Events
Assessments
Analytics
Config
```

Backend akun menyiapkan:

```text
Accounts
Sessions
Security Events
```

Backend tidak dirancang untuk menyimpan jawaban mentah peserta. Modul akun juga tidak menyimpan password plaintext atau token sesi plaintext.

Mode verifikasi laporan dapat menggunakan signature HMAC-SHA256 jika `TA_VERIFY_SECRET` dikonfigurasi pada Script Properties.

### Account API

Account API dibuat sebagai deployment Google Apps Script terpisah agar backend asesmen utama tetap stabil. Keduanya dapat menunjuk ke Spreadsheet yang sama melalui Script Property `SPREADSHEET_ID`.

Setelah `google-apps-script/account.gs` dideploy sebagai Web App, URL `/exec` deployment diisi ke:

```js
CONFIG.ACCOUNT_API = 'https://script.google.com/macros/s/.../exec';
```

Nilai tersebut bersifat publik sebagai endpoint aplikasi; secret tetap berada di Script Properties.

Detail keamanan tersedia di [`docs/ACCOUNT-SECURITY.md`](docs/ACCOUNT-SECURITY.md).

## Batasan Penting

- Bukan alat diagnosis psikologis.
- Bukan pengganti konsultasi profesional.
- Instrumen saat ini belum diklaim tervalidasi secara psikometrik.
- Skor 0–100 yang digunakan aplikasi bersifat relatif terhadap rentang skala, **bukan persentil populasi**.
- Insight dan rekomendasi bersifat rule-based dan ditujukan untuk eksplorasi, bukan keputusan deterministik mengenai seseorang.
- Google Sheets adalah data store ringan untuk tahap development/pilot, bukan database autentikasi khusus berskala tinggi.
- Modul akun tidak melakukan identifikasi biometrik dan tidak melakukan surveillance terhadap gerakan pengguna.
- Audit aktivitas hanya mencatat event minimum yang diperlukan untuk integritas alur aplikasi.

## Status Pengembangan

Proyek ini masih dalam tahap pengembangan. Lulusnya automated test tidak otomatis berarti seluruh aplikasi telah siap untuk penggunaan produksi. Pengujian browser, mobile, PDF, hosting, integrasi Google Apps Script, keamanan deployment, dan aksesibilitas tetap diperlukan sebelum rilis publik.

## Lisensi

TA Assess dirilis di bawah **MIT License**. Lihat [`LICENSE`](LICENSE).

Lisensi perangkat lunak tidak memberikan hak untuk mengklaim hasil TA Assess sebagai diagnosis, sertifikasi psikologis, atau validasi profesional.

## Pengembang

**Tama Andrea Studio**

TA Assess dibuat sebagai proyek pengembangan perangkat lunak dan eksplorasi teknologi asesmen digital dengan prinsip transparansi terhadap kemampuan, keterbatasan, dan status pengembangan instrumen.
