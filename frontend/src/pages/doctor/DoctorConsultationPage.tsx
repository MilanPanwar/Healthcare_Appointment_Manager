import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorService, MedicationInput } from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';
import { Appointment } from '../../types';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Brain,
  FileText,
  Pill,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Send,
} from 'lucide-react';

export const DoctorConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [medications, setMedications] = useState<MedicationInput[]>([
    { name: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' },
  ]);

  // AI Post-Visit Summary State
  const [customSummary, setCustomSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      doctorService
        .getDoctorAppointmentById(id)
        .then((res) => {
          if (res.success) {
            setAppointment(res.data);
            if (res.data.prescription) {
              setDiagnosis(res.data.prescription.diagnosis || '');
              setClinicalNotes(res.data.prescription.clinicalNotes || '');
              setFollowUpInstructions(res.data.prescription.followUpInstructions || '');
              if (res.data.prescription.medications?.length) {
                setMedications(res.data.prescription.medications);
              }
              if (res.data.prescription.postVisitSummary?.summaryText) {
                setCustomSummary(res.data.prescription.postVisitSummary.summaryText);
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  const handleMedChange = (index: number, field: keyof MedicationInput, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleGenerateAiSummary = async () => {
    if (!clinicalNotes || !diagnosis) {
      addToast('warning', 'Please enter a diagnosis and clinical notes first.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const fullText = `Diagnosis: ${diagnosis}\nClinical Notes: ${clinicalNotes}\nInstructions: ${followUpInstructions}\nMedications: ${JSON.stringify(medications)}`;
      const res = await doctorService.previewAiSummary(fullText);
      if (res.success && res.data?.summary) {
        setCustomSummary(res.data.summary);
        addToast('success', 'AI Patient-Friendly Summary generated!', 'AI Success');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to generate AI summary', 'AI Error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!diagnosis || !clinicalNotes) {
      addToast('error', 'Please fill in Diagnosis and Clinical Notes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validMeds = medications.filter((m) => m.name.trim() !== '');
      const res = await doctorService.submitClinicalNotes(id, {
        diagnosis,
        clinicalNotes,
        followUpInstructions,
        medications: validMeds,
        customSummary: customSummary || undefined,
      });

      if (res.success) {
        addToast('success', 'Consultation notes and prescription recorded successfully!', 'Completed');
        navigate('/doctor/dashboard');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to submit consultation notes', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading consultation room...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2>Appointment not found</h2>
        <Link to="/doctor/dashboard" style={{ color: '#0284c7', marginTop: '10px', display: 'inline-block' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const questionsList: string[] = appointment.preVisitSummary?.suggestedQuestions
    ? JSON.parse(appointment.preVisitSummary.suggestedQuestions)
    : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#0284c7',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Queue</span>
      </button>

      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px 32px',
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={30} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <StatusBadge status={appointment.status} />
              {appointment.preVisitSummary && (
                <UrgencyBadge urgency={appointment.preVisitSummary.urgencyLevel} />
              )}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Patient: {appointment.patient?.user.firstName} {appointment.patient?.user.lastName}
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Email: {appointment.patient?.user.email} • Emergency Contact: {appointment.patient?.emergencyContact || 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
            {new Date(appointment.appointmentDate).toISOString().split('T')[0]}
          </div>
          <div>{appointment.startTime} - {appointment.endTime}</div>
        </div>
      </div>

      {/* Patient Symptoms & AI Triage Summary Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Symptoms */}
        <div className="glass-card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileText size={18} color="#0284c7" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Patient Reported Symptoms</h3>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
            "{appointment.symptomSubmission?.rawSymptoms || 'No symptoms specified'}"
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
            <span><strong>Duration:</strong> {appointment.symptomSubmission?.duration || 'N/A'}</span>
            <span><strong>Severity:</strong> {appointment.symptomSubmission?.severity || 'Moderate'}</span>
          </div>
        </div>

        {/* AI Triage Card */}
        <div className="glass-card" style={{ padding: '24px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce', marginBottom: '12px' }}>
            <Brain size={18} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AI Pre-Visit Triage & Questions</h3>
          </div>

          <div style={{ fontSize: '13px', color: '#581c87', marginBottom: '8px' }}>
            <strong>Chief Complaint:</strong> {appointment.preVisitSummary?.chiefComplaint || 'Pending review'}
          </div>

          <div style={{ fontSize: '13px', color: '#581c87' }}>
            <strong>Suggested Clinical Inquiries:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '4px', lineHeight: 1.5 }}>
              {questionsList.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Clinical Notes & Prescription Form */}
      <form onSubmit={handleSubmitConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Diagnosis & Notes */}
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Stethoscope size={20} color="#0284c7" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Clinical Findings & Diagnosis</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Primary Diagnosis *
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Doctor Clinical Notes & Observations *
              </label>
              <textarea
                rows={4}
                required
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Physical examination observations, vital signs, lung sounds, lab evaluations..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Follow-up & Recovery Instructions
              </label>
              <input
                type="text"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                placeholder="e.g. Follow up in 10 days if cough persists, maintain high fluid intake"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* Prescription Builder */}
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={20} color="#0284c7" />
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Prescription & Medication Schedule</h2>
            </div>
            <button
              type="button"
              onClick={handleAddMedication}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span>Add Medication</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {medications.map((med, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.5fr 1fr 2fr auto',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin"
                    value={med.name}
                    onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Dosage</label>
                  <input
                    type="text"
                    placeholder="500mg"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Frequency</label>
                  <select
                    value={med.frequency}
                    onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Duration</label>
                  <input
                    type="text"
                    placeholder="7 days"
                    value={med.duration}
                    onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Instructions</label>
                  <input
                    type="text"
                    placeholder="Take with food"
                    value={med.instructions || ''}
                    onChange={(e) => handleMedChange(index, 'instructions', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMedication(index)}
                  disabled={medications.length <= 1}
                  style={{
                    backgroundColor: '#fee2e2',
                    border: 'none',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                    cursor: medications.length <= 1 ? 'not-allowed' : 'pointer',
                    opacity: medications.length <= 1 ? 0.4 : 1,
                    marginTop: '16px',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Patient-Friendly Summary Generator & Preview */}
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
              <Sparkles size={20} />
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>AI Patient-Friendly Summary</h2>
            </div>
            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi || !clinicalNotes}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isGeneratingAi || !clinicalNotes ? 'not-allowed' : 'pointer',
                opacity: isGeneratingAi || !clinicalNotes ? 0.6 : 1,
              }}
            >
              <Sparkles size={16} />
              <span>{isGeneratingAi ? 'Generating...' : 'Auto-Generate AI Summary'}</span>
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '12px' }}>
            The AI automatically translates your complex clinical notes into warm, patient-friendly instructions with a clear schedule. You can edit this text freely before saving.
          </p>

          <textarea
            rows={3}
            value={customSummary}
            onChange={(e) => setCustomSummary(e.target.value)}
            placeholder="Click 'Auto-Generate AI Summary' to populate, or write a custom friendly summary for the patient..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #86efac',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Submit Consultation Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="brand-button-gradient"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Saving Consultation...' : 'Complete Consultation & Issue Prescription'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
