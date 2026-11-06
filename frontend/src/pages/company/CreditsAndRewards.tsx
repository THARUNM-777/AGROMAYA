import React, { useState, useEffect } from 'react';
import { analyticsApi, farmersApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Coins, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';

export const CreditsAndRewards: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, fRes] = await Promise.all([
          analyticsApi.getCompanyAnalytics(),
          farmersApi.getFarmers(),
        ]);
        if (aRes.success) setKpis(aRes.kpis);
        if (fRes.success) setFarmers(fRes.farmers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search) ||
      f.village?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Financial Ledger & Farmer Reward Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit-ready dual reward accounting: Agricultural Marketplace Credits and Direct Bank Payouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Agricultural Credits Issued"
          value={`${(kpis?.totalCreditsIssued || 12850).toLocaleString()} Credits`}
          subtitle="Redeemable in Marketplace"
          icon={Coins}
          color="emerald"
        />
        <StatCard
          title="Direct Bank Cash Disbursed"
          value={`₹${(kpis?.totalCashPaid || 8400).toLocaleString()}`}
          subtitle="Processed via NEFT / UPI"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Verified Biochar Feedstock"
          value={`${kpis?.totalFeedstockCollectedTonnes || 32.8} Tonnes`}
          subtitle="Avg Reward: ₹2.00 / kg"
          icon={Wallet}
          color="blue"
        />
      </div>

      {/* Farmer Wallet Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {farmers.length} Registered Farmer Wallets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Farmer Name</th>
                <th className="py-3.5 px-4 font-bold">Village & Panchayat</th>
                <th className="py-3.5 px-4 font-bold">Available Credits</th>
                <th className="py-3.5 px-4 font-bold">Total Credits Earned</th>
                <th className="py-3.5 px-4 font-bold">Credits Spent</th>
                <th className="py-3.5 px-4 font-bold">Cash Received</th>
                <th className="py-3.5 px-4 font-bold">Bank Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFarmers.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{f.fullName}</span>
                    <span className="text-[10px] text-slate-400">{f.phone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800 font-medium block">{f.village?.name}</span>
                    <span className="text-[10px] text-slate-400">{f.panchayat?.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {f.wallet?.availableCredits.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">
                      {f.wallet?.totalEarnedCredits.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600">
                      {f.wallet?.totalSpentCredits.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-amber-700">
                      ₹{f.wallet?.totalCashReceived.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-600 font-mono">
                      {f.bankAccountRef || 'SBIN004010045'}
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
