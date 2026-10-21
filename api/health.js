import { json } from '../server/lib/respond.js';
export default function handler(_req, res) {
  json(res, 200, { ok: true, time: new Date().toISOString(),
    config: { FIRMS_MAP_KEY: Boolean(process.env.FIRMS_MAP_KEY), OPENAQ_API_KEY: Boolean(process.env.OPENAQ_API_KEY) } }, 'no-cache');
}
