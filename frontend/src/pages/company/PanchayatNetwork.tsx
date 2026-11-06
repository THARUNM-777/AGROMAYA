import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { panchayatsApi } from '../../services/api';
import { Panchayat } from '../../types';
import { Building2, Phone, MapPin, Users, Wheat, Send, ArrowRight } from 'lucide-react';

export const PanchayatNetwork: React.FC = () => {
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panchayatsApi
      .getPanchayats()
      .then((res) => {
        if (res.success) setPanchayats(res.panchayats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Connected Gram Panchayat Administrative Network
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Local village governing bodies coordinating crop residue intake, farmer identification, and transport logistics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panchayats.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Verified GP
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.taluk} Taluk, {p.district} District</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Officer: <b>{p.contactOfficer}</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{p.officeAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Villages</span>
                  <span className="font-extrabold text-slate-900">{p.villages?.length || 3}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Registered Farmers</span>
                  <span className="font-extrabold text-emerald-700">{p._count?.farmers || 10}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <Link
                to={`/company/live-map`}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <span>View Jurisdiction Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
