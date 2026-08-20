import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, placeholder = 'Search by name, ID, or keyword...' }) => {
  return (
    <div className="search-input-wrapper">
      <Search className="search-icon" size={16} />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
