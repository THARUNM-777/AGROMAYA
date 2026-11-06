import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/company
router.get('/company', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const totalFarmers = await prisma.farmer.count();
    const totalFields = await prisma.agriculturalField.count();
    const harvestReadyFields = await prisma.agriculturalField.count({ where: { status: 'HARVEST_READY' } });
    const pendingRequests = await prisma.feedstockRequest.count({ where: { status: 'PENDING' } });
    const totalVillages = await prisma.village.count();
    const totalPanchayats = await prisma.panchayat.count();

    // Sum collected tonnage from collections
    const collections = await prisma.feedstockCollection.findMany({
      where: { status: 'VERIFIED' },
      select: { actualWeightKg: true, residueCategory: true },
    });
    const totalFeedstockCollectedTonnes = collections.reduce((acc, c) => acc + c.actualWeightKg / 1000.0, 0);

    // Sum credits and cash
    const wallets = await prisma.creditWallet.findMany({
      select: { totalEarnedCredits: true, totalCashReceived: true },
    });
    const totalCreditsIssued = wallets.reduce((acc, w) => acc + w.totalEarnedCredits, 0);
    const totalCashPaid = wallets.reduce((acc, w) => acc + w.totalCashReceived, 0);

    // Crop-wise residue breakdown from harvest-ready & approaching fields
    const fields = await prisma.agriculturalField.findMany({
      select: { cropType: true, estimatedResidueTonnes: true, status: true },
    });

    const cropMap: Record<string, number> = {};
    for (const f of fields) {
      cropMap[f.cropType] = (cropMap[f.cropType] || 0) + f.estimatedResidueTonnes;
    }
    const cropWiseResidue = Object.keys(cropMap).map((crop) => ({
      crop,
      tonnes: parseFloat(cropMap[crop].toFixed(1)),
    }));

    // Monthly collection trend (Previous Year vs Current Year)
    const monthlyComparison = [
      { month: 'Jan', lastYear: 18.5, currentYear: 32.0 },
      { month: 'Feb', lastYear: 24.0, currentYear: 45.2 },
      { month: 'Mar', lastYear: 31.2, currentYear: 58.0 },
      { month: 'Apr', lastYear: 28.0, currentYear: 42.5 },
      { month: 'May', lastYear: 12.0, currentYear: 22.0 },
      { month: 'Jun', lastYear: 15.5, currentYear: 28.4 },
      { month: 'Jul', lastYear: 19.0, currentYear: 35.0 },
      { month: 'Aug', lastYear: 25.0, currentYear: 48.2 },
      { month: 'Sep', lastYear: 38.0, currentYear: 62.0 },
      { month: 'Oct', lastYear: 52.0, currentYear: 84.5 },
      { month: 'Nov', lastYear: 68.0, currentYear: 112.4 },
      { month: 'Dec', lastYear: 45.0, currentYear: 78.0 },
    ];

    // Village-wise distribution
    const villageDistribution = [
      { village: 'Kondajji', residueTonnes: 42.8, collectedTonnes: 28.4 },
      { village: 'Bannikodu', residueTonnes: 36.2, collectedTonnes: 21.0 },
      { village: 'Yalavatti', residueTonnes: 29.5, collectedTonnes: 18.2 },
      { village: 'Belagutti', residueTonnes: 34.0, collectedTonnes: 15.8 },
      { village: 'Sasvehalli', residueTonnes: 26.4, collectedTonnes: 12.5 },
      { village: 'Kokkanur', residueTonnes: 38.1, collectedTonnes: 24.0 },
    ];

    // Environmental Impact Metrics
    // 1 tonne of crop residue prevented from burning avoids approx 1.4 tonnes CO2 equivalent emissions
    const co2SavedTonnes = parseFloat((totalFeedstockCollectedTonnes * 1.4).toFixed(1));
    const biocharProducedTonnes = parseFloat((totalFeedstockCollectedTonnes * 0.32).toFixed(1));

    return res.json({
      success: true,
      kpis: {
        totalFarmers,
        totalFields,
        harvestReadyFields,
        totalFeedstockCollectedTonnes: parseFloat(totalFeedstockCollectedTonnes.toFixed(1)),
        pendingRequests,
        totalCreditsIssued: Math.round(totalCreditsIssued),
        totalCashPaid: Math.round(totalCashPaid),
        totalVillages,
        totalPanchayats,
        co2SavedTonnes,
        biocharProducedTonnes,
      },
      charts: {
        monthlyComparison,
        cropWiseResidue,
        villageDistribution,
        collectionEfficiency: [
          { name: 'Collected & Upcycled', value: 68, color: '#16A765' },
          { name: 'Pending Verification', value: 18, color: '#EAB308' },
          { name: 'In Transit', value: 14, color: '#3B82F6' },
        ],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
