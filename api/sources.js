import { json } from '../server/lib/respond.js';
import { getFires } from '../server/providers/nasa-firms.js';
import { getAirQuality } from '../server/providers/openaq.js';
import { getCitiesAir } from '../server/providers/openmeteo.js';
import { getEvents } from '../server/providers/eonet.js';
import { CITIES } from '../server/data/cities.js';

// Status berasal dari pemeriksaan nyata (panggilan ke provider), bukan sekadar env var terisi.
async function probe(name, fn) {
  const t = Date.now();
  try { const r = await fn(); return { name, status: r.items.length ? 'CONNECTED' : 'DEGRADED', checked_at: new Date().toISOString(), records: r.items.length, ms: Date.now() - t }; }
  catch (e) { return { name, status: e.code === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'FAILED', checked_at: new Date().toISOString(), error: e.code === 'NOT_CONFIGURED' ? e.message : 'Gagal mengambil data' }; }
}
export default async function handler(_req, res) {
  const [fires, air, om, eo] = await Promise.all([probe('NASA FIRMS (hotspot)', () => getFires({ days: 1 })), probe('OpenAQ (stasiun)', () => getAirQuality({ max: 3 })), probe('Open-Meteo (model udara & angin)', () => getCitiesAir(CITIES.slice(0, 2))), probe('NASA EONET (event kebakaran)', () => getEvents())]);
  const static_ = [
    { name: 'ISPU KLHK', status: 'NOT_SUPPORTED', note: 'Belum ada API publik terdokumentasi yang diverifikasi. Tidak di-scrape.', url: 'https://ispu.menlhk.go.id/' },
    { name: 'BMKG (cuaca/angin)', status: 'NOT_CONFIGURED', note: 'Akses API belum diverifikasi. Sementara angin dan cuaca memakai Open-Meteo (skala internasional).', url: 'https://www.bmkg.go.id/' },
    { name: 'SiPongi / BNPB (laporan resmi)', status: 'NOT_SUPPORTED', note: 'Tidak ada akses mesin yang terverifikasi. Gunakan tautan resmi.', url: 'https://sipongi.gakkum.kehutanan.go.id/' }
  ];
  json(res, 200, { checked_at: new Date().toISOString(), sources: [
    { ...om, type: 'Estimasi model PM2.5, PM10, US AQI, angin, per kota', url: 'https://open-meteo.com/', coverage: '32 kota besar Indonesia (model global CAMS/ECMWF). Gratis untuk non-komersial.' },
    { ...eo, type: 'Event kebakaran terkurasi', url: 'https://eonet.gsfc.nasa.gov/', coverage: 'Tidak lengkap, bukan hotspot' },
    { ...fires, type: 'Deteksi panas satelit', url: 'https://firms.modaps.eosdis.nasa.gov/', coverage: 'Kotak pembatas Indonesia (VIIRS S-NPP NRT)' },
    { ...air, type: 'PM2.5 stasiun', url: 'https://openaq.org/', coverage: 'Hanya stasiun yang tersedia di OpenAQ' },
    ...static_ ] }, 's-maxage=300');
}
