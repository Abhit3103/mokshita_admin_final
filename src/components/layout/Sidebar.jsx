import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Boxes,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/queries', label: 'Customer Queries', icon: MessageSquare },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-emblem">
            <Sparkles size={20} />
          </div>
          <div className="brand-info">
            <span className="brand-title">MOKSHITA</span>
            <span className="brand-subtitle">Executive Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Administration</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.full_name || user?.email || 'Mokshita Admin'}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
