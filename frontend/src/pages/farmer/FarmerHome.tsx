import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { walletApi, requestsApi, fieldsApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import {
  Wheat,
  Coins,
  Wallet,
  Truck,
  Send,
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const FarmerHome: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [farmFields, setFarmFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const [wRes, rRes, fRes] = await Promise.all([
          walletApi.getWallet(),
          requestsApi.getRequests(),
          fieldsApi.getFields(),
        ]);
        if (wRes.success) setWallet(wRes.wallet);
        if (rRes.success) {
          setPendingRequests(rRes.requests.filter((r) => r.status === 'PENDING').slice(0, 3));
        }
        if (fRes.success) {
          setFarmFields(fRes.fields.slice(0, 2));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#123D2B] to-[#101C18] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/30">
            <Wheat className="w-3.5 h-3.5" />
            {t('farmerGreeting')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name || 'Tarun M'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Kondajji Village • Harihara Rural Gram Panchayat • Davangere, Karnataka
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/farmer/marketplace"
            className="flex items-center gap-2 px-4 py-2.5 bg-lime-400 hover:bg-lime-500 text-emerald-950 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Store className="w-4 h-4" />
            {t('marketplace')}
          </Link>
          <Link
            to="/farmer/wallet"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all"
          >
            <Wallet className="w-4 h-4" />
            {t('myCredits')}
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('availableBalance')}
          value={`${wallet?.availableCredits.toLocaleString() || 4850} Credits`}
          subtitle="Ready to Spend on Marketplace"
          icon={Coins}
          color="emerald"
        />
        <StatCard
          title={t('cashReceived')}
          value={`₹${wallet?.totalCashReceived.toLocaleString() || 3200}`}
          subtitle="Transferred to Bank Account"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title={t('creditsEarned')}
          value={`${wallet?.totalEarnedCredits.toLocaleString() || 8200}`}
          subtitle="Cumulative AgroMaya Rewards"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title={t('activeRequests')}
          value={pendingRequests.length || 1}
          subtitle="Incoming Feedstock Offers"
          icon={Send}
          color="blue"
        />
      </div>

      {/* Feedstock Request Alert Box */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 p-6 rounded-3xl shadow-xs">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-200 text-amber-900 rounded-xl">
                <Wheat className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950">
                  New Feedstock Collection Offer Received!
                </h3>
                <p className="text-xs text-amber-800">
                  AgroMaya Biochar offers ₹2.00/kg to purchase your crop stubble instead of burning.
                </p>
              </div>
            </div>

            <Link
              to="/farmer/requests"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Review & Accept Offer
            </Link>
          </div>
        </div>
      )}

      {/* Farm Overview & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farm Field Quick Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900">{t('myFarm')}</h3>
              <Link to="/farmer/my-farm" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                View Farm Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('fieldCode')}:</span>
                <span className="font-bold text-slate-900">KA-DVG-101</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('cropType')}:</span>
                <span className="font-bold text-emerald-800">Paddy (Samba Mahsuri)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('landArea')}:</span>
                <span className="font-semibold text-slate-900">2.2 Acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('harvestReadiness')}:</span>
                <span className="font-bold text-amber-600">86.9% Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('estimatedResidue')}:</span>
                <span className="font-extrabold text-emerald-800">8.25 Tonnes</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Stubble Burning Status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero-Burn Protected
            </span>
          </div>
        </div>

        {/* Recent Ledger Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900">{t('myCredits')}</h3>
              <Link to="/farmer/wallet" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                Full Ledger <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {wallet?.transactions?.slice(0, 3).map((tx: any) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{tx.description}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`font-extrabold text-xs ${
                      tx.type === 'CREDIT_EARNED' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'CREDIT_EARNED' ? '+' : '-'}
                    {tx.amount.toLocaleString()} Credits
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Direct Bank Transfer:</span>
            <span className="font-bold text-amber-700">₹{wallet?.totalCashReceived.toLocaleString() || 3200} Received</span>
          </div>
        </div>
      </div>
    </div>
  );
};
