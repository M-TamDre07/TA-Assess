# Struktur Repository TA Assess

Dokumen ini menjadi peta singkat repository agar perubahan kode tidak salah menaruh file atau memutus path deployment.

## Struktur utama

```text
TA-Assess/
├── api/                         # Vercel Functions / gateway Node.js
│   ├── assessment-session.js
│   ├── assessment-submit.js
│   ├── assessment-event.js
│   ├── question-bank.js
│   └── system-health.js
├── backend/
│   ├── apps-script/             # Source Google Apps Script
│   │   ├── index.html           # Editor Question Bank
│   │   ├── results-backend.gs
│   │   ├── account-backend.gs
│   │   ├── question-bank-backend.gs
│   │   ├── personality-30-seed.gs
│   │   └── maintenance.gs
│   └── php/
│       └── bootstrap.php        # Boundary PHP, belum menjadi endpoint
├── assets/                      # Aset gambar/SVG statis
├── css/                         # Stylesheet
├── docs/                        # Dokumentasi teknis
├── js/                          # Frontend, engine, akun, admin, security
├── tests/                       # Pemeriksaan repository dan engine
├── index.html                   # Beranda
├── test.html                    # Pengerjaan asesmen
├── result.html                  # Hasil asesmen
├── verify.html                  # Verifikasi laporan
├── account.html                 # Akun
├── account-results.html
├── account-insights.html
├── admin.html
├── admin-dashboard.html
├── docs.html
├── 404.html
├── vercel.json
├── README.md
└── LICENSE
```

## Aturan penempatan

- HTML entry point utama tetap di root karena dipanggil langsung oleh static hosting/Vercel.
- `api/` hanya untuk fungsi server-side yang dijalankan Vercel.
- Source Apps Script disimpan di `backend/apps-script/`. File-file ini tetap harus dideploy sebagai project Apps Script terpisah jika memiliki `doGet`/`doPost` sendiri.
- `backend/apps-script/index.html` adalah file HTMLService untuk editor Question Bank. Apps Script memanggilnya dengan `createHtmlOutputFromFile('index')`.
- `backend/php/` hanya boundary source PHP. Jangan menambahkan route PHP ke Vercel hanya demi mengaktifkannya.
- `runtime-config.js` hanya berisi endpoint dan link publik. Secret tetap berada di environment variable Vercel atau Script Properties Apps Script.

## Alur backend

```text
Browser
  │
  ├── /api/assessment-session
  ├── /api/assessment-submit ──────> Apps Script Results
  ├── /api/assessment-event ───────> Apps Script Results
  └── /api/question-bank ──────────> Apps Script Question Bank

Google Apps Script
  ├── Results + Verification
  ├── Account + Admin
  └── Question Bank + Editor
```

Submission hasil tidak seharusnya melewati Apps Script Results secara langsung dari browser. Gateway Vercel membuat sesi, memeriksa sesi, membuat server proof, lalu meneruskan payload ke backend hasil.

## Question Bank

Question Bank adalah service terpisah dari backend hasil. Browser memakai gateway `/api/question-bank`, sedangkan editor berjalan sebagai HTMLService di project Apps Script Question Bank.

Nama file editor sekarang dibuat sederhana: `index.html`. Ini hanya berlaku untuk folder `backend/apps-script/`; `index.html` di root tetap menjadi beranda TA Assess.

## Account API

`account-backend.gs` merupakan service Apps Script terpisah. `CONFIG.ACCOUNT_API` tidak boleh diisi dengan URL tebakan. Isi hanya setelah Web App Account benar-benar dideploy dan diuji.

## PHP

PHP disiapkan sebagai boundary source untuk kebutuhan pengembangan berikutnya. Saat ini PHP tidak dipakai sebagai runtime aplikasi dan tidak mengubah routing Vercel.

## Checklist maintenance

1. Periksa path file dan referensi `href`/`src`.
2. Pastikan endpoint Apps Script yang dipakai gateway adalah deployment yang benar.
3. Pastikan `TA_ASSESS_SERVER_SECRET` di Vercel dan `TA_SERVER_SHARED_SECRET` di Apps Script memiliki nilai yang sama.
4. Pastikan secret tidak pernah masuk ke repository.
5. Periksa Question Bank dan fallback lokal sebelum mengubah jumlah soal.
6. Jalankan `node tests/check-repository.js`.
7. Jalankan `node tests/run-tests.js`.
8. Periksa GitHub Actions setelah commit.
9. Setelah deployment, cek health endpoint dan uji alur browser secara nyata.

CI hanya memeriksa source dan struktur repository. CI bukan bukti bahwa deployment Apps Script, Vercel, Google Sheets, atau browser e2e sudah berhasil.
