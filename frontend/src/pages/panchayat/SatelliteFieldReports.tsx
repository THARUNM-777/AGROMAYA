import React, { useState, useEffect } from 'react';
import { fieldsApi } from '../../services/api';
import { AgriculturalField } from '../../types';
import { Radar, Search, Filter, Wheat, MapPin, CheckCircle2, User, RefreshCw } from 'lucide-react';

export const SatelliteFieldReports: React.FC = () => {
  const [fields, setFields] = useState<AgriculturalField[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getFields();
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
    fetchReports();
  }, []);

  const filtered = fields.filter((f) => {
    const matchesSearch =
      f.fieldCode.toLowerCase().includes(search.toLowerCase()) ||
      f.surveyNumber.includes(search) ||
      f.farmer?.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesVillage = villageFilter === '' || f.village.name === villageFilter;
    return matchesSearch && matchesVillage;
  });

  const villages = Array.from(new Set(fields.map((f) => f.village.name)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
            <Radar className="w-4 h-4" />
            Panchayat Field Monitoring
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Satellite Agricultural Land Records & Harvest Status
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multispectral satellite observation records matched with village revenue land survey numbers.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Satellite Data
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search field ID, survey number, landowner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Villages in GP</option>
            {villages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Field ID & Survey No</th>
                <th className="py-3.5 px-4 font-bold">Village</th>
                <th className="py-3.5 px-4 font-bold">Registered Landowner</th>
                <th className="py-3.5 px-4 font-bold">Crop & Area</th>
                <th className="py-3.5 px-4 font-bold">Harvest Readiness</th>
                <th className="py-3.5 px-4 font-bold">Est. Residue</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{field.fieldCode}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Survey No: {field.surveyNumber}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{field.village.name}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{field.farmer?.fullName || 'Unregistered Landowner'}</span>
                    <span className="text-[10px] text-slate-400">{field.farmer?.phone || 'Contact Required'}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{field.cropType}</span>
                    <span className="text-[10px] text-slate-500">{field.areaAcres} Acres</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            field.harvestReadinessPct >= 85 ? 'bg-amber-500' : 'bg-orange-400'
                          }`}
                          style={{ width: `${field.harvestReadinessPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{field.harvestReadinessPct}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-800">{field.estimatedResidueTonnes} Tonnes</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        field.status === 'HARVEST_READY'
                          ? 'bg-amber-100 text-amber-800'
                          : field.status === 'HARVEST_APPROACHING'
                          ? 'bg-orange-100 text-orange-800'
                          : field.status === 'COLLECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {field.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
