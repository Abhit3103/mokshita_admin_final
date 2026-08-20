import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingBag, Eye, IndianRupee } from 'lucide-react';

export const CustomerDetail = () => {
  const { id } = useParams(); // email or user_id
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: apiErr } = await api.orders.getAll({ limit: 100 });
        if (apiErr) {
          setError(apiErr);
        } else {
          const orders = data?.orders || [];
          const decodedId = decodeURIComponent(id).toLowerCase().trim();

          const matchedOrders = orders.filter(
            (o) =>
              (o.email || '').toLowerCase().trim() === decodedId ||
              o.user_id === decodedId
          );

          if (matchedOrders.length === 0) {
            setError(`No customer records found matching "${decodedId}".`);
          } else {
            const first = matchedOrders[0];
            const totalSpent = matchedOrders
              .filter((o) => o.status !== 'cancelled' && o.status !== 'payment_failed')
              .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

            setCustomer({
              name: first.customer_name || 'Customer',
              email: first.email,
              phone: first.phone || 'N/A',
              address: `${first.address_line || ''}, ${first.city || ''}, ${first.state || ''} ${first.pincode || ''}`,
              totalSpent,
              ordersCount: matchedOrders.length,
            });

            setCustomerOrders(matchedOrders);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load customer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading customer profile and purchase history..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!customer) return null;

  const aov =
    customer.ordersCount > 0
      ? (customer.totalSpent / customer.ordersCount).toFixed(0)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/admin/customers" className="btn-icon-only" title="Back to customers">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '22px' }}>{customer.name}</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Customer Profile & Purchase History
          </p>
        </div>
      </div>

      {/* ── SUMMARY METRICS & DETAILS ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Purchases</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {customer.ordersCount} Orders
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lifetime Spend</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)', marginTop: '4px' }}>
            ₹{customer.totalSpent.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Order Value</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            ₹{Number(aov).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* ── PROFILE INFO CARD ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <User size={18} color="var(--gold)" />
            <span>Contact & Address Profile</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Mail size={15} color="var(--gold)" />
                <span style={{ fontWeight: 600 }}>{customer.email}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Phone size={15} color="var(--gold)" />
                <span style={{ fontWeight: 600 }}>{customer.phone}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shipping Address</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                <MapPin size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{customer.address || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ORDER HISTORY TABLE ───────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShoppingBag size={18} color="var(--gold)" />
            <span>Customer Purchase History ({customerOrders.length})</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      style={{ fontWeight: 600, color: 'var(--gold)' }}
                    >
                      {ord.order_number || ord.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>
                    {ord.created_at
                      ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <StatusBadge status={ord.payment_method} type="payment" />
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{parseFloat(ord.total || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <StatusBadge status={ord.status} type="order" />
                  </td>
                  <td>
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', gap: '4px' }}
                    >
                      <Eye size={13} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
