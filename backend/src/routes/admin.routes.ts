import { Router } from 'express';
import {
  createDoctor,
  updateDoctor,
  deleteDoctor,
  setWorkingHours,
  setDoctorLeave,
  removeDoctorLeave,
  getAdminAppointments,
  getAdminStats,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.post('/doctors', createDoctor);
router.patch('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.post('/doctors/:id/working-hours', setWorkingHours);
router.post('/doctors/:id/leave', setDoctorLeave);
router.delete('/doctors/:id/leave/:leaveId', removeDoctorLeave);
router.get('/appointments', getAdminAppointments);
router.get('/stats', getAdminStats);

export default router;
