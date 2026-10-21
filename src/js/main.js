import '../styles/main.css';
import { esc } from './util.js';
const routes = {
  '/': () => import('./pages/home.js'), '/udara': () => import('./pages/udara.js'), '/peta': () => import('./pages/peta.js'),
  '/karhutla': () => import('./pages/karhutla.js'), '/investigasi': () => import('./pages/static.js').then(m => ({ default: m.investigasi })),
  '/belajar': () => import('./pages/static.js').then(m => ({ default: m.belajar })), '/aksi': () => import('./pages/aksi.js'),
  '/sumber': () => import('./pages/sumber.js'), '/metodologi': () => import('./pages/static.js').then(m => ({ default: m.metodologi }))
};
const labels = { '/': 'Beranda', '/udara': 'Udara', '/peta': 'Peta', '/karhutla': 'Karhutla', '/investigasi': 'Investigasi', '/belajar': 'Belajar', '/aksi': 'Aksi warga', '/sumber': 'Sumber', '/metodologi': 'Metodologi' };
const app = document.getElementById('app'); let cleanup = null;
async function render() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.getElementById('nav').innerHTML = Object.entries(labels).map(([p, l]) => `<a href="${p}" data-link ${p === path ? 'aria-current="page"' : ''}>${l}</a>`).join('');
  if (cleanup) { try { cleanup(); } catch { /* abaikan */ } cleanup = null; }
  const load = routes[path];
  if (!load) { app.innerHTML = `<h1>Halaman tidak ditemukan</h1><p><a href="/" data-link>Kembali ke beranda</a></p>`; return; }
  app.innerHTML = '<div class="state" role="status">Memuat halaman…</div>';
  try { const m = await load(); cleanup = (await (m.default ?? m.render)(app)) ?? null; document.title = `${labels[path]} — NAPAS BUMI`; }
  catch (e) { console.error(e); app.innerHTML = `<div class="state err" role="alert"><strong>Terjadi kesalahan pada halaman.</strong><p>${esc(e?.message ?? '')}</p></div>`; }
  app.focus({ preventScroll: true });
}
document.addEventListener('click', e => { const a = e.target.closest('a[data-link]'); if (a && a.origin === location.origin) { e.preventDefault(); history.pushState({}, '', a.href); render(); window.scrollTo(0, 0); } });
window.addEventListener('popstate', render); render();
