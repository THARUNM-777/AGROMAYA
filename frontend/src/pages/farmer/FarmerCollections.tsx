import React, { useState, useEffect } from 'react';
import { collectionsApi } from '../../services/api';
import { FeedstockCollection } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Truck, Scale, CheckCircle2, Clock, MapPin, RefreshCw, FileText } from 'lucide-react';

export const FarmerCollections: React.FC = () => {
  const { t } = useLanguage();
  const [collections, setCollections] = useState<FeedstockCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await collectionsApi.getCollections();
      if (data.success) setCollections(data.collections);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('feedstockCollection')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track scheduled tractor pickups, collection center weighbridge intake, and quality inspection slips.
          </p>
        </div>

        <button
          onClick={fetchCollections}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collections.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{c.collectionNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {c.status === 'VERIFIED' ? 'Verified & Paid' : 'Pending Verification'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900">{c.residueCategory}</h4>
                <p className="text-xs text-slate-500">Delivered to {c.collectionLocation}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Weight</span>
                  <span className="font-bold text-slate-900">{c.actualWeightKg.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Quality Grade</span>
                  <span className="font-bold text-emerald-800">Grade {c.qualityGrade}</span>
                </div>
              </div>

              {c.verification && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Rewards Awarded:</span>
                    <span>+{c.verification.rewardCreditsAwarded.toLocaleString()} Credits</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Direct Bank Cash:</span>
                    <span className="font-bold text-amber-700">₹{c.verification.cashbackAwarded.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Collection Date: {new Date(c.collectionDate).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Certified Manifest
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
