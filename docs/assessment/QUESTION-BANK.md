# TA Assess Question Bank

## Tujuan

Bank soal dipindahkan ke Google Sheets agar website utama tetap ringan dan tim kontributor dapat menambah atau meninjau item tanpa mengubah file frontend setiap kali ada revisi.

Arsitektur ini memisahkan tiga bagian.

1. Website TA Assess menangani pengalaman peserta.
2. Google Apps Script Question Bank menangani distribusi dan administrasi item.
3. Google Sheets menyimpan bank soal, opsi, katalog instrumen, aturan scoring, dan log perubahan.

## Jenis item

Question Bank mendukung enam bentuk dasar.

1. `likert`
2. `single_choice`
3. `multi_choice`
4. `binary`
5. `yes_no`
6. `essay`

`multi_choice` dipakai untuk bentuk pilihan yang memungkinkan lebih dari satu centang. `essay` disediakan untuk respons terbuka dan belum otomatis diberi skor psikometrik.

## Kunci terbalik dan pasangan konsistensi

Field `reverse` memungkinkan item yang arah skornya berlawanan. Field `pairId` dan `pairRole` menyediakan tempat untuk menandai item yang sengaja dibuat sebagai pasangan konsistensi.

Pola tersebut digunakan untuk mengurangi kecenderungan peserta menjawab secara otomatis. Item tidak boleh dirancang sebagai jebakan yang menyesatkan peserta. Konsistensi respons harus diperlakukan sebagai sinyal kualitas data, bukan sebagai bukti sifat tersembunyi seseorang.

## Status item

`DRAFT` berarti masih dalam penyusunan.

`PILOT` berarti sedang diuji pada tahap awal.

`ACTIVE` berarti sudah dipilih untuk distribusi instrumen yang sesuai.

`ARCHIVED` berarti tidak boleh dikirim lagi oleh API pertanyaan.

## Versi

Setiap item memiliki `version`. Jangan mengubah arti item lama lalu mempertahankan nomor versi yang sama. Jika wording, dimensi, atau aturan scoring berubah secara substantif, buat versi baru.

Report TA Assess harus tetap menyimpan `instrumentVersion` dan `scoringVersion` agar hasil lama dapat ditelusuri.

## Deployment Question Bank

Buat project Google Apps Script terpisah dari backend assessment utama. Tambahkan dua file dari repository.

`google-apps-script/question-bank.gs`

`google-apps-script/question-bank.html`

Gunakan Spreadsheet yang sama dengan backend utama jika memang ingin semua data berada dalam satu workbook.

Set Script Properties berikut.

`SPREADSHEET_ID`

`QUESTION_BANK_ADMIN_KEY`

Jalankan fungsi `doGet` melalui deployment Web App setelah authorization selesai. URL Web App tersebut menjadi nilai publik `CONFIG.QUESTION_BANK_API` pada `js/runtime-config.js`.

Jangan menaruh `QUESTION_BANK_ADMIN_KEY` di GitHub, HTML publik, atau runtime-config.js.

## Sheet yang dibuat otomatis

`Question Bank` menyimpan metadata inti setiap item.

`Question Options` menyimpan bentuk tabular dari opsi pilihan.

`Assessment Catalog` menyimpan metadata instrumen.

`Dimension Catalog` disiapkan untuk daftar dimensi per instrumen.

`Scoring Rules` disiapkan untuk aturan scoring per dimensi.

`Question Change Log` mencatat pembuatan, pembaruan, dan pengarsipan item.

## Panel kontributor

Web App Question Bank menampilkan editor HTML sehingga kontributor tidak perlu mengedit JSON secara manual untuk pekerjaan dasar.

Editor menyediakan field untuk ID item, instrumen, versi, urutan, jenis item, teks, dimensi, kunci terbalik, pasangan konsistensi, tag, opsi, scoring metadata, status, dan catatan.

Operasi tulis meminta `QUESTION_BANK_ADMIN_KEY`. Untuk deployment yang dibuka kepada kontributor, batasi akses Web App pada akun yang memang diperlukan. Admin key adalah lapisan tambahan, bukan pengganti pengaturan akses Google Apps Script.

## Batasan psikometri

Memindahkan soal ke database tidak membuat instrumen menjadi tervalidasi. Jumlah item yang lebih banyak juga tidak otomatis meningkatkan validitas.

Untuk menuju kualitas yang lebih tinggi, item perlu melalui review isi, pilot, analisis distribusi respons, pemeriksaan item discrimination, reliabilitas yang sesuai, evaluasi struktur faktor jika relevan, dan dokumentasi perubahan instrumen.

TA Assess tetap diposisikan sebagai platform self-assessment dan pengembangan instrumen tahap DEMO atau PILOT sampai bukti validitas yang memadai tersedia.
