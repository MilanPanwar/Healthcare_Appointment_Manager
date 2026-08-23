import { Request, Response } from 'express';
import calendarService from '../services/calendar.service.js';
import { config } from '../config/env.js';

export const getGoogleAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.google.clientId) {
      res.status(200).json({
        success: true,
        configured: false,
        message: 'Google OAuth is running in simulated development mode. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable live Google Calendar sync.',
        url: null,
      });
      return;
    }

    const state = req.query.state as string;
    const url = calendarService.getAuthUrl(state);

    res.status(200).json({
      success: true,
      configured: true,
      url,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to generate Google Calendar auth URL',
    });
  }
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).send('Authorization code is missing');
      return;
    }

    const tokens = await calendarService.exchangeCodeForTokens(code);

    // Redirect back to frontend dashboard with success query param
    res.redirect(`${config.clientUrl}?calendar_connected=true`);
  } catch (error: any) {
    console.error('[Google Calendar Callback Error]:', error?.message);
    res.redirect(`${config.clientUrl}?calendar_error=${encodeURIComponent(error?.message || 'OAuth error')}`);
  }
};
