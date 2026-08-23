import api from './api';
import { Appointment, Doctor } from '../types';

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface SubmitClinicalNotesPayload {
  diagnosis: string;
  clinicalNotes: string;
  followUpInstructions?: string;
  medications: MedicationInput[];
  customSummary?: string;
}

export const doctorService = {
  getDoctorAppointments: async (): Promise<{ success: boolean; data: Appointment[] }> => {
    return api.get('/doctor/appointments');
  },

  getDoctorAppointmentById: async (id: string): Promise<{ success: boolean; data: Appointment }> => {
    return api.get(`/doctor/appointments/${id}`);
  },

  previewAiSummary: async (clinicalNotes: string): Promise<{ success: boolean; data: any }> => {
    return api.post('/doctor/preview-summary', { clinicalNotes });
  },

  submitClinicalNotes: async (
    appointmentId: string,
    payload: SubmitClinicalNotesPayload
  ): Promise<{ success: boolean; data: any }> => {
    return api.post(`/doctor/appointments/${appointmentId}/clinical-notes`, payload);
  },

  getDoctorSchedule: async (): Promise<{ success: boolean; data: Doctor }> => {
    return api.get('/doctor/schedule');
  },
};
