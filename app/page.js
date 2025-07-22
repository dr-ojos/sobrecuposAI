'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Estados para modales
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showClinicaForm, setShowClinicaForm] = useState(false);
  
  // Estados para edición
  const [editingItem, setEditingItem] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    telefono: ''
  });
  const [clinicaForm, setClinicaForm] = useState({
    nombre: '',
    direccion: '',
    comuna: '',
    telefono: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDoctors(),
      fetchClinicas(),
      fetchSobrecupos()
    ]);
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data.records || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      const data = await res.json();
      setClinicas(data.records || []);
    } catch (error) {
      console.error('Error fetching clinicas:', error);
    }
  };

  const fetchSobrecupos = async () => {
    try {
      const res = await fetch('/api/sobrecupos');
      const data = await res.json();
      setSobrecupos(data.records || []);
    } catch (error) {
      console.error('Error fetching sobrecupos:', error);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingItem ? 'PATCH' : 'POST';
      const url = editingItem ? `/api/doctors?id=${editingItem.id}` : '/api/doctors';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nombre: doctorForm.nombre,
          Especialidad: doctorForm.especialidad,
          Email: doctorForm.email,
          Telefono: doctorForm.telefono
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`✅ Doctor ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
        setShowDoctorForm(false);
        setEditingItem(null);
        setDoctorForm({ nombre: '', especialidad: '', email: '', telefono: '' });
        await fetchDoctors();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMsg(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const handleClinicaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingItem ? 'PATCH' : 'POST';
      const url = editingItem ? `/api/clinicas?id=${editingItem.id}` : '/api/clinicas';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nombre: clinicaForm.nombre,
          Direccion: clinicaForm.direccion,
          Comuna: clinicaForm.comuna,
          Telefono: clinicaForm.telefono
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`✅ Clínica ${editingItem ? 'actualizada' : 'creada'} exitosamente`);
        setShowClinicaForm(false);
        setEditingItem(null);
        setClinicaForm({ nombre: '', direccion: '', comuna: '', telefono: '' });
        await fetchClinicas();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMsg(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const handleEdit = (type, item) => {
    const fields = item.fields || item;
    
    if (type === 'doctor') {
      setDoctorForm({
        nombre: fields.Nombre || '',
        especialidad: fields.Especialidad || '',
        email: fields.Email || '',
        telefono: fields.Telefono || ''
      });
      setShowDoctorForm(true);
    } else if (type === 'clinica') {
      setClinicaForm({
        nombre: fields.Nombre || '',
        direccion: fields.Direccion || '',
        comuna: fields.Comuna || '',
        telefono: fields.Telefono || ''
      });
      setShowClinicaForm(true);
    }
    
    setEditingItem(item);
  };

  const handleDelete = async (type, id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      return;
    }

    try {
      const endpoints = {
        doctor: '/api/doctors',
        clinica: '/api/clinicas',
        sobrecupo: '/api/sobrecupos'
      };

      const res = await fetch(`${endpoints[type]}?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMsg('✅ Elemento eliminado exitosamente');
        await fetchAllData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      setMsg(`❌ Error: ${error.message}`);
    }
  };

  // Componente para el logo de Sobrecupos
  const SobrecuposLogo = ({ size = 32, className = '' }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="currentColor"/>
      <path
        d="M8 12h16v2H8v-2zm0 4h12v2H8v-2zm0 4h8v2H8v-2z"
        fill="white"
      />
    </svg>
  );

  return (
    <main className="admin-container">
      {/* Header móvil optimizado */}
      <div className="mobile-header">
        <button
          onClick={() => router.back()}
          className="back-button"
        >
          ← Volver
        </button>
        <div className="header-title">
          <SobrecuposLogo size={24} className="header-logo" />
          <span>Admin Panel</span>
        </div>
        <div className="header-spacer"></div>
      </div>

      {/* Navegación por tabs móvil */}
      <div className="mobile-tabs">
        <button 
          className={`tab-button ${activeSection === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveSection("dashboard")}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeSection === "doctors" ? "active" : ""}`}
          onClick={() => setActiveSection("doctors")}
        >
          👨‍⚕️ Médicos
        </button>
        <button 
          className={`tab-button ${activeSection === "clinicas" ? "active" : ""}`}
          onClick={() => setActiveSection("clinicas")}
        >
          🏥 Clínicas
        </button>
        <button 
          className={`tab-button ${activeSection === "sobrecupos" ? "active" : ""}`}
          onClick={() => setActiveSection("sobrecupos")}
        >
          📅 Sobrecupos
        </button>
      </div>

      <div className="content-container">
        {/* Mensajes de estado */}
        {msg && (
          <div className={`mobile-message ${msg.includes("✅") ? "success" : msg.includes("❌") ? "error" : "warning"}`}>
            {msg}
          </div>
        )}

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">Panel Administrativo</h1>
              <p className="dashboard-subtitle">Gestiona tu plataforma médica</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-content">
                  <div className="stat-value">{doctors.length}</div>
                  <div className="stat-label">Médicos Registrados</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏥</div>
                <div className="stat-content">
                  <div className="stat-value">{clinicas.length}</div>
                  <div className="stat-label">Clínicas Activas</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{sobrecupos.length}</div>
                  <div className="stat-label">Sobrecupos Disponibles</div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h2 className="section-title">Acciones Rápidas</h2>
              <div className="actions-grid">
                <button 
                  className="quick-action-card"
                  onClick={() => setShowDoctorForm(true)}
                >
                  <div className="action-icon">👨‍⚕️</div>
                  <div className="action-text">Agregar Médico</div>
                </button>
                <button 
                  className="quick-action-card"
                  onClick={() => setShowClinicaForm(true)}
                >
                  <div className="action-icon">🏥</div>
                  <div className="action-text">Agregar Clínica</div>
                </button>
                <button 
                  className="quick-action-card"
                  onClick={() => router.push('/admin')}
                >
                  <div className="action-icon">📅</div>
                  <div className="action-text">Crear Sobrecupo</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Médicos */}
        {activeSection === "doctors" && (
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Gestión de Médicos</h2>
              <button 
                className="primary-button"
                onClick={() => setShowDoctorForm(true)}
              >
                ➕ Agregar Médico
              </button>
            </div>

            <div className="items-list">
              {doctors.map(doctor => {
                const fields = doctor.fields || doctor;
                return (
                  <div key={doctor.id} className="item-card">
                    <div className="item-info">
                      <h3 className="item-title">{fields.Nombre}</h3>
                      <p className="item-subtitle">{fields.Especialidad}</p>
                      <div className="item-details">
                        {fields.Email && (
                          <p><strong>Email:</strong> {fields.Email}</p>
                        )}
                        {fields.Telefono && (
                          <p><strong>Teléfono:</strong> {fields.Telefono}</p>
                        )}
                      </div>
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
                );
              })}
            </div>
          </div>
        )}

        {/* Clínicas */}
        {activeSection === "clinicas" && (
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Gestión de Clínicas</h2>
              <button 
                className="primary-button"
                onClick={() => setShowClinicaForm(true)}
              >
                ➕ Agregar Clínica
              </button>
            </div>

            <div className="items-list">
              {clinicas.map(clinica => {
                const fields = clinica.fields || clinica;
                return (
                  <div key={clinica.id} className="item-card">
                    <div className="item-info">
                      <h3 className="item-title">{fields.Nombre}</h3>
                      <p className="item-subtitle">{fields.Comuna}</p>
                      <div className="item-details">
                        <p><strong>Dirección:</strong> {fields.Direccion}</p>
                        {fields.Telefono && (
                          <p><strong>Teléfono:</strong> {fields.Telefono}</p>
                        )}
                      </div>
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
                );
              })}
            </div>
          </div>
        )}

        {/* Sobrecupos */}
        {activeSection === "sobrecupos" && (
          <div className="section-container">
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
        )}
      </div>

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Editar Médico' : 'Agregar Médico'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDoctorForm(false);
                  setEditingItem(null);
                  setDoctorForm({ nombre: '', especialidad: '', email: '', telefono: '' });
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
                  value={doctorForm.nombre}
                  onChange={(e) => setDoctorForm({...doctorForm, nombre: e.target.value})}
                  required
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Especialidad</label>
                <input
                  type="text"
                  value={doctorForm.especialidad}
                  onChange={(e) => setDoctorForm({...doctorForm, especialidad: e.target.value})}
                  required
                  placeholder="Cardiología"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                  placeholder="doctor@clinica.cl"
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={doctorForm.telefono}
                  onChange={(e) => setDoctorForm({...doctorForm, telefono: e.target.value})}
                  placeholder="+569 1234 5678"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowDoctorForm(false);
                    setEditingItem(null);
                    setDoctorForm({ nombre: '', especialidad: '', email: '', telefono: '' });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinica Form Modal */}
      {showClinicaForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Editar Clínica' : 'Agregar Clínica'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowClinicaForm(false);
                  setEditingItem(null);
                  setClinicaForm({ nombre: '', direccion: '', comuna: '', telefono: '' });
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
                  value={clinicaForm.nombre}
                  onChange={(e) => setClinicaForm({...clinicaForm, nombre: e.target.value})}
                  required
                  placeholder="Clínica Las Condes"
                />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={clinicaForm.direccion}
                  onChange={(e) => setClinicaForm({...clinicaForm, direccion: e.target.value})}
                  required
                  placeholder="Av. Apoquindo 3600"
                />
              </div>
              <div className="form-group">
                <label>Comuna</label>
                <input
                  type="text"
                  value={clinicaForm.comuna}
                  onChange={(e) => setClinicaForm({...clinicaForm, comuna: e.target.value})}
                  required
                  placeholder="Las Condes"
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={clinicaForm.telefono}
                  onChange={(e) => setClinicaForm({...clinicaForm, telefono: e.target.value})}
                  placeholder="+56 2 2345 6789"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowClinicaForm(false);
                    setEditingItem(null);
                    setClinicaForm({ nombre: '', direccion: '', comuna: '', telefono: '' });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ESTILOS BASE - optimizados para iPhone */
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* HEADER MÓVIL - optimizado para iPhone */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: max(12px, env(safe-area-inset-top)) 16px 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          min-height: 56px;
          box-sizing: border-box;
        }

        .back-button {
          background: none;
          border: none;
          color: #007aff;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-button:hover, .back-button:active {
          background: rgba(0, 122, 255, 0.1);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .header-logo {
          color: #007aff;
        }

        .header-spacer {
          width: 44px;
        }

        /* TABS MÓVIL - optimizados para iPhone */
        .mobile-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 56px;
          z-index: 99;
        }

        .tab-button {
          padding: 12px 4px;
          border: none;
          background: transparent;
          color: #8e8e93;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          min-height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .tab-button.active {
          color: #007aff;
          border-bottom-color: #007aff;
        }

        .tab-button:active {
          transform: scale(0.95);
        }

        /* CONTENEDOR PRINCIPAL */
        .content-container {
          padding: 16px;
          max-width: 100vw;
          box-sizing: border-box;
        }

        /* MENSAJES - optimizados para iPhone */
        .mobile-message {
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }

        .mobile-message.success {
          background: #e6ffed;
          color: #006400;
          border: 1px solid #c3e6cb;
        }

        .mobile-message.error {
          background: #fee;
          color: #b00020;
          border: 1px solid #f5c6cb;
        }

        .mobile-message.warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        /* DASHBOARD - optimizado para iPhone */
        .dashboard-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .dashboard-header {
          padding: 24px 20px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          text-align: center;
        }

        .dashboard-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .dashboard-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }

        /* ESTADÍSTICAS - grid optimizado para iPhone */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          padding: 20px;
        }

        .stat-card {
          background: #f8faff;
          border-radius: 12px;
          padding: 16px 12px;
          text-align: center;
          border: 1px solid #e8f2ff;
        }

        .stat-icon {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #007aff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: #6c6c70;
          font-weight: 500;
        }

        /* ACCIONES RÁPIDAS */
        .quick-actions {
          padding: 0 20px 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #1a1a1a;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
        }

        .quick-action-card {
          background: white;
          border: 1px solid #e8f2ff;
          border-radius: 12px;
          padding: 16px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-height: 44px;
        }

        .quick-action-card:hover {
          border-color: #007aff;
          background: #f8faff;
        }

        .quick-action-card:active {
          transform: scale(0.98);
        }

        .action-icon {
          font-size: 20px;
        }

        .action-text {
          font-size: 12px;
          font-weight: 600;
          color: #007aff;
        }

        /* SECCIONES GENERALES */
        .section-container {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        .section-header .section-title {
          font-size: 18px;
          margin: 0;
          flex: 1;
        }

        .primary-button {
          background: #007aff;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          white-space: nowrap;
        }

        .primary-button:hover {
          background: #0056d3;
        }

        .primary-button:active {
          transform: scale(0.98);
        }

        .primary-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* LISTAS DE ELEMENTOS - optimizadas para iPhone */
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .item-card {
          background: #f8faff;
          border: 1px solid #e8f2ff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .item-subtitle {
          font-size: 14px;
          color: #007aff;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .item-details p {
          font-size: 13px;
          color: #6c6c70;
          margin: 2px 0;
          word-break: break-word;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .action-button {
          background: none;
          border: 1px solid #e8f2ff;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button.edit {
          color: #ff9500;
          border-color: #ff9500;
        }

        .action-button.edit:hover {
          background: rgba(255, 149, 0, 0.1);
        }

        .action-button.delete {
          color: #ff3b30;
          border-color: #ff3b30;
        }

        .action-button.delete:hover {
          background: rgba(255, 59, 48, 0.1);
        }

        .action-button:active {
          transform: scale(0.95);
        }

        /* SOBRECUPOS - lista específica */
        .sobrecupos-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sobrecupo-item {
          background: #f8faff;
          border: 1px solid #e8f2ff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .sobrecupo-info {
          flex: 1;
          min-width: 0;
        }

        .sobrecupo-doctor {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .sobrecupo-specialty {
          font-size: 14px;
          color: #007aff;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .sobrecupo-datetime {
          font-size: 13px;
          color: #6c6c70;
          margin: 2px 0;
        }

        .sobrecupo-location {
          font-size: 13px;
          color: #6c6c70;
          margin: 2px 0;
        }

        /* MODALES - optimizados para iPhone */
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
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e8f2ff;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #1a1a1a;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 18px;
          color: #8e8e93;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          min-width: 32px;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: rgba(142, 142, 147, 0.1);
        }

        .modal-form {
          padding: 20px;
          max-height: calc(90vh - 120px);
          overflow-y: auto;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e8f2ff;
          border-radius: 8px;
          font-size: 16px;
          background: white;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-group input::placeholder {
          color: #8e8e93;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .secondary-button {
          flex: 1;
          background: #f2f2f7;
          color: #007aff;
          border: none;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
        }

        .secondary-button:hover {
          background: #e8e8ed;
        }

        .secondary-button:active {
          transform: scale(0.98);
        }

        .form-actions .primary-button {
          flex: 1;
          font-size: 16px;
          padding: 12px 16px;
        }

        /* RESPONSIVE ADICIONAL PARA PANTALLAS MUY PEQUEÑAS */
        @media (max-width: 320px) {
          .mobile-header {
            padding: max(8px, env(safe-area-inset-top)) 12px 8px 12px;
          }
          
          .content-container {
            padding: 12px;
          }
          
          .tab-button {
            font-size: 10px;
            padding: 10px 2px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 16px;
          }
          
          .stat-card {
            padding: 12px 8px;
          }
          
          .actions-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .modal {
            margin: 8px;
            max-width: calc(100vw - 16px);
          }
          
          .modal-header,
          .modal-form {
            padding: 16px;
          }
        }

        /* MEJORAS PARA ACCESIBILIDAD TÁCTIL */
        @media (hover: none) {
          .back-button:hover,
          .nav-button:hover,
          .quick-action-card:hover,
          .primary-button:hover,
          .action-button.edit:hover,
          .action-button.delete:hover,
          .modal-close:hover,
          .secondary-button:hover {
            background: initial;
            border-color: initial;
          }
        }

        /* ANIMACIONES SUAVES */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        .admin-container {
          -webkit-overflow-scrolling: touch;
        }

        .modal-form {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </main>
  );
}