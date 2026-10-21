export function json(res, status, body, cache = 's-maxage=300, stale-while-revalidate=900') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? `public, ${cache}` : 'no-store');
  res.end(JSON.stringify(body));
}
// Pesan aman: tidak membocorkan key/URL internal
export function errorBody(e) {
  const code = e.code ?? 'FAILED';
  const msg = { NOT_CONFIGURED: 'Sumber belum terhubung', AUTH: 'Kredensial ditolak provider', BAD_RESPONSE: 'Gagal mengambil data' }[code] ?? 'Gagal mengambil data';
  return { status: code === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'FAILED', message: msg, detail: code === 'NOT_CONFIGURED' ? e.message : undefined };
}
