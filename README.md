# TA Assess

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
- Demo verification berbasis browser/localStorage
- Rule-based Insight Assistant
- Recommendation engine berbasis aturan
- Integrasi Google Sheets opsional melalui Google Apps Script
- Validasi konsistensi metadata dan jumlah soal

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
├── index.html
├── result.html
├── verify.html
├── css/
│   └── styles.css
├── js/
│   ├── assessments-data.js
│   ├── insight-engine.js
│   ├── recommendation-engine.js
│   ├── result-engine.js
│   ├── script.js
│   └── test-engine.js
├── tests/
│   └── run-tests.js
├── google-apps-script/
│   └── code.gs
├── docs/
│   ├── ASSESSMENT-METHODOLOGY.md
│   ├── PRIVACY.md
│   ├── SETUP.md
│   └── TEST_REPORT.md
├── .gitignore
├── LICENSE
└── README.md
```

> **Catatan:** alur asesmen membutuhkan `test.html`. File tersebut belum terlihat pada branch `main` saat dokumentasi ini diperbarui, sehingga deployment tidak boleh dianggap lengkap sebelum file tersebut tersedia dan diuji.

## Menjalankan Secara Lokal

Karena proyek ini bersifat statis, tidak diperlukan build system untuk menjalankan versi dasarnya.

Untuk pengujian logika:

```bash
node tests/run-tests.js
```

Untuk penggunaan melalui browser, jalankan proyek menggunakan static server sederhana atau hosting statis seperti GitHub Pages, Vercel, atau Netlify.

## Konfigurasi

Konfigurasi frontend berada di `js/script.js` dan sengaja menggunakan placeholder kosong.

**Jangan pernah menaruh API key, token bot, password, atau secret lain di file JavaScript frontend.** Frontend dapat dilihat oleh pengguna.

Google Apps Script untuk penyimpanan opsional tersedia di `google-apps-script/code.gs`.

## Batasan Penting

- Bukan alat diagnosis psikologis.
- Bukan pengganti konsultasi profesional.
- Instrumen saat ini belum diklaim tervalidasi secara psikometrik.
- Skor 0–100 yang digunakan aplikasi bersifat relatif terhadap rentang skala, **bukan persentil populasi**.
- Demo verification berbasis localStorage hanya berlaku pada browser yang menyimpan data tersebut dan bukan sistem verifikasi anti-pemalsuan produksi.
- Insight dan rekomendasi bersifat rule-based dan ditujukan untuk eksplorasi, bukan keputusan deterministik mengenai seseorang.
- Integrasi eksternal seperti Google Sheets, Telegram, feedback, dan donasi harus dikonfigurasi serta diuji secara terpisah.

## Status Pengembangan

Proyek ini masih dalam tahap pengembangan. Lulusnya automated test tidak otomatis berarti seluruh aplikasi telah siap untuk penggunaan produksi. Pengujian browser, mobile, PDF, hosting, integrasi eksternal, keamanan deployment, dan aksesibilitas tetap diperlukan sebelum rilis publik.

## Lisensi

TA Assess dirilis di bawah **MIT License**. Lihat [`LICENSE`](LICENSE).

Lisensi perangkat lunak tidak memberikan hak untuk mengklaim hasil TA Assess sebagai diagnosis, sertifikasi psikologis, atau validasi profesional.

## Pengembang

**Tama Andrea Studio**

TA Assess dibuat sebagai proyek pengembangan perangkat lunak dan eksplorasi teknologi asesmen digital dengan prinsip transparansi terhadap kemampuan, keterbatasan, dan status pengembangan instrumen.
