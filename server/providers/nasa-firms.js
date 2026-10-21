import { fetchRetry } from '../lib/fetch.js';
import { inIndonesia } from '../lib/freshness.js';

export const FIRMS_SOURCE = 'VIIRS_SNPP_NRT';
export const FIRMS_AREA = '95,-11,141,6'; // west,south,east,north (kotak pembatas Indonesia)
export const FIRMS_DOCS = 'https://firms.modaps.eosdis.nasa.gov/api/';

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].split(',');
  return lines.slice(1).map(l => { const c = l.split(','); return Object.fromEntries(head.map((h, i) => [h, c[i]])); });
}

// acq_date (YYYY-MM-DD) + acq_time (HHMM, UTC) -> ISO UTC
export function toIso(date, time) {
  const t = String(time ?? '').padStart(4, '0');
  const d = new Date(`${date}T${t.slice(0, 2)}:${t.slice(2, 4)}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function normalize(rows, fetchedAt) {
  const seen = new Set(); const out = [];
  for (const r of rows) {
    const lat = Number(r.latitude), lon = Number(r.longitude);
    const observed_at = toIso(r.acq_date, r.acq_time);
    if (!observed_at || !inIndonesia(lat, lon)) continue;
    const key = `${lat}|${lon}|${observed_at}|${r.satellite}`; // deduplikasi
    if (seen.has(key)) continue; seen.add(key);
    const frp = r.frp === '' || r.frp == null ? null : Number(r.frp);
    out.push({
      id: key, latitude: lat, longitude: lon, observed_at, fetched_at: fetchedAt,
      sensor: `${r.instrument ?? 'VIIRS'} ${r.satellite ?? ''}`.trim(),
      confidence: r.confidence ?? null, // VIIRS: kategori l/n/h — tidak dikonversi ke persen
      frp: Number.isFinite(frp) ? frp : null, daynight: r.daynight ?? null,
      product_version: r.version ?? null, source: `NASA FIRMS ${FIRMS_SOURCE}`
    });
  }
  return out;
}

export async function getFires({ days = 2, key = process.env.FIRMS_MAP_KEY } = {}) {
  if (!key) { const e = new Error('FIRMS_MAP_KEY belum diisi'); e.code = 'NOT_CONFIGURED'; throw e; }
  const d = Math.min(Math.max(Number(days) || 1, 1), 5);
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${FIRMS_SOURCE}/${FIRMS_AREA}/${d}`;
  const res = await fetchRetry(url);
  const text = await res.text();
  if (!res.ok || !text.startsWith('latitude')) { const e = new Error(`Respons FIRMS tidak valid (HTTP ${res.status})`); e.code = 'BAD_RESPONSE'; throw e; }
  const fetchedAt = new Date().toISOString();
  return { fetchedAt, items: normalize(parseCsv(text), fetchedAt) };
}
