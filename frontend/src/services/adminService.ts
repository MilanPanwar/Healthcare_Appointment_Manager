import api from './api';
import { Doctor, Appointment } from '../types';

export interface CreateDoctorPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specializationId: string;
  licenseNumber: string;
  bio?: string;
  slotDurationMinutes: number;
  consultationFee: number;
}

export interface UpdateDoctorPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specializationId?: string;
  licenseNumber?: string;
  bio?: string;
  slotDurationMinutes?: number;
  consultationFee?: number;
  isActive?: boolean;
}

export interface WorkingHourPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const adminService = {
  createDoctor: async (payload: CreateDoctorPayload): Promise<{ success: boolean; data: any }> => {
    return api.post('/admin/doctors', payload);
  },

  updateDoctor: async (id: string, payload: UpdateDoctorPayload): Promise<{ success: boolean; data: any }> => {
    return api.patch(`/admin/doctors/${id}`, payload);
  },

  deleteDoctor: async (id: string): Promise<{ success: boolean; data: any }> => {
    return api.delete(`/admin/doctors/${id}`);
  },

  setWorkingHours: async (doctorId: string, workingHours: WorkingHourPayload[]): Promise<{ success: boolean; data: any }> => {
    return api.post(`/admin/doctors/${doctorId}/working-hours`, { workingHours });
  },

  setDoctorLeave: async (
    doctorId: string,
    payload: { startDate: string; endDate: string; reason?: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      affectedAppointmentsCount: number;
      cancelledAppointmentIds: string[];
    };
  }> => {
    return api.post(`/admin/doctors/${doctorId}/leave`, payload);
  },

  removeDoctorLeave: async (doctorId: string, leaveId: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/admin/doctors/${doctorId}/leave/${leaveId}`);
  },

  getAdminAppointments: async (params?: {
    status?: string;
    doctorId?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: Appointment[] }> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.doctorId) query.append('doctorId', params.doctorId);
    if (params?.patientId) query.append('patientId', params.patientId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/admin/appointments${qs}`);
  },

  getAdminStats: async (): Promise<{
    success: boolean;
    data: {
      totalPatients: number;
      totalDoctors: number;
      totalAppointments: number;
      confirmedAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      totalNotifications: number;
    };
  }> => {
    return api.get('/admin/stats');
  },
};
