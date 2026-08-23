import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { smartUploadImage } from '../../utils/imageUploader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Database,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  Package,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowUpRight,
  Download,
  Eye,
  Plus,
} from 'lucide-react';

export const MediaDatabase = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProductId = searchParams.get('product') || searchParams.get('productId') || '';

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected product state
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [productSearch, setProductSearch] = useState('');
  const [onlyMissingImages, setOnlyMissingImages] = useState(false);

  // Upload states
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', text: '' }
  const [autoAssignPrimary, setAutoAssignPrimary] = useState(true);
  const fileInputRef = useRef(null);

  // Local media library cache / history
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all' | 'assigned' | 'custom'

  // Modal / Lightbox states
  const [lightboxImage, setLightboxImage] = useState(null);
  const [reassignModalImage, setReassignModalImage] = useState(null);
  const [targetProductForReassign, setTargetProductForReassign] = useState('');
  const [savingReassign, setSavingReassign] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.products.getAll({ limit: 100 }),
        api.categories.getAll(),
      ]);

      if (prodRes.error) {
        setError(prodRes.error);
      } else {
        const prodList = prodRes.data?.products || [];
        setProducts(prodList);

        // Populate media library from existing catalog images + local storage history
        const catalogImages = prodList
          .filter((p) => p.image_url)
          .map((p) => ({
            id: `prod-img-${p.id}`,
            url: p.image_url,
            productId: p.id,
            productName: p.name,
            productSlug: p.slug,
            source: 'catalog',
            timestamp: p.created_at || new Date().toISOString(),
          }));

        let savedCustom = [];
        try {
          const raw = localStorage.getItem('mokshita_custom_media');
          if (raw) savedCustom = JSON.parse(raw);
        } catch (e) {
          console.error(e);
        }

        // Deduplicate by URL
        const seenUrls = new Set();
        const merged = [];
        [...savedCustom, ...catalogImages].forEach((item) => {
          if (item.url && !seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            merged.push(item);
          }
        });

        setMediaLibrary(merged);

        // Auto select first product if not specified
        if (!selectedProductId && prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      }

      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load media database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected product if URL query changes
  useEffect(() => {
    const pId = searchParams.get('product') || searchParams.get('productId');
    if (pId && pId !== selectedProductId) {
      setSelectedProductId(pId);
    }
  }, [searchParams]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Filter products for left sidebar selector
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q);

    const matchesMissing = onlyMissingImages ? !p.image_url : true;
    return matchesSearch && matchesMissing;
  });

  // Filter media library
  const filteredMedia = mediaLibrary.filter((item) => {
    const q = mediaSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.url?.toLowerCase().includes(q) ||
      item.productName?.toLowerCase().includes(q);

    if (mediaFilter === 'assigned') return matchesSearch && !!item.productId;
    if (mediaFilter === 'unassigned') return matchesSearch && !item.productId;
    return matchesSearch;
  });

  // Handle single / batch file upload
  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    let successCount = 0;
    let lastUploadedUrl = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const uploadResult = await smartUploadImage(file);
        const fullUrl = uploadResult?.url;

        if (fullUrl) {
          lastUploadedUrl = fullUrl;
          successCount++;

          const newMediaItem = {
            id: `upload-${Date.now()}-${i}`,
            url: fullUrl,
            productId: autoAssignPrimary && selectedProduct ? selectedProduct.id : null,
            productName: autoAssignPrimary && selectedProduct ? selectedProduct.name : null,
            productSlug: autoAssignPrimary && selectedProduct ? selectedProduct.slug : null,
            source: uploadResult.isFallback ? 'optimized_local' : 'upload',
            timestamp: new Date().toISOString(),
          };

          // Save to state and localStorage
          setMediaLibrary((prev) => [newMediaItem, ...prev.filter((m) => m.url !== fullUrl)]);
          try {
            const raw = localStorage.getItem('mokshita_custom_media');
            const arr = raw ? JSON.parse(raw) : [];
            localStorage.setItem(
              'mokshita_custom_media',
              JSON.stringify([newMediaItem, ...arr.filter((m) => m.url !== fullUrl)].slice(0, 100))
            );
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        setUploadStatus({
          type: 'error',
          text: `Failed to process ${file.name}: ${err.message}`,
        });
        setUploading(false);
        return;
      }
    }

    // If auto-assign is checked and we have a selected product, update product in DB
    if (autoAssignPrimary && selectedProduct && lastUploadedUrl) {
      try {
        const { error: prodErr } = await api.products.update(selectedProduct.id, {
          image_url: lastUploadedUrl,
        });

        if (prodErr) {
          setUploadStatus({
            type: 'error',
            text: `Image uploaded, but failed to sync to product: ${prodErr}`,
          });
        } else {
          // Update product locally in state
          setProducts((prev) =>
            prev.map((p) =>
              p.id === selectedProduct.id ? { ...p, image_url: lastUploadedUrl } : p
            )
          );
          setUploadStatus({
            type: 'success',
            text: `Successfully uploaded ${successCount} image(s) and set as primary image for "${selectedProduct.name}"!`,
          });
        }
      } catch (err) {
        setUploadStatus({
          type: 'error',
          text: `Product update error: ${err.message}`,
        });
      }
    } else {
      setUploadStatus({
        type: 'success',
        text: `Successfully uploaded ${successCount} image(s) to Media Database!`,
      });
    }

    setUploading(false);
  };

  // Handle URL import
  const handleUrlImport = async (e) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setUploadStatus({
        type: 'error',
        text: 'Please enter a valid URL starting with https:// or http://',
      });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const newMediaItem = {
        id: `url-${Date.now()}`,
        url: cleanUrl,
        productId: autoAssignPrimary && selectedProduct ? selectedProduct.id : null,
        productName: autoAssignPrimary && selectedProduct ? selectedProduct.name : null,
        productSlug: autoAssignPrimary && selectedProduct ? selectedProduct.slug : null,
        source: 'url_import',
        timestamp: new Date().toISOString(),
      };

      setMediaLibrary((prev) => [newMediaItem, ...prev.filter((m) => m.url !== cleanUrl)]);
      try {
        const raw = localStorage.getItem('mokshita_custom_media');
        const arr = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          'mokshita_custom_media',
          JSON.stringify([newMediaItem, ...arr.filter((m) => m.url !== cleanUrl)].slice(0, 100))
        );
      } catch (e) {
        console.error(e);
      }

      if (autoAssignPrimary && selectedProduct) {
        const { error: updateErr } = await api.products.update(selectedProduct.id, {
          image_url: cleanUrl,
        });

        if (updateErr) {
          setUploadStatus({
            type: 'error',
            text: `Imported URL, but failed to sync to product: ${updateErr}`,
          });
        } else {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === selectedProduct.id ? { ...p, image_url: cleanUrl } : p
            )
          );
          setUploadStatus({
            type: 'success',
            text: `URL imported and linked to "${selectedProduct.name}"!`,
          });
          setUrlInput('');
        }
      } else {
        setUploadStatus({
          type: 'success',
          text: 'URL imported into Media Database successfully!',
        });
        setUrlInput('');
      }
    } catch (err) {
      setUploadStatus({
        type: 'error',
        text: `Failed to import image URL: ${err.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  // Direct Assign any media asset to currently selected product
  const handleAssignToSelectedProduct = async (imageUrl) => {
    if (!selectedProduct) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      const { error: updateErr } = await api.products.update(selectedProduct.id, {
        image_url: imageUrl,
      });

      if (updateErr) {
        setUploadStatus({ type: 'error', text: updateErr });
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id ? { ...p, image_url: imageUrl } : p
          )
        );

        setMediaLibrary((prev) =>
          prev.map((m) =>
            m.url === imageUrl
              ? {
                  ...m,
                  productId: selectedProduct.id,
                  productName: selectedProduct.name,
                  productSlug: selectedProduct.slug,
                }
              : m
          )
        );

        setUploadStatus({
          type: 'success',
          text: `Assigned image to "${selectedProduct.name}" in database!`,
        });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Re-assign modal handler
  const handleExecuteReassign = async () => {
    if (!reassignModalImage || !targetProductForReassign) return;
    setSavingReassign(true);
    const targetProd = products.find((p) => p.id === targetProductForReassign);

    try {
      const { error: updateErr } = await api.products.update(targetProductForReassign, {
        image_url: reassignModalImage.url,
      });

      if (updateErr) {
        alert(`Failed to reassign image: ${updateErr}`);
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === targetProductForReassign
              ? { ...p, image_url: reassignModalImage.url }
              : p
          )
        );

        setMediaLibrary((prev) =>
          prev.map((m) =>
            m.url === reassignModalImage.url
              ? {
                  ...m,
                  productId: targetProd?.id,
                  productName: targetProd?.name,
                  productSlug: targetProd?.slug,
                }
              : m
          )
        );

        setReassignModalImage(null);
        setTargetProductForReassign('');
      }
    } catch (err) {
      alert(`Error reassigning image: ${err.message}`);
    } finally {
      setSavingReassign(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Media Database & Product Catalog..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const missingImageCount = products.filter((p) => !p.image_url).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-hover) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-gold)',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Media & Product Images Database
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Upload, import, and sync high-resolution product photos directly into the catalog database
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            title="Refresh database"
          >
            <RefreshCw size={14} />
            <span>Refresh Catalog</span>
          </button>
          <Link to="/admin/products" className="btn btn-secondary btn-sm">
            <Package size={14} />
            <span>View All Products</span>
          </Link>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gold-pale)',
              color: 'var(--gold)',
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {products.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Products</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-success-bg)',
              color: 'var(--status-success-text)',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {products.length - missingImageCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Products with Photos</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderColor: missingImageCount > 0 ? 'var(--status-warning-bd)' : 'var(--border-color)',
            background: missingImageCount > 0 ? '#FFFDF8' : 'var(--bg-card)',
          }}
        >
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: missingImageCount > 0 ? 'var(--status-warning-bg)' : 'var(--bg-app)',
              color: missingImageCount > 0 ? 'var(--status-warning-text)' : 'var(--text-muted)',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: missingImageCount > 0 ? 'var(--status-warning-text)' : 'var(--text-primary)',
              }}
            >
              {missingImageCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Missing Images</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gold-pale)',
              color: 'var(--gold-hover)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {mediaLibrary.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Media Assets in Vault</div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ─────────────────────────────────── */}
      <div className="media-db-layout">
        {/* ── LEFT COLUMN: PRODUCT SELECTOR ───────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header" style={{ padding: '14px 16px' }}>
              <div className="card-title" style={{ fontSize: '14px' }}>
                <Package size={16} color="var(--gold)" />
                <span>Select Target Product</span>
              </div>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Product search */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '12.5px', height: '36px' }}
                  placeholder="Search product..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {/* Missing image filter toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: onlyMissingImages ? 'var(--gold-hover)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: onlyMissingImages ? 600 : 400,
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyMissingImages}
                  onChange={(e) => setOnlyMissingImages(e.target.checked)}
                />
                <span>Show only products needing images ({missingImageCount})</span>
              </label>

              {/* Product List selection */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '8px',
                }}
              >
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    No matching products found.
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = p.id === selectedProductId;
                    const hasImage = Boolean(p.image_url);

                    return (
                      <div
                        key={p.id}
                        className={`product-select-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSearchParams({ product: p.id });
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-subtle)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          {hasImage ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon size={16} color="var(--text-muted)" />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? 'var(--gold-hover)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>₹{parseFloat(p.price || 0).toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span style={{ color: hasImage ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                              {hasImage ? 'Has Image' : 'No Image'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE SELECTED PRODUCT CARD */}
          {selectedProduct && (
            <div className="card" style={{ borderColor: 'var(--gold)' }}>
              <div className="card-header" style={{ background: 'var(--gold-pale)', padding: '12px 16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold-hover)' }}>
                  Active Target Product
                </span>
                <Link
                  to={`/admin/products/${selectedProduct.id}`}
                  style={{ fontSize: '11.5px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  Edit details <ArrowUpRight size={12} />
                </Link>
              </div>

              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedProduct.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Slug: <code style={{ color: 'var(--gold-hover)' }}>/{selectedProduct.slug}</code>
                </div>

                <div style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#2A2019', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#B5AB9F', fontSize: '12px' }}>
                      <ImageIcon size={28} style={{ margin: '0 auto 6px', color: 'var(--gold)' }} />
                      <div>No image assigned yet</div>
                    </div>
                  )}
                </div>

                {selectedProduct.image_url && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '11.5px' }}
                      onClick={() => setLightboxImage(selectedProduct.image_url)}
                    >
                      <Eye size={13} /> View Full
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '11.5px' }}
                      onClick={() => copyToClipboard(selectedProduct.image_url)}
                    >
                      {copiedUrl === selectedProduct.image_url ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedUrl === selectedProduct.image_url ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: UPLOAD STUDIO & ASSET VAULT ────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* UPLOADER CARD */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Upload size={18} color="var(--gold)" />
                <span>Upload & Sync Product Image</span>
              </div>

              {/* Upload Mode Selector */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: uploadMode === 'file' ? 'var(--bg-card)' : 'transparent',
                    color: uploadMode === 'file' ? 'var(--gold-hover)' : 'var(--text-muted)',
                    boxShadow: uploadMode === 'file' ? 'var(--shadow-xs)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Local File / Drag-and-Drop
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: uploadMode === 'url' ? 'var(--bg-card)' : 'transparent',
                    color: uploadMode === 'url' ? 'var(--gold-hover)' : 'var(--text-muted)',
                    boxShadow: uploadMode === 'url' ? 'var(--shadow-xs)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Direct Web URL Importer
                </button>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Feedback messages */}
              {uploadStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12.5px',
                    backgroundColor:
                      uploadStatus.type === 'success'
                        ? 'var(--status-success-bg)'
                        : 'var(--status-danger-bg)',
                    color:
                      uploadStatus.type === 'success'
                        ? 'var(--status-success-text)'
                        : 'var(--status-danger-text)',
                    border: `1px solid ${
                      uploadStatus.type === 'success'
                        ? 'var(--status-success-bd)'
                        : 'var(--status-danger-bd)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {uploadStatus.type === 'success' ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span>{uploadStatus.text}</span>
                  </div>
                  <button
                    onClick={() => setUploadStatus(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Mode 1: File Dropzone */}
              {uploadMode === 'file' ? (
                <div
                  className={`media-dropzone ${isDragActive ? 'drag-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFilesUpload(e.target.files)}
                  />

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--gold-pale)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Upload size={24} />
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {uploading ? 'Uploading image(s) to server...' : 'Drag & drop product images here'}
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: '400px' }}>
                    Upload single or multiple JPG, PNG, WEBP, or SVG files.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={uploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={14} />
                    <span>Browse Files from Device</span>
                  </button>
                </div>
              ) : (
                /* Mode 2: URL Importer */
                <form onSubmit={handleUrlImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Paste External Image URL (CDN / S3 / Unsplash / Cloudinary)
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <LinkIcon
                          size={15}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                          }}
                        />
                        <input
                          type="url"
                          className="form-input"
                          style={{ paddingLeft: '36px' }}
                          placeholder="https://images.unsplash.com/..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !urlInput.trim()}
                      >
                        <Sparkles size={15} />
                        <span>{uploading ? 'Importing...' : 'Import & Attach'}</span>
                      </button>
                    </div>
                  </div>

                  {urlInput.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#2A2019', flexShrink: 0 }}>
                        <img
                          src={urlInput.trim()}
                          alt="Live Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          Live Preview Validation
                        </div>
                        If the image loads correctly above, click <strong>Import & Attach</strong> to assign it.
                      </div>
                    </div>
                  )}
                </form>
              )}

              {/* Automatic Database Sync Option */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoAssignPrimary}
                    onChange={(e) => setAutoAssignPrimary(e.target.checked)}
                  />
                  <span>
                    Automatically set as Primary Image for{' '}
                    <strong>{selectedProduct ? selectedProduct.name : 'Selected Product'}</strong> in database
                  </span>
                </label>
                <span className="media-pill-tag">Auto-Sync Enabled</span>
              </div>

              {/* Image Specifications & Size Guidelines */}
              <div
                style={{
                  padding: '12px 14px',
                  background: '#FCFAF7',
                  border: '1px solid rgba(176, 141, 87, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--gold-hover)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  <span>Recommended Image Upload Specifications</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Optimal Dimensions:</strong>
                    <div>800 × 800 px to 1200 × 1200 px (Square 1:1)</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Max File Size:</strong>
                    <div>Up to 5 MB per image</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Allowed Formats:</strong>
                    <div>JPG, PNG, WEBP, AVIF, SVG</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MEDIA ASSET VAULT (GRID) ───────────────────── */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div className="card-title">
                <ImageIcon size={18} color="var(--gold)" />
                <span>Media Database Asset Vault</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({filteredMedia.length} assets)
                </span>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '12px', height: '32px' }}
                    placeholder="Search media..."
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  style={{ height: '32px', fontSize: '12px' }}
                  value={mediaFilter}
                  onChange={(e) => setMediaFilter(e.target.value)}
                >
                  <option value="all">All Media Assets</option>
                  <option value="assigned">Assigned to Products</option>
                  <option value="unassigned">Unassigned / Custom</option>
                </select>
              </div>
            </div>

            <div className="card-body">
              {filteredMedia.length === 0 ? (
                <EmptyState
                  title="No media assets found"
                  description="Upload your first product photo above to start building the media vault."
                />
              ) : (
                <div className="media-grid">
                  {filteredMedia.map((item) => {
                    const isAttachedToCurrent =
                      selectedProduct && item.productId === selectedProduct.id;

                    return (
                      <div key={item.id || item.url} className="media-card">
                        <div className="media-card-thumb">
                          <img
                            src={item.url}
                            alt={item.productName || 'Media asset'}
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80';
                            }}
                          />

                          {/* Hover Overlay */}
                          <div className="media-card-overlay">
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', background: '#fff', color: '#1F1813' }}
                              onClick={() => setLightboxImage(item.url)}
                              title="Full view"
                            >
                              <Maximize2 size={13} />
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', background: '#fff', color: '#1F1813' }}
                              onClick={() => copyToClipboard(item.url)}
                              title="Copy URL"
                            >
                              {copiedUrl === item.url ? <Check size={13} /> : <Copy size={13} />}
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleAssignToSelectedProduct(item.url)}
                              title="Assign to active product"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="media-card-info">
                          <div className="media-card-title">
                            {item.productName || 'Uploaded Media Asset'}
                          </div>

                          <div className="media-card-sub">
                            {item.productId ? (
                              <span className="media-pill-tag">
                                <Package size={10} />
                                <span>{item.productName || 'Assigned'}</span>
                              </span>
                            ) : (
                              <span className="media-pill-tag unassigned">Unassigned</span>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: 'auto',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                            }}
                          >
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{
                                flex: 1,
                                fontSize: '11px',
                                padding: '4px 6px',
                                borderColor: isAttachedToCurrent ? 'var(--gold)' : undefined,
                                background: isAttachedToCurrent ? 'var(--gold-pale)' : undefined,
                              }}
                              onClick={() => handleAssignToSelectedProduct(item.url)}
                            >
                              {isAttachedToCurrent ? 'Current Active' : 'Set as Primary'}
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 6px' }}
                              onClick={() => {
                                setReassignModalImage(item);
                                setTargetProductForReassign(item.productId || '');
                              }}
                              title="Assign to another product"
                            >
                              Reassign
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX MODAL ─────────────────────────────────── */}
      {lightboxImage && (
        <div className="media-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                High-Resolution Asset Preview
              </div>
              <button
                className="btn-icon-only"
                onClick={() => setLightboxImage(null)}
                style={{ border: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="media-lightbox-img-wrap">
              <img src={lightboxImage} alt="Fullscreen Preview" />
            </div>

            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-app)',
                gap: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '450px',
                }}
              >
                {lightboxImage}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(lightboxImage)}
                >
                  {copiedUrl === lightboxImage ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedUrl === lightboxImage ? 'Copied' : 'Copy Link'}</span>
                </button>
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink size={14} />
                  <span>Open Full Size</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REASSIGN MODAL ─────────────────────────────────── */}
      {reassignModalImage && (
        <div className="media-lightbox-overlay" onClick={() => setReassignModalImage(null)}>
          <div
            className="media-lightbox-content"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Assign Image to Product</div>
              <button
                className="btn-icon-only"
                onClick={() => setReassignModalImage(null)}
                style={{ border: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: '#2A2019',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={reassignModalImage.url}
                    alt="Asset"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Select any product from the catalog below to set this image as its primary image.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Product</label>
                <select
                  className="form-select"
                  value={targetProductForReassign}
                  onChange={(e) => setTargetProductForReassign(e.target.value)}
                >
                  <option value="">Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReassignModalImage(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!targetProductForReassign || savingReassign}
                  onClick={handleExecuteReassign}
                >
                  {savingReassign ? 'Assigning...' : 'Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
