# Privacy Notice — TA Assess

## Data yang dikumpulkan

- Jawaban kuesioner (angka 1–5), waktu pengerjaan, dan skor hasil hitungan.
- Jika Anda mengaktifkan integrasi Google Sheets (opsional, dikonfigurasi pemilik platform): timestamp, report ID, ID/nama asesmen, versi instrumen & scoring, skor per dimensi, jumlah soal terjawab, durasi, status.

## Data yang TIDAK diminta/dikumpulkan

- NIK, nomor identitas resmi, alamat lengkap, atau dokumen identitas apa pun.
- Nama asli tidak diwajibkan untuk mengerjakan asesmen.

## Di mana data tersimpan

- **sessionStorage** (browser Anda): data hasil untuk keperluan menampilkan halaman hasil & PDF, hilang saat tab ditutup.
- **localStorage** (browser Anda): salinan ringan reportId untuk verifikasi mode DEMO (lihat `ASSESSMENT-METHODOLOGY.md`), hanya field non-sensitif (tidak termasuk jawaban mentah).
- **Google Sheets** (jika dikonfigurasi oleh pemilik platform): lihat kolom pada `google-apps-script/code.gs`.

## Yang tidak pernah kami lakukan

- Menaruh secret/API key/token bot di kode frontend.
- Mengklaim enkripsi tingkat enterprise tanpa implementasi nyata.
- Membagikan jawaban individual ke pihak ketiga di luar yang Anda/pemilik platform konfigurasi sendiri.

## Kontak

Lihat halaman utama untuk kontak (jika sudah dikonfigurasi oleh pemilik platform).
