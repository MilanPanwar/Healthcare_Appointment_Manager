import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    primary: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    success: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    danger: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
    warning: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    info: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
    neutral: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  };

  const current = styles[variant] || styles.neutral;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const norm = urgency.toUpperCase();
  if (norm === 'HIGH') {
    return <Badge variant="danger">🔴 High Urgency</Badge>;
  }
  if (norm === 'MEDIUM') {
    return <Badge variant="warning">🟡 Medium Urgency</Badge>;
  }
  return <Badge variant="success">🟢 Low Urgency</Badge>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const norm = status.toUpperCase();
  if (norm === 'CONFIRMED') {
    return <Badge variant="success">Confirmed</Badge>;
  }
  if (norm === 'COMPLETED') {
    return <Badge variant="info">Completed</Badge>;
  }
  if (norm === 'CANCELLED') {
    return <Badge variant="danger">Cancelled</Badge>;
  }
  if (norm === 'RESCHEDULED') {
    return <Badge variant="warning">Rescheduled</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
};
