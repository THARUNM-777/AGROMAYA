import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestsApi } from '../../services/api';
import { FeedstockRequest } from '../../types';
import {
  Send,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  User,
  Wheat,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';

export const FeedstockRequests: React.FC = () => {
  const [requests, setRequests] = useState<FeedstockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECT_FARMER' | 'BULK_DISCOVERY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestsApi.getRequests();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesTab = activeTab === 'ALL' || r.requestMethod === activeTab;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesTab && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Feedstock Procurement & Request Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage individual registered farmer collection offers and large-scale bulk discovery requests.
          </p>
        </div>

        <Link
          to="/company/live-map"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Request via Radar
        </Link>
      </div>

      {/* Tabs & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('DIRECT_FARMER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DIRECT_FARMER'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Method 1: Direct Farmer ({requests.filter((r) => r.requestMethod === 'DIRECT_FARMER').length})
          </button>
          <button
            onClick={() => setActiveTab('BULK_DISCOVERY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BULK_DISCOVERY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Method 2: Bulk Discovery ({requests.filter((r) => r.requestMethod === 'BULK_DISCOVERY').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Request Number</th>
                <th className="py-3.5 px-4 font-bold">Method</th>
                <th className="py-3.5 px-4 font-bold">Target Stakeholder</th>
                <th className="py-3.5 px-4 font-bold">Crop & Volume</th>
                <th className="py-3.5 px-4 font-bold">Offered Reward</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Logistics Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading request records...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {req.requestNumber}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.requestMethod === 'DIRECT_FARMER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {req.requestMethod === 'DIRECT_FARMER' ? 'Direct Farmer' : 'Bulk Discovery'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {req.farmer ? (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-emerald-600" />
                            {req.farmer.fullName}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {req.farmer.village?.name} • {req.panchayat?.name}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            {req.panchayat?.name}
                          </div>
                          <span className="text-[10px] text-amber-600 font-medium">
                            Panchayat Landowner Matching
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {req.requestedTonnes} Tonnes
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {req.cropType} Straw
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-800">
                        ₹{req.offeredRewardPerKg}/kg
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Est: ₹{(req.requestedTonnes * 1000 * req.offeredRewardPerKg).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'SCHEDULED'
                            ? 'bg-purple-100 text-purple-800'
                            : req.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'SCHEDULED' && <Truck className="w-3 h-3" />}
                        {req.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {req.schedule ? (
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-800 block">
                            {new Date(req.schedule.collectionDate).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[160px] block">
                            {req.schedule.collectionCenter}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Awaiting Panchayat scheduling
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
