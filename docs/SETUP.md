# TA Assess — Setup Guide

Dokumen ini menjelaskan cara memasang backend Google Apps Script untuk TA Assess. Frontend tetap dapat berjalan tanpa konfigurasi backend, tetapi penyimpanan hasil dan verifikasi lintas-perangkat membutuhkan Google Apps Script Web App.

## 1. Buat Google Spreadsheet

Buat satu Google Spreadsheet khusus untuk TA Assess.

Tidak perlu membuat tabel secara manual. `code.gs` akan membuat dan menata sheet yang diperlukan secara otomatis saat `setupTAAssess()` dijalankan atau ketika endpoint menerima request pertama.

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

## 2. Pasang `code.gs`

1. Buka Spreadsheet.
2. Pilih **Extensions → Apps Script**.
3. Hapus kode default.
4. Copy seluruh isi `google-apps-script/code.gs` dari repository ini.
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

Jika tersedia, `code.gs` menggunakan HMAC-SHA256 untuk signature laporan. Google Apps Script menyediakan `Utilities.computeHmacSha256Signature()` untuk pembuatan signature berbasis kunci. 

Tanpa secret, sistem masih dapat berjalan menggunakan `DEMO-CHECKSUM`, tetapi jangan menganggapnya sebagai tanda tangan anti-pemalsuan produksi.

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

## 5. Hubungkan ke frontend

Buka:

```text
js/script.js
```

Cari:

```javascript
const CONFIG = {
    GOOGLE_SHEETS_API: '',
    FORMSPREE_LINK: '',
    SAWERIA_LINK: '',
    CONTACT_EMAIL: '',
    TELEGRAM_WEBHOOK_URL: ''
};
```

Isi hanya URL Web App milik Anda:

```javascript
GOOGLE_SHEETS_API: 'URL_WEB_APP_ANDA'
```

Jangan isi token Telegram di file ini.

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

Jangan membuat endpoint publik yang mengembalikan seluruh isi `Results` atau `Dimension Scores`.

### Submit result

Frontend mengirim JSON melalui `POST` dengan `action=submitResult`.

Payload minimum:

```json
{
  "action": "submitResult",
  "reportId": "PERSON-ABC123-XYZ99",
  "assessmentId": "PERSONALITY-01",
  "assessmentName": "Big Five Personality — Demo",
  "instrumentVersion": "0.1",
  "scoringVersion": "0.1",
  "reportVersion": "0.1",
  "appVersion": "0.3.0",
  "answersCount": 10,
  "totalQuestions": 10,
  "duration": 180000,
  "status": "DEMO",
  "scores": {
    "Openness": 3.5,
    "Conscientiousness": 4.0
  }
}
```

`dimensionStats` dapat ditambahkan bila frontend ingin menyimpan jumlah item per dimensi.

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
Telegram Bot API
```

Token disimpan di **Script Properties**, bukan di frontend.

## 11. Testing

Jalankan automated test frontend:

```bash
node tests/run-tests.js
```

Kemudian uji backend dengan langkah berikut:

1. Jalankan `setupTAAssess()`.
2. Buka endpoint `action=health`.
3. Pastikan seluruh sheet dibuat.
4. Kirim satu test submission dari frontend.
5. Pastikan satu baris masuk ke `Results`.
6. Pastikan baris dimensi masuk ke `Dimension Scores`.
7. Pastikan metadata masuk ke `Verification`.
8. Buka endpoint `action=verify&reportId=...`.
9. Pastikan status dan signature sesuai.
10. Ulangi dengan Report ID yang sama dan pastikan sistem menolak duplikasi.

## 12. Privacy dan keamanan

Backend hanya menerima data yang dibutuhkan untuk hasil asesmen.

Jangan mengirim:

- NIK
- password
- token API
- nomor kartu
- alamat lengkap
- data sensitif yang tidak diperlukan

Jika suatu saat TA Assess ditingkatkan untuk menyimpan data tambahan, kebijakan privasi harus diperbarui terlebih dahulu.

## 13. Arsitektur ringkas

```text
Frontend
  │
  ├── Assessment Engine
  ├── Scoring Engine
  ├── Result Engine
  └── PDF / QR
          │
          ▼
Google Apps Script Web App
          │
    ┌─────┼───────────────┐
    ▼     ▼       ▼       ▼
 Results  Verify  Events  Analytics
    │
    ▼
Dimension Scores

Opsional:
    └──────────→ Telegram notification
```

Google Apps Script menyediakan `Utilities.computeHmacSha256Signature()` sebagai fungsi HMAC-SHA256 untuk signature berbasis kunci; referensi resmi: Google Apps Script Utilities Service.

## 14. Catatan penting

TA Assess saat ini adalah platform **self-assessment** dan bukan lembaga psikologi. Backend ini menangani penyimpanan, integritas data, verifikasi, dan analitik teknis. Ia tidak menjadikan instrumen otomatis tervalidasi secara psikometrik.
