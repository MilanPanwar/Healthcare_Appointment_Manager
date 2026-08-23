import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import { MedicationReminder, Prescription } from '../../types';
import { Pill, Clock, Calendar, CheckCircle2, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const MedicationCenterPage: React.FC = () => {
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    patientService.getMedications().then((res) => {
      if (res.success) {
        setReminders(res.data.reminders || []);
        setPrescriptions(res.data.prescriptions || []);
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', textAlign: 'center', color: '#64748b' }}>
        Loading your medication schedules...
      </div>
    );
  }

  const activeReminders = reminders.filter((r) => r.isActive);

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
          Medication Reminders & Prescription Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
          Keep track of your active medication doses, schedules, and post-visit doctor instructions.
        </p>
      </div>

      {/* Info Card on Background Email Worker */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <ShieldCheck size={28} color="#1d4ed8" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Automated Background Reminders Active:</strong> Our server-side background worker automatically monitors your prescription frequency and sends timely email reminders directly to your inbox when each dose is due.
        </div>
      </div>

      {/* Active Medication Reminders Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Pill size={22} color="#0284c7" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Active Medication Schedules ({activeReminders.length})</h2>
        </div>

        {activeReminders.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <Pill size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>No active medication schedules</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              When a doctor submits a prescription after your consultation, medication reminders will automatically appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {activeReminders.map((rem) => {
              const nextTimeFormatted = new Date(rem.nextScheduledAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={rem.id}
                  className="glass-card glass-card-hover"
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: '4px solid #0284c7',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                        {rem.medication.name}
                      </h3>
                      <Badge variant="primary" size="sm">{rem.medication.dosage}</Badge>
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                      <strong>Frequency:</strong> {rem.frequency}
                    </div>

                    {rem.medication.instructions && (
                      <div style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                        {rem.medication.instructions}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#15803d',
                      fontWeight: 600,
                    }}
                  >
                    <Clock size={16} />
                    <span>Next Reminder: <strong>{nextTimeFormatted}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prescription History */}
      {prescriptions.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <FileText size={22} color="#64748b" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Prescription & Care Plan History</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {prescriptions.map((p) => (
              <div key={p.id} className="glass-card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      Diagnosis: {p.diagnosis}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      Prescribed by Dr. {p.doctor?.user.firstName} {p.doctor?.user.lastName} on {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {p.postVisitSummary?.summaryText && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={14} />
                      <span>Doctor's Care Summary:</span>
                    </div>
                    {p.postVisitSummary.summaryText}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {p.medications.map((m) => (
                    <div key={m.id} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                      💊 {m.name} ({m.dosage}) - {m.frequency}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
