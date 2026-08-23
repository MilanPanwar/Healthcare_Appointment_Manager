import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface SlotHoldTimerProps {
  expiresAt: string; // ISO string
  onExpire?: () => void;
}

export const SlotHoldTimer: React.FC<SlotHoldTimerProps> = ({ expiresAt, onExpire }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateSeconds = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setSecondsRemaining(calculateSeconds());

    const interval = setInterval(() => {
      const rem = calculateSeconds();
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 60;

  if (secondsRemaining <= 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '10px',
          color: '#b91c1c',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <AlertCircle size={18} />
        <span>Slot Hold Expired. Please select your time slot again.</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '14px 18px',
        backgroundColor: isUrgent ? '#fef2f2' : '#f0f9ff',
        border: `1px solid ${isUrgent ? '#fca5a5' : '#bae6fd'}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={20} color={isUrgent ? '#dc2626' : '#0284c7'} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: isUrgent ? '#991b1b' : '#0369a1' }}>
            Slot Exclusively Reserved For You
          </div>
          <div style={{ fontSize: '12px', color: isUrgent ? '#b91c1c' : '#0284c7' }}>
            Protected against double-booking while you complete details
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: `1px solid ${isUrgent ? '#f87171' : '#7dd3fc'}`,
          fontWeight: 800,
          fontFamily: 'monospace',
          fontSize: '15px',
          color: isUrgent ? '#dc2626' : '#0369a1',
        }}
      >
        <Clock size={16} />
        <span>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
