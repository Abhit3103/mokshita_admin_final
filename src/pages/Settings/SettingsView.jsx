import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { STOREFRONT_URL } from '../../config';
import {
  Settings,
  Store,
  Truck,
  CreditCard,
  User,
  Shield,
  Server,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

export const SettingsView = () => {
  const { user } = useAuth();
  const backendUrl = api.getBackendUrl();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '22px' }}>System Settings & Configuration</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Overview of store policies, shipping business rules, payment gateways, and backend architecture
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* ── STORE INFORMATION ────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Store size={18} color="var(--gold)" />
              <span>Storefront Brand Identity</span>
            </div>
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '12px', gap: '4px' }}
            >
              <span>Visit</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="card-body">
            <div className="settings-section">
              <div className="info-item">
                <span className="info-label">Brand Name</span>
                <span className="info-val">Mokshita Handicrafts</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tagline</span>
                <span className="info-val">Handcrafted Heritage of India</span>
              </div>
              <div className="info-item">
                <span className="info-label">Primary Currency</span>
                <span className="info-val">INR (₹)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Support Email</span>
                <span className="info-val">support@mokshithandicrafts.com</span>
              </div>
              <div className="info-item">
                <span className="info-label">Origin Location</span>
                <span className="info-val">Varanasi, Uttar Pradesh, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SHIPPING LOGIC & RULES ───────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Truck size={18} color="var(--gold)" />
              <span>Shipping & Delivery Rules</span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--gold)', fontWeight: 600 }}>
              Backend Enforced
            </span>
          </div>
          <div className="card-body">
            <div className="settings-section">
              <div className="info-item">
                <span className="info-label">Standard Shipping Fee</span>
                <span className="info-val">₹80.00 Flat Rate</span>
              </div>
              <div className="info-item">
                <span className="info-label">Free Shipping Threshold</span>
                <span className="info-val">Orders above ₹999.00</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fulfillment Modes</span>
                <span className="info-val">Standard Surface Courier / Express</span>
              </div>
              <div className="info-item">
                <span className="info-label">Coverage Region</span>
                <span className="info-val">All India PIN Codes Supported</span>
              </div>
            </div>
            <div
              style={{
                marginTop: '16px',
                padding: '10px 12px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <strong>Note:</strong> Shipping rules are atomically evaluated by the server-side order calculation engine to guarantee checkout price consistency.
            </div>
          </div>
        </div>

        {/* ── PAYMENT GATEWAY INTEGRATIONS ─────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="var(--gold)" />
              <span>Payment Gateway Status</span>
            </div>
          </div>
          <div className="card-body">
            <div className="settings-section">
              <div className="info-item">
                <span className="info-label">Razorpay Gateway</span>
                <span className="badge badge-success">
                  <CheckCircle size={12} /> Connected (Active)
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Razorpay Mode</span>
                <span className="info-val">Production Live API</span>
              </div>
              <div className="info-item">
                <span className="info-label">Signature Verification</span>
                <span className="info-val">HMAC-SHA256 Server-Side Verified</span>
              </div>
              <div className="info-item">
                <span className="info-label">Cash on Delivery (COD)</span>
                <span className="badge badge-success">
                  <CheckCircle size={12} /> Enabled
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Credential Protection</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Secret keys secured in backend environment
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ADMIN ACCOUNT & SYSTEM INFRASTRUCTURE ────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={18} color="var(--gold)" />
              <span>Backend & Database Infrastructure</span>
            </div>
          </div>
          <div className="card-body">
            <div className="settings-section">
              <div className="info-item">
                <span className="info-label">Active Admin</span>
                <span className="info-val">{user?.email || 'Administrator'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Assigned Role</span>
                <span className="badge badge-success">{user?.role || 'admin'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Backend API URL</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                  {backendUrl}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Database Layer</span>
                <span className="info-val">Supabase PostgreSQL 15</span>
              </div>
              <div className="info-item">
                <span className="info-label">Auth Provider</span>
                <span className="info-val">Supabase Auth (JWT Verified)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
