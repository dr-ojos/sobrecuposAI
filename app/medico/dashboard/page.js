'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

function MedicoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
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
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Loading progress animation
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Cursor tracking for glow effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  // Smooth number animation with cubic easing
  useEffect(() => {
    Object.keys(stats).forEach(key => {
      const targetValue = stats[key];
      const currentValue = animatedStats[key];
      
      if (targetValue !== currentValue) {
        let start = currentValue;
        let startTime = Date.now();
        const duration = 1200;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Cubic easing out
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentValue = start + (targetValue - start) * easeOut;
          
          setAnimatedStats(prev => ({
            ...prev,
            [key]: Math.floor(currentValue)
          }));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
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

  // Premium Loading Screen
  if (status === 'loading' || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          {/* Animated Sobrecupos Logo */}
          <div className="logo-container">
            <div className="logo-pulses">
              <div className="pulse pulse-1"></div>
              <div className="pulse pulse-2"></div>
              <div className="pulse pulse-3"></div>
            </div>
            <div className="logo-main">
              <div className="logo-icon">⚕️</div>
              <div className="logo-text">
                <span className="logo-sobrecupos">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
            </div>
          </div>

          {/* Progress Bar with Glow */}
          <div className="progress-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <p className="loading-text">Cargando tu dashboard médico...</p>
          </div>

          {/* Floating Particles */}
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          }

          .loading-content {
            text-align: center;
            position: relative;
          }

          .logo-container {
            position: relative;
            margin-bottom: 3rem;
          }

          .logo-pulses {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid #007aff;
            border-radius: 50%;
            opacity: 0;
            animation: pulse 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          }

          .pulse-1 {
            width: 100px;
            height: 100px;
            animation-delay: 0s;
          }

          .pulse-2 {
            width: 140px;
            height: 140px;
            animation-delay: 0.7s;
          }

          .pulse-3 {
            width: 180px;
            height: 180px;
            animation-delay: 1.4s;
          }

          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(0.5);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }

          .logo-main {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }

          .logo-icon {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            animation: float 3s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .logo-text {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
          }

          .logo-sobrecupos {
            font-size: 2rem;
            font-weight: 700;
            color: #1d1d1f;
            letter-spacing: -0.5px;
          }

          .logo-ai {
            font-size: 1.2rem;
            font-weight: 600;
            color: #007aff;
            background: linear-gradient(135deg, #007aff, #5856d6);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .progress-container {
            width: 280px;
            margin: 0 auto;
          }

          .progress-track {
            width: 100%;
            height: 4px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #007aff, #5856d6, #007aff);
            background-size: 200% 100%;
            border-radius: 2px;
            position: relative;
            transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            animation: shimmer 1.5s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .progress-glow {
            position: absolute;
            top: -1px;
            right: -2px;
            width: 8px;
            height: 6px;
            background: #007aff;
            border-radius: 50%;
            box-shadow: 0 0 12px #007aff, 0 0 24px rgba(0, 122, 255, 0.3);
            animation: glow 1s ease-in-out infinite alternate;
          }

          @keyframes glow {
            from { box-shadow: 0 0 12px #007aff, 0 0 24px rgba(0, 122, 255, 0.3); }
            to { box-shadow: 0 0 16px #007aff, 0 0 32px rgba(0, 122, 255, 0.5); }
          }

          .loading-text {
            color: #6e6e73;
            font-size: 0.9rem;
            margin-top: 1.5rem;
            font-weight: 500;
            letter-spacing: 0.5px;
          }

          .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #007aff;
            border-radius: 50%;
            opacity: 0;
            animation: particle-float 4s ease-in-out infinite;
          }

          .particle-1 { left: 20%; animation-delay: 0s; }
          .particle-2 { left: 80%; animation-delay: 1s; }
          .particle-3 { left: 60%; animation-delay: 2s; }
          .particle-4 { left: 40%; animation-delay: 0.5s; }
          .particle-5 { left: 70%; animation-delay: 1.5s; }
          .particle-6 { left: 30%; animation-delay: 2.5s; }

          @keyframes particle-float {
            0%, 100% {
              transform: translateY(100vh) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: translateY(90vh) scale(1);
            }
            90% {
              opacity: 1;
              transform: translateY(-10vh) scale(1);
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
    <div className="dashboard-container" ref={containerRef}>
      {/* Clean iOS Style Header */}
      <header className="header">
        <div className="header-content">
          <div className="doctor-profile">
            <div className="doctor-avatar-container">
              <div className="doctor-avatar">
                {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
              </div>
              <div className="status-dot"></div>
            </div>
            <div className="doctor-info">
              <h1 className="doctor-name">
                Dr. {doctorData?.fields?.Name?.split(' ')[0] || session.user.name?.split(' ')[0] || 'Doctor'}
              </h1>
              <p className="doctor-specialty">
                {doctorData?.fields?.Especialidad || 'Médico Especialista'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">→</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Clean Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="stat-icon-bg blue">
                      <span className="stat-icon">📊</span>
                    </div>
                  </div>
                  <div className="stat-number">{animatedStats.totalSobrecupos}</div>
                </div>
                <div className="stat-label">Total Sobrecupos</div>
                <div className="stat-sublabel">Este mes</div>
                <div className="stat-progress">
                  <div className="progress-bar">
                    <div className="progress-fill blue-fill" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="stat-icon-bg green">
                      <span className="stat-icon">✅</span>
                    </div>
                  </div>
                  <div className="stat-number">{animatedStats.disponibles}</div>
                </div>
                <div className="stat-label">Disponibles</div>
                <div className="stat-sublabel">Para reservar</div>
                <div className="pulse-indicator green-pulse"></div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="stat-icon-bg orange">
                      <span className="stat-icon">🎯</span>
                    </div>
                  </div>
                  <div className="stat-number">{animatedStats.reservados}</div>
                </div>
                <div className="stat-label">Reservados</div>
                <div className="stat-sublabel">Confirmados</div>
                <div className="pulse-indicator orange-pulse"></div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="stat-icon-bg purple">
                      <span className="stat-icon">🏥</span>
                    </div>
                  </div>
                  <div className="stat-number">{animatedStats.clinicas}</div>
                </div>
                <div className="stat-label">Clínicas</div>
                <div className="stat-sublabel">Ubicaciones</div>
                <div className="clinic-dots">
                  {[...Array(Math.min(animatedStats.clinicas, 4))].map((_, i) => (
                    <div key={i} className="clinic-dot" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Actions Section */}
        <section className="actions-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⚡</span>
              Acciones Rápidas
            </h2>
          </div>
          <div className="actions-grid">
            <button onClick={() => router.push('/medico/perfil')} className="action-card">
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon-bg">
                    <span className="action-icon">👤</span>
                  </div>
                </div>
                <div className="action-info">
                  <div className="action-title">Mi Perfil</div>
                  <div className="action-description">Configuración y datos personales</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </button>
            
            <button onClick={() => router.push('/medico/sobrecupos')} className="action-card primary">
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon-bg primary-icon-bg">
                    <span className="action-icon primary-icon">✨</span>
                  </div>
                </div>
                <div className="action-info">
                  <div className="action-title primary-title">Crear Sobrecupos</div>
                  <div className="action-description primary-description">Agregar nuevos horarios disponibles</div>
                </div>
                <div className="action-arrow primary-arrow">→</div>
              </div>
            </button>
            
            <button onClick={() => router.push('/medico/clinicas')} className="action-card">
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon-bg">
                    <span className="action-icon">🏥</span>
                  </div>
                </div>
                <div className="action-info">
                  <div className="action-title">Mis Clínicas</div>
                  <div className="action-description">Gestionar ubicaciones y centros</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </button>
          </div>
        </section>

        {/* Clean Timeline */}
        <section className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">📅</span>
              Próximos Sobrecupos
            </h2>
            <button onClick={() => router.push('/medico/sobrecupos')} className="view-all-btn">
              Ver todos
            </button>
          </div>
          
          {sobrecupos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-container">
                <div className="empty-icon">📋</div>
              </div>
              <h3 className="empty-title">Todo perfectamente organizado</h3>
              <p className="empty-text">Cuando crees sobrecupos, aparecerán aquí con un diseño espectacular</p>
              <button onClick={() => router.push('/medico/sobrecupos')} className="empty-action">
                Crear mi primer sobrecupo
              </button>
            </div>
          ) : (
            <div className="timeline-container">
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <div className="time-info">
                        <div className="date-block">
                          <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                          <span className="month">
                            {new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}
                          </span>
                        </div>
                        <div className="time-details">
                          <span className="time">{sobrecupo.fields?.Hora}</span>
                          <span className="relative-time">{getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}</span>
                        </div>
                      </div>
                      <div className="status-container">
                        <div className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                          {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                        </div>
                      </div>
                    </div>
                    <div className="timeline-body">
                      <div className="clinic-info">
                        <span className="location-icon">📍</span>
                        <span className="clinic-name">{sobrecupo.fields?.Clínica}</span>
                        <div className="clinic-badge">Activa</div>
                      </div>
                      {sobrecupo.fields?.Nombre && (
                        <div className="patient-info">
                          <div className="patient-avatar">
                            <span>{sobrecupo.fields.Nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <div className="patient-details">
                            <span className="patient-name">{sobrecupo.fields.Nombre}</span>
                            <div className="confirmed-badge">✓ Confirmado</div>
                          </div>
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
        /* Clean Apple-Style Dashboard */
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          color: #1d1d1f;
          position: relative;
        }

        /* Clean Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding: 1rem;
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
          gap: 1rem;
        }

        .doctor-avatar-container {
          position: relative;
        }

        .doctor-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.25);
        }

        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #34c759;
          border-radius: 50%;
          border: 2px solid white;
        }

        .doctor-name {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          color: #1d1d1f;
          letter-spacing: -0.3px;
        }

        .doctor-specialty {
          font-size: 0.9rem;
          margin: 0;
          color: #6e6e73;
          font-weight: 500;
        }

        .logout-btn {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .logout-icon {
          color: #1d1d1f;
          font-size: 18px;
          font-weight: bold;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        /* Clean Stats Cards */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 122, 255, 0.2);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-icon-container {
          position: relative;
        }

        .stat-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .stat-icon-bg.blue { background: #e3f2fd; }
        .stat-icon-bg.green { background: #e8f5e8; }
        .stat-icon-bg.orange { background: #fff3e0; }
        .stat-icon-bg.purple { background: #f3e5f5; }

        .stat-icon {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -1px;
        }

        .stat-label {
          font-size: 1rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
        }

        .stat-sublabel {
          font-size: 0.85rem;
          color: #6e6e73;
          margin: 0;
          font-weight: 500;
        }

        .stat-progress {
          margin-top: 0.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blue-fill { background: linear-gradient(90deg, #007aff, #5856d6); }

        .pulse-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-anim 2s ease-in-out infinite;
        }

        .green-pulse {
          background: #34c759;
          box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4);
        }

        .orange-pulse {
          background: #ff9500;
          box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.4);
        }

        @keyframes pulse-anim {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(52, 199, 89, 0); }
        }

        .clinic-dots {
          display: flex;
          gap: 4px;
          margin-top: 0.5rem;
        }

        .clinic-dot {
          width: 6px;
          height: 6px;
          background: #af52de;
          border-radius: 50%;
          animation: clinic-dot-anim 1.5s ease-in-out infinite;
        }

        @keyframes clinic-dot-anim {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Clean Actions Section */
        .actions-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: -0.5px;
        }

        .title-icon {
          font-size: 1.2rem;
        }

        .view-all-btn {
          background: rgba(0, 122, 255, 0.1);
          border: 1px solid rgba(0, 122, 255, 0.2);
          color: #007aff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          background: rgba(0, 122, 255, 0.15);
          transform: translateY(-2px);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 122, 255, 0.2);
        }

        .action-card.primary {
          background: linear-gradient(135deg, #34c759, #30d158);
          border-color: rgba(52, 199, 89, 0.3);
          box-shadow: 0 4px 24px rgba(52, 199, 89, 0.2);
        }

        .action-card.primary:hover {
          background: linear-gradient(135deg, #28a745, #34c759);
          box-shadow: 0 8px 32px rgba(52, 199, 89, 0.3);
        }

        .action-content {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
        }

        .action-icon-container {
          position: relative;
        }

        .action-icon-bg {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .primary-icon-bg {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .action-icon {
          color: #1d1d1f;
        }

        .primary-icon {
          color: white !important;
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #1d1d1f;
          letter-spacing: -0.2px;
        }

        .primary-title {
          color: white !important;
        }

        .action-description {
          font-size: 0.8rem;
          color: #6e6e73;
          font-weight: 500;
          line-height: 1.3;
        }

        .primary-description {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .action-arrow {
          font-size: 1.2rem;
          color: #8e8e93;
          transition: all 0.3s ease;
        }

        .action-card:hover .action-arrow {
          color: #1d1d1f;
          transform: translateX(4px);
        }

        .primary-arrow {
          color: white !important;
        }

        .action-card.primary:hover .primary-arrow {
          color: white !important;
        }

        /* Clean Timeline */
        .timeline-section {
          margin-bottom: 3rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        .empty-icon-container {
          margin-bottom: 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          opacity: 0.6;
          animation: empty-float 3s ease-in-out infinite;
        }

        @keyframes empty-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: #1d1d1f;
          letter-spacing: -0.5px;
        }

        .empty-text {
          color: #6e6e73;
          margin: 0 0 2rem;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5;
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
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
        }

        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          animation: timeline-enter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
          transform: translateX(-30px);
        }

        @keyframes timeline-enter {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .timeline-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        .timeline-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 122, 255, 0.2);
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
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 12px;
          padding: 0.75rem;
          min-width: 50px;
          flex-shrink: 0;
          color: white;
        }

        .day {
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1;
        }

        .month {
          font-size: 0.65rem;
          font-weight: 700;
          margin-top: 0.2rem;
          opacity: 0.9;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1d1d1f;
          line-height: 1.2;
        }

        .relative-time {
          font-size: 0.8rem;
          color: #6e6e73;
          font-weight: 500;
          margin-top: 0.2rem;
        }

        .status-container {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-badge.available {
          background: #d1f2df;
          color: #1d7040;
          border: 1px solid #34c759;
        }

        .status-badge.reserved {
          background: #ffe4cc;
          color: #cc6d00;
          border: 1px solid #ff9500;
        }

        .timeline-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .location-icon {
          font-size: 1rem;
          opacity: 0.7;
        }

        .clinic-name {
          font-size: 1rem;
          color: #1d1d1f;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .clinic-badge {
          background: #d1f2df;
          color: #1d7040;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid #34c759;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #af52de, #bf5af2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 0.95rem;
          color: #1d1d1f;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .confirmed-badge {
          background: #d1f2df;
          color: #1d7040;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          border: 1px solid #34c759;
          flex-shrink: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-content {
            padding: 1rem 0.75rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1.25rem;
          }

          .stat-number {
            font-size: 1.8rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .action-content {
            padding: 1rem;
          }

          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .time-info {
            gap: 0.75rem;
          }

          .section-title {
            font-size: 1.3rem;
          }

          .timeline-card {
            padding: 1.25rem;
          }
        }

        @media (max-width: 480px) {
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
            font-size: 1.6rem;
          }

          .timeline-card {
            padding: 1rem;
          }

          .patient-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .patient-details {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .confirmed-badge {
            align-self: flex-end;
          }

          .action-content {
            padding: 0.75rem;
          }

          .action-icon-bg {
            width: 40px;
            height: 40px;
          }
        }

        /* Accessibility and Focus States */
        .logout-btn:focus,
        .view-all-btn:focus,
        .action-card:focus,
        .empty-action:focus {
          outline: 2px solid #007aff;
          outline-offset: 2px;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      background 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      border 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .dashboard-container {
            background: #ffffff;
          }

          .stat-card,
          .action-card,
          .timeline-card {
            border-color: #000000;
            background: #ffffff;
          }

          .doctor-name,
          .stat-number,
          .action-title,
          .section-title {
            color: #000000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MedicoDashboard;