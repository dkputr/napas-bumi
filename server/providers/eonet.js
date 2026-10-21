import { fetchRetry } from '../lib/fetch.js';
import { inIndonesia } from '../lib/freshness.js';
export const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&days=30&bbox=95,6,141,-11';
export function normalize(json, fetchedAt) {
  const out = [];
  for (const ev of json.events ?? []) {
    const g = (ev.geometry ?? []).filter(x => x.type === 'Point').sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
    if (!g) continue; const [lon, lat] = g.coordinates;
    if (!inIndonesia(lat, lon)) continue;
    out.push({ id: ev.id, title: ev.title, latitude: lat, longitude: lon, observed_at: g.date, fetched_at: fetchedAt, source_url: ev.sources?.[0]?.url ?? ev.link ?? null, source: 'NASA EONET', evidence: 'OBSERVED' });
  }
  return out;
}
export async function getEvents() {
  const res = await fetchRetry(EONET_URL);
  if (!res.ok) { const e = new Error(`EONET HTTP ${res.status}`); e.code = 'BAD_RESPONSE'; throw e; }
  const fetchedAt = new Date().toISOString();
  return { fetchedAt, items: normalize(await res.json(), fetchedAt) };
}
