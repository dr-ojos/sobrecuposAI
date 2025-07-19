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

  // Animación de números
  useEffect(() => {
    Object.keys(stats).forEach(key => {
      const targetValue = stats[key];
      const currentValue = animatedStats[key];
      
      if (targetValue !== currentValue) {
        const increment = Math.ceil((targetValue - currentValue) / 10);
        const timer = setInterval(() => {
          setAnimatedStats(prev => {
            const newValue = prev[key] + increment;
            if (newValue >= targetValue) {
              clearInterval(timer);
              return { ...prev, [key]: targetValue };
            }
            return { ...prev, [key]: newValue };
          });
        }, 50);
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
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
    } finally {
      setTimeout(() => setLoading(false), 600);
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

  // Loading state con animación premium
  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-logo">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay-1"></div>
            <div className="pulse-ring delay-2"></div>
            <div className="logo-center">
              <span className="logo-text">S</span>
            </div>
          </div>
          <h2 className="loading-title">Sobrecupos</h2>
          <p className="loading-subtitle">Cargando tu dashboard...</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
          }

          .loading-content {
            text-align: center;
            color: white;
            animation: fadeInUp 0.8s ease-out;
          }

          .loading-logo {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
          }

          .pulse-ring {
            position: absolute;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 80px;
            height: 80px;
            animation: pulse 2s infinite;
          }

          .pulse-ring.delay-1 {
            animation-delay: 0.3s;
          }

          .pulse-ring.delay-2 {
            animation-delay: 0.6s;
          }

          .logo-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: white;
          }

          .loading-title {
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 0.5rem;
            letter-spacing: -0.02em;
          }

          .loading-subtitle {
            font-size: 1rem;
            opacity: 0.8;
            margin: 0 0 2rem;
            font-weight: 400;
          }

          .loading-progress {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            margin: 0 auto;
            overflow: hidden;
          }

          .progress-bar {
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            animation: loading 1.5s infinite;
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes loading {
            0% {
              transform: translateX(-100px);
            }
            100% {
              transform: translateX(300px);
            }
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
      {/* Floating Header Premium */}
      <header className="floating-header">
        <div className="header-blur"></div>
        <div className="header-content">
          <div className="doctor-profile">
            <div className="avatar-container">
              <div className="avatar-ring"></div>
              <div className="doctor-avatar">
                {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
              </div>
              <div className="status-indicator"></div>
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
            <span className="logout-icon">↗</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Stats Cards con Glassmorphism Premium */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card total" data-stat="total">
              <div className="card-glow"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <span className="stat-icon">📋</span>
                  </div>
                  <div className="stat-trend positive">
                    <span className="trend-arrow">↗</span>
                  </div>
                </div>
                <div className="stat-data">
                  <div className="stat-number">{animatedStats.totalSobrecupos}</div>
                  <div className="stat-label">Total Sobrecupos</div>
                  <div className="stat-sublabel">Este mes</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card available" data-stat="available">
              <div className="card-glow available"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container success">
                    <span className="stat-icon">✨</span>
                  </div>
                  <div className="stat-progress">
                    <div className="progress-circle">
                      <div className="progress-value">{stats.totalSobrecupos > 0 ? Math.round((stats.disponibles / stats.totalSobrecupos) * 100) : 0}%</div>
                    </div>
                  </div>
                </div>
                <div className="stat-data">
                  <div className="stat-number available-number">{animatedStats.disponibles}</div>
                  <div className="stat-label">Disponibles</div>
                  <div className="stat-sublabel">Listos para reservar</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card reserved" data-stat="reserved">
              <div className="card-glow reserved"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container warning">
                    <span className="stat-icon">🎯</span>
                  </div>
                  <div className="stat-badge">
                    <span className="badge-text">Activos</span>
                  </div>
                </div>
                <div className="stat-data">
                  <div className="stat-number reserved-number">{animatedStats.reservados}</div>
                  <div className="stat-label">Reservados</div>
                  <div className="stat-sublabel">Citas confirmadas</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card clinics" data-stat="clinics">
              <div className="card-glow clinics"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container info">
                    <span className="stat-icon">🏥</span>
                  </div>
                  <div className="stat-dots">
                    {Array.from({ length: Math.min(animatedStats.clinicas, 5) }, (_, i) => (
                      <div key={i} className="stat-dot"></div>
                    ))}
                  </div>
                </div>
                <div className="stat-data">
                  <div className="stat-number clinics-number">{animatedStats.clinicas}</div>
                  <div className="stat-label">Clínicas</div>
                  <div className="stat-sublabel">Ubicaciones activas</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions con Hover Premium */}
        <section className="actions-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⚡</span>
              Acciones Rápidas
            </h2>
          </div>
          <div className="actions-grid">
            <button 
              onClick={() => router.push('/medico/perfil')}
              className="action-card profile-action"
            >
              <div className="action-background"></div>
              <div className="action-content">
                <div className="action-icon">👤</div>
                <div className="action-info">
                  <div className="action-title">Mi Perfil</div>
                  <div className="action-description">Configuración y datos</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="action-card create-action primary"
            >
              <div className="action-background primary"></div>
              <div className="action-content">
                <div className="action-icon">✨</div>
                <div className="action-info">
                  <div className="action-title">Crear Sobrecupos</div>
                  <div className="action-description">Nuevos horarios</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/medico/clinicas')}
              className="action-card clinics-action"
            >
              <div className="action-background"></div>
              <div className="action-content">
                <div className="action-icon">🏥</div>
                <div className="action-info">
                  <div className="action-title">Mis Clínicas</div>
                  <div className="action-description">Gestionar ubicaciones</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </button>
          </div>
        </section>

        {/* Timeline de Sobrecupos Premium */}
        <section className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">📅</span>
              Próximos Sobrecupos
            </h2>
            <button 
              onClick={() => router.push('/medico/sobrecupos')}
              className="view-all-btn"
            >
              Ver todos
              <span className="btn-arrow">↗</span>
            </button>
          </div>
          
          {sobrecupos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">
                <div className="empty-circle"></div>
                <div className="empty-circle delay-1"></div>
                <div className="empty-circle delay-2"></div>
              </div>
              <h3 className="empty-title">Todo en orden</h3>
              <p className="empty-text">Cuando crees sobrecupos aparecerán aquí</p>
              <button 
                onClick={() => router.push('/medico/sobrecupos')}
                className="empty-action"
              >
                <span className="btn-icon">✨</span>
                Crear mi primer sobrecupo
              </button>
            </div>
          ) : (
            <div className="timeline-container">
              <div className="timeline-line"></div>
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className={`timeline-item ${index === 0 ? 'next' : ''}`}>
                  <div className="timeline-marker">
                    <div className="marker-ring"></div>
                    <div className="marker-dot"></div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-card">
                      <div className="card-shine"></div>
                      <div className="timeline-header">
                        <div className="time-info">
                          <div className="date-block">
                            <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                            <span className="month">{new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' })}</span>
                          </div>
                          <div className="time-details">
                            <span className="time">{sobrecupo.fields?.Hora}</span>
                            <span className="relative-time">{getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}</span>
                          </div>
                        </div>
                        <div className={`status-indicator ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                          <div className="status-pulse"></div>
                          <span className="status-text">
                            {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                          </span>
                        </div>
                      </div>
                      <div className="timeline-body">
                        <div className="clinic-info">
                          <span className="clinic-icon">📍</span>
                          <span className="clinic-name">{sobrecupo.fields?.Clínica}</span>
                        </div>
                        {sobrecupo.fields?.Nombre && (
                          <div className="patient-info">
                            <span className="patient-icon">👤</span>
                            <span className="patient-name">{sobrecupo.fields.Nombre}</span>
                            <span className="patient-badge">Confirmado</span>
                          </div>
                        )}
                      </div>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', sans-serif;
          color: #1a1a1a;
          padding-bottom: 2rem;
          position: relative;
          overflow-x: hidden;
        }

        .dashboard-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at top, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Floating Header Premium */
        .floating-header {
          position: sticky;
          top: 1rem;
          z-index: 100;
          margin: 1rem;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .header-blur {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }

        .header-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
        }

        .doctor-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar-container {
          position: relative;
        }

        .avatar-ring {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 50%;
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
          animation: rotate 3s linear infinite;
        }

        .doctor-avatar {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          z-index: 1;
          border: 3px solid rgba(255, 255, 255, 0.9);
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #4CAF50;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        .doctor-info {
          color: white;
        }

        .doctor-name {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .doctor-specialty {
          font-size: 0.85rem;
          margin: 0;
          opacity: 0.8;
          font-weight: 500;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 16px;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .main-content {
          padding: 0 1rem;
          position: relative;
          z-index: 1;
        }

        /* Stats Premium */
        .stats-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-card {
          position: relative;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 1.25rem;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover .card-glow {
          opacity: 1;
        }

        .card-glow.available {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1));
        }

        .card-glow.reserved {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1));
        }

        .card-glow.clinics {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(3, 169, 244, 0.1));
        }

        .stat-content {
          position: relative;
          z-index: 1;
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .stat-icon-container {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .stat-icon-container.success {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2));
        }

        .stat-icon-container.warning {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 193, 7, 0.2));
        }

        .stat-icon-container.info {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(3, 169, 244, 0.2));
        }

        .stat-icon {
          font-size: 20px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #4CAF50;
          font-weight: 600;
        }

        .progress-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #4CAF50 0%, #4CAF50 var(--percentage, 0%), rgba(255, 255, 255, 0.3) var(--percentage, 0%));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 700;
          color: white;
        }

        .stat-badge {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
        }

        .stat-dots {
          display: flex;
          gap: 0.25rem;
        }

        .stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          animation: fadeInScale 0.3s ease forwards;
        }

        .stat-dot:nth-child(n) {
          animation-delay: calc(var(--i) * 0.1s);
        }

        .stat-data {
          color: white;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #ffffff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: numberPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .stat-label {
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          opacity: 0.9;
        }

        .stat-sublabel {
          font-size: 0.7rem;
          opacity: 0.7;
          font-weight: 500;
        }

        /* Actions Premium */
        .actions-section {
          margin-bottom: 2rem;
        }

        .section-header {
          margin-bottom: 1rem;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .title-icon {
          font-size: 1.1rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .action-card {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .action-card.primary:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border-color: rgba(255, 255, 255, 0.5);
        }

        .action-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-background.primary {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        }

        .action-card:hover .action-background {
          opacity: 1;
        }

        .action-content {
          position: relative;
          display: flex;
          align-items: center;
          padding: 1.25rem;
          gap: 1rem;
          z-index: 1;
        }

        .action-icon {
          font-size: 1.5rem;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .action-card:hover .action-icon {
          transform: scale(1.1) rotate(5deg);
          background: rgba(255, 255, 255, 0.3);
        }

        .action-info {
          flex: 1;
          color: white;
        }

        .action-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .action-description {
          font-size: 0.85rem;
          opacity: 0.8;
          font-weight: 500;
        }

        .action-arrow {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.3s ease;
        }

        .action-card:hover .action-arrow {
          color: white;
          transform: translateX(4px);
        }

        /* Timeline Premium */
        .timeline-section {
          margin-bottom: 2rem;
        }

        .view-all-btn {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .btn-arrow {
          transition: transform 0.3s ease;
        }

        .view-all-btn:hover .btn-arrow {
          transform: translateX(2px) translateY(-2px);
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: white;
        }

        .empty-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
        }

        .empty-circle {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          animation: float 3s ease-in-out infinite;
        }

        .empty-circle.delay-1 {
          animation-delay: 1s;
          top: 20px;
          left: 40px;
        }

        .empty-circle.delay-2 {
          animation-delay: 2s;
          top: 40px;
          left: 20px;
        }

        .empty-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .empty-text {
          opacity: 0.8;
          margin: 0 0 2rem;
          font-size: 0.95rem;
        }

        .empty-action {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(20px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .empty-action:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .timeline-container {
          position: relative;
          padding-left: 2rem;
        }

        .timeline-line {
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        }

        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .timeline-item.next .timeline-marker .marker-dot {
          background: #4CAF50;
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
        }

        .timeline-marker {
          position: absolute;
          left: -2rem;
          top: 1rem;
          z-index: 2;
        }

        .marker-ring {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .marker-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          position: absolute;
          top: 4px;
          left: 4px;
          transition: all 0.3s ease;
        }

        .timeline-content {
          position: relative;
        }

        .timeline-card {
          position: relative;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 1.25rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .timeline-card:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .timeline-card:hover .card-shine {
          left: 100%;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.5rem;
          min-width: 50px;
        }

        .day {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .month {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          text-transform: uppercase;
        }

        .time-details {
          display: flex;
          flex-direction: column;
        }

        .time {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          line-height: 1;
        }

        .relative-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .status-indicator {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-indicator.available {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .status-indicator.reserved {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        .timeline-body {
          color: white;
        }

        .clinic-info, .patient-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .clinic-icon, .patient-icon {
          font-size: 1rem;
          opacity: 0.8;
        }

        .clinic-name, .patient-name {
          font-size: 0.9rem;
          font-weight: 600;
          flex: 1;
        }

        .patient-badge {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* Animaciones */
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes numberPop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive Premium */
        @media (max-width: 375px) {
          .floating-header {
            margin: 0.75rem;
          }

          .header-content {
            padding: 0.75rem 1rem;
          }

          .doctor-avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .stats-grid {
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-number {
            font-size: 1.6rem;
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
            max-width: 900px;
            margin: 0 auto;
            padding: 0 2rem;
          }

          .floating-header {
            margin: 1.5rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .main-content {
            max-width: 1200px;
          }

          .stats-grid {
            gap: 2rem;
          }

          .stat-card {
            padding: 2rem;
          }

          .stat-number {
            font-size: 2.5rem;
          }

          .timeline-container {
            padding-left: 3rem;
          }

          .timeline-marker {
            left: -3rem;
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