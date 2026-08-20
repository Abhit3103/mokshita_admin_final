import React from 'react';
import { Menu, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { STOREFRONT_URL } from '../../config';

export const Topbar = ({ onToggleSidebar }) => {
  const location = useLocation();

  const getPageDetails = (pathname) => {
    if (pathname === '/admin' || pathname === '/admin/') {
      return { title: 'Dashboard', section: 'Overview' };
    }
    if (pathname.startsWith('/admin/orders')) {
      if (pathname.includes('/admin/orders/')) return { title: 'Order Details', section: 'Orders' };
      return { title: 'Order Management', section: 'Sales' };
    }
    if (pathname.startsWith('/admin/products')) {
      if (pathname.includes('/admin/products/new')) return { title: 'New Product', section: 'Products' };
      if (pathname.includes('/admin/products/')) return { title: 'Edit Product', section: 'Products' };
      return { title: 'Product Catalog', section: 'Inventory' };
    }
    if (pathname.startsWith('/admin/customers')) {
      if (pathname.includes('/admin/customers/')) return { title: 'Customer Profile', section: 'Customers' };
      return { title: 'Customer Management', section: 'Audience' };
    }
    if (pathname.startsWith('/admin/queries')) {
      return { title: 'Customer Queries & Leads', section: 'Support' };
    }
    if (pathname.startsWith('/admin/payments')) {
      return { title: 'Payments & Transactions', section: 'Finance' };
    }
    if (pathname.startsWith('/admin/inventory')) {
      return { title: 'Stock & Inventory', section: 'Catalog' };
    }
    if (pathname.startsWith('/admin/analytics')) {
      return { title: 'Performance Analytics', section: 'Insights' };
    }
    if (pathname.startsWith('/admin/settings')) {
      return { title: 'System Settings', section: 'Configuration' };
    }
    return { title: 'Administration', section: 'Portal' };
  };

  const details = getPageDetails(location.pathname);

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button
          className="btn-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Open Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-title-group">
          <div className="topbar-breadcrumbs">
            <span>Mokshita</span>
            <span>/</span>
            <span>{details.section}</span>
            <span>/</span>
            <span className="current">{details.title}</span>
          </div>
          <h1>{details.title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <a
          href={STOREFRONT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="store-quick-link"
          title="Open live Mokshita store in a new tab"
        >
          <span>Live Store</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </header>
  );
};
