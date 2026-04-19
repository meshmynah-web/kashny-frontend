import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import AdminSales from './pages/AdminSales';
import AdminDeliveries from './pages/AdminDeliveries';
import AdminCustomers from './pages/AdminCustomers';
import AdminPayments from './pages/AdminPayments';
import AdminShifts from './pages/AdminShifts';
import AdminReports from './pages/AdminReports';
import AdminLogs from './pages/AdminLogs';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import FinancialOverview from './pages/FinancialOverview';
import CashierLayout from './components/CashierLayout';
import Shift from './pages/Shift';
import POS from './pages/POS';
import Receipts from './pages/Receipts';
import Customers from './pages/Customers';

const Placeholder = ({ title }) => <div className="glass-panel" style={{ padding: '2rem' }}><h2>{title} Management</h2><p className="text-muted">Module in development...</p></div>;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes wrapped in AdminLayout */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<AdminSales />} />
        <Route path="deliveries" element={<AdminDeliveries />} />
        <Route path="users" element={<Users />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="finance/overview" element={<FinancialOverview />} />
        <Route path="finance/expenses" element={<Expenses />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="shifts" element={<AdminShifts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Cashier Routes */}
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
          <CashierLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/pos/sales" replace />} />
        <Route path="sales" element={<POS />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="customers" element={<Customers />} />
        <Route path="shift" element={<Shift />} />
      </Route>
    </Routes>
  );
}

export default App;
