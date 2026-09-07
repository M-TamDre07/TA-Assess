# Public Pages

Halaman HTML yang diakses pengguna disimpan di folder ini agar root repository tidak dipenuhi entry point.

## Entry points

- `account.html` — akun dan riwayat
- `account-results.html` — hasil tersimpan
- `account-insights.html` — profil lengkap
- `admin.html` — pintu masuk administrator
- `admin-dashboard.html` — dashboard administrator
- `docs.html` — dokumentasi UI
- `result.html` — hasil asesmen
- `test.html` — pengerjaan asesmen
- `verify.html` — verifikasi laporan

URL publik lama tetap dipertahankan melalui rewrite di `vercel.json`, sehingga pemindahan file tidak mengubah tautan yang sudah digunakan aplikasi.

`index.html` dan `404.html` sengaja tetap di root karena keduanya merupakan entry point khusus untuk static hosting/Vercel.
