import api from './api';
import {
  Doctor,
  DoctorAvailability,
  Appointment,
  Specialization,
  MedicationReminder,
  Prescription,
} from '../types';

export const patientService = {
  getSpecializations: async (): Promise<{ success: boolean; data: Specialization[] }> => {
    return api.get('/specializations');
  },

  getDoctors: async (params?: {
    specializationId?: string;
    search?: string;
  }): Promise<{ success: boolean; data: Doctor[] }> => {
    const query = new URLSearchParams();
    if (params?.specializationId && params.specializationId !== 'all') {
      query.append('specializationId', params.specializationId);
    }
    if (params?.search) {
      query.append('search', params.search);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/doctors${qs}`);
  },

  getDoctorById: async (id: string): Promise<{ success: boolean; data: Doctor }> => {
    return api.get(`/doctors/${id}`);
  },

  getDoctorAvailability: async (
    doctorId: string,
    date: string
  ): Promise<{ success: boolean; data: DoctorAvailability }> => {
    return api.get(`/doctors/${doctorId}/availability?date=${date}`);
  },

  holdSlot: async (payload: {
    doctorId: string;
    date: string;
    startTime: string;
  }): Promise<{
    success: boolean;
    data: { holdId: string; expiresAt: string; startTime: string; endTime: string };
  }> => {
    return api.post('/appointments/hold-slot', payload);
  },

  bookAppointment: async (payload: {
    doctorId: string;
    date: string;
    startTime: string;
    holdId?: string;
    symptoms: string;
    symptomDuration?: string;
    symptomSeverity?: string;
    additionalNotes?: string;
  }): Promise<{ success: boolean; data: Appointment }> => {
    return api.post('/appointments', payload);
  },

  getMyAppointments: async (): Promise<{ success: boolean; data: Appointment[] }> => {
    return api.get('/appointments');
  },

  getAppointmentDetails: async (id: string): Promise<{ success: boolean; data: Appointment }> => {
    return api.get(`/appointments/${id}`);
  },

  cancelAppointment: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; data: Appointment }> => {
    return api.patch(`/appointments/${id}/cancel`, { reason });
  },

  rescheduleAppointment: async (
    id: string,
    date: string,
    startTime: string
  ): Promise<{ success: boolean; data: Appointment }> => {
    return api.patch(`/appointments/${id}/reschedule`, { date, startTime });
  },

  getMedications: async (): Promise<{
    success: boolean;
    data: {
      reminders: MedicationReminder[];
      prescriptions: Prescription[];
    };
  }> => {
    return api.get('/patient/medications');
  },
};
