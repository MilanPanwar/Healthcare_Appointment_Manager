import prisma from '../config/database.js';
import emailService from '../services/email.service.js';

export const runEmailRetryWorker = async (): Promise<number> => {
  try {
    const now = new Date();
    const pendingNotifications = await prisma.notification.findMany({
      where: {
        status: { in: ['PENDING', 'RETRYING'] },
        nextRetryAt: { lte: now },
      },
      take: 10,
      orderBy: { nextRetryAt: 'asc' },
    });

    let processedCount = 0;

    for (const notification of pendingNotifications) {
      await emailService.sendNotificationRecord(notification);
      processedCount++;
    }

    return processedCount;
  } catch (error: any) {
    console.error('[EmailRetryWorker Error]:', error?.message);
    return 0;
  }
};
