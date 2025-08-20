'use client';
import { useRouter } from 'next/navigation';

export default function DemoClinicas() {
  const router = useRouter();

  // Datos de ejemplo
  const doctorClinicas = [
    {
      id: 'demo1',
      fields: {
        Nombre: 'Clínica Las Condes',
        Direccion: 'Lo Fontecilla 441, Las Condes',
        Comuna: 'Las Condes',
        Telefono: '+56 2 2610 8000'
      }
    },
    {
      id: 'demo2',
      fields: {
        Nombre: 'Hospital Clínico Universidad Católica',
        Direccion: 'Diagonal Paraguay 362, Santiago',
        Comuna: 'Santiago Centro'
      }
    }
  ];

  const availableClinicas = [
    {
      id: 'demo3',
      fields: {
        Nombre: 'Clínica Alemana',
        Direccion: 'Vitacura 5951, Vitacura',
        Comuna: 'Vitacura',
        Telefono: '+56 2 2210 1111'
      }
    },
    {
      id: 'demo4',
      fields: {
        Nombre: 'Hospital Salvador',
        Direccion: 'Av. Salvador 364, Providencia',
        Comuna: 'Providencia',
        Telefono: '+56 2 2575 2000'
      }
    },
    {
      id: 'demo5',
      fields: {
        Nombre: 'Clínica Santa María',
        Direccion: 'Av. Santa María 0500, Providencia',
        Comuna: 'Providencia'
      }
    }
  ];

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
              <span className="header-subtitle">Demo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Mensaje de demo */}
        <div className="message success">
          ✨ Vista previa del nuevo diseño - Datos de ejemplo
        </div>

        {/* Sección Mis Clínicas */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Mis Clínicas</h2>
            <span className="section-count">{doctorClinicas.length}</span>
          </div>
          
          <div className="clinicas-grid">
            {doctorClinicas.map(clinica => (
              <article key={clinica.id} className="clinica-card my-clinica">
                <div className="card-header">
                  <div className="status-badge my-clinic">Mi Clínica</div>
                  <button 
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
        </section>

        {/* Sección Agregar Clínicas */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Clínicas Disponibles</h2>
            <span className="section-count">{availableClinicas.length}</span>
          </div>
          
          <div className="clinicas-grid">
            {availableClinicas.map(clinica => (
              <article key={clinica.id} className="clinica-card available-clinica">
                <div className="card-header">
                  <div className="status-badge available">Disponible</div>
                  <button 
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