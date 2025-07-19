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
      // ✅ URL corregida que funciona
      const sobrecuposUrl = `/api/sobrecupos/medicos/${session.user.doctorId}`;
      const res = await fetch(sobrecuposUrl);
      
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
        
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 122, 255, 0.2);
            border-top: 3px solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            color: #007aff;
            font-size: 1rem;
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

  return (
    <div className="dashboard-container">
      {/* Header Móvil Optimizado */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="doctor-info">
            <div className="doctor-avatar">
              {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
            </div>
            <div className="doctor-details">
              <h1 className="doctor-name">
                Dr. {doctorData?.fields?.Name?.split(' ')[0] || session.user.name?.split(' ')[0] || 'Doctor'}
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
        {/* Stats Cards Móvil Optimizadas */}
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

        {/* Quick Actions Móvil */}
        <section className="actions-section">
          <h2 className="section-title">Acciones Rápidas</h2>
          <div className="actions-grid">
            <button 
              onClick={() => router.push('/medico/perfil')}
              className="action-card"
            >
              <div className="action-icon">👤</div>
              <div className="action-content">
                <div className="action-title">Mi Perfil</div>
                <div className="action-description">Ver y editar datos</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="action-card"
            >
              <div className="action-icon">💼</div>
              <div className="action-content">
                <div className="action-title">Crear Sobrecupos</div>
                <div className="action-description">Agregar horarios</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/clinicas')}
              className="action-card"
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

        {/* Recent Sobrecupos Móvil */}
        <section className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Sobrecupos Recientes</h2>
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="view-all-btn"
            >
              Ver todos
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
            <div className="sobrecupos-list">
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className="sobrecupo-item">
                  <div className="sobrecupo-left">
                    <div className="sobrecupo-date">
                      <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                      <span className="month">{new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' })}</span>
                    </div>
                    <div className="sobrecupo-time">{sobrecupo.fields?.Hora}</div>
                  </div>
                  <div className="sobrecupo-center">
                    <div className="sobrecupo-clinic">{sobrecupo.fields?.Clínica}</div>
                    {sobrecupo.fields?.Nombre && (
                      <div className="sobrecupo-patient">👤 {sobrecupo.fields.Nombre}</div>
                    )}
                  </div>
                  <div className="sobrecupo-right">
                    <span className={`status-dot ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                      {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? '●' : '●'}
                    </span>
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
          padding-bottom: 2rem;
        }

        /* Header Móvil Optimizado */
        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 122, 255, 0.1);
          padding: 0.75rem 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 10px rgba(0, 122, 255, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }

        .doctor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }

        .doctor-details {
          min-width: 0;
          flex: 1;
        }

        .doctor-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doctor-specialty {
          font-size: 0.8rem;
          color: #007aff;
          margin: 0;
          font-weight: 600;
        }

        .logout-btn {
          background: linear-gradient(135deg, #ff3b30, #ff6b6b);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
          flex-shrink: 0;
        }

        .logout-icon {
          font-size: 0.9rem;
        }

        .logout-text {
          font-size: 0.75rem;
        }

        .main-content {
          padding: 1rem;
        }

        /* Stats Cards Móvil Optimizadas */
        .stats-section {
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 2px 12px rgba(0, 122, 255, 0.08);
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
          height: 3px;
          background: linear-gradient(90deg, #007aff, #5856d6);
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
          gap: 0.75rem;
        }

        .stat-icon {
          font-size: 1.5rem;
          opacity: 0.8;
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #007aff;
          font-weight: 600;
          line-height: 1.2;
        }

        /* Sections */
        .actions-section, .recent-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.2rem;
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
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 6px;
        }

        /* Actions Grid Móvil */
        .actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .action-card {
          background: white;
          border: none;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
          border: 1px solid rgba(0, 122, 255, 0.1);
        }

        .action-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          padding: 0.5rem;
          background: rgba(0, 122, 255, 0.1);
          border-radius: 8px;
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.2rem;
        }

        .action-description {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .action-arrow {
          font-size: 1rem;
          color: #007aff;
          font-weight: 600;
        }

        /* Empty State Móvil */
        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 2rem 1rem;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
          border: 1px solid rgba(0, 122, 255, 0.1);
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
        }

        .empty-text {
          color: #6b7280;
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .empty-action {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }

        /* Lista de Sobrecupos Móvil */
        .sobrecupos-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sobrecupo-item {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.08);
          border: 1px solid rgba(0, 122, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sobrecupo-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 60px;
        }

        .sobrecupo-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }

        .day {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1a1a1a;
        }

        .month {
          font-size: 0.7rem;
          color: #007aff;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sobrecupo-time {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
          margin-top: 0.2rem;
        }

        .sobrecupo-center {
          flex: 1;
          min-width: 0;
        }

        .sobrecupo-clinic {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.2rem;
        }

        .sobrecupo-patient {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .sobrecupo-right {
          flex-shrink: 0;
        }

        .status-dot {
          font-size: 1.2rem;
        }

        .status-dot.available {
          color: #34c759;
        }

        .status-dot.reserved {
          color: #ff9500;
        }

        /* Responsive para pantallas muy pequeñas */
        @media (max-width: 375px) {
          .main-content {
            padding: 0.75rem;
          }

          .stats-grid {
            gap: 0.5rem;
          }

          .stat-card {
            padding: 0.75rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.7rem;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .logout-text {
            display: none;
          }
        }

        /* Responsive para pantallas más grandes (tablet) */
        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .main-content {
            max-width: 800px;
            margin: 0 auto;
          }
        }

        /* Responsive Desktop */
        @media (min-width: 1024px) {
          .dashboard-header {
            padding: 1rem 1.5rem;
          }

          .doctor-avatar {
            width: 50px;
            height: 50px;
            font-size: 16px;
          }

          .doctor-name {
            font-size: 1.3rem;
          }

          .doctor-specialty {
            font-size: 0.9rem;
          }

          .logout-btn {
            padding: 0.7rem 1rem;
            font-size: 0.9rem;
          }

          .logout-text {
            display: inline;
            font-size: 0.9rem;
          }

          .main-content {
            max-width: 1200px;
            padding: 2rem;
          }

          .stats-grid {
            gap: 1.5rem;
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-number {
            font-size: 2.2rem;
          }

          .stat-label {
            font-size: 0.9rem;
          }

          .actions-grid {
            gap: 1.5rem;
          }

          .action-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MedicoDashboard), {
  ssr: false,
  loading: () => (
    <div>Cargando...</div>
  )
});