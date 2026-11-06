import axios from 'axios';
import {
  User,
  AgriculturalField,
  MapFeature,
  Farmer,
  Panchayat,
  PanchayatCollectionCenter,
  FeedstockRequest,
  FeedstockCollection,
  CreditWallet,
  CreditTransaction,
  CashPayment,
  Product,
  Order,
  Supplier,
  SupplierPayable,
  Shipment,
  Notification,
} from '../types';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agromaya_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  register: async (data: {
    role: 'FARMER' | 'BIOCHAR_COMPANY' | 'SUPPLIER';
    name: string;
    phone: string;
    password: string;
    email?: string;
    villageId?: string;
    panchayatId?: string;
    surveyNumber?: string;
    totalLandAcres?: number;
    preferredLang?: string;
    companyName?: string;
    supplierName?: string;
    district?: string;
    gstin?: string;
    address?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User; message: string }>('/auth/register', data);
    return res.data;
  },
  demoLogin: async (role: 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER' | 'SUPPLIER') => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/demo-login', {
      role,
    });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<{ success: boolean; user: any }>('/auth/me');
    return res.data;
  },
};

// Fields API
export const fieldsApi = {
  getFields: async (params?: any) => {
    const res = await apiClient.get<{ success: boolean; count: number; fields: AgriculturalField[] }>('/fields', {
      params,
    });
    return res.data;
  },
  getMapFeatures: async () => {
    const res = await apiClient.get<{ success: boolean; features: MapFeature[] }>('/fields/map');
    return res.data;
  },
  getFieldById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; field: any }>(`/fields/${id}`);
    return res.data;
  },
  createField: async (data: {
    farmerId?: string;
    surveyNumber?: string;
    cropType: string;
    polygonCoordinates: [number, number][];
    villageId?: string;
    panchayatId?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message: string; field: AgriculturalField }>('/fields', data);
    return res.data;
  },
  refreshSatellite: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; analysis: any; field: AgriculturalField }>(
      `/fields/${id}/satellite-refresh`
    );
    return res.data;
  },
  getCollectionCenters: async (lat?: number, lng?: number) => {
    const res = await apiClient.get<{ success: boolean; count: number; centers: PanchayatCollectionCenter[] }>(
      '/fields/collection-centers',
      { params: { lat, lng } }
    );
    return res.data;
  },
  updateFieldStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/fields/${id}/status`, { status });
    return res.data;
  },
};

// Farmers API
export const farmersApi = {
  getFarmers: async (params?: any) => {
    const res = await apiClient.get<{ success: boolean; count: number; farmers: Farmer[] }>('/farmers', {
      params,
    });
    return res.data;
  },
  getFarmerById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; farmer: Farmer }>(`/farmers/${id}`);
    return res.data;
  },
  registerFarmer: async (data: {
    fullName: string;
    phone: string;
    villageId: string;
    panchayatId: string;
    surveyNumber?: string;
    totalLandAcres?: number;
    preferredLang?: string;
    cropType?: string;
    polygonCoordinates?: [number, number][];
    biometricImageBase64?: string;
    biometricConsentGiven?: boolean;
  }) => {
    const res = await apiClient.post<{ success: boolean; farmer: Farmer; field?: any; biometrics?: any }>(
      '/farmers',
      data
    );
    return res.data;
  },
};

// Biometrics API
export const biometricsApi = {
  getStatus: async (farmerId: string) => {
    const res = await apiClient.get<{
      success: boolean;
      isEnrolled: boolean;
      status: string;
      qualityScore?: number;
      consentLanguage?: string;
      consentTimestamp?: string;
      templateHash?: string;
      farmer?: any;
    }>(`/biometrics/status/${farmerId}`);
    return res.data;
  },
  enrollFace: async (data: {
    farmerId: string;
    imageBase64: string;
    consentGiven: boolean;
    consentLanguage?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      enrollment: any;
    }>('/biometrics/enroll', data);
    return res.data;
  },
  verifyFace: async (data: {
    farmerId: string;
    probeImageBase64?: string;
    allowManualFallback?: boolean;
    manualReason?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      verificationStatus: string;
      verificationMethod: string;
      confidencePercentage?: number;
      message: string;
      farmer?: any;
    }>('/biometrics/verify', data);
    return res.data;
  },
};

// Panchayats API
export const panchayatsApi = {
  getPanchayats: async () => {
    const res = await apiClient.get<{ success: boolean; panchayats: Panchayat[] }>('/panchayats');
    return res.data;
  },
  getPanchayatById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; panchayat: Panchayat }>(`/panchayats/${id}`);
    return res.data;
  },
  getPanchayatStats: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; stats: any }>(`/panchayats/${id}/stats`);
    return res.data;
  },
};

// Requests API (Method 1 & Method 2)
export const requestsApi = {
  getRequests: async (params?: any) => {
    const res = await apiClient.get<{ success: boolean; count: number; requests: FeedstockRequest[] }>('/requests', {
      params,
    });
    return res.data;
  },
  createDirectRequest: async (data: { fieldId: string; offeredRewardPerKg?: number; notes?: string }) => {
    const res = await apiClient.post<{ success: boolean; request: FeedstockRequest }>('/requests/direct', data);
    return res.data;
  },
  createBulkRequest: async (data: { fieldIds: string[]; panchayatId?: string; offeredRewardPerKg?: number; notes?: string }) => {
    const res = await apiClient.post<{ success: boolean; request: FeedstockRequest; clusterDetails: any }>('/requests/bulk', data);
    return res.data;
  },
  respondAsFarmer: async (id: string, action: 'ACCEPT' | 'REJECT') => {
    const res = await apiClient.patch<{ success: boolean; request: FeedstockRequest }>(`/requests/${id}/farmer-response`, {
      action,
    });
    return res.data;
  },
  scheduleCollection: async (id: string, data: { collectionDate: string; collectionCenter: string; vehicleNumber?: string; driverContact?: string }) => {
    const res = await apiClient.post<{ success: boolean; request: FeedstockRequest; schedule: any }>(`/requests/${id}/schedule`, data);
    return res.data;
  },
};

// Collections & Verification API
export const collectionsApi = {
  getCollections: async (params?: any) => {
    const res = await apiClient.get<{ success: boolean; count: number; collections: FeedstockCollection[] }>('/collections', {
      params,
    });
    return res.data;
  },
  createCollection: async (data: {
    requestId: string;
    fieldId: string;
    farmerId: string;
    actualWeightKg: number;
    residueCategory?: string;
    qualityGrade?: string;
    moisturePct?: number;
    collectionLocation?: string;
    weighbridgeSlipUrl?: string;
    deliveryPhotoUrl?: string;
    verificationMethod?: string;
    autoVerifyAndReward?: boolean;
    rewardRatePerKg?: number;
  }) => {
    const res = await apiClient.post<{ success: boolean; collection: FeedstockCollection; creditsAwarded?: number; cashAwarded?: number }>(
      '/collections',
      data
    );
    return res.data;
  },
  verifyCollection: async (id: string, data: {
    actualQuantityTonnes?: number;
    qualityGrade?: string;
    moisturePct?: number;
    remarks?: string;
    rewardRatePerKg?: number;
    creditSplitRatio?: number;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      creditsAwarded: number;
      cashAwarded: number;
      totalReward: number;
      verification: any;
      updatedWallet: any;
    }>(`/collections/${id}/verify`, data);
    return res.data;
  },
};

// Wallet & Ledger API
export const walletApi = {
  getWallet: async (farmerId?: string) => {
    const res = await apiClient.get<{ success: boolean; wallet: CreditWallet }>('/wallet', {
      params: farmerId ? { farmerId } : undefined,
    });
    return res.data;
  },
  getTransactions: async (farmerId?: string) => {
    const res = await apiClient.get<{ success: boolean; transactions: CreditTransaction[] }>('/wallet/transactions', {
      params: farmerId ? { farmerId } : undefined,
    });
    return res.data;
  },
  getCashback: async (farmerId?: string) => {
    const res = await apiClient.get<{ success: boolean; payments: CashPayment[] }>('/wallet/cashback', {
      params: farmerId ? { farmerId } : undefined,
    });
    return res.data;
  },
};

// Marketplace API
export const marketplaceApi = {
  getProducts: async (params?: any) => {
    const res = await apiClient.get<{ success: boolean; count: number; products: Product[] }>('/marketplace/products', {
      params,
    });
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get<{ success: boolean; categories: any[] }>('/marketplace/categories');
    return res.data;
  },
  createProduct: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; product: Product }>('/marketplace/products', data);
    return res.data;
  },
  placeOrder: async (data: { items: { productId: string; quantity: number }[]; deliveryAddress?: string }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      order: Order;
      payables?: any[];
      remainingCredits: number;
    }>('/marketplace/orders', data);
    return res.data;
  },
  cancelOrder: async (id: string, reason?: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      updatedOrder: Order;
      updatedWallet: CreditWallet;
    }>(`/marketplace/orders/${id}/cancel`, { reason });
    return res.data;
  },
  getOrders: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; orders: Order[] }>('/marketplace/orders');
    return res.data;
  },
};

// Suppliers & B2B Payment Settlement API
export const suppliersApi = {
  getSuppliers: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; suppliers: Supplier[] }>('/suppliers');
    return res.data;
  },
  getMyProfile: async () => {
    const res = await apiClient.get<{ success: boolean; supplier: Supplier }>('/suppliers/me');
    return res.data;
  },
  getPayables: async (params?: { status?: string; supplierId?: string }) => {
    const res = await apiClient.get<{ success: boolean; count: number; payables: SupplierPayable[] }>('/suppliers/payables', {
      params,
    });
    return res.data;
  },
  settlePayment: async (payableId: string, data: {
    paymentGateway?: string;
    paymentReference?: string;
    amount?: number;
    notes?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      payment: any;
      updatedPayable: SupplierPayable;
    }>(`/suppliers/payables/${payableId}/pay`, data);
    return res.data;
  },
  getOrders: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; orders: Order[] }>('/suppliers/orders');
    return res.data;
  },
  dispatchOrder: async (orderId: string, data: {
    carrierName?: string;
    trackingNumber?: string;
    estimatedDeliveryDays?: number;
    trackingNotes?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      shipment: Shipment;
      updatedOrder: Order;
    }>(`/suppliers/orders/${orderId}/dispatch`, data);
    return res.data;
  },
  deliverShipment: async (shipmentId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(`/suppliers/shipments/${shipmentId}/deliver`);
    return res.data;
  },
};

// Analytics API
export const analyticsApi = {
  getCompanyAnalytics: async () => {
    const res = await apiClient.get<{ success: boolean; kpis: any; charts: any }>('/analytics/company');
    return res.data;
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async () => {
    const res = await apiClient.get<{ success: boolean; unreadCount: number; notifications: Notification[] }>('/notifications');
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },
};

// Satellite AI & Remote Sensing API
export const satelliteApi = {
  analyzeField: async (data: {
    fieldId: string;
    cropType: string;
    areaAcres: number;
    coordinates?: { lat: number; lng: number }[];
    centerLat?: number;
    centerLng?: number;
  }) => {
    const res = await apiClient.post<{ success: boolean; analysis: any }>('/satellite/analyze', data);
    return res.data;
  },
  getMapMyCropStatus: async () => {
    const res = await apiClient.get<{
      success: boolean;
      status: string;
      message: string;
      auth_valid: boolean;
      active_pipeline: string;
      customer_id?: string;
      plan?: string;
      quota_remaining?: string;
      supported_indices?: string[];
      supported_features?: string[];
    }>('/satellite/mapmycrop/status');
    return res.data;
  },
  configureMapMyCrop: async (apiKey: string, customerId?: string, endpoint?: string) => {
    const res = await apiClient.post<{
      success: boolean;
      status: string;
      auth_valid: boolean;
      message: string;
      customer_id?: string;
      plan?: string;
      active_pipeline?: string;
    }>('/satellite/mapmycrop/configure', { apiKey, customerId, endpoint });
    return res.data;
  },
  disconnectMapMyCrop: async () => {
    const res = await apiClient.post<{
      success: boolean;
      status: string;
      auth_valid: boolean;
      message: string;
      active_pipeline: string;
    }>('/satellite/mapmycrop/disconnect');
    return res.data;
  },
  getIndicesGuide: async () => {
    const res = await apiClient.get<{ success: boolean; indices: any[] }>('/satellite/indices-guide');
    return res.data;
  },
  getFieldTimeseries: async (fieldId: string) => {
    const res = await apiClient.get<{
      success: boolean;
      fieldId: string;
      cropType: string;
      farmerName: string;
      timeline: Array<{ date: string; ndvi: number; ndwi: number; evi: number; stage: string; cloud: number }>;
    }>(`/satellite/field-timeseries/${fieldId}`);
    return res.data;
  },
};
