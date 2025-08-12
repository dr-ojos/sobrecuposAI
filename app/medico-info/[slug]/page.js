'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MedicoInfoPage({ params }) {
  const router = useRouter();
  const [medico, setMedico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sobrecupos, setSobrecupos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState(new Map());
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Extract slug from params
  const [slug, setSlug] = useState(null);
  
  useEffect(() => {
    const extractSlug = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    extractSlug();
  }, [params]);

  // Función para cargar sobrecupos del médico
  const fetchSobrecuposMedico = async (nombreMedico) => {
    try {
      const response = await fetch('/api/sobrecupos/available');
      if (!response.ok) throw new Error('Error fetching sobrecupos');
      
      const data = await response.json();
      if (data.success) {
        // Filtrar solo sobrecupos de este médico y futuros
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sobrecuposMedico = data.records.filter(sobrecupo => {
          const fechaSobrecupo = new Date(sobrecupo.fields?.Fecha);
          fechaSobrecupo.setHours(0, 0, 0, 0);
          
          return sobrecupo.fields?.Médico === nombreMedico &&
                 sobrecupo.fields?.Disponible === 'Si' &&
                 fechaSobrecupo >= today;
        });
        
        setSobrecupos(sobrecuposMedico);
        
        // Crear mapa de fechas con conteo
        const dateMap = new Map();
        sobrecuposMedico.forEach(sobrecupo => {
          const date = sobrecupo.fields?.Fecha;
          if (date) {
            const count = dateMap.get(date) || 0;
            dateMap.set(date, count + 1);
          }
        });
        setCalendarDates(dateMap);
        
        console.log(`📅 Sobrecupos encontrados para ${nombreMedico}:`, sobrecuposMedico.length);
      }
    } catch (error) {
      console.error('❌ Error cargando sobrecupos del médico:', error);
    }
  };

  // Funciones del calendario
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const formatDateForComparison = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  const isDateAvailable = (dateString) => {
    return calendarDates.has(dateString);
  };

  const getSobrecuposCount = (dateString) => {
    return calendarDates.get(dateString) || 0;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfWeek = getFirstDayOfMonth(currentMonth);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const grid = [];
    
    // Días de la semana anteriores (espacios vacíos)
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = formatDateForComparison(year, month, day);
      
      grid.push({
        day,
        dateString,
        isToday: currentDate.toDateString() === today.toDateString(),
        isPast: currentDate < today,
        isAvailable: isDateAvailable(dateString),
        count: getSobrecuposCount(dateString)
      });
    }
    
    return grid;
  };

  const handleDateClick = (dateInfo) => {
    if (dateInfo && dateInfo.isAvailable) {
      // Navegar a la página principal con filtros aplicados
      router.push(`/agendar?medico=${encodeURIComponent(medico.fields.Name)}&fecha=${dateInfo.dateString}`);
    }
  };

  useEffect(() => {
    const fetchMedicoInfo = async () => {
      try {
        setLoading(true);
        
        // Decodificar el slug para obtener el nombre del médico
        const nombreMedico = decodeURIComponent(slug);
        console.log('🔍 Buscando médico:', nombreMedico);
        
        // Buscar el médico por nombre exacto en la base de datos
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Error fetching doctors');
        
        const doctores = await response.json();
        console.log('📋 Doctores obtenidos:', doctores.length);
        
        // Buscar médico por nombre exacto o similar
        const doctorEncontrado = doctores.find(doc => {
          const docName = doc.fields?.Name;
          if (!docName) return false;
          
          // Comparación exacta primero
          if (docName === nombreMedico) return true;
          
          // Comparación insensible a mayúsculas
          if (docName.toLowerCase() === nombreMedico.toLowerCase()) return true;
          
          // Comparación parcial si contiene el nombre
          return docName.toLowerCase().includes(nombreMedico.toLowerCase()) ||
                 nombreMedico.toLowerCase().includes(docName.toLowerCase());
        });
        
        if (doctorEncontrado) {
          console.log('✅ Médico encontrado:', doctorEncontrado.fields?.Name);
          console.log('📄 Datos del médico:', doctorEncontrado.fields);
          setMedico(doctorEncontrado);
          
          // Cargar sobrecupos del médico
          await fetchSobrecuposMedico(doctorEncontrado.fields?.Name);
        } else {
          console.log('❌ Médico no encontrado para:', nombreMedico);
          setError('Médico no encontrado');
        }
      } catch (err) {
        console.error('❌ Error cargando info del médico:', err);
        setError('Error cargando información del médico');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMedicoInfo();
    }
  }, [slug]);

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando información del médico...</p>
      </div>
    );
  }

  if (error || !medico) {
    return (
      <div className="error-container">
        <h2>Médico no encontrado</h2>
        <p>{error || 'No se pudo cargar la información del médico'}</p>
        <button onClick={handleBackClick} className="back-to-list">
          Volver a sobrecupos
        </button>
      </div>
    );
  }

  const fields = medico.fields || {};

  return (
    <main className="page-container">
      {/* Modern Floating Header */}
      <header className="floating-header">
        <div className="header-content">
          <button onClick={handleBackClick} className="back-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-text">Perfil Médico</span>
          </div>
        </div>
      </header>

      <div className="main-wrapper">
        
        {/* Hero Section - Doctor Profile */}
        <section className="hero-section">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="doctor-avatar-container">
              <div className="doctor-avatar">
                {fields.PhotoURL ? (
                  <img 
                    src={fields.PhotoURL} 
                    alt={`Dr. ${fields.Name}`}
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="avatar-placeholder" style={{display: fields.PhotoURL ? 'none' : 'flex'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="avatar-status">
                  <div className="status-dot"></div>
                </div>
              </div>
            </div>
            
            <div className="hero-info">
              <div className="doctor-title">
                <h1 className="doctor-name">Dr. {fields.Name}</h1>
                <div className="specialty-badge">
                  <span className="specialty-icon">🩺</span>
                  <span className="specialty-text">{fields.Especialidad}</span>
                </div>
              </div>
              
              {fields.RSS && (
                <div className="credentials">
                  <div className="credential-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>RSS: {fields.RSS}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="content-sections">{/* Información Profesional Moderna */}
          <section className="professional-card">
            <div className="card-header">
              <div className="header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="card-title">Información Profesional</h2>
            </div>
            
            <div className="info-metrics">
              <div className="metric-card specialty-metric">
                <div className="metric-header">
                  <div className="metric-icon">🏥</div>
                  <span className="metric-label">Especialidad</span>
                </div>
                <div className="metric-value">{fields.Especialidad || 'No especificada'}</div>
              </div>
              
              <div className="metric-card patients-metric">
                <div className="metric-header">
                  <div className="metric-icon">
                    {fields.Atiende === 'Ambos' ? '👥' : 
                     fields.Atiende === 'Niños' ? '👶' : 
                     fields.Atiende === 'Adultos' ? '👨' : '🩺'}
                  </div>
                  <span className="metric-label">Atiende a</span>
                </div>
                <div className="metric-value">
                  {fields.Atiende === 'Ambos' ? 'Niños y Adultos' : 
                   fields.Atiende === 'Niños' ? 'Solo Niños' :
                   fields.Atiende === 'Adultos' ? 'Solo Adultos' : 
                   'Consultar'}
                </div>
              </div>
            </div>
            
            {/* Seguros y Previsiones */}
            {fields.Seguros && fields.Seguros.length > 0 && (
              <div className="insurance-section">
                <div className="insurance-header">
                  <div className="insurance-icon">💳</div>
                  <h3 className="insurance-title">Seguros Aceptados</h3>
                </div>
                <div className="insurance-grid">
                  {(Array.isArray(fields.Seguros) ? fields.Seguros : [fields.Seguros]).map((seguro, index) => (
                    <div key={index} className="insurance-chip">
                      <div className="chip-icon">
                        {seguro === 'Fonasa' ? '🏥' : 
                         seguro === 'Isapres' ? '🏛️' : 
                         seguro === 'Particular' ? '💼' : '🏥'}
                      </div>
                      <span className="chip-text">{seguro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Calendar de Sobrecupos Moderno */}
          <section className="calendar-card">
            <div className="card-header">
              <div className="header-icon calendar-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="calendar-title-section">
                <h2 className="card-title">Agenda Disponible</h2>
                <p className="card-subtitle">Selecciona una fecha para agendar</p>
              </div>
              {sobrecupos.length > 0 && (
                <div className="availability-badge">
                  <div className="badge-dot"></div>
                  <span>{sobrecupos.length} citas</span>
                </div>
              )}
            </div>
            <div className="calendar-container">
              <div className="calendar-header">
                <button onClick={() => navigateMonth(-1)} className="calendar-nav">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="calendar-month-container">
                  <h4 className="calendar-month">
                    {currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="calendar-doctor-indicator">
                    {fields.Name}
                  </div>
                </div>
                <button onClick={() => navigateMonth(1)} className="calendar-nav">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="calendar-body">
                <div className="calendar-weekdays">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                  ))}
                </div>
                
                <div className="calendar-grid">
                  {generateCalendarGrid().map((dateInfo, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateClick(dateInfo)}
                      className={`calendar-day ${
                        !dateInfo ? 'empty' : 
                        dateInfo.isPast ? 'past' :
                        dateInfo.isAvailable ? 'available' :
                        dateInfo.isToday ? 'today' : ''
                      }`}
                      disabled={!dateInfo || dateInfo.isPast || !dateInfo.isAvailable}
                    >
                      {dateInfo && (
                        <>
                          <span className="day-number">{dateInfo.day}</span>
                          {dateInfo.isAvailable && dateInfo.count > 0 && (
                            <span className="sobrecupos-count">{dateInfo.count}</span>
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>
                
                {sobrecupos.length === 0 && (
                  <div className="calendar-no-dates">
                    <div className="no-dates-icon">📅</div>
                    <p className="no-dates-text">
                      Este médico no tiene sobrecupos disponibles actualmente
                    </p>
                  </div>
                )}
              </div>

              {sobrecupos.length > 0 && (
                <div className="calendar-footer">
                  <p className="calendar-help">
                    💡 Toca un día destacado para reservar un sobrecupo
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Experiencia Profesional */}
          {fields.Experiencia && fields.Experiencia.trim() && (
            <section className="experience-card">
              <div className="card-header">
                <div className="header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="card-title">Experiencia Profesional</h2>
              </div>
              <div className="experience-content">
                <p className="experience-text">{fields.Experiencia}</p>
              </div>
            </section>
          )}

          {/* Información importante moderna */}
          <section className="important-info-card">
            <div className="info-header">
              <div className="info-icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="info-title-section">
                <h2 className="info-title">Información Importante</h2>
                <p className="info-subtitle">Antes de reservar tu cita</p>
              </div>
            </div>
            
            <div className="info-points">
              <div className="info-point">
                <div className="point-icon">💳</div>
                <div className="point-content">
                  <h4>Pago de Consulta</h4>
                  <p>La autorización de sobrecupo <strong>no reemplaza</strong> el pago de la consulta médica</p>
                </div>
              </div>
              
              <div className="info-point">
                <div className="point-icon">📅</div>
                <div className="point-content">
                  <h4>Cómo Reservar</h4>
                  <p>Utiliza el calendario para seleccionar una fecha disponible y proceder con la reserva</p>
                </div>
              </div>
              
              <div className="info-point">
                <div className="point-icon">🔒</div>
                <div className="point-content">
                  <h4>Seguridad</h4>
                  <p>Todas las reservas se manejan a través de nuestra plataforma segura</p>
                </div>
              </div>
            </div>
          </section>

          {/* Action Section moderna */}
          <section className="action-section">
            <div className="action-buttons">
              <button 
                onClick={handleBackClick}
                className="secondary-button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Volver a Sobrecupos
              </button>
              
              <button 
                onClick={() => window.location.href = '/agendar'}
                className="primary-button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Ver Todos los Sobrecupos
              </button>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          position: relative;
        }

        /* Modern Floating Header */
        .floating-header {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
        }

        .back-button {
          width: 40px;
          height: 40px;
          background: rgba(103, 126, 234, 0.1);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #667eea;
        }

        .back-button:hover {
          background: rgba(103, 126, 234, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(103, 126, 234, 0.3);
        }

        .breadcrumb {
          flex: 1;
        }

        .breadcrumb-text {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          letter-spacing: -0.025em;
        }

        /* Main Wrapper */
        .main-wrapper {
          padding-top: 6rem;
          min-height: 100vh;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          padding: 2rem 1.5rem 3rem;
          margin-bottom: 2rem;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 0 0 2rem 2rem;
        }

        .hero-content {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
        }

        .doctor-avatar-container {
          position: relative;
        }

        .doctor-avatar {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          background: #f9fafb;
        }

        .avatar-status {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .status-dot {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
        }

        .hero-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .doctor-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .doctor-name {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          letter-spacing: -0.025em;
        }

        .specialty-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .specialty-icon {
          font-size: 1.1rem;
        }

        .specialty-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
        }

        .credentials {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .credential-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .credential-item svg {
          color: rgba(255, 255, 255, 0.7);
        }

        /* Content Sections */
        .content-sections {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Modern Card Base */
        .professional-card,
        .calendar-card,
        .experience-card,
        .important-info-card {
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(20px);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .professional-card:hover,
        .calendar-card:hover,
        .experience-card:hover,
        .important-info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        /* Card Headers */
        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(103, 126, 234, 0.3);
        }

        .calendar-header-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }

        .calendar-title-section {
          flex: 1;
        }

        .availability-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }

        /* Info Metrics */
        .info-metrics {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          padding: 1.5rem;
        }

        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .metric-icon {
          font-size: 1.25rem;
        }

        .metric-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }

        /* Insurance Section */
        .insurance-section {
          padding: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .insurance-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .insurance-icon {
          font-size: 1.25rem;
        }

        .insurance-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .insurance-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .insurance-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(103, 126, 234, 0.3);
          transition: all 0.2s ease;
        }

        .insurance-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(103, 126, 234, 0.4);
        }

        .chip-icon {
          font-size: 1rem;
        }

        /* Experience Card */
        .experience-content {
          padding: 1.5rem;
        }

        .experience-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #4b5563;
          margin: 0;
        }

        /* Important Info Card */
        .info-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-bottom: 1px solid #f3e8ff;
        }

        .info-icon-container {
          width: 48px;
          height: 48px;
          background: #f59e0b;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .info-title-section {
          flex: 1;
        }

        .info-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #92400e;
          margin: 0;
        }

        .info-subtitle {
          font-size: 0.875rem;
          color: #b45309;
          margin: 0.25rem 0 0 0;
        }

        .info-points {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .info-point {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .point-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .point-content h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.25rem 0;
        }

        .point-content p {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Action Section */
        .action-section {
          padding: 0 1.5rem 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-direction: column;
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          border: none;
        }

        .primary-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(103, 126, 234, 0.3);
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(103, 126, 234, 0.4);
        }

        .secondary-button {
          background: white;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .secondary-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .floating-header {
            top: 2rem;
            left: 2rem;
            right: 2rem;
          }

          .main-wrapper {
            padding-top: 7rem;
          }

          .hero-section {
            padding: 3rem 2rem 4rem;
          }

          .hero-content {
            flex-direction: row;
            text-align: left;
            gap: 2rem;
          }

          .doctor-avatar {
            width: 140px;
            height: 140px;
          }

          .doctor-name {
            font-size: 2.5rem;
          }

          .content-sections {
            padding: 0 2rem 3rem;
            gap: 2rem;
          }

          .info-metrics {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .action-buttons {
            flex-direction: row;
          }

          .action-buttons .secondary-button {
            flex: 1;
          }

          .action-buttons .primary-button {
            flex: 2;
          }
        }

        @media (min-width: 1024px) {
          .content-sections {
            max-width: 900px;
          }

          .hero-content {
            gap: 3rem;
          }

          .doctor-avatar {
            width: 160px;
            height: 160px;
          }

          .doctor-name {
            font-size: 3rem;
          }

          .card-header {
            padding: 2rem;
          }

          .info-metrics {
            padding: 2rem;
          }

          .insurance-section,
          .experience-content,
          .info-points {
            padding: 2rem;
          }
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #ff9500;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Error */
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          padding: 2rem;
        }

        .back-to-list {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .back-to-list:hover {
          background: #e6850a;
        }

        /* Layout */
        .main-layout {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Doctor Profile */
        .doctor-profile {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .doctor-photo {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 2rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        .doctor-specialty {
          font-size: 1.1rem;
          color: #ff9500;
          margin: 0 0 0.5rem 0;
          font-weight: 500;
        }

        .doctor-rss {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        /* Sections */
        .section-title {
          font-size: 1.5rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1.5rem 0;
        }

        .professional-info,
        .experience-section,
        .patient-info {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        .info-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .info-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-content {
          font-size: 1rem;
          color: #171717;
          margin: 0;
          font-weight: 500;
        }

        /* Seguros Section */
        .seguros-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .subsection-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 1rem 0;
        }

        .seguros-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .seguro-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #fff;
          border: 2px solid #ff9500;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .seguro-card:hover {
          background: #ff9500;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(255, 149, 0, 0.2);
        }

        .seguro-icon {
          font-size: 1.25rem;
        }

        .seguro-name {
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Experience */
        .experience-content {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .experience-content p {
          margin: 0;
          line-height: 1.6;
          color: #374151;
        }

        /* Patient Info */
        .info-notice {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .notice-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0c4a6e;
          margin: 0 0 1rem 0;
        }

        .info-notice p {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          color: #0c4a6e;
          line-height: 1.5;
        }

        .info-notice p:last-child {
          margin-bottom: 0;
        }

        /* Calendar Section */
        .calendar-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .calendar-container {
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid #e5e5e5;
        }

        .calendar-nav {
          padding: 6px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-nav:hover {
          background: #f5f5f5;
          color: #171717;
        }

        .calendar-month-container {
          flex: 1;
          text-align: center;
        }

        .calendar-month {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
          text-transform: capitalize;
        }

        .calendar-doctor-indicator {
          font-size: 0.7rem;
          color: #ff9500;
          font-weight: 500;
          margin-top: 0.125rem;
          background: rgba(255, 149, 0, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 8px;
          display: inline-block;
        }

        .calendar-body {
          padding: 1rem;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 0.5rem;
        }

        .calendar-weekday {
          padding: 0.5rem 0;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-day {
          position: relative;
          aspect-ratio: 1;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          color: #666;
        }

        .calendar-day.empty {
          border: none;
          cursor: default;
        }

        .calendar-day.past {
          color: #ccc;
          background: #f9f9f9;
          cursor: not-allowed;
        }

        .calendar-day.today {
          background: #f0f9ff;
          color: #0369a1;
          font-weight: 600;
          border-color: #38bdf8;
        }

        .calendar-day.available {
          background: #fef3e2;
          color: #ea580c;
          font-weight: 600;
          border-color: #fed7aa;
        }

        .calendar-day.available:hover {
          background: #fed7aa;
          color: #c2410c;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .day-number {
          line-height: 1;
        }

        .sobrecupos-count {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: #ff9500;
          color: white;
          font-size: 0.55rem;
          font-weight: 700;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          border: 1px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .calendar-no-dates {
          text-align: center;
          padding: 2rem 1rem;
          color: #666;
        }

        .no-dates-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.3;
        }

        .no-dates-text {
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }

        .calendar-footer {
          padding: 1rem;
          background: white;
          border-top: 1px solid #e5e5e5;
          text-align: center;
        }

        .calendar-help {
          font-size: 0.8rem;
          color: #666;
          margin: 0;
          font-style: italic;
        }

        /* Action Section */
        .action-section {
          display: flex;
          justify-content: center;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .action-button:hover {
          background: #e6850a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .main-layout {
            padding: 3rem 2rem;
          }

          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        /* Desktop Calendar Optimization */
        @media (min-width: 1024px) {
          .calendar-section {
            max-width: 500px;
            margin: 0 auto;
            padding: 1.5rem;
          }

          .calendar-container {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .calendar-header {
            padding: 0.75rem 1rem;
            border-radius: 8px 8px 0 0;
          }

          .calendar-month {
            font-size: 0.8rem;
            font-weight: 700;
          }

          .calendar-doctor-indicator {
            font-size: 0.65rem;
            padding: 0.1rem 0.3rem;
            margin-top: 0.1rem;
          }

          .calendar-body {
            padding: 0.75rem;
          }

          .calendar-weekday {
            padding: 0.4rem 0;
            font-size: 0.7rem;
            font-weight: 700;
          }

          .calendar-day {
            min-height: 28px;
            font-size: 0.75rem;
            border-radius: 4px;
            transition: all 0.15s ease;
          }

          .calendar-day:not(.empty):not(.past):hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(255, 149, 0, 0.15);
          }

          .sobrecupos-count {
            width: 14px;
            height: 14px;
            font-size: 0.6rem;
            bottom: 1px;
            right: 1px;
          }

          .calendar-footer {
            padding: 0.75rem;
          }

          .calendar-help {
            font-size: 0.75rem;
          }

          .calendar-no-dates {
            padding: 1.5rem 1rem;
          }

          .no-dates-icon {
            font-size: 2rem;
          }

          .no-dates-text {
            font-size: 0.8rem;
          }
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }

          .doctor-photo {
            width: 100px;
            height: 100px;
          }

          .doctor-name {
            font-size: 1.5rem;
          }

          .professional-info,
          .experience-section,
          .patient-info,
          .doctor-profile,
          .calendar-section {
            padding: 1.5rem;
          }

          .calendar-header {
            padding: 0.75rem;
          }

          .calendar-body {
            padding: 0.75rem;
          }

          .calendar-day {
            min-height: 32px;
            font-size: 0.75rem;
          }

          .main-layout {
            padding: 1.5rem 1rem;
          }

          .seguros-grid {
            grid-template-columns: 1fr;
          }

          .seguro-card {
            padding: 0.75rem;
          }

        }

        /* Very small screens */
        @media (max-width: 480px) {
          .doctor-photo {
            width: 80px;
            height: 80px;
          }

          .doctor-name {
            font-size: 1.25rem;
          }

          .professional-info,
          .experience-section,
          .patient-info,
          .doctor-profile,
          .calendar-section {
            padding: 1rem;
          }

          .calendar-header {
            padding: 0.5rem;
          }

          .calendar-body {
            padding: 0.5rem;
          }

          .calendar-day {
            min-height: 28px;
            font-size: 0.7rem;
          }

          .calendar-month {
            font-size: 0.8rem;
          }

          .calendar-doctor-indicator {
            font-size: 0.65rem;
            padding: 0.075rem 0.25rem;
          }

          .info-card {
            padding: 1rem;
          }

        }

        /* Safe area for iPhones */
        @supports (padding: max(0px)) {
          .page-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}