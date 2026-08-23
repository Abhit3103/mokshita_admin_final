import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { STOREFRONT_URL } from '../../config';
import {
  Store,
  Truck,
  CreditCard,
  Server,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

export const SettingsView = () => {
  const { user } = useAuth();
  const backendUrl = api.getBackendUrl();

  // Delivery Settings State
  const [delivery, setDelivery] = useState({
    enabled: true,
    flat_fee: 80,
    free_threshold: 999,
    description: 'Standard all-India delivery',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const { data, error } = await api.settings.getDelivery();
      if (data?.data) {
        setDelivery(data.data);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  // Save settings handler
  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data, error } = await api.settings.updateDelivery({
      enabled: delivery.enabled,
      flat_fee: Number(delivery.flat_fee),
      free_threshold: Number(delivery.free_threshold),
      description: delivery.description,
    });

    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setMessage({
        type: 'success',
        text: `Delivery charges ${data?.data?.enabled ? 'enabled' : 'disabled (Free Delivery)'} successfully!`,
      });
      if (data?.data) setDelivery(data.data);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '22px' }}>System Settings & Configuration</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Manage store delivery policies, payment gateway configs, and backend architecture
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        
        {/* ── SHIPPING & DELIVERY CONTROL PANEL ─────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Truck size={18} color="var(--gold)" />
              <span>Delivery Charges & Rules</span>
            </div>
            <span
              className={`badge ${delivery.enabled ? 'badge-success' : 'badge-neutral'}`}
              style={{ fontSize: '11px' }}
            >
              {delivery.enabled ? 'Charges Active' : 'Free Delivery (All Orders)'}
            </span>
          </div>

          <div className="card-body">
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 8px' }} />
                <span>Loading delivery configuration...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ON / OFF Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Delivery Charges</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {delivery.enabled
                        ? 'Flat delivery fees apply to orders below free threshold'
                        : 'Turned OFF: Customers receive 100% Free Shipping on all orders'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDelivery((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: delivery.enabled ? 'var(--gold)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    title={delivery.enabled ? 'Click to turn OFF delivery charges' : 'Click to turn ON delivery charges'}
                  >
                    {delivery.enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                  </button>
                </div>

                {/* Conditional Inputs when Enabled */}
                {delivery.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                        Flat Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        value={delivery.flat_fee}
                        onChange={(e) => setDelivery({ ...delivery, flat_fee: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                        Free Shipping Above (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        value={delivery.free_threshold}
                        onChange={(e) => setDelivery({ ...delivery, free_threshold: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Description input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Delivery Label / Note
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={delivery.description || ''}
                    onChange={(e) => setDelivery({ ...delivery, description: e.target.value })}
                    placeholder="e.g. Standard Surface Courier"
                  />
                </div>

                {/* Live Preview Info */}
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <Info size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    {delivery.enabled ? (
                      <span>
                        Orders under <strong>₹{delivery.free_threshold}</strong> will be charged a shipping fee of <strong>₹{delivery.flat_fee}.00</strong>. Orders <strong>₹{delivery.free_threshold} and above</strong> qualify for <strong>Free Shipping</strong>.
                      </span>
                    ) : (
                      <span>
                        Delivery charges are currently <strong>OFF</strong>. All customer orders will receive <strong>100% Free Delivery</strong>.
                      </span>
                    )}
                  </div>
                </div>

                {/* Message display */}
                {message && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
                      color: message.type === 'success' ? '#137333' : '#c5221f',
                    }}
                  >
                    {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', gap: '6px', marginTop: '4px' }}
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  <span>{saving ? 'Saving...' : 'Save Delivery Rules'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

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
                <span className="info-val">support@mokshitahandicrafts.com</span>
              </div>
              <div className="info-item">
                <span className="info-label">Origin Location</span>
                <span className="info-val">Varanasi, Uttar Pradesh, India</span>
              </div>
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
