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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    'Otorrinolaringología', 'Neurología', 'Cardiología', 'Ginecología',
    'Traumatología', 'Psiquiatría', 'Urología', 'Endocrinología',
    'Gastroenterología', 'Neumología', 'Reumatología', 'Oncología',
    'Hematología', 'Nefrología', 'Infectología', 'Geriatría',
    'Medicina Interna', 'Anestesiología', 'Radiología', 'Patología'
  ];

  const opcionesAtiende = ['Adultos', 'Niños', 'Ambos'];
  const opcionesSeguros = ['Fonasa', 'Isapres', 'Particular'];

  // Horas disponibles de 09:00 a 19:00 cada 60 min
  const timeSlots = Array.from({ length: 11 }, (_, i) =>
    `${(9 + i).toString().padStart(2, '0')}:00`
  );

  useEffect(() => {
    fetchAllData();
    
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 5,
        y: (e.clientY / window.innerHeight - 0.5) * 5
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      if (!sobrecupoForm.medico || !sobrecupoForm.especialidad || !sobrecupoForm.clinica || 
          !sobrecupoForm.direccion || !sobrecupoForm.fecha || !sobrecupoForm.hora) {
        setMsg('❌ Todos los campos son obligatorios');
        setLoading(false);
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      const res = await fetch('/api/sobrecupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sobrecupoForm)
      });

      const responseData = await res.json();

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
        setMsg(`❌ Error: ${responseData.error || 'Error guardando sobrecupo'}`);
      }
    } catch (error) {
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
      {/* Fondo con gradiente minimalista */}
      <div className="bg-gradient" />
      
      {/* Elementos geométricos sutiles */}
      <div className="floating-elements">
        <div className="element element-1" style={{transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`}}>
          <div className="geometric-circle"></div>
        </div>
        <div className="element element-2" style={{transform: `translate(${mousePos.x * -0.15}px, ${mousePos.y * 0.15}px)`}}>
          <div className="geometric-square"></div>
        </div>
        <div className="element element-3" style={{transform: `translate(${mousePos.x * 0.25}px, ${mousePos.y * -0.2}px)`}}>
          <div className="geometric-triangle"></div>
        </div>
      </div>

      {/* Header minimalista */}
      <div className="admin-header">
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

      {/* Navegación principal - estilo minimalista */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeSection === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveSection("dashboard")}
        >
          Dashboard
        </button>
        <button 
          className={`nav-tab ${activeSection === "doctors" ? "active" : ""}`}
          onClick={() => setActiveSection("doctors")}
        >
          Médicos
        </button>
        <button 
          className={`nav-tab ${activeSection === "clinicas" ? "active" : ""}`}
          onClick={() => setActiveSection("clinicas")}
        >
          Clínicas
        </button>
        <button 
          className={`nav-tab ${activeSection === "sobrecupos" ? "active" : ""}`}
          onClick={() => setActiveSection("sobrecupos")}
        >
          Sobrecupos
        </button>
      </div>

      <div className="content-wrapper">
        {/* Mensajes */}
        {msg && (
          <div className={`message ${msg.includes("✅") ? "success" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className="dashboard-section">
            <div className="section-header">
              <h1 className="section-title">Panel Administrativo</h1>
              <p className="section-subtitle">Gestiona tu plataforma médica</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{doctors.length}</div>
                <div className="stat-label">Médicos Registrados</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{clinicas.length}</div>
                <div className="stat-label">Clínicas Activas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{sobrecupos.length}</div>
                <div className="stat-label">Sobrecupos Disponibles</div>
              </div>
            </div>

            <div className="quick-actions">
              <h2 className="subsection-title">Acciones Rápidas</h2>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setShowSobrecupoForm(true)}
                >
                  <div className="action-icon">+</div>
                  <div className="action-title">Crear Sobrecupo</div>
                </button>
                <button 
                  className="action-card"
                  onClick={() => setShowDoctorForm(true)}
                >
                  <div className="action-icon">👨‍⚕️</div>
                  <div className="action-title">Agregar Médico</div>
                </button>
                <button 
                  className="action-card"
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
          <div className="list-section">
            <div className="section-header">
              <h2 className="section-title">Gestión de Médicos</h2>
              <button 
                className="primary-button"
                onClick={() => setShowDoctorForm(true)}
              >
                + Agregar Médico
              </button>
            </div>

            <div className="search-controls">
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

            <div className="items-list">
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
                      <div className="item-info">
                        <div className="item-avatar">
                          {fields.Name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                        </div>
                        <div className="item-details">
                          <h3 className="item-name">Dr. {fields.Name}</h3>
                          <p className="item-specialty">{fields.Especialidad}</p>
                          <p className="item-contact">{fields.Email}</p>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit('doctor', doctor)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete('doctor', doctor.id)}
                        >
                          🗑️
                        </button>
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
          <div className="list-section">
            <div className="section-header">
              <h2 className="section-title">Gestión de Clínicas</h2>
              <button 
                className="primary-button"
                onClick={() => setShowClinicaForm(true)}
              >
                + Agregar Clínica
              </button>
            </div>

            <div className="search-controls">
              <input
                type="text"
                placeholder="Buscar clínicas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="items-list">
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
                      <div className="item-info">
                        <div className="item-avatar clinic">🏥</div>
                        <div className="item-details">
                          <h3 className="item-name">{fields.Nombre}</h3>
                          <p className="item-specialty">{fields.Comuna}</p>
                          <p className="item-contact">{fields.Direccion}</p>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit('clinica', clinica)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete('clinica', clinica.id)}
                        >
                          🗑️
                        </button>
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
          <div className="list-section">
            <div className="section-header">
              <h2 className="section-title">Gestión de Sobrecupos</h2>
              <button 
                className="primary-button"
                onClick={() => setShowSobrecupoForm(true)}
              >
                + Crear Sobrecupo
              </button>
            </div>

            <div className="sobrecupos-list">
              {sobrecupos.map(sobrecupo => {
                const fields = sobrecupo.fields || sobrecupo;
                return (
                  <div key={sobrecupo.id} className="sobrecupo-card">
                    <div className="sobrecupo-info">
                      <h3 className="sobrecupo-doctor">{fields.MedicoNombre || 'Dr. Desconocido'}</h3>
                      <p className="sobrecupo-specialty">{fields.Especialidad}</p>
                      <div className="sobrecupo-details">
                        <span className="detail-item">📅 {fields.Fecha}</span>
                        <span className="detail-item">🕐 {fields.Hora}</span>
                        <span className="detail-item">📍 {fields.Clínica}</span>
                      </div>
                    </div>
                    <button
                      className="action-btn delete"
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

      {/* Modales - usando el mismo estilo minimalista */}
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

      {/* Modal Clínica */}
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

      {/* Modal Sobrecupo */}
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
                <div className="form-field">
                  <label className="field-label">Médico</label>
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

                <div className="form-field">
                  <label className="field-label">Especialidad</label>
                  <input
                    type="text"
                    value={sobrecupoForm.especialidad}
                    onChange={(e) => setSobrecupoForm({...sobrecupoForm, especialidad: e.target.value})}
                    className="field-input"
                    placeholder="Se llena automáticamente"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Clínica</label>
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

                <div className="form-field">
                  <label className="field-label">Dirección</label>
                  <input
                    type="text"
                    value={sobrecupoForm.direccion}
                    onChange={(e) => setSobrecupoForm({...sobrecupoForm, direccion: e.target.value})}
                    className="field-input"
                    placeholder="Se llena automáticamente"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Fecha</label>
                  <input
                    type="date"
                    value={sobrecupoForm.fecha}
                    onChange={(e) => setSobrecupoForm({...sobrecupoForm, fecha: e.target.value})}
                    className="field-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Hora</label>
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
          position: relative;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          overflow-x: hidden;
          color: #171717;
        }

        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, 
            #fafafa 0%, 
            #f5f5f5 50%, 
            #e5e5e5 100%);
          z-index: -2;
        }

        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: -1;
        }

        .element {
          position: absolute;
          opacity: 0.03;
          transition: transform 0.1s ease-out;
        }

        .element-1 { top: 20%; right: 15%; }
        .element-2 { bottom: 25%; left: 10%; }
        .element-3 { top: 60%; right: 25%; }

        .geometric-circle {
          width: 120px;
          height: 120px;
          border: 1px solid #999;
          border-radius: 50%;
        }

        .geometric-square {
          width: 80px;
          height: 80px;
          border: 1px solid #999;
          transform: rotate(45deg);
        }

        .geometric-triangle {
          width: 0;
          height: 0;
          border-left: 40px solid transparent;
          border-right: 40px solid transparent;
          border-bottom: 70px solid #999;
        }

        /* Header minimalista */
        .admin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-button {
          background: none;
          border: none;
          color: #666;
          font-size: 0.875rem;
          font-weight: 400;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e5e5e5;
        }

        .back-button:hover {
          border-color: #171717;
          color: #171717;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 400;
          color: #171717;
          letter-spacing: 0.5px;
        }

        .header-logo {
          color: #171717;
        }

        .header-spacer {
          width: 64px;
        }

        /* Navegación estilo minimalista */
        .nav-tabs {
          display: flex;
          justify-content: center;
          gap: 0;
          padding: 2rem 2rem 0;
          background: transparent;
        }

        .nav-tab {
          background: none;
          border: none;
          border-bottom: 1px solid transparent;
          color: #999;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.75rem 1.5rem;
          font-family: inherit;
          letter-spacing: 0.5px;
        }

        .nav-tab:hover {
          color: #171717;
        }

        .nav-tab.active {
          color: #171717;
          border-bottom-color: #171717;
        }

        /* Container principal */
        .content-wrapper {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Mensajes */
        .message {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          font-weight: 400;
          text-align: center;
          border: 1px solid;
        }

        .message.success {
          background: #f8fff9;
          color: #166534;
          border-color: #bbf7d0;
        }

        .message.error {
          background: #fef8f8;
          color: #dc2626;
          border-color: #fecaca;
        }

        /* Dashboard */
        .dashboard-section {
          text-align: center;
        }

        .section-header {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 200;
          color: #171717;
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }

        .section-subtitle {
          font-size: 0.875rem;
          color: #666;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .subsection-title {
          font-size: 1rem;
          font-weight: 400;
          color: #171717;
          margin-bottom: 1.5rem;
          letter-spacing: 0.5px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 200;
          color: #171717;
          margin-bottom: 0.5rem;
          letter-spacing: -1px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 400;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .quick-actions {
          margin-top: 4rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .action-card:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .action-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .action-title {
          font-size: 0.75rem;
          font-weight: 400;
          color: #666;
          letter-spacing: 0.5px;
        }

        /* Secciones de lista */
        .list-section {
          max-width: 100%;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .primary-button {
          background: #171717;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .primary-button:hover {
          background: #000;
          transform: translateY(-1px);
        }

        .secondary-button {
          background: white;
          color: #666;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .secondary-button:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Controles de búsqueda */
        .search-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.8);
          font-family: inherit;
        }

        .search-input:focus {
          outline: none;
          border-color: #171717;
          background: white;
        }

        .filter-select {
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.8);
          min-width: 200px;
          font-family: inherit;
        }

        .filter-select:focus {
          outline: none;
          border-color: #171717;
          background: white;
        }

        /* Lista de elementos */
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .item-card {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .item-card:hover {
          background: white;
          border-color: rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .item-avatar {
          width: 48px;
          height: 48px;
          background: #171717;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 400;
          font-size: 0.875rem;
          letter-spacing: 0.5px;
        }

        .item-avatar.clinic {
          background: #666;
          font-size: 1.25rem;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-size: 1rem;
          font-weight: 400;
          color: #171717;
          margin: 0 0 0.25rem 0;
          letter-spacing: 0.25px;
        }

        .item-specialty {
          font-size: 0.875rem;
          color: #666;
          margin: 0 0 0.25rem 0;
          font-weight: 400;
        }

        .item-contact {
          font-size: 0.75rem;
          color: #999;
          margin: 0;
          font-weight: 400;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .action-btn.edit {
          background: #f0f9ff;
          color: #0284c7;
        }

        .action-btn.edit:hover {
          background: #e0f2fe;
        }

        .action-btn.delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .action-btn.delete:hover {
          background: #fee2e2;
        }

        /* Sobrecupos */
        .sobrecupos-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sobrecupo-card {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .sobrecupo-card:hover {
          background: white;
          border-color: rgba(0, 0, 0, 0.1);
        }

        .sobrecupo-info {
          flex: 1;
        }

        .sobrecupo-doctor {
          font-size: 1rem;
          font-weight: 400;
          color: #171717;
          margin: 0 0 0.25rem 0;
        }

        .sobrecupo-specialty {
          font-size: 0.875rem;
          color: #666;
          margin: 0 0 0.75rem 0;
        }

        .sobrecupo-details {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .detail-item {
          font-size: 0.75rem;
          color: #999;
          font-weight: 400;
        }

        /* Modales */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal {
          background: white;
          border-radius: 6px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 0;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 400;
          color: #171717;
          margin: 0;
          letter-spacing: 0.25px;
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border: none;
          background: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 0.875rem;
        }

        .modal-close:hover {
          background: #e5e5e5;
        }

        .modal-form {
          padding: 0 1.5rem 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 400;
          color: #171717;
          letter-spacing: 0.25px;
        }

        .field-input,
        .field-select {
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
          font-family: inherit;
          background: white;
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #171717;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          padding: 1rem;
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 400;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e5e5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }
          
          .admin-header {
            padding: 1rem;
          }
          
          .nav-tabs {
            padding: 1rem 1rem 0;
            overflow-x: auto;
            justify-content: flex-start;
          }
          
          .search-controls {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .item-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .sobrecupo-details {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .modal {
            margin: 1rem;
            max-width: calc(100% - 2rem);
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .section-title {
            font-size: 1.5rem;
          }
          
          .header-title {
            font-size: 0.875rem;
          }
          
          .nav-tab {
            font-size: 0.75rem;
            padding: 0.5rem 1rem;
          }
        }

        /* Smooth animations */
        * {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </main>
  );
}