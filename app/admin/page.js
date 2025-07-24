'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanelPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showClinicaForm, setShowClinicaForm] = useState(false);

  const [showSobrecupoForm, setShowSobrecupoForm] = useState(false);

const [sobrecupoForm, setSobrecupoForm] = useState({
  medico: '',
  especialidad: '',
  clinica: '',
  direccion: '',
  fecha: '',
  hora: ''
});

  const [editingItem, setEditingItem] = useState(null);

  const [doctorForm, setDoctorForm] = useState({
    Name: '',
    Especialidad: '',
    WhatsApp: '',
    Email: '',
    Atiende: '',
    Seguros: [],
    Clinicas: []
  });

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

  // Horas disponibles de 09:00 a 19:00 cada 60 min
  const timeSlots = Array.from({ length: 11 }, (_, i) =>
    `${(9 + i).toString().padStart(2, '0')}:00`
  );

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
        setMsg('✅ Médico guardado exitosamente');
      } else {
        setMsg('❌ Error guardando médico');
      }
    } catch (error) {
      setMsg('❌ Error de conexión');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
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
        setMsg('✅ Clínica guardada exitosamente');
      } else {
        setMsg('❌ Error guardando clínica');
      }
    } catch (error) {
      setMsg('❌ Error de conexión');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleSobrecupoSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Validar que todos los campos estén completos
    if (!sobrecupoForm.medico || !sobrecupoForm.especialidad || !sobrecupoForm.clinica || 
        !sobrecupoForm.direccion || !sobrecupoForm.fecha || !sobrecupoForm.hora) {
      setMsg('❌ Todos los campos son obligatorios');
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    console.log('📤 Enviando sobrecupo:', sobrecupoForm);

    const res = await fetch('/api/sobrecupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sobrecupoForm)
    });

    const responseData = await res.json();
    console.log('📥 Respuesta API:', responseData);

    if (res.ok) {
      await fetchSobrecupos();
      setShowSobrecupoForm(false);
      setSobrecupoForm({
        medico: '',
        especialidad: '',
        clinica: '',
        direccion: '',
        fecha: '',
        hora: ''
      });
      setMsg('✅ Sobrecupo creado exitosamente');
    } else {
      console.error('❌ Error del servidor:', responseData);
      setMsg(`❌ Error: ${responseData.error || 'Error guardando sobrecupo'}`);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    setMsg('❌ Error de conexión');
  } finally {
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
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
        
        setMsg('✅ Elemento eliminado exitosamente');
      } else {
        setMsg('❌ Error eliminando elemento');
      }
    } catch (error) {
      setMsg('❌ Error de conexión');
    } finally {
      setTimeout(() => setMsg(''), 3000);
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Componente del Logo SVG de Sobrecupos
  const SobrecuposLogo = ({ size = 32, className = "" }) => (
    <svg 
      width={size} 
      height={size * 0.588}
      viewBox="0 0 1005 591" 
      className={className}
      fill="currentColor"
    >
      <g transform="translate(0,591) scale(0.1,-0.1)">
        <path d="M1363 3665 c-143 -39 -241 -131 -293 -272 -19 -53 -22 -77 -18 -156
3 -84 8 -103 40 -168 34 -67 64 -101 320 -357 l283 -282 398 398 c372 372 397
400 397 432 -1 57 -48 98 -98 85 -17 -4 -116 -95 -262 -240 -272 -271 -297
-288 -430 -289 -128 -1 -165 18 -307 157 -144 141 -173 188 -173 282 0 113 70
209 174 240 119 36 179 13 316 -121 l105 -103 -60 -61 -60 -60 -95 94 c-98 98
-132 117 -172 95 -34 -18 -47 -40 -48 -79 0 -30 12 -46 118 -151 92 -92 126
-120 157 -128 83 -22 97 -12 360 249 132 131 255 245 274 255 45 22 126 30
178 16 105 -28 183 -134 183 -245 -1 -110 -4 -114 -438 -548 l-397 -398 60
-60 60 -60 403 402 c374 374 406 408 440 477 36 73 37 78 37 186 0 108 -1 113
-38 187 -103 210 -346 293 -563 194 -42 -19 -87 -56 -164 -131 -58 -58 -110
-105 -115 -105 -5 0 -56 47 -114 104 -59 57 -124 113 -146 124 -102 51 -211
64 -312 37z"/>
      </g>
    </svg>
  );

  return (
    <main className="admin-container">
      {/* Header móvil consistente con el diseño del proyecto */}
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

      {/* Navegación adicional consistente */}
      <div className="admin-nav">
        <button
          onClick={() => router.push("/admin/doctors")}
          className="nav-button"
        >
          👨‍⚕️ Médicos
        </button>
        <button
          onClick={() => router.push("/admin/clinicas")}
          className="nav-button"
        >
          🏥 Clínicas
        </button>
      </div>

      {/* Navegación por tabs móvil consistente */}
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
        {/* Mensajes de estado móvil consistentes */}
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
                  onClick={() => setShowSobrecupoForm(true)}
                >
                  <div className="action-icon">➕</div>
                  <div className="action-title">Crear Sobrecupo</div>
                </button>
                <button 
                  className="quick-action-card"
                  onClick={() => setShowDoctorForm(true)}
                >
                  <div className="action-icon">👨‍⚕️</div>
                  <div className="action-title">Agregar Médico</div>
                </button>
                <button 
                  className="quick-action-card"
                  onClick={() => setShowClinicaForm(true)}
                >
                  <div className="action-icon">🏥</div>
                  <div className="action-title">Agregar Clínica</div>
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

            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar médicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
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
                  const matchesSearch = fields.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        fields.Especialidad?.toLowerCase().includes(searchTerm.toLowerCase());
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
                      <div className="item-content">
                        <h3 className="item-title">Dr. {fields.Name}</h3>
                        <p className="item-subtitle">{fields.Especialidad}</p>
                        <div className="item-details">
                          <p><strong>Email:</strong> {fields.Email}</p>
                          <p><strong>WhatsApp:</strong> {fields.WhatsApp}</p>
                          <p><strong>Atiende:</strong> {fields.Atiende}</p>
                          {fields.Seguros && fields.Seguros.length > 0 && (
                            <p><strong>Seguros:</strong> {fields.Seguros.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
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

            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar clínicas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="items-grid">
              {clinicas
                .filter(clinica => {
                  const fields = clinica.fields || clinica;
                  return fields.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.Comuna?.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map(clinica => {
                  const fields = clinica.fields || clinica;
                  return (
                    <div key={clinica.id} className="item-card">
                      <div className="item-header">
                        <div className="item-avatar clinic">🏥</div>
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
                      <div className="item-content">
                        <h3 className="item-title">{fields.Nombre}</h3>
                        <p className="item-subtitle">{fields.Comuna}</p>
                        <div className="item-details">
                          <p><strong>Dirección:</strong> {fields.Direccion}</p>
                          {fields.Telefono && (
                            <p><strong>Teléfono:</strong> {fields.Telefono}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
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
                onClick={() => setShowSobrecupoForm(true)}
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
              <h2 className="modal-title">{editingItem ? 'Editar Médico' : 'Nuevo Médico'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDoctorForm(false);
                  setEditingItem(null);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDoctorSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Nombre Completo</label>
                  <input
                    type="text"
                    value={doctorForm.Name}
                    onChange={(e) => setDoctorForm({...doctorForm, Name: e.target.value})}
                    className="field-input"
                    placeholder="Ej: Juan Pérez Silva"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">Especialidad</label>
                  <select
                    value={doctorForm.Especialidad}
                    onChange={(e) => setDoctorForm({...doctorForm, Especialidad: e.target.value})}
                    className="field-select"
                    required
                  >
                    <option value="">Seleccionar especialidad</option>
                    {especialidades.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="field-label">WhatsApp</label>
                  <input
                    type="tel"
                    value={doctorForm.WhatsApp}
                    onChange={(e) => setDoctorForm({...doctorForm, WhatsApp: e.target.value})}
                    className="field-input"
                    placeholder="+56 9 1234 5678"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    value={doctorForm.Email}
                    onChange={(e) => setDoctorForm({...doctorForm, Email: e.target.value})}
                    className="field-input"
                    placeholder="doctor@email.com"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">Atiende</label>
                  <select
                    value={doctorForm.Atiende}
                    onChange={(e) => setDoctorForm({...doctorForm, Atiende: e.target.value})}
                    className="field-select"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {opcionesAtiende.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-field full-width">
                <label className="field-label">Seguros Aceptados</label>
                <div className="checkbox-grid">
                  {opcionesSeguros.map(seguro => (
                    <label key={seguro} className="checkbox-item">
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
                        className="checkbox-input"
                      />
                      <span className="checkbox-label">{seguro}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => setShowDoctorForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="primary-button" 
                  disabled={loading}
                >
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
              <h2 className="modal-title">{editingItem ? 'Editar Clínica' : 'Nueva Clínica'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowClinicaForm(false);
                  setEditingItem(null);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleClinicaSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Nombre de la Clínica</label>
                  <input
                    type="text"
                    value={clinicaForm.Nombre}
                    onChange={(e) => setClinicaForm({...clinicaForm, Nombre: e.target.value})}
                    className="field-input"
                    placeholder="Ej: Clínica Las Condes"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">Comuna</label>
                  <input
                    type="text"
                    value={clinicaForm.Comuna}
                    onChange={(e) => setClinicaForm({...clinicaForm, Comuna: e.target.value})}
                    className="field-input"
                    placeholder="Ej: Las Condes"
                    required
                  />
                </div>
                
                <div className="form-field full-width">
                  <label className="field-label">Dirección</label>
                  <input
                    type="text"
                    value={clinicaForm.Direccion}
                    onChange={(e) => setClinicaForm({...clinicaForm, Direccion: e.target.value})}
                    className="field-input"
                    placeholder="Ej: Av. Las Condes 123, Oficina 456"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">Teléfono</label>
                  <input
                    type="tel"
                    value={clinicaForm.Telefono}
                    onChange={(e) => setClinicaForm({...clinicaForm, Telefono: e.target.value})}
                    className="field-input"
                    placeholder="+56 2 2345 6789"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => setShowClinicaForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="primary-button" 
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sobrecupo Form Modal */}
      {showSobrecupoForm && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2 className="modal-title">Nuevo Sobrecupo</h2>
        <button
          className="modal-close"
          onClick={() => {
            setShowSobrecupoForm(false);
            setSobrecupoForm({
              medico: '',
              especialidad: '',
              clinica: '',
              direccion: '',
              fecha: '',
              hora: ''
            });
          }}
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSobrecupoSubmit} className="modal-form">
        <div className="form-grid">
          {/* Selección de Médico */}
          <div className="form-field">
            <label className="field-label">👨‍⚕️ Médico</label>
            <select
              value={sobrecupoForm.medico}
              onChange={(e) => {
                const selectedDoctor = doctors.find(d => d.id === e.target.value);
                const fields = selectedDoctor?.fields || selectedDoctor;
                setSobrecupoForm({
                  ...sobrecupoForm,
                  medico: e.target.value,
                  especialidad: fields?.Especialidad || ''
                });
              }}
              className="field-select"
              required
            >
              <option value="">Seleccionar médico</option>
              {doctors.map(doc => {
                const fields = doc.fields || doc;
                return (
                  <option key={doc.id} value={doc.id}>
                    {fields.Name} - {fields.Especialidad}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Especialidad (se llena automáticamente) */}
          <div className="form-field">
            <label className="field-label">🩺 Especialidad</label>
            <input
              type="text"
              value={sobrecupoForm.especialidad}
              onChange={(e) => setSobrecupoForm({...sobrecupoForm, especialidad: e.target.value})}
              className="field-input"
              placeholder="Se llena automáticamente"
              required
            />
          </div>

          {/* Clínica */}
          <div className="form-field">
            <label className="field-label">🏥 Clínica</label>
            <select
              value={sobrecupoForm.clinica}
              onChange={(e) => {
                const selectedClinica = clinicas.find(c => (c.fields || c).Nombre === e.target.value);
                const fields = selectedClinica?.fields || selectedClinica;
                setSobrecupoForm({
                  ...sobrecupoForm,
                  clinica: e.target.value,
                  direccion: fields?.Direccion || ''
                });
              }}
              className="field-select"
              required
            >
              <option value="">Seleccionar clínica</option>
              {clinicas.map(cl => {
                const nombre = (cl.fields || cl).Nombre;
                return (
                  <option key={cl.id} value={nombre}>{nombre}</option>
                );
              })}
            </select>
          </div>

          {/* Dirección (se llena automáticamente) */}
          <div className="form-field">
            <label className="field-label">📍 Dirección</label>
            <input
              type="text"
              value={sobrecupoForm.direccion}
              onChange={(e) => setSobrecupoForm({...sobrecupoForm, direccion: e.target.value})}
              className="field-input"
              placeholder="Se llena automáticamente"
              required
            />
          </div>

          {/* Fecha */}
          <div className="form-field">
            <label className="field-label">📅 Fecha</label>
            <input
              type="date"
              value={sobrecupoForm.fecha}
              onChange={(e) => setSobrecupoForm({...sobrecupoForm, fecha: e.target.value})}
              className="field-input"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Hora */}
          <div className="form-field">
            <label className="field-label">🕐 Hora</label>
            <select
              value={sobrecupoForm.hora}
              onChange={(e) => setSobrecupoForm({...sobrecupoForm, hora: e.target.value})}
              className="field-select"
              required
            >
              <option value="">Seleccionar hora</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setShowSobrecupoForm(false);
              setSobrecupoForm({
                medico: '',
                especialidad: '',
                clinica: '',
                direccion: '',
                fecha: '',
                hora: ''
              });
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Sobrecupo'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Header Móvil */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
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
        }

        .back-button:hover {
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
          filter: drop-shadow(0 1px 2px rgba(0, 122, 255, 0.2));
        }

        .header-spacer {
          width: 64px;
        }

        /* Navegación adicional */
        .admin-nav {
          display: flex;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 56px;
          z-index: 98;
        }

        .nav-button {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          background: white;
          color: #007aff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-button:hover {
          background: #f0f4fa;
          border-color: #007aff;
        }

        .nav-button:active {
          transform: scale(0.98);
        }

        /* Tabs Móvil */
        .mobile-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 112px;
          z-index: 99;
        }

        .tab-button {
          flex: 1;
          padding: 12px 8px;
          border: none;
          background: transparent;
          color: #8e8e93;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }

        .tab-button.active {
          color: #007aff;
          border-bottom-color: #007aff;
        }

        /* Container Principal */
        .content-container {
          padding: 16px;
          max-width: 100vw;
          box-sizing: border-box;
        }

        /* Mensajes */
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

        /* Dashboard */
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
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .dashboard-subtitle {
          font-size: 15px;
          opacity: 0.9;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .stat-card {
          background: #f8faff;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #007aff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #8e8e93;
          font-weight: 500;
        }

        .quick-actions {
          padding: 20px;
          border-top: 1px solid #e5e5e7;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 16px 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .quick-action-card {
          background: white;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-card:hover {
          background: #f8faff;
          border-color: #007aff;
          transform: translateY(-1px);
        }

        .action-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .action-title {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* Secciones */
        .section-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e5e7;
          background: #f8faff;
        }

        .primary-button {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
        }

        .secondary-button {
          background: white;
          color: #8e8e93;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: #f8faff;
          border-color: #007aff;
        }

        /* Búsqueda */
        .search-container {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: #f8faff;
          border-bottom: 1px solid #e5e5e7;
        }

        .search-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .filter-select {
          padding: 10px 12px;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          min-width: 160px;
        }

        /* Items Grid */
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .item-card {
          background: white;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #007aff;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .item-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .item-avatar.clinic {
          background: linear-gradient(135deg, #34c759, #248a3d);
          font-size: 18px;
        }

        .item-actions {
          display: flex;
          gap: 6px;
        }

        .action-button {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-button.edit {
          background: #dbeafe;
          color: #007aff;
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

        .item-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .item-subtitle {
          font-size: 14px;
          color: #007aff;
          font-weight: 500;
          margin: 0;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-details p {
          font-size: 12px;
          color: #8e8e93;
          margin: 0;
        }

        /* Sobrecupos */
        .sobrecupos-list {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sobrecupo-item {
          background: #f8faff;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .sobrecupo-item:hover {
          background: white;
          border-color: #007aff;
          transform: translateY(-1px);
        }

        .sobrecupo-info {
          flex: 1;
        }

        .sobrecupo-doctor {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px 0;
        }

        .sobrecupo-specialty {
          font-size: 14px;
          color: #007aff;
          font-weight: 500;
          margin: 0 0 8px 0;
        }

        .sobrecupo-datetime {
          font-size: 12px;
          color: #34c759;
          font-weight: 500;
          margin: 0 0 4px 0;
        }

        .sobrecupo-location {
          font-size: 12px;
          color: #8e8e93;
          margin: 0;
        }

        /* Modales */
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
          padding: 20px 20px 0 20px;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border: none;
          background: #f1f5f9;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e8e93;
          font-size: 14px;
        }

        .modal-close:hover {
          background: #e2e8f0;
        }

        .modal-form {
          padding: 0 20px 20px 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .field-input,
        .field-select {
          padding: 10px 12px;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
          padding: 12px;
          background: #f8faff;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .checkbox-input {
          width: 14px;
          height: 14px;
        }

        .checkbox-label {
          font-size: 13px;
          color: #374151;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e5e7;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .items-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .search-container {
            flex-direction: column;
            gap: 8px;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .content-container {
            padding: 12px;
          }

          .modal {
            margin: 16px;
            max-width: calc(100% - 32px);
          }

          .mobile-header {
            padding: 10px 12px;
          }

          .header-title {
            font-size: 15px;
          }
        }

        /* iOS Safari fixes */
        @supports (-webkit-touch-callout: none) {
          .field-input,
          .field-select,
          .search-input {
            -webkit-appearance: none;
            font-size: 16px;
          }

          .primary-button,
          .action-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
          }
        }

        /* Smooth scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }

        /* Safe area */
        @supports (padding: max(0px)) {
          .mobile-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }

          .admin-container {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }

        /* Desktop responsive */
        @media (min-width: 1024px) {
          .content-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px;
          }

          .mobile-header {
            display: none;
          }

          .admin-nav {
            display: none;
          }

          .mobile-tabs {
            position: relative;
            top: 0;
            background: white;
            border-bottom: 1px solid #e5e5e7;
            padding: 0 24px;
            justify-content: center;
            max-width: 600px;
            margin: 0 auto 24px;
            border-radius: 12px;
          }

          .items-grid {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
          }
        }
      `}</style>
    </main>
  );
}