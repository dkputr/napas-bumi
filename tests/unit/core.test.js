import { describe, it, expect } from 'vitest';
import { parseCsv, toIso, normalize } from '../../server/providers/nasa-firms.js';
import { pickPm25Locations, normalizeLatest } from '../../server/providers/openaq.js';
import { freshness, inIndonesia } from '../../server/lib/freshness.js';

const csv = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n-2.1,114.3,330,0.4,0.4,2026-10-20,0545,N,VIIRS,n,2.0NRT,290,5.2,D\n-2.1,114.3,330,0.4,0.4,2026-10-20,0545,N,VIIRS,n,2.0NRT,290,5.2,D\n40,10,330,0.4,0.4,2026-10-20,0545,N,VIIRS,h,2.0NRT,290,1,D\n-1,110,300,0.4,0.4,2026-10-20,0030,N,VIIRS,l,2.0NRT,290,,N';
describe('FIRMS', () => {
  it('parse + waktu UTC', () => { expect(parseCsv(csv)).toHaveLength(4); expect(toIso('2026-10-20', '0545')).toBe('2026-10-20T05:45:00.000Z'); expect(toIso('x', '1')).toBeNull(); });
  it('dedup, buang koordinat di luar Indonesia, frp kosong = null, confidence tetap kategori', () => {
    const r = normalize(parseCsv(csv), 'now'); expect(r).toHaveLength(2); expect(r[0].confidence).toBe('n'); expect(r[1].frp).toBeNull();
  });
});
describe('freshness & koordinat', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  it('FRESH/STALE/UNKNOWN', () => { expect(freshness('2026-10-20T10:00:00Z', 'fires', now)).toBe('FRESH'); expect(freshness('2026-10-19T10:00:00Z', 'fires', now)).toBe('STALE'); expect(freshness(null, 'air')).toBe('UNKNOWN'); expect(freshness('bukan-tanggal', 'air')).toBe('UNKNOWN'); });
  it('koordinat', () => { expect(inIndonesia(-6.2, 106.8)).toBe(true); expect(inIndonesia(51, 0)).toBe(false); expect(inIndonesia(NaN, 100)).toBe(false); });
});
describe('OpenAQ', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const loc = { id: 7, name: 'Stasiun A', coordinates: { latitude: -6.2, longitude: 106.8 }, datetimeLast: { utc: '2026-10-20T11:00:00Z' }, sensors: [{ id: 70, parameter: { id: 2, units: 'µg/m³' } }] };
  it('memilih lokasi PM2.5 yang baru', () => { expect(pickPm25Locations([loc, { ...loc, datetimeLast: { utc: '2026-10-01T00:00:00Z' } }, { ...loc, sensors: [] }], 864e5, now)).toHaveLength(1); });
  it('normalisasi; nilai hilang tidak jadi nol', () => {
    expect(normalizeLatest(loc, { results: [{ sensorsId: 70, value: 41.5, datetime: { utc: '2026-10-20T11:00:00Z' } }] }, 'f').value).toBe(41.5);
    expect(normalizeLatest(loc, { results: [] }, 'f')).toBeNull();
    expect(normalizeLatest(loc, { results: [{ sensorsId: 70, value: null }] }, 'f')).toBeNull();
  });
});
import { normalize as omNorm } from '../../server/providers/openmeteo.js';
import { normalize as evNorm } from '../../server/providers/eonet.js';
import { usAqiCategory } from '../../server/lib/aqi.js';
describe('Open-Meteo & EONET & AQI', () => {
  it('normalisasi multi-lokasi, null tetap null, waktu UTC', () => {
    const r = omNorm([{ name: 'A', lat: 1, lon: 2 }, { name: 'B', lat: 3, lon: 4 }], [{ current: { time: '2026-10-21T08:00', pm2_5: 12.3, pm10: null, us_aqi: 50 } }, { current: {} }], [{ current: { wind_speed_10m: 2, wind_direction_10m: 90 } }, { current: {} }], 'f');
    expect(r[0].observed_at).toBe('2026-10-21T08:00:00.000Z'); expect(r[0].pm10).toBeNull(); expect(r[1].pm25).toBeNull(); expect(r[0].evidence).toBe('ESTIMATE');
  });
  it('EONET: ambil titik terbaru dan buang luar Indonesia', () => {
    const j = { events: [{ id: '1', title: 'Fire A', geometry: [{ type: 'Point', date: '2026-10-01T00:00:00Z', coordinates: [110, -2] }, { type: 'Point', date: '2026-10-05T00:00:00Z', coordinates: [111, -2] }] }, { id: '2', title: 'Out', geometry: [{ type: 'Point', date: '2026-10-01T00:00:00Z', coordinates: [-120, 40] }] }] };
    const r = evNorm(j, 'f'); expect(r).toHaveLength(1); expect(r[0].longitude).toBe(111);
  });
  it('kategori US AQI', () => { expect(usAqiCategory(40)).toBe('Baik'); expect(usAqiCategory(160)).toBe('Tidak sehat'); expect(usAqiCategory(null)).toBeNull(); });
});
