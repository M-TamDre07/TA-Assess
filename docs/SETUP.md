# TA Assess — Setup Guide

Dokumen ini menjelaskan cara memasang backend Google Apps Script untuk TA Assess. Frontend tetap dapat berjalan tanpa konfigurasi backend, tetapi penyimpanan hasil dan verifikasi lintas-perangkat membutuhkan Google Apps Script Web App.

## 1. Buat Google Spreadsheet

Buat satu Google Spreadsheet khusus untuk TA Assess.

Tidak perlu membuat tabel secara manual. `results-backend.gs` akan membuat dan menata sheet yang diperlukan secara otomatis saat `setupTAAssess()` dijalankan atau ketika endpoint menerima request pertama.

Sheet yang akan dibuat:

| Sheet | Fungsi |
|---|---|
| `Results` | Satu baris untuk setiap laporan/hasil asesmen |
| `Dimension Scores` | Satu baris untuk setiap dimensi skor agar mudah dianalisis/filter |
| `Verification` | Metadata laporan untuk verifikasi publik |
| `Events` | Audit/event log non-sensitif |
| `Assessments` | Registry instrumen yang pernah digunakan |
| `Analytics` | Snapshot statistik umum |
| `Config` | Informasi konfigurasi backend |

Header, freeze row, filter, dan penyesuaian kolom dibuat otomatis.

## 2. Pasang `results-backend.gs`

1. Buka Spreadsheet.
2. Pilih **Extensions → Apps Script**.
3. Hapus kode default.
4. Copy seluruh isi `backend/apps-script/results-backend.gs` dari repository ini.
5. Save project.

Karena script digunakan sebagai Web App, jalankan `setupTAAssess()` satu kali dari editor Apps Script agar Google meminta authorization dan semua sheet dapat dipastikan terbentuk.

## 3. Script Properties

Buka **Project Settings → Script Properties**.

### `SPREADSHEET_ID`

Opsional bila Apps Script benar-benar bound ke Spreadsheet yang sama.

Bila Anda ingin script membuka Spreadsheet secara eksplisit, isi:

```text
SPREADSHEET_ID = ID_SPREADSHEET_ANDA
```

### `TA_VERIFY_SECRET`

Sangat disarankan untuk mode verifikasi backend.

Gunakan string rahasia yang panjang dan acak. Jangan masukkan secret ini ke repository GitHub atau file frontend.

Jika tersedia, `results-backend.gs` menggunakan HMAC-SHA256 untuk signature laporan. Google Apps Script menyediakan `Utilities.computeHmacSha256Signature()` untuk pembuatan signature berbasis kunci.

Tanpa secret, sistem masih dapat berjalan menggunakan `DEMO-CHECKSUM`, tetapi jangan menganggapnya sebagai tanda tangan anti-pemalsuan produksi.

### `TA_SERVER_SHARED_SECRET`

Wajib untuk alur submission yang melewati gateway Vercel.

Nilainya harus **sama persis** dengan nilai Vercel environment variable `TA_ASSESS_SERVER_SECRET`. Nama property berbeda karena masing-masing runtime memiliki namespace konfigurasi sendiri.

Jangan pernah memasukkan nilai aslinya ke `.env.example`, source code, GitHub, atau frontend.

### Telegram (opsional)

```text
TELEGRAM_ENABLED = false
TELEGRAM_BOT_TOKEN = <isi di Script Properties>
TELEGRAM_CHAT_ID = <isi di Script Properties>
```

Jika diaktifkan, notifikasi hanya mengirim metadata non-sensitif seperti Report ID, nama assessment, status, dan waktu. Token tidak pernah diletakkan di JavaScript frontend.

## 4. Deploy sebagai Web App

Di Apps Script pilih:

**Deploy → New deployment → Web app**

Pengaturan:

- **Execute as:** Me
- **Who has access:** Anyone

Setelah deployment, copy URL Web App yang diberikan Google.

Contoh bentuk URL biasanya berakhir dengan `/exec`.

## 5. Hubungkan endpoint ke frontend

Konfigurasi publik dipusatkan pada:

```text
js/runtime-config.js
```

Isi hanya URL Web App dan tautan publik lain yang memang aman dilihat pengguna:

```javascript
CONFIG.GOOGLE_SHEETS_API = 'URL_WEB_APP_ANDA';
```

Halaman `index.html`, `test.html`, `result.html`, dan `verify.html` memuat runtime config tersebut. Karena URL Web App memang harus diketahui browser untuk melakukan request, endpoint bukan secret.

**Jangan pernah menaruh API key, `TELEGRAM_BOT_TOKEN`, password, atau secret di frontend.**

## 6. Endpoint yang tersedia

### Health check

```text
GET <WEB_APP_URL>?action=health
```

Mengembalikan versi backend, timestamp, mode verifikasi, dan daftar sheet.

### Verification

```text
GET <WEB_APP_URL>?action=verify&reportId=REPORT_ID
```

Endpoint hanya mengembalikan metadata minimum untuk satu laporan.

Halaman `verify.html` menggunakan endpoint ini secara langsung. Jika backend belum dapat dihubungi, halaman menampilkan status error dan tidak berpura-pura bahwa laporan terverifikasi.

Jangan membuat endpoint publik yang mengembalikan seluruh isi `Results` atau `Dimension Scores`.

### Submit result

Frontend mengirim JSON melalui `POST` dengan `action=submitResult`. Pada jalur aktif, request melewati Vercel gateway terlebih dahulu sehingga server proof dapat diperiksa oleh backend Apps Script.

Jawaban mentah tidak disimpan oleh backend ini.

## 7. Smart Insight dan algoritma

Backend menyediakan **rule-based Smart Insight**, bukan model AI yang mendiagnosis pengguna.

Statistik yang dihitung:

- mean
- median
- standard deviation
- minimum
- maksimum
- range
- top dimension
- top score
- completion rate
- average response time

Skor 0–100 yang dihitung untuk dimensi adalah normalisasi relatif terhadap skala 1–5. Itu **bukan persentil populasi nasional**.

Jangan menggunakan angka ini untuk mengklaim norma psikologis tanpa data normatif yang sah.

## 8. Verification dan status laporan

Mode verifikasi ditampilkan sebagai:

- `BACKEND-SIGNED` — jika `TA_VERIFY_SECRET` tersedia.
- `DEMO-CHECKSUM` — jika secret belum tersedia.

Status laporan yang didukung:

- `DEMO`
- `PILOT`
- `VALID`
- `REVOKED`

`VALID` tidak boleh digunakan hanya karena sistem teknis berjalan. Status instrumen harus memiliki dasar metodologis/profesional yang sesuai.

## 9. Revoke laporan

Admin dapat menjalankan fungsi berikut dari editor Apps Script:

```javascript
revokeReport('REPORT_ID', 'Alasan pembatalan');
```

Fungsi ini memperbarui status di `Verification`, mencatat event, dan memperbarui `Analytics`.

Jangan mengekspos fungsi revoke sebagai endpoint publik.

## 10. Telegram

Telegram hanya digunakan sebagai notifikasi opsional.

Arsitektur:

```text
TA Assess
   ↓
Google Apps Script
   ↓
Google Sheets
   └──→ Telegram (opsional, metadata non-sensitif)
```

Token bot dan chat ID hanya berada di Script Properties.

## 11. Account dan Question Bank

`account-backend.gs` dan `question-bank-backend.gs` adalah service terpisah secara operasional. Meskipun source berada di folder yang sama, masing-masing deployment Web App harus memiliki project Apps Script sendiri agar `doGet`/`doPost` tidak saling bertabrakan.

`question-bank-editor.html` digunakan sebagai editor di project Question Bank. Mutasi Question Bank tetap membutuhkan admin key yang disimpan di Script Properties.

## 12. PHP boundary

`backend/php/bootstrap.php` hanya merupakan scaffold source PHP untuk menjaga struktur repository tetap siap dikembangkan. Tidak ada endpoint PHP yang aktif pada maintenance ini dan Vercel gateway tetap menggunakan Node.js.

## 13. Checklist setelah deployment

Jalankan pemeriksaan source dari repository:

```bash
node tests/run-tests.js
node tests/check-repository.js
php -l backend/php/bootstrap.php
```

Kemudian uji deployment secara nyata:

1. Buka `<WEB_APP_URL>?action=health`.
2. Pastikan response `success: true`.
3. Pastikan daftar sheet sesuai dengan struktur backend.
4. Pastikan `verificationMode` menjadi `BACKEND-SIGNED` setelah `TA_VERIFY_SECRET` diatur.
5. Pastikan `submissionSecurity` menjadi `REQUIRED` setelah `TA_SERVER_SHARED_SECRET` diatur.
6. Pastikan nilai `TA_SERVER_SHARED_SECRET` di Apps Script sama persis dengan `TA_ASSESS_SERVER_SECRET` pada Vercel.
7. Jalankan satu asesmen demo dari website.
8. Pastikan satu record masuk ke `Results` dan metadata verifikasi masuk ke `Verification`.
9. Buka halaman verifikasi menggunakan Report ID tersebut.
10. Uji ID palsu dan pastikan statusnya `NOT_FOUND`.
11. Uji QR pada laporan dan pastikan menuju `verify.html?id=...`.

CI GitHub memeriksa struktur source dan link/path lokal secara otomatis. CI **tidak** menggantikan pengujian deployment Google Apps Script, Google Sheets, Vercel, browser, PDF, dan QR secara langsung.
