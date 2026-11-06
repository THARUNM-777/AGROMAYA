import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { CreditWallet } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  Wallet,
  Coins,
  TrendingUp,
  Store,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const MyWallet: React.FC = () => {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await walletApi.getWallet();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('myCredits')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger of Agricultural Credits earned from verified feedstock delivery and direct bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWallet}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/farmer/marketplace"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Store className="w-4 h-4" />
            Spend Credits on Marketplace
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('availableBalance')}
          value={`${wallet?.availableCredits.toLocaleString() || 0} Credits`}
          subtitle="1 Credit ≈ ₹1 Value"
          icon={Coins}
          color="emerald"
        />
        <StatCard
          title={t('creditsEarned')}
          value={`${wallet?.totalEarnedCredits.toLocaleString() || 0} Credits`}
          subtitle="From Verified Crop Stubble"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Credits Spent"
          value={`${wallet?.totalSpentCredits.toLocaleString() || 0} Credits`}
          subtitle="Redeemed for Farm Inputs"
          icon={Store}
          color="slate"
        />
        <StatCard
          title={t('cashReceived')}
          value={`₹${wallet?.totalCashReceived.toLocaleString() || 0}`}
          subtitle="Direct Bank Payouts"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Immutable Wallet Transaction Ledger
          </h3>
          <span className="text-xs text-slate-500">
            All credit and debit activities are cryptographically signed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Transaction Date</th>
                <th className="py-3.5 px-4 font-bold">Type</th>
                <th className="py-3.5 px-4 font-bold">Description</th>
                <th className="py-3.5 px-4 font-bold">Reference ID</th>
                <th className="py-3.5 px-4 font-bold">Amount</th>
                <th className="py-3.5 px-4 font-bold text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading ledger...
                  </td>
                </tr>
              ) : wallet?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                wallet?.transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'CREDIT_EARNED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type === 'CREDIT_EARNED' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {tx.type === 'CREDIT_EARNED' ? 'Credits Added' : 'Credits Spent'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {tx.description}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {tx.referenceId || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold text-sm ${
                          tx.type === 'CREDIT_EARNED' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'CREDIT_EARNED' ? '+' : '-'}
                        {tx.amount.toLocaleString()} Credits
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {tx.balanceAfter.toLocaleString()} Credits
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
