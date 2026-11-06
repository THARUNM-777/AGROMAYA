import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/requests - List requests with role filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, farmerId, companyId, panchayatId, status } = req.query;
    const where: any = {};

    if (status) where.status = String(status);

    // Apply role-based constraints if user is authenticated
    if (req.user?.role === 'FARMER' && req.user.farmerId) {
      where.farmerId = req.user.farmerId;
    } else if (req.user?.role === 'BIOCHAR_COMPANY' && req.user.companyId) {
      where.companyId = req.user.companyId;
    } else if (req.user?.role === 'GRAM_PANCHAYAT' && req.user.panchayatId) {
      where.panchayatId = req.user.panchayatId;
    } else {
      if (farmerId) where.farmerId = String(farmerId);
      if (companyId) where.companyId = String(companyId);
      if (panchayatId) where.panchayatId = String(panchayatId);
    }

    const requests = await prisma.feedstockRequest.findMany({
      where,
      include: {
        company: true,
        farmer: {
          include: { village: true },
        },
        panchayat: true,
        field: true,
        schedule: true,
        collections: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: requests.length, requests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/requests/direct - Method 1: Direct Request to Registered Farmer
router.post('/direct', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fieldId, offeredRewardPerKg, notes } = req.body;

    const field = await prisma.agriculturalField.findUnique({
      where: { id: fieldId },
      include: { farmer: true, panchayat: true },
    });

    if (!field) {
      return res.status(404).json({ success: false, message: 'Agricultural field not found' });
    }

    // Determine companyId
    let companyId = req.user?.companyId;
    if (!companyId) {
      const defaultCompany = await prisma.biocharCompany.findFirst();
      companyId = defaultCompany?.id;
    }

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Valid Biochar Company required' });
    }

    const reqCount = await prisma.feedstockRequest.count();
    const requestNumber = `REQ-2026-${String(reqCount + 83).padStart(3, '0')}`;

    const request = await prisma.feedstockRequest.create({
      data: {
        requestNumber,
        companyId,
        farmerId: field.farmerId,
        panchayatId: field.panchayatId,
        fieldId: field.id,
        requestMethod: 'DIRECT_FARMER',
        cropType: field.cropType,
        requestedTonnes: field.estimatedResidueTonnes,
        offeredRewardPerKg: offeredRewardPerKg ? parseFloat(offeredRewardPerKg) : 2.0,
        status: 'PENDING',
        notes: notes || `Direct feedstock collection offer for field ${field.fieldCode} (${field.cropType}).`,
      },
      include: {
        farmer: true,
        company: true,
        field: true,
        panchayat: true,
      },
    });

    // Notify Farmer
    if (field.farmer) {
      await prisma.notification.create({
        data: {
          recipientRole: 'FARMER',
          recipientId: field.farmer.userId,
          title: 'New Feedstock Collection Offer!',
          message: `${request.company.companyName} offered ₹${request.offeredRewardPerKg}/kg for ${request.requestedTonnes} tonnes of ${field.cropType} residue.`,
          type: 'SUCCESS',
          actionUrl: '/farmer/requests',
        },
      });
    }

    // Notify Panchayat
    await prisma.notification.create({
      data: {
        recipientRole: 'GRAM_PANCHAYAT',
        title: 'New Direct Farmer Collection Request',
        message: `${request.company.companyName} requested ${request.requestedTonnes} tonnes from Field ${field.fieldCode} in ${field.panchayat.name}.`,
        type: 'INFO',
        actionUrl: '/panchayat/requests',
      },
    });

    return res.status(201).json({ success: true, request });
  } catch (error: any) {
    console.error('Direct request error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/requests/bulk - Method 2: Large-Scale Feedstock Discovery Bulk Request
router.post('/bulk', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fieldIds, panchayatId, offeredRewardPerKg, notes } = req.body;

    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one field' });
    }

    const fields = await prisma.agriculturalField.findMany({
      where: { id: { in: fieldIds } },
      include: { farmer: true, village: true, panchayat: true },
    });

    if (fields.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid fields found' });
    }

    const targetPanchayatId = panchayatId || fields[0].panchayatId;
    const totalTonnes = fields.reduce((acc, f) => acc + f.estimatedResidueTonnes, 0);
    const primaryCrop = fields[0].cropType;

    let companyId = req.user?.companyId;
    if (!companyId) {
      const defaultCompany = await prisma.biocharCompany.findFirst();
      companyId = defaultCompany?.id;
    }

    const bulkCount = await prisma.feedstockRequest.count({ where: { requestMethod: 'BULK_DISCOVERY' } });
    const requestNumber = `BULK-2026-${String(bulkCount + 10).padStart(3, '0')}`;

    const request = await prisma.feedstockRequest.create({
      data: {
        requestNumber,
        companyId: companyId!,
        panchayatId: targetPanchayatId,
        requestMethod: 'BULK_DISCOVERY',
        cropType: primaryCrop,
        requestedTonnes: parseFloat(totalTonnes.toFixed(2)),
        offeredRewardPerKg: offeredRewardPerKg ? parseFloat(offeredRewardPerKg) : 2.0,
        status: 'PENDING',
        notes: notes || `Bulk Feedstock Discovery cluster: ${fields.length} agricultural fields selected with ~${totalTonnes.toFixed(1)} tonnes potential residue.`,
      },
      include: {
        company: true,
        panchayat: true,
      },
    });

    // Notify Gram Panchayat
    await prisma.notification.create({
      data: {
        recipientRole: 'GRAM_PANCHAYAT',
        title: 'Bulk Residue Discovery Request Received!',
        message: `${request.company.companyName} dispatched bulk procurement for ${fields.length} fields (${totalTonnes.toFixed(1)} tonnes). Please identify landowners and coordinate collection.`,
        type: 'HARVEST',
        actionUrl: '/panchayat/requests',
      },
    });

    return res.status(201).json({
      success: true,
      request,
      clusterDetails: {
        selectedFieldsCount: fields.length,
        totalTonnes: parseFloat(totalTonnes.toFixed(2)),
        villages: Array.from(new Set(fields.map((f) => f.village.name))),
      },
    });
  } catch (error: any) {
    console.error('Bulk request error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/requests/:id/farmer-response - Farmer accepts or rejects
router.patch('/:id/farmer-response', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { action } = req.body; // "ACCEPT" | "REJECT"

    const request: any = await prisma.feedstockRequest.findUnique({
      where: { id },
      include: { company: true, farmer: true, panchayat: true, field: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updated = await prisma.feedstockRequest.update({
      where: { id },
      data: { status: newStatus },
      include: { company: true, farmer: true, panchayat: true, field: true },
    });

    // Notify Company
    await prisma.notification.create({
      data: {
        recipientRole: 'BIOCHAR_COMPANY',
        title: `Farmer ${newStatus === 'ACCEPTED' ? 'Accepted' : 'Declined'} Feedstock Request!`,
        message: `Farmer ${request.farmer?.fullName || 'Farmer'} has ${newStatus.toLowerCase()} request ${request.requestNumber} for ${request.requestedTonnes} tonnes.`,
        type: newStatus === 'ACCEPTED' ? 'SUCCESS' : 'WARNING',
        actionUrl: '/company/requests',
      },
    });

    // Notify Panchayat
    if (newStatus === 'ACCEPTED') {
      await prisma.notification.create({
        data: {
          recipientRole: 'GRAM_PANCHAYAT',
          title: 'Farmer Agreed to Feedstock Collection',
          message: `${request.farmer?.fullName} confirmed collection for request ${request.requestNumber}. Ready for transport scheduling.`,
          type: 'INFO',
          actionUrl: '/panchayat/scheduling',
        },
      });
    }

    return res.json({ success: true, request: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/requests/:id/schedule - Gram Panchayat schedules collection
router.post('/:id/schedule', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { collectionDate, collectionCenter, vehicleNumber, driverContact } = req.body;

    const request: any = await prisma.feedstockRequest.findUnique({
      where: { id },
      include: { company: true, farmer: true, panchayat: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const schedule = await prisma.collectionSchedule.upsert({
      where: { requestId: id },
      create: {
        requestId: id,
        collectionDate: new Date(collectionDate || Date.now() + 86400000),
        collectionCenter: collectionCenter || 'Gram Panchayat Collection Yard #1',
        transportStatus: 'SCHEDULED',
        vehicleNumber: vehicleNumber || 'KA-17-TR-8819',
        driverContact: driverContact || '+91 94481 00223',
      },
      update: {
        collectionDate: new Date(collectionDate || Date.now() + 86400000),
        collectionCenter: collectionCenter || 'Gram Panchayat Collection Yard #1',
        transportStatus: 'SCHEDULED',
        vehicleNumber: vehicleNumber || 'KA-17-TR-8819',
        driverContact: driverContact || '+91 94481 00223',
      },
    });

    const updated = await prisma.feedstockRequest.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledDate: new Date(collectionDate || Date.now() + 86400000),
      },
      include: { schedule: true, company: true, farmer: true },
    });

    // Notify Farmer & Company
    if (request.farmer) {
      await prisma.notification.create({
        data: {
          recipientRole: 'FARMER',
          recipientId: request.farmer.userId,
          title: 'Collection Scheduled!',
          message: `Your agricultural waste pickup is scheduled for ${new Date(schedule.collectionDate).toLocaleDateString()} at ${schedule.collectionCenter}.`,
          type: 'INFO',
          actionUrl: '/farmer/collection',
        },
      });
    }

    await prisma.notification.create({
      data: {
        recipientRole: 'BIOCHAR_COMPANY',
        title: 'Panchayat Scheduled Feedstock Transport',
        message: `Collection scheduled for ${request.requestNumber} on ${new Date(schedule.collectionDate).toLocaleDateString()} with vehicle ${schedule.vehicleNumber}.`,
        type: 'INFO',
        actionUrl: '/company/collection',
      },
    });

    return res.json({ success: true, request: updated, schedule });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
