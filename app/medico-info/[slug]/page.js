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
      <div className="bg-gradient" />
      
      {/* Elementos geométricos floating como en la home */}
      <div className="floating-elements">
        <div className="element element-1">
          <div className="geometric-circle"></div>
        </div>
        <div className="element element-2">
          <div className="geometric-square"></div>
        </div>
        <div className="element element-3">
          <div className="geometric-triangle"></div>
        </div>
      </div>

      {/* Header minimalista como en el perfil */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={handleBackClick} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Dr. {fields.Name}</h1>
              <span className="header-subtitle">{fields.Especialidad}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-container">
          
          {/* Perfil del Médico - Mejorado pero consistente */}
          <section className="doctor-profile-card">
            <div className="profile-header">
              <div className="doctor-photo-container">
                <div className="doctor-photo">
                  {fields.PhotoURL ? (
                    <img 
                      src={fields.PhotoURL} 
                      alt={`Foto del ${fields.Name}`}
                      className="profile-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="photo-placeholder" style={{display: fields.PhotoURL ? 'none' : 'flex'}}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span className="status-text">Disponible</span>
                </div>
              </div>
              
              <div className="doctor-info">
                <h2 className="doctor-name">Dr. {fields.Name}</h2>
                <div className="specialty-tag">
                  <span className="specialty-text">{fields.Especialidad}</span>
                </div>
                {fields.RSS && (
                  <div className="credentials">
                    <span className="credential-label">RSS:</span>
                    <span className="credential-value">{fields.RSS}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Layout Desktop: Información + Calendario */}
          <div className="desktop-layout">
            {/* Información Profesional */}
            <section className="professional-info">
              <h3 className="section-title">Información Profesional</h3>
              
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <h4 className="info-title">Especialidad</h4>
                  </div>
                  <p className="info-content bold-text">{fields.Especialidad || 'No especificada'}</p>
                </div>
                
                <div className="info-card">
                  <div className="info-header">
                    <h4 className="info-title">Atiende a</h4>
                  </div>
                  <p className="info-content normal-text">
                    {fields.Atiende === 'Ambos' ? 'Niños y Adultos' : 
                     fields.Atiende === 'Niños' ? 'Solo Niños' :
                     fields.Atiende === 'Adultos' ? 'Solo Adultos' : 
                     'Consultar'}
                  </p>
                </div>
                
                {fields.RSS && (
                  <div className="info-card">
                    <div className="info-header">
                      <h4 className="info-title">Registro Sanitario</h4>
                    </div>
                    <p className="info-content thin-text">{fields.RSS}</p>
                  </div>
                )}
              </div>

              {/* Seguros Aceptados */}
              {fields.Seguros && fields.Seguros.length > 0 && (
                <div className="seguros-section">
                  <h4 className="subsection-title">Seguros y Previsiones Aceptadas</h4>
                  <div className="seguros-grid">
                    {(Array.isArray(fields.Seguros) ? fields.Seguros : [fields.Seguros]).map((seguro, index) => (
                      <div key={index} className="seguro-card">
                        <span className="seguro-name">{seguro}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Calendar de Sobrecupos */}
            <section className="calendar-section">
              <h3 className="section-title">Sobrecupos Disponibles</h3>
              {sobrecupos.length > 0 && (
                <div className="availability-indicator">
                  <div className="availability-dot"></div>
                  <span className="availability-text">{sobrecupos.length} citas disponibles</span>
                </div>
              )}
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
                      Toca un día destacado para reservar un sobrecupo
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Experiencia Profesional */}
          {fields.Experiencia && fields.Experiencia.trim() && (
            <section className="experience-card">
              <div className="card-header">
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

          {/* Action Section */}
          <section className="action-section">
            <div className="action-buttons">
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
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          position: relative;
          color: #171717;
        }

        /* Background gradient matching home */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          z-index: -2;
        }

        /* Floating elements from home */
        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }

        .element {
          position: absolute;
          opacity: 0.4;
          animation: float 20s ease-in-out infinite;
        }

        .element-1 {
          top: 15%;
          left: 85%;
          animation-delay: 0s;
        }

        .element-2 {
          top: 70%;
          left: 15%;
          animation-delay: -7s;
        }

        .element-3 {
          top: 40%;
          right: 10%;
          animation-delay: -14s;
        }

        .geometric-circle {
          width: 60px;
          height: 60px;
          border: 2px solid #ff9500;
          border-radius: 50%;
          background: rgba(255, 149, 0, 0.05);
        }

        .geometric-square {
          width: 40px;
          height: 40px;
          border: 2px solid #666;
          background: rgba(102, 102, 102, 0.05);
          transform: rotate(45deg);
        }

        .geometric-triangle {
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-bottom: 50px solid rgba(255, 149, 0, 0.3);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(15px) rotate(240deg); }
        }

        /* Header minimalista consistente */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
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

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
          width: 36px;
          height: 36px;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          border-color: #171717;
          background: #f9fafb;
        }

        .header-text {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #171717;
          margin: 0;
        }

        .header-subtitle {
          font-size: 1rem;
          font-weight: 300;
          color: #666;
        }

        /* Layout */
        .main-layout {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Desktop Layout para Info + Calendar */
        .desktop-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .desktop-layout {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 3rem;
            align-items: stretch;
          }
          
          .professional-info,
          .calendar-section {
            min-height: 500px;
            display: flex;
            flex-direction: column;
          }
        }

        /* Doctor Profile Card con gradiente y sombra moderna */
        .doctor-profile-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.08),
            0 4px 10px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .doctor-profile-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 149, 0, 0.3), transparent);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .doctor-photo-container {
          position: relative;
          flex-shrink: 0;
        }

        .doctor-photo {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          background: #f5f5f5;
        }

        .status-indicator {
          position: absolute;
          bottom: -8px;
          right: -8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          border: 1px solid #e5e5e5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }

        .status-text {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 500;
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 2.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -1px;
        }

        .specialty-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 149, 0, 0.05) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 149, 0, 0.2);
          display: inline-flex;
        }

        .specialty-icon {
          font-size: 1.1rem;
        }

        .specialty-text {
          font-size: 1rem;
          color: #ff9500;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .credentials {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .credential-label {
          font-size: 0.875rem;
          color: #666;
          font-weight: 500;
        }

        .credential-value {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 600;
        }

        /* Sections con tipografía consistente */
        .section-title {
          font-size: 1.75rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.5px;
        }

        .professional-info,
        .experience-card,
        .important-info-card,
        .calendar-section {
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.08),
            0 4px 10px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .professional-info::before,
        .experience-card::before,
        .important-info-card::before,
        .calendar-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 149, 0, 0.3), transparent);
        }

        /* Availability Indicator */
        .availability-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .availability-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }

        .availability-text {
          font-size: 0.875rem;
          color: #10b981;
          font-weight: 500;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        .info-card {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.8) 100%);
          border-radius: 16px;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.03),
            0 2px 4px rgba(0, 0, 0, 0.02);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 4px 8px rgba(0, 0, 0, 0.04);
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .info-icon {
          font-size: 1.25rem;
        }

        .info-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
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
          justify-content: center;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          text-align: center;
        }

        .seguro-icon {
          font-size: 1.25rem;
        }

        .seguro-name {
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Card Header */
        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .header-icon {
          width: 44px;
          height: 44px;
          background: #ff9500;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        /* Experience Content */
        .experience-content {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .experience-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #374151;
          margin: 0;
        }

        /* Important Info Header */
        .info-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-icon-container {
          width: 48px;
          height: 48px;
          background: #ff9500;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .info-title-section {
          flex: 1;
        }

        .info-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        .info-subtitle {
          font-size: 0.875rem;
          color: #666;
          margin: 0.25rem 0 0 0;
        }

        .info-points {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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
          display: flex;
          justify-content: center;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-direction: column;
          width: 100%;
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          border: none;
          position: relative;
          overflow: hidden;
        }

        .primary-button {
          background: linear-gradient(135deg, #ff9500 0%, #ff8800 100%);
          color: white;
          box-shadow: 
            0 8px 20px rgba(255, 149, 0, 0.25),
            0 4px 8px rgba(255, 149, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .primary-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .primary-button:hover {
          background: linear-gradient(135deg, #ff8800 0%, #ff7700 100%);
          transform: translateY(-2px);
          box-shadow: 
            0 12px 28px rgba(255, 149, 0, 0.3),
            0 6px 12px rgba(255, 149, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .primary-button:hover::before {
          left: 100%;
        }

        .secondary-button {
          background: white;
          color: #666;
          border: 1px solid #e5e5e5;
        }

        .secondary-button:hover {
          background: #f5f5f5;
          border-color: #d4d4d8;
          color: #171717;
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

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        .info-card {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.8) 100%);
          border-radius: 16px;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.03),
            0 2px 4px rgba(0, 0, 0, 0.02);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 4px 8px rgba(0, 0, 0, 0.04);
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
        
        .info-content.bold-text {
          font-weight: 700;
        }
        
        .info-content.normal-text {
          font-weight: 500;
        }
        
        .info-content.thin-text {
          font-weight: 300;
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
          justify-content: center;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          text-align: center;
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
          background: rgba(255, 149, 0, 0.85);
          color: white;
          font-size: 0.5rem;
          font-weight: 600;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          border: 0.5px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(2px);
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
            max-width: 400px;
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
            width: 12px;
            height: 12px;
            font-size: 0.55rem;
            bottom: 1px;
            right: 1px;
            background: rgba(255, 149, 0, 0.8);
            border: 0.5px solid rgba(255, 255, 255, 0.8);
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
          .experience-card,
          .important-info-card,
          .doctor-profile-card,
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