# Vercel API Functions

API functions berada di bawah folder ini dan dikelompokkan berdasarkan tanggung jawab.

```text
api/
├── assessment/
│   ├── event.js
│   ├── session.js
│   └── submit.js
├── data/
│   └── question-bank.js
└── system/
    └── health.js
```

Struktur ini hanya mengatur source code. Endpoint publik lama tetap tersedia melalui rewrite Vercel agar frontend yang sudah ada tidak perlu mengubah URL sekaligus.

## Batas tanggung jawab

- `assessment/` — sesi keamanan, submission, dan event asesmen.
- `data/` — gateway Question Bank.
- `system/` — pemeriksaan kesehatan sistem.

Secret server tetap berasal dari environment variable Vercel dan tidak disimpan di repository.
