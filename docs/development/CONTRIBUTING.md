# Contributing to TA Assess

Terima kasih sudah ingin membantu TA Assess. Kontribusi dilakukan melalui GitHub agar perubahan dapat ditinjau sebelum masuk ke `main`.

## Alur kontribusi

1. Buat issue untuk bug, keamanan, dokumentasi, atau usulan fitur.
2. Buat branch dari `main` dengan nama yang jelas, misalnya `fix/mobile-layout` atau `feat/question-bank-filter`.
3. Ubah kode seperlunya dan jangan memasukkan secret.
4. Jalankan pemeriksaan lokal:

```bash
node tests/run-tests.js
node tests/check-repository.js
```

5. Untuk JavaScript yang berubah, jalankan `node --check <file>`.
6. Buka pull request ke `main` dan jelaskan perubahan, risiko, serta cara pengujian.
7. Tunggu CI dan review sebelum merge.

## Aturan penting

- Jangan commit API key, password, session token, Telegram token, `SPREADSHEET_ID`, atau Script Property secret.
- Jangan memasukkan jawaban mentah pengguna atau data pribadi ke issue, log, fixture, atau test.
- Jangan mengubah instrumen menjadi klaim diagnosis atau instrumen tervalidasi tanpa dasar metodologis yang sah.
- Perubahan scoring harus menaikkan `scoringVersion` jika logikanya berubah.
- Perubahan struktur pertanyaan harus mempertahankan versioning question bank.
- Perubahan keamanan harus disertai penjelasan threat model dan pengujian yang relevan.

## Pull request

PR yang menyentuh backend, autentikasi, scoring, question bank, atau keamanan harus menjelaskan:

- file yang berubah;
- alasan perubahan;
- risiko regresi;
- hasil test/CI;
- apakah ada perubahan deployment atau Script Properties.

## Pelaporan kerentanan

Untuk masalah keamanan yang belum dipublikasikan, gunakan kanal keamanan repository bila tersedia dan hindari menaruh detail eksploit pada issue publik. Lihat `docs/SECURITY.md`.
