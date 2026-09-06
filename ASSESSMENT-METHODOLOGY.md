# Metodologi & Batasan Asesmen — TA Assess

## 1. Ini bukan diagnosis

Seluruh hasil pada platform ini adalah hasil **self-assessment** (asesmen mandiri). Tidak ada bagian dari platform ini yang menghasilkan diagnosis psikologis, psikiatris, atau medis apa pun. TA Assess bukan lembaga psikologi dan tidak mengklaim afiliasi dengan HIMPSI, APA, ISO, atau badan sertifikasi mana pun.

## 2. Status pengembangan instrumen

Setiap instrumen memiliki dua status independen:

- **developmentStatus**: `DEMO` (versi contoh, soal jauh lebih sedikit dari rencana final) atau `PILOT` (sedang diujicoba terbatas).
- **validationStatus**: saat ini semua instrumen berstatus `Not validated` — belum ada bukti validitas/reliabilitas psikometrik (uji validitas konstruk, reliabilitas internal, dsb).

Status ini ditampilkan di UI (katalog & detail asesmen) dan di laporan PDF, bukan disembunyikan.

## 3. Prinsip & referensi yang digunakan sebagai pedoman desain (bukan klaim sertifikasi)

Struktur data, versioning, dan prinsip scoring pada proyek ini mengacu pada gagasan umum di:

- AERA/APA/NCME *Standards for Educational and Psychological Testing* (sebagai pedoman praktik baik, bukan klaim kepatuhan penuh)
- ITC *Guidelines for Technology-Based Assessment*

Mengacu pada prinsip-prinsip ini **tidak** berarti instrumen telah divalidasi sesuai standar tersebut.

## 4. Bahasa interpretasi

Semua interpretasi memakai bahasa probabilistik dan relatif ("hasil menunjukkan kecenderungan relatif lebih tinggi..."), bukan bahasa absolut ("Anda pasti...", "Anda cocok menjadi..."). Ini berlaku untuk Big Five, RIASEC, dan Learning Preferences.

## 5. Skor relatif, bukan persentil

`normalizedScore` (0-100) dihitung relatif terhadap rentang skala asesmen itu sendiri (mis. 1-5), **bukan** persentil terhadap populasi/norma nasional — karena TA Assess belum memiliki data normatif yang sah. Label yang dipakai adalah *"skor relatif dalam asesmen ini"*, bukan *"persentil nasional"*.

## 6. MBTI

MBTI pada platform ini bersifat **informasional saja**:

- TA Assess tidak mereproduksi soal MBTI resmi apa pun.
- Pengguna memasukkan hasil MBTI yang sudah mereka miliki sendiri (misal dari tes resmi di tempat lain).
- Label yang ditampilkan: *"MBTI — Informational"* dan *"Data ini dimasukkan oleh pengguna dan bukan hasil administrasi MBTI resmi oleh TA Assess."*
- Input MBTI **tidak** memengaruhi skor Big Five dengan cara apa pun.

## 7. Insight Assistant (AI sederhana)

- **Level 1 (aktif):** rule-based, membaca hasil yang sudah dihitung scoring engine, tidak butuh API key.
- **Level 2 (aktif, tergabung dengan Level 1):** template-based natural language generation sederhana untuk merangkai kalimat ringkasan.
- **Level 3 (belum diimplementasikan):** pemanggilan API AI eksternal opsional. Jika suatu saat ditambahkan, Insight Assistant harus tetap berfungsi penuh dalam mode rule-based ketika API key tidak tersedia/gagal.

Insight Assistant **tidak** mendiagnosis, tidak menentukan gangguan mental, tidak mengklaim hasil pasti, tidak menentukan karier secara mutlak, tidak mengubah skor psikometri, dan tidak memberi keputusan seleksi.

## 8. Report ID & konsistensi identitas laporan

Satu `reportId` dibuat **sekali** saat submit (`generateReportId()` di `js/script.js`) dan dipakai konsisten untuk:

- Kunci session storage hasil (`assessmentResult`)
- Nama file PDF (`TA-Assess-Report-[ID].pdf`)
- Data yang di-encode ke QR code
- Payload yang dikirim ke Google Sheets (jika dikonfigurasi)
- Entri di penyimpanan verifikasi demo (localStorage)

Tidak ada proses yang men-generate ID berbeda untuk laporan yang sama.

## 9. Arsitektur verifikasi laporan

**Kondisi saat ini (DEMO):**

```
reportId → localStorage (browser yang sama, diisi saat laporan dibuat) → halaman verify.html → hasil
```

Ini secara eksplisit dilabeli DEMO di UI karena:
- Tidak tersinkron lintas perangkat/browser.
- Dapat diubah oleh siapa pun yang mengakses console browser tersebut.
- **Bukan** sistem anti-pemalsuan. TA Assess tidak pernah mengklaim "ID tidak dapat dipalsukan".

**Arsitektur yang direncanakan untuk produksi:**

```
reportId → endpoint backend (mis. Apps Script doGet dengan query reportId,
           membaca satu baris dari Google Sheets) → verify.html → hasil
```

Untuk mengaktifkan ini nanti: tambahkan fungsi `doGet(e)` di `google-apps-script/code.gs` yang menerima `e.parameter.reportId`, mencari baris yang cocok, dan mengembalikan JSON berisi field non-sensitif saja (bukan seluruh sheet). Lalu ganti `getDemoVerificationAdapter()` di `verify.html` dengan `fetch()` ke endpoint tersebut.

## 10. Versioning

Empat versi independen dilacak:

- `Application version` (`APP_VERSION` di `js/assessments-data.js`)
- `Instrument version` (`instrumentVersion` per asesmen)
- `Scoring version` (`scoringVersion` per asesmen)
- `Report version` (`reportVersion`, di-set saat laporan dibuat)

Jika logika scoring berubah di masa depan, naikkan `scoringVersion` instrumen terkait — laporan lama yang sudah diunduh tetap mencantumkan versi scoring saat laporan itu dibuat, sehingga tidak "rusak" secara retroaktif.

## 11. Privasi

Lihat `docs/PRIVACY.md`. Prinsip singkat: data minimal, tidak ada NIK/dokumen identitas, tidak ada secret di frontend.
