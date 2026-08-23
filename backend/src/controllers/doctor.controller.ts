import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import llmService from '../services/llm.service.js';
import reminderService from '../services/reminder.service.js';

export const medicationInputSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. Twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g. 7 days)'),
  instructions: z.string().optional(),
});

export const submitClinicalNotesSchema = z.object({
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  clinicalNotes: z.string().min(5, 'Clinical notes are required'),
  followUpInstructions: z.string().optional(),
  medications: z.array(medicationInputSchema).default([]),
  customSummary: z.string().optional(),
});

// Get doctor's appointments grouped/filtered
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.doctorId) {
      res.status(403).json({ success: false, message: 'Doctor profile required' });
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.doctorId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
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
      orderBy: [
        { appointmentDate: 'desc' },
        { startTime: 'asc' },
      ],
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch doctor appointments' });
  }
};

// Get single doctor appointment details
export const getDoctorAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.doctorId) {
      res.status(403).json({ success: false, message: 'Doctor profile required' });
      return;
    }

    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
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

    if (appointment.doctorId !== req.user.doctorId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch appointment' });
  }
};

// Preview AI Post-Visit Summary before saving
export const previewPostVisitSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { clinicalNotes } = req.body;
    if (!clinicalNotes) {
      res.status(400).json({ success: false, message: 'Clinical notes are required for AI summary preview' });
      return;
    }

    const aiResult = await llmService.generatePostVisitSummary(clinicalNotes);
    res.status(200).json({ success: true, data: aiResult });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'AI summary preview failed' });
  }
};

// Submit clinical notes, create prescription, trigger AI summary & initialize medication reminders
export const submitClinicalNotesAndPrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.doctorId) {
      res.status(403).json({ success: false, message: 'Doctor profile required' });
      return;
    }

    const { id } = req.params;
    const data = submitClinicalNotesSchema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    if (appointment.doctorId !== req.user.doctorId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied to this appointment' });
      return;
    }

    // 1. Generate or use patient-friendly summary
    let aiSummaryResult = {
      summary: data.customSummary || '',
      followUpSteps: ['Take prescribed medications', 'Follow healthy diet and rest'],
      medications: data.medications,
    };

    let summaryStatus = 'COMPLETED';
    let summaryError: string | null = null;

    if (!data.customSummary) {
      try {
        const fullClinicalText = `Diagnosis: ${data.diagnosis}\nNotes: ${data.clinicalNotes}\nInstructions: ${data.followUpInstructions || ''}\nMedications: ${JSON.stringify(data.medications)}`;
        aiSummaryResult = await llmService.generatePostVisitSummary(fullClinicalText);
      } catch (err: any) {
        console.warn('[DoctorController] Post-visit AI generation error, using fallback:', err?.message);
        summaryStatus = 'FAILED';
        summaryError = err?.message || 'AI summary generation error';
        aiSummaryResult = {
          summary: `Summary: ${data.diagnosis}. Follow instructions given by doctor.`,
          followUpSteps: ['Take prescribed medications', 'Contact clinic if symptoms persist'],
          medications: data.medications,
        };
      }
    }

    // 2. Transactionally save prescription, medications, and update appointment to COMPLETED
    const result = await prisma.$transaction(async (tx) => {
      // Mark appointment as COMPLETED
      await tx.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      // Upsert Prescription
      const prescription = await tx.prescription.upsert({
        where: { appointmentId: id },
        create: {
          appointmentId: id,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          diagnosis: data.diagnosis,
          clinicalNotes: data.clinicalNotes,
          followUpInstructions: data.followUpInstructions || null,
        },
        update: {
          diagnosis: data.diagnosis,
          clinicalNotes: data.clinicalNotes,
          followUpInstructions: data.followUpInstructions || null,
        },
      });

      // Clean old medications if re-submitting
      await tx.medication.deleteMany({
        where: { prescriptionId: prescription.id },
      });

      // Insert Medications
      const createdMeds = [];
      for (const med of data.medications) {
        const created = await tx.medication.create({
          data: {
            prescriptionId: prescription.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || null,
          },
        });
        createdMeds.push(created);
      }

      // Upsert PostVisitSummary
      await tx.postVisitSummary.upsert({
        where: { prescriptionId: prescription.id },
        create: {
          prescriptionId: prescription.id,
          summaryText: aiSummaryResult.summary,
          followUpSteps: JSON.stringify(aiSummaryResult.followUpSteps),
          structuredMedications: JSON.stringify(aiSummaryResult.medications),
          status: summaryStatus,
          errorMessage: summaryError,
        },
        update: {
          summaryText: aiSummaryResult.summary,
          followUpSteps: JSON.stringify(aiSummaryResult.followUpSteps),
          structuredMedications: JSON.stringify(aiSummaryResult.medications),
          status: summaryStatus,
          errorMessage: summaryError,
        },
      });

      return { prescription, medications: createdMeds };
    });

    // 3. Initialize background medication reminders for each medication
    for (const med of result.medications) {
      reminderService.createRemindersForMedication({
        medicationId: med.id,
        patientId: appointment.patientId,
        frequency: med.frequency,
        durationStr: med.duration,
      }).catch((err) => {
        console.warn(`[DoctorController] Failed to schedule reminder for med #${med.id}:`, err?.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Clinical notes, prescription, and patient summary recorded successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to submit clinical notes' });
  }
};

// Get doctor's schedule and working hours
export const getDoctorSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.doctorId) {
      res.status(403).json({ success: false, message: 'Doctor profile required' });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.doctorId },
      include: {
        workingHours: { orderBy: { dayOfWeek: 'asc' } },
        leaveDays: { orderBy: { startDate: 'desc' } },
      },
    });

    res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch schedule' });
  }
};
