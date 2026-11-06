import React, { useState, useEffect } from 'react';
import { requestsApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { FeedstockRequest } from '../../types';
import confetti from 'canvas-confetti';
import {
  Send,
  CheckCircle2,
  XCircle,
  Building2,
  Wheat,
  Clock,
  Sparkles,
  Coins,
  RefreshCw,
} from 'lucide-react';

export const FarmerRequests: React.FC = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<FeedstockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchFarmerRequests = async () => {
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
    fetchFarmerRequests();
  }, []);

  const handleFarmerResponse = async (id: string, action: 'ACCEPT' | 'REJECT', companyName: string) => {
    try {
      await requestsApi.respondAsFarmer(id, action);
      if (action === 'ACCEPT') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        setActionSuccess(`Offer from ${companyName} accepted! Gram Panchayat has been notified to schedule pickup.`);
      } else {
        setActionSuccess(`Offer from ${companyName} declined.`);
      }
      setTimeout(() => setActionSuccess(null), 4000);
      fetchFarmerRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit response');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {t('myRequests')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review commercial purchase offers from biochar companies for your crop stubble and agricultural waste.
          </p>
        </div>

        <button
          onClick={fetchFarmerRequests}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{req.requestNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    req.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : req.status === 'ACCEPTED'
                      ? 'bg-blue-100 text-blue-800'
                      : req.status === 'SCHEDULED'
                      ? 'bg-purple-100 text-purple-800'
                      : req.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Buyer Biochar Company</span>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  {req.company?.companyName}
                </h3>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs text-slate-700 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Residue Required:</span>
                  <span className="font-bold text-slate-900">
                    {req.requestedTonnes} Tonnes ({req.cropType} Straw)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Offered Reward Rate:</span>
                  <span className="font-bold text-emerald-800">₹{req.offeredRewardPerKg}/kg</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <span className="text-slate-700">Total Est. Payout:</span>
                  <span className="text-emerald-800 text-sm">
                    ₹{(req.requestedTonnes * 1000 * req.offeredRewardPerKg).toLocaleString()}
                  </span>
                </div>
              </div>

              {req.notes && (
                <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  "{req.notes}"
                </p>
              )}
            </div>

            {/* Response Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              {req.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFarmerResponse(req.id, 'REJECT', req.company?.companyName || 'Company')}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    {t('reject')}
                  </button>
                  <button
                    onClick={() => handleFarmerResponse(req.id, 'ACCEPT', req.company?.companyName || 'Company')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('accept')}
                  </button>
                </div>
              ) : req.status === 'ACCEPTED' ? (
                <div className="text-center py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl">
                  ✓ Offer Accepted. Panchayat is scheduling pickup transport.
                </div>
              ) : req.status === 'SCHEDULED' ? (
                <div className="text-center py-2 text-xs font-semibold text-purple-700 bg-purple-50 rounded-xl">
                  🚚 Transport Scheduled: {req.schedule?.collectionCenter} ({new Date(req.schedule?.collectionDate || '').toLocaleDateString()})
                </div>
              ) : (
                <div className="text-center py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-xl">
                  🎉 Feedstock Verified & Rewards Credited to Wallet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
