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
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .clinicas-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
          box-sizing: border-box;
        }

        .back-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(0, 122, 255, 0.1);
        }

        .clinicas-header h1 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
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
          padding: 16px;
        }

        .section {
          margin-bottom: 32px;
        }

        .section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 16px;
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
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
        }

        .info-message {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .info-icon {
          font-size: 18px;
        }

        .clinicas-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .clinicas-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }

        .clinica-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .clinica-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .clinica-card.my-clinica {
          border-color: #34c759;
        }

        .clinica-card.available-clinica:hover {
          border-color: #007aff;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px 8px;
        }

        .clinica-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .clinica-badge:not(.available) {
          background: #e6ffed;
          color: #006400;
        }

        .clinica-badge.available {
          background: #e8f2ff;
          color: #007aff;
        }

        .remove-btn, .add-btn {
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .remove-btn {
          background: #ff3b30;
          color: white;
        }

        .add-btn {
          background: #007aff;
          color: white;
        }

        .remove-btn:hover {
          background: #d70015;
          transform: scale(1.1);
        }

        .add-btn:hover {
          background: #0056b3;
          transform: scale(1.1);
        }

        .card-content {
          padding: 8px 16px 16px;
        }

        .clinica-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 12px;
        }

        .clinica-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
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
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #6b7280;
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