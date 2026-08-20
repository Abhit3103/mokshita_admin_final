import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Eye,
  Send,
  Sparkles,
  Filter,
} from 'lucide-react';

export const QueriesList = () => {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Query View Modal state
  const [activeQuery, setActiveQuery] = useState(null);

  const fetchQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.leads.getAll({
        page: currentPage,
        limit: pageSize,
      });

      if (apiErr) {
        setError(apiErr);
      } else {
        setLeads(data?.leads || []);
        setTotal(data?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [currentPage]);

  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (lead.name || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.phone || '').includes(q) ||
      (lead.message || '').toLowerCase().includes(q);

    const matchesInterest =
      !interestFilter ||
      (lead.interest || '').toLowerCase() === interestFilter.toLowerCase();

    return matchesSearch && matchesInterest;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '22px' }}>Customer Queries & Inquiries</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Direct inquiries and contact form submissions from the live Mokshita Handicrafts website
        </p>
      </div>

      {/* ── TOOLBAR ────────────────────────────────────────── */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name, email, phone, or inquiry message..."
        />

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
          >
            <option value="">All Categories / Interests</option>
            <option value="handicrafts">Handicrafts</option>
            <option value="travel">Travel Packages</option>
            <option value="custom">Custom Artisan Order</option>
            <option value="wholesale">Wholesale Inquiry</option>
          </select>
        </div>
      </div>

      {/* ── QUERIES TABLE ─────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MessageSquare size={18} color="var(--gold)" />
            <span>Customer Inquiries</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {total} Total Inquiries Received
          </span>
        </div>

        {loading ? (
          <LoadingState message="Fetching inquiries from website..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchQueries} />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            title="No inquiries found"
            description="There are currently no customer inquiries matching your filter criteria."
            icon={MessageSquare}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Interest / Subject</th>
                    <th>Message Excerpt</th>
                    <th>Date Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {lead.name}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{lead.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{lead.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            background: 'var(--bg-app)',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '12px',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {lead.interest || lead.item || 'General Inquiry'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                          }}
                          title={lead.message}
                        >
                          {lead.message}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => setActiveQuery(lead)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', gap: '4px' }}
                        >
                          <Eye size={13} />
                          Read
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* ── QUERY MESSAGE MODAL ────────────────────────────── */}
      <Modal
        isOpen={!!activeQuery}
        onClose={() => setActiveQuery(null)}
        title="Customer Inquiry Details"
        maxWidth="560px"
        footer={
          activeQuery && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {activeQuery.phone && (
                <a
                  href={`tel:${activeQuery.phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Phone size={14} /> Call Customer
                </a>
              )}
              <a
                href={`mailto:${activeQuery.email}?subject=Response regarding your Mokshita Handicrafts inquiry`}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <Send size={14} /> Reply via Email
              </a>
            </div>
          )
        }
      >
        {activeQuery && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{activeQuery.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inquiry Category</div>
                <div style={{ fontWeight: 600, marginTop: '2px', textTransform: 'capitalize' }}>
                  {activeQuery.interest || activeQuery.item || 'General'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
                <div style={{ marginTop: '2px' }}>{activeQuery.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
                <div style={{ marginTop: '2px' }}>{activeQuery.phone || 'Not provided'}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Message Content:
              </div>
              <div
                style={{
                  padding: '16px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activeQuery.message}
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Received on {new Date(activeQuery.created_at).toLocaleString('en-IN')} via Website Contact Form
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
