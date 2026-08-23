import prisma from '../config/database.js';
import { parseLocalDate } from '../utils/dateUtils.js';
import emailService from './email.service.js';
import calendarService from './calendar.service.js';

export interface SetDoctorLeaveParams {
  doctorId: string;
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string;   // YYYY-MM-DD
  reason?: string;
}

export class LeaveService {
  /**
   * Sets a doctor on leave and automatically resolves all appointment conflicts.
   */
  async setDoctorLeave(params: SetDoctorLeaveParams) {
    const startDate = parseLocalDate(params.startDateStr);
    const endDate = parseLocalDate(params.endDateStr);

    if (endDate < startDate) {
      throw new Error('End date cannot be prior to start date');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
      include: { user: true },
    });

    if (!doctor) throw new Error('Doctor not found');

    // 1. Create DoctorLeave record
    const leaveRecord = await prisma.doctorLeave.create({
      data: {
        doctorId: params.doctorId,
        startDate,
        endDate,
        reason: params.reason || 'Doctor personal / medical leave',
      },
    });

    // 2. Invalidate / Release any active slot holds in this period
    await prisma.slotHold.updateMany({
      where: {
        doctorId: params.doctorId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'ACTIVE',
      },
      data: {
        status: 'RELEASED',
      },
    });

    // 3. Identify and Cancel all existing active appointments on these dates
    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.doctorId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        patient: { include: { user: true } },
      },
    });

    const cancelledAppointmentIds: string[] = [];

    for (const appt of affectedAppointments) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: `Doctor on leave: ${params.reason || 'Scheduled absence'}`,
        },
      });

      cancelledAppointmentIds.push(appt.id);

      // Async cleanups: Calendar and Email
      calendarService.deleteAppointmentEvent(appt.id).catch((err) => {
        console.warn('[LeaveService] Calendar deletion warning:', err?.message);
      });

      const dateFormatted = appt.appointmentDate.toISOString().split('T')[0];
      const emailData = emailService.buildDoctorLeaveCancellationEmail({
        patientName: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
        doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
        date: dateFormatted,
        time: `${appt.startTime} - ${appt.endTime}`,
        leaveReason: params.reason || 'Doctor emergency / leave',
      });

      await emailService.enqueueNotification({
        userId: appt.patient.user.id,
        recipientEmail: appt.patient.user.email,
        type: 'DOCTOR_LEAVE_CANCELLED',
        subject: emailData.subject,
        contentHtml: emailData.html,
      });
    }

    return {
      leaveRecord,
      affectedAppointmentsCount: affectedAppointments.length,
      cancelledAppointmentIds,
    };
  }

  /**
   * Deletes / cancels a leave period
   */
  async cancelDoctorLeave(leaveId: string) {
    const leave = await prisma.doctorLeave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) throw new Error('Doctor leave record not found');

    await prisma.doctorLeave.delete({
      where: { id: leaveId },
    });

    return { success: true, message: 'Doctor leave removed. Slots are now available according to regular schedule.' };
  }
}

export const leaveService = new LeaveService();
export default leaveService;
