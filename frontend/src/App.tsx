import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';

// Biochar Company Pages
import { CompanyOverview } from './pages/company/CompanyOverview';
import { CompanyLiveMap } from './pages/company/CompanyLiveMap';
import { HarvestDetection } from './pages/company/HarvestDetection';
import { FeedstockRequests } from './pages/company/FeedstockRequests';
import { PanchayatNetwork } from './pages/company/PanchayatNetwork';
import { FarmerRegistry } from './pages/company/FarmerRegistry';
import { FeedstockVerification } from './pages/company/FeedstockVerification';
import { CreditsAndRewards } from './pages/company/CreditsAndRewards';
import { MarketplaceInventory } from './pages/company/MarketplaceInventory';
import { OrdersManagement } from './pages/company/OrdersManagement';
import { CompanyAnalytics } from './pages/company/CompanyAnalytics';

// Gram Panchayat Pages
import { PanchayatOverview } from './pages/panchayat/PanchayatOverview';
import { SatelliteFieldReports } from './pages/panchayat/SatelliteFieldReports';
import { CollectionScheduling } from './pages/panchayat/CollectionScheduling';
import { PanchayatFarmers } from './pages/panchayat/PanchayatFarmers';
import { PanchayatRequests } from './pages/panchayat/PanchayatRequests';
import { PanchayatIntakeVerification } from './pages/panchayat/PanchayatIntakeVerification';

// Farmer Pages
import { FarmerHome } from './pages/farmer/FarmerHome';
import { MyFarm } from './pages/farmer/MyFarm';
import { FarmerRequests } from './pages/farmer/FarmerRequests';
import { FarmerCollections } from './pages/farmer/FarmerCollections';
import { MyWallet } from './pages/farmer/MyWallet';
import { AgriMarketplace } from './pages/farmer/AgriMarketplace';
import { MyOrders } from './pages/farmer/MyOrders';
import { CashbackPayments } from './pages/farmer/CashbackPayments';

// Supplier Pages
import { SupplierOrders } from './pages/supplier/SupplierOrders';
import { SupplierInventory } from './pages/supplier/SupplierInventory';
import { SupplierPayables } from './pages/supplier/SupplierPayables';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Biochar Company Dashboard */}
            <Route path="/company" element={<DashboardLayout allowedRoles={['BIOCHAR_COMPANY', 'ADMIN']} />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<CompanyOverview />} />
              <Route path="live-map" element={<CompanyLiveMap />} />
              <Route path="harvest-detection" element={<HarvestDetection />} />
              <Route path="requests" element={<FeedstockRequests />} />
              <Route path="panchayats" element={<PanchayatNetwork />} />
              <Route path="farmers" element={<FarmerRegistry />} />
              <Route path="collections" element={<FeedstockRequests />} />
              <Route path="verification" element={<FeedstockVerification />} />
              <Route path="rewards" element={<CreditsAndRewards />} />
              <Route path="marketplace" element={<MarketplaceInventory />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="analytics" element={<CompanyAnalytics />} />
            </Route>

            {/* Gram Panchayat Dashboard */}
            <Route path="/panchayat" element={<DashboardLayout allowedRoles={['GRAM_PANCHAYAT', 'ADMIN']} />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<PanchayatOverview />} />
              <Route path="field-reports" element={<SatelliteFieldReports />} />
              <Route path="map" element={<SatelliteFieldReports />} />
              <Route path="farmers" element={<PanchayatFarmers />} />
              <Route path="requests" element={<PanchayatRequests />} />
              <Route path="farmer-id" element={<SatelliteFieldReports />} />
              <Route path="scheduling" element={<CollectionScheduling />} />
              <Route path="verification" element={<PanchayatIntakeVerification />} />
              <Route path="intake" element={<PanchayatIntakeVerification />} />
              <Route path="centers" element={<CollectionScheduling />} />
            </Route>

            {/* Farmer Dashboard */}
            <Route path="/farmer" element={<DashboardLayout allowedRoles={['FARMER', 'ADMIN']} />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<FarmerHome />} />
              <Route path="my-farm" element={<MyFarm />} />
              <Route path="requests" element={<FarmerRequests />} />
              <Route path="collections" element={<FarmerCollections />} />
              <Route path="wallet" element={<MyWallet />} />
              <Route path="marketplace" element={<AgriMarketplace />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="cashback" element={<CashbackPayments />} />
            </Route>

            {/* Fertilizer Supplier Dashboard */}
            <Route path="/supplier" element={<DashboardLayout allowedRoles={['SUPPLIER', 'ADMIN']} />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<SupplierOrders />} />
              <Route path="inventory" element={<SupplierInventory />} />
              <Route path="payables" element={<SupplierPayables />} />
              <Route path="shipments" element={<SupplierOrders />} />
            </Route>

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
