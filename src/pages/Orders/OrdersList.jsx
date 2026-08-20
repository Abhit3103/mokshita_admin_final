import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Eye, ShoppingBag, Filter } from 'lucide-react';

export const OrdersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter) params.status = statusFilter;

      const { data, error: apiErr } = await api.orders.getAll(params);
      if (apiErr) {
        setError(apiErr);
      } else {
        setOrders(data?.orders || []);
        setTotal(data?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const handleStatusChange = (val) => {
    setCurrentPage(1);
    if (val) {
      setSearchParams({ status: val });
    } else {
      setSearchParams({});
    }
  };

  // Client-side search and payment filter over current page dataset
  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.email || '').toLowerCase().includes(q) ||
      (order.phone || '').includes(q);

    const matchesPayment =
      !paymentFilter ||
      (order.payment_method || '').toUpperCase() === paymentFilter.toUpperCase();

    return matchesSearch && matchesPayment;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by order #, customer name, email or phone..."
        />

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="received">Received (New)</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payment Methods</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="RAZORPAY">Razorpay Online</option>
          </select>
        </div>
      </div>

      {/* ── ORDERS TABLE ───────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShoppingBag size={18} color="var(--gold)" />
            <span>All Customer Orders</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {total} Total Orders in Database
          </span>
        </div>

        {loading ? (
          <LoadingState message="Fetching order records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="No orders match your filter and search criteria."
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer Details</th>
                    <th>Date Placed</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const itemCount = (order.items || []).reduce(
                      (sum, it) => sum + (parseInt(it.quantity) || 1),
                      0
                    );

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            style={{ fontWeight: 600, color: 'var(--gold)' }}
                          >
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.customer_name || 'Valued Customer'}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {order.email} {order.phone && `· ${order.phone}`}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{parseFloat(order.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <StatusBadge status={order.payment_method} type="payment" />
                        </td>
                        <td>
                          <StatusBadge status={order.status} type="order" />
                        </td>
                        <td>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 10px', gap: '4px' }}
                          >
                            <Eye size={13} />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};
