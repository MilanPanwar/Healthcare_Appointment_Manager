import { config } from '../config/env.js';
import prisma from '../config/database.js';
import { generateSlots, getDayOfWeek, parseLocalDate, timeToMinutes } from '../utils/dateUtils.js';
import { DoctorAvailabilityResponse, TimeSlot } from '../types/index.js';
import llmService from './llm.service.js';
import emailService from './email.service.js';
import calendarService from './calendar.service.js';

export interface CreateSlotHoldParams {
  doctorId: string;
  patientId: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:MM
}

export interface ConfirmAppointmentParams {
  doctorId: string;
  patientId: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  holdId?: string;
  symptoms: string;
  symptomDuration?: string;
  symptomSeverity?: string;
  additionalNotes?: string;
}

export class BookingService {
  /**
   * Computes comprehensive doctor availability for a given date.
   * Considers:
   * 1. Doctor's configured working hours for the day of week
   * 2. Approved doctor leave dates
   * 3. Existing active appointments
   * 4. Active, unexpired slot holds
   */
  async getDoctorAvailability(doctorId: string, dateStr: string): Promise<DoctorAvailabilityResponse> {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        workingHours: true,
        user: true,
      },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const appointmentDate = parseLocalDate(dateStr);
    const dayOfWeek = getDayOfWeek(appointmentDate);

    // 1. Check if doctor is on leave
    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        startDate: { lte: appointmentDate },
        endDate: { gte: appointmentDate },
      },
    });

    if (leave) {
      return {
        date: dateStr,
        dayOfWeek,
        isWorkingDay: false,
        isOnLeave: true,
        leaveReason: leave.reason || 'Doctor is on approved leave',
        slotDurationMinutes: doctor.slotDurationMinutes,
        slots: [],
      };
    }

    // 2. Check working hours for this day of week
    const workingSchedule = doctor.workingHours.find((w) => w.dayOfWeek === dayOfWeek && w.isAvailable);

    if (!workingSchedule) {
      return {
        date: dateStr,
        dayOfWeek,
        isWorkingDay: false,
        isOnLeave: false,
        slotDurationMinutes: doctor.slotDurationMinutes,
        slots: [],
      };
    }

    // 3. Generate baseline slots
    const rawSlots = generateSlots(
      workingSchedule.startTime,
      workingSchedule.endTime,
      doctor.slotDurationMinutes
    );

    // 4. Fetch booked appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
      },
      select: { startTime: true, endTime: true },
    });

    const bookedSlotStarts = new Set(existingAppointments.map((a) => a.startTime));

    // 5. Fetch active, non-expired slot holds
    const now = new Date();
    const activeHolds = await prisma.slotHold.findMany({
      where: {
        doctorId,
        appointmentDate,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
      select: { startTime: true, expiresAt: true, patientId: true },
    });

    const heldSlotsMap = new Map<string, { expiresAt: Date; patientId: string }>();
    activeHolds.forEach((h) => heldSlotsMap.set(h.startTime, { expiresAt: h.expiresAt, patientId: h.patientId }));

    // Format slots
    const slots: TimeSlot[] = rawSlots.map((s) => {
      const isBooked = bookedSlotStarts.has(s.startTime);
      const holdInfo = heldSlotsMap.get(s.startTime);
      const isHeld = !!holdInfo;

      let status: 'AVAILABLE' | 'HELD' | 'BOOKED' = 'AVAILABLE';
      if (isBooked) status = 'BOOKED';
      else if (isHeld) status = 'HELD';

      return {
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: !isBooked && !isHeld,
        status,
        holdExpiresAt: holdInfo ? holdInfo.expiresAt.toISOString() : undefined,
      };
    });

    return {
      date: dateStr,
      dayOfWeek,
      isWorkingDay: true,
      isOnLeave: false,
      slotDurationMinutes: doctor.slotDurationMinutes,
      slots,
    };
  }

  /**
   * Holds a slot temporarily for 5 minutes to prevent simultaneous booking collisions.
   * Atomically verifies availability before granting the hold.
   */
  async holdSlot(params: CreateSlotHoldParams): Promise<{ holdId: string; expiresAt: Date; startTime: string; endTime: string }> {
    const appointmentDate = parseLocalDate(params.dateStr);
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
      include: { workingHours: true },
    });

    if (!doctor || !doctor.isActive) {
      throw new Error('Selected doctor is currently unavailable');
    }

    const dayOfWeek = getDayOfWeek(appointmentDate);

    // 1. Verify doctor not on leave
    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: params.doctorId,
        startDate: { lte: appointmentDate },
        endDate: { gte: appointmentDate },
      },
    });

    if (leave) {
      throw new Error('Doctor is on leave on the selected date');
    }

    // 2. Verify within doctor working hours
    const workingSchedule = doctor.workingHours.find((w) => w.dayOfWeek === dayOfWeek && w.isAvailable);
    if (!workingSchedule) {
      throw new Error('Doctor does not have scheduled working hours on this day');
    }

    const slotStartMin = timeToMinutes(params.startTime);
    const slotEndMin = slotStartMin + doctor.slotDurationMinutes;
    const workStartMin = timeToMinutes(workingSchedule.startTime);
    const workEndMin = timeToMinutes(workingSchedule.endTime);

    if (slotStartMin < workStartMin || slotEndMin > workEndMin) {
      throw new Error('Requested slot falls outside doctor working hours');
    }

    const endTime = `${Math.floor(slotEndMin / 60).toString().padStart(2, '0')}:${(slotEndMin % 60).toString().padStart(2, '0')}`;

    // Execute atomic hold transaction
    return await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Check for confirmed/pending appointments
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId: params.doctorId,
          appointmentDate,
          startTime: params.startTime,
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        },
      });

      if (existingAppointment) {
        throw new Error('This time slot has already been booked by another patient');
      }

      // Check for active hold by another patient
      const existingHold = await tx.slotHold.findFirst({
        where: {
          doctorId: params.doctorId,
          appointmentDate,
          startTime: params.startTime,
          status: 'ACTIVE',
          expiresAt: { gt: now },
        },
      });

      if (existingHold) {
        if (existingHold.patientId === params.patientId) {
          // Refresh existing hold for the same patient
          const updated = await tx.slotHold.update({
            where: { id: existingHold.id },
            data: {
              expiresAt: new Date(Date.now() + config.worker.slotHoldDurationMinutes * 60 * 1000),
            },
          });
          return {
            holdId: updated.id,
            expiresAt: updated.expiresAt,
            startTime: updated.startTime,
            endTime: updated.endTime,
          };
        }
        throw new Error('This slot is temporarily held by another patient. Please choose another time or check back in a few minutes.');
      }

      // Release any other stale holds for this patient
      await tx.slotHold.updateMany({
        where: {
          patientId: params.patientId,
          status: 'ACTIVE',
        },
        data: { status: 'RELEASED' },
      });

      const expiresAt = new Date(Date.now() + config.worker.slotHoldDurationMinutes * 60 * 1000);

      const hold = await tx.slotHold.create({
        data: {
          doctorId: params.doctorId,
          patientId: params.patientId,
          appointmentDate,
          startTime: params.startTime,
          endTime,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      return {
        holdId: hold.id,
        expiresAt: hold.expiresAt,
        startTime: hold.startTime,
        endTime: hold.endTime,
      };
    });
  }

  /**
   * Confirms and creates the appointment inside an atomic database transaction.
   * Guarantees 100% concurrency safety against double bookings.
   */
  async confirmAppointment(params: ConfirmAppointmentParams) {
    const appointmentDate = parseLocalDate(params.dateStr);

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
      include: { user: true, specialization: true },
    });

    if (!doctor) throw new Error('Doctor not found');

    // Verify doctor is not on leave on the selected date
    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: params.doctorId,
        startDate: { lte: appointmentDate },
        endDate: { gte: appointmentDate },
      },
    });

    if (leave) {
      throw new Error('Doctor is on leave on the selected date');
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: { user: true },
    });

    if (!patient) throw new Error('Patient not found');

    const slotStartMin = timeToMinutes(params.startTime);
    const slotEndMin = slotStartMin + doctor.slotDurationMinutes;
    const endTime = `${Math.floor(slotEndMin / 60).toString().padStart(2, '0')}:${(slotEndMin % 60).toString().padStart(2, '0')}`;

    // ATOMIC TRANSACTION: Check hold & insert appointment
    const createdAppointment = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // If holdId provided, verify it
      if (params.holdId) {
        const hold = await tx.slotHold.findUnique({
          where: { id: params.holdId },
        });

        if (!hold || hold.status !== 'ACTIVE' || hold.expiresAt < now) {
          throw new Error('Your slot reservation has expired. Please select a slot again.');
        }

        if (hold.patientId !== params.patientId || hold.doctorId !== params.doctorId) {
          throw new Error('Invalid slot reservation authentication.');
        }
      }

      // Concurrency check: Ensure no appointment already exists
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: params.doctorId,
          appointmentDate,
          startTime: params.startTime,
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        },
      });

      if (existing) {
        throw new Error('Slot conflict: This time slot was just booked by another user.');
      }

      // Create Appointment Record
      const appointment = await tx.appointment.create({
        data: {
          doctorId: params.doctorId,
          patientId: params.patientId,
          appointmentDate,
          startTime: params.startTime,
          endTime,
          status: 'CONFIRMED',
        },
      });

      // Save Symptoms
      await tx.symptomSubmission.create({
        data: {
          appointmentId: appointment.id,
          rawSymptoms: params.symptoms,
          duration: params.symptomDuration || 'Not specified',
          severity: params.symptomSeverity || 'Moderate',
          additionalNotes: params.additionalNotes || null,
        },
      });

      // Mark Hold as CONVERTED
      if (params.holdId) {
        await tx.slotHold.update({
          where: { id: params.holdId },
          data: { status: 'CONVERTED' },
        });
      }

      return appointment;
    });

    // ASYNCHRONOUS POST-CREATION WORKFLOWS (Never blocks booking response)
    this.processPostBookingSideEffects({
      appointmentId: createdAppointment.id,
      patientUser: patient.user,
      doctorUser: doctor.user,
      specialization: doctor.specialization.name,
      appointmentDateStr: params.dateStr,
      startTime: params.startTime,
      endTime,
      symptoms: params.symptoms,
    }).catch((err) => {
      console.error('[BookingService Side-Effects Warning]:', err?.message);
    });

    return createdAppointment;
  }

  /**
   * Executes AI Pre-visit summary generation, email notifications, and Google Calendar event sync
   */
  private async processPostBookingSideEffects(data: {
    appointmentId: string;
    patientUser: any;
    doctorUser: any;
    specialization: string;
    appointmentDateStr: string;
    startTime: string;
    endTime: string;
    symptoms: string;
  }) {
    // 1. Trigger AI Pre-Visit Symptom Analysis
    try {
      const aiResult = await llmService.generatePreVisitSummary(data.symptoms);
      await prisma.preVisitSummary.create({
        data: {
          appointmentId: data.appointmentId,
          urgencyLevel: aiResult.urgencyLevel,
          chiefComplaint: aiResult.chiefComplaint,
          suggestedQuestions: JSON.stringify(aiResult.suggestedQuestions),
          rawAiResponse: JSON.stringify(aiResult),
          status: 'COMPLETED',
        },
      });
    } catch (aiError: any) {
      console.warn('[BookingService] Pre-visit AI summary generation error:', aiError?.message);
      await prisma.preVisitSummary.create({
        data: {
          appointmentId: data.appointmentId,
          urgencyLevel: 'MEDIUM',
          chiefComplaint: 'Symptom triage pending review',
          suggestedQuestions: JSON.stringify(['General review of presented symptoms']),
          status: 'FAILED',
          errorMessage: aiError?.message || 'AI service unavailable',
        },
      });
    }

    // 2. Enqueue Confirmation Emails (Patient and Doctor)
    const patientEmailData = emailService.buildBookingConfirmationEmail({
      patientName: `${data.patientUser.firstName} ${data.patientUser.lastName}`,
      doctorName: `${data.doctorUser.firstName} ${data.doctorUser.lastName}`,
      specialization: data.specialization,
      date: data.appointmentDateStr,
      time: `${data.startTime} - ${data.endTime}`,
      isDoctor: false,
    });

    await emailService.enqueueNotification({
      userId: data.patientUser.id,
      recipientEmail: data.patientUser.email,
      type: 'BOOKING_CONFIRMATION',
      subject: patientEmailData.subject,
      contentHtml: patientEmailData.html,
    });

    const docEmailData = emailService.buildBookingConfirmationEmail({
      patientName: `${data.patientUser.firstName} ${data.patientUser.lastName}`,
      doctorName: `${data.doctorUser.firstName} ${data.doctorUser.lastName}`,
      specialization: data.specialization,
      date: data.appointmentDateStr,
      time: `${data.startTime} - ${data.endTime}`,
      isDoctor: true,
    });

    await emailService.enqueueNotification({
      userId: data.doctorUser.id,
      recipientEmail: data.doctorUser.email,
      type: 'BOOKING_CONFIRMATION',
      subject: docEmailData.subject,
      contentHtml: docEmailData.html,
    });

    // 3. Create Google Calendar Event
    const startIso = `${data.appointmentDateStr}T${data.startTime}:00Z`;
    const endIso = `${data.appointmentDateStr}T${data.endTime}:00Z`;

    await calendarService.createAppointmentEvent({
      appointmentId: data.appointmentId,
      summary: `HealthFlow Appointment: Dr. ${data.doctorUser.lastName} & ${data.patientUser.firstName}`,
      description: `Medical consultation with Dr. ${data.doctorUser.firstName} ${data.doctorUser.lastName} (${data.specialization}).\nPatient: ${data.patientUser.firstName} ${data.patientUser.lastName}`,
      startTime: startIso,
      endTime: endIso,
      patientEmail: data.patientUser.email,
      doctorEmail: data.doctorUser.email,
    });
  }

  /**
   * Cancels an appointment safely
   */
  async cancelAppointment(appointmentId: string, reason?: string, cancelledByRole = 'PATIENT') {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status === 'CANCELLED') throw new Error('Appointment is already cancelled');

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || `Cancelled by ${cancelledByRole.toLowerCase()}`,
      },
    });

    // Calendar sync & notification side effects
    calendarService.deleteAppointmentEvent(appointmentId).catch((err) => {
      console.warn('[BookingService] Calendar delete warning:', err?.message);
    });

    const dateFormatted = appointment.appointmentDate.toISOString().split('T')[0];
    const emailData = emailService.buildCancellationEmail({
      patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
      doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
      date: dateFormatted,
      time: appointment.startTime,
      reason: reason || 'Cancelled upon request',
    });

    await emailService.enqueueNotification({
      userId: appointment.patient.user.id,
      recipientEmail: appointment.patient.user.email,
      type: 'APPOINTMENT_CANCELLED',
      subject: emailData.subject,
      contentHtml: emailData.html,
    });

    return updated;
  }

  /**
   * Reschedules an appointment to a new date and time
   */
  async rescheduleAppointment(appointmentId: string, newDateStr: string, newStartTime: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status === 'CANCELLED') throw new Error('Cannot reschedule a cancelled appointment');

    const newDate = parseLocalDate(newDateStr);
    const doctor = appointment.doctor;
    const slotStartMin = timeToMinutes(newStartTime);
    const slotEndMin = slotStartMin + doctor.slotDurationMinutes;
    const newEndTime = `${Math.floor(slotEndMin / 60).toString().padStart(2, '0')}:${(slotEndMin % 60).toString().padStart(2, '0')}`;

    // Atomic transaction to ensure slot availability
    const updated = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          appointmentDate: newDate,
          startTime: newStartTime,
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
          id: { not: appointmentId },
        },
      });

      if (conflict) {
        throw new Error('Requested new slot is not available');
      }

      return await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'RESCHEDULED',
        },
      });
    });

    const oldDateStr = appointment.appointmentDate.toISOString().split('T')[0];
    const emailData = emailService.buildRescheduleEmail({
      patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
      doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
      oldDate: `${oldDateStr} at ${appointment.startTime}`,
      newDate: newDateStr,
      newTime: newStartTime,
    });

    await emailService.enqueueNotification({
      userId: appointment.patient.user.id,
      recipientEmail: appointment.patient.user.email,
      type: 'APPOINTMENT_RESCHEDULED',
      subject: emailData.subject,
      contentHtml: emailData.html,
    });

    return updated;
  }
}

export const bookingService = new BookingService();
export default bookingService;
