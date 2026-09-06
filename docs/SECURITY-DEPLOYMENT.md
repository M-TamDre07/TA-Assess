# TA Assess Security Deployment

## Lapisan keamanan asesmen

TA Assess menggunakan beberapa lapisan yang memiliki fungsi berbeda:

1. Perlindungan browser untuk mengurangi copy, paste, context menu, shortcut pengembang, pencetakan, perpindahan fokus, dan pembukaan sesi paralel.
2. Pengacakan urutan soal pada setiap sesi.
3. Sesi keamanan bertanda tangan dari Vercel Function.
4. Proxy submission server side untuk meneruskan hasil ke Google Apps Script.
5. Metadata integritas dikirim sebagai indikator teknis, bukan bukti kecurangan.

Perlindungan browser tidak dapat menjamin bahwa seseorang tidak akan mencoba melihat atau merekayasa kode JavaScript. Karena itu sistem harus mengandalkan validasi server untuk operasi penting.

## Secret Vercel

Tambahkan Environment Variable berikut pada Vercel:

```text
TA_ASSESS_SERVER_SECRET
```

Gunakan nilai acak yang panjang. Jangan masukkan nilainya ke GitHub, `runtime-config.js`, HTML, atau JavaScript frontend. Vercel menyediakan Environment Variables untuk secret server side dan perubahan environment variable berlaku setelah deployment berikutnya. citeturn3search0

## Status saat ini

Endpoint security sudah tersedia di:

```text
/api/assessment-session
/api/assessment-submit
```

Jika `TA_ASSESS_SERVER_SECRET` belum dibuat, endpoint mengembalikan status konfigurasi belum siap dan frontend mempertahankan jalur lama agar asesmen tidak langsung rusak.

## Batasan penting

Sistem ini ditujukan untuk meningkatkan integritas asesmen, bukan menjanjikan anti kecurangan absolut. Browser tetap berada di perangkat pengguna. Deteksi perpindahan tab, shortcut, dan kondisi jendela harus diperlakukan sebagai sinyal teknis, bukan keputusan otomatis bahwa pengguna melakukan kecurangan.

## Runtime

Repository dipatok ke Node.js 24.x. Vercel mengumumkan Node.js 20 akan dinonaktifkan untuk deployment baru pada 1 Oktober 2026, sehingga penggunaan Node.js 24 menghindari jalur runtime yang segera deprecated. citeturn3search1
