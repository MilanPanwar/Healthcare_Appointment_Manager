import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const specializations = await prisma.specialization.findMany({
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: specializations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch specializations' });
  }
});

export default router;
