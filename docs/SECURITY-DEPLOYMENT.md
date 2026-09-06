# TA Assess Security Deployment

## Lapisan keamanan asesmen

TA Assess menggunakan beberapa lapisan yang memiliki fungsi berbeda:

1. Pemeriksaan pra-asesmen untuk HTTPS, storage, Web Crypto, komunikasi jaringan, fullscreen, kamera, dan indikator otomasi browser.
2. Persetujuan eksplisit kamera sebelum pemeriksaan kamera lokal.
3. Pemeriksaan posisi wajah secara lokal jika browser menyediakan FaceDetector. Sistem tidak mengenali identitas.
4. Perlindungan browser untuk mengurangi copy, paste, context menu, shortcut pengembang, pencetakan, perpindahan fokus, dan pembukaan sesi paralel.
5. Pengacakan urutan soal pada setiap sesi.
6. Sesi keamanan bertanda tangan dari Vercel Function.
7. Proxy submission server side untuk meneruskan hasil ke Google Apps Script.
8. Google Apps Script memverifikasi `serverProof` sebelum menerima submission ketika `TA_SERVER_SHARED_SECRET` telah dikonfigurasi.
9. Gateway event untuk audit sesi, risiko otomasi, dan error teknis.
10. Metadata integritas dikirim sebagai indikator teknis, bukan bukti kecurangan.

Perlindungan browser tidak dapat menjamin bahwa seseorang tidak akan mencoba melihat atau merekayasa kode JavaScript. Karena itu operasi penting harus divalidasi di server.

## Secret Vercel

Tambahkan Environment Variable berikut pada Vercel:

```text
TA_ASSESS_SERVER_SECRET
```

Gunakan nilai acak yang panjang. Jangan masukkan nilainya ke GitHub, `runtime-config.js`, HTML, atau JavaScript frontend.

## Secret Google Apps Script

Pada Script Properties backend utama tambahkan secret yang **sama persis** dengan secret Vercel:

```text
TA_SERVER_SHARED_SECRET
```

Secret ini digunakan untuk memverifikasi HMAC `serverProof` dari `/api/assessment-submit`. Setelah property dibuat, submission langsung ke URL Google Apps Script tanpa proof akan ditolak.

Tetap gunakan `TA_VERIFY_SECRET` untuk signature laporan publik. Keduanya memiliki fungsi berbeda dan sebaiknya menggunakan secret acak yang kuat.

## Endpoint security

Endpoint berikut digunakan oleh frontend:

```text
/api/assessment-session
/api/assessment-submit
/api/assessment-event
```

`assessment-session` membuat sesi bertanda tangan selama 45 menit dan melakukan pemeriksaan risiko otomasi dasar dari request. `assessment-event` hanya menerima event keamanan yang telah di-allowlist dan membutuhkan sesi yang valid.

## Deteksi robot

Sistem sekarang memiliki indikator server dan browser seperti `navigator.webdriver`, pola user agent otomasi, header request yang tidak lazim, dan sinyal kalibrasi. Hasilnya dicatat sebagai **bot risk**, bukan klaim pasti bahwa peserta adalah robot.

Untuk tingkat anti-bot yang lebih tinggi pada deployment publik, integrasikan challenge anti-bot server side seperti Cloudflare Turnstile atau layanan setara. Jangan menaruh secret challenge di frontend.

## Kamera

Kamera adalah lapisan integritas yang membutuhkan izin eksplisit. Preview dihentikan setelah pemeriksaan dan frame tidak dikirim ke server. Pemeriksaan wajah lokal tidak digunakan untuk identifikasi seseorang.

Jika kebijakan asesmen nantinya berubah dan kamera tidak lagi diperlukan, `CAMERA_REQUIRED` pada `js/assessment-calibration.js` dapat diubah menjadi `false` setelah kebijakan privasi dan consent diperbarui.

## Diagnostik bug

`js/client-diagnostics.js` menangkap error JavaScript, unhandled promise rejection, dan kegagalan resource. Event dikirim melalui gateway keamanan setelah sesi valid. Tidak ada jawaban asesmen atau frame kamera yang dikirim oleh diagnostik.

## Batasan penting

Sistem ini ditujukan untuk meningkatkan integritas asesmen, bukan menjanjikan anti kecurangan absolut. Browser tetap berada di perangkat pengguna. Deteksi perpindahan tab, shortcut, kamera, dan otomasi harus diperlakukan sebagai sinyal teknis, bukan keputusan otomatis bahwa pengguna melakukan kecurangan.

## Kredibilitas dan lisensi laporan

Status validasi instrumen tetap harus mengikuti proses review dan validasi bersama pihak yang memiliki kompetensi psikologi. Sistem keamanan tidak membuat instrumen menjadi tervalidasi secara psikometrik.

Ketentuan lisensi laporan PDF yang lebih kuat dapat dimasukkan setelah pihak kolaborator memberikan teks lisensi final. Jangan mengklaim lisensi atau sertifikasi yang belum benar-benar diberikan.
