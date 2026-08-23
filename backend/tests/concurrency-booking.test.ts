import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database.js';
import bookingService from '../src/services/booking.service.js';
import bcrypt from 'bcryptjs';

describe('Double-Booking Concurrency & Prevention Engine', () => {
  let doctorId: string;
  let patient1Id: string;
  let patient2Id: string;
  let patient3Id: string;
  const testDate = '2027-01-15'; // A Friday
  const testTime = '11:00';

  beforeAll(async () => {
    // Setup test doctor
    const spec = await prisma.specialization.upsert({
      where: { name: 'Concurrency Testing Clinic' },
      create: { name: 'Concurrency Testing Clinic', description: 'Testing' },
      update: {},
    });

    const hash = await bcrypt.hash('Test@12345', 10);

    const docUser = await prisma.user.create({
      data: {
        email: `doc.concurrency.${Date.now()}@test.local`,
        passwordHash: hash,
        role: 'DOCTOR',
        firstName: 'Concurrency',
        lastName: 'Doctor',
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: docUser.id,
        specializationId: spec.id,
        licenseNumber: `LIC-CONCUR-${Date.now()}`,
        slotDurationMinutes: 30,
        consultationFee: 100,
        isActive: true,
      },
    });

    doctorId = doctor.id;

    // Add Friday working hours (day 5)
    await prisma.doctorWorkingHours.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    });

    // Create 3 test patients
    const createPatient = async (num: number) => {
      const u = await prisma.user.create({
        data: {
          email: `patient${num}.${Date.now()}@test.local`,
          passwordHash: hash,
          role: 'PATIENT',
          firstName: `Patient`,
          lastName: `${num}`,
        },
      });
      const p = await prisma.patient.create({ data: { userId: u.id } });
      return p.id;
    };

    patient1Id = await createPatient(1);
    patient2Id = await createPatient(2);
    patient3Id = await createPatient(3);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow exactly 1 patient to book when multiple simultaneous booking requests hit the exact same slot', async () => {
    // 3 simultaneous requests attempting to book Dr at testDate, testTime
    const bookingAttempts = [
      bookingService.confirmAppointment({
        doctorId,
        patientId: patient1Id,
        dateStr: testDate,
        startTime: testTime,
        symptoms: 'Patient 1 severe headache',
      }),
      bookingService.confirmAppointment({
        doctorId,
        patientId: patient2Id,
        dateStr: testDate,
        startTime: testTime,
        symptoms: 'Patient 2 mild dizziness',
      }),
      bookingService.confirmAppointment({
        doctorId,
        patientId: patient3Id,
        dateStr: testDate,
        startTime: testTime,
        symptoms: 'Patient 3 general checkup',
      }),
    ];

    const results = await Promise.allSettled(bookingAttempts);

    const successful = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed
    expect(successful.length).toBe(1);
    // Exactly 2 must be rejected with conflict errors
    expect(rejected.length).toBe(2);

    // Verify in database: only 1 appointment exists for this doctor/date/time
    const apptsInDb = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(Date.UTC(2027, 0, 15)),
        startTime: testTime,
      },
    });

    expect(apptsInDb.length).toBe(1);
    expect(apptsInDb[0].status).toBe('CONFIRMED');
  });

  it('should prevent booking on a slot that is already booked', async () => {
    // Attempting to book again on the same slot must fail immediately
    await expect(
      bookingService.confirmAppointment({
        doctorId,
        patientId: patient2Id,
        dateStr: testDate,
        startTime: testTime,
        symptoms: 'Another attempt',
      })
    ).rejects.toThrow();
  });
});
