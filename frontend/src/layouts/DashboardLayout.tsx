import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { DemoBar } from '../components/common/DemoBar';

interface DashboardLayoutProps {
  allowedRoles?: string[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F7F9F5]">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading AgroMaya Workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce role-based access if specified
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'BIOCHAR_COMPANY') return <Navigate to="/company/overview" replace />;
    if (role === 'GRAM_PANCHAYAT') return <Navigate to="/panchayat/overview" replace />;
    if (role === 'FARMER') return <Navigate to="/farmer/home" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F5] text-slate-800">
      {/* 1-Click Hackathon Role Switcher Bar */}
      <DemoBar />

      {/* Main Top Navigation */}
      <Navbar onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        {/* Mobile Slide-out Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 w-64 h-full bg-[#101C18] flex flex-col">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
