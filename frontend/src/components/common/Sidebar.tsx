import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Map,
  Radar,
  Send,
  Building2,
  Users,
  Truck,
  CheckCircle,
  Coins,
  Store,
  Package,
  BarChart3,
  Calendar,
  Warehouse,
  Home,
  Wallet,
  FileCheck,
  Wheat,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Leaf,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // Navigation configurations based on stakeholder role
  const getNavItems = () => {
    if (role === 'BIOCHAR_COMPANY') {
      return [
        { label: 'Overview', to: '/company/overview', icon: LayoutDashboard },
        { label: 'Live Field Map', to: '/company/live-map', icon: Map, badge: 'Live' },
        { label: 'Harvest Detection', to: '/company/harvest-detection', icon: Radar },
        { label: 'Feedstock Requests', to: '/company/requests', icon: Send },
        { label: 'Panchayat Network', to: '/company/panchayats', icon: Building2 },
        { label: 'Farmer Registry', to: '/company/farmers', icon: Users },
        { label: 'Collection Management', to: '/company/collections', icon: Truck },
        { label: 'Feedstock Verification', to: '/company/verification', icon: CheckCircle, highlight: true },
        { label: 'Credits & Rewards', to: '/company/rewards', icon: Coins },
        { label: 'Marketplace Inventory', to: '/company/marketplace', icon: Store },
        { label: 'Farmer Orders', to: '/company/orders', icon: Package },
        { label: 'Analytics & Reports', to: '/company/analytics', icon: BarChart3 },
      ];
    }

    if (role === 'GRAM_PANCHAYAT') {
      return [
        { label: 'Overview', to: '/panchayat/overview', icon: LayoutDashboard },
        { label: 'Satellite Field Reports', to: '/panchayat/field-reports', icon: Radar },
        { label: 'Agricultural Land Map', to: '/panchayat/map', icon: Map },
        { label: 'Farmer Registry', to: '/panchayat/farmers', icon: Users },
        { label: 'Collection Requests', to: '/panchayat/requests', icon: Send, badge: 'New' },
        { label: 'Farmer Identification', to: '/panchayat/farmer-id', icon: ShieldCheck },
        { label: 'Collection Scheduling', to: '/panchayat/scheduling', icon: Calendar },
        { label: 'Weighbridge & Face Intake', to: '/panchayat/intake', icon: ShieldCheck, highlight: true },
        { label: 'Verification Status', to: '/panchayat/verification', icon: FileCheck },
        { label: 'Collection Centres', to: '/panchayat/centers', icon: Warehouse },
      ];
    }

    if (role === 'FARMER') {
      return [
        { label: t('home'), to: '/farmer/home', icon: Home },
        { label: t('myFarm'), to: '/farmer/my-farm', icon: Wheat },
        { label: t('myRequests'), to: '/farmer/requests', icon: Send, badge: 'Action' },
        { label: t('feedstockCollection'), to: '/farmer/collections', icon: Truck },
        { label: t('myCredits'), to: '/farmer/wallet', icon: Wallet, highlight: true },
        { label: t('marketplace'), to: '/farmer/marketplace', icon: Store },
        { label: t('myOrders'), to: '/farmer/orders', icon: Package },
        { label: t('cashback'), to: '/farmer/cashback', icon: Coins },
      ];
    }

    if (role === 'SUPPLIER') {
      return [
        { label: 'Purchase Orders', to: '/supplier/orders', icon: Package, highlight: true },
        { label: 'Catalog & Inventory', to: '/supplier/inventory', icon: Store },
        { label: 'Payables & Settlements', to: '/supplier/payables', icon: Coins },
        { label: 'Shipment Dispatches', to: '/supplier/shipments', icon: Truck },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`relative hidden lg:flex flex-col bg-[#101C18] text-slate-300 border-r border-emerald-950/60 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar header / Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-900/40">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-900/60 text-emerald-400">
              <Leaf className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {role === 'BIOCHAR_COMPANY'
                ? 'Biochar Console'
                : role === 'GRAM_PANCHAYAT'
                ? 'Panchayat Portal'
                : 'Farmer Portal'}
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-md shadow-emerald-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
              } ${item.highlight && !isActive ? 'border border-amber-500/30 text-amber-200' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-lime-300' : item.highlight ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 tracking-wide">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-lime-400 text-emerald-950 shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status Box */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-lime-400 font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            Satellite Live Feeds
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Copernicus Sentinel-2 • Lat 14.48° N / Long 75.83° E (Davangere Cluster)
          </p>
        </div>
      )}
    </aside>
  );
};
