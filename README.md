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
- [`docs/SETUP.md`](docs/SETUP.md)

## Struktur Repository

```text
TA-Assess/
├── .github/
│   └── workflows/
│       └── ci.yml
├── index.html
├── test.html
├── result.html
├── verify.html
├── css/
│   └── styles.css
├── js/
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
│   └── code.gs
├── docs/
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

`google-apps-script/code.gs` disimpan di repository sebagai **source/version-control**. Kode yang dieksekusi tetap berada pada project Google Apps Script yang terhubung dengan Spreadsheet.

## Quality Checks

Repository sekarang memiliki pemeriksaan otomatis untuk mengurangi risiko link/path/config yang rusak:

```bash
node tests/run-tests.js
node tests/check-repository.js
node --check google-apps-script/code.gs
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

`runtime-config.js` hanya boleh berisi informasi yang memang aman terlihat oleh publik, seperti URL Web App, Formspree, dan Saweria.

**Jangan pernah menaruh API key, token bot, password, atau secret lain di file JavaScript frontend.**

Backend Google Apps Script tersedia di `google-apps-script/code.gs`. File tersebut adalah source code/version-control untuk backend, bukan file yang dijalankan langsung oleh GitHub Pages/Vercel.

## Backend Google Sheets

Google Apps Script menyiapkan beberapa sheet secara otomatis untuk memisahkan fungsi data:

```text
Results
Dimension Scores
Verification
Events
Assessments
Analytics
Config
```

Backend tidak dirancang untuk menyimpan jawaban mentah peserta. Data yang dikirim berfokus pada metadata asesmen dan skor dimensi yang diperlukan untuk hasil serta analitik teknis.

Mode verifikasi dapat menggunakan signature HMAC-SHA256 jika `TA_VERIFY_SECRET` dikonfigurasi pada Script Properties.

## Batasan Penting

- Bukan alat diagnosis psikologis.
- Bukan pengganti konsultasi profesional.
- Instrumen saat ini belum diklaim tervalidasi secara psikometrik.
- Skor 0–100 yang digunakan aplikasi bersifat relatif terhadap rentang skala, **bukan persentil populasi**.
- Insight dan rekomendasi bersifat rule-based dan ditujukan untuk eksplorasi, bukan keputusan deterministik mengenai seseorang.
- Integrasi Google Sheets, Telegram, feedback, dan donasi harus dikonfigurasi serta diuji secara terpisah.
- URL Web App Google Apps Script bersifat publik sebagai endpoint aplikasi; secret backend tidak boleh dimasukkan ke frontend.

## Status Pengembangan

Proyek ini masih dalam tahap pengembangan. Lulusnya automated test tidak otomatis berarti seluruh aplikasi telah siap untuk penggunaan produksi. Pengujian browser, mobile, PDF, hosting, integrasi Google Apps Script, keamanan deployment, dan aksesibilitas tetap diperlukan sebelum rilis publik.

## Lisensi

TA Assess dirilis di bawah **MIT License**. Lihat [`LICENSE`](LICENSE).

Lisensi perangkat lunak tidak memberikan hak untuk mengklaim hasil TA Assess sebagai diagnosis, sertifikasi psikologis, atau validasi profesional.

## Pengembang

**Tama Andrea Studio**

TA Assess dibuat sebagai proyek pengembangan perangkat lunak dan eksplorasi teknologi asesmen digital dengan prinsip transparansi terhadap kemampuan, keterbatasan, dan status pengembangan instrumen.
