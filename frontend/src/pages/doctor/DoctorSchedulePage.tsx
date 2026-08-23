import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import { Doctor } from '../../types';
import { Calendar, Clock, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DoctorSchedulePage: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    doctorService.getDoctorSchedule().then((res) => {
      if (res.success) setDoctor(res.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading schedule...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>My Clinical Schedule & Working Hours</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Overview of your weekly consultation hours and approved leave dates configured by Clinic Administration.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
          Weekly Working Hours ({doctor?.slotDurationMinutes || 30}-min slots)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {doctor?.workingHours?.map((wh) => (
            <div
              key={wh.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: wh.isAvailable ? '#f8fafc' : '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                {daysMap[wh.dayOfWeek]}
              </div>
              <div>
                {wh.isAvailable ? (
                  <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '14px' }}>
                    {wh.startTime} - {wh.endTime}
                  </span>
                ) : (
                  <Badge variant="danger" size="sm">Off / Unavailable</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave History */}
      <div className="glass-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
          Approved Absence / Leave Records
        </h2>

        {doctor?.leaveDays && doctor.leaveDays.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {doctor.leaveDays.map((leave) => (
              <div
                key={leave.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong style={{ color: '#991b1b' }}>
                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                  </strong>
                  <div style={{ color: '#7f1d1d', marginTop: '2px' }}>{leave.reason || 'Personal Leave'}</div>
                </div>
                <Badge variant="danger" size="sm">On Leave</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '13px' }}>No upcoming or active leaves recorded.</div>
        )}
      </div>
    </div>
  );
};
