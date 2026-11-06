import React, { useState, useEffect } from 'react';
import { collectionsApi } from '../../services/api';
import { FeedstockCollection } from '../../types';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Truck,
  Scale,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Coins,
  FileText,
  User,
  Clock,
} from 'lucide-react';

export const FeedstockVerification: React.FC = () => {
  const [collections, setCollections] = useState<FeedstockCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Verification Modal State
  const [selectedBatch, setSelectedBatch] = useState<FeedstockCollection | null>(null);
  const [actualWeightKg, setActualWeightKg] = useState<number>(3000);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [moisturePct, setMoisturePct] = useState<number>(12.0);
  const [rewardRate, setRewardRate] = useState<number>(2.0);
  const [creditSplitRatio, setCreditSplitRatio] = useState<number>(0.75); // 75% credits, 25% cash
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await collectionsApi.getCollections();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const openVerifyModal = (batch: FeedstockCollection) => {
    setSelectedBatch(batch);
    setActualWeightKg(batch.actualWeightKg);
    setQualityGrade((batch.qualityGrade as any) || 'A');
    setMoisturePct(batch.moisturePct || 12.0);
    setRewardRate(2.0);
    setCreditSplitRatio(0.75);
    setRemarks(`Weighbridge certified delivery at ${batch.collectionLocation}. Moisture within standard limits.`);
    setVerificationResult(null);
  };

  const handleVerifySubmit = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      const res = await collectionsApi.verifyCollection(selectedBatch.id, {
        actualQuantityTonnes: actualWeightKg / 1000.0,
        qualityGrade,
        moisturePct,
        remarks,
        rewardRatePerKg: rewardRate,
        creditSplitRatio,
      });

      if (res.success) {
        setVerificationResult(res);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        fetchCollections();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = collections.filter(
    (c) =>
      c.collectionNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.farmer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.residueCategory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Scale className="w-4 h-4" />
            Quality Control & Reward Disbursement Engine
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Feedstock Intake Verification & Farmer Wallet Crediting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify actual delivery weighbridge tickets, record moisture & quality grade, and disburse Agricultural Credits and direct cash.
          </p>
        </div>

        <button
          onClick={fetchCollections}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Batches
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch number, farmer, residue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {collections.filter((c) => c.status === 'PENDING_VERIFICATION').length} Batches Pending Verification
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Batch ID</th>
                <th className="py-3.5 px-4 font-bold">Farmer / Producer</th>
                <th className="py-3.5 px-4 font-bold">Residue Type</th>
                <th className="py-3.5 px-4 font-bold">Intake Weight</th>
                <th className="py-3.5 px-4 font-bold">Intake Location</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading deliveries...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No collection batches found.
                  </td>
                </tr>
              ) : (
                filtered.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {batch.collectionNumber}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {new Date(batch.collectionDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{batch.farmer.fullName}</div>
                      <span className="text-[10px] text-slate-400">{batch.farmer.phone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{batch.residueCategory}</div>
                      <span className="text-[10px] text-slate-500">Grade: {batch.qualityGrade} • Moisture: {batch.moisturePct}%</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-800 text-sm">
                        {batch.actualWeightKg.toLocaleString()} kg
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({(batch.actualWeightKg / 1000).toFixed(2)} Tonnes)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 block">{batch.collectionLocation}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          batch.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {batch.status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {batch.status === 'VERIFIED' ? 'VERIFIED & REWARDED' : 'PENDING QC'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {batch.status === 'PENDING_VERIFICATION' ? (
                        <button
                          onClick={() => openVerifyModal(batch)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-xs shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Verify & Reward
                        </button>
                      ) : (
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          +{batch.verification?.rewardCreditsAwarded.toLocaleString()} Credits Issued
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Feedstock Verification & Reward Calculation
                  </h3>
                  <p className="text-xs text-slate-500">Batch {selectedBatch.collectionNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  setVerificationResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {verificationResult ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xl text-slate-900">
                    Verification Complete & Rewards Awarded!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Farmer wallet credited and field marked as <b>COLLECTED (Green)</b>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Agricultural Credits</span>
                    <p className="text-xl font-extrabold text-emerald-800">
                      +{verificationResult.creditsAwarded.toLocaleString()} Credits
                    </p>
                    <span className="text-[10px] text-slate-500">For Marketplace Input Purchases</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Direct Bank Cash</span>
                    <p className="text-xl font-extrabold text-amber-700">
                      ₹{verificationResult.cashAwarded.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-500">Direct Bank Transfer</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    setVerificationResult(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Farmer Details Header */}
                <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farmer:</span>
                    <span className="font-bold text-slate-900">{selectedBatch.farmer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Intake Center:</span>
                    <span>{selectedBatch.collectionLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Residue:</span>
                    <span className="font-semibold text-emerald-800">{selectedBatch.residueCategory}</span>
                  </div>
                </div>

                {/* Actual Weight Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Feedstock Weight (Kg):
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quality Grade and Moisture */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quality Grade:</label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="A">Grade A (Clean / Dry +5%)</option>
                      <option value="B">Grade B (Standard 100%)</option>
                      <option value="C">Grade C (High Dust -10%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Moisture (%):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={moisturePct}
                      onChange={(e) => setMoisturePct(parseFloat(e.target.value) || 12.0)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Configurable Split: Credits vs Cash */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Reward Rate: ₹{rewardRate}/kg</span>
                    <span className="text-emerald-800">
                      Total Value: ₹{Math.round(actualWeightKg * rewardRate * (qualityGrade === 'A' ? 1.05 : qualityGrade === 'C' ? 0.9 : 1.0)).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Reward Distribution Split:</span>
                      <span className="font-semibold text-emerald-800">
                        {Math.round(creditSplitRatio * 100)}% Credits / {Math.round((1 - creditSplitRatio) * 100)}% Cash
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={creditSplitRatio}
                      onChange={(e) => setCreditSplitRatio(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">QC Remarks:</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting || actualWeightKg <= 0}
                    onClick={handleVerifySubmit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Confirm & Credit Wallet
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
