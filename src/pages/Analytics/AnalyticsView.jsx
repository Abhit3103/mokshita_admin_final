import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Package,
  CreditCard,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GOLD_PALETTE = ['#B08D57', '#8F7041', '#C9AF85', '#2E241B', '#6E6257', '#A85832'];

export const AnalyticsView = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30D');

  const fetchAnalyticsData = async () => {
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
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating performance and sales insights..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAnalyticsData} />;
  }

  // Filter orders by active status
  const validOrders = orders.filter(
    (o) => o.status !== 'cancelled' && o.status !== 'payment_failed'
  );

  const totalRevenue = validOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders = validOrders.length;
  const aov = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

  // 1. Revenue & Order Trends over time
  const getTrendData = () => {
    const daysMap = {};
    const now = new Date();
    let numDays = 30;
    if (period === '7D') numDays = 7;
    if (period === '30D') numDays = 30;
    if (period === '3M') numDays = 90;
    if (period === '1Y') numDays = 365;

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

    validOrders.forEach((o) => {
      if (!o.created_at) return;
      const key = o.created_at.split('T')[0];
      if (daysMap[key]) {
        daysMap[key].revenue += parseFloat(o.total || 0);
        daysMap[key].orders += 1;
      }
    });

    return Object.values(daysMap);
  };

  const trendData = getTrendData();

  // 2. Top Products Sold (best sellers)
  const productSalesMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const name = it.product_name || `Product ${it.product_id?.slice(0, 6)}`;
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, quantity: 0, revenue: 0 };
      }
      productSalesMap[name].quantity += parseInt(it.quantity) || 1;
      productSalesMap[name].revenue +=
        (parseFloat(it.price_at_time) || 0) * (parseInt(it.quantity) || 1);
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // 3. Category Sales Distribution
  const categoryMap = {};
  products.forEach((p) => {
    const cat = p.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Payment Method Breakdown
  const paymentMethodMap = { Razorpay: 0, COD: 0 };
  orders.forEach((o) => {
    const m = (o.payment_method || '').toUpperCase();
    if (m === 'RAZORPAY') paymentMethodMap.Razorpay += 1;
    else if (m === 'COD') paymentMethodMap.COD += 1;
  });

  const paymentData = [
    { name: 'Razorpay (Online)', value: paymentMethodMap.Razorpay },
    { name: 'Cash on Delivery (COD)', value: paymentMethodMap.COD },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER WITH PERIOD FILTER ─────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px' }}>Performance Analytics</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Real-time business intelligence calculated directly from orders and catalog database
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['7D', '30D', '3M', '1Y'].map((p) => (
            <button
              key={p}
              className={`time-filter-pill ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOP KPI CARDS ─────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-gold">
            <IndianRupee size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Gross Revenue</span>
            <span className="stat-value">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="stat-subtext">Cumulative verified volume</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Completed Orders</span>
            <span className="stat-value">{totalOrders}</span>
            <span className="stat-subtext">Successful transactions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Order Value</span>
            <span className="stat-value">₹{Number(aov).toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Per-order basket size</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Package size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active SKUs</span>
            <span className="stat-value">{products.length}</span>
            <span className="stat-subtext">Catalog products</span>
          </div>
        </div>
      </div>

      {/* ── SALES OVER TIME AREA CHART ────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="var(--gold)" />
            <span>Revenue Growth Trend ({period})</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#analyticsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN CHARTS: BEST SELLERS & CATEGORY / PAYMENT SPLIT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Top Products Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Package size={18} color="var(--gold)" />
              <span>Best Selling Handicrafts (Units Sold)</span>
            </div>
          </div>
          <div className="card-body">
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No individual item sales data available yet.
              </div>
            ) : (
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(176, 141, 87, 0.12)" />
                    <XAxis type="number" stroke="#8F8175" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#8F8175" fontSize={11} width={120} />
                    <Tooltip
                      formatter={(val, name, props) => [
                        `${val} units sold (₹${props.payload.revenue.toLocaleString('en-IN')})`,
                        'Sales',
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(176, 141, 87, 0.3)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="quantity" fill="#B08D57" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="var(--gold)" />
              <span>Payment Methods Distribution</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GOLD_PALETTE[index % GOLD_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(176, 141, 87, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
