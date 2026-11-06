import React, { useState, useEffect } from 'react';
import { suppliersApi } from '../../services/api';
import { SupplierPayable } from '../../types';
import {
  Coins,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Building2,
  FileText,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';

export const SupplierPayables: React.FC = () => {
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const data = await suppliersApi.getPayables();
      if (data.success) {
        setPayables(data.payables);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const totalSettled = payables
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + p.payableAmountInr, 0);

  const totalPending = payables
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, p) => acc + p.payableAmountInr, 0);

  const filtered = payables.filter(
    (p) =>
      p.order?.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.order?.farmer?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            <Coins className="w-3.5 h-3.5" />
            Financial Settlement Ledger
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Biochar Company Payables & B2B Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time auditable settlement log for agricultural inputs redeemed by farmers via biochar credits.
          </p>
        </div>

        <button
          onClick={fetchPayables}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Settlements
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Invoices</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{payables.length}</h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Backed by Farmer Credit Orders</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Settled Bank Payouts</span>
          <h3 className="text-2xl font-black text-emerald-800 mt-1">₹{totalSettled.toLocaleString()}</h3>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Confirmed via Razorpay / NEFT</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 block">Pending Settlement</span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">₹{totalPending.toLocaleString()}</h3>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Awaiting Biochar Company payment</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, farmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{filtered.length} Payables Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Associated Order</th>
                <th className="py-3.5 px-4 font-bold">Biochar Company</th>
                <th className="py-3.5 px-4 font-bold">Payable Amount</th>
                <th className="py-3.5 px-4 font-bold">Credits Redeemed</th>
                <th className="py-3.5 px-4 font-bold">Payment Reference</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No supplier payables recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const payment = p.payments?.[0];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{p.order?.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          Farmer: {p.order?.farmer?.fullName} ({p.order?.farmer?.village?.name || 'Davangere'})
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{p.company?.companyName || 'AgroMaya Biochar Dynamics'}</span>
                        <span className="text-[10px] text-slate-400">Payer Entity</span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{p.payableAmountInr.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {p.creditsRedeemed.toLocaleString()} Credits
                      </td>

                      <td className="py-3.5 px-4">
                        {payment ? (
                          <div>
                            <span className="font-mono text-[10px] text-slate-800 font-bold block">
                              {payment.paymentReference}
                            </span>
                            <span className="text-[9px] text-emerald-700 font-medium">
                              {payment.paymentGateway} • {new Date(payment.paidAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pending Transfer</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {p.status === 'PAID' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Payout
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
