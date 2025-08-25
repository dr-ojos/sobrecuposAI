'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const AgendarSobrecuposContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sobrecupos, setSobrecupos] = useState([]);
  const [filteredSobrecupos, setFilteredSobrecupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSobrecupo, setSelectedSobrecupo] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [filters, setFilters] = useState({
    especialidad: '',
    medico: '',
    fecha: ''
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState(new Map());
  const [reservationData, setReservationData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    rut: '',
    edad: '',
    motivoConsulta: ''
  });
  const [message, setMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Cargar filtros desde URL params
  useEffect(() => {
    const medico = searchParams.get('medico');
    const especialidad = searchParams.get('especialidad');
    const fecha = searchParams.get('fecha');
    
    if (medico || especialidad || fecha) {
      setFilters({
        medico: medico || '',
        especialidad: especialidad || '',
        fecha: fecha || ''
      });
    }
  }, [searchParams]);

  // Cargar sobrecupos desde la API real
  useEffect(() => {
    const fetchSobrecupos = async () => {
      try {
        console.log('📡 Cargando sobrecupos desde API...');
        setLoading(true);
        
        const response = await fetch('/api/sobrecupos/available');
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const records = data.records || [];
          console.log(`✅ Cargados ${records.length} sobrecupos`);
          
          // Filtrar solo sobrecupos desde la fecha actual hacia adelante
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const futureSobrecupos = records.filter(sobrecupo => {
            const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
            return sobrecupoDate >= today;
          });
          
          console.log(`📅 Sobrecupos futuros: ${futureSobrecupos.length}`);
          setSobrecupos(futureSobrecupos);
          setFilteredSobrecupos(futureSobrecupos);
          
          // Extraer fechas únicas para el calendario
          const uniqueDates = [...new Set(futureSobrecupos.map(s => s.fields?.Fecha).filter(Boolean))].sort();
          setAvailableDates(uniqueDates);
          
          // Crear mapa de fechas con conteo de sobrecupos
          const dateMap = new Map();
          futureSobrecupos.forEach(sobrecupo => {
            const date = sobrecupo.fields?.Fecha;
            if (date) {
              const count = dateMap.get(date) || 0;
              dateMap.set(date, count + 1);
            }
          });
          setCalendarDates(dateMap);
        } else {
          throw new Error(data.error || 'Error obteniendo datos');
        }
      } catch (error) {
        console.error('❌ Error fetching sobrecupos:', error);
        setMessage('Error cargando sobrecupos. Intenta recargar la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchSobrecupos();
  }, []);

  // Filtrar sobrecupos
  useEffect(() => {
    let filtered = sobrecupos.filter(s => s.fields.Disponible === 'Si');

    if (filters.especialidad) {
      filtered = filtered.filter(s => 
        s.fields.Especialidad && s.fields.Especialidad.toLowerCase().includes(filters.especialidad.toLowerCase())
      );
    }

    if (filters.medico) {
      filtered = filtered.filter(s => 
        s.fields.Médico && s.fields.Médico.toLowerCase().includes(filters.medico.toLowerCase())
      );
    }

    if (filters.fecha) {
      filtered = filtered.filter(s => s.fields.Fecha === filters.fecha);
    }

    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.fields.Fecha}T${a.fields.Hora}`);
      const dateB = new Date(`${b.fields.Fecha}T${b.fields.Hora}`);
      return dateA - dateB;
    });

    setFilteredSobrecupos(filtered);
  }, [sobrecupos, filters]);

  // Actualizar calendario cuando cambien los filtros
  useEffect(() => {
    let sobrecuposParaCalendario = sobrecupos.filter(s => s.fields.Disponible === 'Si');

    // Aplicar filtros de especialidad y médico al calendario (pero NO fecha)
    if (filters.especialidad) {
      sobrecuposParaCalendario = sobrecuposParaCalendario.filter(s => 
        s.fields.Especialidad && s.fields.Especialidad.toLowerCase().includes(filters.especialidad.toLowerCase())
      );
    }

    if (filters.medico) {
      sobrecuposParaCalendario = sobrecuposParaCalendario.filter(s => 
        s.fields.Médico && s.fields.Médico.toLowerCase().includes(filters.medico.toLowerCase())
      );
    }

    // Actualizar mapa de fechas del calendario con los sobrecupos filtrados
    const dateMap = new Map();
    sobrecuposParaCalendario.forEach(sobrecupo => {
      const date = sobrecupo.fields?.Fecha;
      if (date) {
        const count = dateMap.get(date) || 0;
        dateMap.set(date, count + 1);
      }
    });
    setCalendarDates(dateMap);

    // Actualizar fechas disponibles para el calendario
    const uniqueDates = [...new Set(sobrecuposParaCalendario.map(s => s.fields?.Fecha).filter(Boolean))].sort();
    setAvailableDates(uniqueDates);
  }, [sobrecupos, filters.especialidad, filters.medico]);

  const handleReservarClick = (sobrecupo) => {
    setSelectedSobrecupo(sobrecupo);
    setShowReservationModal(true);
  };

  const handleReservationSubmit = async () => {
    // Validar campos obligatorios
    const requiredFields = {
      nombre: 'Nombres',
      rut: 'RUT',
      email: 'Email',
      telefono: 'Teléfono'
    };

    const emptyFields = [];
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!reservationData[field] || reservationData[field].trim() === '') {
        emptyFields.push(label);
      }
    });

    // Validar términos y condiciones
    if (!acceptTerms) {
      emptyFields.push('Aceptar términos y condiciones');
    }

    if (emptyFields.length > 0) {
      setMessage(`Por favor completa los siguientes campos obligatorios: ${emptyFields.join(', ')}`);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reservationData.email)) {
      setMessage('Por favor ingresa un email válido');
      return;
    }

    // Validar RUT (formato con o sin puntos)
    const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/;
    if (!rutRegex.test(reservationData.rut)) {
      setMessage('Por favor ingresa un RUT válido (ejemplo: 12.345.678-9 o 12345678-9)');
      return;
    }

    // Validar teléfono (formato básico)
    const phoneRegex = /^\+?56\d{9}$/;
    if (!phoneRegex.test(reservationData.telefono.replace(/\s/g, ''))) {
      setMessage('Por favor ingresa un teléfono válido (+56912345678)');
      return;
    }

    setMessage(''); // Limpiar mensaje de error
    setReservationLoading(true);

    try {
      console.log('🎯 Creando enlace de pago...');
      
      // Validar datos del sobrecupo seleccionado
      if (!selectedSobrecupo || !selectedSobrecupo.id) {
        setMessage('Error: No se ha seleccionado un sobrecupo válido');
        return;
      }
      
      // Usar datos reales proporcionados por el usuario
      const userData = {
        nombre: reservationData.nombre.trim(),
        apellidos: reservationData.apellidos.trim() || '',
        rut: reservationData.rut.trim(),
        telefono: reservationData.telefono.trim(),
        email: reservationData.email.trim(),
        edad: reservationData.edad || '35',
        motivoConsulta: reservationData.motivoConsulta.trim() || 'Consulta general'
      };
      
      const paymentPayload = {
        sobrecupoId: selectedSobrecupo.id,
        patientName: `${userData.nombre} ${userData.apellidos}`.trim(),
        patientRut: userData.rut,
        patientPhone: userData.telefono,
        patientEmail: userData.email,
        patientAge: userData.edad,
        doctorName: selectedSobrecupo.fields?.Médico || 'Doctor no disponible',
        specialty: selectedSobrecupo.fields?.Especialidad || 'Especialidad no disponible',
        date: selectedSobrecupo.fields?.Fecha || 'Fecha no disponible',
        time: selectedSobrecupo.fields?.Hora || 'Hora no disponible',
        clinic: selectedSobrecupo.fields?.Clínica || 'Clínica no disponible',
        amount: "2990", // Precio estándar
        motivo: userData.motivoConsulta, // Motivo de la consulta del usuario
        fromChat: true, // 🆕 USAR MISMO FLUJO QUE CHATBOT (FUNCIONA)
        sessionId: `direct-booking-demo-${Date.now()}` // ID de sesión único
      };
      
      // Validar campos requeridos antes de enviar
      const requiredFields = {
        sobrecupoId: 'ID del sobrecupo',
        patientName: 'Nombre del paciente',
        patientRut: 'RUT del paciente',
        patientPhone: 'Teléfono del paciente',
        patientEmail: 'Email del paciente',
        patientAge: 'Edad del paciente',
        doctorName: 'Nombre del médico',
        specialty: 'Especialidad',
        date: 'Fecha',
        time: 'Hora',
        clinic: 'Clínica',
        sessionId: 'ID de sesión'
      };
      
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!paymentPayload[field] || paymentPayload[field].toString().trim() === '') {
          console.error(`❌ Campo faltante: ${field} (${label})`);
          setMessage(`Error: Falta ${label}. Por favor recarga la página e intenta nuevamente.`);
          return;
        }
      }
      
      console.log('📤 Payload enviado:', JSON.stringify(paymentPayload, null, 2));
      
      // Crear enlace de pago (mismo flujo que el chatbot)
      const paymentResponse = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload)
      });

      // Verificar si la respuesta es exitosa
      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error('❌ HTTP Error:', paymentResponse.status, errorText);
        setMessage(`Error HTTP ${paymentResponse.status}: ${errorText.slice(0, 100)}`);
        return;
      }

      const paymentResult = await paymentResponse.json();

      if (paymentResult.success) {
        console.log('✅ Enlace de pago creado:', paymentResult.shortUrl);
        
        // Cerrar modal y redirigir a página de pago
        setShowReservationModal(false);
        setReservationData({
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
          rut: '',
          edad: '',
          motivoConsulta: ''
        });
        setAcceptTerms(false);
        
        // Redirigir a página de pago
        window.location.href = paymentResult.shortUrl;
      } else {
        console.error('❌ Payment error:', paymentResult);
        setMessage(paymentResult.error || 'Error creando el enlace de pago. Intenta nuevamente.');
      }
      
    } catch (error) {
      console.error('❌ Network Error:', error);
      setMessage(`Error de conexión: ${error.message}`);
    } finally {
      setReservationLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getUniqueEspecialidades = () => {
    const especialidades = sobrecupos
      .map(s => s.fields.Especialidad)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return especialidades.sort();
  };

  const getUniqueMedicos = () => {
    const medicos = sobrecupos
      .map(s => s.fields.Médico)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return medicos.sort();
  };

  const clearFilters = () => {
    setFilters({ especialidad: '', medico: '', fecha: '' });
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleDateSelect = (date) => {
    setFilters(prev => ({ ...prev, fecha: date }));
    setShowCalendar(false);
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, fecha: '' }));
  };

  // Funciones del calendario
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lunes = 0, Domingo = 6
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

  const isDateSelected = (dateString) => {
    return filters.fecha === dateString;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const handleCalendarDateClick = (dateString) => {
    if (isDateAvailable(dateString)) {
      setFilters(prev => ({ ...prev, fecha: dateString }));
      setShowCalendar(false);
    }
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
        isSelected: isDateSelected(dateString),
        count: getSobrecuposCount(dateString)
      });
    }
    
    return grid;
  };

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.date-filter-container')) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handleBackClick = () => {
    router.push('/');
  };

  const handleCloseModal = () => {
    setShowReservationModal(false);
    setSelectedSobrecupo(null);
    setReservationData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      rut: '',
      edad: '',
      motivoConsulta: ''
    });
    setAcceptTerms(false);
    setMessage(''); // Limpiar mensaje de error al cerrar modal
  };

  const getPrevisiones = (sobrecupo) => {
    let seguros = sobrecupo.fields.Seguro || 
                  sobrecupo.fields.Seguros || 
                  sobrecupo.fields.Previsiones || 
                  sobrecupo.fields.Isapres || 
                  sobrecupo.fields.Prevision ||
                  'Consultar seguros';
    
    if (seguros !== 'Consultar seguros') {
      if (Array.isArray(seguros)) {
        seguros = seguros.join(', ');
      }
      else if (typeof seguros === 'string') {
        seguros = seguros.replace(/([A-Z])/g, ', $1').trim();
        if (seguros.startsWith(', ')) {
          seguros = seguros.substring(2);
        }
        seguros = seguros.replace(/,\s+/g, ', ');
      }
      else {
        seguros = String(seguros);
      }
    }
    
    return seguros;
  };

  return (
    <main className="page-container">
      {/* Header Minimalista */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <button onClick={handleBackClick} className="back-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="header-text">
                <h1 className="header-title">Sobrecupos</h1>
              </div>
            </div>
            <div className="header-stats">
              {!loading && (
                <span className="stats-badge">
                  {filteredSobrecupos.length} disponibles
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="main-layout">
        <div className="content-container">
          
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="main-title">Encuentra tu Sobrecupo</h2>
              <p className="main-subtitle">Sobrecupos disponibles para reservar ahora</p>
            </div>
          </section>

          {/* Filtros Minimalistas */}
          <section className="filters-section">
            <div className="filters-container">
              <div className="filter-group">
                <select
                  value={filters.especialidad}
                  onChange={(e) => setFilters(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">Especialidades</option>
                  {getUniqueEspecialidades().map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={filters.medico}
                  onChange={(e) => setFilters(prev => ({ ...prev, medico: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">Todos los médicos</option>
                  {getUniqueMedicos().map(medico => (
                    <option key={medico} value={medico}>{medico}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <div className="date-filter-container">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`date-filter-button ${filters.fecha ? 'active' : ''}`}
                  >
                    <svg className="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span>{filters.fecha ? formatCalendarDate(filters.fecha) : 'Fecha'}</span>
                    {filters.fecha && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearDateFilter();
                        }}
                        className="clear-date-button"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    )}
                  </button>

                  {showCalendar && (
                    <>
                      <div className="calendar-overlay" onClick={() => setShowCalendar(false)} />
                      <div className="calendar-dropdown">
                      <div className="calendar-header">
                        <button
                          onClick={() => navigateMonth(-1)}
                          className="calendar-nav"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <div className="calendar-month-container">
                          <h4 className="calendar-month">
                            {currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                          </h4>
                          {(filters.especialidad || filters.medico) && (
                            <div className="calendar-filter-indicator">
                              {filters.medico ? `Dr. ${filters.medico}` : filters.especialidad}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => navigateMonth(1)}
                          className="calendar-nav"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowCalendar(false)}
                          className="calendar-close"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5"/>
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
                              onClick={() => dateInfo && handleCalendarDateClick(dateInfo.dateString)}
                              className={`calendar-day ${
                                !dateInfo ? 'empty' : 
                                dateInfo.isPast ? 'past' :
                                dateInfo.isSelected ? 'selected' :
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
                        
                        {(filters.especialidad || filters.medico) && availableDates.length === 0 && (
                          <div className="calendar-no-dates">
                            <div className="no-dates-icon">📅</div>
                            <p className="no-dates-text">
                              No hay sobrecupos disponibles para {filters.medico ? `Dr. ${filters.medico}` : filters.especialidad}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>

              {(filters.especialidad || filters.medico || filters.fecha) && (
                <button onClick={clearFilters} className="clear-filters">
                  Limpiar
                </button>
              )}
            </div>
          </section>


          {/* Contenido Principal */}
          <section className="results-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Cargando sobrecupos...</p>
              </div>
            ) : filteredSobrecupos.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No se encontraron sobrecupos</h3>
                <p className="empty-text">Intenta ajustar los filtros o revisa más tarde</p>
                {sobrecupos.length > 0 && (
                  <button onClick={clearFilters} className="empty-button">
                    Ver todos los sobrecupos
                  </button>
                )}
              </div>
            ) : (
              <div className="results-grid">
                {filteredSobrecupos.map((sobrecupo) => (
                  <article key={sobrecupo.id} className="sobrecupo-card">
                    
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="doctor-info">
                        <div className="doctor-avatar">
                          {sobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="doctor-details">
                          <h3 className="doctor-name">
                            <button
                              onClick={() => router.push(`/medico-info/${encodeURIComponent(sobrecupo.fields.Médico)}`)}
                              className="doctor-name-button"
                            >
                              {sobrecupo.fields.Médico}
                            </button>
                          </h3>
                          <p className="doctor-specialty">
                            {sobrecupo.fields.Especialidad}
                          </p>
                        </div>
                      </div>
                      <div className="appointment-time">
                        <div className="date-text">
                          {formatDate(sobrecupo.fields.Fecha)}
                        </div>
                        <div className="time-text">
                          {sobrecupo.fields.Hora}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                      <div className="location-info">
                        <div className="clinic-name">{sobrecupo.fields.Clínica}</div>
                        <div className="clinic-address">{sobrecupo.fields.Dirección}</div>
                      </div>
                      
                      <div className="additional-info">
                        <div className="info-item">
                          <span className="info-label">Previsión</span>
                          <span className="info-value">{getPrevisiones(sobrecupo)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Atiende</span>
                          <span className="info-value">{sobrecupo.fields.Atiende || 'Consultar'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                      <div className="footer-actions">
                        <button
                          onClick={() => router.push(`/medico-info/${encodeURIComponent(sobrecupo.fields.Médico)}`)}
                          className="info-button"
                        >
                          Perfil médico
                        </button>
                        <button
                          onClick={() => handleReservarClick(sobrecupo)}
                          className="reserve-button"
                        >
                          Reservar Sobrecupo
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal de Reserva */}
      {showReservationModal && selectedSobrecupo && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}>
          <div className="modal-content">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">Reservar sobrecupo</h3>
              <button onClick={handleCloseModal} className="modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              
              {/* Resumen de la cita */}
              <div className="appointment-summary">
                <div className="summary-avatar">
                  {selectedSobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="summary-details">
                  <div className="summary-doctor">{selectedSobrecupo.fields.Médico}</div>
                  <div className="summary-specialty">{selectedSobrecupo.fields.Especialidad}</div>
                  <div className="summary-clinic">{selectedSobrecupo.fields.Clínica}</div>
                  <div className="summary-datetime">
                    {formatDate(selectedSobrecupo.fields.Fecha)} - {selectedSobrecupo.fields.Hora}
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="form-container">
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Nombres *</label>
                    <input
                      type="text"
                      value={reservationData.nombre}
                      onChange={(e) => setReservationData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="field-input"
                      placeholder="Juan Carlos"
                      disabled={reservationLoading}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Apellidos</label>
                    <input
                      type="text"
                      value={reservationData.apellidos}
                      onChange={(e) => setReservationData(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="field-input"
                      placeholder="González López"
                      disabled={reservationLoading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">RUT *</label>
                    <input
                      type="text"
                      value={reservationData.rut}
                      onChange={(e) => setReservationData(prev => ({ ...prev, rut: e.target.value }))}
                      className="field-input"
                      placeholder="12345678-9 o 12.345.678-9"
                      disabled={reservationLoading}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Email *</label>
                    <input
                      type="email"
                      value={reservationData.email}
                      onChange={(e) => setReservationData(prev => ({ ...prev, email: e.target.value }))}
                      className="field-input"
                      placeholder="juan@email.com"
                      disabled={reservationLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Teléfono *</label>
                    <input
                      type="tel"
                      value={reservationData.telefono}
                      onChange={(e) => setReservationData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="field-input"
                      placeholder="+56912345678"
                      disabled={reservationLoading}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Edad</label>
                    <input
                      type="number"
                      value={reservationData.edad}
                      onChange={(e) => setReservationData(prev => ({ ...prev, edad: e.target.value }))}
                      className="field-input"
                      placeholder="30"
                      min="1"
                      max="120"
                      disabled={reservationLoading}
                    />
                  </div>
                </div>

                {/* Motivo de consulta */}
                <div className="form-field">
                  <label className="field-label">Motivo de consulta</label>
                  <textarea
                    value={reservationData.motivoConsulta}
                    onChange={(e) => setReservationData(prev => ({ ...prev, motivoConsulta: e.target.value }))}
                    className="field-input field-textarea"
                    placeholder="Describe brevemente el motivo de tu consulta..."
                    rows="3"
                    disabled={reservationLoading}
                  />
                </div>

                {/* Términos */}
                <div className="terms-container">
                  <label className="terms-label">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="terms-checkbox"
                      disabled={reservationLoading}
                    />
                    <span className="terms-text">
                      Acepto los términos y condiciones
                    </span>
                  </label>
                </div>

                {/* Aviso Demo */}
                <div className="warning-notice">
                  <span className="warning-icon">🔬</span>
                  <div>
                    <div className="warning-title">Modo Demo</div>
                    <div className="warning-text">
                      Completa todos los campos obligatorios (*) para proceder con la simulación de pago de $2.990.
                    </div>
                  </div>
                </div>

                {/* Mensaje de error */}
                {message && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {message}
                  </div>
                )}

                {/* Botón de envío */}
                <button
                  onClick={handleReservationSubmit}
                  disabled={reservationLoading || !acceptTerms}
                  className={`submit-button ${reservationLoading || !acceptTerms ? 'disabled' : ''}`}
                >
                  {reservationLoading ? (
                    <span className="loading-content">
                      <span className="button-spinner"></span>
                      Creando enlace de pago...
                    </span>
                  ) : (
                    acceptTerms ? 'Ver Simulación de Pago ($2.990)' : 'Acepta los términos para continuar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
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

        .header-stats {
          display: none;
        }

        .stats-badge {
          font-size: 0.875rem;
          color: #666;
          background: #f5f5f5;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid #e5e5e5;
        }

        /* Layout Principal */
        .main-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          margin-bottom: 1rem;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .main-title {
          font-size: 2rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .main-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        /* Filtros */
        .filters-section {
          display: flex;
          justify-content: center;
        }

        .filters-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          max-width: 100%;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .filter-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          font-size: 0.875rem;
          color: #171717;
          outline: none;
          transition: border-color 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1rem;
          padding-right: 2.5rem;
        }

        .filter-select:focus {
          border-color: #171717;
        }

        .clear-filters {
          padding: 0.75rem 1rem;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .clear-filters:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Date Filter */
        .date-filter-container {
          position: relative;
        }

        .date-filter-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          font-size: 0.875rem;
          color: #171717;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: space-between;
          min-height: 46px;
        }

        .date-filter-button:hover,
        .date-filter-button.active {
          border-color: #171717;
        }

        .date-filter-button.active {
          background: #f9fafb;
        }

        .calendar-icon {
          color: #666;
          flex-shrink: 0;
        }

        .date-filter-button span {
          flex: 1;
          text-align: left;
        }

        .clear-date-button {
          padding: 2px;
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .clear-date-button:hover {
          color: #171717;
          background: #f5f5f5;
        }

        .calendar-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          z-index: 100;
          margin-top: 4px;
          overflow: hidden;
          width: 300px;
          max-width: calc(100vw - 2rem);
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f9fafb;
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
          background: #e5e5e5;
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

        .calendar-filter-indicator {
          font-size: 0.7rem;
          color: #ff9500;
          font-weight: 500;
          margin-top: 0.125rem;
          background: rgba(255, 149, 0, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 8px;
          display: inline-block;
        }

        .calendar-close {
          padding: 4px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-close:hover {
          background: #e5e5e5;
          color: #171717;
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
          background: none;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          color: #666;
        }

        .calendar-day.empty {
          cursor: default;
        }

        .calendar-day.past {
          color: #ccc;
          cursor: not-allowed;
        }

        .calendar-day.today {
          background: #f0f9ff;
          color: #0369a1;
          font-weight: 600;
        }

        .calendar-day.available {
          background: #fef3e2;
          color: #ea580c;
          font-weight: 600;
          border: 1px solid #fed7aa;
        }

        .calendar-day.available:hover {
          background: #fed7aa;
          color: #c2410c;
          transform: translateY(-1px);
        }

        .calendar-day.selected {
          background: #ff9500;
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
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

        .calendar-day.selected .sobrecupos-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .calendar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 99;
          display: none;
        }

        .calendar-no-dates {
          text-align: center;
          padding: 1rem;
          color: #666;
        }

        .no-dates-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .no-dates-text {
          font-size: 0.8rem;
          margin: 0;
          line-height: 1.4;
        }


        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Empty State */
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        .empty-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 2rem 0;
        }

        .empty-button {
          padding: 0.75rem 1.5rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .empty-button:hover {
          background: #000;
        }

        /* Results Grid */
        .results-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
          place-items: center;
        }

        .results-grid > * {
          width: 100%;
          max-width: 600px;
        }

        /* Sobrecupo Card */
        .sobrecupo-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .sobrecupo-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        /* Card Header */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .doctor-avatar {
          width: 40px;
          height: 40px;
          background: #171717;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .doctor-details {
          flex: 1;
          min-width: 0;
        }

        .doctor-name {
          font-size: 1.1rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .doctor-name-button {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font-size: inherit;
          font-weight: inherit;
          color: inherit;
          text-align: left;
          cursor: pointer;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: inherit;
          line-height: inherit;
        }
        .doctor-name-button:hover {
          color: inherit;
          opacity: 0.8;
        }
        .doctor-name-button:focus {
          outline: none;
          text-decoration: underline;
          text-decoration-color: rgba(23, 23, 23, 0.3);
        }

        .doctor-specialty {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        .appointment-time {
          text-align: right;
          flex-shrink: 0;
        }

        .date-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 2px;
        }

        .time-text {
          font-size: 0.75rem;
          color: #666;
        }

        /* Card Body */
        .card-body {
          padding: 1rem 1.5rem;
        }

        .location-info {
          margin-bottom: 1rem;
        }

        .clinic-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .clinic-address {
          font-size: 0.8rem;
          color: #666;
        }

        .additional-info {
          display: flex;
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #999;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 0.8rem;
          color: #666;
          font-weight: 400;
        }

        /* Card Footer */
        .card-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f5f5f5;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .info-button {
          flex: 1;
          padding: 0.75rem;
          background: none;
          color: #ff9500;
          border: 1px solid #ff9500;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .info-button:hover {
          background: #ff9500;
          color: white;
          transform: translateY(-1px);
        }

        .reserve-button {
          flex: 2;
          padding: 0.75rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .reserve-button:hover {
          background: #e6850a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          padding: 0;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .modal-close:hover {
          background: #f5f5f5;
        }

        .modal-body {
          padding: 1.5rem;
        }

        /* Appointment Summary */
        .appointment-summary {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .summary-avatar {
          width: 48px;
          height: 48px;
          background: #171717;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .summary-details {
          flex: 1;
          min-width: 0;
        }

        .summary-doctor {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .summary-specialty {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .summary-clinic {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .summary-datetime {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
        }

        /* Form */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .field-input:focus {
          border-color: #171717;
        }

        .field-input:disabled {
          opacity: 0.6;
          background: #f9fafb;
        }

        .field-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
          line-height: 1.4;
        }

        /* Responsive para textarea del motivo de consulta */
        @media (max-width: 768px) {
          .field-textarea {
            min-height: 70px;
            font-size: 16px; /* Evita zoom en iOS */
          }
        }

        @media (max-width: 375px) {
          .field-textarea {
            min-height: 60px;
          }
        }

        /* Terms */
        .terms-container {
          margin: 0.5rem 0;
        }

        .terms-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .terms-checkbox {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #171717;
        }

        .terms-text {
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.4;
        }

        /* Warning Notice */
        .warning-notice {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
        }

        .warning-icon {
          width: 20px;
          height: 20px;
          background: #f59e0b;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .warning-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.25rem;
        }

        .warning-text {
          font-size: 0.8rem;
          color: #92400e;
        }

        /* Submit Button */
        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #fecaca;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.5;
        }

        .error-icon {
          font-size: 1rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 0.5rem;
        }

        .submit-button:hover:not(.disabled) {
          background: #000;
        }

        .submit-button.disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .header-stats {
            display: block;
          }

          .main-layout {
            padding: 3rem 2rem;
          }

          .main-title {
            font-size: 2.5rem;
          }

          .main-subtitle {
            font-size: 1.1rem;
          }

          .filter-group {
            max-width: 250px;
          }

          .results-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
          }

          .results-grid > * {
            max-width: 500px;
          }

          .modal-overlay {
            align-items: center;
            padding: 1rem;
          }

          .modal-content {
            max-width: 500px;
            border-radius: 12px;
            animation: none;
          }

          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Responsive - Desktop */
        @media (min-width: 1024px) {
          .content-container {
            gap: 2rem;
          }

          .hero-section {
            margin-bottom: 1.5rem;
          }

          .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 1.5rem;
            justify-items: center;
            max-width: 1200px;
            margin: 0 auto;
          }

          .sobrecupo-card {
            max-width: 500px;
            width: 100%;
          }

          .card-header {
            padding: 1.25rem 1.5rem;
          }

          .card-body {
            padding: 1rem 1.5rem;
          }

          .card-footer {
            padding: 1rem 1.5rem;
          }

          .additional-info {
            gap: 1.5rem;
          }
        }

        /* Mobile Calendar Fix - All Mobile Devices */
        @media (max-width: 768px) {
          .calendar-dropdown {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: calc(100vw - 2rem) !important;
            max-width: 340px !important;
            height: auto !important;
            max-height: 80vh !important;
            z-index: 1000 !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
            border-radius: 16px !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
          
          .calendar-overlay {
            display: block !important;
            z-index: 999 !important;
            background: rgba(0, 0, 0, 0.5) !important;
          }
          
          .calendar-body {
            max-height: 50vh !important;
            overflow-y: auto !important;
          }
        }

        /* iPhone Specific Optimizations */
        @media (max-width: 480px) {
          .main-layout {
            padding: 1rem 0.75rem;
          }

          .main-title {
            font-size: 1.75rem;
            margin-bottom: 0.25rem;
          }

          .main-subtitle {
            font-size: 0.85rem;
            margin-bottom: 0;
          }

          /* Hero section más compacto */
          .hero-section {
            margin-bottom: 1.25rem;
            padding: 0 0.5rem;
          }

          /* Filtros más compactos para iPhone */
          .filters-section {
            margin-bottom: 1.25rem;
            padding: 0 0.5rem;
          }

          .filters-container {
            flex-direction: column;
            width: 100%;
            gap: 0.75rem;
            max-width: none;
          }

          .filter-group {
            min-width: auto;
            flex: none;
            width: 100%;
          }

          .filter-select {
            padding: 0.625rem 0.875rem;
            padding-right: 2.25rem;
            font-size: 0.8rem;
            border-radius: 10px;
            background-size: 0.875rem;
            background-position: right 0.625rem center;
            min-height: 44px;
            -webkit-appearance: none;
            appearance: none;
            /* iOS specific optimizations */
            -webkit-tap-highlight-color: rgba(255, 149, 0, 0.1);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }

          /* Filtro de fecha más compacto */
          .date-filter-button {
            padding: 0.625rem 0.875rem;
            font-size: 0.8rem;
            border-radius: 10px;
            min-height: 44px;
            gap: 0.375rem;
            /* iOS touch optimizations */
            -webkit-tap-highlight-color: rgba(255, 149, 0, 0.1);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            cursor: pointer;
          }

          .calendar-icon {
            width: 14px;
            height: 14px;
          }

          .clear-date-button {
            padding: 3px;
          }

          .clear-date-button svg {
            width: 10px;
            height: 10px;
          }

          /* Overlay para calendario en móvil */
          .calendar-overlay {
            display: block;
          }

          /* Calendario desplegable optimizado para iPhone */
          .calendar-dropdown {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: calc(100vw - 2rem);
            max-width: 350px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
            border-radius: 16px;
            margin: 0;
            z-index: 100;
          }

          .calendar-header {
            padding: 0.75rem;
            border-radius: 12px 12px 0 0;
          }

          .calendar-month {
            font-size: 0.8rem;
          }

          .calendar-filter-indicator {
            font-size: 0.65rem;
            padding: 0.075rem 0.25rem;
            margin-top: 0.075rem;
          }

          .calendar-nav {
            padding: 4px;
          }

          .calendar-nav svg {
            width: 14px;
            height: 14px;
          }

          .calendar-close {
            padding: 2px;
          }

          .calendar-close svg {
            width: 14px;
            height: 14px;
          }

          .calendar-body {
            padding: 0.75rem;
          }

          .calendar-weekday {
            padding: 0.375rem 0;
            font-size: 0.7rem;
          }

          .calendar-day {
            min-height: 36px;
            font-size: 0.85rem;
            padding: 0.25rem;
          }

          .sobrecupos-count {
            width: 14px;
            height: 14px;
            font-size: 0.6rem;
            bottom: 1px;
            right: 1px;
            border: 1px solid white;
          }

          .clear-filters {
            width: 100%;
            padding: 0.625rem;
            font-size: 0.8rem;
            border-radius: 10px;
            margin-top: 0.25rem;
            min-height: 44px;
            /* iOS touch optimizations */
            -webkit-tap-highlight-color: rgba(23, 23, 23, 0.1);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Tarjetas más compactas para iPhone */
          .sobrecupo-card {
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .card-header {
            padding: 0.875rem;
            border-bottom: 1px solid #f0f0f0;
          }

          .doctor-avatar {
            width: 36px;
            height: 36px;
            font-size: 0.8rem;
          }

          .doctor-name {
            font-size: 1rem;
            line-height: 1.3;
          }

          .doctor-specialty {
            font-size: 0.8rem;
            margin-bottom: 0;
          }

          .appointment-time {
            text-align: right;
          }

          .date-text {
            font-size: 0.8rem;
            font-weight: 600;
            color: #ff9500;
          }

          .time-text {
            font-size: 0.75rem;
            color: #666;
          }

          .card-body {
            padding: 0.75rem 0.875rem;
          }

          .location-info {
            margin-bottom: 0.75rem;
          }

          .clinic-name {
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 0.125rem;
          }

          .clinic-address {
            font-size: 0.75rem;
            color: #888;
          }

          .additional-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .info-item {
            gap: 0.125rem;
          }

          .info-label {
            font-size: 0.7rem;
            color: #aaa;
            font-weight: 600;
            letter-spacing: 0.3px;
          }

          .info-value {
            font-size: 0.75rem;
            color: #555;
            line-height: 1.2;
          }

          .card-footer {
            padding: 0.75rem 0.875rem;
            border-top: 1px solid #f0f0f0;
          }

          .footer-actions {
            display: flex;
            gap: 0.5rem;
          }

          .info-button {
            flex: 1;
            padding: 0.625rem 0.75rem;
            font-size: 0.8rem;
            border-radius: 12px;
            font-weight: 500;
          }

          .reserve-button {
            flex: 2;
            padding: 0.625rem 0.75rem;
            font-size: 0.8rem;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(255, 149, 0, 0.25);
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .appointment-summary {
            padding: 0.75rem;
            margin-bottom: 1.5rem;
            border-radius: 10px;
          }

          .summary-avatar {
            width: 40px;
            height: 40px;
          }

          /* Calendario móvil */
          .calendar-dropdown {
            left: -10px;
            right: -10px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          }

          .calendar-dates {
            max-height: 180px;
          }

          .calendar-date-option {
            padding: 0.875rem 1rem;
            font-size: 0.85rem;
          }
        }

        /* iPhone SE and very small devices */
        @media (max-width: 375px) {
          .main-layout {
            padding: 1rem 0.5rem;
          }

          .main-title {
            font-size: 1.5rem;
          }

          .header-content {
            height: 56px;
          }

          .back-button {
            width: 32px;
            height: 32px;
          }

          .header-title {
            font-size: 1.25rem;
          }

          /* Filtros extra compactos para pantallas pequeñas */
          .filters-container {
            gap: 0.5rem;
            padding: 0 0.25rem;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select,
          .date-filter-button {
            width: 100%;
            padding: 0.625rem 0.75rem;
            padding-right: 2rem;
            font-size: 0.8rem;
            min-height: 44px;
            border-radius: 8px;
          }

          .date-filter-button {
            gap: 0.25rem;
            padding-right: 0.75rem;
          }

          .calendar-icon {
            width: 12px;
            height: 12px;
          }

          .clear-date-button svg {
            width: 8px;
            height: 8px;
          }

          .clear-filters {
            padding: 0.5rem;
            font-size: 0.75rem;
            margin-top: 0.125rem;
          }

          /* Calendario compacto para iPhone SE */
          .calendar-dropdown {
            max-width: 300px !important;
            width: calc(100vw - 1.5rem) !important;
          }

          .calendar-header {
            padding: 0.5rem;
          }

          .calendar-month {
            font-size: 0.75rem;
          }

          .calendar-filter-indicator {
            font-size: 0.6rem;
            padding: 0.05rem 0.2rem;
            margin-top: 0.05rem;
          }

          .calendar-nav {
            padding: 3px;
          }

          .calendar-nav svg {
            width: 12px;
            height: 12px;
          }

          .calendar-close svg {
            width: 12px;
            height: 12px;
          }

          .calendar-body {
            padding: 0.5rem;
          }

          .calendar-weekday {
            padding: 0.25rem 0;
            font-size: 0.65rem;
          }

          .calendar-day {
            min-height: 32px;
            font-size: 0.8rem;
            padding: 0.125rem;
          }

          .sobrecupos-count {
            width: 12px;
            height: 12px;
            font-size: 0.55rem;
            bottom: 1px;
            right: 1px;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .doctor-specialty {
            font-size: 0.8rem;
          }
        }

        /* Landscape mode for small iPhones */
        @media (max-width: 667px) and (orientation: landscape) {
          .filters-container {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .filter-group {
            flex: 1;
            min-width: 120px;
          }

          .clear-filters {
            flex: 0 0 auto;
            width: auto;
            min-width: 80px;
            margin-top: 0;
          }

          .calendar-dropdown {
            max-height: 70vh;
            z-index: 1000;
            width: calc(100vw - 2rem);
            max-width: 350px;
            margin: 0;
          }

          .calendar-body {
            max-height: calc(70vh - 80px);
            overflow-y: auto;
          }
        }

        /* Safe area for iPhones with notch */
        @supports (padding: max(0px)) {
          .page-container {
            padding-top: max(0px, env(safe-area-inset-top));
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }

          .modal-content {
            margin-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
};

const AgendarSobrecuposPage = () => {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Helvetica Neue, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #171717',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p>Cargando sobrecupos...</p>
        </div>
      </div>
    }>
      <AgendarSobrecuposContent />
    </Suspense>
  );
};

export default AgendarSobrecuposPage;