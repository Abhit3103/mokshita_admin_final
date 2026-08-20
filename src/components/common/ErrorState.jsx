import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the backend.',
  onRetry,
}) => {
  return (
    <div className="state-container">
      <div className="state-icon state-icon-danger">
        <AlertTriangle size={26} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
          <RefreshCw size={14} />
          Retry Request
        </button>
      )}
    </div>
  );
};
