# TA Assess V2

Platform web self-assessment (eksplorasi diri) — ringan, mobile-first, tanpa backend wajib untuk berjalan secara demo.

**Status proyek: DEMO / PILOT.** Belum ada instrumen yang divalidasi secara psikometrik. Lihat `docs/ASSESSMENT-METHODOLOGY.md`.

## Mulai cepat

1. Buka `index.html` langsung di browser, atau jalankan local server: `python3 -m http.server` lalu buka `http://localhost:8000`.
2. Baca `docs/SETUP.md` untuk mengisi konfigurasi (Google Sheets, feedback form, dll — semuanya opsional, platform tetap berjalan tanpa itu).
3. Jalankan test otomatis: `node tests/run-tests.js`.

## Dokumentasi lengkap

- `docs/README.md` — arsitektur, struktur file, cara menambah asesmen
- `docs/SETUP.md` — konfigurasi Google Sheets / feedback / donasi
- `docs/ASSESSMENT-METHODOLOGY.md` — batasan, versioning, status validasi, arsitektur verifikasi
- `docs/PRIVACY.md` — data apa yang dikumpulkan (dan tidak)
- `docs/TEST_REPORT.md` — hasil pengujian aktual (bukan klaim tanpa bukti)

## Struktur folder

```
ta-assess/
├── index.html / test.html / result.html / verify.html
├── css/styles.css
├── js/
│   ├── assessments-data.js      # data + validasi konsistensi
│   ├── script.js                # config, scoring engine, ID generator
│   ├── test-engine.js           # alur pengerjaan soal
│   ├── result-engine.js         # tampilan hasil & PDF
│   ├── recommendation-engine.js # rule-based, terpisah dari UI
│   └── insight-engine.js        # Insight Assistant rule-based (Level 1)
├── google-apps-script/code.gs   # backend opsional untuk Google Sheets
├── tests/run-tests.js           # automated test (node tests/run-tests.js)
└── docs/
```

© Tama Andrea Studio
