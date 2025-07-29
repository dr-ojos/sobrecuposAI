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
        
        // Filtrar solo sobrecupos futuros (desde hoy)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const futureSobrecupos = data.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          return sobrecupoDate >= today;
        });
        
        // Ordenar por fecha más próxima
        const sortedData = futureSobrecupos.sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateA - dateB;
        });
        
        setSobrecupos(sortedData);
        
        const disponibles = sortedData.filter(s => s.fields?.Disponible === 'Si' || s.fields?.Disponible === true).length;
        const reservados = sortedData.length - disponibles;
        
        setTimeout(() => {
          setStats(prev => ({
            ...prev,
            totalSobrecupos: sortedData.length,
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
          <div className="logo-container">
            <div className="logo-pulses">
              <div className="pulse pulse-1"></div>
              <div className="pulse pulse-2"></div>
              <div className="pulse pulse-3"></div>
            </div>
            <div className="logo-main">
              <div className="logo-text">
                <span className="logo-sobrecupos">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
            </div>
          </div>

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
            background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
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
            border: 2px solid #ff3b30;
            border-radius: 50%;
            opacity: 0;
            animation: pulse 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          }

          .pulse-1 {
            width: 120px;
            height: 120px;
            animation-delay: 0s;
          }

          .pulse-2 {
            width: 160px;
            height: 160px;
            animation-delay: 0.7s;
          }

          .pulse-3 {
            width: 200px;
            height: 200px;
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
            gap: 1.5rem;
          }

          .logo-text {
            display: flex;
            align-items: baseline;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }

          .logo-sobrecupos {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1a1a1a;
            letter-spacing: -1px;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .logo-ai {
            font-size: 1.8rem;
            font-weight: 700;
            color: #007aff;
            background: linear-gradient(135deg, #007aff, #5856d6);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
          }

          .progress-container {
            width: 320px;
            margin: 0 auto;
          }

          .progress-track {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.08);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(10px);
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff3b30, #007aff, #ff3b30);
            background-size: 200% 100%;
            border-radius: 3px;
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
            top: -2px;
            right: -3px;
            width: 12px;
            height: 10px;
            background: #ff3b30;
            border-radius: 50%;
            box-shadow: 0 0 16px #ff3b30, 0 0 32px rgba(255, 59, 48, 0.4);
            animation: glow 1s ease-in-out infinite alternate;
          }

          @keyframes glow {
            from { box-shadow: 0 0 16px #ff3b30, 0 0 32px rgba(255, 59, 48, 0.4); }
            to { box-shadow: 0 0 24px #ff3b30, 0 0 48px rgba(255, 59, 48, 0.6); }
          }

          .loading-text {
            color: #6e6e73;
            font-size: 1rem;
            margin-top: 2rem;
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
            width: 4px;
            height: 4px;
            background: #ff3b30;
            border-radius: 50%;
            opacity: 0;
            animation: particle-float 4s ease-in-out infinite;
          }

          .particle-1 { left: 15%; animation-delay: 0s; }
          .particle-2 { left: 85%; animation-delay: 1s; }
          .particle-3 { left: 65%; animation-delay: 2s; }
          .particle-4 { left: 35%; animation-delay: 0.5s; }
          .particle-5 { left: 75%; animation-delay: 1.5s; }
          .particle-6 { left: 25%; animation-delay: 2.5s; }

          @keyframes particle-float {
            0%, 100% {
              transform: translateY(100vh) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 0.8;
              transform: translateY(90vh) scale(1);
            }
            90% {
              opacity: 0.8;
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
    <div className="dashboard-container">
      {/* Header Móvil - Diseño Actual */}
      <div className="mobile-header">
        <button onClick={() => router.back()} className="back-button">
          ← Inicio
        </button>
        <div className="header-title">
          <span>Dashboard Médico</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Salir
        </button>
      </div>

      {/* Perfil Doctor */}
      <div className="doctor-profile-section">
        <div className="doctor-avatar">
          {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
        </div>
        <div className="doctor-info">
          <h1 className="doctor-name">
            Dr. {doctorData?.fields?.Name || session.user.name || 'Doctor'}
          </h1>
          <p className="doctor-specialty">
            {doctorData?.fields?.Especialidad || 'Médico Especialista'}
          </p>
        </div>
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">Activo</span>
        </div>
      </div>

      {/* Container Principal */}
      <div className="content-container">
        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-number">{animatedStats.totalSobrecupos}</div>
                <div className="stat-label">Total Sobrecupos</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-number">{animatedStats.disponibles}</div>
                <div className="stat-label">Disponibles</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-number">{animatedStats.reservados}</div>
                <div className="stat-label">Reservados</div>
              </div>
            </div>
            
            <div className="stat-card info">
              <div className="stat-icon">🏥</div>
              <div className="stat-info">
                <div className="stat-number">{animatedStats.clinicas}</div>
                <div className="stat-label">Clínicas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="actions-section">
          <h2 className="section-title">⚡ Acciones Rápidas</h2>
          <div className="actions-grid">
            <button onClick={() => router.push('/medico/sobrecupos')} className="action-card primary-action">
              <div className="action-icon">✨</div>
              <div className="action-content">
                <div className="action-title">Crear Sobrecupos</div>
                <div className="action-description">Agregar nuevos horarios</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button onClick={() => router.push('/medico/perfil')} className="action-card">
              <div className="action-icon">👤</div>
              <div className="action-content">
                <div className="action-title">Mi Perfil</div>
                <div className="action-description">Configuración</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
            
            <button onClick={() => router.push('/medico/clinicas')} className="action-card">
              <div className="action-icon">🏥</div>
              <div className="action-content">
                <div className="action-title">Mis Clínicas</div>
                <div className="action-description">Ubicaciones</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
          </div>
        </div>

        {/* Timeline de Sobrecupos */}
        <div className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">📅 Próximos Sobrecupos</h2>
            <button onClick={() => router.push('/medico/sobrecupos')} className="view-all-btn">
              Ver todos
            </button>
          </div>
          
          {sobrecupos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">Sin sobrecupos próximos</h3>
              <p className="empty-text">Crea tu primer sobrecupo para comenzar</p>
              <button onClick={() => router.push('/medico/sobrecupos')} className="empty-action">
                Crear Sobrecupo
              </button>
            </div>
          ) : (
            <div className="timeline-container">
              {sobrecupos.slice(0, 4).map((sobrecupo, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <div className="date-info">
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
                      <div className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                        {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                      </div>
                    </div>
                    <div className="timeline-body">
                      <div className="clinic-info">
                        <span className="location-icon">📍</span>
                        <span className="clinic-name">{sobrecupo.fields?.Clínica}</span>
                      </div>
                      {sobrecupo.fields?.Nombre && (
                        <div className="patient-info">
                          <div className="patient-avatar">
                            {sobrecupo.fields.Nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Header Móvil - Diseño Actual */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
          box-sizing: border-box;
        }

        .back-button, .logout-button {
          background: none;
          border: none;
          color: #007aff;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover, .logout-button:hover {
          background: rgba(0, 122, 255, 0.1);
        }

        .header-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* Perfil Doctor */
        .doctor-profile-section {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 16px;
          background: white;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .doctor-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.25);
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .doctor-specialty {
          font-size: 14px;
          margin: 0;
          color: #6e6e73;
          font-weight: 500;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #34c759;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          font-size: 12px;
          color: #34c759;
          font-weight: 600;
        }

        /* Container Principal */
        .content-container {
          padding: 16px;
          max-width: 100vw;
          box-sizing: border-box;
        }

        /* Stats Cards */
        .stats-section {
          margin-bottom: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .stat-card.primary .stat-icon { background: #e3f2fd; }
        .stat-card.success .stat-icon { background: #e8f5e8; }
        .stat-card.warning .stat-icon { background: #fff3e0; }
        .stat-card.info .stat-icon { background: #f3e5f5; }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #6e6e73;
          font-weight: 600;
          margin: 0;
        }

        /* Secciones */
        .actions-section, .timeline-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: rgba(0, 122, 255, 0.08);
        }

        /* Acciones Rápidas */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .actions-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .action-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 122, 255, 0.2);
        }

        .action-card.primary-action {
          background: linear-gradient(135deg, #34c759, #30d158);
          color: white;
          border-color: rgba(52, 199, 89, 0.3);
          box-shadow: 0 4px 24px rgba(52, 199, 89, 0.2);
        }

        .action-card.primary-action:hover {
          background: linear-gradient(135deg, #28a745, #34c759);
          box-shadow: 0 8px 32px rgba(52, 199, 89, 0.3);
        }

        .action-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .action-card.primary-action .action-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px 0;
          color: #1a1a1a;
        }

        .action-card.primary-action .action-title {
          color: white;
        }

        .action-description {
          font-size: 12px;
          color: #6e6e73;
          margin: 0;
          font-weight: 500;
        }

        .action-card.primary-action .action-description {
          color: rgba(255, 255, 255, 0.9);
        }

        .action-arrow {
          font-size: 16px;
          color: #8e8e93;
          transition: all 0.3s ease;
        }

        .action-card:hover .action-arrow {
          color: #1a1a1a;
          transform: translateX(4px);
        }

        .action-card.primary-action .action-arrow {
          color: white;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 32px 16px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.6;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #1a1a1a;
        }

        .empty-text {
          color: #6e6e73;
          margin: 0 0 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .empty-action {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
        }

        /* Timeline */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-item {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .timeline-item:nth-child(4) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .timeline-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
        }

        .timeline-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 122, 255, 0.15);
        }

        .timeline-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 10px;
          padding: 8px;
          min-width: 40px;
          flex-shrink: 0;
          color: white;
        }

        .day {
          font-size: 16px;
          font-weight: 800;
          line-height: 1;
        }

        .month {
          font-size: 10px;
          font-weight: 700;
          margin-top: 2px;
          opacity: 0.9;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
        }

        .relative-time {
          font-size: 12px;
          color: #6e6e73;
          font-weight: 500;
          margin-top: 2px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .status-badge.available {
          background: #e8f8ec;
          color: #1d7040;
          border: 1px solid rgba(52, 199, 89, 0.3);
        }

        .status-badge.reserved {
          background: #fff3e8;
          color: #cc6d00;
          border: 1px solid rgba(255, 149, 0, 0.3);
        }

        .timeline-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .location-icon {
          font-size: 14px;
          opacity: 0.7;
        }

        .clinic-name {
          font-size: 14px;
          color: #1a1a1a;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .patient-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #af52de, #bf5af2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 14px;
          color: #1a1a1a;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .confirmed-badge {
          background: #e8f8ec;
          color: #1d7040;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid rgba(52, 199, 89, 0.3);
          flex-shrink: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .content-container {
            padding: 12px;
          }

          .stats-grid {
            gap: 8px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-number {
            font-size: 20px;
          }

          .stat-label {
            font-size: 11px;
          }

          .section-title {
            font-size: 16px;
          }

          .timeline-card {
            padding: 12px;
          }

          .timeline-header {
            margin-bottom: 10px;
            gap: 10px;
          }

          .date-block {
            min-width: 36px;
            padding: 6px;
          }

          .day {
            font-size: 14px;
          }

          .month {
            font-size: 9px;
          }

          .time {
            font-size: 14px;
          }

          .relative-time {
            font-size: 11px;
          }

          .status-badge {
            padding: 4px 8px;
            font-size: 10px;
          }

          .timeline-body {
            gap: 10px;
          }

          .clinic-name {
            font-size: 13px;
          }

          .patient-info {
            padding: 10px;
            gap: 10px;
          }

          .patient-avatar {
            width: 24px;
            height: 24px;
            font-size: 9px;
          }

          .patient-name {
            font-size: 13px;
          }

          .confirmed-badge {
            padding: 3px 6px;
            font-size: 9px;
          }

          .action-card {
            padding: 12px;
          }

          .action-icon {
            width: 32px;
            height: 32px;
          }

          .action-title {
            font-size: 13px;
          }

          .action-description {
            font-size: 11px;
          }
        }

        /* Accesibilidad y Estados de Foco */
        .back-button:focus,
        .logout-button:focus,
        .view-all-btn:focus,
        .action-card:focus,
        .empty-action:focus,
        .timeline-card:focus {
          outline: 2px solid #007aff;
          outline-offset: 2px;
        }

        /* Modo de Alto Contraste */
        @media (prefers-contrast: high) {
          .dashboard-container {
            background: #ffffff;
          }

          .stat-card,
          .action-card,
          .timeline-card,
          .empty-state {
            border-color: #000000;
            background: #ffffff;
          }

          .section-title,
          .stat-number,
          .action-title,
          .doctor-name {
            color: #000000;
          }
        }

        /* Reducir Movimiento */
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