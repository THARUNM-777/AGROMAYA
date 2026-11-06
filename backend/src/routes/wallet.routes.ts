import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wallet - Get wallet summary
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetFarmerId = req.user?.farmerId;

    // Company or Panchayat can inspect a specific farmer's wallet
    if (req.query.farmerId && (req.user?.role === 'BIOCHAR_COMPANY' || req.user?.role === 'GRAM_PANCHAYAT')) {
      targetFarmerId = String(req.query.farmerId);
    }

    if (!targetFarmerId) {
      // Fallback to first farmer for quick testing if not specified
      const firstFarmer = await prisma.farmer.findFirst();
      targetFarmerId = firstFarmer?.id;
    }

    if (!targetFarmerId) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const wallet = await prisma.creditWallet.findUnique({
      where: { farmerId: targetFarmerId },
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            surveyNumber: true,
            bankAccountRef: true,
            village: true,
            panchayat: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        cashPayments: {
          orderBy: { disbursedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    return res.json({ success: true, wallet });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/wallet/transactions - Get full transaction ledger
router.get('/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetFarmerId = req.user?.farmerId;
    if (req.query.farmerId) targetFarmerId = String(req.query.farmerId);

    if (!targetFarmerId) {
      const first = await prisma.farmer.findFirst();
      targetFarmerId = first?.id;
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: { farmerId: targetFarmerId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, transactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/wallet/cashback - Get cash disbursements
router.get('/cashback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetFarmerId = req.user?.farmerId;
    if (req.query.farmerId) targetFarmerId = String(req.query.farmerId);

    if (!targetFarmerId) {
      const first = await prisma.farmer.findFirst();
      targetFarmerId = first?.id;
    }

    const payments = await prisma.cashPayment.findMany({
      where: { farmerId: targetFarmerId },
      orderBy: { disbursedAt: 'desc' },
    });

    return res.json({ success: true, payments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
