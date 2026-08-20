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
  Boxes,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit2,
  Loader2,
  Filter,
} from 'lucide-react';

export const InventoryList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Quick Stock Adjustment Modal state
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [stockError, setStockError] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.products.getAll({ limit: 100 });
      if (apiErr) {
        setError(apiErr);
      } else {
        setProducts(data?.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (product) => {
    setAdjustProduct(product);
    setNewStockVal(String(product.stock ?? 0));
    setStockError(null);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;

    const parsed = parseInt(newStockVal);
    if (isNaN(parsed) || parsed < 0) {
      setStockError('Please provide a valid non-negative integer.');
      return;
    }

    setUpdatingStock(true);
    setStockError(null);

    try {
      const { data, error: upErr } = await api.products.update(adjustProduct.id, {
        stock: parsed,
      });

      if (upErr) {
        setStockError(upErr);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === adjustProduct.id ? { ...p, stock: parsed } : p))
        );
        setAdjustProduct(null);
      }
    } catch (err) {
      setStockError(err.message || 'Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Metrics
  const totalProducts = products.length;
  const inStock = products.filter((p) => (parseInt(p.stock) || 0) >= 10);
  const lowStock = products.filter(
    (p) => (parseInt(p.stock) || 0) > 0 && (parseInt(p.stock) || 0) < 10
  );
  const outOfStock = products.filter((p) => (parseInt(p.stock) || 0) === 0);

  // Filters
  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (product.name || '').toLowerCase().includes(q) ||
      (product.slug || '').toLowerCase().includes(q);

    const stock = parseInt(product.stock) || 0;
    let matchesStatus = true;
    if (statusFilter === 'in_stock') matchesStatus = stock >= 10;
    else if (statusFilter === 'low_stock') matchesStatus = stock > 0 && stock < 10;
    else if (statusFilter === 'out_of_stock') matchesStatus = stock === 0;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── STOCK HEALTH METRICS ──────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-gold">
            <Boxes size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Catalog Items</span>
            <span className="stat-value">{totalProducts}</span>
            <span className="stat-subtext">Registered SKUs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Healthy Stock (10+)</span>
            <span className="stat-value">{inStock.length}</span>
            <span className="stat-subtext">Adequate inventory</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Low Stock (1-9)</span>
            <span className="stat-value">{lowStock.length}</span>
            <span className="stat-subtext">Re-order recommended</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-danger" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }}>
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Out of Stock (0)</span>
            <span className="stat-value">{outOfStock.length}</span>
            <span className="stat-subtext">Unavailable in storefront</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search inventory by product name or slug..."
        />

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Stock Health</option>
            <option value="in_stock">Healthy (10+)</option>
            <option value="low_stock">Low Stock (1-9)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* ── INVENTORY TABLE ────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Boxes size={18} color="var(--gold)" />
            <span>Inventory Health & Adjustments</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {filteredProducts.length} Items Listed
          </span>
        </div>

        {loading ? (
          <LoadingState message="Loading inventory data..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInventory} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No inventory records found"
            description="Try changing your search query or status filter."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Available Stock</th>
                  <th>Stock Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = parseInt(product.stock) || 0;
                  const stockStatus =
                    stock >= 10 ? 'in_stock' : stock > 0 ? 'low_stock' : 'out_of_stock';

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="table-product-cell">
                          <img
                            src={
                              product.image_url ||
                              'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={product.name}
                            className="table-product-img"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <div className="table-product-title">{product.name}</div>
                            <div className="table-product-subtitle">
                              ID: {product.id.slice(0, 8)} · /{product.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {product.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{parseFloat(product.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>
                            {stock} units
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={stockStatus} type="stock" />
                      </td>
                      <td>
                        <button
                          onClick={() => openAdjustModal(product)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '4px' }}
                        >
                          <Edit2 size={13} color="var(--gold)" />
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── STOCK ADJUSTMENT MODAL ─────────────────────────── */}
      <Modal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title="Adjust Inventory Stock"
        maxWidth="440px"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setAdjustProduct(null)}
              disabled={updatingStock}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleStockSubmit}
              disabled={updatingStock}
            >
              {updatingStock ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Updating...</span>
                </>
              ) : (
                'Save Stock Count'
              )}
            </button>
          </>
        }
      >
        {adjustProduct && (
          <form onSubmit={handleStockSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{adjustProduct.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Current stock: {adjustProduct.stock} units
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                New Inventory Quantity (units) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                className="form-input"
                value={newStockVal}
                onChange={(e) => setNewStockVal(e.target.value)}
                autoFocus
              />
            </div>

            {stockError && (
              <div style={{ color: 'var(--status-danger-text)', fontSize: '12px', marginTop: '8px' }}>
                {stockError}
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};
