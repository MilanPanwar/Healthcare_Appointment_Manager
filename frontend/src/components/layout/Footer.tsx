import React from 'react';
import { Activity, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '36px 24px 24px 24px',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>HealthFlow Healthcare</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Intelligent Appointment Scheduling & Clinical Follow-up Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} color="#0284c7" />
            <span>Double-Booking Concurrency Safe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={16} color="#0d9488" />
            <span>AI-Assisted Patient Triage</span>
          </div>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} HealthFlow Healthcare Systems. Production-Ready Full-Stack Platform.
        </div>
      </div>
    </footer>
  );
};
