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
            background: radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%);
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
            color: #ffffff;
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
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(10px);
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
            color: rgba(255, 255, 255, 0.7);
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
      {/* Glassmorphism Header */}
      <header className="header">
        <div className="header-backdrop"></div>
        <div className="header-content">
          <div className="doctor-profile">
            <div className="doctor-avatar-container">
              <div className="avatar-glow"></div>
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
            <div className="logout-icon-bg"></div>
            <span className="logout-icon">→</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Premium Stats Cards with 3D Effects */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="card-glow"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="icon-bg icon-bg-blue"></div>
                    <span className="stat-icon">📊</span>
                  </div>
                  <div className="stat-number-container">
                    <span className="stat-number">{animatedStats.totalSobrecupos}</span>
                    <div className="number-sparkle"></div>
                  </div>
                </div>
                <div className="stat-label">Total Sobrecupos</div>
                <div className="stat-sublabel">Este mes</div>
                <div className="stat-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
              <div className="hover-effect"></div>
            </div>
            
            <div className="stat-card stat-available">
              <div className="card-glow"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="icon-bg icon-bg-green"></div>
                    <span className="stat-icon">✅</span>
                  </div>
                  <div className="stat-number-container">
                    <span className="stat-number">{animatedStats.disponibles}</span>
                    <div className="number-sparkle"></div>
                  </div>
                </div>
                <div className="stat-label">Disponibles</div>
                <div className="stat-sublabel">Para reservar</div>
                <div className="pulse-indicator available"></div>
              </div>
              <div className="hover-effect"></div>
            </div>
            
            <div className="stat-card stat-reserved">
              <div className="card-glow"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="icon-bg icon-bg-orange"></div>
                    <span className="stat-icon">🎯</span>
                  </div>
                  <div className="stat-number-container">
                    <span className="stat-number">{animatedStats.reservados}</span>
                    <div className="number-sparkle"></div>
                  </div>
                </div>
                <div className="stat-label">Reservados</div>
                <div className="stat-sublabel">Confirmados</div>
                <div className="pulse-indicator reserved"></div>
              </div>
              <div className="hover-effect"></div>
            </div>
            
            <div className="stat-card stat-clinics">
              <div className="card-glow"></div>
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon-container">
                    <div className="icon-bg icon-bg-purple"></div>
                    <span className="stat-icon">🏥</span>
                  </div>
                  <div className="stat-number-container">
                    <span className="stat-number">{animatedStats.clinicas}</span>
                    <div className="number-sparkle"></div>
                  </div>
                </div>
                <div className="stat-label">Clínicas</div>
                <div className="stat-sublabel">Ubicaciones</div>
                <div className="clinic-dots">
                  {[...Array(Math.min(animatedStats.clinicas, 4))].map((_, i) => (
                    <div key={i} className="clinic-dot" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
              <div className="hover-effect"></div>
            </div>
          </div>
        </section>

        {/* Quick Actions with Glassmorphism */}
        <section className="actions-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⚡</span>
              Acciones Rápidas
            </h2>
          </div>
          <div className="actions-grid">
            <button onClick={() => router.push('/medico/perfil')} className="action-card">
              <div className="action-bg"></div>
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon">👤</div>
                  <div className="icon-ring"></div>
                </div>
                <div className="action-info">
                  <div className="action-title">Mi Perfil</div>
                  <div className="action-description">Configuración y datos personales</div>
                </div>
                <div className="action-arrow">
                  <span>→</span>
                  <div className="arrow-trail"></div>
                </div>
              </div>
            </button>
            
            <button onClick={() => router.push('/medico/sobrecupos')} className="action-card primary">
              <div className="action-bg primary-bg"></div>
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon">✨</div>
                  <div className="icon-ring primary-ring"></div>
                </div>
                <div className="action-info">
                  <div className="action-title">Crear Sobrecupos</div>
                  <div className="action-description">Agregar nuevos horarios disponibles</div>
                </div>
                <div className="action-arrow primary-arrow">
                  <span>→</span>
                  <div className="arrow-trail primary-trail"></div>
                </div>
              </div>
            </button>
            
            <button onClick={() => router.push('/medico/clinicas')} className="action-card">
              <div className="action-bg"></div>
              <div className="action-content">
                <div className="action-icon-container">
                  <div className="action-icon">🏥</div>
                  <div className="icon-ring"></div>
                </div>
                <div className="action-info">
                  <div className="action-title">Mis Clínicas</div>
                  <div className="action-description">Gestionar ubicaciones y centros</div>
                </div>
                <div className="action-arrow">
                  <span>→</span>
                  <div className="arrow-trail"></div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Modern Timeline with Advanced Animations */}
        <section className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">📅</span>
              Próximos Sobrecupos
            </h2>
            <button onClick={() => router.push('/medico/sobrecupos')} className="view-all-btn">
              <span>Ver todos</span>
              <div className="btn-glow"></div>
            </button>
          </div>
          
          {sobrecupos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">
                <div className="empty-particles">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`empty-particle particle-${i + 1}`}></div>
                  ))}
                </div>
                <div className="empty-icon-container">
                  <div className="empty-icon">📋</div>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <h3 className="empty-title">Todo perfectamente organizado</h3>
              <p className="empty-text">Cuando crees sobrecupos, aparecerán aquí con un diseño espectacular</p>
              <button onClick={() => router.push('/medico/sobrecupos')} className="empty-action">
                <span className="btn-text">Crear mi primer sobrecupo</span>
                <div className="btn-shine"></div>
              </button>
            </div>
          ) : (
            <div className="timeline-container">
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="timeline-card">
                    <div className="card-shine"></div>
                    <div className="timeline-header">
                      <div className="time-info">
                        <div className="date-block">
                          <div className="date-bg"></div>
                          <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                          <span className="month">
                            {new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}
                          </span>
                          <div className="date-glow"></div>
                        </div>
                        <div className="time-details">
                          <span className="time">{sobrecupo.fields?.Hora}</span>
                          <span className="relative-time">{getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}</span>
                          <div className="time-line"></div>
                        </div>
                      </div>
                      <div className="status-container">
                        <div className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                          <div className="status-bg"></div>
                          <span className="status-text">
                            {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                          </span>
                          <div className="status-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="timeline-body">
                      <div className="clinic-info">
                        <div className="info-icon">📍</div>
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
                            <div className="confirmed-badge">
                              <span>✓ Confirmado</span>
                              <div className="badge-glow"></div>
                            </div>
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
        * {
          box-sizing: border-box;
        }

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          color: #1d1d1f;
          position: relative;
          overflow-x: hidden;
        }

        .dashboard-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(600px circle at ${cursorPosition.x}px ${cursorPosition.y}px, rgba(0, 122, 255, 0.03), transparent 40%);
          pointer-events: none;
          z-index: 1;
        }

        /* Premium Glassmorphism Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding: 1rem;
        }

        .header-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .header-content {
          position: relative;
          z-index: 10;
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

        .avatar-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #007aff, #5856d6, #007aff);
          border-radius: 50%;
          animation: avatar-glow 3s ease-in-out infinite;
        }

        @keyframes avatar-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .doctor-avatar {
          position: relative;
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
          z-index: 2;
          box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
        }

        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #34c759;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.8);
          animation: status-pulse 2s ease-in-out infinite;
        }

        @keyframes status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(52, 199, 89, 0); }
        }

        .doctor-info {
          min-width: 0;
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
          position: relative;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
        }

        .logout-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .logout-icon-bg {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent);
          transition: left 0.5s ease;
        }

        .logout-btn:hover .logout-icon-bg {
          left: 100%;
        }

        .logout-icon {
          color: #1d1d1f;
          font-size: 18px;
          font-weight: bold;
          z-index: 2;
        }

        .main-content {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        /* Premium Stats Section */
        .stats-section {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          position: relative;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
          animation: card-enter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
          transform: translateY(30px);
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        @keyframes card-enter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(0, 122, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        .card-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent, rgba(0, 122, 255, 0.15), transparent);
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover .card-glow {
          opacity: 1;
        }

        .stat-content {
          position: relative;
          z-index: 10;
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
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 16px;
          opacity: 0.8;
        }

        .icon-bg-blue { background: linear-gradient(135deg, #007aff, #5856d6); }
        .icon-bg-green { background: linear-gradient(135deg, #34c759, #30d158); }
        .icon-bg-orange { background: linear-gradient(135deg, #ff9500, #ff6b35); }
        .icon-bg-purple { background: linear-gradient(135deg, #af52de, #bf5af2); }

        .stat-icon {
          position: relative;
          z-index: 2;
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .stat-number-container {
          position: relative;
          text-align: right;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -1px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: block;
        }

        .number-sparkle {
          position: absolute;
          top: 0;
          right: -8px;
          width: 6px;
          height: 6px;
          background: #007aff;
          border-radius: 50%;
          opacity: 0;
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007aff, #5856d6);
          border-radius: 2px;
          animation: progress-fill 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes progress-fill {
          from { width: 0% !important; }
        }

        .pulse-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-indicator 2s ease-in-out infinite;
        }

        .pulse-indicator.available {
          background: #34c759;
          box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4);
        }

        .pulse-indicator.reserved {
          background: #ff9500;
          box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.4);
        }

        @keyframes pulse-indicator {
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
          animation: clinic-dot 1.5s ease-in-out infinite;
        }

        @keyframes clinic-dot {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .stat-card:hover .hover-effect {
          opacity: 1;
        }

        /* Actions Section */
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
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .view-all-btn {
          position: relative;
          background: rgba(0, 122, 255, 0.08);
          border: 1px solid rgba(0, 122, 255, 0.2);
          color: #007aff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
        }

        .view-all-btn:hover {
          background: rgba(0, 122, 255, 0.12);
          border-color: #007aff;
          transform: translateY(-2px);
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.15), transparent);
          transition: left 0.5s ease;
        }

        .view-all-btn:hover .btn-glow {
          left: 100%;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          position: relative;
          background: none;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          backdrop-filter: blur(20px);
        }

        .action-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(0, 122, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        .action-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
        }

        .action-card:hover .action-bg {
          background: rgba(255, 255, 255, 0.8);
        }

        .primary-bg {
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.08)) !important;
        }

        .action-card.primary:hover .primary-bg {
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(88, 86, 214, 0.12)) !important;
        }

        .action-content {
          position: relative;
          z-index: 10;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          text-align: left;
        }

        .action-icon-container {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-icon {
          font-size: 24px;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .icon-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: icon-ring 3s ease-in-out infinite;
        }

        .primary-ring {
          border-color: rgba(0, 122, 255, 0.5) !important;
        }

        @keyframes icon-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .action-description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          line-height: 1.4;
        }

        .action-arrow {
          position: relative;
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
        }

        .action-card:hover .action-arrow {
          color: #ffffff;
          transform: translateX(4px);
        }

        .primary-arrow {
          color: #007aff !important;
        }

        .action-card.primary:hover .primary-arrow {
          color: #ffffff !important;
        }

        .arrow-trail {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-card:hover .arrow-trail {
          opacity: 1;
        }

        .primary-trail {
          background: radial-gradient(circle, rgba(0, 122, 255, 0.5), transparent) !important;
        }

        /* Timeline Section */
        .timeline-section {
          margin-bottom: 3rem;
        }

        .empty-state {
          position: relative;
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
        }

        .empty-animation {
          position: relative;
          margin-bottom: 2rem;
        }

        .empty-particles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
        }

        .empty-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #007aff;
          border-radius: 50%;
          animation: empty-particle-float 4s ease-in-out infinite;
        }

        .particle-1 { top: 20%; left: 20%; animation-delay: 0s; }
        .particle-2 { top: 20%; right: 20%; animation-delay: 0.5s; }
        .particle-3 { top: 50%; left: 10%; animation-delay: 1s; }
        .particle-4 { top: 50%; right: 10%; animation-delay: 1.5s; }
        .particle-5 { bottom: 20%; left: 30%; animation-delay: 2s; }
        .particle-6 { bottom: 20%; right: 30%; animation-delay: 2.5s; }
        .particle-7 { top: 70%; left: 50%; animation-delay: 3s; }
        .particle-8 { top: 30%; left: 50%; animation-delay: 3.5s; }

        @keyframes empty-particle-float {
          0%, 100% { opacity: 0.3; transform: translateY(0px) scale(1); }
          50% { opacity: 1; transform: translateY(-20px) scale(1.2); }
        }

        .empty-icon-container {
          position: relative;
          display: inline-block;
        }

        .empty-icon {
          font-size: 4rem;
          opacity: 0.7;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          animation: empty-icon-float 3s ease-in-out infinite;
        }

        @keyframes empty-icon-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .icon-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border: 2px solid rgba(0, 122, 255, 0.3);
          border-radius: 50%;
          animation: icon-pulse 2s ease-in-out infinite;
        }

        @keyframes icon-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .empty-text {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 2rem;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .empty-action {
          position: relative;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
        }

        .empty-action:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 48px rgba(0, 122, 255, 0.4);
        }

        .btn-text {
          position: relative;
          z-index: 2;
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .empty-action:hover .btn-shine {
          left: 100%;
        }

        /* Timeline Container */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          animation: timeline-item-enter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
          transform: translateX(-30px);
        }

        @keyframes timeline-item-enter {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .timeline-card {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
          cursor: pointer;
        }

        .timeline-card:hover {
          transform: translateY(-4px) scale(1.01);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transition: left 0.6s ease;
        }

        .timeline-card:hover .card-shine {
          left: 100%;
        }

        .timeline-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex: 1;
          min-width: 0;
        }

        .date-block {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1rem;
          min-width: 60px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .date-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.2), rgba(88, 86, 214, 0.2));
        }

        .day {
          position: relative;
          z-index: 2;
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .month {
          position: relative;
          z-index: 2;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 700;
          margin-top: 0.25rem;
        }

        .date-glow {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(45deg, #007aff, #5856d6);
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .timeline-card:hover .date-glow {
          opacity: 0.3;
        }

        .time-details {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .relative-time {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .time-line {
          position: absolute;
          bottom: -0.5rem;
          left: 0;
          width: 30px;
          height: 2px;
          background: linear-gradient(90deg, #007aff, #5856d6);
          border-radius: 1px;
        }

        .status-container {
          flex-shrink: 0;
        }

        .status-badge {
          position: relative;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .status-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .status-badge.available .status-bg {
          background: rgba(52, 199, 89, 0.2);
          border: 1px solid rgba(52, 199, 89, 0.4);
        }

        .status-badge.reserved .status-bg {
          background: rgba(255, 149, 0, 0.2);
          border: 1px solid rgba(255, 149, 0, 0.4);
        }

        .status-text {
          position: relative;
          z-index: 2;
          padding: 0.5rem 1rem;
          display: block;
        }

        .status-badge.available .status-text {
          color: #34c759;
        }

        .status-badge.reserved .status-text {
          color: #ff9500;
        }

        .status-pulse {
          position: absolute;
          top: 50%;
          right: 0.5rem;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: status-pulse-anim 2s ease-in-out infinite;
        }

        .status-badge.available .status-pulse {
          background: #34c759;
        }

        .status-badge.reserved .status-pulse {
          background: #ff9500;
        }

        @keyframes status-pulse-anim {
          0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.5; transform: translateY(-50%) scale(1.2); }
        }

        .timeline-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .info-icon {
          font-size: 1rem;
          opacity: 0.8;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .clinic-name {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .clinic-badge {
          background: rgba(52, 199, 89, 0.2);
          color: #34c759;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(52, 199, 89, 0.3);
          backdrop-filter: blur(5px);
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .patient-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #af52de, #bf5af2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(175, 82, 222, 0.3);
        }

        .patient-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .confirmed-badge {
          position: relative;
          background: rgba(52, 199, 89, 0.2);
          color: #34c759;
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(52, 199, 89, 0.3);
          flex-shrink: 0;
          backdrop-filter: blur(5px);
          overflow: hidden;
        }

        .badge-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(52, 199, 89, 0.3), transparent);
          transition: left 0.8s ease;
        }

        .timeline-card:hover .badge-glow {
          left: 100%;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-content {
            padding: 1.5rem 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-number {
            font-size: 2rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-content {
            padding: 1.5rem;
          }

          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .time-info {
            gap: 1rem;
          }

          .section-title {
            font-size: 1.3rem;
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
            padding: 1.25rem;
          }

          .stat-number {
            font-size: 1.8rem;
          }

          .timeline-card {
            padding: 1.5rem;
          }

          .patient-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
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
        }

        @media (min-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .stat-card {
            padding: 2.5rem;
          }

          .stat-number {
            font-size: 3rem;
          }

          .actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Advanced Animations for Premium Feel */
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .dashboard-container::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent 40%, rgba(0, 122, 255, 0.02) 50%, transparent 60%);
          background-size: 200% 200%;
          animation: gradient-shift 8s ease-in-out infinite;
          pointer-events: none;
          z-index: 2;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      background 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      border 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .dashboard-container {
            background: #000000;
          }

          .stat-card,
          .action-card,
          .timeline-card {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
          }

          .doctor-name,
          .stat-number,
          .action-title,
          .section-title {
            color: #ffffff;
          }
        }

        /* Focus states for accessibility */
        .logout-btn:focus,
        .view-all-btn:focus,
        .action-card:focus,
        .empty-action:focus {
          outline: 2px solid #007aff;
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .dashboard-container {
            background: white;
            color: black;
          }

          .header {
            position: static;
            background: white;
            border-bottom: 1px solid #ccc;
          }

          .logout-btn,
          .view-all-btn,
          .empty-action {
            display: none;
          }

          .stat-card,
          .action-card,
          .timeline-card {
            background: white;
            border: 1px solid #ccc;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

export default MedicoDashboard;