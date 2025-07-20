'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SobrecuposAdminPanel = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [message, setMessage] = useState('');

  // Estados para formularios
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showClinicaForm, setShowClinicaForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formulario de médico
  const [doctorForm, setDoctorForm] = useState({
    Name: '',
    Especialidad: '',
    WhatsApp: '',
    Email: '',
    Atiende: '',
    Seguros: [],
    Clinicas: []
  });

  // Formulario de clínica
  const [clinicaForm, setClinicaForm] = useState({
    Nombre: '',
    Direccion: '',
    Comuna: '',
    Telefono: ''
  });

  const especialidades = [
    'Oftalmología', 'Medicina Familiar', 'Dermatología', 'Pediatría',
    'Otorrinolaringología', 'Neurología', 'Cardiología', 'Ginecología'
  ];

  const opcionesAtiende = ['Adultos', 'Niños', 'Ambos'];
  const opcionesSeguros = ['Fonasa', 'Isapres', 'Particular'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDoctors(), fetchClinicas(), fetchSobrecupos()]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando médicos:', error);
      setDoctors([]);
    }
  };

  const fetchClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      const data = await res.json();
      setClinicas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando clínicas:', error);
      setClinicas([]);
    }
  };

  const fetchSobrecupos = async () => {
    try {
      const res = await fetch('/api/sobrecupos');
      const data = await res.json();
      setSobrecupos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
      setSobrecupos([]);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? JSON.stringify({ id: editingItem.id, ...doctorForm })
        : JSON.stringify(doctorForm);

      const res = await fetch('/api/doctors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        await fetchDoctors();
        setShowDoctorForm(false);
        setEditingItem(null);
        setDoctorForm({
          Name: '',
          Especialidad: '',
          WhatsApp: '',
          Email: '',
          Atiende: '',
          Seguros: [],
          Clinicas: []
        });
        setMessage('✅ Médico guardado exitosamente');
      } else {
        setMessage('❌ Error guardando médico');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleClinicaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? JSON.stringify({ id: editingItem.id, ...clinicaForm })
        : JSON.stringify(clinicaForm);

      const res = await fetch('/api/clinicas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        await fetchClinicas();
        setShowClinicaForm(false);
        setEditingItem(null);
        setClinicaForm({
          Nombre: '',
          Direccion: '',
          Comuna: '',
          Telefono: ''
        });
        setMessage('✅ Clínica guardada exitosamente');
      } else {
        setMessage('❌ Error guardando clínica');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    try {
      const res = await fetch(`/api/${type}s?id=${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        if (type === 'doctor') await fetchDoctors();
        else if (type === 'clinica') await fetchClinicas();
        else if (type === 'sobrecupo') await fetchSobrecupos();
        
        setMessage('✅ Elemento eliminado exitosamente');
      } else {
        setMessage('❌ Error eliminando elemento');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (type, item) => {
    setEditingItem(item);
    
    if (type === 'doctor') {
      setDoctorForm(item.fields || item);
      setShowDoctorForm(true);
    } else if (type === 'clinica') {
      setClinicaForm(item.fields || item);
      setShowClinicaForm(true);
    }
  };

  const StatCard = ({ title, value, icon, trend, color = "blue" }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-content">
        <div className="stat-header">
          <h3 className="stat-title">{title}</h3>
          <div className="stat-icon">{icon}</div>
        </div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className="stat-trend">
            <span>📈 {trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const DashboardContent = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Panel de Administración</h1>
        <p className="dashboard-subtitle">Gestiona médicos, clínicas y sobrecupos</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Médicos Registrados"
          value={doctors.length}
          icon="👨‍⚕️"
          trend="+12% este mes"
          color="blue"
        />
        <StatCard
          title="Clínicas Activas"
          value={clinicas.length}
          icon="🏥"
          trend="+8% este mes"
          color="green"
        />
        <StatCard
          title="Sobrecupos Creados"
          value={sobrecupos.length}
          icon="📅"
          trend="+25% esta semana"
          color="purple"
        />
        <StatCard
          title="Reservas Pendientes"
          value="12"
          icon="⏳"
          color="orange"
        />
      </div>

      <div className="recent-activity">
        <h2 className="section-title">Actividad Reciente</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">👨‍⚕️</div>
            <div className="activity-content">
              <p className="activity-text">Nuevo médico registrado</p>
              <p className="activity-time">Hace 2 horas</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🏥</div>
            <div className="activity-content">
              <p className="activity-text">Clínica actualizada</p>
              <p className="activity-time">Hace 1 día</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <p className="activity-text">15 sobrecupos reservados</p>
              <p className="activity-time">Hace 3 horas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DoctorsContent = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Médicos</h2>
        <button 
          className="primary-button"
          onClick={() => setShowDoctorForm(true)}
        >
          ➕ Agregar Médico
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar médicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas las especialidades</option>
          {especialidades.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>
      </div>

      <div className="items-grid">
        {doctors
          .filter(doctor => {
            const fields = doctor.fields || doctor;
            const matchesSearch = fields.Name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' || fields.Especialidad === selectedFilter;
            return matchesSearch && matchesFilter;
          })
          .map(doctor => {
            const fields = doctor.fields || doctor;
            return (
              <div key={doctor.id} className="item-card">
                <div className="item-header">
                  <div className="item-avatar">
                    {fields.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                  </div>
                  <div className="item-info">
                    <h3 className="item-title">Dr. {fields.Name}</h3>
                    <p className="item-subtitle">{fields.Especialidad}</p>
                    <p className="item-detail">Atiende: {fields.Atiende}</p>
                  </div>
                  <div className="item-actions">
                    <button
                      className="action-button edit"
                      onClick={() => handleEdit('doctor', doctor)}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDelete('doctor', doctor.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="item-details">
                  <p><strong>Email:</strong> {fields.Email}</p>
                  <p><strong>WhatsApp:</strong> {fields.WhatsApp}</p>
                  <p><strong>Seguros:</strong> {fields.Seguros?.join(', ') || 'No especificado'}</p>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const ClinicasContent = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Clínicas</h2>
        <button 
          className="primary-button"
          onClick={() => setShowClinicaForm(true)}
        >
          ➕ Agregar Clínica
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar clínicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="items-grid">
        {clinicas
          .filter(clinica => {
            const fields = clinica.fields || clinica;
            return fields.Nombre?.toLowerCase().includes(searchTerm.toLowerCase());
          })
          .map(clinica => {
            const fields = clinica.fields || clinica;
            return (
              <div key={clinica.id} className="item-card">
                <div className="item-header">
                  <div className="item-avatar clinic">🏥</div>
                  <div className="item-info">
                    <h3 className="item-title">{fields.Nombre}</h3>
                    <p className="item-subtitle">{fields.Comuna}</p>
                    <p className="item-detail">{fields.Direccion}</p>
                  </div>
                  <div className="item-actions">
                    <button
                      className="action-button edit"
                      onClick={() => handleEdit('clinica', clinica)}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDelete('clinica', clinica.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="item-details">
                  <p><strong>Teléfono:</strong> {fields.Telefono || 'No especificado'}</p>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const SobrecuposContent = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Sobrecupos</h2>
        <button 
          className="primary-button"
          onClick={() => router.push('/admin')}
        >
          ➕ Crear Sobrecupo
        </button>
      </div>

      <div className="sobrecupos-list">
        {sobrecupos.map(sobrecupo => {
          const fields = sobrecupo.fields || sobrecupo;
          return (
            <div key={sobrecupo.id} className="sobrecupo-item">
              <div className="sobrecupo-info">
                <h3 className="sobrecupo-doctor">{fields.MedicoNombre || 'Dr. Desconocido'}</h3>
                <p className="sobrecupo-specialty">{fields.Especialidad}</p>
                <p className="sobrecupo-datetime">
                  📅 {fields.Fecha} • 🕐 {fields.Hora}
                </p>
                <p className="sobrecupo-location">📍 {fields.Clínica}</p>
              </div>
              <div className="sobrecupo-status">
                <span className="status-badge disponible">
                  {fields.Estado || 'Disponible'}
                </span>
              </div>
              <button
                className="action-button delete"
                onClick={() => handleDelete('sobrecupo', sobrecupo.id)}
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DoctorForm = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{editingItem ? 'Editar Médico' : 'Agregar Médico'}</h2>
          <button 
            className="close-button"
            onClick={() => {
              setShowDoctorForm(false);
              setEditingItem(null);
            }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleDoctorSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={doctorForm.Name}
              onChange={(e) => setDoctorForm({...doctorForm, Name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Especialidad</label>
            <select
              value={doctorForm.Especialidad}
              onChange={(e) => setDoctorForm({...doctorForm, Especialidad: e.target.value})}
              required
            >
              <option value="">Seleccionar especialidad</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>WhatsApp</label>
            <input
              type="tel"
              value={doctorForm.WhatsApp}
              onChange={(e) => setDoctorForm({...doctorForm, WhatsApp: e.target.value})}
              placeholder="+56912345678"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={doctorForm.Email}
              onChange={(e) => setDoctorForm({...doctorForm, Email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Atiende</label>
            <select
              value={doctorForm.Atiende}
              onChange={(e) => setDoctorForm({...doctorForm, Atiende: e.target.value})}
              required
            >
              <option value="">Seleccionar</option>
              {opcionesAtiende.map(opcion => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Seguros</label>
            <div className="checkbox-group">
              {opcionesSeguros.map(seguro => (
                <label key={seguro} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={doctorForm.Seguros?.includes(seguro)}
                    onChange={(e) => {
                      const seguros = doctorForm.Seguros || [];
                      if (e.target.checked) {
                        setDoctorForm({...doctorForm, Seguros: [...seguros, seguro]});
                      } else {
                        setDoctorForm({...doctorForm, Seguros: seguros.filter(s => s !== seguro)});
                      }
                    }}
                  />
                  {seguro}
                </label>
              ))}
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setShowDoctorForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ClinicaForm = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{editingItem ? 'Editar Clínica' : 'Agregar Clínica'}</h2>
          <button 
            className="close-button"
            onClick={() => {
              setShowClinicaForm(false);
              setEditingItem(null);
            }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleClinicaSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre de la Clínica</label>
            <input
              type="text"
              value={clinicaForm.Nombre}
              onChange={(e) => setClinicaForm({...clinicaForm, Nombre: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              value={clinicaForm.Direccion}
              onChange={(e) => setClinicaForm({...clinicaForm, Direccion: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Comuna</label>
            <input
              type="text"
              value={clinicaForm.Comuna}
              onChange={(e) => setClinicaForm({...clinicaForm, Comuna: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={clinicaForm.Telefono}
              onChange={(e) => setClinicaForm({...clinicaForm, Telefono: e.target.value})}
              placeholder="+56223456789"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setShowClinicaForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      {/* Header móvil */}
      <div className="mobile-header">
        <button onClick={() => router.back()} className="back-button">
          ← Volver
        </button>
        <div className="header-title">
          <span className="header-icon">🩺</span>
          <span>Admin Panel</span>
        </div>
        <div className="header-spacer"></div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🩺</div>
            <span className="logo-text">Sobrecupos Admin</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          
          <button
            className={`nav-item ${activeSection === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveSection('doctors')}
          >
            <span className="nav-icon">👨‍⚕️</span>
            <span>Médicos</span>
            <span className="nav-badge">{doctors.length}</span>
          </button>
          
          <button
            className={`nav-item ${activeSection === 'clinicas' ? 'active' : ''}`}
            onClick={() => setActiveSection('clinicas')}
          >
            <span className="nav-icon">🏥</span>
            <span>Clínicas</span>
            <span className="nav-badge">{clinicas.length}</span>
          </button>
          
          <button
            className={`nav-item ${activeSection === 'sobrecupos' ? 'active' : ''}`}
            onClick={() => setActiveSection('sobrecupos')}
          >
            <span className="nav-icon">📅</span>
            <span>Sobrecupos</span>
            <span className="nav-badge">{sobrecupos.length}</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeSection === 'dashboard' && <DashboardContent />}
        {activeSection === 'doctors' && <DoctorsContent />}
        {activeSection === 'clinicas' && <ClinicasContent />}
        {activeSection === 'sobrecupos' && <SobrecuposContent />}
      </div>

      {/* Modales */}
      {showDoctorForm && <DoctorForm />}
      {showClinicaForm && <ClinicaForm />}

      <style jsx>{`
        .admin-panel {
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .header-icon {
          font-size: 20px;
        }

        .header-spacer {
          width: 64px;
        }

        .message {
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .message.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          position: fixed;
          height: calc(100vh - 57px);
          top: 57px;
          overflow-y: auto;
          z-index: 50;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .sidebar-nav {
          padding: 16px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 4px;
          border: none;
          background: none;
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .nav-item:hover {
          background: #f1f5f9;
          color: #3b82f6;
        }

        .nav-item.active {
          background: #dbeafe;
          color: #3b82f6;
          font-weight: 600;
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-badge {
          margin-left: auto;
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .main-content {
          margin-left: 280px;
          margin-top: 57px;
          padding: 24px;
          min-height: calc(100vh - 57px);
        }

        .dashboard-content {
          max-width: 1200px;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .dashboard-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-card-blue {
          border-left: 4px solid #3b82f6;
        }

        .stat-card-green {
          border-left: 4px solid #10b981;
        }

        .stat-card-purple {
          border-left: 4px solid #8b5cf6;
        }

        .stat-card-orange {
          border-left: 4px solid #f59e0b;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .stat-title {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin: 0;
        }

        .stat-icon {
          font-size: 24px;
          opacity: 0.7;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }

        .recent-activity {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          background: #dbeafe;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-text {
          font-size: 14px;
          color: #1e293b;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .activity-time {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .content-section {
          max-width: 1200px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .primary-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .secondary-button {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .filters-section {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-bar {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 12px;
        }

        .search-icon {
          color: #94a3b8;
          margin-right: 8px;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          padding: 12px 0;
          font-size: 14px;
        }

        .filter-select {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          cursor: pointer;
          min-width: 200px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .item-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .item-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .item-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .item-avatar.clinic {
          background: linear-gradient(135deg, #10b981, #059669);
          font-size: 20px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .item-subtitle {
          font-size: 14px;
          color: #3b82f6;
          font-weight: 500;
          margin: 0 0 4px 0;
        }

        .item-detail {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .item-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .action-button.edit {
          background: #dbeafe;
          color: #3b82f6;
        }

        .action-button.edit:hover {
          background: #bfdbfe;
        }

        .action-button.delete {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-button.delete:hover {
          background: #fecaca;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-details p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .sobrecupos-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sobrecupo-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sobrecupo-info {
          flex: 1;
        }

        .sobrecupo-doctor {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .sobrecupo-specialty {
          font-size: 14px;
          color: #3b82f6;
          font-weight: 500;
          margin: 0 0 8px 0;
        }

        .sobrecupo-datetime {
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
          margin: 0 0 4px 0;
        }

        .sobrecupo-location {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .sobrecupo-status {
          margin-right: 16px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.disponible {
          background: #dcfce7;
          color: #166534;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 16px;
        }

        .close-button:hover {
          background: #e2e8f0;
        }

        .modal-form {
          padding: 0 24px 24px 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: relative;
            height: auto;
            top: 0;
          }

          .main-content {
            margin-left: 0;
            margin-top: 0;
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .items-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .modal {
            margin: 16px;
            max-width: calc(100% - 32px);
          }

          .dashboard-title {
            font-size: 24px;
          }

          .stat-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default SobrecuposAdminPanel;