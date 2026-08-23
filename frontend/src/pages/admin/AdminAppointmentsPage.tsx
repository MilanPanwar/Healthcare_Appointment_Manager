import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { patientService } from '../../services/patientService';
import { Appointment, Doctor } from '../../types';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Calendar, Filter, Search, User, Stethoscope, Sparkles } from 'lucide-react';

export const AdminAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const [apptsRes, docsRes] = await Promise.all([
        adminService.getAdminAppointments({
          status: selectedStatus,
          doctorId: selectedDoctorId || undefined,
        }),
        patientService.getDoctors(),
      ]);
      if (apptsRes.success) setAppointments(apptsRes.data);
      if (docsRes.success) setDoctors(docsRes.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedStatus, selectedDoctorId]);

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Global Appointment Audit & Overview</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Inspect all patient bookings, AI triage ratings, clinical statuses, and cancellations across the health system.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            <Filter size={16} />
            <span>Filter Status:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>

          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user.firstName} {d.user.lastName} ({d.specialization.name})
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          Showing {appointments.length} appointment record{appointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Master Table */}
      <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Doctor</th>
              <th style={{ padding: '14px 20px' }}>Patient</th>
              <th style={{ padding: '14px 20px' }}>Date</th>
              <th style={{ padding: '14px 20px' }}>Time</th>
              <th style={{ padding: '14px 20px' }}>AI Urgency</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No appointments match the selected filters.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{appt.doctor.specialization.name}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {appt.patient?.user.firstName} {appt.patient?.user.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{appt.patient?.user.email}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {new Date(appt.appointmentDate).toISOString().split('T')[0]}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {appt.startTime} - {appt.endTime}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {appt.preVisitSummary ? (
                      <UrgencyBadge urgency={appt.preVisitSummary.urgencyLevel} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <StatusBadge status={appt.status} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedAppt(appt);
                        setIsDetailModalOpen(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0284c7',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Audit →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Appointment Audit Details */}
      {selectedAppt && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Appointment Audit Record">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={selectedAppt.status} />
              {selectedAppt.preVisitSummary && (
                <UrgencyBadge urgency={selectedAppt.preVisitSummary.urgencyLevel} />
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong style={{ color: '#64748b', fontSize: '12px' }}>Doctor:</strong>
                <div>Dr. {selectedAppt.doctor.user.firstName} {selectedAppt.doctor.user.lastName} ({selectedAppt.doctor.specialization.name})</div>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '12px' }}>Patient:</strong>
                <div>{selectedAppt.patient?.user.firstName} {selectedAppt.patient?.user.lastName}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '12px' }}>Date & Time:</strong>
                <div>{new Date(selectedAppt.appointmentDate).toISOString().split('T')[0]} at {selectedAppt.startTime}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '12px' }}>Fee:</strong>
                <div>${selectedAppt.doctor.consultationFee.toFixed(2)}</div>
              </div>
            </div>

            {selectedAppt.symptomSubmission && (
              <div>
                <strong style={{ color: '#0f172a' }}>Patient Reported Symptoms:</strong>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginTop: '4px', fontSize: '13px' }}>
                  "{selectedAppt.symptomSubmission.rawSymptoms}"
                </div>
              </div>
            )}

            {selectedAppt.cancellationReason && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                <strong>Cancellation Reason:</strong> {selectedAppt.cancellationReason}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
