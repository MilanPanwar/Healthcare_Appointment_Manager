import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, User, LogOut, Calendar, Stethoscope, Shield, Pill } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HealthFlow
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#64748b',
                marginTop: '-2px',
              }}
            >
              Care & Follow-up
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isAuthenticated && user ? (
            <>
              {/* PATIENT NAV */}
              {user.role === 'PATIENT' && (
                <>
                  <Link
                    to="/patient/dashboard"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/patient/dashboard') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/patient/dashboard') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/patient/doctors"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/patient/doctors') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/patient/doctors') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Find Doctors
                  </Link>
                  <Link
                    to="/patient/medications"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/patient/medications') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/patient/medications') ? '#e0f2fe' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Pill size={16} />
                    <span>Medications</span>
                  </Link>
                </>
              )}

              {/* DOCTOR NAV */}
              {user.role === 'DOCTOR' && (
                <>
                  <Link
                    to="/doctor/dashboard"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/doctor/dashboard') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/doctor/dashboard') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Doctor Portal
                  </Link>
                  <Link
                    to="/doctor/schedule"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/doctor/schedule') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/doctor/schedule') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    My Schedule
                  </Link>
                </>
              )}

              {/* ADMIN NAV */}
              {user.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/admin/dashboard') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/admin/dashboard') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Admin Hub
                  </Link>
                  <Link
                    to="/admin/doctors"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/admin/doctors') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/admin/doctors') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Manage Doctors
                  </Link>
                  <Link
                    to="/admin/leave"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/admin/leave') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/admin/leave') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    Leave Management
                  </Link>
                  <Link
                    to="/admin/appointments"
                    style={{
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive('/admin/appointments') ? '#0284c7' : '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive('/admin/appointments') ? '#e0f2fe' : 'transparent',
                    }}
                  >
                    All Appointments
                  </Link>
                </>
              )}

              {/* User Profile & Role Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: '1px solid #e2e8f0',
                  paddingLeft: '16px',
                  marginLeft: '8px',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    {user.role === 'ADMIN' && <Badge variant="primary" size="sm">Admin</Badge>}
                    {user.role === 'DOCTOR' && <Badge variant="info" size="sm">Doctor</Badge>}
                    {user.role === 'PATIENT' && <Badge variant="success" size="sm">Patient</Badge>}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  padding: '8px 16px',
                }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="brand-button-gradient"
                style={{
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '10px 20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
