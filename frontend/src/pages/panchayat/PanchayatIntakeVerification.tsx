import React, { useState, useEffect } from 'react';
import { requestsApi, collectionsApi, fieldsApi } from '../../services/api';
import { FeedstockRequest, PanchayatCollectionCenter } from '../../types';
import { BiometricFaceModal } from '../../components/common/BiometricFaceModal';
import confetti from 'canvas-confetti';
import {
  Scale,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Truck,
  Building2,
  Calendar,
  Wheat,
  UserCheck,
  Receipt,
  Droplet,
} from 'lucide-react';

export const PanchayatIntakeVerification: React.FC = () => {
  const [requests, setRequests] = useState<FeedstockRequest[]>([]);
  const [centers, setCenters] = useState<PanchayatCollectionCenter[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FeedstockRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification & Intake Form State
  const [actualWeightKg, setActualWeightKg] = useState<number>(3200);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [moisturePct, setMoisturePct] = useState<number>(12.2);
  const [collectionLocation, setCollectionLocation] = useState('Harihara APMC Collection Yard #1');
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80');

  // Biometric Verification State
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [showFaceModal, setShowFaceModal] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [verifiedReceipt, setVerifiedReceipt] = useState<any>(null);

  const fetchIntakeData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        requestsApi.getRequests({ status: 'SCHEDULED' }),
        fieldsApi.getCollectionCenters(),
      ]);
      if (rRes.success) {
        setRequests(rRes.requests);
        if (rRes.requests.length > 0) {
          setSelectedRequest(rRes.requests[0]);
          setActualWeightKg(Math.round(rRes.requests[0].requestedTonnes * 1000));
        }
      }
      if (cRes.success) {
        setCenters(cRes.centers);
        if (cRes.centers.length > 0) setCollectionLocation(cRes.centers[0].centerName);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntakeData();
  }, []);

  const handleSelectRequest = (req: FeedstockRequest) => {
    setSelectedRequest(req);
    setActualWeightKg(Math.round(req.requestedTonnes * 1000));
    setIsBiometricVerified(false);
    setVerificationDetails(null);
    setVerifiedReceipt(null);
  };

  const handleBiometricSuccess = (res: any) => {
    setIsBiometricVerified(true);
    setVerificationDetails(res);
  };

  const handleConfirmIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedRequest.farmerId || !selectedRequest.fieldId) {
      alert('Valid farmer and field required for intake');
      return;
    }
    if (!isBiometricVerified) {
      alert('Farmer identity verification (Biometric Face or Manual Override) is required before certified intake.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await collectionsApi.createCollection({
        requestId: selectedRequest.id,
        fieldId: selectedRequest.fieldId,
        farmerId: selectedRequest.farmerId,
        actualWeightKg,
        residueCategory: `${selectedRequest.cropType} Straw`,
        qualityGrade,
        moisturePct,
        collectionLocation,
        deliveryPhotoUrl,
        verificationMethod: verificationDetails?.verificationMethod || 'BIOMETRIC_FACE',
        autoVerifyAndReward: true,
        rewardRatePerKg: selectedRequest.offeredRewardPerKg || 2.0,
      });

      if (res.success) {
        confetti({ particleCount: 90, spread: 70 });
        setVerifiedReceipt(res);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Intake failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
            <Scale className="w-3.5 h-3.5" />
            Collection Center Intake & Weighbridge
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Feedstock Delivery & Consented Biometric Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gram Panchayat delivery verification: 1:1 camera face matching, weighbridge certified tare, moisture measurement, and instant credit wallet settlement.
          </p>
        </div>

        <button
          onClick={fetchIntakeData}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Deliveries
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Requests List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-sm text-slate-900">Scheduled Farmer Deliveries</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {requests.length} Queued
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No scheduled deliveries pending intake.</p>
            ) : (
              requests.map((r) => {
                const isSelected = selectedRequest?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRequest(r)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-300'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{r.requestNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {r.cropType}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{r.farmer?.fullName}</div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Expected: {r.requestedTonnes} Tonnes</span>
                      <span>Rate: ₹{r.offeredRewardPerKg}/kg</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Intake Verification & Weighbridge Form */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRequest ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Delivery Context */}
              <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider block">
                    Target Producer Identity
                  </span>
                  <h3 className="text-lg font-black">{selectedRequest.farmer?.fullName}</h3>
                  <p className="text-xs text-slate-300">
                    Mobile: {selectedRequest.farmer?.phone} • Village: {selectedRequest.farmer?.village?.name || 'Kondajji'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Manifest Number</span>
                  <span className="font-mono font-bold text-sm text-lime-400">{selectedRequest.requestNumber}</span>
                </div>
              </div>

              {/* Step 1: Consented Face Biometrics */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-700" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Step 1: Farmer Identity Verification</h4>
                      <p className="text-[11px] text-slate-500">Consented camera facial matching against registered biometric template</p>
                    </div>
                  </div>

                  {isBiometricVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {verificationDetails?.verificationStatus || 'VERIFIED'}
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowFaceModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Verify Farmer Face
                    </button>
                  )}
                </div>

                {isBiometricVerified && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-950 font-medium border border-emerald-200">
                    ✅ {verificationDetails?.message} ({verificationDetails?.verificationMethod})
                  </div>
                )}
              </div>

              {/* Step 2: Certified Weighbridge Intake Form */}
              <form onSubmit={handleConfirmIntake} className="space-y-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-1 border-b">
                  <Scale className="w-4 h-4 text-emerald-700" />
                  Step 2: Weighbridge Scale & Moisture Testing
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Actual Weight (Kilograms) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={100}
                        max={30000}
                        value={actualWeightKg}
                        onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                        {(actualWeightKg / 1000).toFixed(2)} Tonnes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Moisture Content (%) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        step="0.1"
                        min={5}
                        max={35}
                        value={moisturePct}
                        onChange={(e) => setMoisturePct(parseFloat(e.target.value) || 12.0)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                        {moisturePct <= 14 ? '✅ Optimal Drying' : '⚠️ High Moisture'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Feedstock Quality Inspection Grade</label>
                    <select
                      value={qualityGrade}
                      onChange={(e: any) => setQualityGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="A">Grade A (Clean, Dry & Uniform Straw - 105% Reward Multiplier)</option>
                      <option value="B">Grade B (Standard Commercial Residue - 100% Rate)</option>
                      <option value="C">Grade C (Slight Moisture / Foreign Matter - 90% Rate)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Designated Collection Hub</label>
                    <select
                      value={collectionLocation}
                      onChange={(e) => setCollectionLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {centers.map((c) => (
                        <option key={c.id} value={c.centerName}>
                          {c.centerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-semibold">
                  <div>
                    <span>Calculated Instant Credits to Farmer:</span>
                    <span className="text-[10px] text-emerald-800 block">75% Agricultural Credits, 25% Bank Cash</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-900 block">
                      +{Math.round((actualWeightKg * (selectedRequest.offeredRewardPerKg || 2.0) * (qualityGrade === 'A' ? 1.05 : 1.0)) * 0.75).toLocaleString()} Credits
                    </span>
                    <span className="text-[11px] text-amber-700 font-bold">
                      +₹{Math.round((actualWeightKg * (selectedRequest.offeredRewardPerKg || 2.0) * (qualityGrade === 'A' ? 1.05 : 1.0)) * 0.25).toLocaleString()} Bank Cash
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isBiometricVerified}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-lg transition-all disabled:opacity-40"
                >
                  <Receipt className="w-4 h-4" />
                  {submitting ? 'Verifying & Depositing Credits...' : 'Certify Weighbridge Intake & Award Farmer Credits'}
                </button>
              </form>

              {/* Certified Receipt View */}
              {verifiedReceipt && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Delivery Certified & Wallet Updated!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-900 pt-1">
                    <div>
                      <span className="text-slate-500 block">Batch Number:</span>
                      <span className="font-mono font-bold">{verifiedReceipt.collection?.collectionNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Credits Awarded:</span>
                      <span className="font-bold text-emerald-700">+{verifiedReceipt.creditsAwarded} Credits</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              Select a scheduled delivery request to proceed with intake.
            </div>
          )}
        </div>
      </div>

      {/* Biometric Face Modal */}
      {selectedRequest && selectedRequest.farmerId && (
        <BiometricFaceModal
          isOpen={showFaceModal}
          onClose={() => setShowFaceModal(false)}
          mode="VERIFY"
          farmerId={selectedRequest.farmerId}
          farmerName={selectedRequest.farmer?.fullName}
          onSuccess={handleBiometricSuccess}
        />
      )}
    </div>
  );
};
