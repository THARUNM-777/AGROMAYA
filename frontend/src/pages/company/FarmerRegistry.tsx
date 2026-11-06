import React, { useState, useEffect } from 'react';
import { farmersApi } from '../../services/api';
import { Farmer } from '../../types';
import { Users, Search, Phone, MapPin, Wheat, CheckCircle2, RefreshCw } from 'lucide-react';

export const FarmerRegistry: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const data = await farmersApi.getFarmers();
      if (data.success) setFarmers(data.farmers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filtered = farmers.filter(
    (f) =>
      f.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search) ||
      f.surveyNumber.includes(search) ||
      f.village?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Registered Farmer Directory & Land Parcels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified agricultural producers linked with Gram Panchayat revenue land survey numbers.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmer name, phone, survey no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {farmers.length} Farmers Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Farmer Name</th>
                <th className="py-3.5 px-4 font-bold">Phone Number</th>
                <th className="py-3.5 px-4 font-bold">Village & Panchayat</th>
                <th className="py-3.5 px-4 font-bold">Survey Number</th>
                <th className="py-3.5 px-4 font-bold">Total Land</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Credit Wallet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading farmer records...
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{f.fullName}</span>
                      <span className="text-[10px] text-slate-400">ID: {f.id.slice(0, 8)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-800">{f.phone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">{f.village?.name}</span>
                      <span className="text-[10px] text-slate-400">{f.panchayat?.name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-slate-800">
                        {f.surveyNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{f.totalLandAcres} Acres</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {f.registrationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-700">
                        {f.wallet?.availableCredits.toLocaleString() || 0} Credits
                      </span>
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
