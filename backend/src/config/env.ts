import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_for_healthcare_system_min_32_chars!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    fallbackMode: process.env.AI_FALLBACK_MODE !== 'false',
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER || 'ethereal') as 'smtp' | 'ethereal',
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'HealthFlow Care <no-reply@healthflow.local>',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://healthcare-appointment-manager-6f7c.onrender.com/api/calendar/callback',
  },
  worker: {
    intervalSeconds: parseInt(process.env.WORKER_INTERVAL_SECONDS || '15', 10),
    slotHoldDurationMinutes: parseInt(process.env.SLOT_HOLD_DURATION_MINUTES || '5', 10),
  },
};
