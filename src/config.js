/**
 * Mokshita Admin — Configuration
 * Production Render Backend & Local Dev fallback
 */

const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  return url.replace(/\/(?:api)?\/?$/i, '');
};

// Priority: Runtime window override > Vite env > Production Render URL
export const BACKEND_URL =
  normalizeUrl(typeof window !== 'undefined' && window.__BACKEND_URL__) ||
  normalizeUrl(import.meta.env.VITE_BACKEND_URL) ||
  'https://mokshita-final-release.onrender.com';

export const API_BASE = `${BACKEND_URL}/api`;

export const STOREFRONT_URL = 'https://www.mokshithandicrafts.com';
