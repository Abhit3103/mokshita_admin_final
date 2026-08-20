import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeFilter, setTimeFilter] = useState('30D');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.orders.getAll({ limit: 100 }),
        api.products.getAll({ limit: 100 }),
      ]);

      if (ordersRes.error && productsRes.error) {
        setError(ordersRes.error || productsRes.error);
      } else {
        setOrders(ordersRes.data?.orders || []);
        setProducts(productsRes.data?.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics from real data
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'payment_failed')
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const totalOrdersCount = orders.length;

  // Unique customers by email
  const uniqueCustomerEmails = new Set(
    orders.map((o) => (o.email || '').toLowerCase().trim()).filter(Boolean)
  );
  const customersCount = uniqueCustomerEmails.size;

  const totalProductsCount = products.length;

  const pendingOrders = orders.filter((o) => o.status === 'received');
  const pendingPayments = orders.filter((o) => o.status === 'pending_payment');
  const lowStockProducts = products.filter((p) => (parseInt(p.stock) || 0) < 10);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = orders
    .filter(
      (o) =>
        o.created_at?.startsWith(todayStr) &&
        o.status !== 'cancelled' &&
        o.status !== 'payment_failed'
    )
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  // Generate sales chart data based on time filter
  const getSalesChartData = () => {
    const daysMap = {};
    const now = new Date();

    let numDays = 30;
    if (timeFilter === '7D') numDays = 7;
    if (timeFilter === '30D') numDays = 30;
    if (timeFilter === '3M') numDays = 90;
    if (timeFilter === '1Y') numDays = 365;

    // Initialize all days with 0
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label =
        numDays <= 30
          ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      daysMap[dateKey] = { date: label, revenue: 0, orders: 0 };
    }

    orders.forEach((order) => {
      if (!order.created_at || order.status === 'cancelled') return;
      const orderDateKey = order.created_at.split('T')[0];
      if (daysMap[orderDateKey]) {
        daysMap[orderDateKey].revenue += parseFloat(order.total || 0);
        daysMap[orderDateKey].orders += 1;
      }
    });

    return Object.values(daysMap);
  };

  const chartData = getSalesChartData();
  const recentOrders = orders.slice(0, 7);

  if (loading) {
    return <LoadingState message="Fetching live store metrics and orders..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── TOP KPI METRICS ───────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext="Verified order gross"
          icon={IndianRupee}
          color="gold"
        />
        <StatCard
          label="Total Orders"
          value={totalOrdersCount}
          subtext="All-time placed orders"
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          label="Active Customers"
          value={customersCount}
          subtext="Unique buyer accounts"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Catalog Products"
          value={totalProductsCount}
          subtext="Active handicraft items"
          icon={Package}
          color="amber"
        />
      </div>

      {/* ── SECONDARY KPI CARDS ────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <Link to="/admin/orders?status=received" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Fulfillment</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-warning-text)', marginTop: '2px' }}>
                {pendingOrders.length} orders
              </div>
            </div>
            <Clock size={20} color="var(--status-warning-text)" />
          </div>
        </Link>

        <Link to="/admin/orders?status=pending_payment" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Payments</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-info-text)', marginTop: '2px' }}>
                {pendingPayments.length} transactions
              </div>
            </div>
            <CreditCard size={20} color="var(--status-info-text)" />
          </div>
        </Link>

        <Link to="/admin/inventory" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Low Stock Alert</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-danger-text)', marginTop: '2px' }}>
                {lowStockProducts.length} items
              </div>
            </div>
            <AlertTriangle size={20} color="var(--status-danger-text)" />
          </div>
        </Link>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Sales</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)', marginTop: '2px' }}>
              ₹{todaySales.toLocaleString('en-IN')}
            </div>
          </div>
          <TrendingUp size={20} color="var(--gold)" />
        </div>
      </div>

      {/* ── SALES OVERVIEW CHART & QUICK STATS ────────────── */}
      <div className="dashboard-chart-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="var(--gold)" />
              <span>Revenue Trend Overview</span>
            </div>
            <div className="chart-header-actions">
              {['7D', '30D', '3M', '1Y'].map((filter) => (
                <button
                  key={filter}
                  className={`time-filter-pill ${timeFilter === filter ? 'active' : ''}`}
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B08D57" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B08D57" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(176, 141, 87, 0.15)" />
                  <XAxis dataKey="date" stroke="#8F8175" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8F8175" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(176, 141, 87, 0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#B08D57"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions & Store Health */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>Quick Management</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/admin/products/new" className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>+ Add New Product</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/admin/orders" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Manage All Orders</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/admin/inventory" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Review Inventory Levels</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/admin/analytics" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Detailed Sales Reports</span>
              <ChevronRight size={16} />
            </Link>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-light)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <div>Live Database: Connected (Supabase)</div>
              <div>Razorpay Gateway: Active Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ORDERS ─────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShoppingBag size={18} color="var(--gold)" />
            <span>Recent Orders</span>
          </div>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
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
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
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
                        style={{ padding: '4px 8px', gap: '4px' }}
                      >
                        <Eye size={13} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
