import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database.js';
import bookingService from '../src/services/booking.service.js';
import { runHoldCleaner } from '../src/workers/holdCleaner.worker.js';
import bcrypt from 'bcryptjs';

describe('Slot Hold Mechanism & Expiration Engine', () => {
  let doctorId: string;
  let patient1Id: string;
  let patient2Id: string;
  const testDate = '2027-02-12'; // Friday
  const testTime = '14:00';

  beforeAll(async () => {
    const spec = await prisma.specialization.upsert({
      where: { name: 'Hold Testing Clinic' },
      create: { name: 'Hold Testing Clinic', description: 'Testing' },
      update: {},
    });

    const hash = await bcrypt.hash('Test@12345', 10);
    const docUser = await prisma.user.create({
      data: {
        email: `doc.hold.${Date.now()}@test.local`,
        passwordHash: hash,
        role: 'DOCTOR',
        firstName: 'Hold',
        lastName: 'Tester',
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: docUser.id,
        specializationId: spec.id,
        licenseNumber: `LIC-HOLD-${Date.now()}`,
        slotDurationMinutes: 30,
        consultationFee: 80,
        isActive: true,
      },
    });

    doctorId = doctor.id;

    await prisma.doctorWorkingHours.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    });

    const u1 = await prisma.user.create({
      data: { email: `p1.hold.${Date.now()}@test.local`, passwordHash: hash, role: 'PATIENT', firstName: 'P1', lastName: 'Test' },
    });
    const p1 = await prisma.patient.create({ data: { userId: u1.id } });
    patient1Id = p1.id;

    const u2 = await prisma.user.create({
      data: { email: `p2.hold.${Date.now()}@test.local`, passwordHash: hash, role: 'PATIENT', firstName: 'P2', lastName: 'Test' },
    });
    const p2 = await prisma.patient.create({ data: { userId: u2.id } });
    patient2Id = p2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully hold a slot and show slot as HELD in availability', async () => {
    const hold = await bookingService.holdSlot({
      doctorId,
      patientId: patient1Id,
      dateStr: testDate,
      startTime: testTime,
    });

    expect(hold).toBeDefined();
    expect(hold.holdId).toBeDefined();

    // Check availability
    const avail = await bookingService.getDoctorAvailability(doctorId, testDate);
    const heldSlot = avail.slots.find((s) => s.startTime === testTime);
    expect(heldSlot).toBeDefined();
    expect(heldSlot?.isAvailable).toBe(false);
    expect(heldSlot?.status).toBe('HELD');
  });

  it('should block another patient from holding or booking the currently held slot', async () => {
    // Patient 2 attempts to hold the same slot
    await expect(
      bookingService.holdSlot({
        doctorId,
        patientId: patient2Id,
        dateStr: testDate,
        startTime: testTime,
      })
    ).rejects.toThrow(/held by another patient/i);
  });

  it('should automatically release expired holds when hold cleaner worker runs', async () => {
    // Manually expire the hold in DB
    await prisma.slotHold.updateMany({
      where: { doctorId, startTime: testTime },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    // Run hold cleaner worker
    const cleaned = await runHoldCleaner();
    expect(cleaned).toBeGreaterThanOrEqual(1);

    // Slot should now be available again for Patient 2
    const avail = await bookingService.getDoctorAvailability(doctorId, testDate);
    const slot = avail.slots.find((s) => s.startTime === testTime);
    expect(slot?.isAvailable).toBe(true);
    expect(slot?.status).toBe('AVAILABLE');

    // Patient 2 can now hold the slot
    const newHold = await bookingService.holdSlot({
      doctorId,
      patientId: patient2Id,
      dateStr: testDate,
      startTime: testTime,
    });
    expect(newHold.holdId).toBeDefined();
  });
});
