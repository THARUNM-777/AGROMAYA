import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wheat,
  Satellite,
  Flame,
  ShieldCheck,
  Building2,
  Users,
  Coins,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Leaf,
  CheckCircle2,
  MapPin,
  Clock,
  Compass,
  Send,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoLaunch = async (targetRole: 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER') => {
    await demoLogin(targetRole);
    if (targetRole === 'BIOCHAR_COMPANY') navigate('/company/overview');
    else if (targetRole === 'GRAM_PANCHAYAT') navigate('/panchayat/overview');
    else if (targetRole === 'FARMER') navigate('/farmer/home');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9F5]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#123D2B] via-[#0D2C1F] to-[#101C18] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B5E853_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Smart Agriculture Waste-to-Biochar Ecosystem
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight sm:leading-none">
            Transform Stubble Burning Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-teal-300">Clean Carbon Wealth</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            AGROMAYA leverages Copernicus Sentinel-2 satellite intelligence, NDVI vegetation radar, and automated farmer-panchayat logistics to eliminate crop residue burning while turning agro-waste into high-value biochar.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/company/live-map"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-950 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              Explore Live Satellite Radar
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md transition-all"
            >
              Sign In to Platform
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stakeholder Portal Navigation */}
          <div className="mt-14 max-w-4xl mx-auto p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wider font-bold text-lime-400 mb-3">
              Stakeholder Ecosystem Access
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleDemoLaunch('BIOCHAR_COMPANY')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-bold text-white transition-all hover:scale-102"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                Biochar Industry
              </button>

              <button
                onClick={() => handleDemoLaunch('GRAM_PANCHAYAT')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-xs font-bold text-white transition-all hover:scale-102"
              >
                <Users className="w-4 h-4 text-blue-400" />
                Gram Panchayat
              </button>

              <button
                onClick={() => handleDemoLaunch('FARMER')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-xs font-bold text-white transition-all hover:scale-102"
              >
                <Wheat className="w-4 h-4 text-amber-400" />
                Farmer Portal
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-xs font-bold text-white transition-all hover:scale-102"
              >
                <Coins className="w-4 h-4 text-purple-400" />
                Supplier Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* National Impact & Problem Statistics */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-800">500M+</span>
              <p className="text-xs text-slate-500 font-medium mt-1">Tonnes Annual Crop Residue in India</p>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-rose-600">100M+</span>
              <p className="text-xs text-slate-500 font-medium mt-1">Tonnes Openly Burnt Yearly</p>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600">₹2.00/kg</span>
              <p className="text-xs text-slate-500 font-medium mt-1">Farmer Dual Reward Rate (Credit + Cash)</p>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">100%</span>
              <p className="text-xs text-slate-500 font-medium mt-1">Circular Biochar Carbon Sequestration</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow: Satellite-to-Biochar */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Autonomous Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            How The AGROMAYA Ecosystem Works
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            From Copernicus Sentinel-2 satellite observation to farmer wallet credits and industrial biochar production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">Satellite Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Copernicus Sentinel-2 multispectral radar scans farm parcels, computing NDVI senescence to detect harvest-ready fields.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <Satellite className="w-3.5 h-3.5" /> 10m Resolution
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">Dual Collection Request</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biochar companies send direct requests to registered farmers (Method 1) or dispatch bulk discovery clusters to Panchayats (Method 2).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Direct & Bulk
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">Panchayat Logistics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gram Panchayat coordinates with local farmers, confirms feedstock volumes, and schedules transport to APMC yards.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] text-blue-700 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Coordinated Pickup
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-4">
                04
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">Weighbridge & Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Feedstock deliveries are weighed, inspected for moisture and grade (A/B/C), and verified by authorized company quality leads.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] text-purple-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Certified Weight
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold text-sm mb-4">
                05
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">Wallet & Marketplace</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Farmer wallet receives instant credits and direct bank cash. Earned credits can be redeemed for organic fertilizers, seeds, and biochar.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] text-lime-700 font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> Credits + Cash
            </div>
          </div>
        </div>
      </section>

      {/* 3 Stakeholders Section */}
      <section className="py-20 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Three Unified Stakeholders
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Each actor in the agricultural ecosystem gets a tailored, purpose-built dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Biochar Company Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Biochar Companies</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Procure verified, high-volume agricultural biomass at transparent prices. Monitor satellite crop ripening, verify truck manifests, manage agricultural marketplace inventory, and track ESG carbon offsets.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Interactive Google Satellite Field Radar
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Multi-Field Bulk Discovery Selection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Feedstock Verification & Reward Issuance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Agricultural Marketplace Inventory Control
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleDemoLaunch('BIOCHAR_COMPANY')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-colors"
              >
                Launch Company Console
              </button>
            </div>

            {/* Gram Panchayat Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gram Panchayats</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Empower rural local government to monitor agricultural land, maintain farmer land survey registries, identify parcel owners from satellite clusters, and schedule zero-burn residue collection points.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Village Jurisdiction Land Records
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Landowner Identification for Bulk Requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Transport Scheduling & Fleet Logistics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Village-Level Waste Availability Reports
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleDemoLaunch('GRAM_PANCHAYAT')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-blue-700 hover:bg-blue-800 text-white shadow-md transition-colors"
              >
                Launch Panchayat Console
              </button>
            </div>

            {/* Farmer Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                  <Wheat className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Farmers</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Simple, bilingual (English & Kannada) mobile-friendly portal. Receive competitive bids for crop residues, track pickup vehicles, view transparent credit and cash ledgers, and buy discounted farm inputs.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Bilingual Interface (English / ಕನ್ನಡ)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    1-Click Request Accept / Reject
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Agricultural Credit & Cash Ledger Wallet
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Internal Marketplace (Biochar, Seeds, Worms)
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleDemoLaunch('FARMER')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-colors"
              >
                Launch Farmer Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#101C18] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">AGROMAYA</span>
              <p className="text-[10px] text-slate-400">National Hackathon Edition • Davangere, Karnataka</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-center sm:text-right">
            <span>Powered by Copernicus Sentinel-2 MSI • React • Node.js • Prisma</span>
            <div className="text-[11px] text-emerald-400 mt-1">
              Zero-Burn Circular Biochar Ecosystem © 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
