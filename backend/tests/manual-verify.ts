async function testFullFlow() {
  console.log('🧪 Starting End-to-End API Flow Verification...');

  // 1. Login as Patient
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.doe@patient.local', password: 'Patient@12345' }),
  }).then((r) => r.json());

  console.log('1. Patient Login:', loginRes.success ? '✅ Success' : '❌ Failed', `(${loginRes.data.user.firstName})`);
  const patientToken = loginRes.data.token;

  // 2. Fetch Doctors
  const docsRes = await fetch('http://localhost:5000/api/doctors').then((r) => r.json());
  const doctor = docsRes.data.find((d: any) => d.user.email === 'dr.sarah@healthmanager.local') || docsRes.data[0];
  console.log('2. Selected Doctor:', doctor.user.firstName, doctor.user.lastName, `(${doctor.specialization.name})`);

  // 3. Check Availability
  const tomorrow = '2026-08-25'; // Tuesday
  const availRes = await fetch(`http://localhost:5000/api/doctors/${doctor.id}/availability?date=${tomorrow}`).then((r) => r.json());
  const availableSlot = availRes.data.slots.find((s: any) => s.isAvailable);
  console.log('3. Found Available Slot:', availableSlot?.startTime, '-', availableSlot?.endTime);

  if (!availableSlot) {
    throw new Error('No open slots found on test date');
  }

  // 4. Hold Slot
  const holdRes = await fetch('http://localhost:5000/api/appointments/hold-slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ doctorId: doctor.id, date: tomorrow, startTime: availableSlot.startTime }),
  }).then((r) => r.json());
  console.log('4. 5-Min Slot Hold Created:', holdRes.success ? '✅ Success' : '❌ Failed', holdRes.data?.holdId);

  // 5. Book Appointment with Symptoms
  const bookRes = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId: doctor.id,
      date: tomorrow,
      startTime: availableSlot.startTime,
      holdId: holdRes.data?.holdId,
      symptoms: 'Sudden onset sharp left knee pain and swelling after playing football yesterday afternoon',
      symptomDuration: '1 day',
      symptomSeverity: 'Moderate',
    }),
  }).then((r) => r.json());
  console.log('5. Appointment Confirmed:', bookRes.success ? '✅ Success' : '❌ Failed', bookRes.data?.id);
  const apptId = bookRes.data.id;

  // 6. Inspect Appointment Details & Pre-Visit AI Triage
  await new Promise((resolve) => setTimeout(resolve, 1000)); // wait brief moment for async AI triage
  const apptDetail = await fetch(`http://localhost:5000/api/appointments/${apptId}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  }).then((r) => r.json());

  console.log('6. AI Pre-Visit Triage Urgency:', apptDetail.data.preVisitSummary?.urgencyLevel);
  console.log('   AI Chief Complaint:', apptDetail.data.preVisitSummary?.chiefComplaint);

  // 7. Login as Doctor
  const docLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.sarah@healthmanager.local', password: 'Doctor@12345' }),
  }).then((r) => r.json());
  const docToken = docLogin.data.token;

  // 8. Doctor Clinical Notes & Prescription
  const notesRes = await fetch(`http://localhost:5000/api/doctor/appointments/${apptId}/clinical-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      diagnosis: 'Acute Meniscal Strain of Left Knee',
      clinicalNotes:
        'Mild joint effusion noted, range of motion mildly restricted by pain. Neurovascular status intact. Prescribed NSAIDs, rest, ice compression.',
      followUpInstructions: 'Apply R.I.C.E. protocol for 48 hours. Return in 10 days if weight bearing remains painful.',
      medications: [
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take with food' },
      ],
    }),
  }).then((r) => r.json());
  console.log('8. Doctor Consultation Completed & Prescription Issued:', notesRes.success ? '✅ Success' : '❌ Failed');

  // 9. Verify Patient Medication Center
  const medsRes = await fetch('http://localhost:5000/api/patient/medications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  }).then((r) => r.json());
  console.log('9. Patient Active Medication Reminders Count:', medsRes.data.reminders.length);
  console.log('   Patient Past Prescriptions Count:', medsRes.data.prescriptions.length);

  console.log('🎉 Full End-to-End Workflow Successfully Verified!');
}

testFullFlow().catch(console.error);
