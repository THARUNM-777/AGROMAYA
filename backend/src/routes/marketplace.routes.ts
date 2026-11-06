import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/marketplace/products - List all products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { categoryId, search, featured, supplierId } = req.query;
    const where: any = {};

    if (categoryId) where.categoryId = String(categoryId);
    if (supplierId) where.supplierId = String(supplierId);
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        company: {
          select: { companyName: true, contactPhone: true },
        },
        supplier: {
          select: { id: true, supplierName: true, contactPhone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/marketplace/categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: { select: { products: true } },
      },
    });

    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/marketplace/products - Create product (Company / Supplier)
router.post('/products', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, categoryId, priceInInr, creditPrice, stockQuantity, imageUrl, isFeatured, supplierId } = req.body;

    let companyId = req.user?.companyId;
    if (!companyId) {
      const company = await prisma.biocharCompany.findFirst();
      companyId = company?.id;
    }

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Valid company required' });
    }

    let resolvedSupplierId = supplierId || req.user?.supplierId;
    if (!resolvedSupplierId) {
      const defaultSupplier = await prisma.supplier.findFirst();
      resolvedSupplierId = defaultSupplier?.id;
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        supplierId: resolvedSupplierId,
        categoryId,
        name,
        description,
        priceInInr: parseFloat(priceInInr),
        creditPrice: parseFloat(creditPrice || priceInInr),
        stockQuantity: parseInt(stockQuantity || 100),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
        isFeatured: Boolean(isFeatured),
      },
      include: { category: true, supplier: true },
    });

    return res.status(201).json({ success: true, product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/marketplace/orders - Farmer purchases products using Agricultural Credits
router.post('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, deliveryAddress } = req.body;
    // items: [{ productId: string, quantity: number }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    let farmerId = req.body.farmerId || req.user?.farmerId;
    if (!farmerId) {
      const demoFarmer = await prisma.farmer.findFirst();
      farmerId = demoFarmer?.id;
    }

    if (!farmerId) {
      return res.status(400).json({ success: false, message: 'Farmer identification required' });
    }

    // Check Farmer Wallet
    const wallet = await prisma.creditWallet.findUnique({
      where: { farmerId },
      include: { farmer: true },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Farmer wallet not found' });
    }

    // Fetch products
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { supplier: true, company: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalCredits = 0;
    const orderItemsData: any[] = [];
    const supplierBuckets: Map<string, { supplierId: string; companyId: string; amountInr: number }> = new Map();

    const fallbackSupplier = await prisma.supplier.findFirst();
    const fallbackCompany = await prisma.biocharCompany.findFirst();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (Available: ${product.stockQuantity})`,
        });
      }
      const subtotal = product.creditPrice * item.quantity;
      totalCredits += subtotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitCreditPrice: product.creditPrice,
        subtotalCredits: subtotal,
      });

      const sId = product.supplierId || fallbackSupplier?.id;
      const cId = product.companyId || fallbackCompany?.id;
      if (sId && cId) {
        const existing = supplierBuckets.get(sId) || { supplierId: sId, companyId: cId, amountInr: 0 };
        existing.amountInr += subtotal;
        supplierBuckets.set(sId, existing);
      }
    }

    // Validate sufficient wallet credits
    if (wallet.availableCredits < totalCredits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient agricultural credits. Order requires ${totalCredits} credits, but wallet balance is ${wallet.availableCredits} credits.`,
      });
    }

    // Execute atomic purchase transaction with double-entry ledger & Supplier Payable creation
    const orderNumber = `ORD-2026-${String(Date.now()).slice(-5)}`;
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          farmerId: farmerId!,
          totalAmountCredits: totalCredits,
          totalAmountInr: totalCredits,
          status: 'CONFIRMED',
          deliveryAddress: deliveryAddress || `${wallet.farmer.fullName}, Survey No. ${wallet.farmer.surveyNumber}, Karnataka`,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // 2. Deduct product inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // 3. Deduct wallet balance
      const updatedWallet = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          availableCredits: { decrement: totalCredits },
          totalSpentCredits: { increment: totalCredits },
        },
      });

      // 4. Create Credit Ledger Entry (Double-Entry Ledger)
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          farmerId: farmerId!,
          type: 'CREDIT_SPENT',
          amount: totalCredits,
          description: `Marketplace purchase of ${items.length} item(s) (${order.orderNumber})`,
          referenceId: order.orderNumber,
          balanceAfter: updatedWallet.availableCredits,
        },
      });

      // 5. Create Supplier Payable records for Biochar Company fiat settlement
      const createdPayables = [];
      for (const bucket of Array.from(supplierBuckets.values())) {
        const payable = await tx.supplierPayable.create({
          data: {
            orderId: order.id,
            supplierId: bucket.supplierId,
            companyId: bucket.companyId,
            payableAmountInr: bucket.amountInr,
            creditsRedeemed: bucket.amountInr,
            status: 'PENDING',
          },
          include: { supplier: true },
        });
        createdPayables.push(payable);
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user?.userId,
          actorRole: req.user?.role || 'FARMER',
          action: 'ORDER_PLACED',
          entityName: 'Order',
          entityId: order.id,
          detailsJson: JSON.stringify({
            orderNumber,
            totalCredits,
            itemsCount: items.length,
            payablesCount: createdPayables.length,
          }),
        },
      });

      return { order, updatedWallet, createdPayables };
    });

    // Notify Farmer of Confirmed Order
    await prisma.notification.create({
      data: {
        recipientRole: 'FARMER',
        recipientId: wallet.farmer.userId,
        title: 'Order Confirmed! 🛍️',
        message: `Your order ${result.order.orderNumber} for ${totalCredits} credits has been confirmed. Biochar company will settle supplier and dispatch goods.`,
        type: 'SUCCESS',
        actionUrl: '/farmer/orders',
      },
    });

    // Notify Biochar Company of Pending Supplier Settlement
    await prisma.notification.create({
      data: {
        recipientRole: 'BIOCHAR_COMPANY',
        title: 'New Farmer Order - Supplier Settlement Required',
        message: `Farmer ${wallet.farmer.fullName} placed Order #${result.order.orderNumber} spending ${totalCredits} credits. Settle ₹${totalCredits} with input supplier to authorize dispatch.`,
        type: 'INFO',
        actionUrl: '/company/orders',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully using Agricultural Credits',
      order: result.order,
      payables: result.createdPayables,
      remainingCredits: result.updatedWallet.availableCredits,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/marketplace/orders/:id/cancel - Auditable order cancellation & credit refund
router.post('/orders/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason = 'Farmer cancelled prior to dispatch' } = req.body;

    const order: any = await prisma.order.findUnique({
      where: { id },
      include: {
        farmer: { include: { wallet: true } },
        items: true,
        payables: true,
        shipments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'DISPATCHED' || order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order #${order.orderNumber} because goods have already been dispatched or delivered.`,
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    const refundCredits = order.totalAmountCredits;
    const wallet = order.farmer.wallet;

    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Farmer wallet not found for refund' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark Order as CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      // 2. Cancel any pending payables
      for (const p of order.payables) {
        if (p.status === 'PENDING') {
          await tx.supplierPayable.update({
            where: { id: p.id },
            data: { status: 'CANCELLED' },
          });
        }
      }

      // 3. Restore inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      // 4. Refund credits to farmer wallet
      const updatedWallet = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          availableCredits: { increment: refundCredits },
          totalSpentCredits: { decrement: refundCredits },
        },
      });

      // 5. Create Credit Ledger Refund Entry
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          farmerId: order.farmerId,
          type: 'CREDIT_REFUND',
          amount: refundCredits,
          description: `Full refund for cancelled Order #${order.orderNumber} (${reason})`,
          referenceId: order.orderNumber,
          balanceAfter: updatedWallet.availableCredits,
        },
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user?.userId,
          actorRole: req.user?.role || 'FARMER',
          action: 'ORDER_CANCELLED',
          entityName: 'Order',
          entityId: order.id,
          detailsJson: JSON.stringify({ orderNumber: order.orderNumber, refundCredits, reason }),
        },
      });

      return { updatedOrder, updatedWallet };
    });

    return res.json({
      success: true,
      message: `Order #${order.orderNumber} cancelled. ${refundCredits} credits refunded to farmer wallet.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/marketplace/orders - Get orders
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'FARMER' && req.user.farmerId) {
      where.farmerId = req.user.farmerId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        farmer: { include: { village: true, panchayat: true } },
        items: { include: { product: true } },
        payables: { include: { supplier: true, payments: true } },
        shipments: true,
      },
      orderBy: { orderedAt: 'desc' },
    });

    return res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
