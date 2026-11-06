import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Landmark, User, Package, ChevronUp, ChevronDown, ShieldCheck, X } from 'lucide-react';

export const DemoBar: React.FC = () => {
  const { demoLogin, role, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSwitch = async (targetRole: 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER' | 'SUPPLIER') => {
    await demoLogin(targetRole);
    if (targetRole === 'BIOCHAR_COMPANY') navigate('/company/overview');
    else if (targetRole === 'GRAM_PANCHAYAT') navigate('/panchayat/overview');
    else if (targetRole === 'FARMER') navigate('/farmer/home');
    else if (targetRole === 'SUPPLIER') navigate('/supplier/orders');
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        title="Open Stakeholder Switcher"
        className="fixed bottom-4 right-4 z-50 bg-[#101C18] text-emerald-300 border border-emerald-700/60 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl flex items-center gap-1.5 hover:bg-emerald-950 transition-all opacity-80 hover:opacity-100"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Switch View</span>
        <ChevronUp className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="bg-[#0c1613] text-white text-xs px-4 py-1.5 border-b border-emerald-900/60 shadow-sm flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Stakeholder Session:</span>
          <strong className="text-emerald-300">{user?.name || user?.email || role}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleSwitch('BIOCHAR_COMPANY')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'BIOCHAR_COMPANY'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          Company
        </button>

        <button
          onClick={() => handleSwitch('GRAM_PANCHAYAT')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'GRAM_PANCHAYAT'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-blue-400" />
          Panchayat
        </button>

        <button
          onClick={() => handleSwitch('FARMER')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'FARMER'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <User className="w-3.5 h-3.5 text-amber-400" />
          Farmer
        </button>

        <button
          onClick={() => handleSwitch('SUPPLIER')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'SUPPLIER'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-purple-400" />
          Supplier
        </button>

        <button
          onClick={() => setCollapsed(true)}
          title="Dismiss top switcher bar"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
