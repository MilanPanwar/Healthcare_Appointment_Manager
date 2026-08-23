import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { Doctor, Specialization } from '../../types';
import { Search, Stethoscope, Clock, DollarSign, Calendar, ArrowRight, Filter } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpec = searchParams.get('specializationId') || 'all';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>(initialSpec);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    patientService.getSpecializations().then((res) => {
      if (res.success) setSpecializations(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await patientService.getDoctors({
          specializationId: selectedSpec,
          search: searchTerm || undefined,
        });
        if (res.success) setDoctors(res.data);
      } catch (err) {
        console.error('Failed to search doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchDoctors, 250);
    return () => clearTimeout(debounce);
  }, [selectedSpec, searchTerm]);

  const handleSpecSelect = (specId: string) => {
    setSelectedSpec(specId);
    if (specId === 'all') {
      searchParams.delete('specializationId');
    } else {
      searchParams.set('specializationId', specId);
    }
    setSearchParams(searchParams);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>Find a Healthcare Specialist</h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
          Explore our certified doctors, check live availability, and reserve consultation slots.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            color="#94a3b8"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by doctor name, medical discipline, or condition..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              color: '#0f172a',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
        </div>

        {/* Specialization Filter Pills */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
            <Filter size={14} />
            <span>Filter by Specialty:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => handleSpecSelect('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedSpec === 'all' ? '#0284c7' : '#e2e8f0',
                backgroundColor: selectedSpec === 'all' ? '#0284c7' : '#ffffff',
                color: selectedSpec === 'all' ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Specialties
            </button>
            {specializations.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSpecSelect(s.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: selectedSpec === s.id ? '#0284c7' : '#e2e8f0',
                  backgroundColor: selectedSpec === s.id ? '#0284c7' : '#ffffff',
                  color: selectedSpec === s.id ? '#ffffff' : '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Searching doctor availability...
        </div>
      ) : doctors.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Stethoscope size={44} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>No doctors found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            Try adjusting your search criteria or choosing a different specialization.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="glass-card glass-card-hover"
              style={{
                padding: '28px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Stethoscope size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                        Dr. {doc.user.firstName} {doc.user.lastName}
                      </h3>
                      <div style={{ marginTop: '3px' }}>
                        <Badge variant="primary" size="sm">{doc.specialization.name}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {doc.bio || 'Experienced board-certified physician dedicated to evidence-based compassionate care.'}
                </p>

                {/* Consultation Details Meta */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    backgroundColor: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={15} color="#16a34a" />
                    <span>Fee: ${doc.consultationFee.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#0284c7" />
                    <span>Slot: {doc.slotDurationMinutes} mins</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Link
                  to={`/patient/doctors/${doc.id}`}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  View Profile
                </Link>

                <Link
                  to={`/patient/book?doctorId=${doc.id}`}
                  className="brand-button-gradient"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>Book Slot</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
