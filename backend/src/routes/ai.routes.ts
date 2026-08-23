import { Router } from 'express';
import {
  analyzeSymptoms,
  summarizeClinicalNotes,
  retryPreVisitSummary,
  retryPostVisitSummary,
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/pre-visit-summary', analyzeSymptoms);
router.post('/post-visit-summary', summarizeClinicalNotes);
router.post('/retry-pre-visit/:appointmentId', requireAuth, retryPreVisitSummary);
router.post('/retry-post-visit/:prescriptionId', requireAuth, retryPostVisitSummary);

export default router;
