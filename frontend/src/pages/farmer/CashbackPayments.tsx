import React, { useState, useEffect } from 'react';
import { walletApi } from '../../services/api';
import { CashPayment } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrendingUp, CheckCircle2, Building2, CreditCard, RefreshCw } from 'lucide-react';

export const CashbackPayments: React.FC = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [totalReceived, setTotalReceived] = useState<number>(3200);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [pRes, wRes] = await Promise.all([
        walletApi.getCashback(),
        walletApi.getWallet(),
      ]);
      if (pRes.success) setPayments(pRes.payments);
      if (wRes.success) setTotalReceived(wRes.wallet.totalCashReceived);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('cashback')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct bank transfers and monetary rewards deposited into your registered bank account for verified agricultural residue.
          </p>
        </div>

        <div className="px-5 py-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-amber-700" />
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Cash Paid to Bank</span>
            <span className="text-lg font-extrabold text-amber-800">
              ₹{totalReceived.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Direct Bank Transfer Records</h3>
          <span className="text-xs text-slate-500">Bank Account: SBIN004010045 (State Bank of India)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Transfer Date</th>
                <th className="py-3.5 px-4 font-bold">Transaction Reference</th>
                <th className="py-3.5 px-4 font-bold">Disbursement Method</th>
                <th className="py-3.5 px-4 font-bold">Transfer Amount</th>
                <th className="py-3.5 px-4 font-bold text-right">Bank Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No cash transfers recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {new Date(p.disbursedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {p.transactionRef}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {p.paymentMethod.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-amber-700 text-sm">
                        ₹{p.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.status}
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
