import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/suppliers - List certified suppliers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      include: {
        products: { select: { id: true, name: true, priceInInr: true, stockQuantity: true } },
      },
    });
    return res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/me - Get current logged-in supplier profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let supplierId = req.user?.supplierId;
    if (!supplierId) {
      const firstSupplier = await prisma.supplier.findFirst();
      supplierId = firstSupplier?.id;
    }

    if (!supplierId) {
      return res.status(404).json({ success: false, message: 'Supplier profile not found' });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId as string },
      include: {
        products: true,
        payables: {
          include: {
            order: { include: { farmer: true, items: { include: { product: true } } } },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        shipments: {
          include: {
            order: { include: { farmer: true, items: { include: { product: true } } } },
          },
          orderBy: { dispatchDate: 'desc' },
        },
      },
    });

    return res.json({ success: true, supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/payables - View supplier payables (Biochar Company & Supplier)
router.get('/payables', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, supplierId } = req.query;
    const where: any = {};

    if (status) where.status = String(status);

    if (req.user?.role === 'SUPPLIER' && req.user.supplierId) {
      where.supplierId = req.user.supplierId;
    } else if (supplierId) {
      where.supplierId = String(supplierId);
    }

    const payables = await prisma.supplierPayable.findMany({
      where,
      include: {
        supplier: true,
        company: true,
        order: {
          include: {
            farmer: { select: { id: true, fullName: true, phone: true, village: true } },
            items: { include: { product: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: payables.length, payables });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/suppliers/payables/:id/pay - Biochar Company settles payment to Supplier
router.post('/payables/:id/pay', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      paymentGateway = 'RAZORPAY_SANDBOX', // 'RAZORPAY_SANDBOX' | 'BANK_TRANSFER' | 'UPI'
      paymentReference,
      amount,
      notes,
    } = req.body;

    const payable: any = await prisma.supplierPayable.findUnique({
      where: { id },
      include: {
        supplier: true,
        company: true,
        order: { include: { farmer: true } },
      },
    });

    if (!payable) {
      return res.status(404).json({ success: false, message: 'Supplier payable not found' });
    }

    if (payable.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Payable has already been settled and confirmed' });
    }

    const payAmount = amount ? parseFloat(amount) : payable.payableAmountInr;
    const ref = paymentReference || `pay_rzp_${paymentGateway.toLowerCase().slice(0, 3)}_${Date.now()}`;

    // Execute atomic payment confirmation transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.supplierPayment.create({
        data: {
          payableId: payable.id,
          paymentGateway,
          paymentReference: ref,
          amountPaid: payAmount,
          currency: 'INR',
          status: 'SUCCESS',
          gatewayResponseJson: JSON.stringify({
            gateway: paymentGateway,
            ref,
            timestamp: new Date().toISOString(),
            settledToBank: payable.supplier.bankAccountNo || 'SBIN0040182',
            notes: notes || 'Supplier B2B input invoice settlement authorized by Biochar Company',
          }),
        },
      });

      // 2. Mark payable as PAID
      const updatedPayable = await tx.supplierPayable.update({
        where: { id: payable.id },
        data: {
          status: 'PAID',
        },
      });

      // 3. Mark Order as COMPANY_PAID (ready for dispatch by supplier)
      await tx.order.update({
        where: { id: payable.orderId },
        data: { status: 'COMPANY_PAID' },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user?.userId,
          actorRole: req.user?.role || 'BIOCHAR_COMPANY',
          action: 'SUPPLIER_PAID',
          entityName: 'SupplierPayable',
          entityId: payable.id,
          detailsJson: JSON.stringify({
            supplierId: payable.supplierId,
            payableAmount: payAmount,
            gateway: paymentGateway,
            paymentReference: ref,
          }),
        },
      });

      return { payment, updatedPayable };
    });

    // Notify Supplier that payment has been confirmed and products can be dispatched
    await prisma.notification.create({
      data: {
        recipientRole: 'SUPPLIER',
        recipientId: payable.supplier.userId,
        title: 'Payment Confirmed by Biochar Company! 💰',
        message: `Biochar company has settled ₹${payAmount.toLocaleString()} for Order #${payable.order.orderNumber} via ${paymentGateway} (Ref: ${ref}). Please dispatch goods.`,
        type: 'SUCCESS',
        actionUrl: '/supplier/orders',
      },
    });

    return res.json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString()} successfully processed via ${paymentGateway}. Supplier notified to dispatch.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/suppliers/orders - Supplier purchase order view
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let supplierId = req.user?.supplierId;
    if (!supplierId && req.user?.role !== 'ADMIN' && req.user?.role !== 'BIOCHAR_COMPANY') {
      const defaultSupplier = await prisma.supplier.findFirst();
      supplierId = defaultSupplier?.id;
    }

    const where: any = {};
    if (supplierId) {
      where.payables = { some: { supplierId } };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        farmer: { include: { village: true, panchayat: true } },
        items: { include: { product: true } },
        payables: { include: { company: true, payments: true } },
        shipments: true,
      },
      orderBy: { orderedAt: 'desc' },
    });

    return res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/suppliers/orders/:orderId/dispatch - Supplier dispatches fertilizer & adds tracking
router.post('/orders/:orderId/dispatch', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const { carrierName = 'VRL Logistics Karnataka', trackingNumber, estimatedDeliveryDays = 3, trackingNotes } = req.body;

    const order: any = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        farmer: true,
        payables: { include: { supplier: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const supplierId = req.user?.supplierId || order.payables[0]?.supplierId;
    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Associated supplier not found' });
    }

    const trackNum = trackingNumber || `VRL-KA-${Math.floor(100000 + Math.random() * 900000)}`;
    const estDate = new Date(Date.now() + estimatedDeliveryDays * 86400000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update Shipment
      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          supplierId,
          carrierName,
          trackingNumber: trackNum,
          dispatchDate: new Date(),
          estimatedDeliveryDate: estDate,
          status: 'DISPATCHED',
          trackingNotes: trackingNotes || `Dispatched from Davangere Central Agri Warehouse. Expected delivery by ${estDate.toLocaleDateString()}.`,
        },
      });

      // 2. Update order status to DISPATCHED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'DISPATCHED' },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          actorId: req.user?.userId,
          actorRole: req.user?.role || 'SUPPLIER',
          action: 'SHIPMENT_DISPATCHED',
          entityName: 'Shipment',
          entityId: shipment.id,
          detailsJson: JSON.stringify({ trackingNumber: trackNum, carrierName, estDate }),
        },
      });

      return { shipment, updatedOrder };
    });

    // Notify Farmer
    await prisma.notification.create({
      data: {
        recipientRole: 'FARMER',
        recipientId: order.farmer.userId,
        title: 'Agricultural Inputs Dispatched! 🚚',
        message: `Your order #${order.orderNumber} has been dispatched via ${carrierName} (Tracking #: ${trackNum}). Expected delivery: ${estDate.toLocaleDateString()}.`,
        type: 'INFO',
        actionUrl: '/farmer/orders',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment confirmed and tracking details updated.',
      ...result,
    });
  } catch (error: any) {
    console.error('Dispatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/suppliers/shipments/:shipmentId/deliver - Confirm delivery to farmer
router.post('/shipments/:shipmentId/deliver', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shipmentId = req.params.shipmentId as string;

    const shipment: any = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: { include: { farmer: true } } },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'DELIVERED',
          actualDeliveryDate: new Date(),
        },
      });

      await tx.order.update({
        where: { id: shipment.orderId },
        data: { status: 'DELIVERED' },
      });
    });

    // Notify Farmer
    await prisma.notification.create({
      data: {
        recipientRole: 'FARMER',
        recipientId: shipment.order.farmer.userId,
        title: 'Order Delivered Successfully! ✅',
        message: `Your agricultural inputs for Order #${shipment.order.orderNumber} have been delivered to your farm.`,
        type: 'SUCCESS',
        actionUrl: '/farmer/orders',
      },
    });

    return res.json({ success: true, message: 'Order and shipment marked as DELIVERED.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
