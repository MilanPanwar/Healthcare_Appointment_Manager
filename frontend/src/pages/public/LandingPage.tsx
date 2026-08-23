import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Brain,
  Calendar,
  Pill,
  Clock,
  ArrowRight,
  CheckCircle,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Users,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { Specialization } from '../../types';

export const LandingPage: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  useEffect(() => {
    patientService.getSpecializations().then((res) => {
      if (res.success) setSpecializations(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section className="hero-gradient" style={{ padding: '80px 24px 40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              backgroundColor: '#e0f2fe',
              borderRadius: '9999px',
              color: '#0369a1',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '24px',
              border: '1px solid #bae6fd',
            }}
          >
            <Sparkles size={16} />
            <span>AI-Powered Next Generation Healthcare</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#0f172a',
              marginBottom: '24px',
            }}
          >
            Smarter Appointments, Faster Triage &{' '}
            <span className="brand-gradient-text">Complete Care Follow-up</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              lineHeight: 1.6,
              color: '#475569',
              marginBottom: '36px',
              maxWidth: '720px',
              margin: '0 auto 36px auto',
            }}
          >
            Book medical consultations with zero double-booking risk, receive instant AI pre-visit symptom triage, sync with Google Calendar, and stay on track with automated post-visit medication schedules.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="brand-button-gradient"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.3)',
              }}
            >
              <span>Book Appointment Now</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
            Built for Modern Clinical Excellence
          </h2>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '16px' }}>
            A unified full-stack architecture solving scheduling conflicts and care continuity.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                marginBottom: '20px',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              Double-Booking Prevention
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              Database-level ACID transactions, unique multi-column constraints, and 5-minute atomic slot hold timers guarantee that simultaneous requests never collide.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9333ea',
                marginBottom: '20px',
              }}
            >
              <Brain size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              LLM Pre-Visit Triage
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              Analyzes patient symptoms before the visit to compute urgency ratings, chief complaints, and 3 targeted clinical questions for the physician.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                marginBottom: '20px',
              }}
            >
              <Pill size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              Post-Visit Care & Reminders
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              Translates complex doctor notes into clear patient summaries with background workers dispatching scheduled medication adherence reminders.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                marginBottom: '20px',
              }}
            >
              <Calendar size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              Leave Conflict Resolution
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              When doctors take approved leave, conflicting appointments are automatically cancelled, patients receive instant email notifications, and calendars sync.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                marginBottom: '20px',
              }}
            >
              <Activity size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              Google Calendar & Email Sync
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              OAuth 2.0 integration syncs confirmed, rescheduled, and cancelled appointments with patient and doctor calendar schedules automatically.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card glass-card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                marginBottom: '20px',
              }}
            >
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              Role-Based Portals
            </h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '14px' }}>
              Tailored dashboards for Patients, Doctors, and Clinic Administrators with strict JWT authentication and granular role-based authorization.
            </p>
          </div>
        </div>
      </section>

      {/* Specializations Browser */}
      {specializations.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Explore Medical Specialties</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>
              Connect with leading board-certified specialists across dedicated disciplines
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {specializations.map((spec) => (
              <Link
                key={spec.id}
                to={`/patient/doctors?specializationId=${spec.id}`}
                className="glass-card glass-card-hover"
                style={{
                  padding: '20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '10px',
                }}
              >
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
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{spec.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {spec._count?.doctors || 0} Doctors Available
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Box */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            borderRadius: '24px',
            padding: '60px 40px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(2, 132, 199, 0.3)',
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
            Ready to experience seamless healthcare management?
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px auto' }}>
            Join thousands of patients and healthcare providers using HealthFlow for effortless consultations.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              backgroundColor: '#ffffff',
              color: '#0284c7',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          >
            <span>Create Patient Account</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};
