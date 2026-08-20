import React from 'react';

export const StatCard = ({ label, value, subtext, icon: Icon, color = 'gold' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper stat-icon-${color}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
};
