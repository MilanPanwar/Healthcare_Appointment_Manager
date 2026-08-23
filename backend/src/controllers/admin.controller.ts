import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import leaveService from '../services/leave.service.js';

export const createDoctorSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  specializationId: z.string().uuid('Invalid specialization ID'),
  licenseNumber: z.string().min(1, 'License number is required'),
  bio: z.string().optional(),
  slotDurationMinutes: z.number().min(10).max(120).default(30),
  consultationFee: z.number().min(0).default(50),
});

export const updateDoctorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  specializationId: z.string().uuid().optional(),
  licenseNumber: z.string().optional(),
  bio: z.string().optional(),
  slotDurationMinutes: z.number().min(10).max(120).optional(),
  consultationFee: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const workingHourItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean(),
});

export const setWorkingHoursSchema = z.object({
  workingHours: z.array(workingHourItemSchema),
});

export const doctorLeaveSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

// Create new doctor
export const createDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = createDoctorSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role: 'DOCTOR',
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specializationId: data.specializationId,
          licenseNumber: data.licenseNumber,
          bio: data.bio || null,
          slotDurationMinutes: data.slotDurationMinutes,
          consultationFee: data.consultationFee,
          isActive: true,
        },
      });

      // Initialize default Mon-Fri working hours (09:00 - 17:00)
      for (let day = 1; day <= 5; day++) {
        await tx.doctorWorkingHours.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
          },
        });
      }

      return { user, doctor };
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account and profile successfully created',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to create doctor' });
  }
};

// Update doctor profile
export const updateDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateDoctorSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (data.firstName || data.lastName || data.phone !== undefined) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: {
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
            phone: data.phone !== undefined ? data.phone : undefined,
          },
        });
      }

      await tx.doctor.update({
        where: { id },
        data: {
          specializationId: data.specializationId || undefined,
          licenseNumber: data.licenseNumber || undefined,
          bio: data.bio !== undefined ? data.bio : undefined,
          slotDurationMinutes: data.slotDurationMinutes || undefined,
          consultationFee: data.consultationFee !== undefined ? data.consultationFee : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
      });
    });

    const updated = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true, specialization: true, workingHours: true },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to update doctor' });
  }
};

// Deactivate doctor
export const deleteDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor successfully deactivated',
      data: doctor,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to deactivate doctor' });
  }
};

// Set working hours for doctor
export const setWorkingHours = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { workingHours } = setWorkingHoursSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.doctorWorkingHours.deleteMany({ where: { doctorId: id } });

      // Insert new
      for (const item of workingHours) {
        await tx.doctorWorkingHours.create({
          data: {
            doctorId: id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            isAvailable: item.isAvailable,
          },
        });
      }
    });

    const updatedHours = await prisma.doctorWorkingHours.findMany({
      where: { doctorId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: 'Working hours updated successfully',
      data: updatedHours,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to set working hours' });
  }
};

// Set doctor leave and automatically cancel conflicting appointments & notify patients
export const setDoctorLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = doctorLeaveSchema.parse(req.body);

    const result = await leaveService.setDoctorLeave({
      doctorId: id,
      startDateStr: startDate,
      endDateStr: endDate,
      reason,
    });

    res.status(201).json({
      success: true,
      message: `Doctor marked on leave. ${result.affectedAppointmentsCount} conflicting appointment(s) were automatically cancelled and patients notified.`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to mark doctor on leave' });
  }
};

// Remove doctor leave
export const removeDoctorLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { leaveId } = req.params;
    const result = await leaveService.cancelDoctorLeave(leaveId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to remove leave' });
  }
};

// Get all appointments in the system
export const getAdminAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, doctorId, patientId, startDate, endDate } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'all') where.status = status;
    if (doctorId && typeof doctorId === 'string') where.doctorId = doctorId;
    if (patientId && typeof patientId === 'string') where.patientId = patientId;

    if (startDate && typeof startDate === 'string') {
      where.appointmentDate = { ...(where.appointmentDate || {}), gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      where.appointmentDate = { ...(where.appointmentDate || {}), lte: new Date(endDate) };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
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
        prescription: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch admin appointments' });
  }
};

// Get admin platform statistics
export const getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalNotifications,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      prisma.notification.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        totalNotifications,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch stats' });
  }
};
