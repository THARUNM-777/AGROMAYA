import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number | string;
    isPositive: boolean;
    label: string;
  };
  color?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700',
      border: 'hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-700',
      border: 'hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700',
      border: 'hover:border-purple-300',
      iconBg: 'bg-purple-100 text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
    },
    slate: {
      bg: 'bg-slate-50 text-slate-700',
      border: 'hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      badge: 'bg-slate-100 text-slate-800',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 transition-all duration-200 ${scheme.border} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};
