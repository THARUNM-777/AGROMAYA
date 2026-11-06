import React, { useState, useEffect } from 'react';
import { marketplaceApi } from '../../services/api';
import { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Package, CheckCircle2, Clock, Truck, Store } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi
      .getOrders()
      .then((res) => {
        if (res.success) setOrders(res.orders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('myOrders')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track farm input orders, seed deliveries, and biochar soil conditioner shipments redeemed with credits.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            No marketplace orders yet. Visit the Agri Marketplace to redeem your credits!
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  {order.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{i.quantity}x {i.product?.name || 'Input Product'}</span>
                      <span className="text-slate-400">({i.subtotalCredits} Credits)</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400">
                  Delivery Address: {order.deliveryAddress}
                </p>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-xs text-slate-400 block">Total Redeemed</span>
                <span className="text-xl font-extrabold text-emerald-800">
                  {order.totalAmountCredits.toLocaleString()} Credits
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ordered on {new Date(order.orderedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
