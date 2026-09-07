# TA Assess

TA Assess adalah platform web untuk self-assessment, eksplorasi diri, dan penyajian hasil secara terstruktur.

> TA Assess bukan institusi psikologi, bukan alat diagnosis, dan instrumen yang tersedia saat ini masih berstatus DEMO/PILOT.

## Struktur repository

```text
TA-Assess/
├── index.html                 # beranda utama
├── 404.html                   # halaman error Vercel
├── pages/                     # halaman HTML publik selain entry point root
├── css/                       # stylesheet
├── js/                        # logika frontend
├── assets/                    # aset statis
├── api/                       # Vercel Functions, dikelompokkan berdasarkan fungsi
├── backend/                   # source Google Apps Script dan boundary PHP
├── docs/                      # dokumentasi teknis terstruktur
├── tests/                     # pengujian otomatis dan integritas repository
├── .github/                   # CI, CodeQL, Dependabot, template kontribusi
├── vercel.json                # rewrite dan security headers
├── package.json               # script Node.js
└── .env.example               # nama environment variable tanpa secret
```

## Runtime

- HTML/CSS/JavaScript untuk frontend.
- Node.js 24 untuk pengujian dan Vercel Functions.
- Google Apps Script + Google Sheets untuk backend data yang sudah digunakan proyek.
- PHP hanya disiapkan sebagai source boundary maintenance; bukan endpoint produksi.

## Backend

Source Apps Script berada di `backend/apps-script/`. Editor Question Bank menggunakan `backend/apps-script/index.html` dan backend memanggil file tersebut dengan nama `index`.

Vercel API dikelompokkan di `api/assessment`, `api/data`, dan `api/system`. Endpoint publik lama dipertahankan melalui rewrite sehingga perubahan struktur source tidak memutus URL aplikasi.

## Dokumentasi

Mulai dari `docs/README.md`. Dokumentasi dikelompokkan menjadi assessment, security, development, deployment, dan testing.

## Pemeriksaan lokal

```bash
npm test
node tests/check-repository.js
```

CI juga memeriksa JavaScript, Vercel Functions, Google Apps Script, dan PHP scaffold.

## Keamanan

Jangan commit secret seperti `TA_ASSESS_SERVER_SECRET`, `TA_SERVER_SHARED_SECRET`, `TA_VERIFY_SECRET`, token bot, password, session token, atau private Spreadsheet ID. Gunakan environment variable Vercel dan Script Properties Google Apps Script.

## Lisensi

MIT License. Lihat `LICENSE`.
