import api from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', { email, password });
  },

  register: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: string;
    medicalHistorySummary?: string;
  }): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', payload);
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    return api.get<{ success: boolean; data: User }>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('healthflow_token');
      localStorage.removeItem('healthflow_user');
    }
  },
};
