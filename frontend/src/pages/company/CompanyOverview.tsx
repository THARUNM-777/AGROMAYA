import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { analyticsApi, fieldsApi } from '../../services/api';
import { MapFeature } from '../../types';
import {
  Users,
  Wheat,
  Clock,
  Truck,
  Coins,
  Building2,
  MapPin,
  Flame,
  ArrowRight,
  TrendingUp,
  Radar,
  Leaf,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const CompanyOverview: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [harvestReadyFields, setHarvestReadyFields] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, mapRes] = await Promise.all([
          analyticsApi.getCompanyAnalytics(),
          fieldsApi.getMapFeatures(),
        ]);
        if (analyticsRes.success) {
          setKpis(analyticsRes.kpis);
          setCharts(analyticsRes.charts);
        }
        if (mapRes.success) {
          setHarvestReadyFields(mapRes.features.filter((f) => f.status === 'HARVEST_READY').slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#16A765', '#EAB308', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#123D2B] via-[#0D2C1F] to-[#101C18] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-lime-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            Active Satellite Monitoring Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Biochar Industrial Procurement Command Center
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real-time multi-spectral Sentinel-2 crop senescence tracking, dual-mode feedstock collection, and automated farmer reward issuance across Karnataka.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5">
          <Link
            to="/company/live-map"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Radar className="w-4 h-4" />
            Open Satellite Map
          </Link>
          <Link
            to="/company/verification"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Verify Deliveries
          </Link>
        </div>
      </div>

      {/* 8 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Registered Farmers"
          value={kpis?.totalFarmers || 30}
          subtitle="Across Davangere Cluster"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Agricultural Fields"
          value={kpis?.totalFields || 40}
          subtitle="Monitored by Radar"
          icon={Wheat}
          color="slate"
        />
        <StatCard
          title="Harvest-Ready Fields"
          value={kpis?.harvestReadyFields || 15}
          subtitle="Immediate Biomass Potential"
          icon={Clock}
          color="amber"
          trend={{ value: '15 parcels', isPositive: true, label: 'ready' }}
        />
        <StatCard
          title="Feedstock Collected"
          value={`${kpis?.totalFeedstockCollectedTonnes || 32.8} T`}
          subtitle="Residue Diverted from Burning"
          icon={Truck}
          color="emerald"
        />
        <StatCard
          title="Pending Requests"
          value={kpis?.pendingRequests || 2}
          subtitle="Awaiting Farmer / GP Action"
          icon={Send}
          color="blue"
        />
        <StatCard
          title="Total Credits Issued"
          value={`${(kpis?.totalCreditsIssued || 12850).toLocaleString()}`}
          subtitle="In Farmer Wallets"
          icon={Coins}
          color="purple"
        />
        <StatCard
          title="Direct Cash Paid"
          value={`₹${(kpis?.totalCashPaid || 8400).toLocaleString()}`}
          subtitle="Direct Bank Transfers"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Connected Panchayats"
          value={kpis?.totalPanchayats || 3}
          subtitle="Harihara, Honnali, Malebennur"
          icon={Building2}
          color="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Previous Year vs Current Year Collection */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Monthly Feedstock Collection (Tonnes)
              </h3>
              <p className="text-xs text-slate-500">
                Comparison: Previous Season vs Current AgroMaya Season
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-slate-300" /> 2025
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <span className="w-3 h-3 rounded-sm bg-emerald-600" /> 2026 (AgroMaya)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="lastYear" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Last Year (Tonnes)" />
                <Bar dataKey="currentYear" fill="#16A765" radius={[4, 4, 0, 0]} name="Current Year (Tonnes)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Crop-wise Residue Availability */}
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Crop-Wise Biomass Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">Available residue in harvest-ready fields</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.cropWiseResidue || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="tonnes"
                  nameKey="crop"
                >
                  {(charts?.cropWiseResidue || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {(charts?.cropWiseResidue || []).slice(0, 4).map((c: any, i: number) => (
              <div key={c.crop} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 font-medium truncate">{c.crop}: <b>{c.tonnes}T</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Harvest-Ready Field Alerts (Immediate Actions) */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Live Harvest-Ready Fields Detected by Satellite Radar
            </h3>
            <p className="text-xs text-slate-500">
              Sentinel-2 NDVI index indicates over 85% maturity. Immediate feedstock collection prevents stubble burning.
            </p>
          </div>

          <Link
            to="/company/live-map"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            View All On Map
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {harvestReadyFields.map((field) => (
            <div
              key={field.id}
              className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 hover:border-amber-400 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{field.fieldCode}</h4>
                  <span className="text-xs text-slate-600 font-medium">
                    {field.village} • {field.panchayat}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  {field.harvestReadinessPct}% Ready
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer:</span>
                  <span className="font-semibold">{field.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop:</span>
                  <span className="font-semibold">{field.cropType} ({field.areaAcres} Acres)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. Biomass:</span>
                  <span className="font-bold text-emerald-700">{field.estimatedResidueTonnes} Tonnes</span>
                </div>
              </div>

              <Link
                to={`/company/live-map?fieldId=${field.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Collection Request
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
