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
    hora: '',
    clinicaId: ''
  });

  const horarios = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00"
  ];

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

    if (!newSobrecupo.fecha || !newSobrecupo.hora) {
      setMessage('❌ Fecha y hora son obligatorios');
      return;
    }

    try {
      const doctorData = session.user.doctorData;
      
      const res = await fetch('/api/sobrecupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medico: session.user.doctorId,
          especialidad: doctorData?.Especialidad || 'Sin especialidad',
          clinica: newSobrecupo.clinica || 'Consulta particular',
          direccion: newSobrecupo.direccion || 'Por definir',
          fecha: newSobrecupo.fecha,
          hora: newSobrecupo.hora
        })
      });

      if (res.ok) {
        setMessage('✅ Sobrecupo creado correctamente');
        setNewSobrecupo({
          clinica: '',
          direccion: '',
          fecha: '',
          hora: '',
          clinicaId: ''
        });
        setShowCreateForm(false);
        fetchSobrecupos();
        setTimeout(() => setMessage(''), 3000);
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

    const reservados = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      const isReserved = s.fields?.Disponible !== 'Si' && s.fields?.Disponible !== true;
      return sobrecupoDate >= today && isReserved;
    }).length;

    const antiguos = sobrecupos.filter(s => {
      const sobrecupoDate = new Date(s.fields?.Fecha);
      return sobrecupoDate < today;
    }).length;

    return { proximos, reservados, antiguos };
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
                      <label className="field-label">Hora *</label>
                      <select
                        value={newSobrecupo.hora}
                        onChange={(e) => setNewSobrecupo({...newSobrecupo, hora: e.target.value})}
                        required
                        className="field-input"
                      >
                        <option value="">Seleccionar hora</option>
                        {horarios.map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="submit-button">
                    Crear Sobrecupo
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Filtros */}
        <section className="filters-section">
          <div className="filters-container">
            {['proximos', 'reservados', 'antiguos'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
              >
                <div className="filter-content">
                  <span className="filter-label">
                    {filter === 'proximos' ? 'Próximos' : 
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
                          <div className="patient-name">{sobrecupo.fields.Nombre}</div>
                          {sobrecupo.fields?.Email && (
                            <div className="patient-contact">{sobrecupo.fields.Email}</div>
                          )}
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
          padding: 1.5rem;
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
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #fafafa;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .patient-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
        }

        .patient-contact {
          font-size: 0.75rem;
          color: #666;
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
            padding: 2rem;
          }

          .card-body {
            padding: 1.5rem 2rem 2rem;
            gap: 2rem;
          }
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .main-content {
            padding: 1.5rem 1rem;
            gap: 2rem;
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
            flex-direction: column;
            width: 100%;
          }

          .filter-button {
            justify-content: center;
          }

          .card-header {
            padding: 1rem;
          }

          .card-body {
            padding: 1rem;
            gap: 1rem;
          }

          .datetime-info {
            gap: 0.75rem;
          }

          .date-block {
            min-width: 42px;
            padding: 0.5rem;
          }

          .day {
            font-size: 1.125rem;
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

          .patient-info {
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .patient-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
          }
        }

        /* iPhone SE and very small devices */
        @media (max-width: 375px) {
          .main-title {
            font-size: 1.75rem;
          }

          .header-content {
            gap: 0.5rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .create-button {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
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