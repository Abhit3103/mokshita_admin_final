import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  action,
  icon: Icon = PackageOpen,
}) => {
  return (
    <div className="state-container">
      <div className="state-icon state-icon-gold">
        <Icon size={26} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{description}</p>
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
};
