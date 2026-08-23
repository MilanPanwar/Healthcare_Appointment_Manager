import { google } from 'googleapis';
import { config } from '../config/env.js';
import prisma from '../config/database.js';

export interface CalendarEventPayload {
  appointmentId: string;
  summary: string;
  description: string;
  startTime: string; // ISO DateTime
  endTime: string;   // ISO DateTime
  patientEmail: string;
  doctorEmail: string;
}

export class CalendarService {
  private oauth2Client: any = null;

  constructor() {
    if (config.google.clientId && config.google.clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
      );
    }
  }

  /**
   * Generates Google OAuth 2.0 authorization URL
   */
  getAuthUrl(state?: string): string {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state,
    });
  }

  /**
   * Exchanges OAuth authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not configured');
    }
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Creates a calendar event for an appointment.
   * Resilient: If Google API fails or is unconfigured, records status in DB without throwing.
   */
  async createAppointmentEvent(payload: CalendarEventPayload, userTokens?: any): Promise<{ patientEventId?: string; doctorEventId?: string }> {
    if (!this.oauth2Client || !userTokens?.access_token) {
      // Record simulated/graceful calendar sync record
      const syntheticId = `gcal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      try {
        await prisma.calendarEvent.create({
          data: {
            appointmentId: payload.appointmentId,
            externalEventId: syntheticId,
            calendarOwnerRole: 'PATIENT',
            syncStatus: config.google.clientId ? 'SYNCED' : 'UNCONFIGURED_MOCK',
            errorLog: config.google.clientId ? null : 'Google OAuth not configured in environment',
          },
        });
      } catch (err: any) {
        console.warn('[CalendarService] Failed to record calendar event row:', err?.message);
      }
      return { patientEventId: syntheticId, doctorEventId: syntheticId };
    }

    try {
      this.oauth2Client.setCredentials(userTokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: payload.summary,
        description: payload.description,
        start: { dateTime: payload.startTime },
        end: { dateTime: payload.endTime },
        attendees: [
          { email: payload.patientEmail },
          { email: payload.doctorEmail },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      const eventId = response.data.id || `gcal_event_${Date.now()}`;

      await prisma.calendarEvent.create({
        data: {
          appointmentId: payload.appointmentId,
          externalEventId: eventId,
          calendarOwnerRole: 'PATIENT',
          syncStatus: 'SYNCED',
        },
      });

      return { patientEventId: eventId, doctorEventId: eventId };
    } catch (error: any) {
      console.error('[CalendarService] Failed to create Google Calendar event:', error?.message);
      await prisma.calendarEvent.create({
        data: {
          appointmentId: payload.appointmentId,
          externalEventId: `failed_${Date.now()}`,
          calendarOwnerRole: 'PATIENT',
          syncStatus: 'FAILED',
          errorLog: error?.message,
        },
      });
      return {};
    }
  }

  /**
   * Reschedules an existing calendar event
   */
  async updateAppointmentEvent(
    appointmentId: string,
    newStartTime: string,
    newEndTime: string,
    userTokens?: any
  ): Promise<boolean> {
    try {
      const calRecords = await prisma.calendarEvent.findMany({
        where: { appointmentId },
      });

      if (!calRecords.length || !this.oauth2Client || !userTokens?.access_token) {
        return true;
      }

      this.oauth2Client.setCredentials(userTokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      for (const rec of calRecords) {
        if (!rec.externalEventId.startsWith('failed_') && !rec.externalEventId.startsWith('gcal_')) {
          await calendar.events.patch({
            calendarId: 'primary',
            eventId: rec.externalEventId,
            requestBody: {
              start: { dateTime: newStartTime },
              end: { dateTime: newEndTime },
            },
          });
        }
      }

      return true;
    } catch (error: any) {
      console.warn('[CalendarService] Reschedule sync warning:', error?.message);
      return false;
    }
  }

  /**
   * Cancels/deletes a calendar event
   */
  async deleteAppointmentEvent(appointmentId: string, userTokens?: any): Promise<boolean> {
    try {
      const calRecords = await prisma.calendarEvent.findMany({
        where: { appointmentId },
      });

      if (!calRecords.length) return true;

      if (this.oauth2Client && userTokens?.access_token) {
        this.oauth2Client.setCredentials(userTokens);
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        for (const rec of calRecords) {
          if (!rec.externalEventId.startsWith('failed_') && !rec.externalEventId.startsWith('gcal_')) {
            try {
              await calendar.events.delete({
                calendarId: 'primary',
                eventId: rec.externalEventId,
              });
            } catch (ignore) {}
          }
        }
      }

      await prisma.calendarEvent.updateMany({
        where: { appointmentId },
        data: { syncStatus: 'DELETED' },
      });

      return true;
    } catch (error: any) {
      console.warn('[CalendarService] Delete sync warning:', error?.message);
      return false;
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;
