# HealthFlow: System Design & Architecture

HealthFlow is an enterprise-grade full-stack healthcare appointment and clinical follow-up manager engineered for zero-collision scheduling, resilient asynchronous job processing, and fail-safe AI triage.

---

## 1. Overall System Architecture

The system utilizes a clean layered architecture with separation between representation, business domains, data persistence, and asynchronous worker runtimes:

```
[ React 18 SPA + Modern CSS Tokens ]
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

## 2. Double-Booking Prevention Strategy

Double-booking prevention is enforced at three distinct layers:

1. **Database Constraint Layer**: A strict compound unique index `UNIQUE(doctorId, appointmentDate, startTime)` guarantees at the relational engine level that duplicate non-cancelled appointments cannot physically co-exist.
2. **Transaction Isolation & Atomic Validation Layer**: All booking logic executes inside `prisma.$transaction`. Before insertion, the engine queries for existing active bookings (`status IN ('PENDING', 'CONFIRMED', 'COMPLETED')`). If a concurrent transaction commits first, subsequent attempts immediately throw a conflict exception.
3. **5-Minute Slot Hold Lockout**: When a patient selects an available slot, an atomic `SlotHold` record is created. Active holds by other users prevent selection, eliminating race conditions during data entry.

---

## 3. Slot Hold Mechanism

To ensure a seamless user experience while preventing race conditions:

1. **Reservation**: Calling `POST /api/appointments/hold-slot` validates that the doctor is active, within working hours, not on leave, and free of conflicting holds or bookings.
2. **State & Expiration**: An active hold stores `expiresAt = NOW() + 5 minutes`. Frontend displays a live countdown timer.
3. **Conflict Isolation**: Other patients requesting the same slot receive an immediate `400 Conflict` response.
4. **Conversion / Expiration**:
   - On booking confirmation, the hold is marked `CONVERTED`.
   - If abandoned, the `HoldCleanerWorker` background task polls every 15 seconds, releasing expired holds back to the available pool.

---

## 4. Doctor Leave Conflict Handling

When Clinic Administration marks a doctor on leave for a date range `[startDate, endDate]`:

1. **Future Slot Invalidation**: Availability queries dynamically evaluate `DoctorLeave` ranges, returning `isOnLeave: true` and 0 slots.
2. **Atomic Conflicting Appointment Cancellation**:
   - The system queries all `CONFIRMED` or `PENDING` appointments within the leave window.
   - Updates status to `CANCELLED` with reason `Doctor on leave: [Reason]`.
3. **Automated Patient Notification & Calendar Sync**:
   - High-priority `DOCTOR_LEAVE_CANCELLED` email notifications are enqueued for each patient with one-click rebooking instructions.
   - Synchronized Google Calendar events are cancelled.
   - Active slot holds in the date range are marked `RELEASED`.

---

## 5. Notification Failure & Exponential Backoff Handling

Email notifications follow an asynchronous outbox pattern:

1. **Transactional Enqueueing**: All notification requests are inserted into the `Notification` table with `status = 'PENDING'`, `retryCount = 0`, and `maxRetries = 5`.
2. **Non-Blocking Execution**: Core business actions (booking, leave scheduling, clinical note submission) complete immediately without waiting for SMTP transport.
3. **Exponential Backoff Worker**: The `EmailRetryWorker` continuously checks for pending or retrying notifications where `nextRetryAt <= NOW()`. On failure, the retry timestamp increases exponentially:
   $$\text{Delay} = 2^{\text{retryCount}} \times 15\text{ seconds}$$
4. **Permanent Failure Isolation**: Notifications reaching `maxRetries` are marked `FAILED` with sanitized error logs.

---

## 6. LLM Failure Handling & Resilience

The `LLMService` integrates with Google Gemini API while providing fail-safe operation:

1. **Zero Downtime on AI Failure**: Network timeouts, missing API keys, rate limits, or malformed JSON never crash the application or prevent appointment booking.
2. **Structured Output Validation**: Raw AI responses are sanitized, stripped of markdown fences, and validated against Zod schemas.
3. **Resilient Fallback Engine**: If the LLM provider fails, an intelligent heuristic triage engine analyzes symptoms (evaluating emergency trigger keywords like *chest pain*, *fever*, *shortness of breath*) to assign urgency levels and clinical inquiries.
4. **Audit Status & On-Demand Retries**: AI records store `status = 'COMPLETED'` or `'FAILED'`. Endpoints `POST /api/ai/retry-pre-visit/:id` and `POST /api/ai/retry-post-visit/:id` allow immediate retry once connectivity recovers.
