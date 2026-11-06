import React, { useState, useEffect } from 'react';
import { suppliersApi } from '../../services/api';
import { Order } from '../../types';
import confetti from 'canvas-confetti';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  CreditCard,
  Building2,
  MapPin,
  Calendar,
  Send,
  Eye,
} from 'lucide-react';

export const SupplierOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dispatch Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [carrierName, setCarrierName] = useState('VRL Logistics Karnataka');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [trackingNotes, setTrackingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await suppliersApi.getOrders();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDispatchModal = (order: Order) => {
    setSelectedOrder(order);
    setCarrierName('VRL Logistics Karnataka');
    setTrackingNumber(`VRL-KA-${Math.floor(100000 + Math.random() * 900000)}`);
    setEstimatedDays(3);
    setTrackingNotes(`Dispatched from Davangere Central Input Hub. Destination: ${order.deliveryAddress}`);
    setSuccessMsg('');
  };

  const handleDispatch = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await suppliersApi.dispatchOrder(selectedOrder.id, {
        carrierName,
        trackingNumber,
        estimatedDeliveryDays: estimatedDays,
        trackingNotes,
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setSuccessMsg(`Order #${selectedOrder.orderNumber} dispatched via ${carrierName} (Tracking: ${trackingNumber})!`);
        setTimeout(() => {
          setSelectedOrder(null);
          setSuccessMsg('');
          fetchOrders();
        }, 1600);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async (order: Order) => {
    const shipmentId = order.shipments?.[0]?.id;
    if (!shipmentId) return;
    if (!window.confirm(`Confirm final delivery for Order #${order.orderNumber} to ${order.farmer?.fullName}?`)) return;

    try {
      await suppliersApi.deliverShipment(shipmentId);
      confetti({ particleCount: 70, spread: 50 });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delivery confirmation failed');
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.farmer?.fullName && o.farmer.fullName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
            <Package className="w-3.5 h-3.5" />
            Certified Input Manufacturer Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            B2B Purchase Orders & Dispatch Fulfillment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Orders placed by farmers redeeming agricultural credits. Backed by Biochar Company fiat payments before dispatch.
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

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, farmer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPANY_PAID">Paid by Company (Ready to Dispatch)</option>
              <option value="CONFIRMED">Awaiting Company Payment</option>
              <option value="DISPATCHED">Dispatched / In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Order Details</th>
                <th className="py-3.5 px-4 font-bold">Farmer / Delivery Address</th>
                <th className="py-3.5 px-4 font-bold">Products Requested</th>
                <th className="py-3.5 px-4 font-bold">Company Payment Status</th>
                <th className="py-3.5 px-4 font-bold">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching purchase orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const payable = order.payables?.[0];
                  const isPaidByCompany = payable?.status === 'PAID' || order.status === 'COMPANY_PAID' || order.status === 'DISPATCHED' || order.status === 'DELIVERED';
                  const shipment = order.shipments?.[0];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.orderedAt).toLocaleDateString()} • {order.totalAmountCredits.toLocaleString()} Credits (₹{order.totalAmountInr.toLocaleString()})
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{order.farmer?.fullName}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{order.deliveryAddress}</span>
                        <span className="text-[10px] text-emerald-800 font-medium">📞 {order.farmer?.phone}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-[11px] text-slate-700">
                              • <span className="font-bold">{item.quantity}x</span> {item.product?.name}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaidByCompany ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Company Paid ₹{order.totalAmountInr.toLocaleString()}
                            </span>
                            {payable?.payments?.[0] && (
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                Ref: {payable.payments[0].paymentReference.slice(0, 16)}...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Awaiting Company Payment
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {order.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Delivered
                          </span>
                        ) : order.status === 'DISPATCHED' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Truck className="w-3 h-3" /> In Transit ({shipment?.trackingNumber})
                            </span>
                            <button
                              onClick={() => handleMarkDelivered(order)}
                              className="block text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                            >
                              Confirm Delivered to Farm
                            </button>
                          </div>
                        ) : isPaidByCompany ? (
                          <button
                            onClick={() => openDispatchModal(order)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Goods
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Hold (Waiting for Biochar Co Payment)
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

      {/* Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Authorize Dispatch for #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">{successMsg}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1 text-purple-950">
                  <div className="font-bold flex justify-between">
                    <span>Recipient Farmer:</span>
                    <span>{selectedOrder.farmer?.fullName}</span>
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Delivery: {selectedOrder.deliveryAddress}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Logistics Carrier</label>
                  <select
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="VRL Logistics Karnataka">VRL Logistics Karnataka</option>
                    <option value="Karnataka State Rural Transport (KSRTC Cargo)">KSRTC Rural Cargo Fleet</option>
                    <option value="BlueDart Express Agro">BlueDart Express Agro</option>
                    <option value="DTDC Regional Express">DTDC Regional Express</option>
                    <option value="Gram Panchayat Tractor Shuttle">Gram Panchayat Tractor Shuttle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Consignment / Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Estimated Delivery</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-400 block text-right">{estimatedDays} Days</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Dispatch Notes</label>
                  <textarea
                    rows={2}
                    value={trackingNotes}
                    onChange={(e) => setTrackingNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Dispatch & Notify Farmer'}
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
