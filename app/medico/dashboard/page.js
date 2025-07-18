'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

function MedicoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [stats, setStats] = useState({
    totalSobrecupos: 0,
    disponibles: 0,
    reservados: 0,
    clinicas: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      fetchDoctorData();
      fetchSobrecupos();
    }
  }, [session, status, router]);

  const fetchDoctorData = async () => {
    if (!session?.user?.doctorId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/doctors/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorData(data);
        
        // Calcular estadísticas
        setStats(prev => ({
          ...prev,
          clinicas: data.fields?.Clinicas?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error cargando datos del médico:', error);
    }
  };

  const fetchSobrecupos = async () => {
    if (!session?.user?.doctorId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/sobrecupos/medico/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
        
        // Calcular estadísticas de sobrecupos
        const disponibles = data.filter(s => s.fields?.Disponible === 'Si' || s.fields?.Disponible === true).length;
        const reservados = data.length - disponibles;
        
        setStats(prev => ({
          ...prev,
          totalSobrecupos: data.length,
          disponibles,
          reservados
        }));
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Cargando dashboard...</p>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          }
          .loading-spinner {
            font-size: 2rem;
            margin-bottom: 1rem;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="doctor-info">
            <div className="doctor-avatar">
              {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
            </div>
            <div className="doctor-details">
              <h1 className="doctor-name">
                Dr. {doctorData?.fields?.Name || session.user.name}
              </h1>
              <p className="doctor-specialty">
                {doctorData?.fields?.Especialidad || 'Médico'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalSobrecupos}</div>
            <div className="stat-label">Total Sobrecupos</div>
          </div>
        </div>
        
        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.disponibles}</div>
            <div className="stat-label">Disponibles</div>
          </div>
        </div>
        
        <div className="stat-card reserved">
          <div className="stat-icon">🗓️</div>
          <div className="stat-info">
            <div className="stat-number">{stats.reservados}</div>
            <div className="stat-label">Reservados</div>
          </div>
        </div>
        
        <div className="stat-card clinics">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.clinicas}</div>
            <div className="stat-label">Clínicas</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            onClick={() => router.push('/medico/perfil')}
            className="action-card"
          >
            <div className="action-icon">👤</div>
            <div className="action-title">Mi Perfil</div>
            <div className="action-description">Ver y editar mis datos</div>
          </button>
          
          <button 
            onClick={() => router.push('/medico/sobrecupos')}
            className="action-card"
          >
            <div className="action-icon">💼</div>
            <div className="action-title">Crear Sobrecupos</div>
            <div className="action-description">Agregar nuevos horarios</div>
          </button>
          
          <button 
            onClick={() => router.push('/medico/clinicas')}
            className="action-card"
          >
            <div className="action-icon">🏥</div>
            <div className="action-title">Mis Clínicas</div>
            <div className="action-description">Gestionar ubicaciones</div>
          </button>
        </div>
      </div>

      {/* Recent Sobrecupos */}
      <div className="recent-section">
        <div className="section-header">
          <h2 className="section-title">Sobrecupos Recientes</h2>
          <button 
            onClick={() => router.push('/medico/sobrecupos')}
            className="view-all-btn"
          >
            Ver todos →
          </button>
        </div>
        
        {sobrecupos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">Sin sobrecupos</h3>
            <p className="empty-text">Crea tu primer sobrecupo para comenzar</p>
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="empty-action"
            >
              💼 Crear Sobrecupo
            </button>
          </div>
        ) : (
          <div className="sobrecupos-grid">
            {sobrecupos.slice(0, 6).map((sobrecupo, index) => (
              <div key={index} className="sobrecupo-card">
                <div className="sobrecupo-status">
                  <span className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                    {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? '✅ Disponible' : '🗓️ Reservado'}
                  </span>
                </div>
                <div className="sobrecupo-datetime">
                  📅 {formatDate(sobrecupo.fields?.Fecha)} • 🕐 {sobrecupo.fields?.Hora}
                </div>
                <div className="sobrecupo-location">
                  📍 {sobrecupo.fields?.Clínica}
                </div>
                {sobrecupo.fields?.Nombre && (
                  <div className="sobrecupo-patient">
                    👤 {sobrecupo.fields.Nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding-bottom: 2rem;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .loading-spinner {
          font-size: 2rem;
          margin-bottom: 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 1rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .doctor-avatar {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
        }

        .doctor-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .doctor-specialty {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
        }

        .logout-btn {
          background: #ff3b30;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: #d70015;
          transform: translateY(-1px);
        }

        /* Stats Grid */
        .stats-grid {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        .stat-card.available {
          border-left: 4px solid #34c759;
        }

        .stat-card.reserved {
          border-left: 4px solid #ff9500;
        }

        .stat-card.clinics {
          border-left: 4px solid #007aff;
        }

        .stat-icon {
          font-size: 2rem;
          opacity: 0.8;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* Sections */
        .actions-section, .recent-section {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1.5rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 1rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .view-all-btn:hover {
          color: #0056b3;
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .action-card {
          background: white;
          border: none;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .action-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .action-description {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* Empty State */
        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
        }

        .empty-text {
          color: #6b7280;
          margin: 0 0 1.5rem;
        }

        .empty-action {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }

        /* Sobrecupos Grid */
        .sobrecupos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .sobrecupo-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .sobrecupo-status {
          margin-bottom: 0.75rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.available {
          background: #e6ffed;
          color: #006400;
        }

        .status-badge.reserved {
          background: #fff3cd;
          color: #856404;
        }

        .sobrecupo-datetime {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .sobrecupo-location {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .sobrecupo-patient {
          font-size: 0.8rem;
          color: #007aff;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            padding: 0 1rem;
          }

          .actions-section, .recent-section {
            padding: 0 1rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .sobrecupos-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 1rem;
          }

          .dashboard-header {
            padding: 0.75rem 1rem;
          }

          .doctor-name {
            font-size: 1.1rem;
          }

          .empty-state {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

// Exportar como componente dinámico para evitar SSR
export default dynamic(() => Promise.resolve(MedicoDashboard), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Cargando dashboard...</p>
      </div>
    </div>
  )
});