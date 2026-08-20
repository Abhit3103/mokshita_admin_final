import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { OrdersList } from './pages/Orders/OrdersList';
import { OrderDetail } from './pages/Orders/OrderDetail';
import { ProductsList } from './pages/Products/ProductsList';
import { ProductForm } from './pages/Products/ProductForm';
import { CustomersList } from './pages/Customers/CustomersList';
import { CustomerDetail } from './pages/Customers/CustomerDetail';
import { QueriesList } from './pages/Queries/QueriesList';
import { PaymentsList } from './pages/Payments/PaymentsList';
import { InventoryList } from './pages/Inventory/InventoryList';
import { AnalyticsView } from './pages/Analytics/AnalyticsView';
import { SettingsView } from './pages/Settings/SettingsView';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route (Strictly for Administrators) */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="queries" element={<QueriesList />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          {/* Root redirect to /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
