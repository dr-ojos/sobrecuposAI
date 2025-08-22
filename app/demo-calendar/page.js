'use client';
import React, { useState } from 'react';

export default function DemoCalendar() {
  const [sobrecupos, setSobrecupos] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSobrecupo, setSelectedSobrecupo] = useState(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [modalData, setModalData] = useState({ clinica: '' });
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const clinicasRegistradas = [
    'Consulta particular',
    'Clínica Las Condes', 
    'Clínica Alemana',
    'Hospital Salvador',
    'Clínica Santa María',
    'Clínica UC'
  ];

  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (currentWeekOffset * 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextWeek();
    }
    if (isRightSwipe) {
      goToPreviousWeek();
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const getWeekInfo = () => {
    const weekDays = getWeekDays();
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    if (firstDay.getMonth() !== lastDay.getMonth()) {
      return {
        monthYear: `${firstDay.toLocaleDateString('es', { month: 'short' })} - ${lastDay.toLocaleDateString('es', { month: 'short' })} ${lastDay.getFullYear()}`
      };
    }
    
    return {
      monthYear: `${firstDay.toLocaleDateString('es', { month: 'long' })} ${firstDay.getFullYear()}`
    };
  };

  const weekDays = getWeekDays();
  const weekInfo = getWeekInfo();
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatTime = (hour) => `${hour.toString().padStart(2, '0')}:00`;
  const getSlotKey = (date, hour) => `${formatDate(date)}-${hour}`;

  const handleSlotClick = (date, hour) => {
    const slotKey = getSlotKey(date, hour);
    
    if (sobrecupos[slotKey]) {
      setSelectedSobrecupo({ ...sobrecupos[slotKey], slotKey, date, hour, isPast: isPastDate(date) });
      setShowInfoModal(true);
    } else if (!isPastDate(date)) {
      setSelectedSlot({ date, hour, slotKey });
      setShowModal(true);
    }
  };

  const handleCreateSobrecupo = () => {
    if (!selectedSlot) return;

    const newSobrecupo = {
      fecha: formatDate(selectedSlot.date),
      hora: formatTime(selectedSlot.hour),
      clinica: modalData.clinica || 'Consulta particular',
      estado: 'disponible'
    };

    setSobrecupos(prev => ({
      ...prev,
      [selectedSlot.slotKey]: newSobrecupo
    }));

    setShowModal(false);
    setSelectedSlot(null);
    setModalData({ clinica: '' });
  };

  const handleEditSobrecupo = () => {
    setSelectedSlot({
      date: selectedSobrecupo.date,
      hour: selectedSobrecupo.hour,
      slotKey: selectedSobrecupo.slotKey
    });
    setModalData({ clinica: selectedSobrecupo.clinica });
    setShowInfoModal(false);
    setShowModal(true);
  };

  const handleDeleteSobrecupo = () => {
    setSobrecupos(prev => {
      const newSobrecupos = { ...prev };
      delete newSobrecupos[selectedSobrecupo.slotKey];
      return newSobrecupos;
    });
    setShowInfoModal(false);
    setSelectedSobrecupo(null);
  };

  const getSobrecupoCount = () => {
    const disponibles = Object.values(sobrecupos).filter(s => s.estado === 'disponible').length;
    const reservados = Object.values(sobrecupos).filter(s => s.estado === 'reservado').length;
    return { disponibles, reservados, total: disponibles + reservados };
  };

  const stats = getSobrecupoCount();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%)', 
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#171717',
        marginBottom: '1.5rem',
        maxWidth: '900px',
        margin: '0 auto 1.5rem auto'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          margin: '0 0 0.5rem 0',
          fontWeight: 200,
          letterSpacing: '-0.6px'
        }}>Gestiona tus Sobrecupos</h1>
        
        <p style={{
          fontSize: '0.9375rem',
          color: '#8e8e93',
          margin: '0 0 1rem 0',
          fontWeight: 400
        }}>Haz clic en cualquier hora para crear un sobrecupo</p>
        
        {currentWeekOffset !== 0 && (
          <button onClick={goToCurrentWeek} style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            padding: '0.375rem 0.75rem',
            background: 'rgba(255, 149, 0, 0.1)',
            border: 'none',
            borderRadius: '20px',
            color: '#ff9500',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Hoy
          </button>
        )}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="calendar-header">
          <div className="month-name">
            {weekInfo.monthYear}
          </div>
          
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-indicator available"></div>
              <span>Disponibles: {stats.disponibles}</span>
            </div>
            <div className="stat-item">
              <div className="stat-indicator reserved"></div>
              <span>Reservados: {stats.reservados}</span>
            </div>
            <div className="stat-total">
              Total: {stats.total}
            </div>
          </div>
        </div>
        
        
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '50px repeat(7, 1fr)',
            gap: '0.5px',
            background: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '0.5px solid rgba(0, 0, 0, 0.1)',
            touchAction: 'pan-x'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header con días */}
          <div className="calendar-nav-header">
            <button onClick={goToPreviousWeek} className="nav-btn nav-btn-left">
              ‹
            </button>
            <button onClick={goToNextWeek} className="nav-btn nav-btn-center">
              ›
            </button>
          </div>
          
          {weekDays.map((day, index) => (
            <div key={day.toISOString()} style={{
              background: isToday(day) ? 'rgba(255, 149, 0, 0.08)' : isPastDate(day) ? '#f9f9f9' : 'white',
              padding: '0.625rem 0.5rem',
              textAlign: 'center',
              borderBottom: '1px solid #e5e5e5',
              position: 'relative',
              border: isToday(day) ? '1px solid rgba(255, 149, 0, 0.2)' : 'none',
              opacity: isPastDate(day) ? 0.6 : 1
            }}>
              <div style={{
                fontWeight: 500,
                color: '#171717',
                fontSize: '0.8125rem',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {dayNames[index]}
              </div>
              <div className="day-number" style={{
                color: isToday(day) ? '#ff9500' : '#171717',
                fontWeight: isToday(day) ? 600 : 300
              }}>
                {day.getDate()}
              </div>
              
              {index === 6 && (
                <button onClick={goToNextWeek} className="nav-btn nav-btn-right">
                  ›
                </button>
              )}
              
            </div>
          ))}

          {/* Grid de horas */}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div style={{
                background: 'white',
                padding: '0.625rem 0.375rem',
                textAlign: 'center',
                fontSize: '0.6875rem',
                fontWeight: 400,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5'
              }}>
                {formatTime(hour)}
              </div>
              
              {weekDays.map(day => {
                const slotKey = getSlotKey(day, hour);
                const sobrecupo = sobrecupos[slotKey];
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    style={{
                      background: sobrecupo ? (sobrecupo.estado === 'disponible' ? '#ff9500' : '#10b981') : isPastDate(day) ? '#f9f9f9' : 'white',
                      color: sobrecupo ? 'white' : isPastDate(day) ? '#999' : 'black',
                      minHeight: '40px',
                      cursor: isPastDate(day) && !sobrecupo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid #e5e5e5',
                      position: 'relative',
                      opacity: isPastDate(day) ? 0.6 : 1
                    }}
                    onClick={() => handleSlotClick(day, hour)}
                  >
                    {sobrecupo ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '0.25rem',
                        width: '100%'
                      }}>
                        <div style={{
                          fontWeight: 500,
                          fontSize: '0.6875rem',
                          marginBottom: '0.0625rem'
                        }}>
                          {sobrecupo.hora}
                        </div>
                        <div style={{
                          fontSize: '0.625rem',
                          opacity: 0.9,
                          marginBottom: '0.0625rem'
                        }}>
                          {sobrecupo.clinica}
                        </div>
                        {sobrecupo.estado === 'reservado' && (
                          <div style={{
                            fontSize: '0.5625rem',
                            fontWeight: 500,
                            opacity: 0.8
                          }}>
                            ✓ Reservado
                          </div>
                        )}
                      </div>
                    ) : !isPastDate(day) ? (
                      <div style={{
                        fontSize: '1.25rem',
                        color: '#d1d5db',
                        fontWeight: 300,
                        opacity: 0.6
                      }}>
                        +
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal para crear sobrecupo */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(23, 23, 23, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '300px',
            margin: '1rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e5e5e5'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 500,
                color: '#171717'
              }}>Crear Sobrecupo</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}>×</button>
            </div>
            
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                textAlign: 'center',
                color: '#9a3412',
                fontSize: '0.875rem'
              }}>
                <strong>
                  {selectedSlot && `${dayNames[selectedSlot.date.getDay() - 1]} ${selectedSlot.date.getDate()}, ${formatTime(selectedSlot.hour)}`}
                </strong>
              </div>
              
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontWeight: 500,
                  color: '#171717',
                  fontSize: '0.8125rem'
                }}>Clínica</label>
                <select
                  value={modalData.clinica}
                  onChange={(e) => setModalData(prev => ({ ...prev, clinica: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecciona una clínica</option>
                  {clinicasRegistradas.map((clinica, index) => (
                    <option key={index} value={clinica}>
                      {clinica}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem 1.25rem 1.25rem',
              justifyContent: 'center'
            }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid #e5e5e5',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                background: '#f9f9f9',
                color: '#666'
              }}>
                Cancelar
              </button>
              <button onClick={handleCreateSobrecupo} style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid #ff9500',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                background: '#ff9500',
                color: 'white'
              }}>
                Crear Sobrecupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver información del sobrecupo */}
      {showInfoModal && selectedSobrecupo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(23, 23, 23, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '300px',
            margin: '1rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e5e5e5'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 500,
                color: '#171717'
              }}>Información del Sobrecupo</h3>
              <button onClick={() => setShowInfoModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}>×</button>
            </div>
            
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Fecha y Hora</label>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#171717',
                    fontWeight: 400
                  }}>
                    {dayNames[selectedSobrecupo.date.getDay() - 1]} {selectedSobrecupo.date.getDate()}, {selectedSobrecupo.hora}
                  </div>
                </div>
                
                <div>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Clínica</label>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#171717',
                    fontWeight: 400
                  }}>{selectedSobrecupo.clinica}</div>
                </div>
                
                <div>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Estado</label>
                  <div style={{
                    fontSize: '0.875rem',
                    color: selectedSobrecupo.estado === 'disponible' ? '#ff9500' : '#10b981',
                    fontWeight: 500
                  }}>
                    {selectedSobrecupo.estado === 'disponible' ? '🟠 Disponible' : '🟢 Reservado'}
                  </div>
                </div>
              </div>
            </div>

            {!selectedSobrecupo?.isPast && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem 1.25rem 1.25rem',
                justifyContent: 'center'
              }}>
                <button onClick={handleDeleteSobrecupo} style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid #ef4444',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  background: '#ef4444',
                  color: 'white'
                }}>
                  Borrar
                </button>
                <button onClick={handleEditSobrecupo} style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid #ff9500',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  background: '#ff9500',
                  color: 'white'
                }}>
                  Editar
                </button>
              </div>
            )}
            
            {selectedSobrecupo?.isPast && (
              <div style={{
                padding: '0.75rem 1.25rem 1.25rem 1.25rem',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: '#8e8e93',
                  fontStyle: 'italic'
                }}>
                  Los sobrecupos pasados solo pueden ser consultados
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .month-name {
          fontSize: 0.9375rem;
          font-weight: 500;
          color: #8e8e93;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .stats-container {
          display: flex;
          gap: 1rem;
          fontSize: 0.8125rem;
          color: #8e8e93;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .stat-indicator {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        
        .stat-indicator.available {
          background: #ff9500;
        }
        
        .stat-indicator.reserved {
          background: #10b981;
        }
        
        .stat-total {
          font-weight: 500;
          color: #171717;
        }
        
        .day-number {
          fontSize: 1.25rem;
          font-weight: 300;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        
        .calendar-nav-header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.5rem;
        }
        
        .nav-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #8e8e93;
          fontSize: 1.5rem;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 300;
        }
        
        .nav-btn-left {
          /* Flecha izquierda en desktop */
        }
        
        .nav-btn-center {
          /* Flecha del centro (oculta en desktop) */
        }
        
        .nav-btn-right {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        
        @media (max-width: 768px) {
          
          .calendar-header {
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
            margin-bottom: 0.75rem;
          }
          
          .calendar-nav-header {
            justify-content: center;
            position: relative;
          }
          
          .nav-btn-left {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
          }
          
          .nav-btn-center {
            display: none;
          }
          
          .nav-btn-right {
            display: none;
          }
          
          
          .month-name {
            fontSize: 0.8125rem;
            align-self: center;
            order: 2;
          }
          
          .stats-container {
            gap: 0.75rem;
            fontSize: 0.75rem;
            flex-wrap: wrap;
            order: 1;
            justify-content: center;
          }
          
          .stat-item {
            gap: 0.25rem;
          }
          
          .stat-indicator {
            width: 10px;
            height: 10px;
          }
          
          .day-number {
            fontSize: 0.875rem;
            margin-bottom: 0.0625rem;
          }
        }
      `}</style>
    </div>
  );
}