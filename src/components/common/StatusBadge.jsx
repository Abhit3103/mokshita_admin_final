import React from 'react';

/**
 * StatusBadge Component
 * Context-aware badge for Order, Payment, and Stock statuses
 */
export const StatusBadge = ({ status, type = 'order' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  let variant = 'neutral';
  let label = status;

  if (type === 'order') {
    switch (normalized) {
      case 'received':
        variant = 'warning';
        label = 'Received (New)';
        break;
      case 'shipped':
        variant = 'info';
        label = 'Shipped';
        break;
      case 'delivered':
        variant = 'success';
        label = 'Delivered';
        break;
      case 'cancelled':
        variant = 'danger';
        label = 'Cancelled';
        break;
      case 'pending_payment':
        variant = 'warning';
        label = 'Pending Payment';
        break;
      default:
        variant = 'neutral';
        label = status;
    }
  } else if (type === 'payment') {
    switch (normalized) {
      case 'paid':
      case 'captured':
      case 'success':
        variant = 'success';
        label = 'Paid';
        break;
      case 'pending':
      case 'pending_payment':
        variant = 'warning';
        label = 'Pending';
        break;
      case 'failed':
      case 'payment_failed':
        variant = 'danger';
        label = 'Failed';
        break;
      case 'cod':
        variant = 'info';
        label = 'Cash on Delivery';
        break;
      case 'razorpay':
        variant = 'info';
        label = 'Razorpay (Online)';
        break;
      default:
        variant = 'neutral';
        label = status;
    }
  } else if (type === 'stock') {
    switch (normalized) {
      case 'in_stock':
      case 'healthy':
        variant = 'success';
        label = 'In Stock';
        break;
      case 'low_stock':
        variant = 'warning';
        label = 'Low Stock';
        break;
      case 'out_of_stock':
        variant = 'danger';
        label = 'Out of Stock';
        break;
      default:
        variant = 'neutral';
        label = status;
    }
  }

  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};
