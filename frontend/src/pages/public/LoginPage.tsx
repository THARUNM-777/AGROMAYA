import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wheat,
  Building2,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Phone,
  CheckCircle2,
  Package,
  Landmark,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin, loading } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Register State
  const [regRole, setRegRole] = useState<'FARMER' | 'BIOCHAR_COMPANY' | 'SUPPLIER'>('FARMER');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Farmer specific
  const [surveyNumber, setSurveyNumber] = useState('');
  const [totalLandAcres, setTotalLandAcres] = useState('3.0');
  const [preferredLang, setPreferredLang] = useState('kn');
  const [district, setDistrict] = useState('Davangere');

  // Company specific
  const [companyName, setCompanyName] = useState('');
  const [capacityTonnes, setCapacityTonnes] = useState('50');

  // Supplier specific
  const [supplierName, setSupplierName] = useState('');
  const [gstin, setGstin] = useState('');

  // Quick fill helper state
  const [showCredentialsReference, setShowCredentialsReference] = useState(false);

  const routeByRole = (role: string) => {
    if (role === 'BIOCHAR_COMPANY') navigate('/company/overview');
    else if (role === 'GRAM_PANCHAYAT') navigate('/panchayat/overview');
    else if (role === 'FARMER') navigate('/farmer/home');
    else if (role === 'SUPPLIER') navigate('/supplier/orders');
    else navigate('/farmer/home');
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    try {
      const user = await login(loginIdentifier.trim() || 'tarun', loginPassword || 'tarun123');
      routeByRole(user.role);
    } catch (_err: any) {
      await demoLogin('FARMER');
      routeByRole('FARMER');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const payload: any = {
        role: regRole,
        name: regName.trim() || 'Tarun M',
        phone: regPhone.trim() || '9019789795',
        email: regEmail.trim() || 'taruntarudvg@gmail.com',
        password: regPassword || 'tarun123',
        district: district || 'Davangere',
      };

      if (regRole === 'FARMER') {
        payload.surveyNumber = surveyNumber || `SY-45/1`;
        payload.totalLandAcres = parseFloat(totalLandAcres) || 3.0;
        payload.preferredLang = preferredLang;
      } else if (regRole === 'BIOCHAR_COMPANY') {
        payload.companyName = companyName || regName || 'AgroMaya Biochar Industries';
        payload.capacityTonnes = parseFloat(capacityTonnes) || 50;
      } else if (regRole === 'SUPPLIER') {
        payload.supplierName = supplierName || regName || 'Kaveri Bio-Inputs Hub';
        payload.gstin = gstin || `GSTIN29AAACA1234Z5`;
      }

      const user = await register(payload);
      setSuccessMessage('Entering website as Tarun M...');
      setTimeout(() => {
        routeByRole(user.role);
      }, 400);
    } catch (_err: any) {
      await demoLogin(regRole);
      routeByRole(regRole);
    }
  };

  const fillQuickCredential = (email: string, pass: string) => {
    setAuthMode('signin');
    setLoginIdentifier(email);
    setLoginPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F2] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#123D2B] via-[#16A765] to-[#B5E853] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Wheat className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          AGROMAYA • BIOCHAR CONNECT
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          National Agricultural Waste-to-Biochar & Biometric Verification Network
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          {/* Main Auth Mode Tabs: Sign In vs Create Account */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'signin'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          {/* Instant 1-Click Direct Access (No Gmail/Password Required) */}
          <button
            type="button"
            onClick={() => handleSignIn()}
            className="w-full mb-4 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-900 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all border border-emerald-400/60 group cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-base shadow">
                🚀
              </div>
              <div>
                <span className="block text-sm font-black text-lime-300">
                  Go Straight to Website as Tarun M
                </span>
                <span className="block text-[11px] text-slate-200 font-normal">
                  No registered Gmail or password needed • 1-Click Access
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-lime-300 group-hover:translate-x-1.5 transition-transform shrink-0" />
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">or type any text below to enter</span>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type Any Text / Name / Phone / Letters
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Type anything (e.g. tarun, dvg, 123) or leave as is"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password (Any text or leave blank)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Type any password or leave blank"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  💡 Type any text or password — automatically logs in as <strong className="text-emerald-700 font-bold">Tarun M</strong>!
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Website as Tarun M</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: REAL REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Role Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Stakeholder Role / ಪಾತ್ರ
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRegRole('FARMER')}
                    className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                      regRole === 'FARMER'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wheat className="w-4 h-4 text-amber-600" />
                    Farmer (ರೈತ)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('BIOCHAR_COMPANY')}
                    className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                      regRole === 'BIOCHAR_COMPANY'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    Biochar Industry
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('SUPPLIER')}
                    className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                      regRole === 'SUPPLIER'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Package className="w-4 h-4 text-purple-600" />
                    Input Supplier
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {regRole === 'FARMER'
                    ? 'Farmer Full Name / ಹೆಸರು'
                    : regRole === 'BIOCHAR_COMPANY'
                    ? 'Authorized Representative / Officer Name'
                    : 'Supplier / Dealer Representative Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tarun M or any name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Mobile Phone & District */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="9019789795 or any number"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    District / ಜಿಲ್ಲೆ
                  </label>
                  <input
                    type="text"
                    placeholder="Davangere"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="any text or email (e.g. tarun@gmail.com)"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Role-Specific Fields: Farmer */}
              {regRole === 'FARMER' && (
                <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Survey No / ಪಹಣಿ ಸಂಖ್ಯೆ
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SY-45"
                      value={surveyNumber}
                      onChange={(e) => setSurveyNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Land Area / ವಿಸ್ತೀರ್ಣ (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={totalLandAcres}
                      onChange={(e) => setTotalLandAcres(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Role-Specific Fields: Company */}
              {regRole === 'BIOCHAR_COMPANY' && (
                <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                      Company / Plant Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tungabhadra Biochar Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                      Capacity (Tonnes/Day)
                    </label>
                    <input
                      type="number"
                      value={capacityTonnes}
                      onChange={(e) => setCapacityTonnes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Role-Specific Fields: Supplier */}
              {regRole === 'SUPPLIER' && (
                <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-purple-50/70 rounded-xl border border-purple-200">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1">
                      Supplier / Agency Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karnataka Organic Inputs Co"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1">
                      GSTIN / Dealer License
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAACA1234Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password (Any text or leave blank)
                </label>
                <input
                  type="password"
                  placeholder="Type any password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register & Enter Website as Tarun M</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Collapsible Verified Credential Reference for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCredentialsReference(!showCredentialsReference)}
              className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
            >
              <span>{showCredentialsReference ? 'Hide' : 'View'} Verified Stakeholder Accounts</span>
            </button>

            {showCredentialsReference && (
              <div className="mt-3 space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div
                  onClick={() => fillQuickCredential('9019789795', 'tarun123')}
                  className="flex items-center justify-between p-2 rounded-xl bg-emerald-100/90 hover:bg-emerald-200 cursor-pointer border border-emerald-300 transition-colors shadow-2xs"
                >
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    🌾 Tarun M (Verified Farmer)
                  </span>
                  <span className="font-mono text-emerald-800 text-[10px] font-bold">9019789795 (Click to Fill)</span>
                </div>

                <div
                  onClick={() => fillQuickCredential('company@agromaya.in', 'Agromaya@2026')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-emerald-50 cursor-pointer border border-slate-100 transition-colors"
                >
                  <span className="font-bold text-emerald-900">🏢 Biochar Company</span>
                  <span className="font-mono text-slate-500 text-[10px]">company@agromaya.in</span>
                </div>

                <div
                  onClick={() => fillQuickCredential('panchayat@agromaya.in', 'Agromaya@2026')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-blue-50 cursor-pointer border border-slate-100 transition-colors"
                >
                  <span className="font-bold text-blue-900">🏛️ Gram Panchayat</span>
                  <span className="font-mono text-slate-500 text-[10px]">panchayat@agromaya.in</span>
                </div>

                <div
                  onClick={() => fillQuickCredential('farmer@agromaya.in', 'Agromaya@2026')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-amber-50 cursor-pointer border border-slate-100 transition-colors"
                >
                  <span className="font-bold text-amber-900">🌾 Farmer Portal</span>
                  <span className="font-mono text-slate-500 text-[10px]">farmer@agromaya.in</span>
                </div>

                <div
                  onClick={() => fillQuickCredential('supplier@agromaya.in', 'Agromaya@2026')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-purple-50 cursor-pointer border border-slate-100 transition-colors"
                >
                  <span className="font-bold text-purple-900">🚚 Agri Supplier</span>
                  <span className="font-mono text-slate-500 text-[10px]">supplier@agromaya.in</span>
                </div>

                <p className="text-[10px] text-slate-400 text-center pt-1">
                  Click any account to auto-fill credentials into the sign-in form.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
