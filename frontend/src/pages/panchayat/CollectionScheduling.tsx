import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestsApi } from '../../services/api';
import { FeedstockRequest } from '../../types';
import {
  Calendar,
  Truck,
  Clock,
  CheckCircle2,
  Building2,
  User,
  Wheat,
  MapPin,
  RefreshCw,
  Send,
} from 'lucide-react';

export const CollectionScheduling: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetRequestId = searchParams.get('requestId');

  const [requests, setRequests] = useState<FeedstockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [collectionCenter, setCollectionCenter] = useState<string>(
    'Harihara APMC Yard Collection Point #1'
  );
  const [vehicleNumber, setVehicleNumber] = useState<string>('KA-17-TR-8819');
  const [driverContact, setDriverContact] = useState<string>('+91 94481 00223');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestsApi.getRequests();
      if (data.success) {
        setRequests(data.requests);
        if (targetRequestId) {
          setSelectedReqId(targetRequestId);
        } else if (data.requests.length > 0) {
          setSelectedReqId(data.requests[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [targetRequestId]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId) return;
    setSubmitting(true);
    try {
      await requestsApi.scheduleCollection(selectedReqId, {
        collectionDate,
        collectionCenter,
        vehicleNumber,
        driverContact,
      });
      setSuccessMsg('Collection and logistics successfully scheduled and dispatched!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Scheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRequest = requests.find((r) => r.id === selectedReqId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
            <Truck className="w-4 h-4" />
            Panchayat Logistics Center
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Feedstock Collection & Transport Scheduling
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule tractor pickups, assign village collection points, and dispatch verified delivery manifests.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduling Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="font-extrabold text-base text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Schedule Logistics Pickup
          </h3>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Feedstock Request:</label>
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestNumber} ({r.requestedTonnes}T {r.cropType} • {r.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedRequest && (
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Producer:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.farmer?.fullName || 'Landowners Group'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRequest.company?.companyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-extrabold text-emerald-800">
                    {selectedRequest.requestedTonnes} Tonnes ({selectedRequest.cropType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reward:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{selectedRequest.offeredRewardPerKg}/kg
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Collection Date:</label>
              <input
                type="date"
                required
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Designated Collection Point:</label>
              <select
                value={collectionCenter}
                onChange={(e) => setCollectionCenter(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Harihara APMC Yard Collection Point #1">Harihara APMC Yard Point #1</option>
                <option value="Harihara APMC Yard Collection Point #2">Harihara APMC Yard Point #2</option>
                <option value="Kondajji Village Panchayat Center">Kondajji Village Center</option>
                <option value="Bannikodu Weighbridge Yard">Bannikodu Weighbridge Yard</option>
                <option value="Malebennur Channel Collection Yard">Malebennur Channel Yard</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tractor / Vehicle Number:</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g., KA-17-TR-8819"
                className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Driver / Coordinator Contact:</label>
              <input
                type="text"
                required
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                placeholder="+91 94481 00223"
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md transition-all"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Dispatch & Update Schedule
            </button>
          </form>
        </div>

        {/* Existing Schedules Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Active Collection Schedules & Transport Timeline
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time manifest of planned and active agricultural stubble transport runs.
            </p>

            <div className="space-y-3">
              {requests
                .filter((r) => r.schedule || r.status === 'SCHEDULED' || r.status === 'COMPLETED')
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-400 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">{r.requestNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        <b>{r.farmer?.fullName || 'Landowners Group'}</b> • {r.requestedTonnes} Tonnes {r.cropType} Straw
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{r.schedule?.collectionCenter || 'Harihara APMC Center'}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 sm:justify-end">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {r.schedule?.collectionDate
                            ? new Date(r.schedule.collectionDate).toLocaleDateString()
                            : 'Upcoming'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 block">
                        Vehicle: {r.schedule?.vehicleNumber || 'KA-17-TR-4912'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
