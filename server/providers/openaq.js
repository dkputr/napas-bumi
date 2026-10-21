import { fetchRetry } from '../lib/fetch.js';
import { inIndonesia } from '../lib/freshness.js';

export const OPENAQ_BASE = 'https://api.openaq.org/v3';
export const OPENAQ_DOCS = 'https://docs.openaq.org/';
const PM25 = 2; // parameter id PM2.5 di OpenAQ v3

async function oaq(path, key) {
  const res = await fetchRetry(`${OPENAQ_BASE}${path}`, { headers: { 'X-API-Key': key } });
  if (res.status === 401 || res.status === 403) { const e = new Error('API key OpenAQ ditolak'); e.code = 'AUTH'; throw e; }
  if (!res.ok) { const e = new Error(`OpenAQ HTTP ${res.status}`); e.code = 'BAD_RESPONSE'; throw e; }
  return res.json();
}

export function pickPm25Locations(results, maxAgeMs = 24 * 3600e3, now = Date.now()) {
  return results.filter(l => {
    const lat = l.coordinates?.latitude, lon = l.coordinates?.longitude;
    const has = (l.sensors ?? []).some(s => s.parameter?.id === PM25);
    const last = Date.parse(l.datetimeLast?.utc ?? '');
    return has && inIndonesia(lat, lon) && Number.isFinite(last) && now - last <= maxAgeMs;
  });
}

export function normalizeLatest(loc, latest, fetchedAt) {
  const sensor = (loc.sensors ?? []).find(s => s.parameter?.id === PM25);
  if (!sensor) return null;
  const m = (latest.results ?? []).find(r => r.sensorsId === sensor.id);
  if (!m || typeof m.value !== 'number') return null; // data hilang tidak dijadikan nol
  return {
    id: `${loc.id}:${sensor.id}`, station_id: loc.id, station: loc.name ?? `Stasiun ${loc.id}`,
    provider: loc.provider?.name ?? null, latitude: loc.coordinates.latitude, longitude: loc.coordinates.longitude,
    parameter: 'pm25', value: m.value, unit: sensor.parameter.units ?? 'µg/m³',
    observed_at: m.datetime?.utc ?? null, fetched_at: fetchedAt, source: 'OpenAQ v3'
  };
}

export async function getAirQuality({ key = process.env.OPENAQ_API_KEY, max = 30 } = {}) {
  if (!key) { const e = new Error('OPENAQ_API_KEY belum diisi'); e.code = 'NOT_CONFIGURED'; throw e; }
  const list = await oaq(`/locations?iso=ID&parameters_id=${PM25}&limit=1000`, key);
  const picked = pickPm25Locations(list.results ?? [])
    .sort((a, b) => Date.parse(b.datetimeLast.utc) - Date.parse(a.datetimeLast.utc)).slice(0, max);
  const fetchedAt = new Date().toISOString(); const items = [];
  for (let i = 0; i < picked.length; i += 4) {
    const batch = await Promise.allSettled(picked.slice(i, i + 4).map(async l => normalizeLatest(l, await oaq(`/locations/${l.id}/latest`, key), fetchedAt)));
    for (const b of batch) if (b.status === 'fulfilled' && b.value) items.push(b.value);
  }
  return { fetchedAt, items, stationsFound: (list.results ?? []).length };
}
