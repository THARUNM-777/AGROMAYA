import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/farmers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { panchayatId, villageId, search } = req.query;
    const where: any = {};

    if (panchayatId) where.panchayatId = String(panchayatId);
    if (villageId) where.villageId = String(villageId);
    if (search) {
      const q = String(search);
      where.OR = [
        { fullName: { contains: q } },
        { phone: { contains: q } },
        { surveyNumber: { contains: q } },
      ];
    }

    const farmers = await prisma.farmer.findMany({
      where,
      include: {
        village: true,
        panchayat: true,
        fields: true,
        wallet: true,
        biometricEnrollment: {
          select: { status: true, qualityScore: true, consentTimestamp: true, biometricTemplateHash: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: farmers.length, farmers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/farmers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        village: true,
        panchayat: true,
        fields: {
          include: {
            satelliteObservations: { orderBy: { acquisitionDate: 'desc' }, take: 5 },
          },
        },
        biometricEnrollment: true,
        wallet: {
          include: {
            transactions: { orderBy: { createdAt: 'desc' }, take: 15 },
            cashPayments: { orderBy: { disbursedAt: 'desc' }, take: 10 },
          },
        },
        requests: {
          include: { company: true },
          orderBy: { createdAt: 'desc' },
        },
        collections: {
          orderBy: { collectionDate: 'desc' },
          include: { verification: true },
        },
        orders: {
          orderBy: { orderedAt: 'desc' },
          include: { items: { include: { product: true } }, payables: true, shipments: true },
        },
      },
    });

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    return res.json({ success: true, farmer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/farmers - Register farmer with optional biometric enrollment & farm boundary
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      fullName,
      phone,
      villageId,
      panchayatId,
      surveyNumber,
      totalLandAcres,
      preferredLang = 'en',
      district = 'Davangere',
      cropType = 'Paddy',
      polygonCoordinates,
      biometricImageBase64,
      biometricConsentGiven,
    } = req.body;

    if (!fullName || !phone || !villageId || !panchayatId) {
      return res.status(400).json({ success: false, message: 'Missing required farmer details (name, phone, village, panchayat)' });
    }

    // Check duplicate phone
    const existingFarmer = await prisma.farmer.findUnique({ where: { phone } });
    if (existingFarmer) {
      return res.status(400).json({ success: false, message: `Farmer with mobile number ${phone} is already registered.` });
    }

    // Create user account for farmer
    const defaultPasswordHash = '$2b$10$7v.Y4uG1BvO8a4zHk6kS5.aU/Jb93bLffqYQ0zO7lU1p1VlKsqp8u'; // Agromaya@2026
    const user = await prisma.user.create({
      data: {
        email: `farmer.${phone.replace(/[^0-9]/g, '')}@agromaya.in`,
        passwordHash: defaultPasswordHash,
        role: 'FARMER',
        name: fullName,
        phone,
      },
    });

    const landAcres = parseFloat(String(totalLandAcres)) || 2.5;

    const farmer = await prisma.farmer.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        district,
        villageId,
        panchayatId,
        surveyNumber: surveyNumber || `SY-${Math.floor(100 + Math.random() * 900)}`,
        totalLandAcres: landAcres,
        registrationStatus: 'VERIFIED',
        preferredLang,
        wallet: {
          create: {
            availableCredits: 0.0,
            totalEarnedCredits: 0.0,
            totalSpentCredits: 0.0,
            totalCashReceived: 0.0,
          },
        },
      },
      include: { wallet: true, village: true, panchayat: true },
    });

    // 1. If polygonCoordinates are provided, create the initial agricultural field
    let createdField = null;
    if (polygonCoordinates && Array.isArray(polygonCoordinates) && polygonCoordinates.length >= 3) {
      const lats = polygonCoordinates.map((c: any) => c[0]);
      const lngs = polygonCoordinates.map((c: any) => c[1]);
      const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;

      const fieldCount = await prisma.agriculturalField.count();
      const fieldCode = `KA-DVG-${String(fieldCount + 101).padStart(3, '0')}`;
      const estimatedResidue = parseFloat((landAcres * 2.5 * 1.5).toFixed(2));

      createdField = await prisma.agriculturalField.create({
        data: {
          fieldCode,
          farmerId: farmer.id,
          villageId,
          panchayatId,
          surveyNumber: farmer.surveyNumber,
          cropType,
          areaAcres: landAcres,
          status: 'GROWING',
          harvestReadinessPct: 40.0,
          estimatedResidueTonnes: estimatedResidue,
          harvestWindow: 'In 25+ Days',
          centerLat,
          centerLng,
          polygonCoordinatesJson: JSON.stringify(polygonCoordinates),
        },
      });
    }

    // 2. If Biometric Consent & Face Image provided, enroll biometric template
    let biometricResult = null;
    if (biometricConsentGiven && biometricImageBase64) {
      try {
        const pyRes = await fetch(`${AI_SERVICE_URL}/api/biometrics/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_id: farmer.id,
            consent_given: true,
            consent_language: preferredLang,
            image_base64: biometricImageBase64,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (pyRes.ok) {
          const aiData = (await pyRes.json()) as any;
          if (aiData.success) {
            const vectorJson = JSON.stringify(aiData.embedding_vector);
            const templateHash = crypto.createHash('sha256').update(vectorJson).digest('hex');

            const enrollment = await prisma.biometricEnrollment.create({
              data: {
                farmerId: farmer.id,
                biometricVectorJson: vectorJson,
                biometricTemplateHash: templateHash,
                consentGiven: true,
                consentLanguage: preferredLang,
                status: 'ENROLLED',
                qualityScore: aiData.quality_score || 90.0,
                enrolledBy: req.user?.userId,
              },
            });

            biometricResult = {
              status: 'ENROLLED',
              qualityScore: enrollment.qualityScore,
              templateHash: enrollment.biometricTemplateHash,
            };
          }
        }
      } catch (bioErr) {
        console.warn('Biometric auto-enrollment error on farmer creation:', bioErr);
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.userId,
        actorRole: req.user?.role || 'GRAM_PANCHAYAT',
        action: 'FARMER_REGISTERED',
        entityName: 'Farmer',
        entityId: farmer.id,
        detailsJson: JSON.stringify({
          fullName,
          phone,
          surveyNumber: farmer.surveyNumber,
          hasBiometrics: Boolean(biometricResult),
          hasField: Boolean(createdField),
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      farmer,
      field: createdField,
      biometrics: biometricResult,
    });
  } catch (error: any) {
    console.error('Farmer registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
