import React, { useState, useEffect } from 'react';
import { farmersApi, panchayatsApi } from '../../services/api';
import { Farmer, Panchayat } from '../../types';
import { BiometricFaceModal } from '../../components/common/BiometricFaceModal';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  MapPin,
  X,
  RefreshCw,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Scale,
} from 'lucide-react';

export const PanchayatFarmers: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedFarmerForFace, setSelectedFarmerForFace] = useState<Farmer | null>(null);

  // New Farmer Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [totalLandAcres, setTotalLandAcres] = useState(3.0);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, pRes] = await Promise.all([
        farmersApi.getFarmers(),
        panchayatsApi.getPanchayats(),
      ]);
      if (fRes.success) setFarmers(fRes.farmers);
      if (pRes.success) {
        setPanchayats(pRes.panchayats);
        if (pRes.panchayats[0]?.villages && pRes.panchayats[0].villages.length > 0) {
          setSelectedVillageId(pRes.panchayats[0].villages[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panchayats[0]) return;
    setSubmitting(true);
    try {
      const res = await farmersApi.registerFarmer({
        fullName,
        phone,
        surveyNumber,
        totalLandAcres,
        villageId: selectedVillageId,
        panchayatId: panchayats[0].id,
      });
      setSuccessMsg(`Farmer ${fullName} enrolled into revenue survey registry successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        setShowRegisterModal(false);
        setFullName('');
        setPhone('');
        setSurveyNumber('');
      }, 2500);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Farmer registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = farmers.filter(
    (f) =>
      f.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search) ||
      f.surveyNumber.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Gram Panchayat Farmer Survey Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official government register linking farmers with land survey boundaries, biometric face templates, and biochar wallets.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Enroll New Farmer
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmer name, phone, survey number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{farmers.length} Enrolled Farmers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Farmer Name</th>
                <th className="py-3.5 px-4 font-bold">Phone Number</th>
                <th className="py-3.5 px-4 font-bold">Village</th>
                <th className="py-3.5 px-4 font-bold">Survey Number</th>
                <th className="py-3.5 px-4 font-bold">Land Area</th>
                <th className="py-3.5 px-4 font-bold">Face Biometric</th>
                <th className="py-3.5 px-4 font-bold">Wallet Balance</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((f) => {
                const isBiometricEnrolled = f.biometricEnrollment?.status === 'ENROLLED';

                return (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{f.phone}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{f.village?.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">{f.surveyNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.totalLandAcres} Acres</td>

                    {/* Biometric Status */}
                    <td className="py-3.5 px-4">
                      {isBiometricEnrolled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Enrolled ({f.biometricEnrollment?.qualityScore || 90}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Pending Face ID
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                      {f.wallet?.availableCredits.toLocaleString() || 0} Credits
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedFarmerForFace(f)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          isBiometricEnrolled
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                        {isBiometricEnrolled ? 'Re-scan' : 'Enroll Face'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Enroll Farmer in Panchayat Registry</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterFarmer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Farmer Full Name:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Basavanneppa Gaddi"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number:</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 9845100099"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village:</label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => setSelectedVillageId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {panchayats[0]?.villages?.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Survey Number:</label>
                  <input
                    type="text"
                    required
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    placeholder="e.g., 142/2"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Acres:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={totalLandAcres}
                    onChange={(e) => setTotalLandAcres(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Enroll Farmer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Face Modal */}
      {selectedFarmerForFace && (
        <BiometricFaceModal
          mode="ENROLL"
          farmerId={selectedFarmerForFace.id}
          farmerName={selectedFarmerForFace.fullName}
          onClose={() => setSelectedFarmerForFace(null)}
          onSuccess={() => {
            fetchData();
            setSelectedFarmerForFace(null);
          }}
        />
      )}
    </div>
  );
};
