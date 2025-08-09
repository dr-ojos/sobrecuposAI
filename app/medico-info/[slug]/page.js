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
        
        // Convertir slug de vuelta a nombre (reemplazar guiones por espacios)
        const nombreMedico = slug.replace(/-/g, ' ');
        
        // Buscar el médico por nombre
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Error fetching doctors');
        
        const data = await response.json();
        const doctores = data.records || [];
        
        // Buscar médico por nombre (insensible a mayúsculas/minúsculas)
        const doctorEncontrado = doctores.find(doc => 
          doc.fields?.Name?.toLowerCase().includes(nombreMedico.toLowerCase()) ||
          nombreMedico.toLowerCase().includes(doc.fields?.Name?.toLowerCase())
        );
        
        if (doctorEncontrado) {
          setMedico(doctorEncontrado);
        } else {
          setError('Médico no encontrado');
        }
      } catch (err) {
        console.error('Error cargando info del médico:', err);
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
                  {fields.Atiende === 'Ambos' ? 'Adultos y Niños' : 
                   fields.Atiende === 'Niños' ? 'Solo Niños' :
                   fields.Atiende === 'Adultos' ? 'Solo Adultos' : 
                   'Consultar'}
                </p>
              </div>
              
              {fields.Seguros && fields.Seguros.length > 0 && (
                <div className="info-card">
                  <h4 className="info-title">Seguros Aceptados</h4>
                  <div className="seguros-list">
                    {(Array.isArray(fields.Seguros) ? fields.Seguros : [fields.Seguros]).map((seguro, index) => (
                      <span key={index} className="seguro-badge">{seguro}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Experiencia Profesional */}
          {fields.Experiencia && (
            <section className="experience-section">
              <h3 className="section-title">Experiencia Profesional</h3>
              <div className="experience-content">
                <p>{fields.Experiencia}</p>
              </div>
            </section>
          )}

          {/* Contacto */}
          <section className="contact-section">
            <h3 className="section-title">Información de Contacto</h3>
            
            <div className="contact-grid">
              {fields.Email && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Email</span>
                    <span className="contact-value">{fields.Email}</span>
                  </div>
                </div>
              )}
              
              {fields.WhatsApp && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">WhatsApp</span>
                    <span className="contact-value">{fields.WhatsApp}</span>
                  </div>
                </div>
              )}
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
        .contact-section {
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

        .seguros-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .seguro-badge {
          background: #ff9500;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
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

        /* Contact */
        .contact-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .contact-icon {
          width: 40px;
          height: 40px;
          background: #ff9500;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .contact-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-value {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
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

          .contact-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
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
          .contact-section,
          .doctor-profile {
            padding: 1.5rem;
          }

          .main-layout {
            padding: 1.5rem 1rem;
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
          .contact-section,
          .doctor-profile {
            padding: 1rem;
          }

          .info-card {
            padding: 1rem;
          }

          .contact-item {
            padding: 0.75rem;
          }

          .contact-icon {
            width: 32px;
            height: 32px;
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