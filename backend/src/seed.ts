import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to generate normalized 128-d pseudo-embedding vector for demonstration
function generateBiometricVector(seedStr: string): number[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const vec: number[] = [];
  let norm = 0;
  for (let j = 0; j < 128; j++) {
    const val = Math.sin((hash + j) * 12.9898) * 43758.5453;
    const v = val - Math.floor(val);
    vec.push(v);
    norm += v * v;
  }
  norm = Math.sqrt(norm);
  return vec.map((v) => parseFloat((v / norm).toFixed(5)));
}

async function main() {
  console.log('🌱 Starting comprehensive AGROMAYA seed data generation...');

  // Clean existing tables in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.supplierPayment.deleteMany();
  await prisma.supplierPayable.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.cashPayment.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.creditWallet.deleteMany();
  await prisma.biometricEnrollment.deleteMany();
  await prisma.feedstockVerification.deleteMany();
  await prisma.feedstockCollection.deleteMany();
  await prisma.collectionSchedule.deleteMany();
  await prisma.feedstockRequest.deleteMany();
  await prisma.harvestPrediction.deleteMany();
  await prisma.satelliteObservation.deleteMany();
  await prisma.cropRecord.deleteMany();
  await prisma.agriculturalField.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.panchayatCollectionCenter.deleteMany();
  await prisma.village.deleteMany();
  await prisma.panchayat.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.biocharCompany.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Agromaya@2026', 10);

  // 1. Create Biochar Companies
  const companyUser1 = await prisma.user.create({
    data: {
      email: 'company@agromaya.in',
      passwordHash: defaultPasswordHash,
      role: 'BIOCHAR_COMPANY',
      name: 'Dr. Ramesh Kulkarni (Director)',
      phone: '+91 94481 22334',
      companyProfile: {
        create: {
          companyName: 'AgroMaya Biochar Dynamics Pvt Ltd',
          registrationNo: 'CIN-U24100KA2024PTC189021',
          contactPerson: 'Dr. Ramesh Kulkarni',
          contactPhone: '+91 94481 22334',
          address: 'Plot 42, KIADB Industrial Area, Karur, Davangere, Karnataka - 577006',
          active: true,
        },
      },
    },
    include: { companyProfile: true },
  });

  const companyUser2 = await prisma.user.create({
    data: {
      email: 'sahyadri@biochar.in',
      passwordHash: defaultPasswordHash,
      role: 'BIOCHAR_COMPANY',
      name: 'Vikram Hegde (Procurement Lead)',
      phone: '+91 98450 77889',
      companyProfile: {
        create: {
          companyName: 'Sahyadri Eco-Carbon Technologies',
          registrationNo: 'CIN-U24290KA2023PTC175412',
          contactPerson: 'Vikram Hegde',
          contactPhone: '+91 98450 77889',
          address: 'NH-48 Corridor, Harihara Bypass, Davangere, Karnataka - 577601',
          active: true,
        },
      },
    },
    include: { companyProfile: true },
  });

  // 2. Create Certified Agricultural Suppliers
  const supplierUser1 = await prisma.user.create({
    data: {
      email: 'supplier@agromaya.in',
      passwordHash: defaultPasswordHash,
      role: 'SUPPLIER',
      name: 'Shankar Gowda (Managing Director)',
      phone: '+91 98440 33445',
      supplierProfile: {
        create: {
          supplierName: 'Kaveri Bio-Agri & Soil Nutrients Ltd.',
          contactPerson: 'Shankar Gowda',
          contactPhone: '+91 98440 33445',
          contactEmail: 'orders@kaveribioagri.in',
          address: 'APMC Yard Industrial Sector, Harihara Road, Davangere - 577002',
          gstin: '29AABCK3912L1Z4',
          bankAccountNo: 'SBIN00401829910',
          bankIfsc: 'SBIN0040182',
          active: true,
        },
      },
    },
    include: { supplierProfile: true },
  });

  const supplierUser2 = await prisma.user.create({
    data: {
      email: 'karnataka.agro@inputs.in',
      passwordHash: defaultPasswordHash,
      role: 'SUPPLIER',
      name: 'Priyanka Patil (Commercial Head)',
      phone: '+91 94490 88776',
      supplierProfile: {
        create: {
          supplierName: 'Karnataka Agro-Bio Chemical Corp',
          contactPerson: 'Priyanka Patil',
          contactPhone: '+91 94490 88776',
          contactEmail: 'sales@karnatakaagrobio.in',
          address: 'Peenya Agro Tech Zone, Bengaluru / Hubballi Hub - 560058',
          gstin: '29AAACK5521M1Z8',
          bankAccountNo: 'CNRB00024189012',
          bankIfsc: 'CNRB0002418',
          active: true,
        },
      },
    },
    include: { supplierProfile: true },
  });

  // 3. Create Panchayats in Karnataka
  const panchayat1 = await prisma.panchayat.create({
    data: {
      name: 'Harihara Rural Gram Panchayat',
      district: 'Davangere',
      taluk: 'Harihara',
      contactOfficer: 'Suresh Patil (Panchayat Development Officer)',
      phone: '+91 94484 55101',
      officeAddress: 'Main Road, Near Mini Vidhana Soudha, Harihara - 577601',
    },
  });

  const panchayat2 = await prisma.panchayat.create({
    data: {
      name: 'Honnali Gram Panchayat',
      district: 'Davangere',
      taluk: 'Honnali',
      contactOfficer: 'Manjula B. (PDO)',
      phone: '+91 94484 55102',
      officeAddress: 'Panchayat Bhavan, Kote Road, Honnali - 577217',
    },
  });

  // Panchayat Operator User
  await prisma.user.create({
    data: {
      email: 'panchayat@agromaya.in',
      passwordHash: defaultPasswordHash,
      role: 'GRAM_PANCHAYAT',
      name: 'Suresh Patil (Harihara PDO)',
      phone: '+91 94484 55101',
    },
  });

  // 4. Create Panchayat Collection Centers with real coordinates
  const collectionCenters = [
    {
      panchayatId: panchayat1.id,
      centerName: 'Harihara APMC Collection Yard #1',
      address: 'APMC Market Yard Gate 2, Shimoga Road, Harihara - 577601',
      latitude: 14.512,
      longitude: 75.805,
      contactPerson: 'Basavaraj (Weighbridge Master)',
      phone: '+91 98451 22110',
      capacityTonnes: 200.0,
      currentStockTonnes: 38.5,
    },
    {
      panchayatId: panchayat1.id,
      centerName: 'Kondajji Village Sub-Collection Point',
      address: 'Kondajji Lake Bund Road, Kondajji Rural Center - 577589',
      latitude: 14.472,
      longitude: 75.842,
      contactPerson: 'Kempanna G.',
      phone: '+91 94482 11990',
      capacityTonnes: 120.0,
      currentStockTonnes: 18.0,
    },
    {
      panchayatId: panchayat1.id,
      centerName: 'Malebennur Agri Upcycling Hub',
      address: 'Tungabhadra Canal Road, Malebennur - 577530',
      latitude: 14.385,
      longitude: 75.760,
      contactPerson: 'Gangadhariah M.',
      phone: '+91 97410 55667',
      capacityTonnes: 150.0,
      currentStockTonnes: 22.4,
    },
    {
      panchayatId: panchayat2.id,
      centerName: 'Honnali RMC North Yard',
      address: 'Shimoga-Harihara State Highway, Honnali - 577217',
      latitude: 14.245,
      longitude: 75.645,
      contactPerson: 'Eshwarappa (Supervisor)',
      phone: '+91 94480 77112',
      capacityTonnes: 180.0,
      currentStockTonnes: 14.2,
    },
  ];

  for (const c of collectionCenters) {
    await prisma.panchayatCollectionCenter.create({ data: c });
  }

  // 5. Create Villages
  const villagesData = [
    { name: 'Kondajji', panchayatId: panchayat1.id, pinCode: '577589', latitude: 14.472, longitude: 75.842 },
    { name: 'Bannikodu', panchayatId: panchayat1.id, pinCode: '577601', latitude: 14.495, longitude: 75.821 },
    { name: 'Guttur', panchayatId: panchayat1.id, pinCode: '577601', latitude: 14.520, longitude: 75.815 },
    { name: 'Yalavatti', panchayatId: panchayat1.id, pinCode: '577601', latitude: 14.460, longitude: 75.865 },
    { name: 'Sasvehalli', panchayatId: panchayat2.id, pinCode: '577217', latitude: 14.280, longitude: 75.670 },
    { name: 'Belagutti', panchayatId: panchayat2.id, pinCode: '577217', latitude: 14.210, longitude: 75.610 },
  ];

  const villages = [];
  for (const v of villagesData) {
    const created = await prisma.village.create({ data: v });
    villages.push(created);
  }

  // 6. Create Farmers with Biometrics & Wallets
  const farmerNames = [
    'Ningappa Pujar', 'Basavanneppa Gaddi', 'Mallikarjunappa Biradar', 'Shivanna Marigoudar',
    'Channaveerappa Doddamani', 'Rudresh Gowda', 'Eshwarappa Talawar', 'Manjunath Reddy',
    'Parameshwarappa Kuruba', 'Mahadevappa Hugar', 'Kallappa Hosamani', 'Veerabhadraiah S.',
    'Kotreshappa Angadi', 'Devendrappa Nayak', 'Sharanappa Badiger', 'Gurupadappa K.',
    'Prakash Patil', 'Somashekarappa', 'Chandrappa Meti', 'Jagadeesh Gouda',
    'Siddappa Kamatar', 'Giriyappa Dasara', 'Neelakanthappa', 'Bhimappa Barki',
    'Basalingappa', 'Yallappa Madar', 'Rangappa Pujari', 'Hanumanthappa Kori',
    'Gangadharappa', 'Anandappa K.'
  ];

  const createdFarmers = [];

  for (let i = 0; i < farmerNames.length; i++) {
    const name = farmerNames[i];
    const isPrimaryDemoFarmer = i === 0;
    const phone = isPrimaryDemoFarmer ? '9876543210' : `9845${String(100000 + i)}`;
    const email = isPrimaryDemoFarmer ? 'farmer@agromaya.in' : `farmer${i + 1}@agromaya.in`;
    const village = villages[i % villages.length];

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        role: 'FARMER',
        name,
        phone,
      },
    });

    const farmer = await prisma.farmer.create({
      data: {
        userId: user.id,
        fullName: name,
        phone,
        district: 'Davangere',
        villageId: village.id,
        panchayatId: village.panchayatId,
        surveyNumber: `${120 + (i % 25)}/${(i % 4) + 1}`,
        totalLandAcres: parseFloat((2.5 + (i * 0.35) % 4.5).toFixed(1)),
        registrationStatus: 'VERIFIED',
        bankAccountRef: `SBIN0040${100 + i}45`,
        preferredLang: i % 2 === 0 ? 'en' : 'kn',
        wallet: {
          create: {
            availableCredits: isPrimaryDemoFarmer ? 4850.0 : Math.round(1500 + (i * 240) % 5000),
            totalEarnedCredits: isPrimaryDemoFarmer ? 8200.0 : Math.round(2500 + (i * 350) % 8000),
            totalSpentCredits: isPrimaryDemoFarmer ? 3350.0 : Math.round(1000 + (i * 120) % 3000),
            totalCashReceived: isPrimaryDemoFarmer ? 3200.0 : Math.round(1000 + (i * 200) % 4000),
            pendingCash: 0.0,
          },
        },
      },
      include: { wallet: true },
    });

    createdFarmers.push(farmer);

    // Enroll Consented Biometric Template for primary farmer and first 10 farmers
    if (i < 10) {
      const vector = generateBiometricVector(name + phone);
      const vectorJson = JSON.stringify(vector);
      const templateHash = crypto.createHash('sha256').update(vectorJson).digest('hex');

      await prisma.biometricEnrollment.create({
        data: {
          farmerId: farmer.id,
          biometricVectorJson: vectorJson,
          biometricTemplateHash: templateHash,
          consentGiven: true,
          consentLanguage: i % 2 === 0 ? 'en' : 'kn',
          status: 'ENROLLED',
          qualityScore: parseFloat((88.0 + (i % 8) * 1.2).toFixed(1)),
          enrolledBy: 'SYSTEM_VERIFIED_OPERATOR',
        },
      });
    }

    // Create Initial Wallet Transactions for demo farmer
    if (isPrimaryDemoFarmer && farmer.wallet) {
      await prisma.creditTransaction.createMany({
        data: [
          {
            walletId: farmer.wallet.id,
            farmerId: farmer.id,
            type: 'CREDIT_EARNED',
            amount: 5200.0,
            description: 'Verified 2,600 kg Paddy Straw delivered to Harihara APMC Center #1',
            referenceId: 'COL-2026-001',
            balanceAfter: 5200.0,
            createdAt: new Date(Date.now() - 15 * 86400000),
          },
          {
            walletId: farmer.wallet.id,
            farmerId: farmer.id,
            type: 'CREDIT_SPENT',
            amount: 3350.0,
            description: 'Marketplace Purchase: 2x Biochar Soil Conditioner + 1x NPK Bio-Fertilizer',
            referenceId: 'ORD-2026-101',
            balanceAfter: 1850.0,
            createdAt: new Date(Date.now() - 10 * 86400000),
          },
          {
            walletId: farmer.wallet.id,
            farmerId: farmer.id,
            type: 'CREDIT_EARNED',
            amount: 3000.0,
            description: 'Verified 1,500 kg Maize Stover collection bonus',
            referenceId: 'COL-2026-004',
            balanceAfter: 4850.0,
            createdAt: new Date(Date.now() - 3 * 86400000),
          },
        ],
      });

      await prisma.cashPayment.create({
        data: {
          walletId: farmer.wallet.id,
          farmerId: farmer.id,
          amount: 3200.0,
          paymentMethod: 'DIRECT_BANK_TRANSFER',
          transactionRef: 'NEFT-KA-SBI-98234812',
          status: 'PROCESSED',
          disbursedAt: new Date(Date.now() - 3 * 86400000),
        },
      });
    }
  }

  // 7. Create Agricultural Field Polygons around Davangere / Harihara
  const crops = ['Paddy', 'Maize', 'Sugarcane', 'Cotton'];
  const baseLat = 14.485;
  const baseLng = 75.835;
  const createdFields = [];

  for (let i = 0; i < 40; i++) {
    const fieldCode = `KA-DVG-${String(101 + i).padStart(3, '0')}`;
    const farmer = createdFarmers[i % createdFarmers.length];
    const cropType = crops[i % crops.length];
    const areaAcres = parseFloat((1.8 + ((i * 1.3) % 4.2)).toFixed(1));

    let status = 'GROWING';
    let readinessPct = 42.0;
    let harvestWindow = 'In 25+ Days';

    if (i < 15) {
      status = 'HARVEST_READY';
      readinessPct = parseFloat((86.0 + (i % 10) * 1.1).toFixed(1));
      harvestWindow = 'Immediate - Next 5 Days';
    } else if (i < 28) {
      status = 'HARVEST_APPROACHING';
      readinessPct = parseFloat((68.0 + (i % 12) * 1.3).toFixed(1));
      harvestWindow = 'In 7 - 14 Days';
    } else if (i < 36) {
      status = 'GROWING';
      readinessPct = parseFloat((35.0 + (i % 15) * 1.4).toFixed(1));
      harvestWindow = 'In 25+ Days';
    } else {
      status = 'COLLECTED';
      readinessPct = 100.0;
      harvestWindow = 'Residue Baled & Transferred';
    }

    const residueRatio = cropType === 'Paddy' ? 1.5 : cropType === 'Maize' ? 1.8 : 0.18;
    const yieldAcre = cropType === 'Paddy' ? 2.5 : cropType === 'Maize' ? 3.0 : 35.0;
    const estimatedResidueTonnes = parseFloat((areaAcres * yieldAcre * residueRatio).toFixed(2));

    // Realistic field boundary vertices
    const row = Math.floor(i / 6);
    const col = i % 6;
    const centerLat = baseLat + row * 0.012 + (col % 2) * 0.003 - 0.035;
    const centerLng = baseLng + col * 0.014 + (row % 2) * 0.002 - 0.04;
    const span = 0.0035;

    const polygonCoordinates = [
      [centerLat - span, centerLng - span],
      [centerLat - span + 0.001, centerLng + span],
      [centerLat + span, centerLng + span - 0.0005],
      [centerLat + span - 0.0005, centerLng - span + 0.001],
    ];

    const field = await prisma.agriculturalField.create({
      data: {
        fieldCode,
        farmerId: farmer.id,
        villageId: farmer.villageId,
        panchayatId: farmer.panchayatId,
        surveyNumber: `${farmer.surveyNumber}-P${(i % 3) + 1}`,
        cropType,
        areaAcres,
        status,
        harvestReadinessPct: readinessPct,
        estimatedResidueTonnes,
        harvestWindow,
        centerLat,
        centerLng,
        polygonCoordinatesJson: JSON.stringify(polygonCoordinates),
      },
    });

    createdFields.push(field);

    // Create Initial Sentinel-2 Observations
    const ndviVal = status === 'HARVEST_READY' ? 0.34 : status === 'HARVEST_APPROACHING' ? 0.52 : 0.78;
    await prisma.satelliteObservation.create({
      data: {
        fieldId: field.id,
        satelliteSource: 'Copernicus Sentinel-2 MSI L2A',
        acquisitionDate: new Date(Date.now() - (i % 5) * 86400000),
        ndvi: ndviVal,
        ndwi: status === 'HARVEST_READY' ? 0.14 : 0.32,
        evi: parseFloat((ndviVal * 0.85).toFixed(3)),
        cloudCoverPct: parseFloat((1.5 + (i % 6) * 1.2).toFixed(1)),
      },
    });
  }

  // 8. Create Product Categories & Marketplace Catalog linked to Suppliers
  const catFertilizers = await prisma.productCategory.create({
    data: { name: 'Fertilizers & Biofertilizers', description: 'Certified organic NPK blends and microbial boosters' },
  });
  const catBiochar = await prisma.productCategory.create({
    data: { name: 'Enriched Biochar & Soil Conditioners', description: 'Pyrolyzed agricultural residue biochar' },
  });
  const catEarthworms = await prisma.productCategory.create({
    data: { name: 'Vermiculture & Earthworms', description: 'Live composting earthworm colonies' },
  });
  const catSeeds = await prisma.productCategory.create({
    data: { name: 'Certified High-Yield Seeds', description: 'Drought-tolerant certified seed strains' },
  });
  const catTools = await prisma.productCategory.create({
    data: { name: 'Residue Management Tools', description: 'Straw choppers, baler knives and sprayers' },
  });

  const productsData = [
    {
      categoryId: catBiochar.id,
      supplierId: supplierUser1.supplierProfile!.id,
      name: 'AgroMaya Ultra-Pure Biochar (25kg Bag)',
      description: 'Activated horticultural-grade biochar pyrolyzed at 650°C from verified paddy straw.',
      priceInInr: 850.0,
      creditPrice: 850.0,
      stockQuantity: 250,
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
    },
    {
      categoryId: catBiochar.id,
      supplierId: supplierUser1.supplierProfile!.id,
      name: 'Granulated Biochar NPK Blend (50kg)',
      description: 'Pre-inoculated carbon-rich biochar pellets fortified with nitrogen, phosphorus, and potassium.',
      priceInInr: 1450.0,
      creditPrice: 1450.0,
      stockQuantity: 120,
      imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
    },
    {
      categoryId: catFertilizers.id,
      supplierId: supplierUser2.supplierProfile!.id,
      name: 'Microbial Compost Booster (10kg)',
      description: 'Rapid decomposition bio-culture with Trichoderma and Pseudomonas.',
      priceInInr: 450.0,
      creditPrice: 450.0,
      stockQuantity: 95,
      imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80',
      isFeatured: false,
    },
    {
      categoryId: catFertilizers.id,
      supplierId: supplierUser2.supplierProfile!.id,
      name: 'Liquid Bio-Humus Extract (5 Liters)',
      description: 'Concentrated liquid humic acid with bio-stimulants for foliar spray.',
      priceInInr: 680.0,
      creditPrice: 680.0,
      stockQuantity: 140,
      imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
      isFeatured: false,
    },
    {
      categoryId: catEarthworms.id,
      supplierId: supplierUser1.supplierProfile!.id,
      name: 'African Nightcrawler Vermiculture Bed (1kg Starter Kit)',
      description: 'Live Eisenia Fetida earthworms complete with coco-peat bedding medium and breeding guide.',
      priceInInr: 550.0,
      creditPrice: 550.0,
      stockQuantity: 75,
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
    },
    {
      categoryId: catSeeds.id,
      supplierId: supplierUser2.supplierProfile!.id,
      name: 'BPT-5204 Samba Mahsuri Certified Paddy Seeds (10kg)',
      description: 'High-tillering, pest-resistant paddy seeds ideal for Tungabhadra basin canal command area.',
      priceInInr: 820.0,
      creditPrice: 820.0,
      stockQuantity: 210,
      imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
      isFeatured: false,
    },
    {
      categoryId: catSeeds.id,
      supplierId: supplierUser2.supplierProfile!.id,
      name: 'Pioneer P3396 Hybrid Maize Seeds (4kg)',
      description: 'Sturdy-stalked, high-yield drought-tolerant grain maize with excellent biomass production.',
      priceInInr: 1250.0,
      creditPrice: 1250.0,
      stockQuantity: 150,
      imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
      isFeatured: false,
    },
    {
      categoryId: catTools.id,
      supplierId: supplierUser1.supplierProfile!.id,
      name: 'Residue Straw Chopper Serrated Blades (Set of 6)',
      description: 'Hardened tungsten alloy blades designed for tractor-mounted combine straw choppers.',
      priceInInr: 2200.0,
      creditPrice: 2200.0,
      stockQuantity: 40,
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        companyId: companyUser1.companyProfile!.id,
        ...p,
      },
    });
    createdProducts.push(prod);
  }

  // 9. Create Sample Feedstock Requests
  const directField = createdFields[0]; // KA-DVG-101
  const req1 = await prisma.feedstockRequest.create({
    data: {
      requestNumber: 'REQ-2026-081',
      companyId: companyUser1.companyProfile!.id,
      farmerId: directField.farmerId,
      panchayatId: directField.panchayatId,
      fieldId: directField.id,
      requestMethod: 'DIRECT_FARMER',
      cropType: directField.cropType,
      requestedTonnes: directField.estimatedResidueTonnes,
      offeredRewardPerKg: 2.0,
      status: 'PENDING',
      notes: 'Copernicus Sentinel-2 indicates 94% harvest readiness. Ready for collection within 48 hours.',
    },
  });

  const scheduledField = createdFields[1]; // KA-DVG-102
  const req2 = await prisma.feedstockRequest.create({
    data: {
      requestNumber: 'REQ-2026-082',
      companyId: companyUser1.companyProfile!.id,
      farmerId: scheduledField.farmerId,
      panchayatId: scheduledField.panchayatId,
      fieldId: scheduledField.id,
      requestMethod: 'DIRECT_FARMER',
      cropType: scheduledField.cropType,
      requestedTonnes: scheduledField.estimatedResidueTonnes,
      offeredRewardPerKg: 2.0,
      status: 'SCHEDULED',
      scheduledDate: new Date(Date.now() + 86400000 * 2),
      notes: 'Panchayat collection centre pickup arranged with tractor trolley.',
      schedule: {
        create: {
          collectionDate: new Date(Date.now() + 86400000 * 2),
          collectionCenter: 'Harihara APMC Collection Yard #1',
          transportStatus: 'SCHEDULED',
          vehicleNumber: 'KA-17-EA-4912',
          driverContact: '+91 98801 11223',
        },
      },
    },
  });

  // 10. Create Sample Feedstock Collections (One verified, one pending for face verification demo)
  const collectedField = createdFields[36]; // Collected field
  const col1 = await prisma.feedstockCollection.create({
    data: {
      collectionNumber: 'COL-2026-018',
      requestId: req2.id,
      fieldId: collectedField.id,
      farmerId: createdFarmers[0].id,
      collectionDate: new Date(Date.now() - 86400000 * 2),
      actualWeightKg: 4200.0,
      residueCategory: 'Paddy Straw',
      qualityGrade: 'A',
      moisturePct: 11.8,
      collectionLocation: 'Harihara APMC Collection Yard #1',
      weighbridgeSlipUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      deliveryPhotoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
      verificationMethod: 'BIOMETRIC_FACE',
      status: 'PENDING_VERIFICATION',
    },
  });

  // 11. Create Sample Completed Order with Supplier Payable and Shipment
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-8801',
      farmerId: createdFarmers[0].id,
      totalAmountCredits: 2300.0,
      totalAmountInr: 2300.0,
      status: 'COMPANY_PAID',
      deliveryAddress: 'Ningappa Pujar, Survey 120/1, Kondajji Village, Harihara, Karnataka',
      orderedAt: new Date(Date.now() - 86400000 * 4),
      items: {
        create: [
          {
            productId: createdProducts[0].id, // Ultra-Pure Biochar
            quantity: 1,
            unitCreditPrice: 850.0,
            subtotalCredits: 850.0,
          },
          {
            productId: createdProducts[1].id, // Granulated Biochar NPK
            quantity: 1,
            unitCreditPrice: 1450.0,
            subtotalCredits: 1450.0,
          },
        ],
      },
    },
  });

  const samplePayable = await prisma.supplierPayable.create({
    data: {
      orderId: sampleOrder.id,
      supplierId: supplierUser1.supplierProfile!.id,
      companyId: companyUser1.companyProfile!.id,
      payableAmountInr: 2300.0,
      creditsRedeemed: 2300.0,
      status: 'PAID',
      payments: {
        create: {
          paymentGateway: 'RAZORPAY_SANDBOX',
          paymentReference: 'pay_rzp_live_8912410',
          amountPaid: 2300.0,
          currency: 'INR',
          status: 'SUCCESS',
        },
      },
    },
  });

  await prisma.shipment.create({
    data: {
      orderId: sampleOrder.id,
      supplierId: supplierUser1.supplierProfile!.id,
      carrierName: 'VRL Logistics Karnataka',
      trackingNumber: 'VRL-KA-881920',
      dispatchDate: new Date(Date.now() - 86400000 * 2),
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 1),
      status: 'IN_TRANSIT',
      trackingNotes: 'Package in transit via Davangere central transport hub.',
    },
  });

  // 12. Create Core Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientRole: 'BIOCHAR_COMPANY',
        title: 'New Feedstock Batch Awaiting Verification',
        message: 'Batch COL-2026-018 (4,200 kg of Paddy Straw) received from Ningappa Pujar at Harihara APMC Collection Yard #1.',
        type: 'INFO',
        actionUrl: '/company/verification',
      },
      {
        recipientRole: 'GRAM_PANCHAYAT',
        title: 'Collection Route Scheduled',
        message: 'Tractor KA-17-EA-4912 scheduled for Kondajji village collection on Friday.',
        type: 'INFO',
        actionUrl: '/panchayat/scheduling',
      },
      {
        recipientRole: 'SUPPLIER',
        recipientId: supplierUser1.id,
        title: 'Payment Confirmed by Biochar Company! 💰',
        message: 'Payment of ₹2,300 for Order #ORD-2026-8801 confirmed via Razorpay Sandbox. Ready for dispatch.',
        type: 'SUCCESS',
        actionUrl: '/supplier/orders',
      },
      {
        recipientRole: 'FARMER',
        recipientId: createdFarmers[0].userId,
        title: 'Welcome to AGROMAYA Biochar Connect 🌾',
        message: 'Your field KA-DVG-101 has been mapped to Sentinel-2 satellite monitoring. You have 4,850 available credits.',
        type: 'SUCCESS',
        actionUrl: '/farmer/my-farm',
      },
    ],
  });

  console.log('✅ AGROMAYA Seed completed successfully:');
  console.log(`   - Biochar Companies: 2`);
  console.log(`   - Certified Suppliers: 2 (${supplierUser1.supplierProfile!.supplierName})`);
  console.log(`   - Panchayats: 2 with 4 Collection Centers`);
  console.log(`   - Villages: ${villages.length}`);
  console.log(`   - Registered Farmers: ${createdFarmers.length} (with biometric enrollment & wallets)`);
  console.log(`   - Agricultural Fields: ${createdFields.length} with real GeoJSON boundaries`);
  console.log(`   - Marketplace Products: ${createdProducts.length}`);
  console.log(`   - Feedstock Requests & Collections: Seeded with live batch`);
  console.log(`   - Connected B2B Orders, Payables & Shipments: Initialized`);
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
