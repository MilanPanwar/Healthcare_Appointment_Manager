import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorAvailability,
  holdSlot,
  createAppointment,
  getMyAppointments,
  getAppointmentDetails,
  cancelAppointment,
  rescheduleAppointment,
  getPatientMedications,
} from '../controllers/patient.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Public / Authenticated doctor searching
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);
router.get('/doctors/:id/availability', getDoctorAvailability);

// Patient-only endpoints
router.post('/appointments/hold-slot', requireAuth, requireRole(['PATIENT']), holdSlot);
router.post('/appointments', requireAuth, requireRole(['PATIENT']), createAppointment);
router.get('/appointments', requireAuth, requireRole(['PATIENT']), getMyAppointments);
router.get('/appointments/:id', requireAuth, getAppointmentDetails);
router.patch('/appointments/:id/cancel', requireAuth, cancelAppointment);
router.patch('/appointments/:id/reschedule', requireAuth, rescheduleAppointment);
router.get('/patient/medications', requireAuth, requireRole(['PATIENT']), getPatientMedications);

export default router;
