/**
 * Mokshita Admin — Runtime API & Backend Configuration
 * Resolves production backend URL from Vite environment, window runtime or production fallback.
 */

function resolveApiBase() {
  const rawUrl =
    (typeof window !== 'undefined' && (window.__BACKEND_URL__ || window.BACKEND_URL)) ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'https://mokshita-final-release.onrender.com';

  const clean = String(rawUrl).trim().replace(/\/+$/, '');

  // If already ends in /api or /api/v1, use directly
  if (/\/api(?:\/v\d+)?$/i.test(clean)) {
    return clean;
  }
  return `${clean}/api`;
}

export const API_BASE = resolveApiBase();
export const BACKEND_URL = API_BASE.replace(/\/(?:api(?:\/v\d+)?)?\/?$/i, '');
export const STOREFRONT_URL = 'https://www.mokshithandicrafts.com';

console.log('[API CONFIG] Resolved API_BASE:', API_BASE);
