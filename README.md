# NAPAS BUMI v0.2

## Deploy ke Vercel
1. Isi repo GitHub dengan ISI folder ini (file `package.json` harus ada di root repo, bukan di dalam subfolder).
2. Vercel → Add New → Project → Import repo. Framework: Vite. Klik Deploy.
3. Halaman langsung menampilkan data tanpa key apa pun (Open-Meteo + NASA EONET).
4. Opsional, untuk hotspot dan stasiun asli: tambahkan `FIRMS_MAP_KEY` (firms.modaps.eosdis.nasa.gov/api/map_key/) dan `OPENAQ_API_KEY` (explore.openaq.org/register) di Settings → Environment Variables, lalu Redeploy.
5. Cek `/api/health`, `/api/cities-air`, `/api/events`, lalu halaman `/sumber`.

## Sumber data
| Sumber | Perlu key | Jenis | Status |
|---|---|---|---|
| Open-Meteo | tidak | Estimasi model PM2.5/PM10/US AQI/angin, 32 kota | IMPLEMENTED, unit test fixture, NOT VERIFIED live |
| NASA EONET | tidak | Event kebakaran terkurasi | IMPLEMENTED, unit test fixture, NOT VERIFIED live |
| NASA FIRMS | ya | Hotspot VIIRS | IMPLEMENTED, NOT VERIFIED live |
| OpenAQ v3 | ya | Pengukuran stasiun | IMPLEMENTED, NOT VERIFIED live |
| BMKG, ISPU, SiPongi/BNPB | - | - | Belum terhubung |

Catatan lisensi: Open-Meteo gratis untuk non-komersial; untuk penggunaan komersial perlu langganan.
Data kota adalah estimasi model, bukan alat ukur, dan bukan ISPU.

## Perintah
`npm install`, `npm test`, `npm run build`, `npx vercel dev` (frontend + /api).

## Belum ada
Database dan riwayat, cron, laporan warga, admin/auth, investigasi editorial, e2e Playwright, BMKG/ISPU.
