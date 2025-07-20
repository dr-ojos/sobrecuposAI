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
              <div className="logo-svg-container">
                <svg 
                  className="sobrecupos-logo" 
                  viewBox="0 0 1005 591" 
                  width="180" 
                  height="105"
                >
                  <path 
                    d="M1363 3665 c-143 -39 -241 -131 -293 -272 -19 -53 -22 -77 -18 -156 3 -84 8 -103 40 -168 34 -67 64 -101 320 -357 l283 -282 398 398 c372 372 397 400 397 432 -1 57 -48 98 -98 85 -17 -4 -116 -95 -262 -240 -272 -271 -297 -288 -430 -289 -128 -1 -165 18 -307 157 -144 141 -173 188 -173 282 0 113 70 209 174 240 119 36 179 13 316 -121 l105 -103 -60 -61 -60 -60 -95 94 c-98 98 -132 117 -172 95 -34 -18 -47 -40 -48 -79 0 -30 12 -46 118 -151 92 -92 126 -120 157 -128 83 -22 97 -12 360 249 132 131 255 245 274 255 45 22 126 30 178 16 105 -28 183 -134 183 -245 -1 -110 -4 -114 -438 -548 l-397 -398 60 -60 60 -60 403 402 c374 374 406 408 440 477 36 73 37 78 37 186 0 108 -1 113 -38 187 -103 210 -346 293 -563 194 -42 -19 -87 -56 -164 -131 -58 -58 -110 -105 -115 -105 -5 0 -56 47 -114 104 -59 57 -124 113 -146 124 -102 51 -211 64 -312 37z"
                    fill="#ff3b30"
                    transform="translate(0,591) scale(0.1,-0.1)"
                  />
                  <g transform="translate(0,591) scale(0.1,-0.1)" fill="#1d1d1f">
                    <path d="M3104 3217 c-68 -18 -108 -48 -128 -97 -21 -53 -20 -75 5 -126 25 -53 68 -75 197 -105 115 -27 142 -48 106 -83 -22 -23 -96 -21 -117 2 -10 10 -17 24 -17 30 0 8 -31 12 -101 12 l-101 0 7 -27 c29 -117 130 -171 303 -161 182 11 281 121 224 250 -24 56 -75 83 -204 109 -49 10 -96 23 -104 30 -20 16 -17 36 5 49 41 21 111 5 111 -25 0 -12 18 -15 96 -15 l97 0 -7 33 c-16 84 -92 128 -229 133 -54 2 -113 -2 -143 -9z"/>
                    <path d="M3732 3216 c-97 -32 -175 -116 -188 -203 -16 -111 12 -218 73 -274 61 -58 109 -74 218 -74 84 0 107 4 141 22 53 28 99 74 127 127 32 59 32 203 0 262 -30 57 -79 103 -133 127 -57 26 -178 32 -238 13z m143 -142 c49 -19 68 -178 28 -232 -28 -38 -67 -50 -101 -31 -70 38 -84 186 -25 251 16 18 66 24 98 12z"/>
                    <path d="M4190 3045 l0 -375 100 0 100 0 0 32 0 32 28 -26 c35 -35 72 -48 130 -48 137 1 233 121 232 289 -1 155 -79 260 -206 278 -50 7 -121 -16 -149 -47 -10 -11 -22 -20 -27 -20 -4 0 -8 39 -7 88 0 48 0 106 0 130 l-1 42 -100 0 -100 0 0 -375z m336 17 c30 -21 44 -59 44 -120 0 -57 -3 -67 -29 -93 -31 -31 -53 -35 -95 -19 -66 25 -77 155 -18 223 15 17 77 24 98 9z"/>
                    <path d="M5142 3217 c-18 -5 -46 -25 -62 -44 -16 -18 -32 -33 -35 -33 -3 0 -5 16 -5 35 l0 35 -95 0 -95 0 0 -270 0 -270 100 0 100 0 0 129 c0 157 5 184 41 220 31 32 72 41 130 31 l39 -7 0 87 c0 71 -3 89 -16 94 -22 8 -63 6 -102 -7z"/>
                    <path d="M5487 3220 c-83 -21 -153 -74 -189 -145 -27 -50 -36 -167 -18 -230 16 -58 70 -119 134 -153 46 -24 61 -27 156 -27 114 0 161 15 223 74 26 23 57 71 57 86 0 3 -45 5 -100 5 -55 0 -100 -4 -100 -8 0 -14 -48 -32 -85 -32 -41 0 -90 41 -99 83 l-6 27 201 0 202 0 -5 63 c-6 70 -40 147 -85 189 -62 59 -196 90 -286 68z m151 -155 c12 -14 22 -35 22 -46 0 -17 -8 -19 -95 -19 -80 0 -95 3 -95 16 0 75 116 109 168 49z"/>
                    <path d="M6133 3220 c-86 -18 -160 -74 -198 -150 -27 -52 -31 -165 -10 -230 23 -71 84 -131 161 -160 49 -18 73 -21 140 -17 88 5 130 21 182 71 38 35 62 76 73 124 l7 32 -99 0 c-97 0 -99 0 -105 -25 -13 -51 -85 -72 -131 -40 -53 37 -55 183 -2 236 36 36 111 20 129 -27 9 -23 13 -24 105 -24 89 0 95 1 95 20 0 60 -86 157 -157 178 -56 17 -142 22 -190 12z"/>
                    <path d="M6550 3022 c0 -211 11 -270 57 -314 37 -36 73 -48 139 -48 65 0 112 18 148 56 l26 29 0 -38 0 -37 100 0 100 0 0 270 0 270 -104 0 -105 0 -3 -176 c-3 -198 -6 -204 -79 -204 -63 0 -69 18 -69 212 l0 168 -105 0 -105 0 0 -188z"/>
                    <path d="M7497 3215 c-22 -7 -50 -23 -63 -36 l-24 -22 0 26 0 27 -100 0 -100 0 0 -355 0 -355 100 0 100 0 1 93 c1 50 2 99 3 107 1 19 20 15 56 -12 40 -29 127 -36 185 -13 57 21 108 80 130 152 21 66 16 196 -9 256 -49 114 -170 172 -279 132z m75 -186 c28 -37 28 -141 1 -177 -38 -51 -120 -46 -148 9 -17 33 -20 106 -5 145 16 40 39 54 89 51 34 -1 48 -8 63 -28z"/>
                    <path d="M8032 3216 c-97 -32 -175 -116 -188 -203 -33 -221 96 -364 314 -351 116 7 193 55 245 152 18 33 22 57 22 131 0 74 -4 98 -22 131 -30 57 -79 103 -133 127 -57 26 -178 32 -238 13z m143 -142 c49 -19 68 -178 28 -232 -28 -38 -67 -50 -101 -31 -70 38 -84 186 -25 251 16 18 66 24 98 12z"/>
                    <path d="M8624 3217 c-68 -18 -108 -48 -128 -97 -21 -53 -20 -75 5 -126 25 -53 68 -75 197 -105 115 -27 142 -48 106 -83 -22 -23 -96 -21 -117 2 -10 10 -17 24 -17 30 0 8 -31 12 -101 12 l-101 0 7 -27 c29 -117 130 -171 303 -161 182 11 281 121 224 250 -24 56 -75 83 -204 109 -49 10 -96 23 -104 30 -20 16 -17 36 5 49 41 21 111 5 111 -25 0 -12 18 -15 96 -15 l97 0 -7 33 c-16 84 -92 128 -229 133 -54 2 -113 -2 -143 -9z"/>
                  </g>
                </svg>
              </div>
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
            background: linear-gradient(135deg, #ffffff 0%, #f8faff 50%, #ffffff 100%);
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
            width: 220px;
            height: 220px;
            animation-delay: 0s;
          }

          .pulse-2 {
            width: 280px;
            height: 280px;
            animation-delay: 0.7s;
          }

          .pulse-3 {
            width: 340px;
            height: 340px;
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

          .logo-svg-container {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }

          .sobrecupos-logo {
            filter: drop-shadow(0 8px 16px rgba(255, 59, 48, 0.25));
          }

          .logo-text {
            display: flex;
            align-items: baseline;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }

          .logo-sobrecupos {
            font-size: 3rem;
            font-weight: 800;
            color: #1d1d1f;
            letter-spacing: -1px;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .logo-ai {
            font-size: 2rem;
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
            <span className="logout-text">Salir</span>
          </button>
        </div>
      </header>

      <main className="main-content">
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
                      <div className="card-actions">
                        <div className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                          {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'Disponible' : 'Reservado'}
                        </div>
                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); /* Aquí iría la función de borrar */ }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
                          </svg>
                        </button>
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
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          color: #1d1d1f;
          position: relative;
        }

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
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          padding: 0.5rem 0.75rem;
        }

        .logout-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .logout-text {
          color: #1d1d1f;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: -0.2px;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

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
          background: none;
          border: none;
          color: #007aff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: rgba(0, 122, 255, 0.08);
          transform: scale(1.02);
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
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          padding: 1rem;
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
          margin-bottom: 0.75rem;
          gap: 0.75rem;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 10px;
          padding: 0.5rem;
          min-width: 42px;
          flex-shrink: 0;
          color: white;
        }

        .day {
          font-size: 1.1rem;
          font-weight: 800;
          line-height: 1;
        }

        .month {
          font-size: 0.6rem;
          font-weight: 700;
          margin-top: 0.15rem;
          opacity: 0.9;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1rem;
          font-weight: 700;
          color: #1d1d1f;
          line-height: 1.2;
        }

        .relative-time {
          font-size: 0.75rem;
          color: #6e6e73;
          font-weight: 500;
          margin-top: 0.15rem;
        }

        .status-container {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.3rem 0.65rem;
          border-radius: 16px;
          font-size: 0.7rem;
          font-weight: 700;
          white-space: nowrap;
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
          gap: 0.75rem;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .location-icon {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .clinic-name {
          font-size: 0.85rem;
          color: #1d1d1f;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .clinic-badge {
          background: #e8f8ec;
          color: #1d7040;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid rgba(52, 199, 89, 0.3);
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem;
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
          gap: 0.6rem;
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 0.8rem;
          color: #1d1d1f;
          flex: 1;
          min-width: 0;
          font-weight: 500;
        }

        .confirmed-badge {
          background: #e8f8ec;
          color: #1d7040;
          padding: 0.25rem 0.45rem;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid rgba(52, 199, 89, 0.3);
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem 0.75rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-number {
            font-size: 1.6rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .action-content {
            padding: 0.875rem;
          }

          .section-title {
            font-size: 1.2rem;
          }

          .timeline-card {
            padding: 0.875rem;
          }

          .timeline-header {
            margin-bottom: 0.625rem;
            gap: 0.625rem;
          }

          .card-actions {
            gap: 0.4rem;
          }

          .delete-btn {
            width: 24px;
            height: 24px;
          }

          .delete-btn svg {
            width: 14px;
            height: 14px;
          }

          .date-block {
            min-width: 38px;
            padding: 0.4rem;
          }

          .day {
            font-size: 1rem;
          }

          .month {
            font-size: 0.55rem;
          }

          .time {
            font-size: 0.9rem;
          }

          .relative-time {
            font-size: 0.7rem;
          }

          .status-badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.65rem;
          }

          .timeline-body {
            gap: 0.625rem;
          }

          .clinic-name {
            font-size: 0.8rem;
          }

          .clinic-badge {
            padding: 0.15rem 0.4rem;
            font-size: 0.6rem;
          }

          .patient-info {
            padding: 0.5rem;
            gap: 0.5rem;
          }

          .patient-avatar {
            width: 24px;
            height: 24px;
            font-size: 9px;
          }

          .patient-name {
            font-size: 0.75rem;
          }

          .confirmed-badge {
            padding: 0.2rem 0.35rem;
            font-size: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 0.875rem 0.625rem;
          }

          .stats-grid {
            gap: 0.625rem;
          }

          .stat-card {
            padding: 0.875rem;
          }

          .stat-number {
            font-size: 1.4rem;
          }

          .timeline-card {
            padding: 0.75rem;
          }

          .timeline-header {
            margin-bottom: 0.5rem;
            gap: 0.5rem;
          }

          .card-actions {
            gap: 0.35rem;
          }

          .delete-btn {
            width: 22px;
            height: 22px;
          }

          .delete-btn svg {
            width: 12px;
            height: 12px;
            stroke-width: 1.8;
          }

          .date-block {
            min-width: 34px;
            padding: 0.35rem;
          }

          .day {
            font-size: 0.9rem;
          }

          .month {
            font-size: 0.5rem;
          }

          .time {
            font-size: 0.85rem;
          }

          .relative-time {
            font-size: 0.65rem;
          }

          .status-badge {
            padding: 0.2rem 0.4rem;
            font-size: 0.6rem;
          }

          .timeline-body {
            gap: 0.5rem;
          }

          .clinic-info {
            gap: 0.4rem;
          }

          .clinic-name {
            font-size: 0.75rem;
          }

          .clinic-badge {
            padding: 0.125rem 0.35rem;
            font-size: 0.55rem;
          }

          .patient-info {
            padding: 0.4rem;
            gap: 0.4rem;
          }

          .patient-avatar {
            width: 22px;
            height: 22px;
            font-size: 8px;
          }

          .patient-name {
            font-size: 0.7rem;
          }

          .confirmed-badge {
            padding: 0.15rem 0.3rem;
            font-size: 0.55rem;
          }

          .action-content {
            padding: 0.75rem;
          }

          .action-icon-bg {
            width: 36px;
            height: 36px;
          }

          .action-title {
            font-size: 0.9rem;
          }

          .action-description {
            font-size: 0.75rem;
          }
        }

        .logout-btn:focus,
        .view-all-btn:focus,
        .action-card:focus,
        .empty-action:focus {
          outline: 2px solid #007aff;
          outline-offset: 2px;
        }

        * {
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      background 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      border 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

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