// app/medico/clinicas/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ClinicasMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctorClinicas, setDoctorClinicas] = useState([]);
  const [allClinicas, setAllClinicas] = useState([]);
  const [message, setMessage] = useState('');
  const [doctorData, setDoctorData] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchDoctorData();
      fetchAllClinicas();
    }
  }, [session, status, router]);

  const fetchDoctorData = async () => {
    try {
      const res = await fetch(`/api/doctors/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorData(data);
        
        if (data.fields?.Clinicas) {
          fetchDoctorClinicas(data.fields.Clinicas);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del médico:', error);
      setLoading(false);
    }
  };

  const fetchDoctorClinicas = async (clinicaIds) => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const todasClinicas = await res.json();
        const clinicasDelMedico = todasClinicas.filter(c => 
          clinicaIds.includes(c.id)
        );
        setDoctorClinicas(clinicasDelMedico);
      }
    } catch (error) {
      console.error('Error cargando clínicas del médico:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const data = await res.json();
        setAllClinicas(data);
      }
    } catch (error) {
      console.error('Error cargando todas las clínicas:', error);
    }
  };

  const addClinicaToDoctor = async (clinicaId) => {
    try {
      const currentClinicas = doctorData?.fields?.Clinicas || [];
      if (currentClinicas.includes(clinicaId)) {
        setMessage('❌ Esta clínica ya está agregada');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const updatedClinicas = [...currentClinicas, clinicaId];
      
      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.user.doctorId,
          Clinicas: updatedClinicas
        })
      });

      if (res.ok) {
        setMessage('✅ Clínica agregada correctamente');
        fetchDoctorData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error agregando clínica');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const removeClinicaFromDoctor = async (clinicaId) => {
    if (!confirm('¿Estás seguro de eliminar esta clínica de tu perfil?')) return;

    try {
      const currentClinicas = doctorData?.fields?.Clinicas || [];
      const updatedClinicas = currentClinicas.filter(id => id !== clinicaId);
      
      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.user.doctorId,
          Clinicas: updatedClinicas
        })
      });

      if (res.ok) {
        setMessage('✅ Clínica eliminada de tu perfil');
        fetchDoctorData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error eliminando clínica');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const availableClinicas = allClinicas.filter(clinica => 
    !(doctorData?.fields?.Clinicas || []).includes(clinica.id)
  );

  if (status === 'loading' || loading) {
    return <div className="loading-screen">⏳ Cargando clínicas...</div>;
  }

  return (
    <div className="clinicas-container">
      <div className="clinicas-header">
        <button onClick={() => router.back()} className="back-btn">← Volver</button>
        <h1>Mis Clínicas</h1>
        <div className="header-spacer"></div>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="content-container">
        <div className="section">
          <h2>🏥 Mis Clínicas ({doctorClinicas.length})</h2>
          
          {doctorClinicas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h3>Sin clínicas registradas</h3>
              <p>Agrega clínicas donde atiendes para crear sobrecupos</p>
            </div>
          ) : (
            <div className="clinicas-grid">
              {doctorClinicas.map(clinica => (
                <div key={clinica.id} className="clinica-card my-clinica">
                  <div className="card-header">
                    <div className="clinica-badge">✅ Mi Clínica</div>
                    <button 
                      onClick={() => removeClinicaFromDoctor(clinica.id)}
                      className="remove-btn"
                      title="Eliminar de mi perfil"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <span className="detail-text">{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <span className="detail-icon">📞</span>
                          <span className="detail-text">{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>➕ Agregar Clínicas ({availableClinicas.length} disponibles)</h2>
          
          {availableClinicas.length === 0 ? (
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              <span>Ya tienes todas las clínicas disponibles agregadas</span>
            </div>
          ) : (
            <div className="clinicas-grid">
              {availableClinicas.map(clinica => (
                <div key={clinica.id} className="clinica-card available-clinica">
                  <div className="card-header">
                    <div className="clinica-badge available">Disponible</div>
                    <button 
                      onClick={() => addClinicaToDoctor(clinica.id)}
                      className="add-btn"
                      title="Agregar a mi perfil"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <span className="detail-text">{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <span className="detail-icon">📞</span>
                          <span className="detail-text">{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .clinicas-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .clinicas-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #666;
          font-size: 0.875rem;
          font-weight: 400;
        }

        .back-btn:hover {
          border-color: #171717;
          background: #f9fafb;
          color: #171717;
        }

        .clinicas-header h1 {
          font-size: 1.5rem;
          font-weight: 200;
          color: #171717;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .header-spacer {
          width: 64px;
        }

        .message {
          margin: 16px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }

        .message.success {
          background: #e6ffed;
          color: #006400;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #fee;
          color: #b00020;
          border: 1px solid #f5c6cb;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .section {
          background: none;
        }

        .section h2 {
          font-size: 1.5rem;
          font-weight: 200;
          color: #171717;
          margin-bottom: 1.5rem;
          letter-spacing: -0.5px;
        }

        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 300;
          color: #171717;
          margin: 0 0 8px;
          letter-spacing: -0.25px;
        }

        .empty-state p {
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        .info-message {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-weight: 400;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .info-icon {
          font-size: 18px;
        }

        .clinicas-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        @media (min-width: 480px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (min-width: 768px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
          }
        }

        .clinica-card {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .clinica-card:hover {
          background: white;
          border-color: rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .clinica-card.my-clinica {
          border-left: 4px solid #16a34a;
        }

        .clinica-card.available-clinica {
          border-left: 4px solid #2563eb;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem 0.5rem;
        }

        .clinica-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 8px;
          font-size: 0.625rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .clinica-badge:not(.available) {
          background: #dcfce7;
          color: #166534;
        }

        .clinica-badge.available {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .remove-btn, .add-btn {
          border: none;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 400;
        }

        .remove-btn {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .add-btn {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }

        .remove-btn:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }

        .add-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }

        .card-content {
          padding: 0.25rem 1rem 1rem;
        }

        .clinica-name {
          font-size: 1rem;
          font-weight: 400;
          color: #171717;
          margin: 0 0 0.75rem;
          letter-spacing: -0.2px;
          line-height: 1.3;
        }

        .clinica-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .detail-icon {
          font-size: 14px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .detail-text {
          font-size: 0.75rem;
          color: #666;
          line-height: 1.3;
          font-weight: 400;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #666;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .clinicas-header {
            padding: 10px 12px;
          }
          
          .clinicas-header h1 {
            font-size: 15px;
          }
          
          .content-container {
            padding: 12px;
            gap: 2rem;
          }
          
          .section h2 {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .content-container {
            padding: 8px;
            gap: 1.5rem;
          }
          
          .section h2 {
            font-size: 1.125rem;
            margin-bottom: 1rem;
          }
          
          .clinicas-grid {
            gap: 0.5rem;
          }
          
          .card-header {
            padding: 0.625rem 0.75rem 0.375rem;
          }
          
          .card-content {
            padding: 0.125rem 0.75rem 0.75rem;
          }
          
          .clinica-name {
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }
          
          .detail-text {
            font-size: 0.6875rem;
          }
          
          .clinica-badge {
            font-size: 0.5625rem;
            padding: 0.0625rem 0.375rem;
          }
          
          .remove-btn, .add-btn {
            width: 24px;
            height: 24px;
            font-size: 0.6875rem;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .remove-btn, .add-btn {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
      `}</style>
    </div>
  );
}