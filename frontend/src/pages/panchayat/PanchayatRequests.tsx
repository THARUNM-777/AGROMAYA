import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestsApi } from '../../services/api';
import { FeedstockRequest } from '../../types';
import { Send, Calendar, CheckCircle2, Clock, Truck, Building2, User, Wheat } from 'lucide-react';

export const PanchayatRequests: React.FC = () => {
  const [requests, setRequests] = useState<FeedstockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestsApi.getRequests();
      if (data.success) setRequests(data.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Incoming Feedstock Procurement Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biochar industrial procurement requests requiring Gram Panchayat coordination and transport scheduling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    req.requestMethod === 'BULK_DISCOVERY'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {req.requestMethod === 'BULK_DISCOVERY' ? 'Bulk Discovery Procurement' : 'Direct Farmer'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Biochar Company:</span>
                  <span className="font-bold text-slate-900">{req.company?.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Producer:</span>
                  <span className="font-semibold text-slate-800">
                    {req.farmer?.fullName || 'Multiple Landowners (GP Cluster Identification)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Quantity:</span>
                  <span className="font-extrabold text-emerald-800">
                    {req.requestedTonnes} Tonnes ({req.cropType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Offered Price:</span>
                  <span className="font-bold text-slate-900">₹{req.offeredRewardPerKg}/kg</span>
                </div>
              </div>

              {req.notes && (
                <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  "{req.notes}"
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  req.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : req.status === 'SCHEDULED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Status: {req.status}
              </span>

              <Link
                to={`/panchayat/scheduling?requestId=${req.id}`}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Transport
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
