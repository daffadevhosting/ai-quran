🕌 AI Quran Assistant

![Platform](https://img.shields.io/badge/Platform-Cloudflare%20Workers-blue)
![AI](https://img.shields.io/badge/AI-Llama%203.3%2070B-orange)
![License](https://img.shields.io/badge/License-MIT-green)

Asisten AI cerdas untuk belajar dan memahami Al-Quran, dibangun dengan Cloudflare Workers dan model Llama 3.3.

✨ Fitur Utama

 - 🔍 Pencarian Ayat Cerdas: Cari ayat Al-Quran berdasarkan kata kunci dengan AI
 - 💬 Tanya Jawab AI: Ajukan pertanyaan apa pun tentang Al-Quran dan dapatkan jawaban berbasis tafsir
 - 📖 Pilih Ayat Langsung: Pilih surah dan ayat spesifik dengan antarmuka yang mudah
 - 🌍 Multi-bahasa: Dukung bahasa Indonesia dan Inggris
 - 🧠 Tracking Neuron: Pantau penggunaan neuron dengan sistem limit harian
 - 💾 Riwayat Chat: Simpan percakapan untuk referensi masa depan
 - 📱 Responsif: Tampilan optimal di desktop dan mobile

🚀 Demo

Akses aplikasi live di: https://daffadevhosting.github.io/ustad-ai/

🛠️ Teknologi yang Digunakan

Backend

- Cloudflare Workers - Serverless edge computing
- Cloudflare AI - Model Llama 3.3 70B Instruct
- TypeScript - Type safety dan maintainability
- KV Namespace - Penyimpanan state dan tracking limit

Frontend

- HTML5/CSS3 - Interface modern dengan dark theme
- Vanilla JavaScript - Tanpa framework dependency
- Al-Quran Cloud API - Data ayat real-time
- Local Storage - Penyimpanan lokal riwayat chat

📁 Struktur Proyek

```
ai-quran/
├── index.ts              # Main Worker handler dengan TypeScript
├── types.ts              # Type definitions
├── utils.ts              # Utility functions (load Quran, extract keywords, etc.)
├── quran-ai.html         # Frontend interface
└── README.md             # Dokumentasi ini
```

🏗️ Cara Menjalankan Lokal

Prasyarat

- Akun Cloudflare dengan Workers access
- Cloudflare AI enabled pada akun Anda
- Wrangler CLI terinstall

Langkah-langkah

1. Clone repository

```bash
git clone https://github.com/daffadevhosting/ai-quran.git
cd ai-quran
```

2. Install dependencies

```bash
npm install
```

3. Konfigurasi Cloudflare Workers

· Buat KV namespace untuk NEURON_LIMITER dan RATE_LIMITER
· Pastikan AI access sudah enabled

4. Update wrangler.toml

```toml
name = "ai-quran-workers"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "NEURON_LIMITER"
id = "<your-kv-id>"

[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "<your-kv-id>"
```

5. Deploy ke Cloudflare

```bash
# Preview development
npm run dev

# Deploy production
npm run deploy
```

6. Akses aplikasi
   Buka browser dan akses URL Worker Anda:

```
https://ai-quran-workers.<your-subdomain>.workers.dev
```

🧠 Sistem Neuron Usage

Proyek ini menggunakan sistem neuron tracking untuk:

- Limit harian: 10,000 neurons per hari
- Cost tracking: Monitoring biaya AI inference
- Reset otomatis: Reset setiap 24 jam
- Tampilan real-time: Lihat sisa neuron di header

Perhitungan Neuron

· Input tokens: 26,668 neurons per 1M tokens
· Output tokens: 204,805 neurons per 1M tokens

🔧 API Endpoints

GET / - Health check

```json
{
  "name": "Quran AI API",
  "version": "1.0.0",
  "endpoints": {
    "/api/ask": "Ask Quran questions (POST)",
    "/api/surah": "Get all surahs (GET)",
    "/api/surah/:id": "Get specific surah (GET)",
    "/api/search": "Search verses (GET)",
    "/api/random": "Random verse (GET)",
    "/api/health": "Health check (GET)"
  }
}
```

POST /api/ask - Tanya AI tentang Quran

```json
{
  "question": "Apa itu surat Al-Fatihah?",
  "language": "id"
}
```

GET /api/surah - Dapatkan semua surah

```json
[
  {
    "id": 1,
    "name": "Al-Fatihah",
    "transliteration": "The Opening",
    "translation": "Pembukaan",
    "type": "Makkiyah",
    "total_verses": 7
  }
]
```

💻 Penggunaan Frontend

1. Tanya Jawab AI

- Ketik pertanyaan di input box
- Tekan Enter atau klik tombol kirim
- AI akan merespons dengan penjelasan dan ayat terkait

2. Pilih Ayat Langsung

- Klik ikon "Pilih Ayat"
- Pilih surah dari dropdown
- Pilih nomor ayat
- Klik "Tampilkan Ayat"

3. Riwayat Percakapan

- Klik menu di kiri atas
- Lihat semua percakapan sebelumnya
- Buat chat baru atau hapus chat lama

4. Ganti Bahasa

- Gunakan toggle switch di sidebar
- Pilih antara Indonesia (ID) dan Inggris (EN)

📊 Monitoring

Console Logs

```bash
# Access Cloudflare Workers logs
wrangler tail
```

Analytics

- Neuron usage tracking
- Token consumption monitoring
- Cost estimation per request

🚨 Batasan dan Fitur

Batasan

- Rate limiting: 10 requests per menit per IP
- Neuron limit: 10,000 neurons per hari
- Max input length: 500 karakter per pertanyaan
- API fallback: Menggunakan API eksternal jika data lokal tidak tersedia

Fitur Keamanan

- Input sanitization
- Rate limiting per IP
- CORS headers untuk keamanan browser
- Error handling yang komprehensif

🔄 Update Data Quran

Data Quran diambil dari:

- Primary source: api.alquran.cloud
- Fallback: Data lokal dalam utils.ts
- Auto-refresh: Setiap aplikasi dimuat

🤝 Kontribusi

Kontribusi dipersilakan! Ikuti langkah berikut:

1. Fork repository
2. Buat branch fitur (git checkout -b feature/AmazingFeature)
3. Commit perubahan (git commit -m 'Add AmazingFeature')
4. Push ke branch (git push origin feature/AmazingFeature)
5. Buat Pull Request

Guidelines

- Gunakan TypeScript untuk type safety
- Ikuti coding style yang ada
- Tambahkan dokumentasi untuk fitur baru
- Test perubahan sebelum submit

📝 Lisensi

Distributed under the MIT License. See LICENSE for more information.

🙏 Ucapan Terima Kasih

- Cloudflare untuk platform Workers dan AI
- Al-Quran Cloud untuk API data Quran
- Meta untuk model Llama 3.3
- Komunitas open source

---

<div align="center">
  <sub>Dibuat dengan ❤️ untuk memudahkan belajar Al-Quran</sub>
</div>
