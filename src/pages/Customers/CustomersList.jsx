import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Users, Eye, Mail, Phone, ShoppingBag } from 'lucide-react';

export const CustomersList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.orders.getAll({ limit: 100 });
      if (apiErr) {
        setError(apiErr);
      } else {
        const orders = data?.orders || [];
        const customerMap = {};

        orders.forEach((order) => {
          const email = (order.email || '').toLowerCase().trim();
          if (!email) return;

          if (!customerMap[email]) {
            customerMap[email] = {
              id: order.user_id || email,
              email: email,
              name: order.customer_name || 'Customer',
              phone: order.phone || '—',
              ordersCount: 0,
              totalSpent: 0,
              lastOrderDate: order.created_at,
              orders: [],
            };
          }

          customerMap[email].ordersCount += 1;
          if (order.status !== 'cancelled' && order.status !== 'payment_failed') {
            customerMap[email].totalSpent += parseFloat(order.total || 0);
          }
          customerMap[email].orders.push(order);

          // Track latest order date
          if (
            new Date(order.created_at) >
            new Date(customerMap[email].lastOrderDate || 0)
          ) {
            customerMap[email].lastOrderDate = order.created_at;
          }
        });

        setCustomers(Object.values(customerMap));
      }
    } catch (err) {
      setError(err.message || 'Failed to aggregate customer profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      cust.name.toLowerCase().includes(q) ||
      cust.email.toLowerCase().includes(q) ||
      cust.phone.includes(q)
    );
  });

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customers by name, email, or phone number..."
        />

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing verified purchaser accounts
        </div>
      </div>

      {/* ── CUSTOMER TABLE ─────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Users size={18} color="var(--gold)" />
            <span>Customer Directory</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {customers.length} Unique Buyers
          </span>
        </div>

        {loading ? (
          <LoadingState message="Aggregating buyer profiles from verified orders..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCustomers} />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="No customer accounts match your search query."
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Cumulative Spend</th>
                    <th>Latest Purchase</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((cust) => (
                    <tr key={cust.email}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {cust.name}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{cust.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{cust.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            background: 'var(--bg-app)',
                            borderRadius: 'var(--radius-xs)',
                            fontWeight: 600,
                            fontSize: '12.5px',
                          }}
                        >
                          {cust.ordersCount} order{cust.ordersCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{cust.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {cust.lastOrderDate
                          ? new Date(cust.lastOrderDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <Link
                          to={`/admin/customers/${encodeURIComponent(cust.email)}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', gap: '4px' }}
                        >
                          <Eye size={13} />
                          Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredCustomers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
