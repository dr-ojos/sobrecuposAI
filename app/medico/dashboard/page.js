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
      // ✅ CORRECCIÓN: Cambiar 'medico' por 'medicos'
      console.log('🔍 Doctor ID:', session.user.doctorId);
      const res = await fetch(`/api/sobrecupos/medicos/${session.user.doctorId}`);
      console.log('📡 URL llamada:', `/api/sobrecupos/medicos/${session.user.doctorId}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Sobrecupos cargados:', data.length, 'registros');
        setSobrecupos(data);
        
        const disponibles = data.filter(s => s.fields?.Disponible === 'Si' || s.fields?.Disponible === true).length;
        const reservados = data.length - disponibles;
        
        setStats(prev => ({
          ...prev,
          totalSobrecupos: data.length,
          disponibles,
          reservados
        }));
      } else {
        console.error('❌ Error HTTP:', res.status, res.statusText);
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
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
        </div>
        <p className="loading-text">Cargando dashboard...</p>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #f8faff 100%);
            padding: 1rem;
          }
          .loading-spinner {
            margin-bottom: 1.5rem;
          }
          .spinner-circle {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(0, 122, 255, 0.2);
            border-top: 4px solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            color: #007aff;
            font-size: 1.1rem;
            font-weight: 500;
            margin: 0;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
      {/* Header Responsivo */}
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
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Stats Cards Responsivas */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-content">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalSobrecupos}</div>
                  <div className="stat-label">Total Sobrecupos</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card available">
              <div className="stat-content">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.disponibles}</div>
                  <div className="stat-label">Disponibles</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card reserved">
              <div className="stat-content">
                <div className="stat-icon">🗓️</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.reservados}</div>
                  <div className="stat-label">Reservados</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card clinics">
              <div className="stat-content">
                <div className="stat-icon">🏥</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.clinicas}</div>
                  <div className="stat-label">Clínicas</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2 className="section-title">Acciones Rápidas</h2>
          <div className="actions-grid">
            <button 
              onClick={() => router.push('/medico/perfil')}
              className="action-card profile"
            >
              <div className="action-icon">👤</div>
              <div className="action-content">
                <div className="action-title">Mi Perfil</div>
                <div className="action-description">Ver y editar mis datos</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="action-card create"
            >
              <div className="action-icon">💼</div>
              <div className="action-content">
                <div className="action-title">Crear Sobrecupos</div>
                <div className="action-description">Agregar nuevos horarios</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/clinicas')}
              className="action-card clinics"
            >
              <div className="action-icon">🏥</div>
              <div className="action-content">
                <div className="action-title">Mis Clínicas</div>
                <div className="action-description">Gestionar ubicaciones</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
          </div>
        </section>

        {/* Recent Sobrecupos */}
        <section className="recent-section">
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
              <p className="empty-text">Crea tu primer sobrecupo para comenzar a ayudar a más pacientes</p>
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
                  <div className="sobrecupo-header">
                    <span className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                      {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? '✅ Disponible' : '🗓️ Reservado'}
                    </span>
                  </div>
                  <div className="sobrecupo-details">
                    <div className="sobrecupo-datetime">
                      <span className="date-info">📅 {formatDate(sobrecupo.fields?.Fecha)}</span>
                      <span className="time-info">🕐 {sobrecupo.fields?.Hora}</span>
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #f8faff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
        }

        /* Header Responsivo */
        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 122, 255, 0.1);
          padding: 1rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 10px rgba(0, 122, 255, 0.1);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
          flex: 1;
        }

        .doctor-avatar {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
        }

        .doctor-details {
          min-width: 0;
          flex: 1;
        }

        .doctor-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doctor-specialty {
          font-size: 0.95rem;
          color: #007aff;
          margin: 0;
          font-weight: 600;
        }

        .logout-btn {
          background: linear-gradient(135deg, #ff3b30, #ff6b6b);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.7rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 10px rgba(255, 59, 48, 0.3);
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #d70015, #ff4757);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(255, 59, 48, 0.4);
        }

        .logout-icon {
          font-size: 1rem;
        }

        /* Main Content */
        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        /* Stats Section */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 1.8rem;
          box-shadow: 0 4px 25px rgba(0, 122, 255, 0.08);
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 122, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #007aff, #5856d6);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 35px rgba(0, 122, 255, 0.15);
        }

        .stat-card.available::before {
          background: linear-gradient(90deg, #34c759, #30d158);
        }

        .stat-card.reserved::before {
          background: linear-gradient(90deg, #ff9500, #ffb340);
        }

        .stat-card.clinics::before {
          background: linear-gradient(90deg, #007aff, #5856d6);
        }

        .stat-content {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.9;
        }

        .stat-number {
          font-size: 2.8rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #007aff;
          font-weight: 600;
        }

        /* Sections */
        .actions-section, .recent-section {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .view-all-btn:hover {
          background: rgba(0, 122, 255, 0.1);
          color: #0056b3;
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: white;
          border: none;
          border-radius: 16px;
          padding: 1.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 1.2rem;
          text-align: left;
          border: 1px solid rgba(0, 122, 255, 0.1);
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 122, 255, 0.15);
          border-color: rgba(0, 122, 255, 0.2);
        }

        .action-icon {
          font-size: 2.2rem;
          flex-shrink: 0;
          padding: 0.8rem;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
          border-radius: 12px;
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.3rem;
        }

        .action-description {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .action-arrow {
          font-size: 1.2rem;
          color: #007aff;
          font-weight: 600;
          transition: transform 0.2s ease;
        }

        .action-card:hover .action-arrow {
          transform: translateX(4px);
        }

        /* Empty State */
        .empty-state {
          background: white;
          border-radius: 20px;
          padding: 4rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.08);
          border: 1px solid rgba(0, 122, 255, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.8rem;
        }

        .empty-text {
          color: #6b7280;
          margin: 0 0 2rem;
          font-size: 1rem;
          line-height: 1.5;
        }

        .empty-action {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
        }

        /* Sobrecupos Grid */
        .sobrecupos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .sobrecupo-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.08);
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 122, 255, 0.1);
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 122, 255, 0.12);
        }

        .sobrecupo-header {
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-block;
        }

        .status-badge.available {
          background: linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(48, 209, 88, 0.15));
          color: #006400;
          border: 1px solid rgba(52, 199, 89, 0.3);
        }

        .status-badge.reserved {
          background: linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(255, 179, 64, 0.15));
          color: #995200;
          border: 1px solid rgba(255, 149, 0, 0.3);
        }

        .sobrecupo-details {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .sobrecupo-datetime {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .date-info, .time-info {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .sobrecupo-location {
          font-size: 0.85rem;
          color: #007aff;
          font-weight: 500;
        }

        .sobrecupo-patient {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 600;
          padding: 0.5rem;
          background: rgba(0, 122, 255, 0.05);
          border-radius: 8px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .main-content {
            padding: 1.5rem 1rem;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 0.8rem 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .doctor-info {
            justify-content: center;
          }

          .doctor-avatar {
            width: 50px;
            height: 50px;
            font-size: 16px;
          }

          .doctor-name {
            font-size: 1.2rem;
          }

          .logout-btn {
            align-self: center;
            padding: 0.6rem 1rem;
          }

          .logout-text {
            display: none;
          }

          .main-content {
            padding: 1rem 0.8rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.8rem;
          }

          .stat-card {
            padding: 1.2rem;
          }

          .stat-content {
            flex-direction: column;
            text-align: center;
            gap: 0.8rem;
          }

          .stat-icon {
            font-size: 2rem;
          }

          .stat-number {
            font-size: 2.2rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-card {
            padding: 1.2rem;
          }

          .section-title {
            font-size: 1.3rem;
            margin-bottom: 1rem;
          }

          .sobrecupos-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .empty-state {
            padding: 2.5rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            flex-direction: row;
            justify-content: space-between;
          }

          .doctor-info {
            justify-content: flex-start;
            min-width: 0;
          }

          .doctor-name {
            font-size: 1.1rem;
          }

          .doctor-specialty {
            font-size: 0.85rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-content {
            flex-direction: row;
            text-align: left;
            gap: 1rem;
          }

          .main-content {
            padding: 0.8rem 0.5rem;
          }

          .sobrecupo-datetime {
            flex-direction: column;
            gap: 0.4rem;
          }

          .empty-state {
            padding: 2rem 1rem;
          }

          .empty-icon {
            font-size: 3rem;
          }

          .empty-title {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 320px) {
          .doctor-avatar {
            width: 45px;
            height: 45px;
            font-size: 14px;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .logout-btn {
            padding: 0.5rem 0.8rem;
            font-size: 0.8rem;
          }

          .stat-number {
            font-size: 1.8rem;
          }

          .stat-label {
            font-size: 0.9rem;
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
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #f8faff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '1rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid rgba(0, 122, 255, 0.2)', 
          borderTop: '4px solid #007aff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#007aff', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
          Cargando dashboard...
        </p>
      </div>
    </div>
  )
});