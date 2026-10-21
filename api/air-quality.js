import { getAirQuality } from '../server/providers/openaq.js';
import { freshness } from '../server/lib/freshness.js';
import { json, errorBody } from '../server/lib/respond.js';

export default async function handler(req, res) {
  try {
    const { fetchedAt, items, stationsFound } = await getAirQuality();
    const withF = items.map(i => ({ ...i, freshness: freshness(i.observed_at, 'air'), evidence: 'OBSERVED' }));
    json(res, 200, {
      status: 'CONNECTED', fetched_at: fetchedAt, count: withF.length, stations_with_pm25: stationsFound, items: withF,
      note: 'PM2.5 dalam µg/m³ dari stasiun yang tersedia di OpenAQ. Bukan nilai ISPU dan tidak mewakili seluruh Indonesia.'
    }, 's-maxage=600, stale-while-revalidate=1800');
  } catch (e) { json(res, e.code === 'NOT_CONFIGURED' ? 503 : 502, errorBody(e)); }
}
