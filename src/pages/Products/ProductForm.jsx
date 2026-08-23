import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { smartUploadImage } from '../../utils/imageUploader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ArrowLeft,
  Package,
  Upload,
  Image as ImageIcon,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    image_url: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const initForm = async () => {
      try {
        const catRes = await api.categories.getAll();
        if (catRes.data?.data) {
          setCategories(catRes.data.data);
        }

        if (isEdit) {
          // Fetch product list to find current product
          const prodRes = await api.products.getAll({ limit: 100 });
          const found = (prodRes.data?.products || []).find((p) => p.id === id);

          if (found) {
            setForm({
              name: found.name || '',
              slug: found.slug || '',
              price: found.price || '',
              stock: found.stock ?? '',
              category_id: found.category_id || '',
              description: found.description || '',
              image_url: found.image_url || '',
            });
          } else {
            setServerError(`Product ID ${id} was not found.`);
          }
        }
      } catch (err) {
        setServerError(err.message || 'Failed to initialize form');
      } finally {
        setLoading(false);
      }
    };

    initForm();
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setServerError(null);

    try {
      const uploadResult = await smartUploadImage(file);
      if (uploadResult?.url) {
        handleChange('image_url', uploadResult.url);
      }
    } catch (err) {
      setServerError(err.message || 'Image processing failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      errors.price = 'Valid price is required';
    }
    if (form.stock === '' || isNaN(parseInt(form.stock)) || parseInt(form.stock) < 0) {
      errors.stock = 'Valid non-negative stock number is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      category_id: form.category_id || undefined,
      description: form.description.trim() || undefined,
      image_url: form.image_url.trim() || undefined,
    };

    try {
      let res;
      if (isEdit) {
        res = await api.products.update(id, payload);
      } else {
        res = await api.products.create(payload);
      }

      if (res.error) {
        setServerError(res.error);
      } else {
        setSuccessMessage(
          isEdit ? 'Product updated successfully!' : 'New product created successfully!'
        );
        setTimeout(() => {
          navigate('/admin/products');
        }, 1200);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading product details..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/admin/products" className="btn-icon-only" title="Back to products">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ fontSize: '22px' }}>
              {isEdit ? 'Edit Handicraft Product' : 'Add New Handicraft Product'}
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {isEdit ? `Modifying ID: ${id}` : 'Create a new product in the store catalog'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {serverError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--status-danger-bd)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--status-success-bd)',
            fontSize: '13px',
          }}
        >
          <CheckCircle size={18} />
          <span>{successMessage} Redirecting to catalog...</span>
        </div>
      )}

      {/* ── FORM LAYOUT ───────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="product-form-layout">
        {/* LEFT COLUMN: CORE FIELDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Package size={18} color="var(--gold)" />
                <span>General Information</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  Product Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Handcrafted Marble Elephant Statue"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. marble-elephant-statue"
                    value={form.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                  />
                  <span className="form-helper">Leave empty to auto-generate from title</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category_id}
                    onChange={(e) => handleChange('category_id', e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Detailed description highlighting the artisan craft, materials, dimensions, and origin..."
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>Pricing & Inventory</span>
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Regular Price (₹) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="999.00"
                    value={form.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                  />
                  {formErrors.price && <span className="form-error">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Available Stock Quantity <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    placeholder="25"
                    value={form.stock}
                    onChange={(e) => handleChange('stock', e.target.value)}
                  />
                  {formErrors.stock && <span className="form-error">{formErrors.stock}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCT MEDIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ImageIcon size={18} color="var(--gold)" />
                <span>Product Image</span>
              </div>
              {isEdit && (
                <Link
                  to={`/admin/media?product=${id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                  title="Open Media Database Studio"
                >
                  <Database size={12} color="var(--gold)" />
                  <span>Media Studio</span>
                  <ExternalLink size={10} />
                </Link>
              )}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="image-preview-box">
                {form.image_url ? (
                  <>
                    <img
                      src={form.image_url}
                      alt="Product Preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('image_url', '')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        backdropFilter: 'blur(4px)',
                      }}
                      title="Clear image"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    <ImageIcon size={36} style={{ margin: '0 auto 8px', color: 'var(--gold)' }} />
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No image provided</div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px' }}>Enter an image URL or upload below</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  Or Upload Image File
                </label>
                <label
                  className="btn btn-secondary"
                  style={{ width: '100%', cursor: 'pointer', gap: '8px' }}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Uploading to Server...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Choose Local Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Recommended Specs Hint */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Recommended Image Specs:
                </div>
                <div>• <strong>Dimensions:</strong> 800 × 800 px to 1200 × 1200 px (Square 1:1)</div>
                <div>• <strong>Max Size:</strong> Under 5 MB (Auto-optimized to WebP)</div>
                <div>• <strong>Formats:</strong> JPG, PNG, WEBP, AVIF, SVG</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link
                  to="/admin/media"
                  style={{
                    fontSize: '12px',
                    color: 'var(--gold-hover)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <Database size={13} />
                  <span>Browse Media & Images Database</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
