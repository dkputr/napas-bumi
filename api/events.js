import { getEvents } from '../server/providers/eonet.js';
import { json, errorBody } from '../server/lib/respond.js';
export default async function handler(_req, res) {
  try { const { fetchedAt, items } = await getEvents();
    json(res, 200, { status: 'CONNECTED', fetched_at: fetchedAt, count: items.length, items, note: 'Event kebakaran terkurasi NASA EONET (30 hari, masih terbuka). Bukan hotspot dan tidak lengkap.' }, 's-maxage=900, stale-while-revalidate=1800');
  } catch (e) { json(res, 502, errorBody(e)); }
}
