import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getJson, fmtTime, esc, aqiBadge, val, windText } from '../util.js';
export default async function (el) {
  el.innerHTML = `<h1>Peta Indonesia</h1><div class="filters"><label>Rentang hotspot<select id="days"><option value="1">24 jam</option><option value="2" selected>2 hari</option><option value="5">5 hari</option></select></label><label>Confidence<select id="conf"><option value="">Semua</option><option value="h">Tinggi</option><option value="n">Nominal</option><option value="l">Rendah</option></select></label></div>
  <div id="map" role="region" aria-label="Peta"></div>
  <div class="leg"><span><span class="dot" style="background:#236B50"></span>Kota (estimasi model PM2.5)</span><span><span class="dot" style="background:#C85A32"></span>Hotspot satelit (FIRMS)</span><span><span class="dot sq" style="background:#8a3a1c"></span>Event kebakaran (EONET)</span><span><span class="dot" style="background:#fff;border:3px solid #236B50"></span>Stasiun PM2.5 (OpenAQ)</span></div>
  <p class="meta">Peta menampilkan titik, bukan sebaran asap. Peta dasar © OpenStreetMap.</p><ul id="st" class="meta"></ul><div class="scroll" id="tbl"></div>`;
  const map = new maplibregl.Map({ container: 'map', center: [118, -2.5], zoom: 3.6, style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] } });
  map.addControl(new maplibregl.NavigationControl());
  const fc = (items = []) => ({ type: 'FeatureCollection', features: items.map(i => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [i.longitude, i.latitude] }, properties: i })) });
  const status = {}; const showStatus = () => el.querySelector('#st').innerHTML = Object.entries(status).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('');
  await new Promise(r => map.on('load', r));
  map.addSource('city', { type: 'geojson', data: fc() }); map.addSource('fires', { type: 'geojson', data: fc(), cluster: true, clusterRadius: 40 }); map.addSource('ev', { type: 'geojson', data: fc() }); map.addSource('air', { type: 'geojson', data: fc() });
  map.addLayer({ id: 'city', type: 'circle', source: 'city', paint: { 'circle-color': '#236B50', 'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'pm25'], 0], 0, 6, 50, 14, 150, 22], 'circle-opacity': .7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1 } });
  map.addLayer({ id: 'fc', type: 'circle', source: 'fires', filter: ['has', 'point_count'], paint: { 'circle-color': '#C85A32', 'circle-radius': ['step', ['get', 'point_count'], 12, 50, 18, 300, 26], 'circle-opacity': .75 } });
  map.addLayer({ id: 'fcn', type: 'symbol', source: 'fires', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }, paint: { 'text-color': '#fff' } });
  map.addLayer({ id: 'fp', type: 'circle', source: 'fires', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#C85A32', 'circle-radius': 5, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' } });
  map.addLayer({ id: 'ev', type: 'circle', source: 'ev', paint: { 'circle-color': '#8a3a1c', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
  map.addLayer({ id: 'ap', type: 'circle', source: 'air', paint: { 'circle-color': '#fff', 'circle-radius': 7, 'circle-stroke-width': 3, 'circle-stroke-color': '#236B50' } });
  const pop = (ll, h) => new maplibregl.Popup().setLngLat(ll).setHTML(h).addTo(map);
  const on = (l, f) => { map.on('click', l, e => pop(e.lngLat, f(e.features[0].properties))); map.on('mouseenter', l, () => map.getCanvas().style.cursor = 'pointer'); map.on('mouseleave', l, () => map.getCanvas().style.cursor = ''); };
  on('city', p => `<strong>${esc(p.city)}</strong><br>PM2.5 ${val(p.pm25)} · PM10 ${val(p.pm10)} µg/m³<br>${aqiBadge(p.us_aqi === 'null' ? null : +p.us_aqi)}<br>Angin ${windText(p.wind_ms == null || p.wind_ms === 'null' ? null : +p.wind_ms, p.wind_dir == null || p.wind_dir === 'null' ? null : +p.wind_dir)}<br>Diamati ${fmtTime(p.observed_at)}<br>Estimasi model · ${esc(p.source)}`);
  on('fp', p => `<strong>Deteksi panas</strong><br>${esc(p.sensor)}<br>Diamati ${fmtTime(p.observed_at)}<br>Confidence ${esc(p.confidence)} · FRP ${val(p.frp)} MW<br>Sumber ${esc(p.source)}`);
  on('ev', p => `<strong>${esc(p.title)}</strong><br>Update ${fmtTime(p.observed_at)}<br>${p.source_url && p.source_url !== 'null' ? `<a href="${esc(p.source_url)}" rel="noopener">Sumber</a><br>` : ''}NASA EONET`);
  on('ap', p => `<strong>${esc(p.station)}</strong><br>PM2.5 ${p.value} ${esc(p.unit)}<br>Diamati ${fmtTime(p.observed_at)}<br>OpenAQ`);
  let fires = [];
  const drawFires = () => { const c = el.querySelector('#conf').value, f = fires.filter(i => !c || String(i.confidence).toLowerCase() === c); map.getSource('fires').setData(fc(f));
    el.querySelector('#tbl').innerHTML = f.length ? `<table><caption class="meta">Tabel alternatif hotspot: ${f.length} (maks. 200)</caption><thead><tr><th>Waktu amati</th><th>Lat</th><th>Lon</th><th>Sensor</th><th>Confidence</th><th>FRP</th></tr></thead><tbody>${f.slice(0, 200).map(i => `<tr><td>${fmtTime(i.observed_at)}</td><td>${i.latitude}</td><td>${i.longitude}</td><td>${esc(i.sensor)}</td><td>${esc(i.confidence)}</td><td>${val(i.frp)}</td></tr>`).join('')}</tbody></table>` : ''; };
  const loadAll = () => {
    getJson('/api/cities-air').then(d => { map.getSource('city').setData(fc(d.items)); status['Kota (Open-Meteo)'] = `${d.count} kota · diambil ${fmtTime(d.fetched_at)}`; }).catch(() => status['Kota (Open-Meteo)'] = 'Gagal mengambil data').finally(showStatus);
    getJson('/api/events').then(d => { map.getSource('ev').setData(fc(d.items)); status['Event kebakaran (EONET)'] = `${d.count} event · diambil ${fmtTime(d.fetched_at)}`; }).catch(() => status['Event kebakaran (EONET)'] = 'Gagal mengambil data').finally(showStatus);
    getJson(`/api/fires?days=${el.querySelector('#days').value}`).then(d => { fires = d.items; drawFires(); status['Hotspot (FIRMS)'] = `${d.count} deteksi · terbaru ${fmtTime(d.latest_observed_at)}`; }).catch(e => { fires = []; drawFires(); status['Hotspot (FIRMS)'] = e?.status === 'NOT_CONFIGURED' ? 'Sumber belum terhubung (butuh FIRMS_MAP_KEY)' : 'Gagal mengambil data'; }).finally(showStatus);
    getJson('/api/air-quality').then(d => { map.getSource('air').setData(fc(d.items)); status['Stasiun (OpenAQ)'] = `${d.count} stasiun`; }).catch(e => status['Stasiun (OpenAQ)'] = e?.status === 'NOT_CONFIGURED' ? 'Sumber belum terhubung (butuh OPENAQ_API_KEY)' : 'Gagal mengambil data').finally(showStatus);
  };
  el.querySelector('#days').addEventListener('change', loadAll); el.querySelector('#conf').addEventListener('change', drawFires);
  loadAll(); const t = setInterval(loadAll, 600000); return () => { clearInterval(t); map.remove(); };
}
