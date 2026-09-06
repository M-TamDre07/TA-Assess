# TA Assess

[![TA Assess CI](https://github.com/M-TamDre07/TA-Assess/actions/workflows/ci.yml/badge.svg)](https://github.com/M-TamDre07/TA-Assess/actions/workflows/ci.yml)

**TA Assess** adalah platform web untuk **self-assessment**, eksplorasi diri, dan penyajian hasil asesmen terstruktur yang dikembangkan oleh **Tama Andrea Studio**.

> **Status proyek: Development / Pilot**
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
- Panel admin berbasis role dengan listing data, perubahan status akun, pencabutan sesi, penghapusan laporan, dan ekspor data tampilan
- Pusat dokumentasi UI untuk privasi, metodologi, keamanan akun, setup backend, dan kontribusi
- Route `/admin` untuk pintu masuk panel administrator
- SEO metadata, structured data, favicon, web manifest, crawler directives, dan halaman 404
- GitHub issue/PR templates, Dependabot untuk GitHub Actions, dan CodeQL

## Instrumen Saat Ini

| ID | Instrumen | Status | Soal | Struktur |
|---|---|---:|---:|---:|
| `PERSONALITY-01` | Big Five Personality: Eksplorasi 30 Soal | PILOT | 30 | 10 single-choice, 10 essay, 10 multi-choice |
| `CAREER-01` | Eksplorasi Minat Karier | DEMO/PILOT sesuai katalog | mengikuti question bank | mengikuti question bank |
| `LEARNING-01` | Preferensi Belajar | DEMO/PILOT sesuai katalog | mengikuti question bank | mengikuti question bank |

### Catatan metodologi

Instrumen di atas merupakan adaptasi untuk eksplorasi diri. TA Assess **tidak mengklaim** bahwa instrumen tersebut telah divalidasi secara psikometrik, disertifikasi, atau setara dengan instrumen profesional/komersial tertentu.

Informasi metodologi dan batasan penggunaan tersedia di:

- [`docs.html`](docs.html)
- [`docs/ASSESSMENT-METHODOLOGY.md`](docs/ASSESSMENT-METHODOLOGY.md)
- [`docs/PRIVACY.md`](docs/PRIVACY.md)
- [`docs/ACCOUNT-SECURITY.md`](docs/ACCOUNT-SECURITY.md)
- [`docs/SETUP.md`](docs/SETUP.md)
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/REPOSITORY-STRUCTURE.md`](docs/REPOSITORY-STRUCTURE.md) — peta struktur dan checklist maintenance

## Struktur Repository

```text
TA-Assess/
├── .github/                    # CI, CodeQL, template, Dependabot
├── api/                        # Vercel gateway/server functions
├── assets/                     # aset statis
├── css/                        # stylesheet
├── docs/                       # dokumentasi teknis
├── google-apps-script/         # source backend Apps Script
├── js/                         # frontend, engine, account, admin, security
├── tests/                      # repository checks + test engine
├── index.html                  # beranda
├── account.html                # akun/dashboard
├── account-results.html        # hasil tersimpan
├── account-insights.html       # profil lengkap
├── test.html                   # pengerjaan asesmen
├── result.html                 # hasil sementara
├── verify.html                 # verifikasi laporan
├── admin.html                  # pintu masuk admin
├── admin-dashboard.html        # dashboard admin
├── docs.html                   # dokumentasi UI publik
├── 404.html
├── favicon.svg
├── site.webmanifest
├── robots.txt
├── vercel.json
├── README.md
└── LICENSE
```

Lihat [`docs/REPOSITORY-STRUCTURE.md`](docs/REPOSITORY-STRUCTURE.md) untuk peta file yang lebih rinci dan aturan maintenance. Halaman HTML entry point sengaja tetap di root karena dipanggil langsung oleh static hosting/Vercel; memindahkannya ke subfolder tanpa kebutuhan deployment akan meningkatkan risiko path rusak.

`google-apps-script/code.gs`, `account.gs`, dan `question-bank.gs` disimpan sebagai source/version-control. Karena masing-masing memiliki `doGet`/`doPost`, ketiga service tersebut harus dipisahkan secara operasional menjadi Web App/project Apps Script yang berbeda bila semuanya dideploy. Source tetap boleh berada dalam satu folder repository.

## Admin

Pintu masuk publik adalah `/admin`, tetapi URL tersebut **bukan mekanisme autentikasi**. Dashboard memanggil Account API dan backend memeriksa session serta role `ADMIN` sebelum operasi administratif diterima.

Operasi yang tersedia mencakup:

- melihat ringkasan jumlah record;
- melihat daftar sheet yang diizinkan;
- mengubah status akun menjadi `ACTIVE` atau `SUSPENDED`;
- mencabut sesi pengguna;
- menghapus akun dan data laporan terkait;
- menghapus laporan berdasarkan Report ID;
- mengekspor data yang sedang ditampilkan ke CSV;
- membuka Question Bank Admin terpisah.

Jangan memasukkan admin key, password, token, atau Script Property secret ke frontend atau GitHub.

## Quality Checks

Repository memiliki pemeriksaan otomatis untuk mengurangi risiko link/path/config yang rusak:

```bash
node tests/run-tests.js
node tests/check-repository.js
node --check google-apps-script/code.gs
node --check google-apps-script/account.gs
```

GitHub Actions menjalankan pemeriksaan tersebut pada push ke `main` dan pull request ke `main`, termasuk syntax check untuk JavaScript frontend dan source Apps Script. CodeQL melakukan analisis keamanan JavaScript, sedangkan Dependabot memantau GitHub Actions.

`tests/check-repository.js` memeriksa file wajib, referensi lokal `href/src`, keberadaan `runtime-config.js`, pola secret umum di runtime config, konsistensi endpoint backend, wiring halaman verifikasi, admin backend, route `/admin`, dokumentasi UI, dan asset SEO.

> **Catatan:** CI membuktikan konsistensi source code dan struktur repository. CI tidak dapat membuktikan deployment Google Apps Script, Google Sheets, Vercel, PDF, kamera, atau browser secara nyata tanpa pengujian integrasi/e2e terpisah.

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

Untuk penggunaan melalui browser, jalankan proyek menggunakan static server sederhana atau hosting statis seperti Vercel atau Netlify.

## Konfigurasi

Engine utama berada di `js/script.js`. Endpoint dan tautan publik deployment berada di `js/runtime-config.js`.

`runtime-config.js` hanya boleh berisi informasi yang memang aman terlihat oleh publik, seperti URL Web App, Formspree, Saweria, dan URL publik Account API.

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
User Reports
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

## SEO dan Discoverability

Website sekarang memiliki metadata description, Open Graph dasar, structured data `WebApplication`, favicon, web manifest, crawler directives, dan halaman 404. Resource CSS/JS tetap dapat dirayapi agar mesin pencari dapat merender halaman dengan benar.

Sitemap XML sengaja belum ditambahkan sampai domain publik Vercel atau custom domain yang pasti diketahui. Setelah domain final tersedia, tambahkan `sitemap.xml` dengan URL absolut domain tersebut dan submit sitemap ke layanan webmaster yang digunakan.

SEO tidak dapat menjamin posisi hasil pencarian. Discoverability tetap bergantung pada crawling, kualitas konten, reputasi domain, dan proses indexing masing-masing mesin pencari.

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

Proyek ini masih dalam tahap pengembangan. Lulusnya automated test tidak otomatis berarti seluruh aplikasi telah siap untuk penggunaan produksi. Pengujian browser, mobile, PDF, hosting, integrasi Google Apps Script, keamanan deployment, kamera, aksesibilitas, dan SEO indexing tetap diperlukan sebelum rilis publik.

## Lisensi

TA Assess dirilis di bawah **MIT License**. Lihat [`LICENSE`](LICENSE).

Lisensi perangkat lunak tidak memberikan hak untuk mengklaim hasil TA Assess sebagai diagnosis, sertifikasi psikologis, atau validasi profesional.

## Pengembang

**Tama Andrea Studio**
