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
  const [activeFilter, setActiveFilter] = useState('proximos'); // 'proximos', 'reservados', 'antiguos'
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

  // Aplicar filtros cuando cambian los datos o el filtro activo
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

  // Función para filtrar sobrecupos
  const filterSobrecupos = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = [];

    switch (activeFilter) {
      case 'proximos':
        // Sobrecupos futuros (desde hoy)
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
        // Sobrecupos reservados desde hoy en adelante
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
        // Sobrecupos pasados
        filtered = sobrecupos.filter(sobrecupo => {
          const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
          return sobrecupoDate < today;
        }).sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateB - dateA; // Más recientes primero para antiguos
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

  // Contar sobrecupos por categoría
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
          <div className="loading-spinner"></div>
          <p>Cargando sobrecupos...</p>
        </div>
        <style jsx>{`
          .loading-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
          }
          .loading-content {
            text-align: center;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(0, 122, 255, 0.1);
            border-left: 4px solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="sobrecupos-container">
      {/* Header */}
      <div className="sobrecupos-header">
        <button onClick={() => router.back()} className="back-btn">
          <span className="back-icon">←</span>
          Volver
        </button>
        <h1 className="page-title">Mis Sobrecupos</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="create-btn"
        >
          {showCreateForm ? (
            <>
              <span className="btn-icon">✕</span>
              Cancelar
            </>
          ) : (
            <>
              <span className="btn-icon">+</span>
              Crear
            </>
          )}
        </button>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="create-form-container">
          <div className="form-card">
            <div className="form-header">
              <h3 className="form-title">
                <span className="form-icon">✨</span>
                Crear Nuevo Sobrecupo
              </h3>
            </div>
            
            <form onSubmit={handleCreateSobrecupo} className="sobrecupo-form">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">📍 Clínica</label>
                  <select
                    value={newSobrecupo.clinicaId}
                    onChange={handleClinicaSelect}
                    className="form-select"
                  >
                    <option value="">Seleccionar clínica</option>
                    {clinicas.map(clinica => (
                      <option key={clinica.id} value={clinica.id}>
                        {clinica.fields?.Nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">📅 Fecha</label>
                  <input
                    type="date"
                    value={newSobrecupo.fecha}
                    onChange={(e) => setNewSobrecupo({...newSobrecupo, fecha: e.target.value})}
                    required
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">🕐 Hora</label>
                  <select
                    value={newSobrecupo.hora}
                    onChange={(e) => setNewSobrecupo({...newSobrecupo, hora: e.target.value})}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar hora</option>
                    {horarios.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  <span className="btn-icon">✓</span>
                  Crear Sobrecupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <h2 className="filters-title">
            <span className="title-icon">🔍</span>
            Filtrar Sobrecupos
          </h2>
        </div>
        
        <div className="filter-buttons">
          <button
            onClick={() => setActiveFilter('proximos')}
            className={`filter-btn ${activeFilter === 'proximos' ? 'active' : ''}`}
          >
            <span className="filter-icon">📅</span>
            <div className="filter-content">
              <span className="filter-label">Próximos</span>
              <span className="filter-count">{counts.proximos}</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveFilter('reservados')}
            className={`filter-btn ${activeFilter === 'reservados' ? 'active' : ''}`}
          >
            <span className="filter-icon">🎯</span>
            <div className="filter-content">
              <span className="filter-label">Reservados</span>
              <span className="filter-count">{counts.reservados}</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveFilter('antiguos')}
            className={`filter-btn ${activeFilter === 'antiguos' ? 'active' : ''}`}
          >
            <span className="filter-icon">📋</span>
            <div className="filter-content">
              <span className="filter-label">Antiguos</span>
              <span className="filter-count">{counts.antiguos}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Lista de sobrecupos */}
      <div className="sobrecupos-content">
        {filteredSobrecupos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-container">
              <span className="empty-icon">
                {activeFilter === 'proximos' && '📅'}
                {activeFilter === 'reservados' && '🎯'}
                {activeFilter === 'antiguos' && '📋'}
              </span>
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
                className="empty-action"
              >
                <span className="btn-icon">+</span>
                Crear mi primer sobrecupo
              </button>
            )}
          </div>
        ) : (
          <div className="sobrecupos-grid">
            {filteredSobrecupos.map((sobrecupo, index) => (
              <div key={sobrecupo.id || index} className="sobrecupo-card">
                <div className="card-header">
                  <div className="card-status">
                    <div className={`status-badge ${
                      sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true 
                        ? 'available' : 'reserved'
                    }`}>
                      {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true 
                        ? '✅ Disponible' : '🗓️ Reservado'}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => deleteSobrecupo(sobrecupo.id)}
                    className="delete-btn"
                    title="Eliminar sobrecupo"
                  >
                    <span className="delete-icon">🗑️</span>
                  </button>
                </div>
                
                <div className="card-content">
                  <div className="datetime-container">
                    <div className="date-block">
                      <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                      <span className="month">
                        {new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="time-info">
                      <div className="time">{sobrecupo.fields?.Hora}</div>
                      <div className="relative-time">
                        {getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="location-info">
                    <div className="clinic-info">
                      <span className="location-icon">📍</span>
                      <span className="clinic-name">{sobrecupo.fields?.Clínica}</span>
                    </div>
                    <div className="address-info">
                      {sobrecupo.fields?.Dirección}
                    </div>
                  </div>
                  
                  {sobrecupo.fields?.Nombre && (
                    <div className="patient-info">
                      <div className="patient-avatar">
                        <span>{sobrecupo.fields.Nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div className="patient-details">
                        <div className="patient-name">👤 {sobrecupo.fields.Nombre}</div>
                        {sobrecupo.fields?.Email && (
                          <div className="patient-contact">📧 {sobrecupo.fields.Email}</div>
                        )}
                        <div className="confirmed-badge">✓ Confirmado</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sobrecupos-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          color: #1d1d1f;
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Header */
        .sobrecupos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #007aff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(0, 122, 255, 0.08);
        }

        .back-icon {
          font-size: 1.1rem;
        }

        .page-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #34c759, #30d158);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.5rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
        }

        .create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
        }

        .btn-icon {
          font-size: 0.9rem;
        }

        /* Mensaje */
        .message {
          margin: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
        }

        .message.success {
          background: #e8f8ec;
          color: #1d7040;
          border: 1px solid rgba(52, 199, 89, 0.3);
        }

        .message.error {
          background: #ffe8e8;
          color: #d70015;
          border: 1px solid rgba(255, 59, 48, 0.3);
        }

        /* Formulario de creación */
        .create-form-container {
          padding: 0 1rem 1rem;
        }

        .form-card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .form-header {
          padding: 1rem;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
        }

        .form-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .form-icon {
          font-size: 1.1rem;
        }

        .sobrecupo-form {
          padding: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #6e6e73;
        }

        .form-input,
        .form-select {
          padding: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-actions {
          margin-top: 1.5rem;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.875rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
        }

        /* Filtros */
        .filters-container {
          padding: 1rem;
        }

        .filters-header {
          margin-bottom: 1rem;
        }

        .filters-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
        }

        .title-icon {
          font-size: 1rem;
        }

        .filter-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .filter-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 0.875rem 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }

        .filter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border-color: rgba(0, 122, 255, 0.3);
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .filter-icon {
          font-size: 1.2rem;
        }

        .filter-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .filter-label {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .filter-count {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-weight: 700;
        }

        .filter-btn.active .filter-count {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Contenido principal */
        .sobrecupos-content {
          padding: 0 1rem 2rem;
        }

        /* Estado vacío */
        .empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .empty-icon-container {
          margin-bottom: 1.5rem;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.6;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .empty-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          color: #1d1d1f;
        }

        .empty-text {
          color: #6e6e73;
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .empty-action {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
        }

        /* Grid de sobrecupos */
        .sobrecupos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .sobrecupos-grid {
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          }
        }

        /* Cards de sobrecupos */
        .sobrecupo-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 122, 255, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1rem 0.5rem;
        }

        .card-status {
          flex: 1;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.6rem;
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

        .delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #f5f5f7;
          color: #8e8e93;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.8rem;
        }

        .delete-btn:hover {
          background: #e8e8ed;
          color: #6e6e73;
          transform: scale(1.05);
        }

        .delete-icon {
          font-size: 0.9rem;
        }

        .card-content {
          padding: 0.5rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .datetime-container {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 12px;
          padding: 0.5rem;
          min-width: 48px;
          color: white;
          flex-shrink: 0;
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

        .time-info {
          flex: 1;
        }

        .time {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1d1d1f;
          line-height: 1.2;
        }

        .relative-time {
          font-size: 0.75rem;
          color: #6e6e73;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .location-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
          font-size: 0.9rem;
          color: #1d1d1f;
          font-weight: 600;
          flex: 1;
        }

        .address-info {
          font-size: 0.8rem;
          color: #6e6e73;
          margin-left: 1.35rem;
          line-height: 1.3;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .patient-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #af52de, #bf5af2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 0.85rem;
          color: #1d1d1f;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .patient-contact {
          font-size: 0.75rem;
          color: #6e6e73;
          margin-bottom: 0.5rem;
        }

        .confirmed-badge {
          display: inline-flex;
          align-items: center;
          background: #e8f8ec;
          color: #1d7040;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid rgba(52, 199, 89, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sobrecupos-header {
            padding: 0.75rem;
          }

          .page-title {
            font-size: 1.1rem;
          }

          .create-btn {
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
          }

          .filters-container {
            padding: 0.75rem;
          }

          .filter-buttons {
            gap: 0.5rem;
          }

          .filter-btn {
            padding: 0.75rem 0.4rem;
          }

          .filter-icon {
            font-size: 1.1rem;
          }

          .filter-label {
            font-size: 0.75rem;
          }

          .filter-count {
            font-size: 0.65rem;
            padding: 0.15rem 0.4rem;
          }

          .sobrecupos-content {
            padding: 0 0.75rem 1.5rem;
          }

          .sobrecupos-grid {
            gap: 0.75rem;
          }

          .card-header {
            padding: 0.875rem 0.875rem 0.5rem;
          }

          .card-content {
            padding: 0.5rem 0.875rem 0.875rem;
            gap: 0.75rem;
          }

          .datetime-container {
            gap: 0.75rem;
          }

          .date-block {
            min-width: 44px;
            padding: 0.4rem;
          }

          .day {
            font-size: 1rem;
          }

          .month {
            font-size: 0.55rem;
          }

          .time {
            font-size: 1rem;
          }

          .relative-time {
            font-size: 0.7rem;
          }

          .clinic-name {
            font-size: 0.85rem;
          }

          .address-info {
            font-size: 0.75rem;
          }

          .patient-info {
            padding: 0.625rem;
            gap: 0.625rem;
          }

          .patient-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.65rem;
          }

          .patient-name {
            font-size: 0.8rem;
          }

          .patient-contact {
            font-size: 0.7rem;
          }

          .confirmed-badge {
            padding: 0.15rem 0.4rem;
            font-size: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .filter-buttons {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .filter-btn {
            flex-direction: row;
            justify-content: flex-start;
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .filter-content {
            flex-direction: row;
            align-items: center;
            gap: 0.5rem;
          }
        }

        /* Accesibilidad */
        .back-btn:focus,
        .create-btn:focus,
        .filter-btn:focus,
        .delete-btn:focus,
        .submit-btn:focus,
        .empty-action:focus {
          outline: 2px solid #007aff;
          outline-offset: 2px;
        }

        /* Animaciones */
        .sobrecupo-card {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Modo contraste alto */
        @media (prefers-contrast: high) {
          .sobrecupos-container {
            background: #ffffff;
          }

          .sobrecupo-card,
          .form-card,
          .empty-state {
            border-color: #000000;
          }

          .page-title,
          .filters-title,
          .empty-title {
            color: #000000;
          }
        }

        /* Reducir movimiento */
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