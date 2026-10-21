// fetch dengan timeout + retry (exponential backoff) + penanganan 429
export async function fetchRetry(url, opts = {}, { retries = 2, timeoutMs = 12000 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
        lastErr.status = res.status;
        if (i < retries) { await new Promise(r => setTimeout(r, 600 * 2 ** i)); continue; }
        throw lastErr;
      }
      return res;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (i < retries) await new Promise(r => setTimeout(r, 600 * 2 ** i));
    }
  }
  throw lastErr;
}
