import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setLocalError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-canvas">
      <div className="login-card">
        <div className="login-brand-header">
          <div className="login-emblem">
            <Sparkles size={28} />
          </div>
          <h1 className="login-title">Mokshita Handicrafts</h1>
          <p className="login-subtitle">Executive Administration Portal</p>
        </div>

        {localError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-bd)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">
              Admin Email <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="admin@mokshithandicrafts.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '16px',
          }}
        >
          Protected System · Authorized Personnel Only
        </div>
      </div>
    </div>
  );
};
