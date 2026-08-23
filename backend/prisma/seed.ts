import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clean existing tables (in order of FK dependencies)
  await prisma.calendarEvent.deleteMany();
  await prisma.medicationReminder.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.postVisitSummary.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.preVisitSummary.deleteMany();
  await prisma.symptomSubmission.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorWorkingHours.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@12345', saltRounds);
  const doctorPasswordHash = await bcrypt.hash('Doctor@12345', saltRounds);
  const patientPasswordHash = await bcrypt.hash('Patient@12345', saltRounds);

  // 1. Create Specializations
  const cardio = await prisma.specialization.create({
    data: {
      name: 'Cardiology',
      description: 'Comprehensive heart, cardiovascular, and blood pressure care.',
      icon: 'HeartPulse',
    },
  });

  const derma = await prisma.specialization.create({
    data: {
      name: 'Dermatology',
      description: 'Advanced skin, hair, nail diagnostics and laser therapies.',
      icon: 'Sparkles',
    },
  });

  const neuro = await prisma.specialization.create({
    data: {
      name: 'Neurology',
      description: 'Disorders of the brain, spinal cord, nerves, and migraines.',
      icon: 'Brain',
    },
  });

  const general = await prisma.specialization.create({
    data: {
      name: 'General Medicine',
      description: 'Primary care, preventive health screenings, and wellness checks.',
      icon: 'Stethoscope',
    },
  });

  const ortho = await prisma.specialization.create({
    data: {
      name: 'Orthopedics',
      description: 'Musculoskeletal care, joint treatments, and sports injuries.',
      icon: 'Activity',
    },
  });

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@healthmanager.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1-555-0100',
    },
  });

  console.log(`✅ Created Admin: ${adminUser.email}`);

  // 3. Create Doctors
  const doctorsData = [
    {
      email: 'dr.sarah@healthmanager.local',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1-555-0111',
      specializationId: cardio.id,
      licenseNumber: 'MD-CARD-88412',
      bio: 'Board-certified Cardiologist with 14+ years of clinical excellence in preventive cardiology, hypertension, and arrhythmia management.',
      slotDurationMinutes: 30,
      consultationFee: 120.0,
    },
    {
      email: 'dr.chen@healthmanager.local',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1-555-0122',
      specializationId: derma.id,
      licenseNumber: 'MD-DERM-44910',
      bio: 'Specialist in clinical dermatology, inflammatory skin conditions, eczema, and skin cancer screenings.',
      slotDurationMinutes: 30,
      consultationFee: 95.0,
    },
    {
      email: 'dr.elena@healthmanager.local',
      firstName: 'Elena',
      lastName: 'Rostova',
      phone: '+1-555-0133',
      specializationId: neuro.id,
      licenseNumber: 'MD-NEUR-77218',
      bio: 'Neurologist with focus on chronic headache disorders, neuropathies, and cognitive health.',
      slotDurationMinutes: 45,
      consultationFee: 150.0,
    },
    {
      email: 'dr.marcus@healthmanager.local',
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1-555-0144',
      specializationId: general.id,
      licenseNumber: 'MD-GENM-31998',
      bio: 'Dedicated primary care physician passionate about holistic lifestyle medicine and preventive care.',
      slotDurationMinutes: 30,
      consultationFee: 75.0,
    },
  ];

  const createdDoctors = [];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash: doctorPasswordHash,
        role: 'DOCTOR',
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specializationId: doc.specializationId,
        licenseNumber: doc.licenseNumber,
        bio: doc.bio,
        slotDurationMinutes: doc.slotDurationMinutes,
        consultationFee: doc.consultationFee,
        isActive: true,
      },
    });

    // Create standard working hours Monday - Friday (09:00 - 17:00)
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorWorkingHours.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      });
    }

    // Saturday half-day (09:00 - 13:00)
    await prisma.doctorWorkingHours.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: 6,
        startTime: '09:00',
        endTime: '13:00',
        isAvailable: true,
      },
    });

    createdDoctors.push(doctor);
    console.log(`✅ Created Doctor: Dr. ${doc.firstName} ${doc.lastName} (${doc.email})`);
  }

  // 4. Create Patients
  const patientUsers = [
    {
      email: 'john.doe@patient.local',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0191',
      dateOfBirth: new Date('1988-05-14'),
      gender: 'Male',
      emergencyContact: 'Jane Doe (+1-555-0199)',
      medicalHistorySummary: 'Mild seasonal allergies. No known drug allergies.',
    },
    {
      email: 'emily.watson@patient.local',
      firstName: 'Emily',
      lastName: 'Watson',
      phone: '+1-555-0182',
      dateOfBirth: new Date('1994-11-20'),
      gender: 'Female',
      emergencyContact: 'David Watson (+1-555-0188)',
      medicalHistorySummary: 'Asthma (controlled). Penicillin allergy.',
    },
  ];

  const createdPatients = [];

  for (const p of patientUsers) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: patientPasswordHash,
        role: 'PATIENT',
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        emergencyContact: p.emergencyContact,
        medicalHistorySummary: p.medicalHistorySummary,
      },
    });

    createdPatients.push(patient);
    console.log(`✅ Created Patient: ${p.firstName} ${p.lastName} (${p.email})`);
  }

  // 5. Create Sample Appointment with AI Summaries & Prescription
  const today = new Date();
  const appointmentDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0));

  const sampleAppointment = await prisma.appointment.create({
    data: {
      doctorId: createdDoctors[0].id, // Dr. Sarah Jenkins
      patientId: createdPatients[0].id, // John Doe
      appointmentDate: appointmentDate,
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
    },
  });

  await prisma.symptomSubmission.create({
    data: {
      appointmentId: sampleAppointment.id,
      rawSymptoms: 'Elevated resting heart rate, mild palpitation episodes in the evening for the past 4 days. No shortness of breath or dizziness.',
      duration: '4 days',
      severity: 'Moderate',
      additionalNotes: 'Occurs mostly after drinking coffee or during late work sessions.',
    },
  });

  await prisma.preVisitSummary.create({
    data: {
      appointmentId: sampleAppointment.id,
      urgencyLevel: 'Medium',
      chiefComplaint: 'Palpitations and tachycardia episodes over 4 days',
      suggestedQuestions: JSON.stringify([
        'How many cups of caffeinated beverages do you consume daily?',
        'Have you noticed any chest tightness, shortness of breath, or dizziness during palpitations?',
        'Is there any family history of cardiac arrhythmias or thyroid abnormalities?',
      ]),
      rawAiResponse: 'Generated during triage intake.',
      status: 'COMPLETED',
    },
  });

  // Create a past completed appointment with prescription & medication reminders
  const pastDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 3, 0, 0, 0));
  const pastAppointment = await prisma.appointment.create({
    data: {
      doctorId: createdDoctors[3].id, // Dr. Marcus Vance
      patientId: createdPatients[0].id, // John Doe
      appointmentDate: pastDate,
      startTime: '14:00',
      endTime: '14:30',
      status: 'COMPLETED',
    },
  });

  await prisma.symptomSubmission.create({
    data: {
      appointmentId: pastAppointment.id,
      rawSymptoms: 'Dry cough, sore throat, mild low-grade fever for 2 days.',
      duration: '2 days',
      severity: 'Mild',
    },
  });

  const prescription = await prisma.prescription.create({
    data: {
      appointmentId: pastAppointment.id,
      doctorId: createdDoctors[3].id,
      patientId: createdPatients[0].id,
      diagnosis: 'Acute Upper Respiratory Tract Infection (Viral Pharyngitis)',
      clinicalNotes: 'Patient presents with erythematous pharynx without tonsillar exudates. Lungs clear to auscultation bilaterally. Vital signs stable. Prescribed symptomatic relief and supportive hydration.',
      followUpInstructions: 'Return in 5 days if fever persists above 38.5C or if productive purulent sputum develops.',
    },
  });

  const med1 = await prisma.medication.create({
    data: {
      prescriptionId: prescription.id,
      name: 'Acetaminophen (Paracetamol)',
      dosage: '500mg',
      frequency: 'Every 8 hours as needed',
      duration: '5 days',
      instructions: 'Take with full glass of water. Do not exceed 3000mg daily.',
    },
  });

  const med2 = await prisma.medication.create({
    data: {
      prescriptionId: prescription.id,
      name: 'Dextromethorphan HBr Syrup',
      dosage: '10ml',
      frequency: 'Twice daily',
      duration: '4 days',
      instructions: 'Take after meals for persistent dry cough.',
    },
  });

  await prisma.postVisitSummary.create({
    data: {
      prescriptionId: prescription.id,
      summaryText: 'You were evaluated for a common viral throat and cough infection. Your lungs are clear and your vitals are stable. You have been prescribed medication to ease your fever and throat discomfort.',
      followUpSteps: JSON.stringify([
        'Get plenty of rest and drink at least 2-3 liters of fluids daily.',
        'Take Acetaminophen 500mg every 8 hours if you experience body aches or fever.',
        'Contact the clinic if fever exceeds 38.5C or if symptoms worsen after 5 days.',
      ]),
      structuredMedications: JSON.stringify([
        {
          name: 'Acetaminophen (Paracetamol)',
          dosage: '500mg',
          frequency: 'Every 8 hours as needed',
          duration: '5 days',
          instructions: 'Take with water. Max 3000mg/day.',
        },
        {
          name: 'Dextromethorphan HBr Syrup',
          dosage: '10ml',
          frequency: 'Twice daily',
          duration: '4 days',
          instructions: 'Take after meals.',
        },
      ]),
      status: 'COMPLETED',
    },
  });

  // Create active medication reminder
  await prisma.medicationReminder.create({
    data: {
      medicationId: med1.id,
      patientId: createdPatients[0].id,
      frequency: 'Every 8 hours',
      startDate: new Date(today.getTime() - 86400000),
      endDate: new Date(today.getTime() + 4 * 86400000),
      nextScheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
      isActive: true,
    },
  });

  console.log('🎉 Database seeding completed successfully!');
  console.log('==================================================');
  console.log('DEMO ACCOUNTS READY:');
  console.log('1. Admin:   admin@healthmanager.local      / Admin@12345');
  console.log('2. Doctor:  dr.sarah@healthmanager.local   / Doctor@12345');
  console.log('3. Doctor:  dr.chen@healthmanager.local    / Doctor@12345');
  console.log('4. Doctor:  dr.elena@healthmanager.local   / Doctor@12345');
  console.log('5. Doctor:  dr.marcus@healthmanager.local  / Doctor@12345');
  console.log('6. Patient: john.doe@patient.local         / Patient@12345');
  console.log('7. Patient: emily.watson@patient.local     / Patient@12345');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
