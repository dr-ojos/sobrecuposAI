'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MedicoInfoPage({ params }) {
  const router = useRouter();
  const [medico, setMedico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { slug } = params;

  useEffect(() => {
    const fetchMedicoInfo = async () => {
      try {
        setLoading(true);
        
        // Decodificar el slug para obtener el nombre del médico
        const nombreMedico = decodeURIComponent(slug);
        console.log('🔍 Buscando médico:', nombreMedico);
        
        // Buscar el médico por nombre exacto en la base de datos
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Error fetching doctors');
        
        const doctores = await response.json();
        console.log('📋 Doctores obtenidos:', doctores.length);
        
        // Buscar médico por nombre exacto o similar
        const doctorEncontrado = doctores.find(doc => {
          const docName = doc.fields?.Name;
          if (!docName) return false;
          
          // Comparación exacta primero
          if (docName === nombreMedico) return true;
          
          // Comparación insensible a mayúsculas
          if (docName.toLowerCase() === nombreMedico.toLowerCase()) return true;
          
          // Comparación parcial si contiene el nombre
          return docName.toLowerCase().includes(nombreMedico.toLowerCase()) ||
                 nombreMedico.toLowerCase().includes(docName.toLowerCase());
        });
        
        if (doctorEncontrado) {
          console.log('✅ Médico encontrado:', doctorEncontrado.fields?.Name);
          console.log('📄 Datos del médico:', doctorEncontrado.fields);
          setMedico(doctorEncontrado);
        } else {
          console.log('❌ Médico no encontrado para:', nombreMedico);
          setError('Médico no encontrado');
        }
      } catch (err) {
        console.error('❌ Error cargando info del médico:', err);
        setError('Error cargando información del médico');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMedicoInfo();
    }
  }, [slug]);

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando información del médico...</p>
      </div>
    );
  }

  if (error || !medico) {
    return (
      <div className="error-container">
        <h2>Médico no encontrado</h2>
        <p>{error || 'No se pudo cargar la información del médico'}</p>
        <button onClick={handleBackClick} className="back-to-list">
          Volver a sobrecupos
        </button>
      </div>
    );
  }

  const fields = medico.fields || {};

  return (
    <main className="page-container">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <button onClick={handleBackClick} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Información del Médico</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-container">
          
          {/* Perfil del Médico */}
          <section className="doctor-profile">
            <div className="profile-header">
              <div className="doctor-photo">
                {fields.PhotoURL ? (
                  <img 
                    src={fields.PhotoURL} 
                    alt={`Foto del ${fields.Name}`}
                    className="profile-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="photo-placeholder" style={{display: fields.PhotoURL ? 'none' : 'flex'}}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              <div className="doctor-info">
                <h2 className="doctor-name">{fields.Name}</h2>
                <p className="doctor-specialty">{fields.Especialidad}</p>
                {fields.RSS && (
                  <p className="doctor-rss">RSS: {fields.RSS}</p>
                )}
              </div>
            </div>
          </section>

          {/* Información Profesional */}
          <section className="professional-info">
            <h3 className="section-title">Información Profesional</h3>
            
            <div className="info-grid">
              <div className="info-card">
                <h4 className="info-title">Especialidad</h4>
                <p className="info-content">{fields.Especialidad || 'No especificada'}</p>
              </div>
              
              <div className="info-card">
                <h4 className="info-title">Atiende a</h4>
                <p className="info-content">
                  {fields.Atiende === 'Ambos' ? '👥 Niños y Adultos' : 
                   fields.Atiende === 'Niños' ? '👶 Solo Niños' :
                   fields.Atiende === 'Adultos' ? '👨 Solo Adultos' : 
                   'Consultar'}
                </p>
              </div>
              
              {fields.RSS && (
                <div className="info-card">
                  <h4 className="info-title">Registro Sanitario (RSS)</h4>
                  <p className="info-content">{fields.RSS}</p>
                </div>
              )}
            </div>

            {/* Seguros Aceptados */}
            {fields.Seguros && fields.Seguros.length > 0 && (
              <div className="seguros-section">
                <h4 className="subsection-title">💳 Seguros y Previsiones Aceptadas</h4>
                <div className="seguros-grid">
                  {(Array.isArray(fields.Seguros) ? fields.Seguros : [fields.Seguros]).map((seguro, index) => (
                    <div key={index} className="seguro-card">
                      <span className="seguro-icon">
                        {seguro === 'Fonasa' ? '🏥' : 
                         seguro === 'Isapres' ? '🏥' : 
                         seguro === 'Particular' ? '💰' : '🏥'}
                      </span>
                      <span className="seguro-name">{seguro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Experiencia Profesional */}
          {fields.Experiencia && fields.Experiencia.trim() && (
            <section className="experience-section">
              <h3 className="section-title">📋 Experiencia Profesional</h3>
              <div className="experience-content">
                <p>{fields.Experiencia}</p>
              </div>
            </section>
          )}

          {/* Información importante para pacientes */}
          <section className="patient-info">
            <div className="info-notice">
              <h3 className="notice-title">💡 Información Importante</h3>
              <p><strong>Para reservar sobrecupos:</strong> Utiliza el botón "Reservar Sobrecupo" desde la lista principal de citas disponibles.</p>
              <p><strong>Contacto directo:</strong> Todas las consultas y reservas se manejan a través de nuestra plataforma para tu seguridad y la del profesional.</p>
            </div>
          </section>

          {/* Botón de acción */}
          <section className="action-section">
            <button 
              onClick={handleBackClick}
              className="action-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Volver a Sobrecupos
            </button>
          </section>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
        }

        .header-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 60px;
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
          border-color: #171717;
          background: #f9fafb;
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #ff9500;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Error */
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          padding: 2rem;
        }

        .back-to-list {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .back-to-list:hover {
          background: #e6850a;
        }

        /* Layout */
        .main-layout {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Doctor Profile */
        .doctor-profile {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .doctor-photo {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 2rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        .doctor-specialty {
          font-size: 1.1rem;
          color: #ff9500;
          margin: 0 0 0.5rem 0;
          font-weight: 500;
        }

        .doctor-rss {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        /* Sections */
        .section-title {
          font-size: 1.5rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1.5rem 0;
        }

        .professional-info,
        .experience-section,
        .patient-info {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        .info-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .info-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-content {
          font-size: 1rem;
          color: #171717;
          margin: 0;
          font-weight: 500;
        }

        /* Seguros Section */
        .seguros-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .subsection-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 1rem 0;
        }

        .seguros-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .seguro-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #fff;
          border: 2px solid #ff9500;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .seguro-card:hover {
          background: #ff9500;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(255, 149, 0, 0.2);
        }

        .seguro-icon {
          font-size: 1.25rem;
        }

        .seguro-name {
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Experience */
        .experience-content {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .experience-content p {
          margin: 0;
          line-height: 1.6;
          color: #374151;
        }

        /* Patient Info */
        .info-notice {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .notice-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0c4a6e;
          margin: 0 0 1rem 0;
        }

        .info-notice p {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          color: #0c4a6e;
          line-height: 1.5;
        }

        .info-notice p:last-child {
          margin-bottom: 0;
        }

        /* Action Section */
        .action-section {
          display: flex;
          justify-content: center;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .action-button:hover {
          background: #e6850a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .main-layout {
            padding: 3rem 2rem;
          }

          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }

          .doctor-photo {
            width: 100px;
            height: 100px;
          }

          .doctor-name {
            font-size: 1.5rem;
          }

          .professional-info,
          .experience-section,
          .patient-info,
          .doctor-profile {
            padding: 1.5rem;
          }

          .main-layout {
            padding: 1.5rem 1rem;
          }

          .seguros-grid {
            grid-template-columns: 1fr;
          }

          .seguro-card {
            padding: 0.75rem;
          }

        }

        /* Very small screens */
        @media (max-width: 480px) {
          .doctor-photo {
            width: 80px;
            height: 80px;
          }

          .doctor-name {
            font-size: 1.25rem;
          }

          .professional-info,
          .experience-section,
          .patient-info,
          .doctor-profile {
            padding: 1rem;
          }

          .info-card {
            padding: 1rem;
          }

        }

        /* Safe area for iPhones */
        @supports (padding: max(0px)) {
          .page-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}