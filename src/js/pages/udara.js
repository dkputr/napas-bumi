import { getJson, fmtTime, loading, errorState, emptyState, esc, aqiBadge, windText, val, ago } from '../util.js';
export default async function (el) {
  el.innerHTML = `<div class="page-h"><h1>Kualitas udara</h1><p>PM2.5 dan PM10 dalam µg/m³. US AQI adalah skala EPA Amerika, bukan ISPU Indonesia.</p></div>
  <h2>Estimasi per kota (model)</h2><div class="filters"><label>Cari kota<input id="q"></label><label>Urutkan<select id="s"><option value="pm25">PM2.5 tertinggi</option><option value="pm10">PM10 tertinggi</option><option value="city">Nama</option></select></label></div><div id="m">${loading()}</div>
  <h2 style="margin-top:28px">Pengukuran stasiun (OpenAQ)</h2><div id="o">${loading()}</div>`;
  getJson('/api/cities-air').then(d => {
    const draw = () => { const q = el.querySelector('#q').value.toLowerCase(), s = el.querySelector('#s').value;
      const rows = d.items.filter(i => i.city.toLowerCase().includes(q)).sort((a, b) => s === 'city' ? a.city.localeCompare(b.city) : (b[s] ?? -1) - (a[s] ?? -1));
      el.querySelector('#m').innerHTML = rows.length ? `<div class="scroll"><table><caption class="meta">Diambil ${fmtTime(d.fetched_at)} · Sumber: Open-Meteo (model CAMS). Estimasi, bukan pengukuran.</caption><thead><tr><th>Kota</th><th>PM2.5</th><th>PM10</th><th>Kategori</th><th>Angin</th><th>Diamati</th></tr></thead><tbody>${rows.map(i => `<tr><td>${esc(i.city)}</td><td>${val(i.pm25)}</td><td>${val(i.pm10)}</td><td>${aqiBadge(i.us_aqi)}</td><td>${windText(i.wind_ms, i.wind_dir)}</td><td>${fmtTime(i.observed_at)}<br><span class="meta">${ago(i.observed_at)}${i.freshness === 'STALE' ? ' · Data terakhir — bukan kondisi terkini' : ''}</span></td></tr>`).join('')}</tbody></table></div>` : emptyState('Tidak ada kota yang cocok.'); };
    draw(); el.querySelector('#q').addEventListener('input', draw); el.querySelector('#s').addEventListener('change', draw);
  }).catch(e => el.querySelector('#m').innerHTML = errorState(e));
  getJson('/api/air-quality').then(d => {
    el.querySelector('#o').innerHTML = !d.count ? emptyState('Tidak ada stasiun PM2.5 Indonesia yang melapor dalam 24 jam di OpenAQ.') : `<div class="scroll"><table><caption class="meta">Diambil ${fmtTime(d.fetched_at)} · Pengukuran asli stasiun. Tidak mewakili seluruh Indonesia.</caption><thead><tr><th>Stasiun</th><th>PM2.5 (µg/m³)</th><th>Diamati</th></tr></thead><tbody>${d.items.sort((a, b) => b.value - a.value).map(i => `<tr><td>${esc(i.station)}</td><td>${i.value}</td><td>${fmtTime(i.observed_at)}${i.freshness === 'STALE' ? '<br><span class="meta">Data terakhir — bukan kondisi terkini</span>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }).catch(e => el.querySelector('#o').innerHTML = errorState(e));
}
