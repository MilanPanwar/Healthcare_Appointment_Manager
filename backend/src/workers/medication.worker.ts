import prisma from '../config/database.js';
import emailService from '../services/email.service.js';
import reminderService from '../services/reminder.service.js';

export const runMedicationReminderWorker = async (): Promise<number> => {
  try {
    const now = new Date();
    const dueReminders = await prisma.medicationReminder.findMany({
      where: {
        isActive: true,
        nextScheduledAt: { lte: now },
      },
      include: {
        medication: {
          include: {
            prescription: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
      },
      take: 20,
    });

    let sentCount = 0;

    for (const reminder of dueReminders) {
      // Check if past end date
      if (now > reminder.endDate) {
        await prisma.medicationReminder.update({
          where: { id: reminder.id },
          data: { isActive: false },
        });
        continue;
      }

      // Build and queue reminder email
      const emailData = emailService.buildMedicationReminderEmail({
        patientName: `${reminder.patient.user.firstName} ${reminder.patient.user.lastName}`,
        medicationName: reminder.medication.name,
        dosage: reminder.medication.dosage,
        instructions: reminder.medication.instructions || undefined,
      });

      await emailService.enqueueNotification({
        userId: reminder.patient.user.id,
        recipientEmail: reminder.patient.user.email,
        type: 'MEDICATION_REMINDER',
        subject: emailData.subject,
        contentHtml: emailData.html,
      });

      // Calculate next scheduled time
      const nextScheduledAt = reminderService.calculateNextReminderTime(now, reminder.frequency);
      const shouldDeactivate = nextScheduledAt > reminder.endDate;

      await prisma.medicationReminder.update({
        where: { id: reminder.id },
        data: {
          lastSentAt: now,
          nextScheduledAt,
          isActive: !shouldDeactivate,
        },
      });

      sentCount++;
    }

    return sentCount;
  } catch (error: any) {
    console.error('[MedicationReminderWorker Error]:', error?.message);
    return 0;
  }
};
