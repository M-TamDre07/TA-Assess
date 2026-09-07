# Panduan Gaya Kode

Dokumen ini menjaga source code TA Assess tetap mudah dibaca, dirawat, dan dipahami kontributor baru.

## Prinsip

- Utamakan kode yang jelas daripada kode yang paling singkat.
- Jangan melakukan refactor besar hanya untuk mengubah gaya penulisan.
- Pertahankan nama fungsi publik dan kontrak API kecuali perubahan memang diperlukan.
- Gunakan komentar untuk menjelaskan alasan atau aturan penting, bukan mengulang kode.
- Hindari menyimpan secret, token, atau kredensial di source code.

## JavaScript dan Apps Script

- Gunakan 2 spasi untuk indentasi.
- Gunakan `const` untuk nilai yang tidak diubah dan `let` bila nilainya memang berubah.
- Gunakan nama variabel yang menjelaskan isi atau perannya.
- Fungsi kecil boleh memakai akhiran `_` bila memang merupakan helper internal Apps Script.
- Kelompokkan konfigurasi, entry point, handler, logika bisnis, helper, lalu utilitas.
- Beri jarak antar fungsi agar blok kode mudah dipindai.
- Hindari satu baris yang memuat terlalu banyak operasi berbeda.

## HTML

- Gunakan struktur HTML semantik jika memungkinkan.
- Pertahankan atribut `id` dan nama fungsi JavaScript yang sudah menjadi bagian dari kontrak halaman.
- Hindari inline JavaScript baru jika tidak diperlukan.
- Untuk Apps Script HTML, file entry tetap menggunakan nama `index.html` agar konsisten dengan konvensi proyek.

## Dokumentasi

Dokumentasi harus menjawab tiga hal: apa fungsi komponen, bagaimana menjalankannya, dan apa yang tidak boleh diubah sembarangan.

Gunakan bahasa yang sederhana. Hindari dokumentasi yang terdengar seperti hasil generator; tulis instruksi yang benar-benar dibutuhkan maintainer.

## Sebelum merge

Jalankan pemeriksaan repository dan syntax check yang tersedia di CI. Untuk perubahan Apps Script, lakukan smoke test di deployment Apps Script sebelum dianggap selesai.
