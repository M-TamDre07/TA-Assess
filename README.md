# TA Assess

TA Assess adalah platform web untuk self-assessment, eksplorasi diri, dan penyajian hasil secara terstruktur.

> TA Assess bukan institusi psikologi, bukan alat diagnosis, dan instrumen yang tersedia saat ini masih berstatus DEMO/PILOT.

## Struktur repository

```text
TA-Assess/
├── index.html                 # entry point utama
├── 404.html                   # halaman error
├── pages/                     # halaman HTML publik tambahan
├── css/                       # stylesheet frontend
├── js/                        # logika dan engine frontend
├── assets/                    # aset statis
├── api/                       # Vercel Functions / API source
│   ├── assessment/            # session, event, submit
│   ├── data/                  # question bank dan data API
│   └── system/                # health/system endpoint
├── backend/                   # integrasi backend eksternal
│   ├── apps-script/           # Google Apps Script
│   └── php/                   # PHP maintenance boundary
├── docs/                      # dokumentasi teknis
│   ├── assessment/
│   ├── development/           # termasuk ARCHITECTURE.md
│   ├── deployment/
│   ├── security/
│   └── testing/
├── tests/                     # pengujian dan repository checks
├── .github/                   # CI, CodeQL, Dependabot, templates
├── vercel.json                # routing/rewrite + security headers
├── package.json               # script Node.js
└── .env.example               # template environment variable tanpa secret
```

## Cara bagian-bagian saling terhubung

```text
pages/*.html + index.html
        │
        ├── css/*
        ├── js/*
        └── assets/*
                │
                ▼
          vercel.json
                │
        ┌───────┴────────┐
        ▼                ▼
     pages/*           api/*
                         │
                         ▼
                 backend/apps-script/*
```

URL publik halaman dan endpoint lama dipertahankan melalui rewrite di `vercel.json`. Karena itu, file sebaiknya tidak dipindahkan sembarangan tanpa memperbarui `href`, `src`, `fetch()`, dan rewrite terkait.

Peta arsitektur yang lebih lengkap tersedia di [`docs/development/ARCHITECTURE.md`](docs/development/ARCHITECTURE.md).

## Runtime

- HTML/CSS/JavaScript untuk frontend.
- Node.js 24 untuk pengujian dan Vercel Functions.
- Google Apps Script + Google Sheets untuk backend data yang sudah digunakan proyek.
- PHP hanya disiapkan sebagai source boundary maintenance; bukan endpoint produksi.

## Backend

Source Apps Script berada di `backend/apps-script/`. Vercel API dikelompokkan di `api/assessment`, `api/data`, dan `api/system`.

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
