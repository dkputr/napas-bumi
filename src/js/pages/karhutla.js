import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { getJson, fmtTime, loading, errorState, emptyState, staleNote, esc } from '../util.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
export default async function (el) {
  el.innerHTML = `<h1>Karhutla</h1><p class="meta">Deteksi panas satelit ≠ kebakaran terkonfirmasi ≠ laporan kejadian ≠ luas area terbakar.</p><h2>Deteksi panas (NASA FIRMS)</h2><div id="h">${loading()}</div><h2 style="margin-top:28px">Event kebakaran terkurasi (NASA EONET)</h2><div id="e">${loading()}</div><h2 style="margin-top:28px">Laporan resmi dan luas terbakar</h2><div class="state"><span class="badge off">Sumber belum terhubung</span><p>Belum ada integrasi mesin ke SiPongi/BNPB. Lihat <a href="https://sipongi.gakkum.kehutanan.go.id/">SiPongi</a> dan <a href="https://www.bnpb.go.id/">BNPB</a>.</p></div>`;
  let chart;
  getJson('/api/fires?days=5').then(d => {
    const h = el.querySelector('#h'); if (!d.count) { h.innerHTML = emptyState('Tidak ada deteksi panas pada rentang ini.'); return; }
    const per = {}; d.items.forEach(i => { const k = i.observed_at.slice(0, 10); per[k] = (per[k] ?? 0) + 1; }); const keys = Object.keys(per).sort();
    h.innerHTML = `${staleNote(d.freshness)}<p>Pengamatan terbaru <strong>${fmtTime(d.latest_observed_at)}</strong> · diambil ${fmtTime(d.fetched_at)}</p><div class="card"><canvas id="ch" role="img" aria-label="Deteksi panas per hari" height="120"></canvas><p class="meta">Satuan: jumlah deteksi per hari (UTC), 5 hari terakhir; hari pertama/terakhir bisa parsial. Sumber: NASA FIRMS VIIRS S-NPP NRT.</p></div>`;
    chart = new Chart(h.querySelector('#ch'), { type: 'bar', data: { labels: keys, datasets: [{ data: keys.map(k => per[k]), backgroundColor: '#C85A32' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Jumlah deteksi' } } } } });
  }).catch(e => el.querySelector('#h').innerHTML = errorState(e));
  getJson('/api/events').then(d => { el.querySelector('#e').innerHTML = !d.count ? emptyState('Tidak ada event kebakaran terbuka di Indonesia dalam 30 hari terakhir pada EONET.') : `<div class="scroll"><table><caption class="meta">Diambil ${fmtTime(d.fetched_at)} · daftar terkurasi, tidak lengkap.</caption><thead><tr><th>Event</th><th>Update terakhir</th><th>Sumber</th></tr></thead><tbody>${d.items.map(i => `<tr><td>${esc(i.title)}</td><td>${fmtTime(i.observed_at)}</td><td>${i.source_url ? `<a href="${esc(i.source_url)}" rel="noopener">Tautan</a>` : '—'}</td></tr>`).join('')}</tbody></table></div>`; }).catch(e => el.querySelector('#e').innerHTML = errorState(e));
  return () => chart?.destroy();
}
