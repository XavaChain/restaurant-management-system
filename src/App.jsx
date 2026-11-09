import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ChefDashboard from './pages/ChefDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StockManagement from './pages/StockManagement';
import OwnerDashboard from './pages/OwnerDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-slate-400">Loading system context...</div>;
  if (!user || !profile) return <Navigate to="/login" replace />;
  if (profile.account_status !== 'active') return <div className="p-8 text-center text-red-400">Account Suspended. Contact Owner.</div>;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DefaultRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading user profile...</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case 'owner':
      return <Navigate to="/owner" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'chef':
      return <Navigate to="/chef" replace />;
    case 'waiter':
      return <Navigate to="/waiter" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DefaultRedirect />} />
        
        <Route path="/chef" element={
          <ProtectedRoute allowedRoles={['chef', 'admin', 'owner']}>
            <ChefDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/waiter" element={
          <ProtectedRoute allowedRoles={['waiter', 'admin', 'owner']}>
            <WaiterDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/stock" element={
          <ProtectedRoute allowedRoles={['chef', 'admin', 'owner']}>
            <StockManagement />
          </ProtectedRoute>
        } />

        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
