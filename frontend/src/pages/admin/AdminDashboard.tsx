import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import {
  Users,
  Stethoscope,
  Calendar,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowRight,
  Shield,
  PlusCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, apptsRes] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getAdminAppointments(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (apptsRes.success) setRecentAppointments(apptsRes.data.slice(0, 8));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading admin intelligence center...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
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
            System Administrator Hub
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
            Platform Overview & Operations
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
            Monitor real-time appointments, manage doctor rosters, configure leaves, and track notification workers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/admin/doctors"
            style={{
              padding: '10px 18px',
              backgroundColor: '#ffffff',
              color: '#0284c7',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle size={16} />
            <span>Manage Doctors</span>
          </Link>
          <Link
            to="/admin/leave"
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            Leave Scheduler
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
          {/* Patients */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Total Patients</span>
              <Users size={20} color="#0284c7" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
              {stats.totalPatients}
            </div>
          </div>

          {/* Doctors */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Active Doctors</span>
              <Stethoscope size={20} color="#0d9488" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
              {stats.totalDoctors}
            </div>
          </div>

          {/* Confirmed */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Confirmed Bookings</span>
              <Calendar size={20} color="#2563eb" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', marginTop: '10px' }}>
              {stats.confirmedAppointments}
            </div>
          </div>

          {/* Completed */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Completed Visits</span>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '10px' }}>
              {stats.completedAppointments}
            </div>
          </div>

          {/* Cancelled */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Cancelled</span>
              <XCircle size={20} color="#dc2626" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '10px' }}>
              {stats.cancelledAppointments}
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Queued Emails</span>
              <Bell size={20} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', marginTop: '10px' }}>
              {stats.totalNotifications}
            </div>
          </div>
        </div>
      )}

      {/* Recent Appointments Audit Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Recent Appointment Activity</h2>
          <Link
            to="/admin/appointments"
            style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All Appointments</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Doctor</th>
                <th style={{ padding: '14px 20px' }}>Patient</th>
                <th style={{ padding: '14px 20px' }}>Date & Time</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((appt) => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                    Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName} ({appt.doctor.specialization.name})
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {appt.patient?.user.firstName} {appt.patient?.user.lastName}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {new Date(appt.appointmentDate).toISOString().split('T')[0]} ({appt.startTime} - {appt.endTime})
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <StatusBadge status={appt.status} />
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
