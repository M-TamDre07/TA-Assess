# TA Assess — Vercel Publish Readiness

Dokumen ini adalah checklist pemeliharaan sebelum perubahan pada branch `main` dianggap siap dipublikasikan.

## Yang harus lolos

1. `node tests/run-tests.js`
2. `node tests/check-repository.js`
3. `node tests/check-vercel-config.js`
4. Syntax check seluruh `js/*.js`
5. Syntax check seluruh `api/**/*.js`
6. Syntax check seluruh `backend/apps-script/*.gs`
7. `php -l backend/php/bootstrap.php`
8. GitHub Actions CI berstatus hijau.

## Arsitektur Vercel

- Halaman publik tetap berada di `index.html` dan `pages/`.
- Asset frontend berada di `css/`, `js/`, dan `assets/`.
- Vercel Functions berada di `api/`.
- Google Apps Script tetap menjadi backend penyimpanan/akun dan tidak dipindahkan ke Vercel.
- `vercel.json` mempertahankan URL publik lama melalui rewrite agar tautan yang sudah digunakan tidak rusak.

## Runtime dan secret

Node.js dikunci ke `24.x` melalui `package.json`. Secret server seperti `TA_ASSESS_SERVER_SECRET` dan `TA_SERVER_SHARED_SECRET` tidak boleh dimasukkan ke frontend, `vercel.json`, atau repository.

## Health check

Endpoint `/api/system-health` memeriksa backend utama, Question Bank, dan keberadaan konfigurasi secret gateway. Status `degraded` berarti deployment dapat menjawab tetapi salah satu dependensi belum siap; jangan menganggapnya sehat hanya karena HTTP 200.

## Catatan konfigurasi akun

`CONFIG.ACCOUNT_API` tetap kosong sampai Web App `account-backend.gs` benar-benar dideploy dan URL publiknya dikonfirmasi. Jangan mengisi URL perkiraan.

## Pemeliharaan aman

Jangan memindahkan atau menghapus file hanya berdasarkan nama. Audit semua `href`, `src`, `fetch`, script load order, Vercel rewrite, dan test references terlebih dahulu. Perubahan besar sebaiknya dilakukan pada branch maintenance lalu diverifikasi melalui CI sebelum digabungkan ke `main`.
