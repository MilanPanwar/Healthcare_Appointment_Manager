import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database.js';
import bookingService from '../src/services/booking.service.js';
import leaveService from '../src/services/leave.service.js';
import bcrypt from 'bcryptjs';

describe('Doctor Leave Management & Conflict Resolution', () => {
  let doctorId: string;
  let patientId: string;
  const leaveDateStr = '2027-03-19'; // Friday

  beforeAll(async () => {
    const spec = await prisma.specialization.upsert({
      where: { name: 'Leave Testing Clinic' },
      create: { name: 'Leave Testing Clinic', description: 'Testing' },
      update: {},
    });

    const hash = await bcrypt.hash('Test@12345', 10);
    const docUser = await prisma.user.create({
      data: {
        email: `doc.leave.${Date.now()}@test.local`,
        passwordHash: hash,
        role: 'DOCTOR',
        firstName: 'Leave',
        lastName: 'Doctor',
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: docUser.id,
        specializationId: spec.id,
        licenseNumber: `LIC-LEAVE-${Date.now()}`,
        slotDurationMinutes: 30,
        consultationFee: 75,
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

    const u = await prisma.user.create({
      data: { email: `p.leave.${Date.now()}@test.local`, passwordHash: hash, role: 'PATIENT', firstName: 'Leave', lastName: 'Patient' },
    });
    const p = await prisma.patient.create({ data: { userId: u.id } });
    patientId = p.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should auto-cancel existing appointments and enqueue notifications when doctor is placed on leave', async () => {
    // 1. Create a confirmed appointment on leaveDateStr
    const appt = await bookingService.confirmAppointment({
      doctorId,
      patientId,
      dateStr: leaveDateStr,
      startTime: '10:00',
      symptoms: 'Patient booked before doctor announced leave',
    });

    expect(appt.status).toBe('CONFIRMED');

    // 2. Admin marks doctor on leave on this date
    const leaveResult = await leaveService.setDoctorLeave({
      doctorId,
      startDateStr: leaveDateStr,
      endDateStr: leaveDateStr,
      reason: 'Attending cardiology conference',
    });

    expect(leaveResult.affectedAppointmentsCount).toBe(1);
    expect(leaveResult.cancelledAppointmentIds).toContain(appt.id);

    // 3. Verify appointment status is updated to CANCELLED in DB
    const refreshedAppt = await prisma.appointment.findUnique({
      where: { id: appt.id },
    });
    expect(refreshedAppt?.status).toBe('CANCELLED');
    expect(refreshedAppt?.cancellationReason).toContain('Doctor on leave');

    // 4. Verify DOCTOR_LEAVE_CANCELLED notification is enqueued in DB
    const notification = await prisma.notification.findFirst({
      where: {
        type: 'DOCTOR_LEAVE_CANCELLED',
        subject: { contains: leaveDateStr },
      },
    });
    expect(notification).toBeDefined();

    // 5. Verify availability shows isOnLeave = true and zero slots
    const avail = await bookingService.getDoctorAvailability(doctorId, leaveDateStr);
    expect(avail.isOnLeave).toBe(true);
    expect(avail.slots.length).toBe(0);

    // 6. Verify new booking attempts on this date are rejected
    await expect(
      bookingService.confirmAppointment({
        doctorId,
        patientId,
        dateStr: leaveDateStr,
        startTime: '14:00',
        symptoms: 'Attempting to book during leave',
      })
    ).rejects.toThrow();
  });
});
