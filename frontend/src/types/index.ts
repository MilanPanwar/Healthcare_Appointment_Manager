export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  patientId?: string;
  doctorId?: string;
}

export interface Specialization {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  _count?: {
    doctors: number;
  };
}

export interface DoctorWorkingHour {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  specializationId: string;
  specialization: Specialization;
  licenseNumber: string;
  bio?: string;
  slotDurationMinutes: number;
  consultationFee: number;
  isActive: boolean;
  workingHours?: DoctorWorkingHour[];
  leaveDays?: DoctorLeave[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'PAST';
  holdExpiresAt?: string;
}

export interface DoctorAvailability {
  date: string;
  dayOfWeek: number;
  isWorkingDay: boolean;
  isOnLeave: boolean;
  leaveReason?: string;
  slotDurationMinutes: number;
  slots: TimeSlot[];
}

export interface SymptomSubmission {
  id: string;
  appointmentId: string;
  rawSymptoms: string;
  duration?: string;
  severity?: string;
  additionalNotes?: string;
  createdAt: string;
}

export interface PreVisitSummary {
  id: string;
  appointmentId: string;
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'LOW' | 'MEDIUM' | 'HIGH';
  chiefComplaint: string;
  suggestedQuestions: string; // JSON string
  rawAiResponse?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PostVisitSummary {
  id: string;
  prescriptionId: string;
  summaryText: string;
  followUpSteps: string; // JSON string
  structuredMedications: string; // JSON string
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctor?: Doctor;
  patientId: string;
  diagnosis: string;
  clinicalNotes: string;
  followUpInstructions?: string;
  createdAt: string;
  medications: Medication[];
  postVisitSummary?: PostVisitSummary;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctor: Doctor;
  patientId: string;
  patient?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    emergencyContact?: string;
    medicalHistorySummary?: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  cancellationReason?: string;
  symptomSubmission?: SymptomSubmission;
  preVisitSummary?: PreVisitSummary;
  prescription?: Prescription;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  medication: Medication & {
    prescription?: {
      doctor?: Doctor;
    };
  };
  patientId: string;
  frequency: string;
  startDate: string;
  endDate: string;
  nextScheduledAt: string;
  lastSentAt?: string;
  isActive: boolean;
}
