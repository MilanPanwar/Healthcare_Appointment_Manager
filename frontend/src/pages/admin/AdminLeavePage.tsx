import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { patientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { Doctor } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Calendar, Plus, Trash2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const AdminLeavePage: React.FC = () => {
  const { addToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('Personal / Medical Leave');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDoctorsWithLeaves = async () => {
    try {
      const res = await patientService.getDoctors();
      if (res.success) {
        setDoctors(res.data);
        if (res.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsWithLeaves();
  }, []);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !startDate || !endDate) {
      addToast('error', 'Please fill in all leave date fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.setDoctorLeave(selectedDoctorId, {
        startDate,
        endDate,
        reason,
      });

      if (res.success) {
        addToast(
          'success',
          `Doctor marked on leave. ${res.data.affectedAppointmentsCount} conflicting appointment(s) were automatically cancelled and patients notified!`,
          'Leave Recorded & Conflicts Resolved'
        );
        setIsLeaveModalOpen(false);
        setStartDate('');
        setEndDate('');
        loadDoctorsWithLeaves();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to mark doctor on leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLeave = async (doctorId: string, leaveId: string) => {
    if (!confirm('Are you sure you want to remove this leave period? Doctor will become available again.')) return;

    try {
      const res = await adminService.removeDoctorLeave(doctorId, leaveId);
      if (res.success) {
        addToast('success', res.message, 'Leave Removed');
        loadDoctorsWithLeaves();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to remove leave');
    }
  };

  // Collect all leaves across doctors
  const allLeaves: { leaveId: string; doctorId: string; doctorName: string; spec: string; startDate: string; endDate: string; reason?: string }[] = [];
  doctors.forEach((d) => {
    (d.leaveDays || []).forEach((l) => {
      allLeaves.push({
        leaveId: l.id,
        doctorId: d.id,
        doctorName: `Dr. ${d.user.firstName} ${d.user.lastName}`,
        spec: d.specialization.name,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
      });
    });
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading doctor leave records...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Doctor Leave & Conflict Resolution</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Mark physicians on leave with automatic detection of conflicting appointments, auto-cancellations, and patient email alerts.
          </p>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="brand-button-gradient"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          <span>Mark Doctor on Leave</span>
        </button>
      </div>

      {/* Info Callout Box */}
      <div
        style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <ShieldAlert size={28} color="#dc2626" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
          <strong>Automated Leave Conflict Engine:</strong> When a doctor is marked on leave, the system executes an atomic transaction that: (1) locks future slots on that date, (2) auto-cancels existing conflicting bookings with clear reason, (3) dispatches urgent email notifications with one-click re-booking links to affected patients, and (4) deletes external Google Calendar events.
        </div>
      </div>

      {/* Leaves Table */}
      <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Doctor</th>
              <th style={{ padding: '14px 20px' }}>Specialty</th>
              <th style={{ padding: '14px 20px' }}>Start Date</th>
              <th style={{ padding: '14px 20px' }}>End Date</th>
              <th style={{ padding: '14px 20px' }}>Reason</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allLeaves.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No active or upcoming doctor leaves recorded.
                </td>
              </tr>
            ) : (
              allLeaves.map((l) => (
                <tr key={l.leaveId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                    {l.doctorName}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge variant="primary" size="sm">{l.spec}</Badge>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {new Date(l.startDate).toISOString().split('T')[0]}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {new Date(l.endDate).toISOString().split('T')[0]}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {l.reason || 'Personal Leave'}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveLeave(l.doctorId, l.leaveId)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Remove Leave
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Mark Doctor on Leave */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Mark Doctor on Leave">
        <form onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Select Doctor *</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} ({d.specialization.name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Reason for Leave</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending Annual Cardiology Summit, Family emergency"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="brand-button-gradient"
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 700 }}
            >
              {isSubmitting ? 'Processing Conflicts...' : 'Mark Leave & Resolve Conflicts'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
