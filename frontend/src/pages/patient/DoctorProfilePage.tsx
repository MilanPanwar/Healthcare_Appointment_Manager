import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { Doctor } from '../../types';
import { Stethoscope, Clock, DollarSign, Calendar, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      patientService.getDoctorById(id).then((res) => {
        if (res.success) setDoctor(res.data);
      }).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading doctor profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2>Doctor not found</h2>
        <Link to="/patient/doctors" style={{ color: '#0284c7', marginTop: '10px', display: 'inline-block' }}>
          Back to Doctors
        </Link>
      </div>
    );
  }

  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
        <span>Back to Search</span>
      </button>

      {/* Main Profile Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '36px',
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Stethoscope size={40} />
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <Badge variant="primary">{doctor.specialization.name}</Badge>
              <span style={{ fontSize: '13px', color: '#64748b' }}>License: {doctor.licenseNumber}</span>
            </div>
          </div>
        </div>

        <Link
          to={`/patient/book?doctorId=${doctor.id}`}
          className="brand-button-gradient"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
          }}
        >
          <span>Book Consultation</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Grid: Bio & Consultation Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Bio Card */}
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>About the Doctor</h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            {doctor.bio || 'Dr. ' + doctor.user.firstName + ' ' + doctor.user.lastName + ' is a certified specialist dedicated to high-quality healthcare delivery.'}
          </p>

          <div
            style={{
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Consultation Fee</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                ${doctor.consultationFee.toFixed(2)}
              </div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Slot Duration</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {doctor.slotDurationMinutes} mins
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours Schedule */}
        <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>Working Hours Schedule</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {doctor.workingHours && doctor.workingHours.length > 0 ? (
              doctor.workingHours.map((wh) => (
                <div
                  key={wh.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: wh.isAvailable ? '#f8fafc' : '#fef2f2',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>{daysMap[wh.dayOfWeek]}</span>
                  {wh.isAvailable ? (
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>
                      {wh.startTime} - {wh.endTime}
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Off / Unavailable</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px' }}>Standard hours (Mon-Fri 09:00 - 17:00)</div>
            )}
          </div>

          {/* Upcoming Leaves */}
          {doctor.leaveDays && doctor.leaveDays.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
                Upcoming Leave Dates:
              </div>
              {doctor.leaveDays.map((leave) => (
                <div key={leave.id} style={{ fontSize: '12px', color: '#64748b' }}>
                  • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({leave.reason || 'Leave'})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
