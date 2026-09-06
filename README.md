# TA Assess V2 — Dokumentasi Proyek

## Overview

TA Assess adalah platform web untuk asesmen mandiri (self-assessment) berbasis kuesioner Likert. Platform ini **bukan** lembaga psikologi dan hasilnya **bukan diagnosis**. Semua instrumen berstatus DEMO atau PILOT — lihat `ASSESSMENT-METHODOLOGY.md`.

## Fitur yang benar-benar bekerja

- Katalog asesmen, detail per instrumen, alur consent → soal → hasil
- Scoring engine dengan validasi rentang jawaban, reverse scoring, null-safe (tidak pernah NaN/Infinity)
- Validasi jawaban belum lengkap (tidak bisa submit jika masih ada soal kosong)
- Autosave progres per sesi browser (sessionStorage) + tawaran resume
- Report ID tunggal & konsisten dipakai di seluruh alur (hasil, PDF, QR, penyimpanan verifikasi demo, payload Google Sheets)
- PDF report (via html2pdf.js, CDN)
- QR code (via api.qrserver.com, tanpa API key)
- Verifikasi laporan mode **DEMO** (localStorage, satu browser — lihat ASSESSMENT-METHODOLOGY.md)
- Insight Assistant rule-based (Level 1, tanpa API key)
- Recommendation engine berbasis rule config, terpisah dari kode UI
- Integrasi Google Sheets opsional lewat `google-apps-script/code.gs` (nonaktif otomatis jika belum dikonfigurasi)
- Data validation otomatis (`checkAssessmentData()`) yang mendeteksi ketidakcocokan metadata vs soal aktual

## Fitur yang masih DEMO / belum lengkap

- Jumlah soal per instrumen jauh dari jumlah ideal produksi (lihat tabel di bawah) — metadata sudah disesuaikan agar **jujur** (metadata = jumlah soal aktual), bukan mengklaim jumlah yang tidak ada.
- Verifikasi laporan hanya berjalan di browser yang sama (localStorage), belum ada backend lintas-perangkat.
- Belum ada data normatif — semua skor bersifat relatif dalam asesmen itu sendiri, bukan persentil nasional.
- Integrasi Telegram baru berupa placeholder konfigurasi (butuh backend/Apps Script terpisah, tidak diimplementasikan penuh karena token bot tidak boleh berada di frontend).
- Level 3 Insight Assistant (external AI API) belum diimplementasikan — sengaja, karena MVP tidak boleh bergantung pada API key.

## Instrumen saat ini

| ID | Nama | Status | Jumlah Soal | Dimensi |
|---|---|---|---|---|
| PERSONALITY-01 | Big Five Personality — Demo | DEMO | 10 | 5 |
| CAREER-01 | Career Interest Exploration — Demo | DEMO | 6 | 6 |
| LEARNING-01 | Learning Preferences — Demo | PILOT | 4 | 4 |

## Cara menambah asesmen baru

1. Tambahkan entri di `assessments` (`js/assessments-data.js`) dengan semua field wajib: `developmentStatus`, `validationStatus`, `instrumentVersion`, `scoringVersion`, `lastUpdated`, `items` (harus sama dengan jumlah soal), `intendedUse`, `excludedUse`.
2. Tambahkan soal di `questionsDatabase[ASSESSMENT_ID]`.
3. Tambahkan konfigurasi di `scoringConfiguration[ASSESSMENT_ID]` (dimensions + thresholds).
4. (Opsional) Tambahkan interpretasi di `interpretationGuides[ASSESSMENT_ID]` — jika tidak ada, sistem otomatis menampilkan fallback "Interpretasi belum tersedia".
5. Jalankan `node tests/run-tests.js` — test pertama akan gagal jika `items` tidak cocok dengan jumlah soal aktual.

## Keterbatasan (jangan disembunyikan ke pengguna)

- Bukan instrumen psikologi tervalidasi/tersertifikasi.
- Bukan pengganti konsultasi profesional.
- Skor relatif, bukan skor ternormalisasi terhadap populasi.
- Verifikasi laporan mode DEMO, bukan sistem anti-pemalsuan.
- Insight Assistant adalah rule-based sederhana, bukan model AI yang "memahami" pengguna.

## Testing

```
node tests/run-tests.js
```

Lihat `docs/TEST_REPORT.md` untuk hasil aktual terakhir.
