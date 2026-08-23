import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import bookingService from '../services/booking.service.js';

export const holdSlotSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  holdId: z.string().uuid().optional(),
  symptoms: z.string().min(5, 'Please describe symptoms in at least 5 characters'),
  symptomDuration: z.string().optional(),
  symptomSeverity: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
});

// Search & list doctors
export const getDoctors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { specializationId, search } = req.query;

    const where: any = { isActive: true };

    if (specializationId && typeof specializationId === 'string' && specializationId !== 'all') {
      where.specializationId = specializationId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { specialization: { name: { contains: search } } },
        { bio: { contains: search } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        specialization: true,
        workingHours: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: doctors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch doctors' });
  }
};

// Get single doctor details
export const getDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        specialization: true,
        workingHours: true,
        leaveDays: {
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch doctor profile' });
  }
};

// Get doctor availability for a specific date
export const getDoctorAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ success: false, message: 'Date query parameter (YYYY-MM-DD) is required' });
      return;
    }

    const availability = await bookingService.getDoctorAvailability(id, date);
    res.status(200).json({ success: true, data: availability });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to calculate availability' });
  }
};

// Create temporary 5-min slot hold
export const holdSlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.patientId) {
      res.status(403).json({ success: false, message: 'Only registered patients can hold appointment slots' });
      return;
    }

    const { doctorId, date, startTime } = holdSlotSchema.parse(req.body);

    const hold = await bookingService.holdSlot({
      doctorId,
      patientId: req.user.patientId,
      dateStr: date,
      startTime,
    });

    res.status(200).json({
      success: true,
      message: 'Slot successfully reserved for 5 minutes',
      data: hold,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to hold slot' });
  }
};

// Confirm and create appointment
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.patientId) {
      res.status(403).json({ success: false, message: 'Only registered patients can book appointments' });
      return;
    }

    const data = bookAppointmentSchema.parse(req.body);

    const appointment = await bookingService.confirmAppointment({
      doctorId: data.doctorId,
      patientId: req.user.patientId,
      dateStr: data.date,
      startTime: data.startTime,
      holdId: data.holdId,
      symptoms: data.symptoms,
      symptomDuration: data.symptomDuration,
      symptomSeverity: data.symptomSeverity,
      additionalNotes: data.additionalNotes,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed and booked!',
      data: appointment,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to book appointment' });
  }
};

// Get current patient's appointments
export const getMyAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.patientId) {
      res.status(403).json({ success: false, message: 'Patient profile required' });
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user.patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            specialization: true,
          },
        },
        symptomSubmission: true,
        preVisitSummary: true,
        prescription: {
          include: {
            medications: true,
            postVisitSummary: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch appointments' });
  }
};

// Get single appointment details
export const getAppointmentDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            specialization: true,
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        symptomSubmission: true,
        preVisitSummary: true,
        prescription: {
          include: {
            medications: true,
            postVisitSummary: true,
          },
        },
      },
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Access control: only owner patient, doctor, or admin can view
    const isPatientOwner = req.user?.patientId === appointment.patientId;
    const isDoctorOwner = req.user?.doctorId === appointment.doctorId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied to this appointment record' });
      return;
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch appointment details' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = cancelAppointmentSchema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    const isPatientOwner = req.user?.patientId === appointment.patientId;
    const isDoctorOwner = req.user?.doctorId === appointment.doctorId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const cancelled = await bookingService.cancelAppointment(
      id,
      reason,
      req.user?.role || 'PATIENT'
    );

    res.status(200).json({
      success: true,
      message: 'Appointment successfully cancelled',
      data: cancelled,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to cancel appointment' });
  }
};

// Reschedule appointment
export const rescheduleAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, startTime } = rescheduleAppointmentSchema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    const isPatientOwner = req.user?.patientId === appointment.patientId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isPatientOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const rescheduled = await bookingService.rescheduleAppointment(id, date, startTime);

    res.status(200).json({
      success: true,
      message: 'Appointment successfully rescheduled',
      data: rescheduled,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to reschedule appointment' });
  }
};

// Get patient active medication reminders and prescriptions
export const getPatientMedications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.patientId) {
      res.status(403).json({ success: false, message: 'Patient profile required' });
      return;
    }

    const reminders = await prisma.medicationReminder.findMany({
      where: { patientId: req.user.patientId },
      include: {
        medication: {
          include: {
            prescription: {
              include: {
                doctor: { include: { user: true, specialization: true } },
              },
            },
          },
        },
      },
      orderBy: { nextScheduledAt: 'asc' },
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user.patientId },
      include: {
        doctor: { include: { user: true, specialization: true } },
        medications: true,
        postVisitSummary: true,
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        reminders,
        prescriptions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch medications' });
  }
};
