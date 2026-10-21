export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtTime = iso => iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB' : '—';
export function ago(iso) { if (!iso) return '—'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 60 ? `${m} menit lalu` : m < 2880 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu`; }
export const loading = (t = 'Memuat data…') => `<div class="skel" role="status" aria-label="${t}"></div>`;
export const errorState = (e) => e?.status === 'NOT_CONFIGURED'
  ? `<div class="state"><span class="badge off">Sumber belum terhubung</span><p>${esc(e.detail ?? 'Kunci API belum diisi di server.')} Lihat README bagian “Setup API key”.</p></div>`
  : `<div class="state err" role="alert"><span class="badge warn">Gagal mengambil data</span><p>Provider tidak merespons atau menolak permintaan. Data lama tidak ditampilkan sebagai kondisi terkini. Coba lagi beberapa menit lagi.</p></div>`;
export const emptyState = t => `<div class="state"><span class="badge off">Data tidak tersedia</span><p>${esc(t)}</p></div>`;
export const staleNote = (fr) => fr === 'STALE' ? `<div class="stale"><strong>Data terakhir — bukan kondisi terkini.</strong></div>` : '';
export async function getJson(url) {
  const r = await fetch(url); let b = null;
  try { b = await r.json(); } catch { /* respons bukan JSON */ }
  if (!r.ok) throw b ?? { status: 'FAILED' };
  return b;
}
import { usAqiCategory } from '../../server/lib/aqi.js';
export const aqiBadge = v => { const c = usAqiCategory(v); return c ? `<span class="badge ${v <= 50 ? 'aq0' : v <= 100 ? 'aq1' : v <= 150 ? 'aq2' : v <= 200 ? 'aq3' : 'aq4'}">US AQI ${Math.round(v)} · ${c}</span>` : `<span class="badge off">Data tidak tersedia</span>`; };
const D = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'];
export const windText = (ms, dir) => ms == null ? '—' : `${ms.toFixed(1)} m/s${dir == null ? '' : ' dari ' + D[Math.round(dir / 45) % 8]}`;
export const val = (v, d = 1) => v == null ? '—' : (+v).toFixed(d);
export function poll(fn, ms = 600000) { fn(); const t = setInterval(fn, ms); return () => clearInterval(t); }
export const aqClass = v => v == null ? 'off' : v <= 50 ? 'aq0' : v <= 100 ? 'aq1' : v <= 150 ? 'aq2' : v <= 200 ? 'aq3' : 'aq4';
export const aqColor = v => v == null ? '#9aa8a0' : v <= 50 ? '#236B50' : v <= 100 ? '#c9a227' : v <= 150 ? '#C85A32' : v <= 200 ? '#9b2c22' : '#6b2d5c';
export function gauge(aqi) {
  const r = 54, C = 2 * Math.PI * r, f = aqi == null ? 0 : Math.min(aqi / 300, 1);
  return `<div class="gauge" role="img" aria-label="${aqi == null ? 'US AQI tidak tersedia' : 'US AQI ' + Math.round(aqi)}"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="${r}" fill="none" stroke="#e9efe9" stroke-width="12"/><circle class="v" cx="66" cy="66" r="${r}" fill="none" stroke="${aqColor(aqi)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - f)}"/></svg><div class="num"><b>${aqi == null ? '—' : Math.round(aqi)}</b><small>US AQI</small></div></div>`;
}
export const skel = (n = 1) => Array.from({ length: n }, () => '<div class="skel" role="status" aria-label="Memuat"></div>').join('');
