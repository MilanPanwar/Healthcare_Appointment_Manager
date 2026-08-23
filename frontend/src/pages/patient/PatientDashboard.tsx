import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { Appointment, MedicationReminder } from '../../types';
import { StatusBadge, UrgencyBadge, Badge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  PlusCircle,
  Pill,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, medsRes] = await Promise.all([
          patientService.getMyAppointments(),
          patientService.getMedications(),
        ]);
        if (apptsRes.success) setAppointments(apptsRes.data);
        if (medsRes.success) setReminders(medsRes.data.reminders || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'RESCHEDULED' || a.status === 'PENDING'
  );

  const pastAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  const activeReminders = reminders.filter((r) => r.isActive);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>Loading your healthcare dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '36px 40px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 20px -5px rgba(2, 132, 199, 0.3)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Welcome back, {user?.firstName}!
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            You have <strong>{upcomingAppointments.length}</strong> upcoming consultation{upcomingAppointments.length !== 1 ? 's' : ''} and{' '}
            <strong>{activeReminders.length}</strong> active medication schedule{activeReminders.length !== 1 ? 's' : ''}.
          </p>
        </div>

        <Link
          to="/patient/doctors"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#ffffff',
            color: '#0284c7',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        >
          <PlusCircle size={18} />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Medication Reminder Active Alert Banner */}
      {activeReminders.length > 0 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e3a8a' }}>
                Active Medication Schedules ({activeReminders.length})
              </div>
              <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>
                Next due: {activeReminders[0].medication.name} ({activeReminders[0].medication.dosage}) - {activeReminders[0].frequency}
              </div>
            </div>
          </div>

          <Link
            to="/patient/medications"
            style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All Schedules</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Upcoming Appointments Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} color="#0284c7" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Upcoming Appointments</h2>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {upcomingAppointments.length} Active
          </span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#334155' }}>No upcoming appointments</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px auto' }}>
              Schedule a visit with any of our verified medical specialists across all disciplines.
            </p>
            <Link
              to="/patient/doctors"
              className="brand-button-gradient"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={16} />
              <span>Browse Doctors</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {upcomingAppointments.map((appt) => {
              const dateFormatted = new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={appt.id}
                  className="glass-card glass-card-hover"
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '18px',
                  }}
                >
                  <div>
                    {/* Header with status and urgency */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <StatusBadge status={appt.status} />
                      {appt.preVisitSummary && (
                        <UrgencyBadge urgency={appt.preVisitSummary.urgencyLevel} />
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Stethoscope size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                          Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
                          {appt.doctor.specialization.name}
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={15} color="#0284c7" />
                        <span>{dateFormatted}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} color="#0284c7" />
                        <span>{appt.startTime} - {appt.endTime}</span>
                      </div>
                    </div>

                    {/* AI Chief Complaint Preview */}
                    {appt.preVisitSummary?.chiefComplaint && (
                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '12px',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <Sparkles size={14} color="#9333ea" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>AI Triage:</strong> {appt.preVisitSummary.chiefComplaint}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/patient/appointments/${appt.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: 700,
                      transition: 'background 0.2s',
                    }}
                  >
                    <span>View Consultation Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Appointments Section */}
      {pastAppointments.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <FileText size={22} color="#64748b" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Past Consultations</h2>
          </div>

          <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>Doctor</th>
                  <th style={{ padding: '14px 20px' }}>Specialty</th>
                  <th style={{ padding: '14px 20px' }}>Date & Time</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastAppointments.map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                      Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {appt.doctor.specialization.name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {new Date(appt.appointmentDate).toISOString().split('T')[0]} ({appt.startTime})
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <Link
                        to={`/patient/appointments/${appt.id}`}
                        style={{
                          color: '#0284c7',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        View Summary →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
