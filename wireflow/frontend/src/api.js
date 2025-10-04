export default async function apiFetch(path, { method = 'GET', body, headers = {} } = {}, token = null) {
  // Allow override from Vite env (VITE_BACKEND_URL) or a global window variable.
  // Falls back to the backend used during development.
  // Default to a relative base so the browser will request "/api/..." which the
  // Vite dev server proxies to the backend (see `vite.config.js`). Use the
  // VITE_BACKEND_URL env var or window.__BACKEND_URL__ to override when needed.
  const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
    || (typeof window !== 'undefined' && window.__BACKEND_URL__)
    || '';

  // If a full URL was provided, use it as-is. Otherwise, prefix relative paths with BASE_URL.
  const url = (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://')))
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const h = { ...headers };
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    h['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(url, { method, body, headers: h });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw { status: res.status, data };
    return data;
  }
  if (!res.ok) throw { status: res.status, data: null };
  return null;
}
