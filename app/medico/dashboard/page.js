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
  const [animatedStats, setAnimatedStats] = useState({
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

  // Animación de números más suave
  useEffect(() => {
    Object.keys(stats).forEach(key => {
      const targetValue = stats[key];
      const currentValue = animatedStats[key];
      
      if (targetValue !== currentValue) {
        const increment = Math.ceil((targetValue - currentValue) / 8);
        const timer = setInterval(() => {
          setAnimatedStats(prev => {
            const newValue = prev[key] + increment;
            if (newValue >= targetValue) {
              clearInterval(timer);
              return { ...prev, [key]: targetValue };
            }
            return { ...prev, [key]: newValue };
          });
        }, 80);
      }
    });
  }, [stats]);

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
      const sobrecuposUrl = `/api/sobrecupos/medicos/${session.user.doctorId}`;
      const res = await fetch(sobrecuposUrl);
      
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
        
        const disponibles = data.filter(s => s.fields?.Disponible === 'Si' || s.fields?.Disponible === true).length;
        const reservados = data.length - disponibles;
        
        setTimeout(() => {
          setStats(prev => ({
            ...prev,
            totalSobrecupos: data.length,
            disponibles,
            reservados
          }));
        }, 200);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
    } finally {
      setTimeout(() => setLoading(false), 400);
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

  const getTimeFromNow = (dateStr, timeStr) => {
    const now = new Date();
    const appointmentDate = new Date(`${dateStr}T${timeStr}`);
    const diffMs = appointmentDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 7) return `En ${diffDays} días`;
    return `${Math.ceil(diffDays / 7)} semanas`;
  };

  // Loading state simplificado
  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Cargando dashboard...</p>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f7f7;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .loading-content {
            text-align: center;
            color: #374151;
          }

          .loading-spinner {
            margin-bottom: 1rem;
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #10b981;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }

          .loading-text {
            font-size: 0.95rem;
            color: #6b7280;
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
      {/* Header limpio sin animaciones */}
      <header className="header">
        <div className="header-content">
          <div className="doctor-profile">
            <div className="doctor-avatar">
              {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
            </div>
            <div className="doctor-info">
              <h1 className="doctor-name">
                Dr. {doctorData?.fields?.Name?.split(' ')[0] || session.user.name?.split(' ')[0] || 'Doctor'}
              </h1>
              <p className="doctor-specialty">
                {doctorData?.fields?.Especialidad || 'Médico'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">→</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Stats Cards corregidas */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon">📋</div>
                  <div className="stat-number">{animatedStats.totalSobrecupos}</div>
                </div>
                <div className="stat-label">Total Sobrecupos</div>
                <div className="stat-sublabel">Este mes</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon available">✓</div>
                  <div className="stat-number">{animatedStats.disponibles}</div>
                </div>
                <div className="stat-label">Disponibles</div>
                <div className="stat-sublabel">Para reservar</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon reserved">●</div>
                  <div className="stat-number">{animatedStats.reservados}</div>
                </div>
                <div className="stat-label">Reservados</div>
                <div className="stat-sublabel">Confirmados</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon">🏥</div>
                  <div className="stat-number">{animatedStats.clinicas}</div>
                </div>
                <div className="stat-label">Clínicas</div>
                <div className="stat-sublabel">Ubicaciones</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions simplificadas */}
        <section className="actions-section">
          <div className="section-header">
            <h2 className="section-title">Acciones Rápidas</h2>
          </div>
          <div className="actions-grid">
            <button 
              onClick={() => router.push('/medico/perfil')}
              className="action-card"
            >
              <div className="action-icon">👤</div>
              <div className="action-info">
                <div className="action-title">Mi Perfil</div>
                <div className="action-description">Configuración y datos</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="action-card primary"
            >
              <div className="action-icon">+</div>
              <div className="action-info">
                <div className="action-title">Crear Sobrecupos</div>
                <div className="action-description">Nuevos horarios</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/clinicas')}
              className="action-card"
            >
              <div className="action-icon">🏥</div>
              <div className="action-info">
                <div className="action-title">Mis Clínicas</div>
                <div className="action-description">Gestionar ubicaciones</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
          </div>
        </section>

        {/* Timeline corregida */}
        <section className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">Próximos Sobrecupos</h2>
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
              <h3 className="empty-title">Todo en orden</h3>
              <p className="empty-text">Cuando crees sobrecupos aparecerán aquí</p>
              <button 
                onClick={() => router.push('/medico/sobrecupos')}
                className="empty-action"
              >
                Crear mi primer sobrecupo
              </button>
            </div>
          ) : (
            <div className="timeline-container">
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <div className="time-info">
                        <div className="date-block">
                          <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                          <span className="month">{new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div className="time-details">
                          <span className="time">{sobrecupo.fields?.Hora}</span>
                          <span className="relative-time">{getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}</span>
                        </div>
                      </div>
                      <div className="status-container">
                        <span className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                          {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-body">
                      <div className="clinic-info">
                        <span className="location-icon">📍</span>
                        <span className="clinic-name">{sobrecupo.fields?.Clínica}</span>
                      </div>
                      {sobrecupo.fields?.Nombre && (
                        <div className="patient-info">
                          <span className="patient-icon">👤</span>
                          <span className="patient-name">{sobrecupo.fields.Nombre}</span>
                          <span className="confirmed-badge">Confirmado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f7f7f7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1f2937;
        }

        /* Header limpio */
        .header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }

        .doctor-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doctor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }

        .doctor-info {
          min-width: 0;
        }

        .doctor-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .doctor-specialty {
          font-size: 0.85rem;
          margin: 0;
          color: #6b7280;
        }

        .logout-btn {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }

        /* Stats Cards corregidas */
        .stats-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .stat-icon.available {
          background: #dcfce7;
          color: #16a34a;
        }

        .stat-icon.reserved {
          background: #fef3c7;
          color: #d97706;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .stat-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
          margin: 0;
        }

        .stat-sublabel {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        /* Sections */
        .actions-section, .timeline-section {
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #10b981;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem;
        }

        .view-all-btn:hover {
          color: #059669;
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .action-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
        }

        .action-card.primary {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .action-card.primary:hover {
          background: #059669;
          border-color: #059669;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
        }

        .action-card.primary .action-icon {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: inherit;
        }

        .action-description {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .action-arrow {
          font-size: 1rem;
          opacity: 0.6;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #111827;
        }

        .empty-text {
          color: #6b7280;
          margin: 0 0 2rem;
          font-size: 0.95rem;
        }

        .empty-action {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .empty-action:hover {
          background: #059669;
        }

        /* Timeline corregida */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .timeline-card {
          padding: 1.25rem;
        }

        .timeline-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f3f4f6;
          border-radius: 10px;
          padding: 0.5rem;
          min-width: 50px;
          flex-shrink: 0;
        }

        .day {
          font-size: 1.2rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .month {
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 600;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          line-height: 1.2;
        }

        .relative-time {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .status-container {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-badge.available {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.reserved {
          background: #fef3c7;
          color: #d97706;
        }

        .timeline-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .clinic-info, .patient-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .location-icon, .patient-icon {
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .clinic-name, .patient-name {
          font-size: 0.9rem;
          color: #374151;
          flex: 1;
          min-width: 0;
        }

        .confirmed-badge {
          background: #dcfce7;
          color: #16a34a;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 375px) {
          .main-content {
            padding: 1rem 0.75rem;
          }

          .stats-grid {
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-number {
            font-size: 1.3rem;
          }

          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .status-container {
            align-self: flex-end;
          }
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .main-content {
            padding: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .stat-card {
            padding: 1.5rem;
          }

          .stat-number {
            font-size: 1.8rem;
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