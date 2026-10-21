// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
describe('render halaman (fetch dimock, hanya untuk test)', () => {
  it('home tampil tanpa error dan menampilkan kota', async () => {
    const item = { city: 'Jakarta', latitude: 1, longitude: 1, observed_at: new Date().toISOString(), pm25: 20, pm10: 30, us_aqi: 60, wind_ms: 2, wind_dir: 90, temp_c: 30, freshness: 'FRESH', source: 'x' };
    globalThis.fetch = vi.fn(async url => ({ ok: !String(url).includes('fires'), json: async () => String(url).includes('fires') ? { status: 'NOT_CONFIGURED' } : String(url).includes('events') ? { count: 1, items: [], fetched_at: new Date().toISOString() } : { items: [item], count: 1, fetched_at: new Date().toISOString() } }));
    document.body.innerHTML = '<div id="app"></div>';
    const home = (await import('../../src/js/pages/home.js')).default; const el = document.getElementById('app'); const stop = await home(el);
    await new Promise(r => setTimeout(r, 50)); expect(el.textContent).toContain('Jakarta'); expect(el.textContent).toContain('PM2.5'); stop();
  });
});
