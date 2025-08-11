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
  const { slug } = params;

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
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <button onClick={handleBackClick} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Información del Médico</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-container">
          
          {/* Perfil del Médico */}
          <section className="doctor-profile">
            <div className="profile-header">
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
              
              <div className="doctor-info">
                <h2 className="doctor-name">{fields.Name}</h2>
                <p className="doctor-specialty">{fields.Especialidad}</p>
                {fields.RSS && (
                  <p className="doctor-rss">RSS: {fields.RSS}</p>
                )}
              </div>
            </div>
          </section>

          {/* Información Profesional */}
          <section className="professional-info">
            <h3 className="section-title">Información Profesional</h3>
            
            <div className="info-grid">
              <div className="info-card">
                <h4 className="info-title">Especialidad</h4>
                <p className="info-content">{fields.Especialidad || 'No especificada'}</p>
              </div>
              
              <div className="info-card">
                <h4 className="info-title">Atiende a</h4>
                <p className="info-content">
                  {fields.Atiende === 'Ambos' ? '👥 Niños y Adultos' : 
                   fields.Atiende === 'Niños' ? '👶 Solo Niños' :
                   fields.Atiende === 'Adultos' ? '👨 Solo Adultos' : 
                   'Consultar'}
                </p>
              </div>
              
              {fields.RSS && (
                <div className="info-card">
                  <h4 className="info-title">Registro Sanitario (RSS)</h4>
                  <p className="info-content">{fields.RSS}</p>
                </div>
              )}
            </div>

            {/* Seguros Aceptados */}
            {fields.Seguros && fields.Seguros.length > 0 && (
              <div className="seguros-section">
                <h4 className="subsection-title">💳 Seguros y Previsiones Aceptadas</h4>
                <div className="seguros-grid">
                  {(Array.isArray(fields.Seguros) ? fields.Seguros : [fields.Seguros]).map((seguro, index) => (
                    <div key={index} className="seguro-card">
                      <span className="seguro-icon">
                        {seguro === 'Fonasa' ? '🏥' : 
                         seguro === 'Isapres' ? '🏥' : 
                         seguro === 'Particular' ? '💰' : '🏥'}
                      </span>
                      <span className="seguro-name">{seguro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Calendar de Sobrecupos */}
          <section className="calendar-section">
            <h3 className="section-title">📅 Sobrecupos Disponibles</h3>
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
            <section className="experience-section">
              <h3 className="section-title">📋 Experiencia Profesional</h3>
              <div className="experience-content">
                <p>{fields.Experiencia}</p>
              </div>
            </section>
          )}

          {/* Información importante para pacientes */}
          <section className="patient-info">
            <div className="info-notice">
              <h3 className="notice-title">⚠️ Importante</h3>
              <p><strong>La autorización de Sobrecupos no reemplaza al pago de la consulta</strong>, la cual debe ser cancelada en la consulta después de mostrar la autorización de sobrecupo que te envía tu médico.</p>
              <p><strong>Para reservar sobrecupos:</strong> Utiliza el botón "Reservar Sobrecupo" desde la lista principal de citas disponibles.</p>
              <p><strong>Contacto directo:</strong> Todas las consultas y reservas se manejan a través de nuestra plataforma para tu seguridad y la del profesional.</p>
            </div>
          </section>

          {/* Botón de acción */}
          <section className="action-section">
            <button 
              onClick={handleBackClick}
              className="action-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Volver a Sobrecupos
            </button>
          </section>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
        }

        .header-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 60px;
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

        .header-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
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