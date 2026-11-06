import React, { useState, useEffect } from 'react';
import { marketplaceApi, suppliersApi } from '../../services/api';
import { Order, SupplierPayable } from '../../types';
import confetti from 'canvas-confetti';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  User,
  CreditCard,
  Building2,
  Coins,
  X,
  RefreshCw,
  Send,
  AlertCircle,
} from 'lucide-react';

export const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Settlement Modal State
  const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'RAZORPAY_SANDBOX' | 'BANK_TRANSFER' | 'UPI'>('RAZORPAY_SANDBOX');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await marketplaceApi.getOrders();
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openPayModal = (payable: SupplierPayable) => {
    setSelectedPayable(payable);
    setPaymentGateway('RAZORPAY_SANDBOX');
    setPaymentReference(`pay_rzp_live_${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNotes(`B2B Invoice Settlement for farmer inputs order #${payable.order?.orderNumber || ''}`);
    setSettlementSuccess('');
  };

  const handleSettlePayment = async () => {
    if (!selectedPayable) return;
    setSubmitting(true);
    try {
      const res = await suppliersApi.settlePayment(selectedPayable.id, {
        paymentGateway,
        paymentReference,
        amount: selectedPayable.payableAmountInr,
        notes,
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 60 });
        setSettlementSuccess(res.message);
        setTimeout(() => {
          setSelectedPayable(null);
          setSettlementSuccess('');
          fetchOrders();
        }, 1800);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment settlement failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.farmer?.fullName && o.farmer.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            <Coins className="w-3.5 h-3.5" />
            Credit Redemption & Supplier Payable Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Farmer Orders & Supplier Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Farmers spend agricultural credits. Biochar company settles invoice amount in INR with suppliers via Razorpay / Bank Transfer.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order ID, farmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{orders.length} Total Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Order Number</th>
                <th className="py-3.5 px-4 font-bold">Farmer Name</th>
                <th className="py-3.5 px-4 font-bold">Items Purchased</th>
                <th className="py-3.5 px-4 font-bold">Credits Spent</th>
                <th className="py-3.5 px-4 font-bold">Supplier Settlement (INR)</th>
                <th className="py-3.5 px-4 font-bold">Fulfillment Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No marketplace orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const payable = order.payables?.[0];
                  const shipment = order.shipments?.[0];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {order.orderNumber}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {new Date(order.orderedAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{order.farmer?.fullName}</span>
                        <span className="text-[10px] text-slate-400">{order.farmer?.village?.name || 'Davangere'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-[11px] text-slate-700">
                              • {item.quantity}x {item.product?.name || 'Input Product'}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-800 text-sm">
                          {order.totalAmountCredits.toLocaleString()} Credits
                        </span>
                        <span className="text-[10px] text-slate-400 block">Deducted from Farmer Wallet</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {payable ? (
                          payable.status === 'PAID' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Paid ₹{payable.payableAmountInr.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                To: {payable.supplier?.supplierName || 'Input Supplier'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-amber-700 block">
                                Due: ₹{payable.payableAmountInr.toLocaleString()}
                              </span>
                              <button
                                onClick={() => openPayModal(payable)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all"
                              >
                                <CreditCard className="w-3 h-3" />
                                Settle Supplier (Razorpay)
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs italic">Internal Stock</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {shipment ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                shipment.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <Truck className="w-3 h-3" />
                              {shipment.status === 'DELIVERED' ? 'Delivered' : `Dispatched (${shipment.carrierName})`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              Track: {shipment.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'COMPANY_PAID'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {order.status === 'COMPANY_PAID' ? 'Awaiting Supplier Dispatch' : 'Awaiting Settlement'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Supplier Modal */}
      {selectedPayable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Settle Input Supplier Payable
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayable(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settlementSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">{settlementSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-black text-slate-900 text-base">
                      ₹{selectedPayable.payableAmountInr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary Supplier:</span>
                    <span className="font-bold text-emerald-800">
                      {selectedPayable.supplier?.supplierName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank IFSC / Account:</span>
                    <span className="font-mono text-slate-800">
                      {selectedPayable.supplier?.bankAccountNo || 'SBIN00401829910'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Payment Method / Gateway</label>
                  <select
                    value={paymentGateway}
                    onChange={(e: any) => setPaymentGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RAZORPAY_SANDBOX">Razorpay B2B Payout Gateway (Sandbox)</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT / RTGS Settlement)</option>
                    <option value="UPI">Corporate UPI Auto-Settlement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Payment Reference ID</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Settlement Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedPayable(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettlePayment}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    {submitting ? 'Settling...' : 'Confirm Payment & Notify Supplier'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
