import { Request } from 'express';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  patientId?: string;
  doctorId?: string;
  firstName: string;
  lastName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface PreVisitAIResult {
  urgencyLevel: 'Low' | 'Medium' | 'High';
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export interface MedicationScheduleItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PostVisitAIResult {
  summary: string;
  medications: MedicationScheduleItem[];
  followUpSteps: string[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'PAST';
  holdExpiresAt?: string;
}

export interface DoctorAvailabilityResponse {
  date: string;
  dayOfWeek: number;
  isWorkingDay: boolean;
  isOnLeave: boolean;
  leaveReason?: string | null;
  slotDurationMinutes: number;
  slots: TimeSlot[];
}
