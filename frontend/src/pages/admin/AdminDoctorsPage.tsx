import React, { useState, useEffect } from 'react';
import { adminService, CreateDoctorPayload, WorkingHourPayload } from '../../services/adminService';
import { patientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { Doctor, Specialization } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import {
  Stethoscope,
  Plus,
  Edit2,
  Clock,
  Trash2,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AdminDoctorsPage: React.FC = () => {
  const { addToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Doctor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState<CreateDoctorPayload>({
    email: '',
    password: 'Doctor@12345',
    firstName: '',
    lastName: '',
    phone: '',
    specializationId: '',
    licenseNumber: '',
    bio: '',
    slotDurationMinutes: 30,
    consultationFee: 75,
  });

  // Edit Doctor Modal
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Working Hours Modal
  const [hoursDoctor, setHoursDoctor] = useState<Doctor | null>(null);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [workingHoursList, setWorkingHoursList] = useState<WorkingHourPayload[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDoctors = async () => {
    try {
      const [docsRes, specRes] = await Promise.all([
        patientService.getDoctors(),
        patientService.getSpecializations(),
      ]);
      if (docsRes.success) setDoctors(docsRes.data);
      if (specRes.success) {
        setSpecializations(specRes.data);
        if (specRes.data.length > 0 && !newDoctor.specializationId) {
          setNewDoctor((prev) => ({ ...prev, specializationId: specRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await adminService.createDoctor(newDoctor);
      if (res.success) {
        addToast('success', `Dr. ${newDoctor.firstName} ${newDoctor.lastName} created!`, 'Doctor Created');
        setIsAddModalOpen(false);
        setNewDoctor({
          email: '',
          password: 'Doctor@12345',
          firstName: '',
          lastName: '',
          phone: '',
          specializationId: specializations[0]?.id || '',
          licenseNumber: '',
          bio: '',
          slotDurationMinutes: 30,
          consultationFee: 75,
        });
        loadDoctors();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to create doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setIsSubmitting(true);
    try {
      const res = await adminService.updateDoctor(editingDoctor.id, {
        firstName: editingDoctor.user.firstName,
        lastName: editingDoctor.user.lastName,
        phone: editingDoctor.user.phone,
        specializationId: editingDoctor.specializationId,
        licenseNumber: editingDoctor.licenseNumber,
        bio: editingDoctor.bio,
        slotDurationMinutes: editingDoctor.slotDurationMinutes,
        consultationFee: editingDoctor.consultationFee,
        isActive: editingDoctor.isActive,
      });

      if (res.success) {
        addToast('success', 'Doctor details updated successfully', 'Updated');
        setIsEditModalOpen(false);
        loadDoctors();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHoursModal = (doc: Doctor) => {
    setHoursDoctor(doc);
    const existing = doc.workingHours || [];
    const fullWeek: WorkingHourPayload[] = [];

    for (let day = 0; day <= 6; day++) {
      const found = existing.find((w) => w.dayOfWeek === day);
      if (found) {
        fullWeek.push({
          dayOfWeek: day,
          startTime: found.startTime,
          endTime: found.endTime,
          isAvailable: found.isAvailable,
        });
      } else {
        fullWeek.push({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: day === 0 ? '13:00' : '17:00',
          isAvailable: day >= 1 && day <= 5,
        });
      }
    }

    setWorkingHoursList(fullWeek);
    setIsHoursModalOpen(true);
  };

  const handleSaveHours = async () => {
    if (!hoursDoctor) return;
    setIsSubmitting(true);
    try {
      const res = await adminService.setWorkingHours(hoursDoctor.id, workingHoursList);
      if (res.success) {
        addToast('success', 'Working hours schedule updated successfully', 'Saved');
        setIsHoursModalOpen(false);
        loadDoctors();
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save working hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading doctor directory...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header with Add Doctor CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Doctor Directory & Schedule Management</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Create physicians, adjust consultation fees, slot durations, and weekly operating hours.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
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
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Doctors Table */}
      <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Doctor Name</th>
              <th style={{ padding: '14px 20px' }}>Specialty</th>
              <th style={{ padding: '14px 20px' }}>License #</th>
              <th style={{ padding: '14px 20px' }}>Fee</th>
              <th style={{ padding: '14px 20px' }}>Slot Duration</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    Dr. {doc.user.firstName} {doc.user.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.user.email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <Badge variant="primary" size="sm">{doc.specialization.name}</Badge>
                </td>
                <td style={{ padding: '14px 20px', color: '#64748b' }}>{doc.licenseNumber}</td>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: '#16a34a' }}>
                  ${doc.consultationFee.toFixed(2)}
                </td>
                <td style={{ padding: '14px 20px', color: '#334155' }}>
                  {doc.slotDurationMinutes} mins
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {doc.isActive ? (
                    <Badge variant="success" size="sm">Active</Badge>
                  ) : (
                    <Badge variant="danger" size="sm">Inactive</Badge>
                  )}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => openHoursModal(doc)}
                      title="Edit Working Hours"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={13} />
                      <span>Hours</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingDoctor(doc);
                        setIsEditModalOpen(true);
                      }}
                      title="Edit Profile"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Doctor */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Doctor">
        <form onSubmit={handleCreateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>First Name *</label>
              <input
                type="text"
                required
                value={newDoctor.firstName}
                onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Last Name *</label>
              <input
                type="text"
                required
                value={newDoctor.lastName}
                onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Email Address *</label>
              <input
                type="email"
                required
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Password *</label>
              <input
                type="password"
                required
                value={newDoctor.password}
                onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Specialization *</label>
              <select
                value={newDoctor.specializationId}
                onChange={(e) => setNewDoctor({ ...newDoctor, specializationId: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>License Number *</label>
              <input
                type="text"
                required
                placeholder="MD-SPEC-12345"
                value={newDoctor.licenseNumber}
                onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Slot Duration (Minutes)</label>
              <input
                type="number"
                min={10}
                max={120}
                value={newDoctor.slotDurationMinutes}
                onChange={(e) => setNewDoctor({ ...newDoctor, slotDurationMinutes: parseInt(e.target.value, 10) || 30 })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Consultation Fee ($)</label>
              <input
                type="number"
                min={0}
                value={newDoctor.consultationFee}
                onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: parseFloat(e.target.value) || 50 })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Doctor Bio</label>
            <textarea
              rows={2}
              value={newDoctor.bio}
              onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
              placeholder="Clinical experience, specialties, background..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
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
              {isSubmitting ? 'Creating...' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Doctor */}
      {editingDoctor && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Dr. ${editingDoctor.user.firstName} ${editingDoctor.user.lastName}`}>
          <form onSubmit={handleUpdateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>First Name</label>
                <input
                  type="text"
                  value={editingDoctor.user.firstName}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, user: { ...editingDoctor.user, firstName: e.target.value } })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Last Name</label>
                <input
                  type="text"
                  value={editingDoctor.user.lastName}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, user: { ...editingDoctor.user, lastName: e.target.value } })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Specialization</label>
                <select
                  value={editingDoctor.specializationId}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specializationId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Consultation Fee ($)</label>
                <input
                  type="number"
                  value={editingDoctor.consultationFee}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, consultationFee: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Slot Duration (Mins)</label>
                <input
                  type="number"
                  value={editingDoctor.slotDurationMinutes}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, slotDurationMinutes: parseInt(e.target.value, 10) || 30 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Status</label>
                <select
                  value={editingDoctor.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, isActive: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
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
                {isSubmitting ? 'Saving...' : 'Update Doctor'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Configure Working Hours */}
      {hoursDoctor && (
        <Modal isOpen={isHoursModalOpen} onClose={() => setIsHoursModalOpen(false)} title={`Configure Working Hours: Dr. ${hoursDoctor.user.lastName}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Set daily start/end times and availability for Dr. {hoursDoctor.user.firstName} {hoursDoctor.user.lastName}.
            </p>

            {workingHoursList.map((wh, idx) => (
              <div
                key={wh.dayOfWeek}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 100px 100px 100px',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: wh.isAvailable ? '#f8fafc' : '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>
                  {daysMap[wh.dayOfWeek]}
                </div>

                <input
                  type="time"
                  disabled={!wh.isAvailable}
                  value={wh.startTime}
                  onChange={(e) => {
                    const copy = [...workingHoursList];
                    copy[idx].startTime = e.target.value;
                    setWorkingHoursList(copy);
                  }}
                  style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />

                <input
                  type="time"
                  disabled={!wh.isAvailable}
                  value={wh.endTime}
                  onChange={(e) => {
                    const copy = [...workingHoursList];
                    copy[idx].endTime = e.target.value;
                    setWorkingHoursList(copy);
                  }}
                  style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wh.isAvailable}
                    onChange={(e) => {
                      const copy = [...workingHoursList];
                      copy[idx].isAvailable = e.target.checked;
                      setWorkingHoursList(copy);
                    }}
                  />
                  <span>{wh.isAvailable ? 'Working' : 'Off'}</span>
                </label>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setIsHoursModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHours}
                disabled={isSubmitting}
                className="brand-button-gradient"
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 700 }}
              >
                {isSubmitting ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
