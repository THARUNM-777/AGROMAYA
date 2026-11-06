import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/panchayats
router.get('/', async (_req: Request, res: Response) => {
  try {
    const panchayats = await prisma.panchayat.findMany({
      include: {
        villages: true,
        _count: {
          select: {
            farmers: true,
            fields: true,
            requests: true,
          },
        },
      },
    });

    return res.json({ success: true, panchayats });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/panchayats/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const panchayat = await prisma.panchayat.findUnique({
      where: { id },
      include: {
        villages: {
          include: {
            _count: {
              select: { farmers: true, fields: true },
            },
          },
        },
      },
    });

    if (!panchayat) {
      return res.status(404).json({ success: false, message: 'Panchayat not found' });
    }

    return res.json({ success: true, panchayat });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/panchayats/:id/stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const totalFarmers = await prisma.farmer.count({ where: { panchayatId: id } });
    const totalFields = await prisma.agriculturalField.count({ where: { panchayatId: id } });
    const harvestReadyFields = await prisma.agriculturalField.count({
      where: { panchayatId: id, status: 'HARVEST_READY' },
    });
    const pendingRequests = await prisma.feedstockRequest.count({
      where: { panchayatId: id, status: 'PENDING' },
    });
    const scheduledCollections = await prisma.feedstockRequest.count({
      where: { panchayatId: id, status: 'SCHEDULED' },
    });
    const completedCollections = await prisma.feedstockCollection.count({
      where: { field: { panchayatId: id }, status: 'VERIFIED' },
    });

    const harvestReadyFieldsData = await prisma.agriculturalField.findMany({
      where: { panchayatId: id, status: 'HARVEST_READY' },
      select: { estimatedResidueTonnes: true },
    });
    const totalResidueAvailable = harvestReadyFieldsData.reduce((acc, curr) => acc + curr.estimatedResidueTonnes, 0);

    return res.json({
      success: true,
      stats: {
        totalFarmers,
        totalFields,
        harvestReadyFields,
        totalResidueAvailable: parseFloat(totalResidueAvailable.toFixed(1)),
        pendingRequests,
        scheduledCollections,
        completedCollections,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
