import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading live data from server...' }) => {
  return (
    <div className="state-container">
      <div className="state-icon state-icon-gold">
        <Loader2 className="animate-spin" size={26} />
      </div>
      <h3 className="state-title">Loading</h3>
      <p className="state-description">{message}</p>
    </div>
  );
};
