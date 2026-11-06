import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationsApi } from '../../services/api';
import { Notification } from '../../types';
import {
  Bell,
  Globe,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wheat,
  Info,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (_e) {
      // Ignored during unauthenticated public landing
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = () => {
    if (role === 'BIOCHAR_COMPANY') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Biochar Enterprise
        </span>
      );
    }
    if (role === 'GRAM_PANCHAYAT') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Gram Panchayat Officer
        </span>
      );
    }
    if (role === 'FARMER') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
          Verified Farmer
        </span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#123D2B] via-[#16A765] to-[#B5E853] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Wheat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#123D2B] flex items-center gap-1">
                AGROMAYA
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A765]" />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block -mt-1">
                Waste-To-Biochar
              </span>
            </div>
          </Link>

          {user && getRoleBadge()}
        </div>

        {/* Center: Top Navigation Menu Bar (Never blank) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 px-2 py-1 rounded-2xl border border-slate-200/80 shadow-2xs">
            {((role || user.role || 'FARMER').toUpperCase() === 'FARMER') && (
              <>
                <NavLink
                  to="/farmer/home"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/farmer/my-farm"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  My Farm & Radar
                </NavLink>
                <NavLink
                  to="/farmer/requests"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Requests
                </NavLink>
                <NavLink
                  to="/farmer/wallet"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  My Credits
                </NavLink>
                <NavLink
                  to="/farmer/marketplace"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Marketplace
                </NavLink>
              </>
            )}

            {((role || user.role) === 'BIOCHAR_COMPANY') && (
              <>
                <NavLink
                  to="/company/overview"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/company/live-map"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Live Radar
                </NavLink>
                <NavLink
                  to="/company/harvest-detection"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Detection
                </NavLink>
                <NavLink
                  to="/company/panchayats"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Panchayats
                </NavLink>
                <NavLink
                  to="/company/analytics"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Analytics
                </NavLink>
              </>
            )}

            {((role || user.role) === 'GRAM_PANCHAYAT') && (
              <>
                <NavLink
                  to="/panchayat/overview"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/panchayat/map"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Land Map
                </NavLink>
                <NavLink
                  to="/panchayat/farmers"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Farmers
                </NavLink>
                <NavLink
                  to="/panchayat/intake"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Weighbridge
                </NavLink>
              </>
            )}
          </nav>
        )}

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>
          </div>

          {/* Notifications Bell Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popup */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs transition-colors hover:bg-slate-50 ${
                            !n.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5">
                              {n.type === 'HARVEST' ? (
                                <Wheat className="w-4 h-4 text-amber-500" />
                              ) : n.type === 'REWARD' ? (
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                              ) : n.type === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-500" />
                              )}
                            </span>
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 mb-0.5">{n.title}</h5>
                              <p className="text-slate-600 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown or Public Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-lime-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[130px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block -mt-0.5">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#123D2B] bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-colors"
              >
                Launch Demo
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
