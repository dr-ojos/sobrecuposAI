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
        console.log('📄 Doctor data refreshed, PhotoURL:', data.fields?.PhotoURL);
        console.log('🖥️ User agent (para debug desktop/móvil):', navigator.userAgent.substring(0, 100));
        console.log('🌐 Current location:', window.location.href);
        
        let finalPhotoURL = data.fields?.PhotoURL || '';
        
        // Si hay una foto de S3, generar URL firmada
        if (finalPhotoURL && finalPhotoURL.includes('s3.') && finalPhotoURL.includes('amazonaws.com')) {
          try {
            console.log('🔄 Generando URL firmada para:', finalPhotoURL);
            const photoRes = await fetch(`/api/doctors/${session.user.doctorId}/photo`);
            console.log('📡 Photo API response status:', photoRes.status);
            
            if (photoRes.ok) {
              const photoData = await photoRes.json();
              console.log('📄 Photo API response data:', photoData);
              
              if (photoData.signedUrl) {
                finalPhotoURL = photoData.signedUrl;
                console.log('✅ Using signed URL for existing photo:', finalPhotoURL.substring(0, 100) + '...');
              } else {
                console.warn('⚠️ No signed URL in response');
              }
            } else {
              console.error('❌ Photo API request failed:', photoRes.status);
            }
          } catch (photoError) {
            console.error('❌ Error generating signed URL:', photoError);
          }
        }
        
        // Actualizar los datos con la URL final
        const updatedData = {
          ...data,
          fields: {
            ...data.fields,
            PhotoURL: finalPhotoURL
          }
        };
        
        setDoctorData(updatedData);
        
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

  // Premium Loading Screen estilo Apple
  if (status === 'loading' || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="logo-container">
            <div className="logo-text">
              <span className="logo-sobrecupos">Sobrecupos</span>
              <span className="logo-ai">AI</span>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="loading-text">Cargando tu dashboard médico...</p>
          </div>
        </div>

        <style jsx>{`
          .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          }

          .loading-content {
            text-align: center;
            position: relative;
          }

          .logo-container {
            margin-bottom: 3rem;
          }

          .logo-text {
            font-size: 3rem;
            font-weight: 200;
            letter-spacing: -2px;
            display: inline-flex;
            align-items: baseline;
            gap: 0.5rem;
          }

          .logo-sobrecupos {
            color: #171717;
            font-weight: 800;
          }

          .logo-ai {
            color: #666;
            font-size: 0.7em;
            font-weight: 300;
          }

          .progress-container {
            width: 320px;
            margin: 0 auto;
          }

          .progress-track {
            width: 100%;
            height: 2px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 1px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: #171717;
            border-radius: 1px;
            transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .loading-text {
            color: #666;
            font-size: 0.875rem;
            margin-top: 2rem;
            font-weight: 400;
            letter-spacing: 0.5px;
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
      {/* Header minimalista estilo Apple */}
      <header className="header">
        <div className="header-content">
          <div className="doctor-profile">
            <div className="doctor-avatar-container">
              <div className="doctor-avatar">
                {(() => {
                  console.log('🎯 Render avatar: PhotoURL exists?', !!doctorData?.fields?.PhotoURL);
                  if (doctorData?.fields?.PhotoURL) {
                    console.log('🎯 PhotoURL para render:', doctorData.fields.PhotoURL.substring(0, 100) + '...');
                  }
                  return null;
                })()}
                {doctorData?.fields?.PhotoURL ? (
                  <img 
                    src={doctorData.fields.PhotoURL} 
                    alt="Foto de perfil" 
                    className="profile-photo"
                    onError={(e) => {
                      console.error('❌ Error cargando imagen de perfil:', {
                        url: e.target.src,
                        error: e.type,
                        userAgent: navigator.userAgent.substring(0, 50)
                      });
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="profile-initials" 
                  style={{ display: doctorData?.fields?.PhotoURL ? 'none' : 'flex' }}
                >
                  {doctorData?.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                </div>
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
        {/* Stats Section - estilo Apple minimalista - FUNCIONALIDAD ORIGINAL */}
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

        {/* Actions Section - estilo Apple - FUNCIONALIDAD ORIGINAL */}
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

        {/* Timeline Section - estilo Apple - FUNCIONALIDAD ORIGINAL COMPLETA */}
        <section className="timeline-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">📅</span>
              Próximos Sobrecupos
            </h2>
            <button onClick={() => router.push('/medico/sobrecupos')} className="view-all-btn">
              Gestiona tus sobrecupos
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
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
          position: relative;
          overflow-x: hidden;
        }

        /* Header minimalista */
        .header {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(250, 250, 250, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 1rem 2rem;
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
          background: linear-gradient(135deg, #171717, #333);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .profile-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-initials {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: white;
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
          font-size: 1.25rem;
          font-weight: 300;
          margin: 0;
          color: #171717;
          letter-spacing: -0.5px;
        }

        .doctor-specialty {
          font-size: 0.875rem;
          margin: 0;
          color: #666;
          font-weight: 400;
        }

        .logout-btn {
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          padding: 0.5rem 1rem;
        }

        .logout-btn:hover {
          border-color: #171717;
          background: #171717;
        }

        .logout-btn:hover .logout-text {
          color: white;
        }

        .logout-text {
          color: #666;
          font-size: 0.875rem;
          font-weight: 400;
          transition: color 0.2s ease;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }

        /* Stats Section - estilo Apple minimalista */
        .stats-section {
          margin-bottom: 6rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
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

        .stat-icon-container {
          position: relative;
        }

        .stat-icon-bg {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          background: #f5f5f5;
        }

        .stat-icon-bg.blue { background: #f0f4ff; }
        .stat-icon-bg.green { background: #f0fff4; }
        .stat-icon-bg.orange { background: #fff8f0; }
        .stat-icon-bg.purple { background: #faf0ff; }

        .stat-icon {
          opacity: 0.8;
        }

        .stat-number {
          font-size: 1.75rem;
          font-weight: 200;
          color: #171717;
          letter-spacing: -0.5px;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 400;
          color: #171717;
          margin: 0;
        }

        .stat-sublabel {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        .stat-progress {
          margin-top: 0.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 2px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 1px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 1px;
          transition: width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blue-fill { background: #171717; }

        .pulse-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse-anim 2s ease-in-out infinite;
        }

        .green-pulse {
          background: #34c759;
          box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.3);
        }

        .orange-pulse {
          background: #ff9500;
          box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.3);
        }

        @keyframes pulse-anim {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
        }

        .clinic-dots {
          display: flex;
          gap: 3px;
          margin-top: 0.5rem;
        }

        .clinic-dot {
          width: 4px;
          height: 4px;
          background: #666;
          border-radius: 50%;
          animation: clinic-dot-anim 1.5s ease-in-out infinite;
        }

        @keyframes clinic-dot-anim {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Sections - estilo Apple */
        .actions-section,
        .timeline-section {
          margin-bottom: 6rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 200;
          color: #171717;
          margin: 0;
          letter-spacing: -1px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .title-icon {
          font-size: 1.5rem;
          opacity: 0.6;
        }

        .view-all-btn {
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          color: #666;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Actions Grid - estilo Apple */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .action-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .action-card.primary {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          border-color: #ff9500;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .action-card.primary:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          box-shadow: 0 4px 16px rgba(255, 149, 0, 0.4);
        }

        .action-content {
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          text-align: left;
        }

        .action-icon-container {
          position: relative;
        }

        .action-icon-bg {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .primary-icon-bg {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .action-icon {
          color: #666;
          opacity: 0.8;
        }

        .primary-icon {
          color: white !important;
          opacity: 1;
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 1.125rem;
          font-weight: 400;
          margin-bottom: 0.25rem;
          color: #171717;
          letter-spacing: -0.25px;
        }

        .primary-title {
          color: white !important;
        }

        .action-description {
          font-size: 0.875rem;
          color: #666;
          font-weight: 400;
          line-height: 1.4;
        }

        .primary-description {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .action-arrow {
          font-size: 1.25rem;
          color: #999;
          transition: all 0.2s ease;
        }

        .action-card:hover .action-arrow {
          color: #171717;
          transform: translateX(4px);
        }

        .primary-arrow {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .action-card.primary:hover .primary-arrow {
          color: white !important;
        }

        /* Timeline Section - estilo Apple */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .empty-icon-container {
          margin-bottom: 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          opacity: 0.4;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 300;
          margin: 0 0 1rem;
          color: #171717;
          letter-spacing: -0.5px;
        }

        .empty-text {
          color: #666;
          margin: 0 0 2rem;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
        }

        .empty-action {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .empty-action:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          animation: timeline-enter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes timeline-enter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .timeline-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .timeline-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
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
          background: #171717;
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 48px;
          flex-shrink: 0;
          color: white;
        }

        .day {
          font-size: 1.25rem;
          font-weight: 200;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .month {
          font-size: 0.625rem;
          font-weight: 400;
          margin-top: 0.25rem;
          opacity: 0.8;
          letter-spacing: 1px;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1.125rem;
          font-weight: 300;
          color: #171717;
          line-height: 1.2;
          letter-spacing: -0.25px;
        }

        .relative-time {
          font-size: 0.75rem;
          color: #666;
          font-weight: 400;
          margin-top: 0.25rem;
        }

        .status-container {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 400;
          white-space: nowrap;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .status-badge.available {
          background: #f0fff4;
          color: #166534;
          border-color: rgba(52, 199, 89, 0.1);
        }

        .status-badge.reserved {
          background: #fff8f0;
          color: #ea580c;
          border-color: rgba(255, 149, 0, 0.1);
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
          font-size: 0.875rem;
          opacity: 0.6;
        }

        .clinic-name {
          font-size: 0.875rem;
          color: #171717;
          flex: 1;
          min-width: 0;
          font-weight: 400;
        }

        .clinic-badge {
          background: #f0fff4;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 400;
          border: 1px solid rgba(52, 199, 89, 0.1);
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #fafafa;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .patient-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 400;
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
          font-size: 0.875rem;
          color: #171717;
          flex: 1;
          min-width: 0;
          font-weight: 400;
        }

        .confirmed-badge {
          background: #f0fff4;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 400;
          border: 1px solid rgba(52, 199, 89, 0.1);
          flex-shrink: 0;
        }

        /* Responsive - Tablet mantiene 4 columnas */
        @media (min-width: 769px) and (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }

          .stat-card {
            padding: 1.25rem;
          }

          .stat-number {
            font-size: 1.75rem;
          }
        }

        /* Responsive - Mobile optimizado */
        @media (max-width: 768px) {
          .header {
            padding: 0.75rem 1rem;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .doctor-profile {
            justify-content: center;
          }

          .doctor-name {
            font-size: 1.125rem;
          }

          .doctor-specialty {
            font-size: 0.8125rem;
          }

          .logout-btn {
            width: 100%;
            justify-content: center;
            padding: 0.75rem;
          }

          .main-content {
            padding: 1.5rem 1rem;
          }

          .stats-section {
            margin-bottom: 4rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .stat-card {
            padding: 1.25rem;
            border-radius: 12px;
          }

          .stat-number {
            font-size: 1.875rem;
          }

          .stat-label {
            font-size: 0.875rem;
          }

          .stat-sublabel {
            font-size: 0.75rem;
          }

          .actions-section,
          .timeline-section {
            margin-bottom: 4rem;
          }

          .section-header {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .section-title {
            font-size: 1.375rem;
            text-align: center;
          }

          .view-all-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, #ff9500, #ff8800);
            color: white;
            border: none;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(255, 149, 0, 0.25);
          }

          .view-all-btn:hover {
            background: linear-gradient(135deg, #ff8800, #ff7700);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.35);
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-content {
            padding: 1.25rem;
          }

          .action-title {
            font-size: 1rem;
          }

          .action-description {
            font-size: 0.8125rem;
          }

          .timeline-card {
            padding: 1.125rem;
            border-radius: 12px;
          }

          .timeline-header {
            margin-bottom: 0.875rem;
            gap: 0.75rem;
          }

          .date-block {
            min-width: 40px;
            padding: 0.5rem;
            border-radius: 6px;
          }

          .day {
            font-size: 1rem;
          }

          .month {
            font-size: 0.5rem;
          }

          .time {
            font-size: 1rem;
          }

          .relative-time {
            font-size: 0.6875rem;
          }

          .status-badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.6875rem;
          }

          .timeline-body {
            gap: 0.75rem;
          }

          .clinic-name {
            font-size: 0.8125rem;
          }

          .clinic-badge {
            padding: 0.1875rem 0.375rem;
            font-size: 0.5625rem;
          }

          .patient-info {
            padding: 0.75rem;
            gap: 0.625rem;
          }

          .patient-avatar {
            width: 30px;
            height: 30px;
            font-size: 10px;
          }

          .patient-name {
            font-size: 0.8125rem;
          }

          .confirmed-badge {
            padding: 0.1875rem 0.375rem;
            font-size: 0.5625rem;
          }

          .empty-state {
            padding: 3rem 1.5rem;
          }

          .empty-title {
            font-size: 1.25rem;
          }

          .empty-text {
            font-size: 0.875rem;
          }

          .empty-action {
            width: 100%;
            padding: 1rem;
          }
        }

        /* iPhone SE y dispositivos muy pequeños */
        @media (max-width: 480px) {
          .header {
            padding: 0.625rem 0.75rem;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .doctor-specialty {
            font-size: 0.75rem;
          }

          .logout-btn {
            padding: 0.625rem;
            font-size: 0.8125rem;
          }

          .main-content {
            padding: 1.25rem 0.75rem;
          }

          .stats-section {
            margin-bottom: 3rem;
          }

          .stats-grid {
            gap: 0.75rem;
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.8125rem;
          }

          .stat-sublabel {
            font-size: 0.6875rem;
          }

          .actions-section,
          .timeline-section {
            margin-bottom: 3rem;
          }

          .section-title {
            font-size: 1.125rem;
          }

          .view-all-btn {
            padding: 0.75rem;
            font-size: 0.8125rem;
          }

          .action-content {
            padding: 1rem;
          }

          .action-icon-bg {
            width: 36px;
            height: 36px;
          }

          .action-title {
            font-size: 0.9375rem;
          }

          .action-description {
            font-size: 0.75rem;
          }

          .timeline-card {
            padding: 1rem;
          }

          .timeline-header {
            margin-bottom: 0.625rem;
            gap: 0.625rem;
          }

          .date-block {
            min-width: 36px;
            padding: 0.375rem;
          }

          .day {
            font-size: 0.9375rem;
          }

          .month {
            font-size: 0.4375rem;
          }

          .time {
            font-size: 0.9375rem;
          }

          .relative-time {
            font-size: 0.625rem;
          }

          .status-badge {
            padding: 0.1875rem 0.375rem;
            font-size: 0.625rem;
          }

          .timeline-body {
            gap: 0.625rem;
          }

          .clinic-info {
            gap: 0.5rem;
          }

          .clinic-name {
            font-size: 0.75rem;
          }

          .clinic-badge {
            padding: 0.125rem 0.25rem;
            font-size: 0.5rem;
          }

          .patient-info {
            padding: 0.625rem;
            gap: 0.5rem;
          }

          .patient-avatar {
            width: 26px;
            height: 26px;
            font-size: 9px;
          }

          .patient-name {
            font-size: 0.75rem;
          }

          .confirmed-badge {
            padding: 0.125rem 0.25rem;
            font-size: 0.5rem;
          }

          .empty-state {
            padding: 2.5rem 1rem;
          }

          .empty-title {
            font-size: 1.125rem;
          }

          .empty-text {
            font-size: 0.8125rem;
          }

          .empty-action {
            padding: 0.875rem;
            font-size: 0.8125rem;
          }
        }

        /* Estados de foco - estilo Apple */
        .logout-btn:focus,
        .view-all-btn:focus,
        .action-card:focus,
        .empty-action:focus,
        .timeline-card:focus {
          outline: 2px solid #ff9500;
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