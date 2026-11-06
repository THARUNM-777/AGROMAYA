import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/collections
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, farmerId, fieldId } = req.query;
    const where: any = {};

    if (status) where.status = String(status);
    if (fieldId) where.fieldId = String(fieldId);

    if (req.user?.role === 'FARMER' && req.user.farmerId) {
      where.farmerId = req.user.farmerId;
    } else if (farmerId) {
      where.farmerId = String(farmerId);
    }

    const collections = await prisma.feedstockCollection.findMany({
      where,
      include: {
        farmer: { include: { village: true, panchayat: true, biometricEnrollment: true } },
        field: true,
        request: { include: { company: true } },
        verification: { include: { verifiedByCompany: true } },
      },
      orderBy: { collectionDate: 'desc' },
    });

    return res.json({ success: true, count: collections.length, collections });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/collections - Record incoming feedstock delivery at Panchayat collection center
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      requestId,
      fieldId,
      farmerId,
      actualWeightKg,
      residueCategory,
      qualityGrade = 'A',
      moisturePct = 12.0,
      collectionLocation = 'Harihara APMC Center #1',
      weighbridgeSlipUrl,
      deliveryPhotoUrl,
      verificationMethod = 'BIOMETRIC_FACE',
      autoVerifyAndReward = false,
      rewardRatePerKg = 2.0,
    } = req.body;

    if (!requestId || !fieldId || !farmerId || !actualWeightKg) {
      return res.status(400).json({ success: false, message: 'Missing required feedstock collection fields' });
    }

    // Check if a collection for this request has already been completed to prevent duplicate entries
    const existing = await prisma.feedstockCollection.findFirst({
      where: {
        requestId,
        status: 'VERIFIED',
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Delivery request ${requestId} has already been verified and rewarded in Batch ${existing.collectionNumber}.`,
      });
    }

    const count = await prisma.feedstockCollection.count();
    const collectionNumber = `COL-2026-${String(count + 20).padStart(3, '0')}`;
    const weightNum = parseFloat(actualWeightKg);

    const collection: any = await prisma.feedstockCollection.create({
      data: {
        collectionNumber,
        requestId,
        fieldId,
        farmerId,
        actualWeightKg: weightNum,
        residueCategory: residueCategory || 'Paddy Straw',
        qualityGrade: qualityGrade || 'A',
        moisturePct: moisturePct ? parseFloat(moisturePct) : 12.0,
        collectionLocation,
        weighbridgeSlipUrl: weighbridgeSlipUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        deliveryPhotoUrl: deliveryPhotoUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
        verificationMethod,
        operatorId: req.user?.userId,
        status: autoVerifyAndReward ? 'VERIFIED' : 'PENDING_VERIFICATION',
      },
      include: {
        farmer: { include: { wallet: true } },
        field: true,
        request: { include: { company: true } },
      },
    });

    // Update Panchayat Collection Center inventory stock if matching center exists
    try {
      const center = await prisma.panchayatCollectionCenter.findFirst({
        where: { centerName: { contains: collectionLocation.slice(0, 8) } },
      });
      if (center) {
        await prisma.panchayatCollectionCenter.update({
          where: { id: center.id },
          data: { currentStockTonnes: { increment: weightNum / 1000.0 } },
        });
      }
    } catch (_err) {
      // Non-critical inventory update
    }

    // If autoVerifyAndReward is requested (e.g., immediate Panchayat verified intake)
    if (autoVerifyAndReward) {
      const verifiedTonnes = weightNum / 1000.0;
      const verifiedKg = weightNum;
      const grade = qualityGrade;
      const qualityMultiplier = grade === 'A' ? 1.05 : grade === 'B' ? 1.0 : 0.9;
      const totalReward = Math.round(verifiedKg * rewardRatePerKg * qualityMultiplier);
      const creditsAwarded = Math.round(totalReward * 0.75);
      const cashAwarded = totalReward - creditsAwarded;

      const company = await prisma.biocharCompany.findFirst();

      await prisma.$transaction(async (tx) => {
        // 1. Verification record
        await tx.feedstockVerification.create({
          data: {
            collectionId: collection.id,
            verifiedByCompanyId: company?.id || collection.request.companyId,
            actualQuantityTonnes: verifiedTonnes,
            qualityGrade: grade,
            moisturePct: parseFloat(String(moisturePct)),
            remarks: `Verified at ${collectionLocation} via ${verificationMethod}. Grade ${grade}.`,
            verificationStatus: 'APPROVED',
            rewardCreditsAwarded: creditsAwarded,
            cashbackAwarded: cashAwarded,
          },
        });

        // 2. Update field status to COLLECTED
        await tx.agriculturalField.update({
          where: { id: fieldId },
          data: { status: 'COLLECTED' },
        });

        // 3. Update request status to COMPLETED
        await tx.feedstockRequest.update({
          where: { id: requestId },
          data: { status: 'COMPLETED' },
        });

        // 4. Update wallet
        let wallet = collection.farmer.wallet;
        if (!wallet) {
          wallet = await tx.creditWallet.create({
            data: {
              farmerId,
              availableCredits: 0,
              totalEarnedCredits: 0,
              totalSpentCredits: 0,
              totalCashReceived: 0,
            },
          });
        }

        const updatedWallet = await tx.creditWallet.update({
          where: { id: wallet.id },
          data: {
            availableCredits: { increment: creditsAwarded },
            totalEarnedCredits: { increment: creditsAwarded },
            totalCashReceived: { increment: cashAwarded },
          },
        });

        // 5. Credit Ledger Entry
        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            farmerId,
            type: 'CREDIT_EARNED',
            amount: creditsAwarded,
            description: `Reward for ${verifiedKg} kg of verified ${collection.residueCategory} (${collection.collectionNumber})`,
            referenceId: collection.collectionNumber,
            balanceAfter: updatedWallet.availableCredits,
          },
        });

        // 6. Cash payout record
        const paymentRef = `NEFT-KA-${Date.now().toString().slice(-8)}`;
        await tx.cashPayment.create({
          data: {
            walletId: wallet.id,
            farmerId,
            amount: cashAwarded,
            paymentMethod: 'DIRECT_BANK_TRANSFER',
            transactionRef: paymentRef,
            status: 'PROCESSED',
          },
        });
      });

      // Notify Farmer
      await prisma.notification.create({
        data: {
          recipientRole: 'FARMER',
          recipientId: collection.farmer.userId,
          title: 'Feedstock Verified! Credits Awarded 🌿',
          message: `Your delivery ${collection.collectionNumber} was verified at ${collectionLocation}. You earned ${creditsAwarded} agricultural credits!`,
          type: 'REWARD',
          actionUrl: '/farmer/wallet',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Feedstock delivery verified and credits awarded to farmer wallet immediately.',
        collection: { ...collection, status: 'VERIFIED' },
        creditsAwarded,
        cashAwarded,
      });
    }

    // Otherwise, Notify Company of incoming batch ready for verification
    await prisma.notification.create({
      data: {
        recipientRole: 'BIOCHAR_COMPANY',
        title: 'New Feedstock Batch Awaiting Verification',
        message: `Batch ${collection.collectionNumber} (${actualWeightKg} kg of ${residueCategory}) received from ${collection.farmer.fullName} at ${collection.collectionLocation} (${verificationMethod}).`,
        type: 'INFO',
        actionUrl: '/company/verification',
      },
    });

    return res.status(201).json({ success: true, collection });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/collections/:id/verify - Biochar Company Employee Verifies Batch and Issues Rewards
router.post('/:id/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      actualQuantityTonnes,
      qualityGrade,
      moisturePct,
      remarks,
      rewardRatePerKg = 2.0,
      creditSplitRatio = 0.75, // 75% agricultural credits, 25% cash
    } = req.body;

    const collection: any = await prisma.feedstockCollection.findUnique({
      where: { id },
      include: {
        farmer: { include: { wallet: true } },
        field: true,
        request: { include: { company: true } },
      },
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection record not found' });
    }

    if (collection.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Batch has already been verified and rewarded. Duplicate credit awards are strictly prevented.',
      });
    }

    let companyId = req.user?.companyId;
    if (!companyId) {
      const company = await prisma.biocharCompany.findFirst();
      companyId = company?.id;
    }

    const verifiedTonnes = actualQuantityTonnes
      ? parseFloat(actualQuantityTonnes)
      : collection.actualWeightKg / 1000.0;
    const verifiedKg = verifiedTonnes * 1000.0;

    // Quality multiplier
    let qualityMultiplier = 1.0;
    const grade = qualityGrade || collection.qualityGrade;
    if (grade === 'A') qualityMultiplier = 1.05;
    else if (grade === 'B') qualityMultiplier = 1.0;
    else if (grade === 'C') qualityMultiplier = 0.9;

    const totalReward = Math.round(verifiedKg * rewardRatePerKg * qualityMultiplier);
    const creditsAwarded = Math.round(totalReward * creditSplitRatio);
    const cashAwarded = totalReward - creditsAwarded;

    // Use Prisma transaction for atomic double-entry wallet ledger balance update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create verification record
      const verification = await tx.feedstockVerification.create({
        data: {
          collectionId: collection.id,
          verifiedByCompanyId: companyId!,
          actualQuantityTonnes: verifiedTonnes,
          qualityGrade: grade,
          moisturePct: moisturePct ? parseFloat(moisturePct) : collection.moisturePct,
          remarks: remarks || `Verified by company quality lead. Grade ${grade}, moisture ${moisturePct || collection.moisturePct}%.`,
          verificationStatus: 'APPROVED',
          rewardCreditsAwarded: creditsAwarded,
          cashbackAwarded: cashAwarded,
        },
      });

      // 2. Update collection status to VERIFIED
      await tx.feedstockCollection.update({
        where: { id: collection.id },
        data: { status: 'VERIFIED' },
      });

      // 3. Update field status to COLLECTED (Green)
      await tx.agriculturalField.update({
        where: { id: collection.fieldId },
        data: { status: 'COLLECTED' },
      });

      // 4. Update request status to COMPLETED
      await tx.feedstockRequest.update({
        where: { id: collection.requestId },
        data: { status: 'COMPLETED' },
      });

      // 5. Update farmer wallet atomically
      let wallet = collection.farmer.wallet;
      if (!wallet) {
        wallet = await tx.creditWallet.create({
          data: {
            farmerId: collection.farmerId,
            availableCredits: 0,
            totalEarnedCredits: 0,
            totalSpentCredits: 0,
            totalCashReceived: 0,
          },
        });
      }

      const updatedWallet = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          availableCredits: { increment: creditsAwarded },
          totalEarnedCredits: { increment: creditsAwarded },
          totalCashReceived: { increment: cashAwarded },
        },
      });

      // 6. Record Double-Entry Credit Ledger Transaction
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          farmerId: collection.farmerId,
          type: 'CREDIT_EARNED',
          amount: creditsAwarded,
          description: `Reward for ${verifiedKg.toFixed(0)} kg of verified ${collection.residueCategory} (${collection.collectionNumber})`,
          referenceId: collection.collectionNumber,
          balanceAfter: updatedWallet.availableCredits,
        },
      });

      // 7. Record Cash Transfer Payment
      const paymentRef = `NEFT-KA-${Date.now().toString().slice(-8)}`;
      await tx.cashPayment.create({
        data: {
          walletId: wallet.id,
          farmerId: collection.farmerId,
          amount: cashAwarded,
          paymentMethod: 'DIRECT_BANK_TRANSFER',
          transactionRef: paymentRef,
          status: 'PROCESSED',
        },
      });

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user?.userId,
          actorRole: req.user?.role || 'BIOCHAR_COMPANY',
          action: 'FEEDSTOCK_VERIFIED',
          entityName: 'FeedstockCollection',
          entityId: collection.id,
          detailsJson: JSON.stringify({
            verifiedTonnes,
            creditsAwarded,
            cashAwarded,
            totalReward,
            grade,
          }),
        },
      });

      return { verification, updatedWallet, creditsAwarded, cashAwarded, totalReward };
    });

    // Notify Farmer of Rewards Credited
    await prisma.notification.create({
      data: {
        recipientRole: 'FARMER',
        recipientId: collection.farmer.userId,
        title: 'Feedstock Verified! Rewards Credited 🎉',
        message: `Your ${collection.residueCategory} collection was approved! You received ${result.creditsAwarded} Agricultural Credits and ₹${result.cashAwarded} direct bank transfer.`,
        type: 'REWARD',
        actionUrl: '/farmer/wallet',
      },
    });

    return res.json({
      success: true,
      message: 'Feedstock verified and rewards credited successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
