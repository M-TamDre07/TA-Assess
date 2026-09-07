# Repository Structure

Dokumen ini menjadi peta struktur source TA Assess. Struktur dibuat supaya entry point, frontend, API, backend, dokumentasi, dan pengujian tidak bercampur.

## Root

`index.html` dan `404.html` tetap di root karena merupakan entry point khusus static hosting. Halaman lain berada di `pages/` dan dipetakan kembali ke URL publik melalui `vercel.json`.

## Frontend

- `css/` — stylesheet utama dan responsive test stylesheet.
- `js/` — seluruh logika browser: data asesmen, engine scoring, akun, admin, security, runtime config, dan diagnostics.
- `assets/` — aset statis seperti ilustrasi dokumentasi dan README aset.

## Public pages

`pages/` berisi halaman akun, admin, dokumentasi, pengerjaan asesmen, hasil, dan verifikasi. URL publik lama seperti `/account.html` tetap kompatibel melalui Vercel rewrite.

## API

```text
api/
├── assessment/
│   ├── event.js
│   ├── session.js
│   └── submit.js
├── data/
│   └── question-bank.js
└── system/
    └── health.js
```

API adalah gateway server-side. Secret tidak boleh berada di frontend.

## Backend

```text
backend/
├── apps-script/
│   ├── account-backend.gs
│   ├── results-backend.gs
│   ├── question-bank-backend.gs
│   ├── personality-30-seed.gs
│   ├── maintenance.gs
│   └── index.html
└── php/
    └── bootstrap.php
```

Google Apps Script dipisahkan dari Vercel Functions. PHP hanya menjadi boundary source untuk maintenance dan belum menjadi runtime produksi.

## Documentation

`docs/` dibagi menjadi:

- `assessment/`
- `security/`
- `development/`
- `deployment/`
- `testing/`

## Tests

`tests/` berisi pengujian scoring, insight/recommendation, pemeriksaan struktur repository, dan validasi konfigurasi.

## Prinsip pemeliharaan

1. Jangan mengubah URL publik hanya karena source dipindahkan.
2. Jangan menyimpan secret di GitHub.
3. Perubahan struktur harus diikuti pemeriksaan CI.
4. Source Apps Script dan deployment Web App diperlakukan sebagai dua hal berbeda.
5. Root repository hanya menyimpan entry point dan konfigurasi yang memang perlu berada di root.
