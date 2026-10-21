import { getCitiesAir } from '../server/providers/openmeteo.js';
import { CITIES } from '../server/data/cities.js';
import { freshness } from '../server/lib/freshness.js';
import { json, errorBody } from '../server/lib/respond.js';
export default async function handler(_req, res) {
  try {
    const { fetchedAt, items } = await getCitiesAir(CITIES);
    const withF = items.map(i => ({ ...i, freshness: freshness(i.observed_at, 'air') }));
    json(res, 200, { status: 'CONNECTED', fetched_at: fetchedAt, count: withF.length, items: withF,
      note: 'Estimasi model atmosfer (CAMS) per kota, bukan pengukuran stasiun dan bukan ISPU. US AQI adalah skala EPA.' }, 's-maxage=600, stale-while-revalidate=1800');
  } catch (e) { json(res, 502, errorBody(e)); }
}
