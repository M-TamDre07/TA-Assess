# TA Assess — Arsitektur Repository

Dokumen ini menjadi peta hubungan antarbagian repository agar perubahan struktur tidak memutus halaman, API, atau backend.

## 1. Lapisan aplikasi

```text
Browser
  │
  ├── index.html
  │     └── js/* + css/* + assets/*
  │
  ├── pages/*.html
  │     └── js/* + css/* + assets/*
  │
  └── URL publik
         │
         ▼
      vercel.json
         │
         ├── /account  → pages/account.html
         ├── /docs     → pages/docs.html
         ├── /result   → pages/result.html
         ├── /verify   → pages/verify.html
         └── /api/*    → api/*

API layer
  ├── api/assessment/*
  ├── api/data/*
  └── api/system/*
         │
         └── backend/apps-script/* (integrasi data/operasional)
```

## 2. Aturan penempatan file

| Jenis | Lokasi |
|---|---|
| Entry point publik | root (`index.html`, `404.html`) |
| Halaman HTML tambahan | `pages/` |
| CSS global | `css/` |
| JavaScript frontend | `js/` |
| Gambar/SVG/aset | `assets/` |
| Vercel Functions | `api/` |
| Source Google Apps Script | `backend/apps-script/` |
| PHP scaffold/boundary | `backend/php/` |
| Dokumentasi teknis | `docs/` |
| Test dan pemeriksaan repository | `tests/` |
| CI/security automation | `.github/` |

## 3. Prinsip koneksi

1. **Jangan memindahkan file frontend secara manual tanpa memperbarui referensi.** HTML memakai path relatif ke `css/`, `js/`, dan `assets/`.
2. **URL publik halaman dipusatkan di `vercel.json`.** Jika nama file di `pages/` berubah, rewrite terkait harus ikut berubah.
3. **Endpoint API publik menggunakan rewrite.** Source endpoint boleh berada di subfolder `api/assessment`, `api/data`, dan `api/system` tanpa mengubah URL lama yang dipakai frontend.
4. **Secret tidak boleh berada di frontend.** Gunakan environment variable/deployment secret atau Script Properties untuk backend.
5. **Dokumentasi tidak menjadi source runtime.** Folder `docs/` hanya untuk maintainer/contributor, kecuali `pages/docs.html` sebagai halaman dokumentasi publik.
6. **Perubahan besar sebaiknya diuji sebelum merge.** Jalankan `npm test` dan `node tests/check-repository.js`.

## 4. Alur fitur asesmen

```text
Data asesmen
  └── js/assessments-data.js
          │
          ▼
Frontend asesmen
  └── js/script.js + modul frontend terkait
          │
          ├── session/event/submit
          │          │
          │          ▼
          │      api/assessment/*
          │
          └── hasil
                     │
                     ├── pages/result.html
                     ├── js/result-engine.js
                     ├── js/insight-engine.js
                     └── js/recommendation-engine.js

Akun
  └── pages/account*.html
          │
          └── js/account*.js
                   │
                   ▼
              api/assessment/*
```

## 5. Checklist sebelum refactor struktur

- [ ] Cari semua referensi path lama.
- [ ] Perbarui `href`, `src`, `fetch()`, import, dan rewrite Vercel.
- [ ] Pastikan endpoint API lama tetap kompatibel atau diberi rewrite.
- [ ] Jalankan test repository.
- [ ] Periksa halaman utama, asesmen, hasil, akun, admin, dokumentasi, dan verifikasi.
- [ ] Pastikan tidak ada secret yang ikut ter-commit.
