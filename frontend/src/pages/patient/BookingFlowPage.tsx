import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { aiService } from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { Doctor, TimeSlot, DoctorAvailability } from '../../types';
import { SlotHoldTimer } from '../../components/common/SlotHoldTimer';
import { UrgencyBadge } from '../../components/common/Badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  ShieldCheck,
  Brain,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const BookingFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctorId') || '';
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Wizard Steps: 1: Select Doctor & Date/Slot, 2: Symptoms & AI Review, 3: Success Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Doctors & Selection
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Date & Availability
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowStr());
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Hold State
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Symptoms & AI Pre-visit Triage
  const [symptoms, setSymptoms] = useState<string>('');
  const [symptomDuration, setSymptomDuration] = useState<string>('3 days');
  const [symptomSeverity, setSymptomSeverity] = useState<string>('Moderate');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [aiPreview, setAiPreview] = useState<{
    urgencyLevel: 'Low' | 'Medium' | 'High';
    chiefComplaint: string;
    suggestedQuestions: string[];
  } | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedApptId, setConfirmedApptId] = useState<string | null>(null);

  // Fetch all active doctors
  useEffect(() => {
    patientService.getDoctors().then((res) => {
      if (res.success) {
        setDoctors(res.data);
        if (!selectedDoctorId && res.data.length > 0) {
          setSelectedDoctorId(res.data[0].id);
        }
      }
    });
  }, []);

  // Update selected doctor object
  useEffect(() => {
    if (selectedDoctorId && doctors.length > 0) {
      const doc = doctors.find((d) => d.id === selectedDoctorId) || null;
      setSelectedDoctor(doc);
    }
  }, [selectedDoctorId, doctors]);

  // Load availability when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      setHoldId(null);
      setHoldExpiresAt(null);

      patientService
        .getDoctorAvailability(selectedDoctorId, selectedDate)
        .then((res) => {
          if (res.success) setAvailability(res.data);
        })
        .catch((err) => {
          console.error('Availability fetch error:', err);
          setAvailability(null);
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDoctorId, selectedDate]);

  // Handle slot hold reservation (Prevents double booking)
  const handleSlotSelect = async (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    setIsHolding(true);

    try {
      const res = await patientService.holdSlot({
        doctorId: selectedDoctorId,
        date: selectedDate,
        startTime: slot.startTime,
      });

      if (res.success) {
        setSelectedSlot(slot);
        setHoldId(res.data.holdId);
        setHoldExpiresAt(res.data.expiresAt);
        addToast('success', `Slot ${slot.startTime} reserved for 5 minutes!`, 'Slot Reserved');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Slot is no longer available.', 'Slot Unavailable');
      // Refresh availability
      if (selectedDoctorId && selectedDate) {
        patientService.getDoctorAvailability(selectedDoctorId, selectedDate).then((r) => {
          if (r.success) setAvailability(r.data);
        });
      }
    } finally {
      setIsHolding(false);
    }
  };

  // Run AI symptom analysis preview
  const handleAnalyzeSymptoms = async () => {
    if (!symptoms || symptoms.length < 5) {
      addToast('warning', 'Please provide a clear description of your symptoms (at least 5 characters).');
      return;
    }

    setIsAnalyzingAI(true);
    try {
      const res = await aiService.analyzeSymptoms(symptoms);
      if (res.success) {
        setAiPreview(res.data);
      }
    } catch (err) {
      console.warn('AI Triage fallback mode:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Final confirmation
  const handleConfirmAppointment = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot || !symptoms) {
      addToast('error', 'Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await patientService.bookAppointment({
        doctorId: selectedDoctorId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        holdId: holdId || undefined,
        symptoms,
        symptomDuration,
        symptomSeverity,
        additionalNotes,
      });

      if (res.success) {
        setConfirmedApptId(res.data.id);
        setCurrentStep(3);
        addToast('success', 'Appointment successfully confirmed!', 'Booking Confirmed');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to confirm booking.', 'Booking Conflict');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Wizard Progress Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep >= 1 ? 1 : 0.4 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? '#0284c7' : '#cbd5e1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            1
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Select Doctor & Slot</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep >= 2 ? 1 : 0.4 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? '#0284c7' : '#cbd5e1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            2
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Symptoms & AI Triage</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep >= 3 ? 1 : 0.4 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep === 3 ? '#16a34a' : '#cbd5e1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            3
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Confirmed</span>
        </div>
      </div>

      {/* STEP 1: Select Doctor, Date & Time Slot */}
      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Doctor Picker */}
          <div className="glass-card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Choose Medical Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
              }}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} — {d.specialization.name} (${d.consultationFee.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker & Availability View */}
          <div className="glass-card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                Consultation Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              />
            </div>

            {/* Slots Grid */}
            {isLoadingSlots ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Computing doctor availability...
              </div>
            ) : availability?.isOnLeave ? (
              <div
                style={{
                  padding: '18px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#b91c1c',
                  fontSize: '14px',
                }}
              >
                <strong>Doctor Unavailable:</strong> Dr. {selectedDoctor?.user.lastName} is on approved leave on this date ({availability.leaveReason || 'Leave'}). Please select an alternate date.
              </div>
            ) : !availability?.isWorkingDay ? (
              <div
                style={{
                  padding: '18px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  color: '#64748b',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                Doctor is not scheduled to work on this day of the week. Please select a working weekday or Saturday morning.
              </div>
            ) : availability?.slots.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No available slots on this date.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Available Time Slots ({selectedDoctor?.slotDurationMinutes} mins each):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {availability?.slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;

                    let bg = '#f0fdf4';
                    let border = '#86efac';
                    let color = '#15803d';

                    if (slot.status === 'BOOKED') {
                      bg = '#f1f5f9';
                      border = '#e2e8f0';
                      color = '#94a3b8';
                    } else if (slot.status === 'HELD') {
                      bg = '#fef3c7';
                      border = '#fde68a';
                      color = '#b45309';
                    }

                    if (isSelected) {
                      bg = '#0284c7';
                      border = '#0284c7';
                      color = '#ffffff';
                    }

                    return (
                      <button
                        key={slot.startTime}
                        disabled={!slot.isAvailable && !isSelected}
                        onClick={() => handleSlotSelect(slot)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '10px',
                          border: `1px solid ${border}`,
                          backgroundColor: bg,
                          color: color,
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: slot.isAvailable || isSelected ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                          transform: isSelected ? 'scale(1.04)' : 'none',
                          boxShadow: isSelected ? '0 4px 10px rgba(2, 132, 199, 0.3)' : 'none',
                        }}
                      >
                        <span>{slot.startTime}</span>
                        <span style={{ fontSize: '10px', opacity: 0.85 }}>
                          {slot.status === 'BOOKED' ? 'Booked' : slot.status === 'HELD' && !isSelected ? 'Held' : 'Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Slot Hold Timer Indicator */}
          {holdExpiresAt && (
            <SlotHoldTimer
              expiresAt={holdExpiresAt}
              onExpire={() => {
                setHoldId(null);
                setSelectedSlot(null);
                addToast('warning', 'Slot reservation expired. Please pick a slot again.');
              }}
            />
          )}

          {/* Next Button */}
          <button
            disabled={!selectedSlot || isHolding}
            onClick={() => setCurrentStep(2)}
            className="brand-button-gradient"
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              cursor: selectedSlot ? 'pointer' : 'not-allowed',
              opacity: selectedSlot ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Proceed to Symptom Intake & AI Triage</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: Symptoms & AI Pre-Visit Triage */}
      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {holdExpiresAt && (
            <SlotHoldTimer
              expiresAt={holdExpiresAt}
              onExpire={() => {
                setHoldId(null);
                setSelectedSlot(null);
                setCurrentStep(1);
              }}
            />
          )}

          <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              Describe Your Health Symptoms
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Our AI Assistant analyzes your symptoms in real-time to compute urgency ratings and prepare questions for your doctor.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  What symptoms are you experiencing? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Sharp pain in the lower right abdomen since yesterday, accompanied by mild nausea and low-grade fever..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Symptom Duration
                  </label>
                  <input
                    type="text"
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    placeholder="e.g. 2 days, 1 week"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Severity
                  </label>
                  <select
                    value={symptomSeverity}
                    onChange={(e) => setSymptomSeverity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              {/* AI Triage Trigger Button */}
              <button
                type="button"
                onClick={handleAnalyzeSymptoms}
                disabled={isAnalyzingAI || !symptoms}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #e9d5ff',
                  color: '#7e22ce',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isAnalyzingAI || !symptoms ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                <Sparkles size={16} />
                <span>{isAnalyzingAI ? 'Generating AI Triage...' : 'Generate AI Pre-Visit Insights'}</span>
              </button>
            </div>

            {/* AI Preview Card */}
            {aiPreview && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#faf5ff',
                  border: '1px solid #e9d5ff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', fontWeight: 700, fontSize: '14px' }}>
                    <Brain size={18} />
                    <span>AI Pre-Visit Triage Summary</span>
                  </div>
                  <UrgencyBadge urgency={aiPreview.urgencyLevel} />
                </div>

                <div style={{ fontSize: '13px', color: '#4c1d95' }}>
                  <strong>Chief Complaint:</strong> {aiPreview.chiefComplaint}
                </div>

                <div style={{ fontSize: '13px', color: '#581c87' }}>
                  <strong>Suggested Clinical Questions for Dr. {selectedDoctor?.user.lastName}:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '6px', lineHeight: 1.6 }}>
                    {aiPreview.suggestedQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Slot Selection</span>
            </button>

            <button
              onClick={handleConfirmAppointment}
              disabled={isSubmitting || !symptoms}
              className="brand-button-gradient"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isSubmitting || !symptoms ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !symptoms ? 0.6 : 1,
              }}
            >
              <span>{isSubmitting ? 'Confirming with Doctor...' : 'Confirm & Book Appointment'}</span>
              <CheckCircle2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Booking Success Screen */}
      {currentStep === 3 && (
        <div
          className="glass-card"
          style={{
            padding: '48px 36px',
            backgroundColor: '#ffffff',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
            Appointment Confirmed!
          </h2>

          <p style={{ color: '#475569', fontSize: '15px', maxWidth: '520px' }}>
            Your consultation with <strong>Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}</strong> on{' '}
            <strong>{selectedDate} at {selectedSlot?.startTime}</strong> is safely booked.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px 24px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'left',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#334155',
            }}
          >
            <div>• Confirmation email enqueued with consultation details</div>
            <div>• Google Calendar event synchronization initiated</div>
            <div>• AI pre-visit triage profile submitted to the physician</div>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            <button
              onClick={() => navigate(`/patient/appointments/${confirmedApptId}`)}
              className="brand-button-gradient"
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              View Consultation Details
            </button>

            <button
              onClick={() => navigate('/patient/dashboard')}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
