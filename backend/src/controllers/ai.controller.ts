import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import llmService from '../services/llm.service.js';

export const preVisitSummarySchema = z.object({
  symptoms: z.string().min(3, 'Symptoms text is required'),
});

export const postVisitSummarySchema = z.object({
  clinicalNotes: z.string().min(5, 'Clinical notes text is required'),
});

// Direct test endpoint for pre-visit symptom analysis
export const analyzeSymptoms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symptoms } = preVisitSummarySchema.parse(req.body);
    const result = await llmService.generatePreVisitSummary(symptoms);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Pre-visit AI analysis failed' });
  }
};

// Direct test endpoint for post-visit summary generation
export const summarizeClinicalNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clinicalNotes } = postVisitSummarySchema.parse(req.body);
    const result = await llmService.generatePostVisitSummary(clinicalNotes);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Post-visit AI summary generation failed' });
  }
};

// Retry failed pre-visit AI summary
export const retryPreVisitSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { symptomSubmission: true, preVisitSummary: true },
    });

    if (!appointment || !appointment.symptomSubmission) {
      res.status(404).json({ success: false, message: 'Appointment or symptom submission not found' });
      return;
    }

    const symptoms = appointment.symptomSubmission.rawSymptoms;
    const aiResult = await llmService.generatePreVisitSummary(symptoms);

    const updatedSummary = await prisma.preVisitSummary.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        urgencyLevel: aiResult.urgencyLevel,
        chiefComplaint: aiResult.chiefComplaint,
        suggestedQuestions: JSON.stringify(aiResult.suggestedQuestions),
        rawAiResponse: JSON.stringify(aiResult),
        status: 'COMPLETED',
      },
      update: {
        urgencyLevel: aiResult.urgencyLevel,
        chiefComplaint: aiResult.chiefComplaint,
        suggestedQuestions: JSON.stringify(aiResult.suggestedQuestions),
        rawAiResponse: JSON.stringify(aiResult),
        status: 'COMPLETED',
        errorMessage: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'AI Pre-visit summary re-generated successfully',
      data: updatedSummary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'AI retry failed' });
  }
};

// Retry failed post-visit AI summary
export const retryPostVisitSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { medications: true },
    });

    if (!prescription) {
      res.status(404).json({ success: false, message: 'Prescription not found' });
      return;
    }

    const fullClinicalText = `Diagnosis: ${prescription.diagnosis}\nNotes: ${prescription.clinicalNotes}\nInstructions: ${prescription.followUpInstructions || ''}\nMedications: ${JSON.stringify(prescription.medications)}`;
    const aiResult = await llmService.generatePostVisitSummary(fullClinicalText);

    const updatedSummary = await prisma.postVisitSummary.upsert({
      where: { prescriptionId },
      create: {
        prescriptionId,
        summaryText: aiResult.summary,
        followUpSteps: JSON.stringify(aiResult.followUpSteps),
        structuredMedications: JSON.stringify(aiResult.medications),
        status: 'COMPLETED',
      },
      update: {
        summaryText: aiResult.summary,
        followUpSteps: JSON.stringify(aiResult.followUpSteps),
        structuredMedications: JSON.stringify(aiResult.medications),
        status: 'COMPLETED',
        errorMessage: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'AI Post-visit summary re-generated successfully',
      data: updatedSummary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'AI retry failed' });
  }
};
