import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fieldsApi, requestsApi } from '../../services/api';
import { AgriculturalField } from '../../types';
import {
  Radar,
  Wheat,
  Search,
  Filter,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const HarvestDetection: React.FC = () => {
  const [fields, setFields] = useState<AgriculturalField[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchHarvestFields = async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getFields({ minReadiness: 65, cropType: cropFilter, search });
      if (data.success) {
        setFields(data.fields);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvestFields();
  }, [cropFilter, search]);

  const handleQuickRequest = async (fieldId: string, farmerName: string) => {
    try {
      await requestsApi.createDirectRequest({ fieldId, offeredRewardPerKg: 2.0 });
      setActionSuccess(`Feedstock collection request dispatched to ${farmerName}!`);
      setTimeout(() => setActionSuccess(null), 3500);
      fetchHarvestFields();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Radar className="w-4 h-4" />
            Sentinel-2 Remote Sensing Feed
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Real-Time Harvest Readiness Detection
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Continuous multispectral NDVI analysis identifies fields approaching senescence to prevent stubble burning.
          </p>
        </div>

        <button
          onClick={fetchHarvestFields}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Run Satellite Sync
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search field code, farmer, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none font-medium"
          >
            <option value="">All Detected Crops</option>
            <option value="Paddy">Paddy</option>
            <option value="Maize">Maize</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Field ID & Crop</th>
                <th className="py-3.5 px-4 font-bold">Landowner / Farmer</th>
                <th className="py-3.5 px-4 font-bold">Village & Panchayat</th>
                <th className="py-3.5 px-4 font-bold">Harvest Readiness</th>
                <th className="py-3.5 px-4 font-bold">Estimated Biomass</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Analyzing multispectral satellite observations...
                  </td>
                </tr>
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No harvest-ready fields matching current criteria.
                  </td>
                </tr>
              ) : (
                fields.map((field) => (
                  <tr key={field.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{field.fieldCode}</div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {field.cropType} • {field.areaAcres} Acres
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {field.farmer?.fullName || 'Unregistered Landowner'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {field.farmer?.phone || 'Panchayat Contact Pending'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{field.village.name}</div>
                      <span className="text-[10px] text-slate-500">{field.panchayat.name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              field.harvestReadinessPct >= 85
                                ? 'bg-amber-500'
                                : 'bg-orange-400'
                            }`}
                            style={{ width: `${field.harvestReadinessPct}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-[11px]">
                          {field.harvestReadinessPct}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {field.harvestWindow || 'Approaching'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-800">
                        {field.estimatedResidueTonnes} Tonnes
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{(field.estimatedResidueTonnes * 2000).toLocaleString()} Reward Value
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          field.status === 'HARVEST_READY'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : field.status === 'HARVEST_APPROACHING'
                            ? 'bg-orange-100 text-orange-800'
                            : field.status === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {field.status === 'HARVEST_READY' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                        {field.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Link
                        to={`/company/live-map?fieldId=${field.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Radar
                      </Link>

                      {field.status === 'HARVEST_READY' && (
                        <button
                          onClick={() => handleQuickRequest(field.id, field.farmer?.fullName || 'Farmer')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Offer
                        </button>
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
