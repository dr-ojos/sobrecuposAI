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
    <div className="page-container">
      {/* Header minimalista estilo Apple */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => router.back()} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Mis Clínicas</h1>
              <span className="header-subtitle">Gestión</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Mensaje de estado */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Sección Mis Clínicas */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Mis Clínicas</h2>
            <span className="section-count">{doctorClinicas.length}</span>
          </div>
          
          {doctorClinicas.length === 0 ? (
            <div className="empty-container">
              <div className="empty-icon">🏥</div>
              <h3 className="empty-title">Sin clínicas registradas</h3>
              <p className="empty-text">Agrega clínicas donde atiendes para crear sobrecupos</p>
            </div>
          ) : (
            <div className="clinicas-grid">
              {doctorClinicas.map(clinica => (
                <article key={clinica.id} className="clinica-card my-clinica">
                  <div className="card-header">
                    <div className="status-badge my-clinic">Mi Clínica</div>
                    <button 
                      onClick={() => removeClinicaFromDoctor(clinica.id)}
                      className="delete-button"
                      title="Eliminar de mi perfil"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="card-body">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Sección Agregar Clínicas */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Clínicas Disponibles</h2>
            <span className="section-count">{availableClinicas.length}</span>
          </div>
          
          {availableClinicas.length === 0 ? (
            <div className="info-container">
              <div className="info-icon">ℹ️</div>
              <span>Ya tienes todas las clínicas disponibles agregadas</span>
            </div>
          ) : (
            <div className="clinicas-grid">
              {availableClinicas.map(clinica => (
                <article key={clinica.id} className="clinica-card available-clinica">
                  <div className="card-header">
                    <div className="status-badge available">Disponible</div>
                    <button 
                      onClick={() => addClinicaToDoctor(clinica.id)}
                      className="add-button"
                      title="Agregar a mi perfil"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="card-body">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(250, 250, 250, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 1rem 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
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
        }

        .back-button:hover {
          border-color: #ff9500;
          background: #fff8f0;
        }

        .header-text {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #171717;
          margin: 0;
        }

        .header-subtitle {
          font-size: 1rem;
          font-weight: 300;
          color: #666;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        /* Mensaje */
        .message {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
        }

        .message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Sección */
        .section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .section-count {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
        }

        /* Empty State */
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 2rem;
          opacity: 0.4;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 300;
          margin: 0 0 1rem;
          color: #171717;
          letter-spacing: -0.5px;
        }

        .empty-text {
          color: #666;
          margin: 0;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
        }

        /* Info Container */
        .info-container {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-weight: 400;
        }

        .info-icon {
          font-size: 1.125rem;
        }

        /* Grid */
        .clinicas-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2.5rem;
          }
        }

        /* Tarjetas */
        .clinica-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .clinica-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .clinica-card.my-clinica {
          border-left: 4px solid #ff9500;
        }

        .clinica-card.available-clinica {
          border-left: 4px solid #171717;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem 0.75rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .status-badge.my-clinic {
          background: #ff9500;
          color: white;
          border-color: rgba(255, 149, 0, 0.1);
        }

        .status-badge.available {
          background: #171717;
          color: white;
          border-color: rgba(23, 23, 23, 0.1);
        }

        .delete-button, .add-button {
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
        }

        .delete-button:hover {
          border-color: #ff9500;
          background: #fff8f0;
          color: #ff9500;
        }

        .add-button:hover {
          border-color: #171717;
          background: #f9fafb;
          color: #171717;
        }

        .card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .clinica-name {
          font-size: 1.125rem;
          font-weight: 500;
          color: #171717;
          margin: 0;
          letter-spacing: -0.25px;
          line-height: 1.3;
        }

        .clinica-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          color: #666;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .detail-item svg {
          margin-top: 0.125rem;
          flex-shrink: 0;
          color: #999;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .main-content {
            padding: 1rem;
            gap: 2rem;
          }

          .section-title {
            font-size: 1.25rem;
          }

          .card-header {
            padding: 1rem 1.25rem 0.75rem;
          }

          .card-body {
            padding: 1.25rem;
            gap: 1rem;
          }

          .clinica-name {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .header {
            padding: 0.75rem;
          }

          .main-content {
            padding: 0.75rem;
            gap: 1.5rem;
          }

          .section-title {
            font-size: 1.125rem;
          }

          .card-header {
            padding: 0.75rem 1rem 0.5rem;
          }

          .card-body {
            padding: 1rem;
          }

          .delete-button, .add-button {
            width: 32px;
            height: 32px;
          }

          .status-badge {
            font-size: 0.6875rem;
            padding: 0.25rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}