import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination-wrapper">
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startItem}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalItems}</span> records
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span style={{ fontSize: '12px', padding: '0 8px' }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
