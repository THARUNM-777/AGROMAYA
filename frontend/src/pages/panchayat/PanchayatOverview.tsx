import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { panchayatsApi, requestsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Wheat,
  Clock,
  Truck,
  Send,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PanchayatOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanchayatData = async () => {
      try {
        const panchayatsRes = await panchayatsApi.getPanchayats();
        if (panchayatsRes.success && panchayatsRes.panchayats.length > 0) {
          const p = panchayatsRes.panchayats[0];
          const statsRes = await panchayatsApi.getPanchayatStats(p.id);
          if (statsRes.success) setStats(statsRes.stats);
        }

        const reqRes = await requestsApi.getRequests({ status: 'PENDING' });
        if (reqRes.success) setIncomingRequests(reqRes.requests.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPanchayatData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Harihara Rural Gram Panchayat • Davangere
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gram Panchayat Crop Waste Management Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Coordinate agricultural stubble diversion with local farmers, match landowners from satellite discovery clusters, and manage transport pickups.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/panchayat/scheduling"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Calendar className="w-4 h-4" />
            Schedule Pickups
          </Link>
          <Link
            to="/panchayat/farmers"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all"
          >
            <Users className="w-4 h-4" />
            Farmer Registry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Registered Farmers"
          value={stats?.totalFarmers || 18}
          subtitle="Enrolled in Jurisdiction"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Agricultural Fields"
          value={stats?.totalFields || 22}
          subtitle="Revenue Survey Records"
          icon={Wheat}
          color="slate"
        />
        <StatCard
          title="Harvest-Ready Fields"
          value={stats?.harvestReadyFields || 9}
          subtitle={`${stats?.totalResidueAvailable || 64.2} T Est. Waste`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Incoming Requests"
          value={incomingRequests.length}
          subtitle="From Biochar Companies"
          icon={Send}
          color="purple"
        />
      </div>

      {/* Incoming Requests Action Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Incoming Biochar Company Collection Requests
            </h3>
            <p className="text-xs text-slate-500">
              Review procurement requests, confirm farmer availability, and assign transport vehicles.
            </p>
          </div>
          <Link
            to="/panchayat/requests"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            View All Requests
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{req.requestNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.requestMethod === 'BULK_DISCOVERY'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {req.requestMethod === 'BULK_DISCOVERY' ? 'Bulk Discovery Request' : 'Direct Farmer'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{req.notes}</p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Crop & Volume</span>
                    <span className="font-bold text-slate-900">
                      {req.requestedTonnes} Tonnes {req.cropType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Offered Rate</span>
                    <span className="font-bold text-emerald-700">₹{req.offeredRewardPerKg}/kg</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/panchayat/scheduling?requestId=${req.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Transport & Center
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
