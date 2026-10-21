import { getJson, fmtTime, loading, errorState, esc } from '../util.js';
const cls = s => s === 'CONNECTED' ? 'ok' : s === 'DEGRADED' || s === 'FAILED' || s === 'STALE' ? 'warn' : 'off';
export default async function (el) {
  el.innerHTML = `<h1>Sumber data</h1><p class="meta">Status berasal dari pemeriksaan langsung ke provider saat halaman dibuka (di-cache ±5 menit), bukan dari isi pengaturan.</p><div id="c">${loading('Memeriksa sumber…')}</div>`;
  try {
    const d = await getJson('/api/sources');
    el.querySelector('#c').innerHTML = `<div class="row">${d.sources.map(s => `<article class="card"><h3>${esc(s.name)}</h3><span class="badge ${cls(s.status)}">${esc(s.status)}</span>
      <p class="meta">${esc(s.type ?? '')}${s.coverage ? ' · ' + esc(s.coverage) : ''}</p>${s.note ? `<p>${esc(s.note)}</p>` : ''}${s.error ? `<p>${esc(s.error)}</p>` : ''}
      <p class="meta">${s.checked_at ? 'Dicek ' + fmtTime(s.checked_at) : 'Tidak diperiksa otomatis'}${s.records != null ? ` · ${s.records} record` : ''}</p>${s.url ? `<a href="${esc(s.url)}" rel="noopener">Situs resmi</a>` : ''}</article>`).join('')}</div>`;
  } catch (e) { el.querySelector('#c').innerHTML = errorState(e); }
}
