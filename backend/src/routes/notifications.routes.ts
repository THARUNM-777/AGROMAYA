import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientRole: 'ALL' },
          { recipientRole: role },
          ...(userId ? [{ recipientId: userId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({ success: true, unreadCount, notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    await prisma.notification.updateMany({
      where: {
        OR: [{ recipientRole: 'ALL' }, { recipientRole: role }],
      },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
