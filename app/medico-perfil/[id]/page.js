'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilPublicoMedico({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [medico, setMedico] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      fetchMedicoData();
    }
  }, [params?.id]);

  const fetchMedicoData = async () => {
    try {
      const response = await fetch(`/api/doctors/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMedico(data);
      } else {
        setError('Médico no encontrado');
      }
    } catch (error) {
      console.error('Error cargando médico:', error);
      setError('Error cargando información del médico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando perfil médico...</p>
        </div>
        
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          }
          
          .loading-content {
            text-align: center;
            color: #666;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e5e5;
            border-top: 3px solid #ff9500;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !medico) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Médico no encontrado</h2>
          <p>{error || 'No se pudo cargar la información del médico'}</p>
          <button onClick={() => router.back()} className="back-button">
            ← Volver
          </button>
        </div>
        
        <style jsx>{`
          .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
            padding: 2rem;
          }
          
          .error-content {
            text-align: center;
            max-width: 400px;
          }
          
          .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          
          .back-button {
            background: #ff9500;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            margin-top: 1rem;
          }
        `}</style>
      </div>
    );
  }

  const doctor = medico.fields;

  return (
    <div className="perfil-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button onClick={() => router.back()} className="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-text">
            <h1 className="header-title">Perfil Médico</h1>
            <span className="header-subtitle">Información Pública</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Información Principal */}
        <section className="doctor-card">
          <div className="doctor-header">
            <div className="doctor-avatar">
              {doctor.PhotoURL ? (
                <img src={doctor.PhotoURL} alt={doctor.Name} className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {doctor.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                </div>
              )}
            </div>
            <div className="doctor-info">
              <h2 className="doctor-name">Dr. {doctor.Name}</h2>
              <p className="doctor-specialty">{doctor.Especialidad}</p>
              {doctor.RSS && (
                <p className="doctor-rss">RSS: {doctor.RSS}</p>
              )}
            </div>
          </div>

          {/* Áreas de Interés */}
          {doctor.AreasInteres && doctor.AreasInteres.length > 0 && (
            <div className="areas-section">
              <h3 className="section-title">
                <span className="title-icon">🎯</span>
                Áreas de Interés
              </h3>
              <div className="areas-grid">
                {doctor.AreasInteres.map(area => (
                  <div key={area} className="area-badge">
                    <span className="area-text">{area}</span>
                  </div>
                ))}
              </div>
              <p className="areas-count">
                {doctor.AreasInteres.length} área{doctor.AreasInteres.length !== 1 ? 's' : ''} de especialización
              </p>
            </div>
          )}

          {/* Información Adicional */}
          <div className="additional-info">
            <div className="info-grid">
              {doctor.Atiende && (
                <div className="info-item">
                  <div className="info-icon">👥</div>
                  <div className="info-content">
                    <span className="info-label">Atiende</span>
                    <span className="info-value">{doctor.Atiende}</span>
                  </div>
                </div>
              )}
              
              {doctor.Seguros && doctor.Seguros.length > 0 && (
                <div className="info-item">
                  <div className="info-icon">💳</div>
                  <div className="info-content">
                    <span className="info-label">Seguros</span>
                    <span className="info-value">{doctor.Seguros.join(', ')}</span>
                  </div>
                </div>
              )}
              
              {doctor.Experiencia && (
                <div className="info-item full-width">
                  <div className="info-icon">📋</div>
                  <div className="info-content">
                    <span className="info-label">Experiencia</span>
                    <span className="info-value">{doctor.Experiencia}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Acción Principal */}
        <section className="action-section">
          <div className="action-card">
            <h3 className="action-title">¿Necesitas una consulta?</h3>
            <p className="action-description">
              Revisa los sobrecupos disponibles de Dr. {doctor.Name?.split(' ')[0]}
            </p>
            <button className="action-button" onClick={() => router.push('/chat')}>
              Ver Disponibilidad
            </button>
          </div>
        </section>
      </main>

      <style jsx>{`
        .perfil-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
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
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
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

        /* Main Content */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Doctor Card */
        .doctor-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .doctor-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .doctor-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #171717, #333);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .doctor-name {
          font-size: 1.75rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem;
          letter-spacing: -0.5px;
        }

        .doctor-specialty {
          font-size: 1.125rem;
          color: #ff9500;
          font-weight: 500;
          margin: 0 0 0.25rem;
        }

        .doctor-rss {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        /* Áreas de Interés */
        .areas-section {
          margin-bottom: 2rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1rem;
        }

        .title-icon {
          font-size: 1rem;
          opacity: 0.7;
        }

        .areas-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .area-badge {
          background: linear-gradient(135deg, #fff8f0, #ffebcc);
          border: 1px solid rgba(255, 149, 0, 0.2);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
          cursor: default;
        }

        .area-badge:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 149, 0, 0.4);
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.15);
        }

        .area-text {
          font-size: 0.875rem;
          color: #ea580c;
          font-weight: 500;
        }

        .areas-count {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
          font-style: italic;
        }

        /* Additional Info */
        .additional-info {
          border-top: 1px solid #f5f5f5;
          padding-top: 2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-icon {
          font-size: 1.125rem;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
          min-width: 0;
        }

        .info-label {
          display: block;
          font-size: 0.75rem;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .info-value {
          display: block;
          font-size: 0.875rem;
          color: #171717;
          font-weight: 400;
          line-height: 1.4;
        }

        /* Action Section */
        .action-section {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .action-title {
          font-size: 1.375rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem;
          letter-spacing: -0.25px;
        }

        .action-description {
          color: #666;
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .action-button {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .action-button:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .main-content {
            padding: 1rem;
          }

          .doctor-card {
            padding: 1.5rem;
          }

          .doctor-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .doctor-avatar {
            width: 100px;
            height: 100px;
          }

          .areas-grid {
            justify-content: center;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .action-section {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .header {
            padding: 0.75rem;
          }

          .main-content {
            padding: 0.75rem;
            gap: 1rem;
          }

          .doctor-card {
            padding: 1rem;
          }

          .doctor-name {
            font-size: 1.5rem;
          }

          .doctor-specialty {
            font-size: 1rem;
          }

          .areas-grid {
            gap: 0.5rem;
          }

          .area-badge {
            padding: 0.375rem 0.75rem;
          }

          .area-text {
            font-size: 0.8125rem;
          }

          .action-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}