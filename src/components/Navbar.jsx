import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck, Utensils, Receipt, Package, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <nav className="bg-emerald-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg md:text-xl tracking-wide">সপ্ন Fast Food & ক্যাফে</span>
          <span className="text-xs uppercase bg-emerald-950 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-700">
            {profile.role}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-4 text-sm font-medium">
            {['owner', 'admin'].includes(profile.role) && (
              <Link to="/admin" className="hover:text-emerald-200 flex items-center space-x-1">
                <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
              </Link>
            )}
            {['chef', 'owner', 'admin'].includes(profile.role) && (
              <Link to="/chef" className="hover:text-emerald-200 flex items-center space-x-1">
                <Utensils className="w-4 h-4" /> <span>Chef</span>
              </Link>
            )}
            {['waiter', 'owner', 'admin'].includes(profile.role) && (
              <Link to="/waiter" className="hover:text-emerald-200 flex items-center space-x-1">
                <Receipt className="w-4 h-4" /> <span>Waiter</span>
              </Link>
            )}
            {['chef', 'owner', 'admin'].includes(profile.role) && (
              <Link to="/stock" className="hover:text-emerald-200 flex items-center space-x-1">
                <Package className="w-4 h-4" /> <span>Stock</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs md:text-sm font-medium text-emerald-100 hidden sm:inline">
              {profile.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-emerald-200 hover:text-white bg-emerald-900 rounded-lg hover:bg-emerald-700 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
