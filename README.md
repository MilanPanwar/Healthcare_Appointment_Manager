# HealthFlow: Healthcare Appointment & Follow-up Manager

> **Production-Ready Full-Stack Healthcare Platform** featuring multi-role authentication (Patient, Doctor, Admin), AI-assisted pre-visit triage and post-visit summaries, transactional double-booking prevention, 5-minute atomic slot holds, doctor leave conflict resolution, automated background medication reminders, and Google Calendar OAuth 2.0 synchronization.

---

## 1. Project Overview

HealthFlow is an end-to-end healthcare appointment scheduling and clinical follow-up platform engineered for reliability, safety, and modern user experience. It addresses the critical challenges in modern clinic workflows:
- Eliminates double-booking collisions under high-concurrency race conditions using database transactions, unique multi-column constraints, and temporary atomic slot holds.
- Integrates Large Language Models (LLMs) with Google Gemini to provide pre-visit symptom triage (urgency scoring, chief complaint synthesis, targeted doctor questions) and post-visit clinical notes translation into patient-friendly care instructions.
- Provides doctor leave management with automated conflict detection, automatic appointment cancellations, and instant patient notification dispatch.
- Employs resilient background workers for slot hold expiration cleanups, exponential backoff email retries, and scheduled medication adherence reminders.
- Synchronizes consultations with Google Calendar via OAuth 2.0.

---

## 2. Features

### Patient Portal
- **Self-Registration & Secure Authentication**: JWT session management with bcrypt password hashing.
- **Doctor Search & Specialty Filtering**: Filter doctors by discipline, fee, and slot duration.
- **Real-Time Doctor Availability Calendar**: Dynamic slot computation accounting for working hours, leaves, and active holds.
- **Interactive Booking Flow**: 5-minute exclusive slot hold timer prevents simultaneous selection collisions.
- **Symptom Intake & AI Pre-Visit Triage**: Real-time evaluation of urgency levels (Low/Medium/High), chief complaints, and doctor questions.
- **Consultation Hub**: Track upcoming/past visits, view doctor clinical notes and diagnosis, and read AI patient-friendly care plans.
- **Interactive Rescheduling & Cancellation**: Reschedule or cancel with automated email updates.
- **Medication Adherence Center**: View active prescriptions, dosage instructions, and upcoming reminder schedules.

### Doctor Portal
- **Daily Patient Queue**: Immediate overview of today's appointments with urgency flags and AI triage previews.
- **Consultation Room**: Review patient symptoms, duration, severity, and AI-suggested clinical questions.
- **Diagnosis & Clinical Notes Editor**: Record physical exam observations and follow-up care steps.
- **Prescription Builder**: Dynamic medication rows (name, dosage, frequency, duration, instructions).
- **AI Post-Visit Summary Generator**: Translate complex clinical jargon into plain patient language with live preview & editing.
- **Automatic Reminder Job Creation**: Submitting a prescription automatically schedules background reminder emails for the patient.
- **Schedule Overview**: Review weekly working hours and approved leaves.

### Admin Portal
- **Executive KPI Analytics**: Live metrics for patients, active doctors, bookings, and notifications.
- **Doctor Directory Management**: Create doctor accounts, edit profiles, fees, slot durations, and active statuses.
- **Weekly Working Hours Configuration**: Day-by-day start/end times and availability toggles.
- **Doctor Leave Scheduler & Conflict Engine**: Mark leave periods with automatic identification & cancellation of conflicting appointments and instant patient notification dispatch.
- **Master Appointment Audit**: Search and filter all appointments across all doctors, patients, and statuses.

---

## 3. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Modern CSS System with Glassmorphism and CSS custom property design tokens.
- **Backend**: Node.js (v22), Express, TypeScript, Zod request validation, JWT, bcryptjs.
- **Database & ORM**: PostgreSQL / SQLite via Prisma ORM (Zero-configuration local SQLite execution + 100% PostgreSQL schema compatibility for cloud deployment).
- **AI Integration**: Google Gemini API (`@google/generative-ai`) with resilient heuristic fallback engine.
- **Email Service**: Nodemailer with database-backed asynchronous retry queue (supports SMTP and Ethereal preview capturing).
- **Google Calendar**: Google APIs (`googleapis`) OAuth 2.0 client.
- **Background Processing**: Multi-task interval scheduler running Slot Hold Cleaner, Email Retry Worker, and Medication Reminder Dispatcher.
- **Testing**: Vitest, Supertest (14 automated unit & concurrency tests).

---

## 4. Architecture

```
[ React 18 SPA (Vite + TypeScript) ]
                │  (REST / JWT Bearer)
[ Express API Layer + RBAC / Zod Middleware ]
    ├── Auth & Profile Controller
    ├── Booking & Slot Hold Controller
    ├── Doctor & Leave Controller
    └── AI & Calendar Controller
                │
[ Core Domain Service Layer ]
    ├── BookingService (ACID Transactions & Hold Lockouts)
    ├── LeaveService (Atomic Conflict Detection & Auto-Cancel)
    ├── LLMService (Gemini API with Fallback Heuristic Parser)
    ├── EmailService (Queue Transport & HTML Templates)
    ├── CalendarService (Google OAuth 2.0 & Sync)
    └── ReminderService (Medication Schedule Calculations)
                │
[ Relational Persistence Layer (Prisma ORM) ]
    ├── User, Patient, Doctor, DoctorWorkingHours, DoctorLeave
    ├── Appointment, SlotHold, SymptomSubmission, PreVisitSummary
    ├── Prescription, Medication, PostVisitSummary, MedicationReminder
    └── Notification, CalendarEvent
                ▲
[ Multi-Task Asynchronous Background Workers ]
    ├── Slot Hold Expiration Cleaner (Interval: 15s)
    ├── Exponential Backoff Email Retry Worker (Interval: 15s)
    └── Scheduled Medication Reminder Dispatcher (Interval: 15s)
```

---

## 5. Folder Structure

```
healthcare-appointment-manager/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, Database client
│   │   ├── controllers/        # Auth, Patient, Doctor, Admin, AI, Calendar
│   │   ├── middleware/         # Auth, RBAC, Validation, Error Handling
│   │   ├── routes/             # Express API routers
│   │   ├── services/           # Booking, Leave, LLM, Email, Calendar, Reminder
│   │   ├── workers/            # Hold cleaner, Email retry, Medication scheduler
│   │   ├── types/              # Domain interfaces and DTOs
│   │   ├── utils/              # JWT, Date & Slot calculation helpers
│   │   ├── app.ts              # Express setup & middleware
│   │   └── server.ts           # Server entrypoint & background workers boot
│   ├── prisma/
│   │   ├── schema.prisma       # Relational Prisma schema
│   │   └── seed.ts             # Comprehensive database seeder
│   ├── tests/                  # Concurrency, Slot Hold, Leave, LLM, Auth tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Badge, Modal, SlotHoldTimer
│   │   │   └── layout/         # Navbar, Footer, ProtectedRoute
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/
│   │   │   ├── public/         # Landing, Login, Register
│   │   │   ├── patient/        # Dashboard, Search, Profile, Booking, Details, Meds
│   │   │   ├── doctor/         # Dashboard, Consultation/Notes, Schedule
│   │   │   └── admin/          # Dashboard, Doctors, Leave, Appointments
│   │   ├── services/           # API fetch wrappers for all domains
│   │   ├── types/              # TypeScript interface definitions
│   │   ├── App.tsx             # Route declarations
│   │   ├── index.css           # Design tokens, typography, glassmorphism
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── .env.example                # Template environment variables
├── README.md                   # Exhaustive documentation
└── SYSTEM_DESIGN.md            # Concise architectural write-up
```

---

## 6. Prerequisites

- **Node.js**: Version `v18.0.0` or higher (tested on Node v22.11.0).
- **npm**: Version `9.0.0` or higher.
- **Git** (optional).

---

## 7. Installation

1. **Clone or navigate to the repository directory**:
   ```bash
   cd healthcare-appointment-manager
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 8. Environment Variables

Create `.env` in `backend/` (a template is provided at `.env.example`):

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (Prisma)
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_for_healthcare_system_min_32_chars!
JWT_EXPIRES_IN=7d

# LLM / AI Configuration (Google Gemini)
GEMINI_API_KEY=
AI_FALLBACK_MODE=true

# Email Service (Nodemailer)
EMAIL_PROVIDER=ethereal
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="HealthFlow Care <no-reply@healthflow.local>"

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback

# Background Workers
WORKER_INTERVAL_SECONDS=15
SLOT_HOLD_DURATION_MINUTES=5
```

---

## 9. Database Setup

1. Push schema to database and generate Prisma Client:
   ```bash
   cd backend
   npx prisma db push
   ```

2. Seed initial demo data (Admin, Doctors, Patients, Specializations, Working Hours, Sample Appointments):
   ```bash
   npm run prisma:seed
   ```

### Demo Accounts for Testing

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@healthmanager.local` | `Admin@12345` | Full system administrator |
| **Doctor** | `dr.sarah@healthmanager.local` | `Doctor@12345` | Cardiologist |
| **Doctor** | `dr.chen@healthmanager.local` | `Doctor@12345` | Dermatologist |
| **Doctor** | `dr.elena@healthmanager.local` | `Doctor@12345` | Neurologist |
| **Doctor** | `dr.marcus@healthmanager.local` | `Doctor@12345` | General Medicine |
| **Patient** | `john.doe@patient.local` | `Patient@12345` | Sample Patient (John Doe) |
| **Patient** | `emily.watson@patient.local` | `Patient@12345` | Sample Patient (Emily Watson) |

*(Quick-login buttons on the login page allow 1-click credential population).*

---

## 10. Database Schema

The database model is defined in `backend/prisma/schema.prisma` and encompasses:
- `User`: Base identity entity with email, role (`PATIENT`, `DOCTOR`, `ADMIN`), hashed password, contact fields.
- `Patient`: Demographics, emergency contact, medical history summary.
- `Doctor`: Specialization foreign key, medical license number, slot duration minutes, fee, active flag.
- `Specialization`: Name, description, icon.
- `DoctorWorkingHours`: Weekly schedule (days 0-6, start time, end time, availability).
- `DoctorLeave`: Start date, end date, reason.
- `SlotHold`: Atomic temporary reservation hold (expiresAt, status `ACTIVE`, `CONVERTED`, `EXPIRED`, `RELEASED`).
- `Appointment`: Date, start/end time, status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`), cancellation reason, calendar event IDs.
- `SymptomSubmission`: Raw symptoms, duration, severity, additional notes.
- `PreVisitSummary`: Urgency level (`Low`, `Medium`, `High`), chief complaint, suggested doctor questions JSON, AI raw response, status.
- `Prescription`: Diagnosis, clinical notes, follow-up instructions.
- `Medication`: Prescription foreign key, name, dosage, frequency, duration, instructions.
- `PostVisitSummary`: Patient-friendly summary text, structured medications JSON, follow-up recovery steps JSON.
- `MedicationReminder`: Scheduled recurring reminder job (frequency, start/end dates, nextScheduledAt, lastSentAt, active flag).
- `Notification`: Asynchronous email queue (recipient, type, subject, HTML content, status `PENDING`, `SENT`, `FAILED`, `RETRYING`, exponential retry count, error logs).
- `CalendarEvent`: External Google Calendar event tracking.

---

## 11. Running Backend

In `backend/`:
```bash
npm run dev
```
Backend API will start at `http://localhost:5000/api`.

---

## 12. Running Frontend

In `frontend/`:
```bash
npm run dev
```
Frontend development server will start at `http://localhost:5173`.

---

## 13. Running Background Workers

The background worker is automatically booted inside the backend server lifecycle (`backend/src/server.ts`) and runs every 15 seconds.
Workers executed in each cycle:
1. **Slot Hold Cleaner**: Identifies expired holds (`expiresAt <= NOW()`) and sets status to `EXPIRED`.
2. **Email Retry Worker**: Evaluates pending or retrying notifications, sending emails with exponential backoff.
3. **Medication Reminder Worker**: Evaluates due medication reminders (`nextScheduledAt <= NOW()`), enqueues reminder emails, and advances schedule timestamps.

---

## 14. API Documentation

### Authentication
- `POST /api/auth/register` — Register a new patient account.
- `POST /api/auth/login` — Authenticate user (Patient/Doctor/Admin) and receive JWT.
- `GET /api/auth/me` — Fetch current user profile with role relation.
- `POST /api/auth/logout` — Invalidate session.

### Patient Endpoints
- `GET /api/doctors` — Search and filter doctors by specialization and keyword.
- `GET /api/doctors/:id` — Get full doctor profile, working hours, and fees.
- `GET /api/doctors/:id/availability?date=YYYY-MM-DD` — Calculate doctor slots and hold statuses.
- `POST /api/appointments/hold-slot` — Reserve a 5-minute atomic slot hold.
- `POST /api/appointments` — Confirm appointment with symptoms and trigger AI triage.
- `GET /api/appointments` — List authenticated patient's appointments.
- `GET /api/appointments/:id` — Get appointment details, triage, and prescriptions.
- `PATCH /api/appointments/:id/cancel` — Cancel appointment.
- `PATCH /api/appointments/:id/reschedule` — Reschedule appointment to a new slot.
- `GET /api/patient/medications` — List active medication reminders and past prescriptions.

### Doctor Endpoints
- `GET /api/doctor/appointments` — List doctor's today, upcoming, and past appointments.
- `GET /api/doctor/appointments/:id` — Get appointment triage details.
- `POST /api/doctor/preview-summary` — Preview AI patient-friendly summary from clinical notes.
- `POST /api/doctor/appointments/:id/clinical-notes` — Save notes, prescription, and complete visit.
- `GET /api/doctor/schedule` — View doctor's working hours and leave records.

### Admin Endpoints
- `POST /api/admin/doctors` — Create new doctor user and profile.
- `PATCH /api/admin/doctors/:id` — Update doctor profile, fee, slot duration, status.
- `DELETE /api/admin/doctors/:id` — Deactivate doctor.
- `POST /api/admin/doctors/:id/working-hours` — Update weekly operating hours.
- `POST /api/admin/doctors/:id/leave` — Mark doctor on leave & resolve conflicts.
- `DELETE /api/admin/doctors/:id/leave/:leaveId` — Remove doctor leave.
- `GET /api/admin/appointments` — Audit list of all system appointments.
- `GET /api/admin/stats` — Platform KPI statistics.

### AI Endpoints
- `POST /api/ai/pre-visit-summary` — Direct symptom triage analysis endpoint.
- `POST /api/ai/post-visit-summary` — Direct clinical notes conversion endpoint.
- `POST /api/ai/retry-pre-visit/:appointmentId` — Re-trigger failed pre-visit AI triage.
- `POST /api/ai/retry-post-visit/:prescriptionId` — Re-trigger failed post-visit AI summary.

### Calendar Endpoints
- `GET /api/calendar/auth-url` — Get Google OAuth 2.0 authorization URL.
- `GET /api/calendar/callback` — OAuth 2.0 redirect callback handler.

---

## 15. LLM Setup

HealthFlow supports Google Gemini API.
1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Add the key to `backend/.env`:
   ```ini
   GEMINI_API_KEY=AIzaSy...
   ```
3. If no key is supplied, the built-in resilient heuristic triage parser operates automatically in fallback mode.

---

## 16. Exact LLM Prompts

### Pre-Visit Prompt
```text
Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>
```
**Expected Structured Output**:
```json
{
  "urgencyLevel": "Medium",
  "chiefComplaint": "A concise summary of the primary complaint",
  "suggestedQuestions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}
```

### Post-Visit Prompt
```text
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>
```
**Expected Structured Output**:
```json
{
  "summary": "Warm, easy-to-understand explanation of diagnosis and plan",
  "medications": [
    {
      "name": "Medication Name",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "7 days",
      "instructions": "Take with food"
    }
  ],
  "followUpSteps": [
    "Step 1",
    "Step 2"
  ]
}
```

---

## 17. Google Calendar OAuth 2.0 Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Calendar API**.
3. Configure OAuth Consent Screen.
4. Create **OAuth 2.0 Client ID** (Web Application).
5. Set Authorized Redirect URI to: `http://localhost:5000/api/calendar/callback`.
6. Add credentials to `backend/.env`:
   ```ini
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
   ```
*(In development mode without credentials, Google Calendar operations degrade gracefully and record simulated tracking IDs without breaking appointment bookings).*

---

## 18. Email Setup

HealthFlow supports Nodemailer with SMTP and Ethereal Email test accounts.
- By default, `EMAIL_PROVIDER=ethereal` creates a virtual test inbox where every sent email logs a preview URL to the terminal.
- For production, configure SMTP:
  ```ini
  EMAIL_PROVIDER=smtp
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your_sendgrid_key
  ```

---

## 19. Medication Reminder Architecture

1. Doctor completes a consultation with prescribed medications.
2. System inserts `Medication` records and initializes `MedicationReminder` jobs.
3. Next reminder is calculated based on frequency:
   - Once daily: 24h intervals
   - Twice daily: 12h intervals
   - Three times daily: 8h intervals
   - Every X hours: X-hour intervals
4. `MedicationReminderWorker` polls every 15 seconds:
   - Identifies reminders where `nextScheduledAt <= NOW()` and `endDate >= TODAY`.
   - Enqueues `MEDICATION_REMINDER` email to patient.
   - Advances `nextScheduledAt`.

---

## 20. Double-Booking Prevention Strategy

Double-booking prevention is enforced at three distinct layers:
1. **Relational Database Unique Constraint**: Compound unique index `@@unique([doctorId, appointmentDate, startTime])`.
2. **Atomic Transactional Isolation**: Booking operations run inside `prisma.$transaction`.
3. **5-Minute Slot Hold Lockout**: Atomic reservation holds prevent other users from selecting or confirming the same slot.

---

## 21. Slot Hold Mechanism

1. Calling `POST /api/appointments/hold-slot` checks availability and inserts an active `SlotHold` with `expiresAt = NOW() + 5 minutes`.
2. Other patients requesting this slot receive a `400 Conflict` error.
3. The patient has 5 minutes to submit symptoms and confirm.
4. On confirmation, hold is marked `CONVERTED`. Abandoned holds are released automatically by the `HoldCleanerWorker`.

---

## 22. Doctor Leave Conflict Handling

1. Admin submits leave dates `[startDate, endDate]`.
2. Availability queries immediately return 0 slots for those dates.
3. Database transaction identifies all existing `CONFIRMED` or `PENDING` appointments on those dates.
4. Updates their status to `CANCELLED` with reason `Doctor on leave: [Reason]`.
5. Automatically enqueues `DOCTOR_LEAVE_CANCELLED` email notifications to all affected patients.
6. Cancels external Google Calendar events.

---

## 23. Notification Retry & Failure Handling

1. All emails are inserted into the `Notification` table with `status = 'PENDING'`.
2. `EmailRetryWorker` processes pending notifications.
3. If transmission fails, retry count increments and next retry time is calculated with exponential backoff:
   $$\text{Delay} = 2^{\text{retryCount}} \times 15\text{s}$$
4. Notifications reaching `maxRetries = 5` are marked `FAILED`.

---

## 24. LLM Failure Handling

1. Zero downtime: API timeouts, rate limits, missing keys, or malformed JSON never crash the application or prevent booking.
2. If the API fails, the heuristic fallback parser evaluates emergency keywords to compute structured triage.
3. Summaries store status as `COMPLETED` or `FAILED` and support one-click retries.

---

## 25. Deployment Instructions

### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Set Root Directory to `frontend`.
2. Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Environment variable: `VITE_API_URL=https://your-backend.onrender.com`.

### Backend (Render / Railway / Fly.io)
1. Set Root Directory to `backend`.
2. Build Command: `npm run build && npx prisma db push && npm run prisma:seed`.
3. Start Command: `npm start`.
4. Set Environment Variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `DATABASE_URL=postgresql://user:password@host:5432/healthflow` (or persistent volume SQLite)
   - `JWT_SECRET=production_secret_key_32_chars`
   - `GEMINI_API_KEY=your_key`
   - `CLIENT_URL=https://your-frontend.vercel.app`

---

## 26. Troubleshooting

- **Slot showing as held**: Wait 5 minutes for the hold to expire or clean it via the background worker.
- **Email not received**: In development mode, check server logs for the Ethereal Email Preview URL.
- **Prisma schema sync**: Run `npx prisma db push` in `backend/`.
- **Port in use**: If port 5000 is occupied, set `PORT=5001` in `.env`.
