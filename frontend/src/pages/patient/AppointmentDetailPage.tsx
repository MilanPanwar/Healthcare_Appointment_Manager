import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { aiService } from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { Appointment } from '../../types';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Stethoscope,
  Brain,
  FileText,
  Pill,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule Modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // AI Retry State
  const [isRetryingAI, setIsRetryingAI] = useState(false);

  const fetchAppointment = async () => {
    if (!id) return;
    try {
      const res = await patientService.getAppointmentDetails(id);
      if (res.success) setAppointment(res.data);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to fetch appointment', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      const res = await patientService.cancelAppointment(id, cancelReason);
      if (res.success) {
        addToast('success', 'Appointment has been cancelled', 'Cancelled');
        setIsCancelModalOpen(false);
        fetchAppointment();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Cancellation failed', 'Error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!id || !newDate || !newStartTime) {
      addToast('error', 'Please choose a valid date and time slot.');
      return;
    }
    setIsRescheduling(true);
    try {
      const res = await patientService.rescheduleAppointment(id, newDate, newStartTime);
      if (res.success) {
        addToast('success', 'Appointment successfully rescheduled', 'Rescheduled');
        setIsRescheduleModalOpen(false);
        fetchAppointment();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Reschedule conflict. Please choose another slot.', 'Conflict');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleRetryPreVisitAI = async () => {
    if (!id) return;
    setIsRetryingAI(true);
    try {
      const res = await aiService.retryPreVisitSummary(id);
      if (res.success) {
        addToast('success', 'AI Pre-visit summary re-generated!', 'AI Updated');
        fetchAppointment();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'AI retry failed');
    } finally {
      setIsRetryingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading appointment details...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2>Appointment not found</h2>
        <Link to="/patient/dashboard" style={{ color: '#0284c7', marginTop: '12px', display: 'inline-block' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isCancellable = appointment.status === 'CONFIRMED' || appointment.status === 'RESCHEDULED';
  const questionsList: string[] = appointment.preVisitSummary?.suggestedQuestions
    ? JSON.parse(appointment.preVisitSummary.suggestedQuestions)
    : [];

  const postVisitSteps: string[] = appointment.prescription?.postVisitSummary?.followUpSteps
    ? JSON.parse(appointment.prescription.postVisitSummary.followUpSteps)
    : [];

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
        <span>Back to Dashboard</span>
      </button>

      {/* Main Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
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
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stethoscope size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <StatusBadge status={appointment.status} />
              {appointment.preVisitSummary && (
                <UrgencyBadge urgency={appointment.preVisitSummary.urgencyLevel} />
              )}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
            </h1>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {appointment.doctor.specialization.name} • Fee: ${appointment.doctor.consultationFee.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Date / Time Card */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 20px',
            textAlign: 'right',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            <Calendar size={16} color="#0284c7" />
            <span>{new Date(appointment.appointmentDate).toISOString().split('T')[0]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            <Clock size={15} color="#0284c7" />
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {appointment.status === 'CANCELLED' && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#b91c1c',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>Appointment Cancelled:</strong> {appointment.cancellationReason || 'No reason specified'}
          </div>
        </div>
      )}

      {/* Grid: Symptoms & Pre-visit AI Triage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Symptoms Card */}
        <div className="glass-card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FileText size={18} color="#0284c7" />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Reported Symptoms</h2>
          </div>

          {appointment.symptomSubmission ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <p style={{ color: '#334155', lineHeight: 1.6, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                "{appointment.symptomSubmission.rawSymptoms}"
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                <span><strong>Duration:</strong> {appointment.symptomSubmission.duration || 'N/A'}</span>
                <span><strong>Severity:</strong> {appointment.symptomSubmission.severity || 'Moderate'}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '13px' }}>No symptom details recorded.</div>
          )}
        </div>

        {/* AI Pre-Visit Triage Card */}
        <div className="glass-card" style={{ padding: '24px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce' }}>
              <Brain size={20} />
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>AI Pre-Visit Triage</h2>
            </div>
            {appointment.preVisitSummary && (
              <button
                onClick={handleRetryPreVisitAI}
                disabled={isRetryingAI}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#7e22ce',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={isRetryingAI ? 'spin' : ''} />
                <span>Retry AI</span>
              </button>
            )}
          </div>

          {appointment.preVisitSummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong style={{ color: '#581c87' }}>Chief Complaint:</strong>
                <div style={{ color: '#3b0764', marginTop: '2px' }}>{appointment.preVisitSummary.chiefComplaint}</div>
              </div>

              <div>
                <strong style={{ color: '#581c87' }}>Suggested Questions for Doctor:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '4px', color: '#3b0764', lineHeight: 1.5 }}>
                  {questionsList.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b21a8', fontSize: '13px' }}>AI Pre-visit summary generation pending.</div>
          )}
        </div>
      </div>

      {/* Post-Visit Clinical Summary & Prescriptions (If Completed) */}
      {appointment.prescription && (
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <CheckCircle size={22} color="#16a34a" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#166534' }}>
              Post-Visit Consultation Summary & Prescription
            </h2>
          </div>

          {/* AI Patient Friendly Summary */}
          {appointment.prescription.postVisitSummary && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                <span>Patient-Friendly Care Summary</span>
              </div>
              <p style={{ fontSize: '14px', color: '#166534', lineHeight: 1.6 }}>
                {appointment.prescription.postVisitSummary.summaryText}
              </p>

              {postVisitSteps.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#15803d' }}>Follow-Up Recovery Steps:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                    {postVisitSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Prescribed Medications Table */}
          {appointment.prescription.medications && appointment.prescription.medications.length > 0 && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pill size={16} color="#0284c7" />
                <span>Prescribed Medications</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Medication</th>
                      <th style={{ padding: '10px 14px' }}>Dosage</th>
                      <th style={{ padding: '10px 14px' }}>Frequency</th>
                      <th style={{ padding: '10px 14px' }}>Duration</th>
                      <th style={{ padding: '10px 14px' }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointment.prescription.medications.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{m.name}</td>
                        <td style={{ padding: '10px 14px' }}>{m.dosage}</td>
                        <td style={{ padding: '10px 14px' }}>{m.frequency}</td>
                        <td style={{ padding: '10px 14px' }}>{m.duration}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.instructions || 'As directed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Cancel / Reschedule */}
      {isCancellable && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '10px' }}>
          <button
            onClick={() => setIsCancelModalOpen(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel Appointment
          </button>

          <button
            onClick={() => setIsRescheduleModalOpen(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reschedule Appointment
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Are you sure you want to cancel your consultation with Dr. {appointment.doctor.user.lastName}? This will release your time slot and notify the clinic.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Reason for Cancellation (Optional)
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => setIsCancelModalOpen(false)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              Keep Appointment
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              New Consultation Date
            </label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setNewDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              New Start Time (HH:MM, 24h)
            </label>
            <input
              type="text"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              placeholder="e.g. 11:30"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={isRescheduling || !newDate || !newStartTime}
              className="brand-button-gradient"
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              {isRescheduling ? 'Rescheduling...' : 'Save New Time'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
