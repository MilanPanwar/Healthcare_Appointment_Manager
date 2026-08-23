import prisma from '../config/database.js';

export const runHoldCleaner = async (): Promise<number> => {
  try {
    const now = new Date();
    const result = await prisma.slotHold.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      console.log(`[HoldCleaner] Cleaned up ${result.count} expired slot hold(s).`);
    }

    return result.count;
  } catch (error: any) {
    console.error('[HoldCleaner Error]:', error?.message);
    return 0;
  }
};
