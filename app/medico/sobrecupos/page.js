'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SobrecuposMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sobrecupos, setSobrecupos] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSobrecupo, setSelectedSobrecupo] = useState(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [modalData, setModalData] = useState({ clinica: '' });
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [message, setMessage] = useState('');
  const [showBatchCreator, setShowBatchCreator] = useState(false);
  const [selectedHoras, setSelectedHoras] = useState([]);
  const [batchData, setBatchData] = useState({ fecha: '', clinica: '' });

  const clinicasRegistradas = [
    'Consulta particular',
    'Clínica Las Condes', 
    'Clínica Alemana',
    'Hospital Salvador',
    'Clínica Santa María',
    'Clínica UC'
  ];

  const horarios = [
    "08:00", "09:00", "10:00", "11:00", 
    "12:00", "13:00", "14:00", "15:00", 
    "16:00", "17:00", "18:00", "19:00"
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchSobrecupos();
    }
  }, [session, status, router]);

  const fetchSobrecupos = async () => {
    try {
      const res = await fetch(`/api/sobrecupos/medicos/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        // Convertir array a objeto para el calendario
        const sobrecuposObj = {};
        data.forEach(sobrecupo => {
          const slotKey = `${sobrecupo.fields?.Fecha}-${sobrecupo.fields?.Hora?.split(':')[0]}`;
          sobrecuposObj[slotKey] = {
            id: sobrecupo.id,
            fecha: sobrecupo.fields?.Fecha,
            hora: sobrecupo.fields?.Hora,
            clinica: sobrecupo.fields?.Clínica || 'Consulta particular',
            estado: (sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true) ? 'disponible' : 'reservado'
          };
        });
        setSobrecupos(sobrecuposObj);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
      setMessage('❌ Error cargando sobrecupos');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateSobrecupo = async () => {
    if (!selectedSlot) return;

    try {
      const doctorData = session.user.doctorData;
      
      const response = await fetch('/api/sobrecupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medico: session.user.doctorId,
          especialidad: doctorData?.Especialidad || 'Sin especialidad',
          clinica: modalData.clinica || 'Consulta particular',
          direccion: 'Por definir',
          fecha: formatDate(selectedSlot.date),
          hora: formatTime(selectedSlot.hour)
        })
      });

      if (response.ok) {
        setMessage('✅ Sobrecupo creado correctamente');
        setSobrecupos(prev => ({
          ...prev,
          [selectedSlot.slotKey]: {
            fecha: formatDate(selectedSlot.date),
            hora: formatTime(selectedSlot.hour),
            clinica: modalData.clinica || 'Consulta particular',
            estado: 'disponible'
          }
        }));
        setShowModal(false);
        setSelectedSlot(null);
        setModalData({ clinica: '' });
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ Error creando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
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

  const handleDeleteSobrecupo = async () => {
    if (!confirm('¿Estás seguro de eliminar este sobrecupo?')) return;

    try {
      const response = await fetch(`/api/sobrecupos?id=${selectedSobrecupo.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSobrecupos(prev => {
          const newSobrecupos = { ...prev };
          delete newSobrecupos[selectedSobrecupo.slotKey];
          return newSobrecupos;
        });
        setShowInfoModal(false);
        setSelectedSobrecupo(null);
        setMessage('✅ Sobrecupo eliminado');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error eliminando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const getSobrecupoCount = () => {
    const disponibles = Object.values(sobrecupos).filter(s => s.estado === 'disponible').length;
    const reservados = Object.values(sobrecupos).filter(s => s.estado === 'reservado').length;
    return { disponibles, reservados, total: disponibles + reservados };
  };

  const stats = getSobrecupoCount();

  const toggleHora = (hora) => {
    setSelectedHoras(prev => 
      prev.includes(hora) 
        ? prev.filter(h => h !== hora)
        : [...prev, hora]
    );
  };

  const selectAllHoras = () => {
    setSelectedHoras(horarios);
  };

  const clearAllHoras = () => {
    setSelectedHoras([]);
  };

  const getDisplayText = () => {
    if (selectedHoras.length === 0) return "Seleccionar horarios";
    if (selectedHoras.length === 1) return selectedHoras[0];
    if (selectedHoras.length === horarios.length) return "Todos los horarios";
    return `${selectedHoras.length} horarios seleccionados`;
  };

  const handleBatchCreate = async () => {
    if (!batchData.fecha || selectedHoras.length === 0) {
      setMessage('❌ Selecciona fecha y horarios');
      return;
    }

    try {
      const doctorData = session.user.doctorData;
      const promises = selectedHoras.map(hora =>
        fetch('/api/sobrecupos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medico: session.user.doctorId,
            especialidad: doctorData?.Especialidad || 'Sin especialidad',
            clinica: batchData.clinica || 'Consulta particular',
            direccion: 'Por definir',
            fecha: batchData.fecha,
            hora: hora
          })
        })
      );

      await Promise.all(promises);
      setMessage(`✅ ${selectedHoras.length} sobrecupos creados correctamente`);
      
      // Actualizar estado local
      const newSobrecupos = {};
      selectedHoras.forEach(hora => {
        const date = new Date(batchData.fecha);
        const slotKey = `${batchData.fecha}-${parseInt(hora.split(':')[0])}`;
        newSobrecupos[slotKey] = {
          fecha: batchData.fecha,
          hora: hora,
          clinica: batchData.clinica || 'Consulta particular',
          estado: 'disponible'
        };
      });
      
      setSobrecupos(prev => ({ ...prev, ...newSobrecupos }));
      setShowBatchCreator(false);
      setSelectedHoras([]);
      setBatchData({ fecha: '', clinica: '' });
      setTimeout(() => setMessage(''), 5000);
      
    } catch (error) {
      setMessage('❌ Error creando sobrecupos');
    }
  };

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
              <div className="progress-fill"></div>
            </div>
            <p className="loading-text">Cargando tus sobrecupos...</p>
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
            width: 100%;
            animation: progressAnimation 2s ease-in-out infinite;
          }

          .loading-text {
            color: #666;
            font-size: 0.875rem;
            margin-top: 2rem;
            font-weight: 400;
            letter-spacing: 0.5px;
          }

          @keyframes progressAnimation {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <button onClick={() => router.back()} style={{
            width: '36px',
            height: '36px',
            background: 'none',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {currentWeekOffset !== 0 && (
            <button onClick={goToCurrentWeek} style={{
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
        

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: '1rem',
            background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
            color: message.includes('✅') ? '#166534' : '#991b1b',
            border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message}
          </div>
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
        
        {/* Calendario Desktop/Tablet */}
        <div 
          className="calendar-desktop"
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
        
        {/* Calendario Móvil - Vista compacta con scroll */}
        <div className="calendar-mobile">
          {/* Navegación móvil */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            padding: '0'
          }}>
            <button 
              onClick={goToPreviousWeek}
              style={{
                background: 'rgba(255, 149, 0, 0.1)',
                border: '1px solid rgba(255, 149, 0, 0.3)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#ff9500'
              }}
            >
              ‹
            </button>
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              Desliza para navegar
            </div>
            <button 
              onClick={goToNextWeek}
              style={{
                background: 'rgba(255, 149, 0, 0.1)',
                border: '1px solid rgba(255, 149, 0, 0.3)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#ff9500'
              }}
            >
              ›
            </button>
          </div>
          
          {/* Grid horizontal scrollable de días */}
          <div 
            className="calendar-mobile-scroll"
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: '0.5rem',
              scrollBehavior: 'smooth'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {weekDays.map((day, dayIndex) => (
              <div 
                key={day.toISOString()}
                className="day-column-mobile"
                style={{
                  minWidth: '140px',
                  maxWidth: '140px',
                  scrollSnapAlign: 'start',
                  background: 'white',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: isToday(day) ? '2px solid #ff9500' : '1px solid rgba(0, 0, 0, 0.08)',
                  opacity: isPastDate(day) ? 0.7 : 1,
                  flexShrink: 0
                }}
              >
                {/* Header compacto del día */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  background: isToday(day) ? 'rgba(255, 149, 0, 0.1)' : isPastDate(day) ? '#f9f9f9' : '#fafafa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.25rem'
                  }}>
                    {dayNames[dayIndex]}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: isToday(day) ? 600 : 400,
                    color: isToday(day) ? '#ff9500' : '#171717'
                  }}>
                    {day.getDate()}
                  </div>
                  {isToday(day) && (
                    <div style={{
                      fontSize: '0.625rem',
                      color: '#ff9500',
                      fontWeight: 600,
                      marginTop: '0.125rem'
                    }}>
                      HOY
                    </div>
                  )}
                </div>

                {/* Grid de horas compacto */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.25rem'
                }}>
                  {hours.map(hour => {
                    const slotKey = getSlotKey(day, hour);
                    const sobrecupo = sobrecupos[slotKey];
                    
                    return (
                      <div
                        key={hour}
                        onClick={() => handleSlotClick(day, hour)}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          cursor: isPastDate(day) && !sobrecupo ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          background: sobrecupo 
                            ? (sobrecupo.estado === 'disponible' ? '#ff9500' : '#d4edda')
                            : isPastDate(day) ? '#f5f5f5' : '#fafafa',
                          border: sobrecupo ? 'none' : '1px solid #e5e5e5',
                          position: 'relative'
                        }}
                      >
                        {sobrecupo ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              fontSize: '0.875rem',
                              color: sobrecupo.estado === 'disponible' ? 'white' : '#28a745'
                            }}>
                              ❤️
                            </div>
                          </div>
                        ) : !isPastDate(day) ? (
                          <div style={{
                            fontSize: '0.625rem',
                            color: '#999',
                            textAlign: 'center',
                            fontWeight: 500
                          }}>
                            {hour}
                          </div>
                        ) : (
                          <div style={{
                            fontSize: '0.625rem',
                            color: '#ccc',
                            textAlign: 'center'
                          }}>
                            {hour}
                          </div>
                        )}
                        
                        {/* Tooltip con la hora en esquina */}
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          fontSize: '0.5rem',
                          color: sobrecupo 
                            ? (sobrecupo.estado === 'disponible' ? 'rgba(255,255,255,0.8)' : 'rgba(40,167,69,0.8)')
                            : '#999',
                          fontWeight: 500,
                          lineHeight: 1
                        }}>
                          {hour}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        
        {/* Botón Crear Múltiples Sobrecupos bajo el calendario */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1.5rem'
        }}>
          <button 
            onClick={() => setShowBatchCreator(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ff9500, #ff7b00)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)'
            }}
          >
            📅 Crear Múltiples Sobrecupos
          </button>
        </div>
        
        {/* Modal de Creación Masiva */}
        {showBatchCreator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e5e5'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#171717'
              }}>📅 Crear Sobrecupos</h3>
              <button 
                onClick={() => setShowBatchCreator(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#999',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Contenido del Modal */}
            <div style={{
              padding: '1.5rem'
            }}>
              {/* Selectores de Fecha y Clínica */}
              <div className="modal-form-section">
                <div className="modal-form-field">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>Fecha *</label>
                  <input
                    type="date"
                    value={batchData.fecha}
                    onChange={(e) => setBatchData(prev => ({ ...prev, fecha: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div className="modal-form-field">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>Clínica</label>
                  <select
                    value={batchData.clinica}
                    onChange={(e) => setBatchData(prev => ({ ...prev, clinica: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
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
              
              {/* Selector de Horarios */}
              <div style={{
                marginTop: '1.5rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Horarios * ({selectedHoras.length} seleccionado{selectedHoras.length !== 1 ? 's' : ''})
                </label>
                
                {/* Pills de Selección */}
                {selectedHoras.length > 0 && (
                  <div className="selected-pills-modal">
                    {selectedHoras.map(hora => (
                      <span key={hora} className="time-pill-modal">
                        {hora}
                        <button
                          onClick={() => toggleHora(hora)}
                          className="pill-remove-modal"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Botones de Control */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  justifyContent: 'center'
                }}>
                  <button onClick={selectAllHoras} className="control-btn-modal primary">
                    Todos
                  </button>
                  <button onClick={clearAllHoras} className="control-btn-modal secondary">
                    Limpiar
                  </button>
                </div>
                
                {/* Grid de Horarios - Responsivo */}
                <div className="horarios-grid-modal">
                  {horarios.map(hora => (
                    <div
                      key={hora}
                      className={`horario-card-modal ${selectedHoras.includes(hora) ? 'selected' : ''}`}
                      onClick={() => toggleHora(hora)}
                    >
                      <div className="horario-time-modal">{hora}</div>
                      {selectedHoras.includes(hora) && (
                        <div className="horario-check-modal">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e5e5'
              }}>
                <button 
                  onClick={() => setShowBatchCreator(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#f9f9f9',
                    color: '#666',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleBatchCreate}
                  disabled={selectedHoras.length === 0 || !batchData.fecha}
                  style={{
                    flex: 2,
                    padding: '0.875rem',
                    background: selectedHoras.length === 0 || !batchData.fecha ? '#ccc' : 'linear-gradient(135deg, #ff9500, #ff7b00)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: selectedHoras.length === 0 || !batchData.fecha ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    boxShadow: selectedHoras.length === 0 || !batchData.fecha ? 'none' : '0 4px 12px rgba(255, 149, 0, 0.3)'
                  }}
                >
                  Crear {selectedHoras.length || 0} Sobrecupo{selectedHoras.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {selectedSobrecupo.date && dayNames[selectedSobrecupo.date.getDay() - 1]} {selectedSobrecupo.date && selectedSobrecupo.date.getDate()}, {selectedSobrecupo.hora}
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
        
        /* Control de visibilidad del calendario */
        .calendar-desktop {
          display: grid;
        }
        
        .calendar-mobile {
          display: none;
        }
        
        @media (max-width: 768px) {
          .calendar-desktop {
            display: none;
          }
          
          .calendar-mobile {
            display: block;
          }
          
          .calendar-header {
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
            margin-bottom: 0.75rem;
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
        }
        
        /* Estilos para el modal de creación masiva */
        .modal-form-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .modal-form-field {
          display: flex;
          flex-direction: column;
        }
        
        .selected-pills-modal {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .time-pill-modal {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #ff9500, #ff7b00);
          color: white;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
        }
        
        .pill-remove-modal {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
          padding: 0;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .pill-remove-modal:hover {
          opacity: 1;
        }
        
        .control-btn-modal {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        
        .control-btn-modal.primary {
          background: linear-gradient(135deg, #ff9500, #ff7b00);
          color: white;
          border: none;
        }
        
        .control-btn-modal.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }
        
        .control-btn-modal.secondary {
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
        }
        
        .control-btn-modal.secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        
        .horarios-grid-modal {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
        }
        
        .horario-card-modal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 65px;
          position: relative;
        }
        
        .horario-card-modal:hover {
          border-color: #ff9500;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 149, 0, 0.15);
        }
        
        .horario-card-modal.selected {
          background: linear-gradient(135deg, #ff9500, #ff7b00);
          border-color: #ff9500;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 149, 0, 0.3);
        }
        
        .horario-time-modal {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        
        .horario-check-modal {
          position: absolute;
          top: 0.4rem;
          right: 0.4rem;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Responsive modal */
        @media (max-width: 768px) {
          .modal-form-section {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .horarios-grid-modal {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.375rem;
            padding: 0.5rem;
          }
          
          .horario-card-modal {
            min-height: 45px;
            padding: 0.375rem;
          }
          
          .horario-time-modal {
            font-size: 0.8125rem;
          }
          
          .horario-check-modal {
            top: 0.25rem;
            right: 0.25rem;
            width: 16px;
            height: 16px;
          }
          
          .horario-check-modal svg {
            width: 12px;
            height: 12px;
          }
          
          .selected-pills-modal {
            gap: 0.25rem;
          }
          
          .time-pill-modal {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          
          .control-btn-modal {
            padding: 0.375rem 0.75rem;
            font-size: 0.8125rem;
          }
        }
        
        /* Estilos específicos para el calendario móvil */
        .calendar-mobile {
          padding: 0 0.5rem;
        }
        
        .calendar-mobile-scroll {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 149, 0, 0.5) transparent;
        }
        
        .calendar-mobile-scroll::-webkit-scrollbar {
          height: 6px;
        }
        
        .calendar-mobile-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        
        .calendar-mobile-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 149, 0, 0.4);
          border-radius: 3px;
        }
        
        .calendar-mobile-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 149, 0, 0.6);
        }
        
        .day-column-mobile {
          transition: transform 0.2s ease;
        }
        
        .day-column-mobile:hover {
          transform: translateY(-2px);
        }
        
        /* Mejoras adicionales para móvil */
        @media (max-width: 480px) {
          .calendar-mobile {
            padding: 0 0.25rem;
          }
          
          .day-column-mobile {
            min-width: 130px;
            max-width: 130px;
            padding: 0.5rem;
          }
          
          .calendar-mobile-scroll {
            gap: 0.375rem;
          }
        }
        
        @media (max-width: 375px) {
          .day-column-mobile {
            min-width: 120px;
            max-width: 120px;
            padding: 0.375rem;
          }
          
          .calendar-mobile-scroll {
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}