'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for patient session
    const patientSession = localStorage.getItem('patientSession');
    if (patientSession) {
      try {
        const patientData = JSON.parse(patientSession);
        setPatient(patientData);
      } catch (error) {
        console.error('Error parsing patient session:', error);
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('patientSession');
    router.push('/login');
  };

  const handleStartChat = () => {
    router.push('/chat');
  };

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <main className="dashboard-container">
      <div className="dashboard-card">
        
        {/* Header */}
        <header className="dashboard-header">
          <div className="user-info">
            <div className="avatar">
              {patient.firstName?.[0]?.toUpperCase() || patient.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h1 className="user-name">¡Hola, {patient.firstName || patient.name}! 👋</h1>
              <p className="user-email">{patient.email}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-button">
            Cerrar sesión
          </button>
        </header>

        {/* Main Actions */}
        <div className="main-actions">
          <div className="action-card primary" onClick={handleStartChat}>
            <div className="action-icon">🩺</div>
            <h2 className="action-title">Buscar Sobrecupos</h2>
            <p className="action-description">
              Encuentra citas médicas disponibles para hoy o mañana
            </p>
            <button className="action-button">
              Iniciar búsqueda →
            </button>
          </div>
          
          <div className="action-card">
            <div className="action-icon">📋</div>
            <h3 className="action-title">Mi Historial</h3>
            <p className="action-description">
              Ver mis reservas anteriores
            </p>
            <div className="coming-soon">Próximamente</div>
          </div>
          
          <div className="action-card">
            <div className="action-icon">⚙️</div>
            <h3 className="action-title">Preferencias</h3>
            <p className="action-description">
              Configura especialidades y ubicaciones
            </p>
            <div className="coming-soon">Próximamente</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-section">
          <h3 className="stats-title">Tu actividad</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Sobrecupos reservados</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Especialidades visitadas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Nuevo</div>
              <div className="stat-label">Estado de cuenta</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <p className="footer-text">
            Bienvenido al nuevo sistema personalizado de Sobrecupos AI
          </p>
          <button 
            onClick={() => router.push('/')}
            className="home-link"
          >
            ← Volver al inicio
          </button>
        </div>

      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(180deg, 
            #fafafa 0%, 
            #f5f5f5 50%,
            #e5e5e5 100%);
          padding: 2rem 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }

        .dashboard-container.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666;
          gap: 1rem;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(23, 23, 23, 0.1);
          border-top: 3px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dashboard-card {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 60px;
          height: 60px;
          background: #171717;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.25rem;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-size: 1.5rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 0.25rem;
          letter-spacing: -0.25px;
        }

        .user-email {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .logout-button {
          background: none;
          border: 1px solid #e5e5e5;
          color: #666;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          border-color: #dc2626;
          color: #dc2626;
        }

        /* Main Actions */
        .main-actions {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .action-card {
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .action-card.primary {
          background: linear-gradient(135deg, #171717 0%, #404040 100%);
          color: white;
          border-color: #171717;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .action-card.primary:hover {
          box-shadow: 0 8px 25px rgba(23, 23, 23, 0.3);
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .action-title {
          font-size: 1.125rem;
          font-weight: 500;
          margin: 0 0 0.5rem;
          letter-spacing: -0.25px;
        }

        .action-card:not(.primary) .action-title {
          color: #171717;
          font-size: 1rem;
        }

        .action-description {
          font-size: 0.875rem;
          margin: 0 0 1rem;
          opacity: 0.8;
        }

        .action-card:not(.primary) .action-description {
          color: #666;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .coming-soon {
          background: #fbbf24;
          color: #92400e;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
        }

        /* Stats */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-title {
          font-size: 1.125rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1rem;
          letter-spacing: -0.25px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat-item {
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Footer */
        .dashboard-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid #e5e5e5;
        }

        .footer-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 1rem;
        }

        .home-link {
          background: none;
          border: none;
          color: #171717;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
        }

        .home-link:hover {
          color: #000;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-card {
            padding: 1.5rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .user-name {
            font-size: 1.25rem;
          }

          .main-actions {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .dashboard-card {
            padding: 1rem;
          }

          .user-name {
            font-size: 1.125rem;
          }

          .action-card {
            padding: 1rem;
          }
        }
      `}</style>
    </main>
  );
}