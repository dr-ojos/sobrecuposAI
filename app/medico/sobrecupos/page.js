// app/medico/sobrecupos/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SobrecuposMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [filteredSobrecupos, setFilteredSobrecupos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('proximos');
  const [newSobrecupo, setNewSobrecupo] = useState({
    clinica: '',
    direccion: '',
    fecha: '',
    horas: [], // Cambiar a array para múltiples horas
    clinicaId: ''
  });

  const horarios = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00"
  ];

  // Estado para el dropdown de horas
  const [showHorasDropdown, setShowHorasDropdown] = useState(false);

  // Funciones para manejar selección múltiple de horas
  const toggleHora = (hora) => {
    setNewSobrecupo(prev => ({
      ...prev,
      horas: prev.horas.includes(hora) 
        ? prev.horas.filter(h => h !== hora)
        : [...prev.horas, hora]
    }));
  };

  const selectAllHoras = () => {
    setNewSobrecupo(prev => ({
      ...prev,
      horas: horarios
    }));
  };

  const clearAllHoras = () => {
    setNewSobrecupo(prev => ({
      ...prev,
      horas: []
    }));
  };

  // Función para generar el texto del selector
  const getHorasDisplayText = () => {
    if (newSobrecupo.horas.length === 0) {
      return "Seleccionar horarios";
    }
    if (newSobrecupo.horas.length === 1) {
      return newSobrecupo.horas[0];
    }
    if (newSobrecupo.horas.length === horarios.length) {
      return "Todos los horarios";
    }
    return `${newSobrecupo.horas.length} horarios seleccionados`;
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchSobrecupos();
      fetchClinicas();
    }
  }, [session, status, router]);

  useEffect(() => {
    filterSobrecupos();
  }, [sobrecupos, activeFilter]);

  const fetchSobrecupos = async () => {
    try {
      const res = await fetch(`/api/sobrecupos/medicos/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const data = await res.json();
        setClinicas(data);
      }
    } catch (error) {
      console.error('Error cargando clínicas:', error);
    }
  };

  const filterSobrecupos = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = [];

    switch (activeFilter) {
      case 'proximos':
        filtered = sobrecupos.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          return sobrecupoDate >= today;
        }).sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateA - dateB;
        });
        break;

      case 'reservados':
        filtered = sobrecupos.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          const isReserved = sobrecupo.fields?.Disponible !== 'Si' && sobrecupo.fields?.Disponible !== true;
          return sobrecupoDate >= today && isReserved;
        }).sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateA - dateB;
        });
        break;

      case 'disponibles':
        filtered = sobrecupos.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          const isAvailable = sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true;
          return sobrecupoDate >= today && isAvailable;
        }).sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateA - dateB;
        });
        break;

      case 'antiguos':
        filtered = sobrecupos.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          return sobrecupoDate < today;
        }).sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateB - dateA;
        });
        break;

      default:
        filtered = sobrecupos;
    }

    setFilteredSobrecupos(filtered);
  };

  const handleCreateSobrecupo = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!newSobrecupo.fecha || newSobrecupo.horas.length === 0) {
      setMessage('❌ Fecha y al menos una hora son obligatorios');
      return;
    }

    try {
      const doctorData = session.user.doctorData;
      
      // Crear múltiples sobrecupos (uno por cada hora seleccionada)
      const creacionPromises = newSobrecupo.horas.map(hora => 
        fetch('/api/sobrecupos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medico: session.user.doctorId,
            especialidad: doctorData?.Especialidad || 'Sin especialidad',
            clinica: newSobrecupo.clinica || 'Consulta particular',
            direccion: newSobrecupo.direccion || 'Por definir',
            fecha: newSobrecupo.fecha,
            hora: hora
          })
        })
      );

      const results = await Promise.all(creacionPromises);
      const exitosos = results.filter(res => res.ok).length;
      const fallidos = results.length - exitosos;

      if (exitosos > 0) {
        setMessage(`✅ ${exitosos} sobrecupo${exitosos > 1 ? 's' : ''} creado${exitosos > 1 ? 's' : ''} correctamente${fallidos > 0 ? ` (${fallidos} fallaron)` : ''}`);
        setNewSobrecupo({
          clinica: '',
          direccion: '',
          fecha: '',
          horas: [],
          clinicaId: ''
        });
        setShowCreateForm(false);
        fetchSobrecupos();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ Error creando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const handleClinicaSelect = (e) => {
    const clinicaId = e.target.value;
    const clinica = clinicas.find(c => c.id === clinicaId);
    
    if (clinica) {
      setNewSobrecupo({
        ...newSobrecupo,
        clinicaId,
        clinica: clinica.fields?.Nombre || '',
        direccion: clinica.fields?.Direccion || ''
      });
    } else {
      setNewSobrecupo({
        ...newSobrecupo,
        clinicaId: '',
        clinica: '',
        direccion: ''
      });
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeFromNow = (dateStr, timeStr) => {
    const now = new Date();
    const appointmentDate = new Date(`${dateStr}T${timeStr}`);
    const diffMs = appointmentDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays < 7) return `En ${diffDays} días`;
    return `${Math.ceil(diffDays / 7)} semanas`;
  };

  const deleteSobrecupo = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este sobrecupo?')) return;

    try {
      const res = await fetch(`/api/sobrecupos?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage('✅ Sobrecupo eliminado');
        fetchSobrecupos();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error eliminando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const getFilterCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const proximos = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      return sobrecupoDate >= today;
    }).length;

    const disponibles = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      const isAvailable = s.fields?.Disponible === 'Si' || s.fields?.Disponible === true;
      return sobrecupoDate >= today && isAvailable;
    }).length;

    const reservados = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      const isReserved = s.fields?.Disponible !== 'Si' && s.fields?.Disponible !== true;
      return sobrecupoDate >= today && isReserved;
    }).length;

    const antiguos = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      return sobrecupoDate < today;
    }).length;

    return { proximos, disponibles, reservados, antiguos };
  };

  const counts = getFilterCounts();

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
    <div className="page-container">
      {/* Header minimalista estilo Apple */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => router.back()} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Mis Sobrecupos</h1>
              <span className="header-subtitle">Gestión</span>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="create-button"
          >
            {showCreateForm ? 'Cancelar' : 'Crear Sobrecupo'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Mensaje de estado */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="main-title">Gestiona tus sobrecupos</h2>
            <p className="main-subtitle">Crea, organiza y administra tus horarios disponibles</p>
          </div>
        </section>

        {/* Formulario de creación */}
        {showCreateForm && (
          <section className="create-section">
            <div className="create-container">
              <div className="create-card">
                <div className="card-header">
                  <h3 className="card-title">Nuevo Sobrecupo</h3>
                  <p className="card-subtitle">Completa la información para crear un nuevo horario disponible</p>
                </div>
                
                <form onSubmit={handleCreateSobrecupo} className="create-form">
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="field-label">Clínica</label>
                      <select
                        value={newSobrecupo.clinicaId}
                        onChange={handleClinicaSelect}
                        className="field-input"
                      >
                        <option value="">Seleccionar clínica</option>
                        {clinicas.map(clinica => (
                          <option key={clinica.id} value={clinica.id}>
                            {clinica.fields?.Nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-label">Fecha *</label>
                      <input
                        type="date"
                        value={newSobrecupo.fecha}
                        onChange={(e) => setNewSobrecupo({...newSobrecupo, fecha: e.target.value})}
                        required
                        className="field-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">Horarios *</label>
                      <div className="multi-select-container">
                        <div 
                          className="multi-select-input"
                          onClick={() => setShowHorasDropdown(!showHorasDropdown)}
                        >
                          <span className="multi-select-text">
                            {getHorasDisplayText()}
                          </span>
                          <svg 
                            className={`multi-select-arrow ${showHorasDropdown ? 'open' : ''}`}
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none"
                          >
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {/* Pills de horas seleccionadas */}
                        {newSobrecupo.horas.length > 0 && (
                          <div className="selected-horas-pills">
                            {newSobrecupo.horas.map(hora => (
                              <span key={hora} className="hora-pill">
                                {hora}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleHora(hora);
                                  }}
                                  className="hora-pill-remove"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Dropdown profesional */}
                        {showHorasDropdown && (
                          <div className="multi-select-dropdown">
                            <div className="dropdown-header">
                              <div className="dropdown-actions">
                                <button 
                                  type="button" 
                                  onClick={selectAllHoras}
                                  className="dropdown-action-btn"
                                >
                                  Seleccionar todos
                                </button>
                                <button 
                                  type="button" 
                                  onClick={clearAllHoras}
                                  className="dropdown-action-btn clear"
                                >
                                  Limpiar
                                </button>
                              </div>
                            </div>
                            <div className="dropdown-options">
                              {horarios.map(hora => (
                                <label key={hora} className="dropdown-option">
                                  <input
                                    type="checkbox"
                                    checked={newSobrecupo.horas.includes(hora)}
                                    onChange={() => toggleHora(hora)}
                                    className="dropdown-checkbox"
                                  />
                                  <span className="dropdown-checkmark">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                  <span className="dropdown-label">{hora}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Overlay para cerrar dropdown */}
                        {showHorasDropdown && (
                          <div 
                            className="multi-select-overlay"
                            onClick={() => setShowHorasDropdown(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="submit-button">
                    Crear {newSobrecupo.horas.length} Sobrecupo{newSobrecupo.horas.length !== 1 ? 's' : ''}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Filtros */}
        <section className="filters-section">
          <div className="filters-container">
            {['proximos', 'disponibles', 'reservados', 'antiguos'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
              >
                <div className="filter-content">
                  <span className="filter-label">
                    {filter === 'proximos' ? 'Próximos' : 
                     filter === 'disponibles' ? 'Disponibles' :
                     filter === 'reservados' ? 'Reservados' : 'Antiguos'}
                  </span>
                  <span className="filter-count">{counts[filter]}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Lista de sobrecupos */}
        <section className="results-section">
          {filteredSobrecupos.length === 0 ? (
            <div className="empty-container">
              <div className="empty-icon">
                {activeFilter === 'proximos' && '📅'}
                {activeFilter === 'reservados' && '🎯'}
                {activeFilter === 'antiguos' && '📋'}
              </div>
              <h3 className="empty-title">
                No tienes {activeFilter === 'proximos' ? 'sobrecupos próximos' : 
                          activeFilter === 'reservados' ? 'sobrecupos reservados' : 
                          'sobrecupos antiguos'}
              </h3>
              <p className="empty-text">
                {activeFilter === 'proximos' && 'Crea nuevos sobrecupos para que aparezcan aquí'}
                {activeFilter === 'reservados' && 'Los sobrecupos reservados aparecerán en esta sección'}
                {activeFilter === 'antiguos' && 'Los sobrecupos pasados se mostrarán aquí'}
              </p>
              {activeFilter === 'proximos' && (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="empty-button"
                >
                  Crear mi primer sobrecupo
                </button>
              )}
            </div>
          ) : (
            <div className="results-grid">
              {filteredSobrecupos.map((sobrecupo, index) => (
                <article key={sobrecupo.id || index} className="sobrecupo-card">
                  
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="status-info">
                      <div className={`status-badge ${
                        sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true 
                          ? 'available' : 'reserved'
                      }`}>
                        {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true 
                          ? 'Disponible' : 'Reservado'}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteSobrecupo(sobrecupo.id)}
                      className="delete-button"
                      title="Eliminar sobrecupo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Card Body */}
                  <div className="card-body">
                    <div className="datetime-info">
                      <div className="date-block">
                        <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                        <span className="month">
                          {new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="time-details">
                        <div className="time">{sobrecupo.fields?.Hora}</div>
                        <div className="relative-time">
                          {getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="location-info">
                      <div className="clinic-name">{sobrecupo.fields?.Clínica}</div>
                      <div className="clinic-address">{sobrecupo.fields?.Dirección}</div>
                    </div>
                    
                    {sobrecupo.fields?.Nombre && (
                      <div className="patient-info">
                        <div className="patient-avatar">
                          <span>{sobrecupo.fields.Nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        </div>
                        <div className="patient-details">
                          <div className="patient-header">
                            <div className="patient-name">{sobrecupo.fields.Nombre}</div>
                            {sobrecupo.fields?.Edad && (
                              <div className="patient-age">{sobrecupo.fields.Edad} años</div>
                            )}
                          </div>
                          
                          {sobrecupo.fields?.['Motivo Consulta'] && (
                            <div className="patient-reason">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M9 11H3a1 1 0 00-1 1v3c0 1.66 1.34 3 3 3h1m4-6h7a1 1 0 011 1v3c0 1.66-1.34 3-3 3h-1m-4-6V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4m-8 0V7c0-1.66-1.34-3-3-3S5 5.34 5 7v4" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>{sobrecupo.fields['Motivo Consulta']}</span>
                            </div>
                          )}

                          <div className="patient-contacts">
                            {sobrecupo.fields?.Email && (
                              <div className="patient-contact">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                {sobrecupo.fields.Email}
                              </div>
                            )}
                            {sobrecupo.fields?.Telefono && (
                              <div className="patient-contact">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                {sobrecupo.fields.Telefono}
                              </div>
                            )}
                          </div>
                          <div className="confirmed-badge">Confirmado</div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
        }

        /* Header */
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

        .create-button {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .create-button:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        /* Mensaje */
        .message {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
        }

        .message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .main-title {
          font-size: 2.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 1rem 0;
          letter-spacing: -1px;
        }

        .main-subtitle {
          font-size: 1.1rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        /* Create Section */
        .create-section {
          display: flex;
          justify-content: center;
        }

        .create-container {
          width: 100%;
          max-width: 600px;
        }

        .create-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .card-subtitle {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .create-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
          background: white;
        }

        .field-input:focus {
          border-color: #ff9500;
          box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1);
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .submit-button:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        /* Multi-Select Profesional */
        .multi-select-container {
          position: relative;
        }

        .multi-select-input {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .multi-select-input:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .multi-select-input:focus-within {
          border-color: #ff9500;
          box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1);
        }

        .multi-select-text {
          color: #374151;
          font-size: 0.875rem;
          flex: 1;
        }

        .multi-select-arrow {
          color: #9ca3af;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .multi-select-arrow.open {
          transform: rotate(180deg);
        }

        .selected-horas-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .hora-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(255, 149, 0, 0.3);
        }

        .hora-pill-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.125rem;
          line-height: 1;
          padding: 0;
          margin-left: 0.125rem;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .hora-pill-remove:hover {
          opacity: 1;
        }

        .multi-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin-top: 0.25rem;
          overflow: hidden;
          animation: dropdownSlideIn 0.2s ease-out;
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
        }

        .dropdown-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .dropdown-action-btn {
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          min-width: 80px;
          text-align: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .dropdown-action-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dropdown-action-btn.clear {
          color: #dc2626;
          border-color: #f87171;
          background: #fef2f2;
        }

        .dropdown-action-btn.clear:hover {
          background: #fecaca;
          border-color: #ef4444;
          color: #b91c1c;
        }

        .dropdown-options {
          max-height: 240px;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .dropdown-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
          min-height: 48px;
        }

        .dropdown-option:hover {
          background: #f8fafc;
          padding-left: 1.5rem;
        }

        .dropdown-option:last-child {
          border-bottom: none;
        }

        .dropdown-checkbox {
          display: none;
        }

        .dropdown-checkmark {
          width: 22px;
          height: 22px;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: white;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .dropdown-option:hover .dropdown-checkmark {
          border-color: #ff9500;
          box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1);
        }

        .dropdown-checkbox:checked + .dropdown-checkmark {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          border-color: #ff9500;
          color: white;
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
        }

        .dropdown-checkbox:checked + .dropdown-checkmark svg {
          opacity: 1;
          transform: scale(1.1);
        }

        .dropdown-checkmark svg {
          opacity: 0;
          transition: all 0.2s ease;
          transform: scale(0.8);
        }

        .dropdown-label {
          font-size: 1rem;
          color: #1f2937;
          font-weight: 600;
          user-select: none;
          letter-spacing: 0.025em;
        }

        .multi-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        @media (max-width: 768px) {
          .selected-horas-pills {
            gap: 0.375rem;
          }

          .hora-pill {
            padding: 0.3125rem 0.625rem;
            font-size: 0.75rem;
          }

          .dropdown-header {
            padding: 1rem;
          }

          .dropdown-actions {
            flex-direction: row;
            gap: 0.5rem;
            justify-content: space-between;
          }

          .dropdown-action-btn {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            flex: 1;
            min-width: auto;
          }

          .dropdown-option {
            padding: 1rem 1.25rem;
            min-height: 52px;
          }

          .dropdown-option:hover {
            padding-left: 1.25rem;
          }

          .dropdown-checkmark {
            width: 24px;
            height: 24px;
          }

          .dropdown-label {
            font-size: 1.0625rem;
          }

          .dropdown-options {
            max-height: 280px;
          }
        }

        /* Filters */
        .filters-section {
          display: flex;
          justify-content: center;
        }

        .filters-container {
          display: flex;
          gap: 1rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .filter-button {
          background: none;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          font-weight: 500;
          color: #666;
        }

        .filter-button:hover {
          background: #f5f5f5;
          color: #171717;
        }

        .filter-button.active {
          background: #171717;
          color: white;
        }

        .filter-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.875rem;
        }

        .filter-count {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .filter-button:not(.active) .filter-count {
          background: #f5f5f5;
          color: #666;
        }

        /* Results Section */
        .results-section {
          min-height: 400px;
        }

        /* Empty State */
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 2rem;
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

        .empty-button {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
        }

        .empty-button:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        /* Results Grid */
        .results-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
          place-items: center;
        }

        @media (max-width: 768px) {
          .results-grid {
            gap: 1rem;
          }
        }

        .results-grid > * {
          width: 100%;
          max-width: 600px;
        }

        /* Sobrecupo Card */
        .sobrecupo-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .status-info {
          flex: 1;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
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

        .delete-button {
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
          color: #666;
        }

        .delete-button:hover {
          border-color: #dc2626;
          background: #fef2f2;
          color: #dc2626;
        }

        .card-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .datetime-info {
          display: flex;
          align-items: center;
          gap: 1rem;
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

        .location-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .clinic-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
        }

        .clinic-address {
          font-size: 0.8rem;
          color: #666;
        }

        .patient-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.625rem;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
          min-width: 0;
        }

        .patient-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .patient-name {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
        }

        .patient-age {
          font-size: 0.75rem;
          color: #666;
          background: #f0f4ff;
          padding: 0.125rem 0.375rem;
          border-radius: 6px;
          font-weight: 500;
        }

        .patient-reason {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #171717;
          background: #fef9e7;
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(251, 191, 36, 0.2);
          line-height: 1.3;
        }

        .patient-reason svg {
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .patient-reason span {
          flex: 1;
          font-weight: 500;
        }

        .patient-contacts {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .patient-contact {
          font-size: 0.6875rem;
          color: #666;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .patient-contact svg {
          color: #999;
          flex-shrink: 0;
        }

        .confirmed-badge {
          background: #f0fff4;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 500;
          border: 1px solid rgba(52, 199, 89, 0.1);
          width: fit-content;
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .header {
            padding: 1rem 2rem;
          }

          .main-content {
            padding: 3rem 2rem;
          }

          .main-title {
            font-size: 3rem;
          }

          .main-subtitle {
            font-size: 1.2rem;
          }

          .form-grid {
            grid-template-columns: repeat(3, 1fr);
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
        }

        /* Responsive - Desktop */
        @media (min-width: 1024px) {
          .main-content {
            gap: 4rem;
          }

          .results-grid {
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2.5rem;
            max-width: 1200px;
          }

          .results-grid > * {
            max-width: 600px;
          }

          .card-header {
            padding: 1.25rem 1.5rem;
          }

          .card-body {
            padding: 1.5rem;
            gap: 1.25rem;
          }
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .header-left {
            align-self: flex-start;
          }

          .create-button {
            align-self: stretch;
            text-align: center;
          }

          .main-content {
            padding: 1rem;
            gap: 1.5rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .main-subtitle {
            font-size: 1rem;
          }

          .create-card {
            padding: 1.5rem;
          }

          .filters-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            width: 100%;
            padding: 0.375rem;
          }

          .filter-button {
            justify-content: center;
            padding: 0.625rem 1rem;
            font-size: 0.8125rem;
          }

          .filter-label {
            font-size: 0.8125rem;
          }

          .filter-count {
            font-size: 0.6875rem;
            padding: 0.1875rem 0.375rem;
          }

          .card-header {
            padding: 0.75rem;
          }

          .card-body {
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .datetime-info {
            gap: 0.5rem;
          }

          .date-block {
            min-width: 36px;
            padding: 0.375rem;
          }

          .day {
            font-size: 1rem;
          }

          .month {
            font-size: 0.5rem;
          }

          .time {
            font-size: 0.875rem;
          }

          .relative-time {
            font-size: 0.625rem;
          }

          .patient-info {
            padding: 0.5rem;
            gap: 0.5rem;
          }

          .patient-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.6875rem;
          }

          .clinic-name {
            font-size: 0.75rem;
          }

          .clinic-address {
            font-size: 0.6875rem;
          }

          .patient-contact {
            font-size: 0.625rem;
          }

          .patient-age {
            font-size: 0.6875rem;
            padding: 0.1rem 0.25rem;
          }

          .patient-reason {
            font-size: 0.6875rem;
            padding: 0.25rem 0.375rem;
          }
        }

        /* iPhone SE and very small devices */
        @media (max-width: 375px) {
          .main-title {
            font-size: 1.75rem;
          }

          .header-content {
            gap: 0.75rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .create-button {
            padding: 0.625rem 1rem;
            font-size: 0.8125rem;
          }

          .card-header,
          .card-body {
            padding: 0.625rem;
          }

          .date-block {
            min-width: 32px;
            padding: 0.25rem;
          }

          .day {
            font-size: 0.875rem;
          }

          .time {
            font-size: 0.8125rem;
          }

          .patient-info {
            padding: 0.375rem;
          }

          .patient-avatar {
            width: 24px;
            height: 24px;
            font-size: 0.625rem;
          }
        }

        /* Estados de foco */
        .back-button:focus,
        .create-button:focus,
        .filter-button:focus,
        .delete-button:focus,
        .submit-button:focus,
        .empty-button:focus,
        .field-input:focus {
          outline: 2px solid #ff9500;
          outline-offset: 2px;
        }

        /* Modo de Alto Contraste */
        @media (prefers-contrast: high) {
          .page-container {
            background: #ffffff;
          }

          .sobrecupo-card,
          .create-card,
          .empty-container {
            border-color: #000000;
            background: #ffffff;
          }

          .main-title,
          .card-title,
          .empty-title {
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

        /* Safe area for iPhones with notch */
        @supports (padding: max(0px)) {
          .page-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}