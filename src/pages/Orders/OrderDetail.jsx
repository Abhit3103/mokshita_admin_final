import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  Loader2,
  Package,
  Check,
} from 'lucide-react';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status & Tracking update states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const [trackingNote, setTrackingNote] = useState('');
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState(null);

  // Payment Confirmation state
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmMessage, setPaymentConfirmMessage] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.orders.getAll({ limit: 100 });
      if (apiErr) {
        setError(apiErr);
      } else {
        const found = (data?.orders || []).find(
          (o) => o.id === id || o.order_number === id
        );
        if (!found) {
          setError(`Order with ID ${id} was not found in the database.`);
        } else {
          setOrder(found);
          setNewStatus(found.status);
          setTrackingNote(found.tracking_note || '');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!order?.id || !newStatus) return;

    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const { data, error: updateErr } = await api.orders.updateStatus(order.id, newStatus);
      if (updateErr) {
        setStatusMessage({ type: 'error', text: updateErr });
      } else {
        setStatusMessage({ type: 'success', text: `Status updated to "${newStatus}".` });
        setOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    if (!order?.id || !trackingNote.trim()) return;

    setUpdatingTracking(true);
    setTrackingMessage(null);
    try {
      const { data, error: updateErr } = await api.orders.updateTracking(order.id, trackingNote.trim());
      if (updateErr) {
        setTrackingMessage({ type: 'error', text: updateErr });
      } else {
        setTrackingMessage({ type: 'success', text: 'Tracking note updated successfully.' });
        setOrder((prev) => ({ ...prev, tracking_note: trackingNote.trim() }));
      }
    } catch (err) {
      setTrackingMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingTracking(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order?.id) return;
    setConfirmingPayment(true);
    setPaymentConfirmMessage(null);
    try {
      const { error: upErr } = await api.orders.updateStatus(order.id, 'received');
      if (upErr) {
        setPaymentConfirmMessage({ type: 'error', text: upErr });
      } else {
        await api.orders.updateTracking(
          order.id,
          `Payment verified & confirmed by Admin on ${new Date().toLocaleDateString('en-IN')}`
        );
        setOrder((prev) => ({ ...prev, status: 'received' }));
        setNewStatus('received');
        setPaymentConfirmMessage({ type: 'success', text: 'Payment confirmed! Order marked as received.' });
      }
    } catch (err) {
      setPaymentConfirmMessage({ type: 'error', text: err.message });
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching comprehensive order record..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrder} />;
  }

  if (!order) return null;

  const isPaymentPaid =
    order.status === 'received' ||
    order.status === 'shipped' ||
    order.status === 'delivered';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER NAVIGATION & ORDER SUMMARY ─────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/admin/orders" className="btn-icon-only" title="Back to orders">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px' }}>
                Order {order.order_number || order.id}
              </h2>
              <StatusBadge status={order.status} type="order" />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Database ID: <span style={{ fontFamily: 'monospace' }}>{order.id}</span> · Placed on{' '}
              {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusBadge status={order.payment_method} type="payment" />
        </div>
      </div>

      {/* ── TWO-COLUMN DETAILS GRID ───────────────────────── */}
      <div className="order-detail-grid">
        {/* LEFT COLUMN: ITEMS & FINANCIAL SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Order Items Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShoppingBag size={18} color="var(--gold)" />
                <span>Purchased Handicrafts ({(order.items || []).length})</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px 24px' }}>
              {(!order.items || order.items.length === 0 || !order.items[0]?.product_name) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '16px 0' }}>
                  No item breakdown available for this order record.
                </div>
              ) : (
                <div className="order-items-list">
                  {order.items.map((item, idx) => {
                    const price = parseFloat(item.price_at_time || 0);
                    const qty = parseInt(item.quantity) || 1;
                    const itemTotal = price * qty;

                    return (
                      <div key={idx} className="order-item-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--gold)',
                            }}
                          >
                            <Package size={22} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.product_name || `Product ID: ${item.product_id}`}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Unit Price: ₹{price.toLocaleString('en-IN')} × {qty}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span>₹{parseFloat(order.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="order-summary-row">
                  <span>Shipping Cost</span>
                  <span>
                    {parseFloat(order.shipping_cost || 0) === 0
                      ? 'FREE (Threshold met)'
                      : `₹${parseFloat(order.shipping_cost).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="order-summary-row total">
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--gold-hover)' }}>
                    ₹{parseFloat(order.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CreditCard size={18} color="var(--gold)" />
                <span>Payment Information</span>
              </div>
              <StatusBadge status={order.payment_method} type="payment" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Payment Method
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : 'Razorpay Secure Online'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Payment Status
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    <StatusBadge
                      status={isPaymentPaid ? 'paid' : order.status}
                      type="payment"
                    />
                  </div>
                </div>

                {order.razorpay_order_id && (
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Razorpay Order ID
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12.5px', marginTop: '2px' }}>
                      {order.razorpay_order_id}
                    </div>
                  </div>
                )}

                {order.razorpay_payment_id && (
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Razorpay Payment ID
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12.5px', marginTop: '2px', color: 'var(--gold)' }}>
                      {order.razorpay_payment_id}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Confirmation Action */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Payment Confirmation</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isPaymentPaid
                      ? 'Payment has been authenticated and confirmed.'
                      : 'Payment is currently pending verification or COD collection.'}
                  </div>
                </div>

                {!isPaymentPaid ? (
                  <button
                    onClick={handleConfirmPayment}
                    className="btn btn-primary btn-sm"
                    disabled={confirmingPayment}
                    style={{ gap: '6px' }}
                  >
                    {confirmingPayment ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Confirm Payment</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: 'var(--status-success-text)', fontWeight: 600 }}>
                    <CheckCircle size={15} /> Payment Confirmed
                  </span>
                )}
              </div>

              {paymentConfirmMessage && (
                <div
                  style={{
                    fontSize: '12px',
                    color: paymentConfirmMessage.type === 'success' ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                  }}
                >
                  {paymentConfirmMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER, SHIPPING & STATUS CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Order Status & Tracking Controller */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Truck size={18} color="var(--gold)" />
                <span>Fulfillment Controls</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Update Order Status
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-select"
                    style={{ flex: 1 }}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="received">Received (New)</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={updatingStatus || newStatus === order.status}
                  >
                    {updatingStatus ? <Loader2 className="animate-spin" size={14} /> : 'Update'}
                  </button>
                </div>
                {statusMessage && (
                  <div
                    style={{
                      fontSize: '12px',
                      marginTop: '6px',
                      color: statusMessage.type === 'success' ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                    }}
                  >
                    {statusMessage.text}
                  </div>
                )}
              </form>

              {/* Tracking Note Form */}
              <form onSubmit={handleTrackingSubmit} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Courier Tracking Note / Waybill
                </label>
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. BlueDart Tracking: #BLU12345678"
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                    disabled={updatingTracking || !trackingNote.trim()}
                  >
                    {updatingTracking ? <Loader2 className="animate-spin" size={14} /> : 'Save Tracking Note'}
                  </button>
                </div>
                {trackingMessage && (
                  <div
                    style={{
                      fontSize: '12px',
                      marginTop: '6px',
                      color: trackingMessage.type === 'success' ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                    }}
                  >
                    {trackingMessage.text}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Customer Profile Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <User size={18} color="var(--gold)" />
                <span>Customer Profile</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</div>
                <div style={{ fontWeight: 600 }}>{order.customer_name || 'Customer'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ color: 'var(--text-primary)' }}>{order.email || 'Not provided'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</div>
                <div style={{ color: 'var(--text-primary)' }}>{order.phone || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <MapPin size={18} color="var(--gold)" />
                <span>Shipping Address</span>
              </div>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                <strong>{order.customer_name}</strong>
                <br />
                {order.address_line}
                <br />
                {order.city && `${order.city}, `}
                {order.state && `${order.state} `}
                {order.pincode && `— PIN: ${order.pincode}`}
                <br />
                Phone: {order.phone || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
