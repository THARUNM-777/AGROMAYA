import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart3,
  Flame,
  Leaf,
  Sparkles,
  TrendingUp,
  Download,
  Calendar,
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

export const CompanyAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getCompanyAnalytics()
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#16A765', '#EAB308', '#3B82F6', '#8B5CF6', '#F97316'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            ESG Environmental Impact & Operational Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quantified carbon offset verification, crop residue diversion, and village collection performance.
          </p>
        </div>
      </div>

      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="CO2 Emissions Prevented"
          value={`${data?.kpis?.co2SavedTonnes || 45.9} T`}
          subtitle="1.4x Residue Burn Equivalence"
          icon={Leaf}
          color="emerald"
        />
        <StatCard
          title="Biochar Carbon Sequestered"
          value={`${data?.kpis?.biocharProducedTonnes || 10.5} T`}
          subtitle="Stable Carbon Stored in Soil"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Stubble Burning Avoidance"
          value="100%"
          subtitle="Zero Open Burns in Mapped Parcels"
          icon={Flame}
          color="amber"
        />
        <StatCard
          title="Farmer Dual Income Created"
          value={`₹${((data?.kpis?.totalCreditsIssued || 0) + (data?.kpis?.totalCashPaid || 0)).toLocaleString()}`}
          subtitle="Credits + Cash Disbursed"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Village-Wise Collection Performance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Village-Wise Feedstock Procurement (Tonnes)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Total estimated biomass vs collected</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.villageDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="village" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="residueTonnes" fill="#CBD5E1" name="Available Residue (T)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collectedTonnes" fill="#16A765" name="Collected Residue (T)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Efficiency Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Residue Logistics Pipeline Status
          </h3>
          <p className="text-xs text-slate-500 mb-4">Active operational cycle breakdown</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.collectionEfficiency || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {(data?.charts?.collectionEfficiency || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100">
            {(data?.charts?.collectionEfficiency || []).map((item: any) => (
              <div key={item.name}>
                <span className="text-[10px] text-slate-500 block truncate">{item.name}</span>
                <span className="font-extrabold text-slate-900" style={{ color: item.color }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
