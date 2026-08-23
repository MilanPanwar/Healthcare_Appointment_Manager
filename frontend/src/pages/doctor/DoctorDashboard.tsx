import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { Appointment } from '../../types';
import { StatusBadge, UrgencyBadge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  User,
  Brain,
  FileText,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Activity,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    doctorService.getDoctorAppointments().then((res) => {
      if (res.success) setAppointments(res.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter((a) => {
    const apptDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
    return apptDateStr === todayStr && a.status !== 'CANCELLED';
  });

  const upcomingAppointments = appointments.filter((a) => {
    const apptDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
    return apptDateStr > todayStr && (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED');
  });

  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading doctor appointments queue...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
          color: '#ffffff',
          padding: '32px 40px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '4px' }}>
            Doctor Clinical Portal
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
            Consultation Queue & Schedule
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
            You have <strong>{todayAppointments.length}</strong> consultation{todayAppointments.length !== 1 ? 's' : ''} scheduled for today.
          </p>
        </div>

        <Link
          to="/doctor/schedule"
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffffff',
            color: '#0284c7',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Manage Working Hours
        </Link>
      </div>

      {/* Today's Queue */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Activity size={22} color="#0284c7" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Today's Patient Queue ({todayAppointments.length})</h2>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>No consultations scheduled for today</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              Check your upcoming appointments below.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="glass-card glass-card-hover"
                style={{
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderLeft: appt.preVisitSummary?.urgencyLevel === 'HIGH' ? '4px solid #ef4444' : '4px solid #0284c7',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
                      <Clock size={16} color="#0284c7" />
                      <span>{appt.startTime} - {appt.endTime}</span>
                    </div>
                    {appt.preVisitSummary && (
                      <UrgencyBadge urgency={appt.preVisitSummary.urgencyLevel} />
                    )}
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    {appt.patient?.user.firstName} {appt.patient?.user.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Phone: {appt.patient?.user.phone || 'N/A'} • Email: {appt.patient?.user.email}
                  </div>

                  {/* AI Chief Complaint summary preview */}
                  {appt.preVisitSummary?.chiefComplaint && (
                    <div
                      style={{
                        backgroundColor: '#faf5ff',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e9d5ff',
                        fontSize: '12px',
                        color: '#581c87',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>AI Triage:</strong> {appt.preVisitSummary.chiefComplaint}
                    </div>
                  )}
                </div>

                <Link
                  to={`/doctor/appointments/${appt.id}`}
                  className="brand-button-gradient"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>Start Consultation & Notes</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming & Completed Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Calendar size={22} color="#64748b" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Upcoming & Historical Appointments</h2>
        </div>

        <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Patient</th>
                <th style={{ padding: '14px 20px' }}>Date</th>
                <th style={{ padding: '14px 20px' }}>Time</th>
                <th style={{ padding: '14px 20px' }}>Urgency</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                    {appt.patient?.user.firstName} {appt.patient?.user.lastName}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {new Date(appt.appointmentDate).toISOString().split('T')[0]}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
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
                    <Link
                      to={`/doctor/appointments/${appt.id}`}
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}
                    >
                      {appt.status === 'COMPLETED' ? 'View Summary →' : 'Consultation →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
