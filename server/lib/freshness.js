// Aturan freshness (didokumentasikan di /metodologi)
export const FRESH_MINUTES = { fires: 6 * 60, air: 3 * 60 };
export function freshness(observedAtIso, kind, now = Date.now()) {
  if (!observedAtIso) return 'UNKNOWN';
  const t = Date.parse(observedAtIso);
  if (Number.isNaN(t)) return 'UNKNOWN';
  return (now - t) / 60000 <= FRESH_MINUTES[kind] ? 'FRESH' : 'STALE';
}
export function inIndonesia(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -11.5 && lat <= 6.5 && lon >= 94.5 && lon <= 141.5;
}
