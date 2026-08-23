import { Router } from 'express';
import {
  getDoctorAppointments,
  getDoctorAppointmentById,
  previewPostVisitSummary,
  submitClinicalNotesAndPrescription,
  getDoctorSchedule,
} from '../controllers/doctor.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['DOCTOR', 'ADMIN']));

router.get('/appointments', getDoctorAppointments);
router.get('/appointments/:id', getDoctorAppointmentById);
router.post('/preview-summary', previewPostVisitSummary);
router.post('/appointments/:id/clinical-notes', submitClinicalNotesAndPrescription);
router.get('/schedule', getDoctorSchedule);

export default router;
