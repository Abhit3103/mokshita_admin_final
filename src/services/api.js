/**
 * Mokshita Admin — API Service
 * Interacts securely with the Mokshita Express/PostgreSQL Backend
 */

import axios from 'axios';
import { API_BASE, BACKEND_URL } from '../config';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mokshita_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mokshita_token');
      localStorage.removeItem('mokshita_user');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic wrapper for clean { data, error } handling
async function call(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    let message = 'An unexpected server error occurred.';
    if (err.response?.data) {
      message = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
    } else if (err.request) {
      message = 'Unable to reach the backend server. Please check your network or server status.';
    } else if (err.message) {
      message = err.message;
    }
    return { data: null, error: message };
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      call(() => client.post('/auth/login', { email, password })),
    getMe: () =>
      call(() => client.get('/auth/me')),
    logout: () =>
      call(() => client.post('/auth/logout')),
  },

  // ── Orders ────────────────────────────────────────────
  orders: {
    getAll: (params = {}) =>
      call(() => client.get('/admin/orders', { params })),
    updateStatus: (orderId, status) =>
      call(() => client.put(`/admin/orders/${orderId}/status`, { status })),
    updateTracking: (orderId, tracking_note) =>
      call(() => client.put(`/admin/orders/${orderId}/tracking`, { tracking_note })),
  },

  // ── Products ──────────────────────────────────────────
  products: {
    getAll: (params = {}) =>
      call(() => client.get('/products', { params })),
    getDetail: (slug) =>
      call(() => client.get(`/products/detail/${encodeURIComponent(slug)}`)),
    create: (productData) =>
      call(() => client.post('/products', productData)),
    update: (id, productData) =>
      call(() => client.put(`/products/${id}`, productData)),
    delete: (id) =>
      call(() => client.delete(`/products/${id}`)),
    search: (q, params = {}) =>
      call(() => client.get('/products/search', { params: { q, ...params } })),
  },

  // ── Categories ────────────────────────────────────────
  categories: {
    getAll: () =>
      call(() => client.get('/categories')),
    create: (data) =>
      call(() => client.post('/admin/categories', data)),
    update: (id, data) =>
      call(() => client.put(`/admin/categories/${id}`, data)),
    delete: (id) =>
      call(() => client.delete(`/admin/categories/${id}`)),
  },

  // ── Payments & Verification ───────────────────────────
  payments: {
    getStatus: (orderId) =>
      call(() => client.get(`/payments/${encodeURIComponent(orderId)}/status`)),
    verifyWithRazorpay: (paymentId) =>
      call(() => client.get(`/payments/verify-razorpay/${encodeURIComponent(paymentId)}`)),
  },

  // ── Customer Queries & Leads ──────────────────────────
  leads: {
    getAll: (params = {}) =>
      call(() => client.get('/leads', { params })),
    create: (leadData) =>
      call(() => client.post('/leads', leadData)),
  },

  // ── Image Upload ──────────────────────────────────────
  upload: {
    image: (formData) =>
      call(() =>
        client.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ),
  },

  // ── System ────────────────────────────────────────────
  getBackendUrl: () => BACKEND_URL,
};
