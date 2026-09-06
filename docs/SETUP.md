# Setup Guide — TA Assess V2

Semua konfigurasi bersifat **opsional**. Platform tetap berjalan penuh (kecuali fitur terkait) tanpa konfigurasi apa pun — tidak ada link palsu yang ditampilkan ke pengguna.

Edit `js/script.js`, bagian `CONFIG`:

```javascript
const CONFIG = {
    GOOGLE_SHEETS_API: '',
    FORMSPREE_LINK: '',
    SAWERIA_LINK: '',
    CONTACT_EMAIL: '',
    TELEGRAM_WEBHOOK_URL: ''
};
```

Jika sebuah field dikosongkan, fitur terkait otomatis disabled dengan tampilan graceful (bukan link rusak).

## 1. Google Sheets (opsional — untuk menyimpan hasil)

1. Buat Google Sheet baru.
2. Buka **Extensions → Apps Script**, hapus isi default, lalu copy-paste seluruh isi `google-apps-script/code.gs` di repo ini.
3. Sesuaikan `SHEET_NAME` di code.gs jika perlu.
4. **Deploy → New deployment → Web app.**
   - Execute as: akun Anda
   - Who has access: Anyone
5. Copy Deployment URL, isi ke `CONFIG.GOOGLE_SHEETS_API`.
6. Test dari console browser:
   ```javascript
   fetch(CONFIG.GOOGLE_SHEETS_API, {
       method: 'POST',
       mode: 'no-cors',
       body: JSON.stringify({ reportId: 'TEST-1', assessmentId: 'PERSONALITY-01' })
   });
   ```
   Lalu cek baris baru muncul di Sheet.

> Endpoint ini **hanya menerima POST** (menulis). Tidak ada endpoint baca publik yang mengekspos seluruh isi Sheet — lihat catatan di `code.gs` jika ingin menambah verifikasi backend nanti.

## 2. Feedback Form (opsional)

Buat form di TypeForm/Formspree, lalu isi URL-nya ke `CONFIG.FORMSPREE_LINK`.

## 3. Saweria (opsional)

Buat halaman donasi di saweria.co, isi URL-nya ke `CONFIG.SAWERIA_LINK`.

## 4. Email Kontak (opsional)

Isi `CONFIG.CONTACT_EMAIL` dengan email Anda.

## 5. Telegram (opsional, arsitektur saja — BELUM diimplementasikan penuh)

Jangan pernah menaruh `TELEGRAM_BOT_TOKEN` di frontend. Jika ingin notifikasi Telegram, buat endpoint backend/Apps Script terpisah yang menyimpan token secara aman (mis. Script Properties di Apps Script), lalu frontend hanya memanggil endpoint tersebut — bukan Telegram API langsung.

## Testing sebelum deploy

```
node tests/run-tests.js
```

Semua test harus lulus. Jika Anda menambah asesmen baru dan test pertama (`metadata.items === jumlah soal aktual`) gagal, perbaiki `items` di `js/assessments-data.js` atau tambah soal yang kurang.

## Deploy

Statis sepenuhnya — bisa langsung diunggah ke GitHub Pages, Vercel, Netlify, atau hosting statis apa pun. Tidak perlu proses build.
