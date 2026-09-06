# TA Assess — Account & Security Design

## Tujuan

TA Assess sekarang menyiapkan modul akun terpisah dari backend asesmen utama. Modul ini memakai Google Apps Script + Google Sheets sebagai data store ringan.

Arsitektur:

```text
Browser
  │
  ├── account.html / js/account.js
  │       │
  │       └── ACCOUNT_API
  │
  └── Assessment UI
          │
          └── Google Apps Script utama

ACCOUNT_API → Accounts / Sessions / Security Events
Main API    → Results / Dimension Scores / Verification / Events / Analytics
```

## Data akun

Sheet `Accounts` menyimpan:

- `userId`
- username dan bentuk normalisasinya
- nama tampilan dan fingerprint nama yang sudah dinormalisasi
- password salt
- password hash/derivation
- waktu pembuatan dan login terakhir
- status akun
- jumlah gagal login
- waktu lock sementara
- versi sesi
- aktivitas terakhir

**Password plaintext tidak disimpan.**

## Password

Backend menggunakan salt unik per akun dan derivasi berulang berbasis SHA-256. Ini meningkatkan biaya brute-force dibanding satu kali SHA-256.

Untuk sistem dengan kebutuhan keamanan lebih tinggi, TA Assess sebaiknya bermigrasi ke penyedia identitas atau database autentikasi khusus yang menyediakan Argon2id/bcrypt/scrypt dan manajemen sesi standar. Jangan menganggap implementasi Google Sheets ini setara dengan layanan identity provider profesional.

## Session

Token sesi:

1. dibuat setelah login berhasil;
2. tidak disimpan sebagai plaintext di Sheet;
3. hanya hash token yang disimpan pada `Sessions`;
4. memiliki masa berlaku 24 jam;
5. dapat dicabut saat logout.

Frontend menyimpan token pada `sessionStorage`, bukan `localStorage`, sehingga sesi lebih terbatas pada tab/browser session.

## Lockout

Lima kegagalan login berturut-turut menyebabkan lock sementara selama 15 menit. Pesan kesalahan login sengaja dibuat generik agar tidak membantu enumerasi password.

## Normalisasi nama

Nama tampilan dinormalisasi untuk:

- Unicode normalization (`NFKC`);
- penghapusan karakter kontrol;
- penggabungan spasi ganda;
- batas panjang;
- fingerprint normalisasi untuk konsistensi internal.

Sistem tidak melakukan identifikasi biometrik dan tidak boleh digunakan untuk menebak identitas seseorang.

## Audit aktivitas

Sheet `Security Events` mencatat event metadata minimum seperti:

- `account_created`
- `login_success`
- `login_failed`
- `logout`
- `assessment_opened`
- `assessment_started`
- `assessment_paused`
- `assessment_resumed`
- `answer_changed`
- `assessment_submitted`
- `result_viewed`

Audit ini **bukan keylogger atau screen/activity surveillance**. Jangan mencatat isi jawaban mentah, password, token, atau data sensitif yang tidak diperlukan.

## Integritas laporan

Backend utama tetap menggunakan HMAC-SHA256 ketika `TA_VERIFY_SECRET` tersedia. Secret tersebut harus berada di Apps Script Script Properties, bukan di frontend. Google Apps Script menyediakan `PropertiesService` untuk penyimpanan konfigurasi script dan utilitas kriptografi untuk digest/HMAC. urlGoogle Apps Script documentationhttps://developers.google.com/apps-script/

## Google Sheets bukan database autentikasi khusus

Google Sheets cocok untuk prototype/pilot TA Assess karena sederhana dan mudah diaudit, tetapi bukan pilihan ideal untuk skala besar atau autentikasi berisiko tinggi. Jika jumlah pengguna meningkat, tahap berikutnya sebaiknya memindahkan autentikasi ke layanan database/identity khusus dan mempertahankan Sheets sebagai export/analytics bila diperlukan.

## Deployment

1. Buat/deploy `google-apps-script/account.gs` sebagai Web App terpisah.
2. Gunakan Spreadsheet yang sama dengan backend utama.
3. Set Script Property `SPREADSHEET_ID` pada project account.
4. Jalankan endpoint health untuk memastikan deployment aktif.
5. Masukkan URL `/exec` deployment ke `CONFIG.ACCOUNT_API` pada `js/runtime-config.js`.
6. Deploy frontend kembali melalui Vercel.

Jangan memasukkan `SPREADSHEET_ID`, password, `TA_VERIFY_SECRET`, Telegram token, atau secret lainnya ke repository publik.
