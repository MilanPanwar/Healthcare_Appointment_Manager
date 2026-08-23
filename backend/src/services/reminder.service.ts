import prisma from '../config/database.js';

export interface CreateMedicationReminderParams {
  medicationId: string;
  patientId: string;
  frequency: string;
  durationStr: string; // e.g. "5 days", "7 days", "1 month"
}

export class ReminderService {
  /**
   * Parses duration string to calculate end date
   */
  calculateEndDate(startDate: Date, durationStr: string): Date {
    const daysMatch = durationStr.match(/(\d+)\s*(day|days|d)/i);
    const weeksMatch = durationStr.match(/(\d+)\s*(week|weeks|w)/i);
    const monthsMatch = durationStr.match(/(\d+)\s*(month|months|m)/i);

    let daysToAdd = 7; // Default 7 days

    if (daysMatch) {
      daysToAdd = parseInt(daysMatch[1], 10);
    } else if (weeksMatch) {
      daysToAdd = parseInt(weeksMatch[1], 10) * 7;
    } else if (monthsMatch) {
      daysToAdd = parseInt(monthsMatch[1], 10) * 30;
    }

    return new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  /**
   * Calculates next reminder scheduled timestamp based on frequency
   */
  calculateNextReminderTime(current: Date, frequency: string): Date {
    const freq = frequency.toLowerCase();

    // Every X hours
    const hoursMatch = freq.match(/every\s*(\d+)\s*hour/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      return new Date(current.getTime() + hours * 60 * 60 * 1000);
    }

    if (freq.includes('three times') || freq.includes('tid') || freq.includes('3 times')) {
      return new Date(current.getTime() + 8 * 60 * 60 * 1000);
    }

    if (freq.includes('twice') || freq.includes('bid') || freq.includes('2 times')) {
      return new Date(current.getTime() + 12 * 60 * 60 * 1000);
    }

    // Default: Once daily (24 hours)
    return new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Initializes medication reminders when a prescription is created
   */
  async createRemindersForMedication(params: CreateMedicationReminderParams) {
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, params.durationStr);

    // Initial reminder scheduled in 4 hours or standard interval
    const nextScheduledAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const reminder = await prisma.medicationReminder.create({
      data: {
        medicationId: params.medicationId,
        patientId: params.patientId,
        frequency: params.frequency,
        startDate,
        endDate,
        nextScheduledAt,
        isActive: true,
      },
    });

    return reminder;
  }
}

export const reminderService = new ReminderService();
export default reminderService;
