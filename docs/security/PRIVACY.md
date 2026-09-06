# Privacy Notice — TA Assess

## Data yang dikumpulkan

- Jawaban kuesioner selama sesi dan data hasil hitungan yang diperlukan untuk menampilkan laporan.
- Jika Google Sheets dikonfigurasi, ringkasan hasil, versi instrumen, status, durasi, dan metadata laporan dapat disimpan.
- Selama sesi asesmen, sistem keamanan dapat membuat ID sesi pseudonim dan mencatat event teknis seperti kalibrasi, perpindahan tab, percobaan shortcut, error browser, serta indikator risiko otomasi.

## Kamera dan pemeriksaan wajah

- Kamera hanya digunakan setelah peserta memberikan izin melalui dialog izin kamera dan persetujuan di halaman asesmen.
- Untuk asesmen yang menerapkan kebijakan kamera, kamera tetap aktif selama pengerjaan agar pemeriksaan posisi wajah dapat dilakukan secara lokal secara berkala.
- Preview kamera tidak ditampilkan selama pengerjaan setelah kalibrasi, kecuali browser atau halaman perlu menampilkannya untuk pemeriksaan ulang.
- TA Assess tidak merekam, mengunggah, atau menyimpan frame kamera maupun template biometrik.
- Pemeriksaan wajah lokal, jika didukung browser, hanya digunakan untuk melihat apakah satu wajah berada di area kamera. Sistem tidak melakukan pengenalan identitas.
- Jika peserta tidak memberikan izin kamera, asesmen yang menerapkan kebijakan kamera wajib tidak dapat dimulai.
- Kamera dihentikan ketika sesi halaman berakhir atau meninggalkan halaman.

## Data yang TIDAK diminta/dikumpulkan

- NIK, nomor identitas resmi, alamat lengkap, atau dokumen identitas apa pun.
- Nama asli tidak diwajibkan untuk mengerjakan asesmen.
- Foto, video, atau rekaman suara peserta tidak dikirim sebagai bagian dari pemeriksaan kamera.

## Di mana data tersimpan

- **sessionStorage** (browser Anda): progres dan hasil sementara untuk keperluan sesi, serta hilang sesuai siklus sesi browser.
- **localStorage** (browser Anda): salinan ringan reportId untuk verifikasi mode DEMO bila digunakan, bukan jawaban mentah.
- **Google Sheets** (jika dikonfigurasi oleh pemilik platform): ringkasan hasil, verifikasi, dan event keamanan yang memang dikirim backend.

## Keamanan dan batasan

- Secret/API key/token server tidak ditempatkan di frontend.
- Sesi asesmen menggunakan token bertanda tangan di gateway server.
- Submission hasil dapat diarahkan melalui gateway server sebelum diteruskan ke backend hasil.
- Deteksi bot, anti-copy, deteksi perpindahan tab, fullscreen, kamera, dan sinyal integritas adalah lapisan mitigasi. Tidak ada kontrol browser yang dapat menjamin peserta tidak memanipulasi perangkatnya.
- Metadata keamanan digunakan untuk audit teknis dan tidak boleh diperlakukan sebagai bukti tunggal kecurangan.

## Yang tidak pernah kami lakukan

- Menaruh secret/API key/token bot di kode frontend.
- Mengklaim enkripsi tingkat enterprise tanpa implementasi nyata.
- Mengklaim kamera sebagai sistem identifikasi biometrik.
- Menggunakan event keamanan sebagai diagnosis psikologis atau keputusan otomatis tentang karakter peserta.
- Membagikan jawaban individual ke pihak ketiga di luar yang Anda atau pemilik platform konfigurasi sendiri.

## Komunitas

TA Assess menyediakan komunitas **Mari Refleksi Diri (MRD)** sebagai ruang sosial untuk refleksi dan diskusi. Keanggotaan komunitas tidak diperlukan untuk mengerjakan asesmen.

## Kontak

Lihat halaman utama untuk kontak yang dikonfigurasi oleh pemilik platform.
