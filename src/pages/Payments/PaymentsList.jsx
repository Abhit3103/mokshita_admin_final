import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  CreditCard,
  CheckCircle,
  Clock,
  ShieldCheck,
  Filter,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

export const PaymentsList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Razorpay Gateway Verification Modal state
  const [verifyModalPaymentId, setVerifyModalPaymentId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Manual Payment Confirmation state
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.orders.getAll({ limit: 100 });
      if (apiErr) {
        setError(apiErr);
      } else {
        setOrders(data?.orders || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerifyRazorpay = async (paymentId) => {
    if (!paymentId) return;
    setVerifyModalPaymentId(paymentId);
    setVerifying(true);
    setVerificationResult(null);
    setVerificationError(null);

    try {
      const { data, error: vErr } = await api.payments.verifyWithRazorpay(paymentId);
      if (vErr) {
        setVerificationError(vErr);
      } else {
        setVerificationResult(data?.data || data);
      }
    } catch (err) {
      setVerificationError(err.message || 'Verification request failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualPaymentConfirmation = async () => {
    if (!confirmOrder) return;
    setConfirming(true);
    try {
      // Update status to 'received'
      const { error: upErr } = await api.orders.updateStatus(confirmOrder.id, 'received');
      if (upErr) {
        alert(upErr);
      } else {
        // Save note
        await api.orders.updateTracking(
          confirmOrder.id,
          `Payment manually confirmed by Admin on ${new Date().toLocaleDateString('en-IN')}`
        );

        setOrders((prev) =>
          prev.map((o) =>
            o.id === confirmOrder.id ? { ...o, status: 'received' } : o
          )
        );
        setConfirmSuccess(`Payment for order ${confirmOrder.order_number || confirmOrder.id} marked as Confirmed!`);
        setTimeout(() => {
          setConfirmSuccess(null);
          setConfirmOrder(null);
        }, 1200);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Metrics
  const totalPaymentsAmount = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const successfulPayments = orders.filter(
    (o) => o.status === 'received' || o.status === 'shipped' || o.status === 'delivered'
  );
  const pendingPayments = orders.filter((o) => o.status === 'pending_payment');

  const razorpayOrders = orders.filter(
    (o) => (o.payment_method || '').toUpperCase() === 'RAZORPAY'
  );
  const codOrders = orders.filter(
    (o) => (o.payment_method || '').toUpperCase() === 'COD'
  );

  // Filters
  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.razorpay_payment_id || '').toLowerCase().includes(q);

    const matchesMethod =
      !methodFilter ||
      (order.payment_method || '').toUpperCase() === methodFilter.toUpperCase();

    let matchesStatus = true;
    if (statusFilter === 'successful') {
      matchesStatus =
        order.status === 'received' || order.status === 'shipped' || order.status === 'delivered';
    } else if (statusFilter === 'pending') {
      matchesStatus = order.status === 'pending_payment';
    } else if (statusFilter === 'failed') {
      matchesStatus = order.status === 'cancelled';
    }

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── METRIC CARDS ──────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-gold">
            <CreditCard size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Processed</span>
            <span className="stat-value">₹{totalPaymentsAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="stat-subtext">{orders.length} transactions total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Confirmed Payments</span>
            <span className="stat-value">{successfulPayments.length}</span>
            <span className="stat-subtext">Received & Captured</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Confirmation</span>
            <span className="stat-value">{pendingPayments.length}</span>
            <span className="stat-subtext">Awaiting manual or gateway capture</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Method Split</span>
            <span className="stat-value">{razorpayOrders.length} / {codOrders.length}</span>
            <span className="stat-subtext">Razorpay / COD</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by order #, customer name, or Razorpay ID..."
        />

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All Payment Methods</option>
            <option value="RAZORPAY">Razorpay (Online)</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Payment Statuses</option>
            <option value="successful">Confirmed / Paid</option>
            <option value="pending">Pending Payment</option>
            <option value="failed">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ── TRANSACTIONS TABLE ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CreditCard size={18} color="var(--gold)" />
            <span>Payment Records & Confirmations</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {filteredOrders.length} Transactions
          </span>
        </div>

        {loading ? (
          <LoadingState message="Loading payment transactions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPayments} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="No transactions match your search or filter criteria."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Payment Status</th>
                  <th>Razorpay ID</th>
                  <th>Date</th>
                  <th>Verification & Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isPaid =
                    order.status === 'received' ||
                    order.status === 'shipped' ||
                    order.status === 'delivered';

                  return (
                    <tr key={order.id}>
                      <td>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          style={{ fontWeight: 600, color: 'var(--gold)' }}
                        >
                          {order.order_number || order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.customer_name || 'Customer'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{order.email}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{parseFloat(order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <StatusBadge status={order.payment_method} type="payment" />
                      </td>
                      <td>
                        <StatusBadge status={isPaid ? 'paid' : order.status} type="payment" />
                      </td>
                      <td>
                        {order.razorpay_payment_id ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                            {order.razorpay_payment_id}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {order.razorpay_payment_id && (
                            <button
                              onClick={() => handleVerifyRazorpay(order.razorpay_payment_id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                              title="Verify directly with Razorpay API"
                            >
                              <ShieldCheck size={13} color="var(--gold)" />
                              Verify Gateway
                            </button>
                          )}

                          {!isPaid ? (
                            <button
                              onClick={() => setConfirmOrder(order)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                              title="Confirm payment received"
                            >
                              <Check size={13} />
                              Confirm Payment
                            </button>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--status-success-text)' }}>
                              <CheckCircle size={13} /> Confirmed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MANUAL PAYMENT CONFIRMATION MODAL ──────────────── */}
      <Modal
        isOpen={!!confirmOrder}
        onClose={() => setConfirmOrder(null)}
        title="Confirm Payment Received"
        maxWidth="460px"
        footer={
          confirmOrder && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmOrder(null)}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleManualPaymentConfirmation}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Confirming...</span>
                  </>
                ) : (
                  'Mark as Payment Received'
                )}
              </button>
            </div>
          )
        }
      >
        {confirmOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
              Are you sure you want to mark payment of{' '}
              <strong>₹{parseFloat(confirmOrder.total || 0).toLocaleString('en-IN')}</strong> for Order{' '}
              <strong>{confirmOrder.order_number || confirmOrder.id}</strong> as <strong>Paid / Received</strong>?
            </p>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px' }}>
              <div><strong>Customer:</strong> {confirmOrder.customer_name} ({confirmOrder.email})</div>
              <div style={{ marginTop: '4px' }}><strong>Method:</strong> {confirmOrder.payment_method}</div>
            </div>

            {confirmSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success-text)', fontSize: '13px' }}>
                <CheckCircle size={16} />
                <span>{confirmSuccess}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── RAZORPAY VERIFICATION MODAL ────────────────────── */}
      <Modal
        isOpen={!!verifyModalPaymentId}
        onClose={() => setVerifyModalPaymentId(null)}
        title="Razorpay Direct Verification"
        maxWidth="500px"
      >
        {verifying ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px', color: 'var(--gold)' }} />
            <p>Querying Razorpay Gateway for payment ID: {verifyModalPaymentId}...</p>
          </div>
        ) : verificationError ? (
          <div style={{ color: 'var(--status-danger-text)', padding: '16px' }}>
            <strong>Verification Notice:</strong> {verificationError}
          </div>
        ) : verificationResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success-text)' }}>
              <CheckCircle size={18} />
              <strong>Payment Authenticated on Razorpay</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              <div><strong>ID:</strong> {verificationResult.id}</div>
              <div><strong>Captured Amount:</strong> ₹{verificationResult.amount} {verificationResult.currency}</div>
              <div><strong>Gateway Status:</strong> {verificationResult.status}</div>
              <div><strong>Payment Method:</strong> {verificationResult.method}</div>
              <div><strong>Payer Email:</strong> {verificationResult.email || 'N/A'}</div>
              <div><strong>Timestamp:</strong> {verificationResult.created_at || 'N/A'}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
