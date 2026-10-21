import { getFires } from '../server/providers/nasa-firms.js';
import { freshness } from '../server/lib/freshness.js';
import { json, errorBody } from '../server/lib/respond.js';

export default async function handler(req, res) {
  const days = new URL(req.url, 'http://x').searchParams.get('days') ?? 2;
  try {
    const { fetchedAt, items } = await getFires({ days });
    const latest = items.reduce((m, i) => (i.observed_at > m ? i.observed_at : m), '');
    json(res, 200, {
      status: 'CONNECTED', evidence: 'OBSERVED', fetched_at: fetchedAt, latest_observed_at: latest || null,
      freshness: freshness(latest || null, 'fires'), count: items.length, items,
      note: 'Deteksi panas satelit, bukan kebakaran terkonfirmasi.'
    }, 's-maxage=900, stale-while-revalidate=1800');
  } catch (e) { json(res, e.code === 'NOT_CONFIGURED' ? 503 : 502, errorBody(e)); }
}
