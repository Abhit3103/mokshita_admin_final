/**
 * Mokshita Admin — Runtime API & Backend Configuration
 * Seamlessly resolves API endpoint with Vercel/Vite same-origin proxy to eliminate CORS errors.
 */

function resolveApiBase() {
  if (typeof window !== 'undefined' && (window.__BACKEND_URL__ || window.BACKEND_URL)) {
    const raw = String(window.__BACKEND_URL__ || window.BACKEND_URL).trim().replace(/\/+$/, '');
    return /\/api(?:\/v\d+)?$/i.test(raw) ? raw : `${raw}/api`;
  }

  if (import.meta.env.VITE_API_URL) {
    const raw = String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
    return /\/api(?:\/v\d+)?$/i.test(raw) ? raw : `${raw}/api`;
  }

  if (import.meta.env.VITE_BACKEND_URL) {
    const raw = String(import.meta.env.VITE_BACKEND_URL).trim().replace(/\/+$/, '');
    return /\/api(?:\/v\d+)?$/i.test(raw) ? raw : `${raw}/api`;
  }

  // When deployed on Vercel or any web host, use same-origin /api to leverage vercel.json proxy
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }

  // Local development fallback (Vite dev server proxies /api to Render backend)
  return '/api';
}

export const API_BASE = resolveApiBase();
export const BACKEND_URL = API_BASE.startsWith('http')
  ? API_BASE.replace(/\/(?:api(?:\/v\d+)?)?\/?$/i, '')
  : 'https://mokshita-final-release.onrender.com';

export const STOREFRONT_URL = 'https://www.mokshitahandicrafts.com';

console.log('[API CONFIG] Active API_BASE:', API_BASE);
