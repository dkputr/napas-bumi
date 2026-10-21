import { CITIES } from '../../../server/data/cities.js';
import { usAqiCategory } from '../../../server/lib/aqi.js';
import { getJson, fmtTime, ago, loading, errorState, emptyState, staleNote, esc, aqiBadge, aqClass, windText, val, poll, gauge } from '../util.js';
export default async function (el) {
  let sel = 'Jakarta', data = null;
  el.innerHTML = `<section class="hero"><div class="hero-grid"><div>
  <h1>Udara yang kita hirup. Hutan yang kita jaga.</h1>
  <p class="lead">Pantau kualitas udara dan api di Indonesia dengan sumber dan waktu pengamatan yang jelas. Kalau datanya tidak ada, kami bilang tidak ada.</p>
  <form id="f" class="search" role="search"><label for="city">Cari kota</label><input id="city" list="cl" placeholder="Cari kota, mis. Pekanbaru" autocomplete="off"><datalist id="cl">${CITIES.map(c => `<option value="${c.name}">`).join('')}</datalist><button>Lihat udara</button></form>
  <p class="meta">Mencakup 32 kota besar. Wilayah lain belum tercakup.</p></div>
  <div class="gcard" id="sel" aria-live="polite">${loading()}</div></div></section>
  <div class="strip" id="strip"></div>
  <section class="sec"><h2>Kota dengan PM2.5 tertinggi <a class="meta" href="/udara" data-link>Semua kota</a></h2><div class="card" id="rank">${loading()}</div>
  <p class="meta">Estimasi model atmosfer global (CAMS), bukan alat ukur di kota tersebut. Pengukuran stasiun ada di halaman Udara.</p></section>
  <section class="sec"><div class="row"><div class="card" id="fire"><h3>Api dan deteksi panas</h3>${loading()}</div>
  <div class="card"><h3>Cara membaca angka ini</h3><p class="meta">US AQI adalah skala EPA Amerika, bukan ISPU Indonesia. Hotspot satelit belum tentu kebakaran. Setiap angka punya dua waktu: kapan diamati dan kapan kami mengambilnya.</p><a href="/belajar" data-link>Pelajari lebih lanjut</a></div></div></section>
  <section class="sec explore"><div class="row"><a class="card" href="/peta" data-link><h3>Peta Indonesia</h3><p>Kota, hotspot, dan event kebakaran dalam satu peta.</p></a><a class="card" href="/sumber" data-link><h3>Sumber data</h3><p>Status koneksi setiap penyedia, dicek langsung.</p></a><a class="card" href="/aksi" data-link><h3>Aksi warga</h3><p>Kanal resmi dan cara mengurangi paparan asap.</p></a></div></section>`;
  const draw = () => {
    if (!data) return; const c = data.items.find(i => i.city === sel);
    el.querySelector('#sel').innerHTML = !c ? emptyState('Data tidak tersedia untuk lokasi ini.') : `<h3>${esc(c.city)}</h3>${staleNote(c.freshness)}<div class="gwrap">${gauge(c.us_aqi)}<div><span class="badge ${aqClass(c.us_aqi)}">${usAqiCategory(c.us_aqi) ?? 'Data tidak tersedia'}</span>
    <dl class="gmini"><div><dt>PM2.5 µg/m³</dt><dd>${val(c.pm25)}</dd></div><div><dt>PM10 µg/m³</dt><dd>${val(c.pm10)}</dd></div><div><dt>Angin</dt><dd>${windText(c.wind_ms, c.wind_dir)}</dd></div><div><dt>Suhu</dt><dd>${val(c.temp_c)} °C</dd></div></dl></div></div>
    <p class="gfoot">Diamati ${fmtTime(c.observed_at)} (${ago(c.observed_at)}). Diambil ${fmtTime(data.fetched_at)}. Sumber: ${esc(c.source)}. Estimasi model, bukan ISPU.</p>`;
    const ok = data.items.filter(i => i.pm25 != null).sort((a, b) => b.pm25 - a.pm25); const top = ok.slice(0, 8), mx = Math.max(...top.map(i => i.pm25), 1);
    el.querySelector('#strip').innerHTML = `<div class="kpi"><b>${data.count}</b><span>kota dipantau</span></div><div class="kpi"><b>${ok[0] ? esc(ok[0].city) : '—'}</b><span>PM2.5 tertinggi${ok[0] ? ': ' + val(ok[0].pm25) + ' µg/m³' : ''}</span></div><div class="kpi"><b>${ok.length ? val(ok.reduce((s, i) => s + i.pm25, 0) / ok.length) : '—'}</b><span>rata-rata PM2.5 antar kota (µg/m³), bukan angka nasional</span></div><div class="kpi"><b>${ago(data.fetched_at)}</b><span>pembaruan terakhir, otomatis tiap 10 menit</span></div>`;
    el.querySelector('#rank').innerHTML = top.length ? `<ul class="bars">${top.map(i => `<li><span>${esc(i.city)}</span><span class="track"><span class="fill f${i.us_aqi <= 50 ? 0 : i.us_aqi <= 100 ? 1 : i.us_aqi <= 150 ? 2 : i.us_aqi <= 200 ? 3 : 4}" style="display:block;width:${Math.max(4, i.pm25 / mx * 100)}%"></span></span><span class="v">${val(i.pm25)} µg/m³</span></li>`).join('')}</ul>` : emptyState('Tidak ada nilai PM2.5 dari sumber saat ini.');
  };
  el.querySelector('#f').addEventListener('submit', e => { e.preventDefault(); const q = el.querySelector('#city').value.trim().toLowerCase(); if (!q) return; const m = CITIES.find(c => c.name.toLowerCase() === q) ?? CITIES.find(c => c.name.toLowerCase().includes(q)); if (m) { sel = m.name; draw(); } else el.querySelector('#sel').innerHTML = emptyState(`“${esc(q)}” belum ada di 32 kota yang tercakup.`); });
  const loadAir = () => getJson('/api/cities-air').then(d => { data = d; draw(); }).catch(e => { el.querySelector('#sel').innerHTML = errorState(e); el.querySelector('#rank').innerHTML = errorState(e); });
  const loadFire = async () => {
    const box = el.querySelector('#fire');
    try { const d = await getJson('/api/fires?days=1'); box.innerHTML = `<h3>Deteksi panas satelit</h3>${staleNote(d.freshness)}<p class="big">${d.count}</p><p>deteksi dalam 24 jam terakhir</p><p class="meta">Pengamatan terbaru ${fmtTime(d.latest_observed_at)}. NASA FIRMS VIIRS. Bukan kebakaran terkonfirmasi.</p><a href="/karhutla" data-link>Detail karhutla</a>`; }
    catch { try { const d = await getJson('/api/events'); box.innerHTML = `<h3>Event kebakaran (NASA EONET)</h3><p class="big">${d.count}</p><p>event terbuka di Indonesia, 30 hari terakhir</p><p class="meta">Diambil ${fmtTime(d.fetched_at)}. Daftar terkurasi dan tidak lengkap. Hotspot FIRMS: sumber belum terhubung.</p><a href="/karhutla" data-link>Detail karhutla</a>`; } catch (e) { box.innerHTML = `<h3>Api dan deteksi panas</h3>${errorState(e)}`; } }
  };
  const s1 = poll(loadAir), s2 = poll(loadFire); return () => { s1(); s2(); };
}
