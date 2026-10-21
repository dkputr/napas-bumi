import { fetchRetry } from '../lib/fetch.js';
export const OM_DOCS = 'https://open-meteo.com/en/docs/air-quality-api';
const arr = x => (Array.isArray(x) ? x : [x]);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null); // hilang tetap null, bukan nol

export function normalize(cities, aq, wx, fetchedAt) {
  const A = arr(aq), W = arr(wx);
  return cities.map((c, i) => {
    const a = A[i]?.current ?? {}, w = W[i]?.current ?? {};
    return {
      id: c.name, city: c.name, latitude: c.lat, longitude: c.lon,
      observed_at: a.time ? new Date(a.time + 'Z').toISOString() : null, fetched_at: fetchedAt,
      pm25: num(a.pm2_5), pm10: num(a.pm10), us_aqi: num(a.us_aqi),
      wind_ms: num(w.wind_speed_10m), wind_dir: num(w.wind_direction_10m), temp_c: num(w.temperature_2m),
      weather_observed_at: w.time ? new Date(w.time + 'Z').toISOString() : null,
      evidence: 'ESTIMATE', source: 'Open-Meteo (model CAMS/ECMWF)'
    };
  });
}
export async function getCitiesAir(cities) {
  const lat = cities.map(c => c.lat).join(','), lon = cities.map(c => c.lon).join(',');
  const aqU = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi&timezone=GMT`;
  const wxU = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=GMT`;
  const [a, w] = await Promise.all([fetchRetry(aqU), fetchRetry(wxU)]);
  if (!a.ok) { const e = new Error(`Open-Meteo AQ HTTP ${a.status}`); e.code = 'BAD_RESPONSE'; throw e; }
  const aq = await a.json(); const wx = w.ok ? await w.json() : [];
  const fetchedAt = new Date().toISOString();
  return { fetchedAt, items: normalize(cities, aq, wx, fetchedAt) };
}
