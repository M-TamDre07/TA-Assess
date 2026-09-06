# SEO Deployment Guide

TA Assess sudah memiliki metadata description, Open Graph dasar, structured data, favicon, web manifest, `robots.txt`, dan halaman 404.

## Domain final

Sitemap belum ditulis dengan URL absolut karena repository belum menyimpan domain publik Vercel yang terverifikasi. Jangan menebak domain untuk sitemap.

Setelah domain final diketahui, buat `sitemap.xml` berisi URL absolut untuk halaman publik seperti:

- `/`
- `/docs.html`
- `/verify.html`

Jangan memasukkan `/admin`, `/test.html`, API endpoint, atau source code.

## Indexing

1. Pastikan deployment production berhasil.
2. Pastikan domain menggunakan HTTPS.
3. Pastikan `robots.txt` dapat diakses.
4. Submit sitemap pada layanan webmaster/search engine yang digunakan.
5. Uji halaman utama dengan URL inspection setelah deployment.

Tidak ada konfigurasi yang dapat menjamin posisi tertentu pada hasil pencarian. Indexing tetap bergantung pada crawling, kualitas konten, reputasi domain, dan kebijakan mesin pencari.
