import { Router } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/calendar.controller.js';

const router = Router();

router.get('/auth-url', getGoogleAuthUrl);
router.get('/callback', handleGoogleCallback);

export default router;
