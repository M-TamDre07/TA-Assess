# TEST REPORT — TA Assess V2

**Tanggal pengujian:** 2026-09-06 05:12 UTC (aktual, dari `date -u`)
**Cara reproduksi:** `node tests/run-tests.js`
**Hasil aktual:** `TOTAL: 40 | PASSED: 40 | FAILED: 0`

Laporan ini hanya mencantumkan apa yang benar-benar diuji dan hasil aslinya. Tidak ada tanggal atau hasil yang dikarang.

## Apa yang diuji secara otomatis (`tests/run-tests.js`)

| # | Yang diuji | Hasil |
|---|---|---|
| 1 | `metadata.items` sama dengan jumlah soal aktual, untuk semua 3 asesmen | PASS |
| 2 | `checkAssessmentData()` tidak menghasilkan error konsistensi data | PASS |
| 3 | Scoring dasar (mean dari jawaban penuh) | PASS |
| 4 | Reverse scoring benar (formula `min+max-score`, skala 1-5: 1↔5, 2↔4, 3=3) | PASS |
| 5 | Jawaban null diabaikan dari perhitungan (bukan dihitung sebagai 0) | PASS |
| 6 | Semua jawaban kosong → `meanScore` null, bukan NaN; `normalizedScore` tetap finite; `rawScore` 0 | PASS |
| 7 | Jawaban di luar rentang (mis. nilai 9 pada skala 1-5) di-skip, tidak menghasilkan NaN | PASS |
| 8 | `classifyScore` selalu menghasilkan salah satu dari low/moderate/high untuk input valid | PASS |
| 9 | `countUnanswered` menghitung jumlah soal kosong dengan akurat | PASS |
| 10 | `generateReportId` menghasilkan ID unik antar-panggilan dengan format konsisten | PASS |
| 11 | `getInterpretation` fallback ke pesan default saat level/guide tidak ditemukan | PASS |
| 12 | Recommendation engine mengembalikan minimal satu saran untuk profil tinggi | PASS |
| 13 | Insight engine menghasilkan ringkasan tanpa bahasa deterministik/diagnostik ("pasti", "diagnosis", "gangguan mental") | PASS |

**Catatan jujur:** test #6 sengaja memicu satu baris `console.error('[TA ASSESS SCORING ERROR] ...')` di stderr saat menjalankan test #7 (input sengaja di luar rentang) — itu adalah perilaku yang **diharapkan** (engine mencatat data invalid), bukan kegagalan.

## Pemeriksaan manual (non-otomatis, dilakukan saat sesi ini)

| Pemeriksaan | Metode | Hasil |
|---|---|---|
| Syntax semua file `.js` | `node --check` per file | Semua OK (6 file) |
| Semua path `href`/`src` di 4 file HTML menunjuk ke file yang benar-benar ada | Skrip shell pencocokan path vs filesystem | Semua OK |
| Struktur dasar HTML (satu `<html>`, `<body>` per file, DOCTYPE ada) | Hitung tag per file | Semua OK (4 file) |

## Yang BELUM diuji (harus dilakukan manual oleh Anda sebelum menganggap "siap pakai")

- Rendering visual di browser sungguhan (Chrome/Firefox/Safari) — sesi ini tidak menjalankan browser.
- Tampilan mobile sungguhan di perangkat fisik.
- Download PDF sungguhan (html2pdf.js dimuat dari CDN — perlu koneksi internet saat digunakan).
- Pengiriman data ke Google Sheets sungguhan (perlu deployment Apps Script milik Anda sendiri, lihat `docs/SETUP.md`).
- Uji aksesibilitas (screen reader, kontras warna) belum dijalankan dengan tools khusus.

## Kesimpulan

Logika inti (scoring, validasi data, ID generation, recommendation, insight) diverifikasi otomatis dan **lulus semua test yang ada**. Ini **tidak sama dengan** "production ready" secara menyeluruh — verifikasi visual/browser dan integrasi eksternal (Google Sheets, hosting) masih perlu pengecekan manual oleh Anda sesuai `docs/SETUP.md`.
