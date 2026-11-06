export type UserRole = 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER' | 'SUPPLIER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  farmerId?: string;
  companyId?: string;
  panchayatId?: string;
  supplierId?: string;
  companyName?: string;
  supplierName?: string;
  farmerProfile?: any;
  companyProfile?: any;
  supplierProfile?: any;
  [key: string]: any;
}

export type FieldStatus = 'HARVEST_READY' | 'HARVEST_APPROACHING' | 'COLLECTED' | 'GROWING' | 'UNVERIFIED';

export interface VegetationObservation {
  date: string;
  ndvi: number;
  ndwi: number;
  evi: number;
  cloud_cover_pct: number;
  satellite_tile_id?: string;
  phenology_stage: string;
  thumbnail_url?: string;
}

export interface SatelliteObservation {
  id: string;
  fieldId: string;
  satelliteSource: string;
  acquisitionDate: string;
  ndvi: number;
  ndwi: number;
  evi: number;
  cloudCoverPct: number;
  rawDataJson?: string;
}

export interface AgriculturalField {
  id: string;
  fieldCode: string;
  farmerId?: string;
  farmer?: {
    id: string;
    fullName: string;
    phone: string;
    registrationStatus: string;
    biometricEnrollment?: BiometricEnrollment;
  };
  villageId: string;
  village: {
    id: string;
    name: string;
  };
  panchayatId: string;
  panchayat: {
    id: string;
    name: string;
    district?: string;
    taluk?: string;
    collectionCenters?: PanchayatCollectionCenter[];
  };
  surveyNumber: string;
  cropType: string;
  areaAcres: number;
  status: FieldStatus;
  harvestReadinessPct: number;
  estimatedResidueTonnes: number;
  harvestWindow?: string;
  centerLat: number;
  centerLng: number;
  polygonCoordinatesJson: string;
  polygonCoordinates: [number, number][];
  createdAt: string;
  satelliteObservations?: SatelliteObservation[];
}

export interface MapFeature {
  id: string;
  fieldCode: string;
  farmerName: string;
  farmerPhone?: string;
  farmerId?: string;
  village: string;
  panchayat: string;
  panchayatId: string;
  cropType: string;
  areaAcres: number;
  harvestReadinessPct: number;
  estimatedResidueTonnes: number;
  harvestWindow?: string;
  status: FieldStatus;
  color: string;
  center: [number, number];
  coordinates: [number, number][];
}

export interface PanchayatCollectionCenter {
  id: string;
  panchayatId: string;
  centerName: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPerson: string;
  phone: string;
  capacityTonnes: number;
  currentStockTonnes: number;
  active: boolean;
  distanceKm?: number | null;
  availableCapacityTonnes?: number;
}

export interface BiometricEnrollment {
  id: string;
  farmerId: string;
  biometricTemplateHash: string;
  consentGiven: boolean;
  consentLanguage: string;
  consentTimestamp: string;
  status: 'ENROLLED' | 'NOT_ENROLLED' | 'REVOKED';
  qualityScore: number;
  enrolledBy?: string;
}

export interface Farmer {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  district?: string;
  villageId: string;
  village?: { id: string; name: string };
  panchayatId: string;
  panchayat?: { id: string; name: string };
  surveyNumber: string;
  totalLandAcres: number;
  registrationStatus: string;
  bankAccountRef?: string;
  preferredLang: string;
  fields?: AgriculturalField[];
  wallet?: CreditWallet;
  biometricEnrollment?: BiometricEnrollment;
}

export interface Panchayat {
  id: string;
  name: string;
  district: string;
  taluk: string;
  contactOfficer: string;
  phone: string;
  officeAddress: string;
  villages?: { id: string; name: string; pinCode: string }[];
  collectionCenters?: PanchayatCollectionCenter[];
  _count?: {
    farmers: number;
    fields: number;
    requests: number;
  };
}

export type RequestMethod = 'DIRECT_FARMER' | 'BULK_DISCOVERY';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SCHEDULED' | 'COMPLETED';

export interface FeedstockRequest {
  id: string;
  requestNumber: string;
  companyId: string;
  company?: {
    id: string;
    companyName: string;
    contactPhone: string;
  };
  farmerId?: string;
  farmer?: {
    id: string;
    fullName: string;
    phone: string;
    village?: { name: string };
  };
  panchayatId: string;
  panchayat?: {
    id: string;
    name: string;
  };
  fieldId?: string;
  field?: AgriculturalField;
  requestMethod: RequestMethod;
  cropType: string;
  requestedTonnes: number;
  offeredRewardPerKg: number;
  status: RequestStatus;
  scheduledDate?: string;
  notes?: string;
  createdAt: string;
  schedule?: CollectionSchedule;
}

export interface CollectionSchedule {
  id: string;
  requestId: string;
  collectionDate: string;
  collectionCenter: string;
  transportStatus: string;
  vehicleNumber?: string;
  driverContact?: string;
}

export interface FeedstockCollection {
  id: string;
  collectionNumber: string;
  requestId: string;
  fieldId: string;
  field?: AgriculturalField;
  farmerId: string;
  farmer: {
    id: string;
    fullName: string;
    phone: string;
    village?: { name: string };
    panchayat?: { name: string };
    biometricEnrollment?: BiometricEnrollment;
  };
  collectionDate: string;
  actualWeightKg: number;
  residueCategory: string;
  qualityGrade: string;
  moisturePct: number;
  collectionLocation: string;
  weighbridgeSlipUrl?: string;
  deliveryPhotoUrl?: string;
  verificationMethod?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verification?: FeedstockVerification;
}

export interface FeedstockVerification {
  id: string;
  collectionId: string;
  verifiedByCompanyId: string;
  verifiedByCompany?: { companyName: string };
  actualQuantityTonnes: number;
  qualityGrade: string;
  moisturePct: number;
  verificationStatus: string;
  remarks?: string;
  rewardCreditsAwarded: number;
  cashbackAwarded: number;
  verifiedAt: string;
}

export interface CreditWallet {
  id: string;
  farmerId: string;
  availableCredits: number;
  totalEarnedCredits: number;
  totalSpentCredits: number;
  totalCashReceived: number;
  pendingCash: number;
  transactions?: CreditTransaction[];
  cashPayments?: CashPayment[];
}

export interface CreditTransaction {
  id: string;
  walletId: string;
  farmerId: string;
  type: 'CREDIT_EARNED' | 'CREDIT_SPENT' | 'CASH_DISBURSED' | 'CREDIT_REFUND' | 'ADJUSTMENT';
  amount: number;
  description: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface CashPayment {
  id: string;
  walletId: string;
  farmerId: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  status: string;
  disbursedAt: string;
}

export interface Supplier {
  id: string;
  userId: string;
  supplierName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  gstin?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  active: boolean;
  products?: Product[];
  payables?: SupplierPayable[];
  shipments?: Shipment[];
}

export interface Product {
  id: string;
  companyId: string;
  supplierId?: string;
  supplier?: { id: string; supplierName: string; contactPhone: string };
  categoryId: string;
  category?: { name: string };
  company?: { companyName: string; contactPhone: string };
  name: string;
  description: string;
  priceInInr: number;
  creditPrice: number;
  stockQuantity: number;
  imageUrl: string;
  isFeatured: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCreditPrice: number;
  subtotalCredits: number;
}

export interface SupplierPayable {
  id: string;
  orderId: string;
  order?: Order;
  supplierId: string;
  supplier: Supplier;
  companyId: string;
  company?: { companyName: string };
  payableAmountInr: number;
  creditsRedeemed: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  payments?: SupplierPayment[];
}

export interface SupplierPayment {
  id: string;
  payableId: string;
  paymentGateway: 'RAZORPAY_SANDBOX' | 'BANK_TRANSFER' | 'UPI';
  paymentReference: string;
  amountPaid: number;
  currency: string;
  status: string;
  paidAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  order?: Order;
  supplierId: string;
  supplier?: Supplier;
  carrierName: string;
  trackingNumber: string;
  dispatchDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  trackingNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  farmerId: string;
  farmer?: { fullName: string; village?: { name: string }; phone?: string };
  totalAmountCredits: number;
  totalAmountInr: number;
  status: 'PROCESSING' | 'CONFIRMED' | 'COMPANY_PAID' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  orderedAt: string;
  items: OrderItem[];
  payables?: SupplierPayable[];
  shipments?: Shipment[];
}

export interface Notification {
  id: string;
  recipientRole: string;
  recipientId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'HARVEST' | 'REWARD';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
