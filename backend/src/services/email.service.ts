import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import prisma from '../config/database.js';

export interface EnqueueEmailParams {
  userId?: string;
  recipientEmail: string;
  type:
    | 'BOOKING_CONFIRMATION'
    | 'APPOINTMENT_REMINDER'
    | 'APPOINTMENT_CANCELLED'
    | 'DOCTOR_LEAVE_CANCELLED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'MEDICATION_REMINDER';
  subject: string;
  contentHtml: string;
  contentText?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;
  /** True when the active transporter was created via Ethereal test account */
  private isEtherealMode = false;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      if (config.email.provider === 'ethereal') {
        // ── Ethereal mode: auto-generate a free test account ──────────────────
        // No SMTP_USER / SMTP_PASS required in .env
        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,          // smtp.ethereal.email
          port: testAccount.smtp.port,          // 587
          secure: testAccount.smtp.secure,      // false
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        this.isEtherealMode = true;
        this.isInitialized = true;

        console.log('📧 Ethereal test account created');
        console.log(`   Email: ${testAccount.user}`);
        console.log('   Preview URL will be logged after each email is sent.');

      } else if (config.email.provider === 'smtp' && config.email.user) {
        // ── Real SMTP mode (SendGrid / Mailgun / production SMTP) ─────────────
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.port === 465,
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
        });

        this.isEtherealMode = false;
        this.isInitialized = true;

        console.log(`📧 Email transporter ready (SMTP: ${config.email.host}:${config.email.port})`);

      } else {
        // ── Misconfigured: provider is smtp but credentials are missing ────────
        console.warn(
          '[EmailService] EMAIL_PROVIDER=smtp but SMTP_USER/SMTP_PASS are not set. ' +
          'Emails will be queued in DB but cannot be sent. ' +
          'Set EMAIL_PROVIDER=ethereal for local development.'
        );
      }
    } catch (error: any) {
      console.warn(
        '[EmailService] Transporter init failed (emails will remain queued in DB):',
        error?.message
      );
    }
  }

  /**
   * Safely enqueues an email into the database Notification table.
   * Ensures the calling API workflow is NEVER blocked or broken by email failures.
   */
  async enqueueNotification(params: EnqueueEmailParams): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          recipientEmail: params.recipientEmail,
          type: params.type,
          subject: params.subject,
          contentHtml: params.contentHtml,
          contentText: params.contentText || '',
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        },
      });

      // Try sending asynchronously without blocking caller
      this.processNotificationImmediately(notification.id).catch((err) => {
        console.warn(`[EmailService] Initial dispatch attempt deferred to worker for #${notification.id}:`, err?.message);
      });

      return notification;
    } catch (dbError: any) {
      console.error('[EmailService] Failed to enqueue notification to DB:', dbError?.message);
      return null;
    }
  }

  /**
   * Attempts immediate transmission of a queued notification.
   */
  async processNotificationImmediately(notificationId: string): Promise<boolean> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.status === 'SENT') {
      return true;
    }

    return this.sendNotificationRecord(notification);
  }

  /**
   * Internal sender method with error handling and retry schedule updates
   */
  async sendNotificationRecord(notification: any): Promise<boolean> {
    if (!this.transporter) {
      await this.initTransporter();
    }

    try {
      if (!this.transporter) {
        throw new Error('Transporter unavailable');
      }

      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: notification.recipientEmail,
        subject: notification.subject,
        html: notification.contentHtml,
        text: notification.contentText || undefined,
      });

      let previewUrl = '';
      if (this.isEtherealMode) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) {
          previewUrl = url as string;
          console.log(`   Preview URL: ${previewUrl}`);
        }
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorLog: previewUrl ? `Preview: ${previewUrl}` : null,
        },
      });

      return true;
    } catch (error: any) {
      const nextRetryCount = notification.retryCount + 1;
      const isExhausted = nextRetryCount >= notification.maxRetries;
      
      // Exponential backoff: 30s, 60s, 120s, 240s, 480s
      const delaySeconds = Math.pow(2, nextRetryCount) * 15;
      const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: isExhausted ? 'FAILED' : 'RETRYING',
          retryCount: nextRetryCount,
          nextRetryAt: nextRetryAt,
          errorLog: `Error at ${new Date().toISOString()}: ${error?.message || 'Send error'}`,
        },
      });

      return false;
    }
  }

  // ==========================================
  // REUSABLE HTML EMAIL TEMPLATES
  // ==========================================

  private getEmailBaseLayout(title: string, contentBody: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px 24px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .badge-info { background-color: #e0f2fe; color: #0369a1; }
          .badge-danger { background-color: #fee2e2; color: #b91c1c; }
          .badge-success { background-color: #dcfce7; color: #15803d; }
          .card { background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; }
          .card-item { margin-bottom: 8px; font-size: 14px; }
          .card-item:last-child { margin-bottom: 0; }
          .card-label { font-weight: 600; color: #475569; }
          .button { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
          .footer { padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HealthFlow Care</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">${title}</p>
          </div>
          <div class="content">
            ${contentBody}
          </div>
          <div class="footer">
            <p>This is an automated notification from HealthFlow Appointment & Follow-up Manager.</p>
            <p>&copy; ${new Date().getFullYear()} HealthFlow Healthcare Systems. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  buildBookingConfirmationEmail(params: {
    patientName: string;
    doctorName: string;
    specialization: string;
    date: string;
    time: string;
    isDoctor?: boolean;
  }): { subject: string; html: string } {
    const subject = `Confirmed: Appointment on ${params.date} at ${params.time}`;
    const roleGreeting = params.isDoctor
      ? `<p>Hello <strong>Dr. ${params.doctorName}</strong>,</p><p>A new appointment has been scheduled with patient <strong>${params.patientName}</strong>.</p>`
      : `<p>Hello <strong>${params.patientName}</strong>,</p><p>Your appointment with <strong>Dr. ${params.doctorName}</strong> has been successfully confirmed!</p>`;

    const body = `
      ${roleGreeting}
      <div class="card">
        <div class="card-item"><span class="card-label">Doctor:</span> Dr. ${params.doctorName} (${params.specialization})</div>
        <div class="card-item"><span class="card-label">Patient:</span> ${params.patientName}</div>
        <div class="card-item"><span class="card-label">Date:</span> ${params.date}</div>
        <div class="card-item"><span class="card-label">Time:</span> ${params.time}</div>
        <div class="card-item"><span class="card-label">Status:</span> <span class="badge badge-success">Confirmed</span></div>
      </div>
      <p>Please arrive 10 minutes prior to your scheduled consultation time. If you need to reschedule or cancel, please access your patient dashboard.</p>
    `;

    return {
      subject,
      html: this.getEmailBaseLayout('Appointment Booking Confirmation', body),
    };
  }

  buildCancellationEmail(params: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    reason?: string;
  }): { subject: string; html: string } {
    const subject = `Cancelled: Appointment on ${params.date} at ${params.time}`;
    const body = `
      <p>Hello <strong>${params.patientName}</strong>,</p>
      <p>Your upcoming appointment with <strong>Dr. ${params.doctorName}</strong> has been cancelled.</p>
      <div class="card">
        <div class="card-item"><span class="card-label">Doctor:</span> Dr. ${params.doctorName}</div>
        <div class="card-item"><span class="card-label">Date:</span> ${params.date} at ${params.time}</div>
        <div class="card-item"><span class="card-label">Reason:</span> ${params.reason || 'Requested cancellation'}</div>
        <div class="card-item"><span class="card-label">Status:</span> <span class="badge badge-danger">Cancelled</span></div>
      </div>
      <p>You can book another available slot anytime through your patient portal.</p>
    `;

    return {
      subject,
      html: this.getEmailBaseLayout('Appointment Cancellation', body),
    };
  }

  buildDoctorLeaveCancellationEmail(params: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    leaveReason?: string;
  }): { subject: string; html: string } {
    const subject = `Important: Appointment Cancelled due to Doctor Absence on ${params.date}`;
    const body = `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; border-radius: 4px; margin-bottom: 20px;">
        <strong style="color: #991b1b;">Doctor Schedule Update</strong>
        <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 13px;">Dr. ${params.doctorName} is unavailable on ${params.date} due to approved medical/personal leave.</p>
      </div>
      <p>Dear <strong>${params.patientName}</strong>,</p>
      <p>We regret to inform you that your appointment scheduled for <strong>${params.date} at ${params.time}</strong> with <strong>Dr. ${params.doctorName}</strong> has been cancelled due to doctor unavailability.</p>
      <div class="card">
        <div class="card-item"><span class="card-label">Reason:</span> ${params.leaveReason || 'Doctor on leave'}</div>
        <div class="card-item"><span class="card-label">Status:</span> <span class="badge badge-danger">Cancelled by Clinic</span></div>
      </div>
      <p>We apologize for any inconvenience caused. Please log in to your patient dashboard to re-book with Dr. ${params.doctorName} on an alternate date or select another specialist.</p>
    `;

    return {
      subject,
      html: this.getEmailBaseLayout('Urgent: Appointment Schedule Update', body),
    };
  }

  buildRescheduleEmail(params: {
    patientName: string;
    doctorName: string;
    oldDate: string;
    newDate: string;
    newTime: string;
  }): { subject: string; html: string } {
    const subject = `Rescheduled: Appointment with Dr. ${params.doctorName}`;
    const body = `
      <p>Hello <strong>${params.patientName}</strong>,</p>
      <p>Your appointment has been successfully rescheduled.</p>
      <div class="card">
        <div class="card-item"><span class="card-label">Doctor:</span> Dr. ${params.doctorName}</div>
        <div class="card-item"><span class="card-label">Previous Date:</span> ${params.oldDate}</div>
        <div class="card-item"><span class="card-label">New Date:</span> <strong>${params.newDate} at ${params.newTime}</strong></div>
        <div class="card-item"><span class="card-label">Status:</span> <span class="badge badge-info">Rescheduled</span></div>
      </div>
    `;

    return {
      subject,
      html: this.getEmailBaseLayout('Appointment Rescheduled', body),
    };
  }

  buildMedicationReminderEmail(params: {
    patientName: string;
    medicationName: string;
    dosage: string;
    instructions?: string;
  }): { subject: string; html: string } {
    const subject = `Medication Reminder: ${params.medicationName} (${params.dosage})`;
    const body = `
      <p>Hello <strong>${params.patientName}</strong>,</p>
      <p>This is a scheduled reminder to take your prescribed medication:</p>
      <div class="card" style="border-left: 4px solid #0284c7;">
        <div class="card-item"><span class="card-label">Medication:</span> <strong>${params.medicationName}</strong></div>
        <div class="card-item"><span class="card-label">Dosage:</span> ${params.dosage}</div>
        <div class="card-item"><span class="card-label">Instructions:</span> ${params.instructions || 'Take as prescribed'}</div>
      </div>
      <p>Consistent adherence to your medication schedule is critical for your recovery and wellness.</p>
    `;

    return {
      subject,
      html: this.getEmailBaseLayout('Medication Reminder', body),
    };
  }
}

export const emailService = new EmailService();
export default emailService;
