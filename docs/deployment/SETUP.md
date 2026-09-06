# TA Assess — Setup Guide

Dokumen ini menjelaskan pemasangan backend Google Apps Script untuk TA Assess. Frontend tetap dapat berjalan tanpa backend, tetapi penyimpanan hasil dan verifikasi lintas-perangkat membutuhkan Web App Apps Script.

## 1. Google Spreadsheet

Buat satu Spreadsheet khusus TA Assess. Backend `results-backend.gs` membuat sheet yang dibutuhkan saat `setupTAAssess()` dijalankan.

Sheet utama:

```text
Results
Dimension Scores
Verification
Events
Assessments
Analytics
Config
```

## 2. Results backend

Buka **Extensions → Apps Script**, lalu salin isi:

```text
backend/apps-script/results-backend.gs
```

Jalankan `setupTAAssess()` satu kali dari editor Apps Script untuk authorization dan pembuatan struktur sheet.

## 3. Script Properties

Atur property berikut di **Project Settings → Script Properties**.

### `SPREADSHEET_ID`

Gunakan jika script perlu membuka Spreadsheet secara eksplisit.

### `TA_VERIFY_SECRET`

Secret untuk signature verifikasi laporan. Jangan masukkan nilainya ke GitHub atau frontend.

### `TA_SERVER_SHARED_SECRET`

Wajib untuk submission melalui gateway Vercel. Nilainya harus **sama persis** dengan environment variable Vercel:

```text
TA_ASSESS_SERVER_SECRET
```

Nama berbeda karena runtime berbeda.

### Telegram (opsional)

Jika notifikasi Telegram dipakai, simpan token dan chat ID hanya di Script Properties:

```text
TELEGRAM_ENABLED = false
TELEGRAM_BOT_TOKEN = ...
TELEGRAM_CHAT_ID = ...
```

Notifikasi sebaiknya hanya membawa metadata non-sensitif.

## 4. Deploy Web App

Di Apps Script pilih **Deploy → New deployment → Web app**.

Pengaturan yang digunakan untuk service backend:

- Execute as: **Me**
- Who has access: **Anyone**

Simpan URL `/exec` deployment yang dihasilkan.

## 5. Runtime config

Endpoint publik frontend berada di:

```text
js/runtime-config.js
```

Endpoint Results diisi pada `CONFIG.GOOGLE_SHEETS_API`.

Jangan menaruh API key, password, token bot, `SPREADSHEET_ID`, atau secret di file frontend.

## 6. Service yang terpisah

Source berikut berada dalam folder yang sama di GitHub, tetapi deployment Apps Script-nya tetap terpisah karena masing-masing service memiliki `doGet`/`doPost` sendiri:

```text
backend/apps-script/results-backend.gs
backend/apps-script/account-backend.gs
backend/apps-script/question-bank-backend.gs
backend/apps-script/index.html
```

### Question Bank

Editor Question Bank sekarang memakai nama standar:

```text
backend/apps-script/index.html
```

`question-bank-backend.gs` harus memanggil:

```javascript
HtmlService.createHtmlOutputFromFile('index')
```

Jangan mengembalikan nama `question-bank-editor.html` karena file tersebut sudah tidak digunakan.

### Account

`account-backend.gs` dideploy sebagai Web App Account terpisah. Setelah deployment benar-benar diuji, URL `/exec` dapat diisi pada `CONFIG.ACCOUNT_API`.

Jangan menebak URL deployment.

## 7. Gateway Vercel

Browser memakai gateway berikut untuk alur yang membutuhkan pemeriksaan server:

```text
/api/assessment-session
/api/assessment-submit
/api/assessment-event
/api/question-bank
/api/system-health
```

Gateway submission meneruskan request ke backend Results setelah session dan server proof diperiksa.

## 8. Verification

Endpoint Results menyediakan health check dan verifikasi laporan:

```text
GET <WEB_APP_URL>?action=health
GET <WEB_APP_URL>?action=verify&reportId=REPORT_ID
```

Endpoint verifikasi hanya boleh mengembalikan metadata minimum. Jangan membuat endpoint publik yang mengembalikan seluruh sheet hasil.

## 9. Maintenance

`backend/apps-script/maintenance.gs` menyediakan audit struktur workbook, pemulihan header yang aman, dan pembaruan analytics.

Jalankan fungsi maintenance dari editor Apps Script setelah memastikan Spreadsheet yang digunakan benar.

## 10. PHP boundary

`backend/php/bootstrap.php` hanya scaffold source PHP. Tidak ada endpoint PHP aktif pada struktur ini dan gateway Vercel tetap menggunakan Node.js.

## 11. Checklist

Source check:

```bash
node tests/run-tests.js
node tests/check-repository.js
php -l backend/php/bootstrap.php
```

Deployment check:

1. Buka endpoint `?action=health`.
2. Pastikan backend merespons dengan status sukses.
3. Pastikan `TA_SERVER_SHARED_SECRET` dan `TA_ASSESS_SERVER_SECRET` memiliki nilai yang sama.
4. Jalankan satu asesmen demo.
5. Pastikan hasil masuk ke `Results` dan metadata verifikasi masuk ke `Verification`.
6. Uji halaman `verify.html` menggunakan Report ID.
7. Uji ID palsu dan pastikan backend tidak menganggapnya valid.
8. Uji alur Question Bank melalui `/api/question-bank`.

CI GitHub memeriksa source dan struktur repository. CI bukan pengganti pengujian deployment Vercel, Apps Script, Google Sheets, dan browser secara nyata.
