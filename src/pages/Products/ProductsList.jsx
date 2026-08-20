import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Package, Plus, Edit, Trash2, Filter } from 'lucide-react';

export const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (categoryFilter) params.category = categoryFilter;

      const [prodRes, catRes] = await Promise.all([
        api.products.getAll(params),
        api.categories.getAll(),
      ]);

      if (prodRes.error) {
        setError(prodRes.error);
      } else {
        setProducts(prodRes.data?.products || []);
        setTotal(prodRes.data?.total || 0);
      }

      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error: delErr } = await api.products.delete(productToDelete.id);
      if (delErr) {
        setDeleteError(delErr);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setTotal((prev) => Math.max(0, prev - 1));
        setProductToDelete(null);
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter products on client for search and stock
  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (product.name || '').toLowerCase().includes(q) ||
      (product.slug || '').toLowerCase().includes(q);

    let matchesStock = true;
    const stock = parseInt(product.stock) || 0;
    if (stockFilter === 'in_stock') matchesStock = stock >= 10;
    else if (stockFilter === 'low_stock') matchesStock = stock > 0 && stock < 10;
    else if (stockFilter === 'out_of_stock') matchesStock = stock === 0;

    return matchesSearch && matchesStock;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products by title, SKU, or keyword..."
        />

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setCategoryFilter(e.target.value);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug || cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (10+)</option>
            <option value="low_stock">Low Stock (1-9)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <Link to="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── PRODUCT TABLE CARD ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Package size={18} color="var(--gold)" />
            <span>Handicraft Catalog</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {total} Products Registered
          </span>
        </div>

        {loading ? (
          <LoadingState message="Loading catalog items..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your search query or category filters."
            action={
              <Link to="/admin/products/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> Add Product
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Inventory Status</th>
                    <th>Created</th>
                    <th>Actions</th>
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
                                Slug: /{product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'var(--bg-app)',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {product.category || 'General'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{parseFloat(product.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {stock} units
                        </td>
                        <td>
                          <StatusBadge status={stockStatus} type="stock" />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {product.created_at
                            ? new Date(product.created_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Edit product"
                            >
                              <Edit size={14} />
                            </Link>
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px', color: 'var(--status-danger-text)' }}
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────── */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Handicraft Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action will permanently remove it from the catalog.`}
        confirmText="Delete Product"
        danger={true}
        loading={deleting}
      />
    </div>
  );
};
