# TA Assess: Publish Readiness

## Arsitektur yang dipakai

TA Assess tetap memakai frontend statis di Vercel, Vercel Function untuk proxy Question Bank, dan Google Apps Script sebagai backend yang terhubung ke Google Sheets.

Tidak perlu menambahkan Python atau PHP hanya untuk membuat browser sulit menyalin soal. Kontrol keamanan yang penting harus berada di sisi server. Kode browser dapat dilihat oleh peserta, sehingga JavaScript hanya dipakai sebagai lapisan deterrence dan pengumpulan sinyal integritas.

## Mode akun dan tamu

### Akun

Pengguna yang masuk dengan akun mendapatkan:

- penyimpanan ringkasan hasil di backend;
- riwayat beberapa asesmen pada menu Hasil Saya;
- pembukaan kembali hasil yang tersimpan;
- sesi dengan masa berlaku dan idle timeout;
- akses admin hanya bila role server adalah ADMIN.

### Tamu

Mode tamu mendapatkan satu hasil sementara dalam satu sesi browser. Hasil tetap dapat diunduh, tetapi tidak menjadi riwayat akun. Setelah sesi browser berakhir, data hasil yang hanya berada di sessionStorage tidak tersedia lagi.

## Personality 30 item

`google-apps-script/personality-30-seed.gs` menyediakan seed pilot:

- 10 pilihan tunggal;
- 10 esai;
- 10 pilihan majemuk.

Jalankan `seedPersonality30_()` sekali pada project Question Bank setelah file seed ditambahkan. Fungsi tersebut mengarsipkan item PERSONALITY-01 lama, lalu membuat 30 item berstatus PILOT.

Item esai bersifat kualitatif dan tidak dipaksa menjadi skor numerik. Profil angka saat ini menggunakan 20 item pilihan terstruktur. Jangan menyebut hasil ini sebagai instrumen psikologi tervalidasi sebelum proses validasi psikometrik dilakukan.

## Account API

Setelah `account.gs` dideploy sebagai Web App, masukkan URL deployment ke:

`CONFIG.ACCOUNT_API` di `js/runtime-config.js`.

Account backend membuat sheet `User Reports` untuk ringkasan hasil akun dan tidak menyimpan jawaban mentah.

Untuk membuat admin pertama, jalankan fungsi berikut secara manual dari Apps Script editor:

`promoteUserToAdmin('username')`

Jangan memasukkan password, session token, atau admin key ke GitHub.

## Question Bank

Question Bank tetap menggunakan `QUESTION_BANK_ADMIN_KEY` di Script Properties. Panel kontributor yang sudah ada tetap meminta key sebelum operasi tulis.

Halaman `admin.html` hanya merupakan pintu masuk tersembunyi ke panel tersebut. Shortcut publik yang tersedia adalah `Ctrl + Alt + A`. Shortcut bukan mekanisme otorisasi; key backend tetap menjadi pengaman sebenarnya.

## Integritas asesmen

Lapisan yang tersedia sekarang meliputi:

- randomisasi urutan soal melalui proxy Vercel;
- pemblokiran copy, cut, paste, context menu, drag, dan beberapa shortcut browser sebagai deterrence;
- deteksi perpindahan tab atau window blur;
- deteksi keluar fullscreen bila fullscreen digunakan;
- deteksi tab asesmen paralel melalui BroadcastChannel;
- deteksi jawaban sangat cepat;
- audit metadata integritas;
- ringkasan level integritas tanpa mengubah skor asesmen.

Sinyal tersebut **bukan bukti kecurangan**. Browser tidak dapat dipercaya sebagai sumber kebenaran tunggal.

## Checklist sebelum publikasi

1. Deploy Account API.
2. Set `SPREADSHEET_ID` pada Account API.
3. Jalankan `promoteUserToAdmin()` untuk akun administrator.
4. Pastikan `QUESTION_BANK_ADMIN_KEY` hanya berada di Script Properties.
5. Jalankan `seedPersonality30_()`.
6. Pastikan Question Bank mengembalikan tepat 30 item PERSONALITY-01 berstatus PILOT.
7. Isi `CONFIG.ACCOUNT_API`.
8. Uji akun baru, login, logout, riwayat hasil, dan mode tamu.
9. Uji mobile, tablet, dan desktop.
10. Uji copy/paste, pindah tab, dua tab asesmen, dan jawaban terlalu cepat sebagai pengujian integritas.
11. Pastikan tidak ada secret di repository sebelum publikasi.
