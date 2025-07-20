'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSobrecuposPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorClinicas, setDoctorClinicas] = useState([]);
  const [selectedClinica, setSelectedClinica] = useState(null);
  const [loadingClinicas, setLoadingClinicas] = useState(false);
  const [clinica, setClinica] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [selectedHours, setSelectedHours] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [existingSobrecupos, setExistingSobrecupos] = useState([]);
  const [activeTab, setActiveTab] = useState("crear");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Horarios disponibles (cada 60 minutos)
  const availableHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00"
  ];

  useEffect(() => {
    fetchDoctors();
    if (activeTab === "gestionar") {
      fetchExistingSobrecupos();
    }
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Error cargando médicos");
    }
  };

  const fetchExistingSobrecupos = async () => {
    try {
      const res = await fetch("/api/sobrecupos");
      const data = await res.json();
      setExistingSobrecupos(data);
    } catch {
      setMsg("Error cargando sobrecupos existentes");
    }
  };

  // Función para obtener clínicas del médico seleccionado
  const fetchDoctorClinicas = async (doctorId) => {
    if (!doctorId) {
      setDoctorClinicas([]);
      setSelectedClinica(null);
      return;
    }

    setLoadingClinicas(true);
    try {
      const doctor = doctors.find(d => d.id === doctorId);
      
      if (!doctor?.fields?.Clinicas?.length) {
        setDoctorClinicas([]);
        setSelectedClinica(null);
        setMsg("⚠️ Este médico no tiene clínicas registradas");
        setLoadingClinicas(false);
        return;
      }

      const clinicasRes = await fetch(`/api/clinicas`);
      const todasClinicas = await clinicasRes.json();
      
      const clinicasDelMedico = todasClinicas.filter(c => 
        doctor.fields.Clinicas.includes(c.id)
      );
      
      setDoctorClinicas(clinicasDelMedico);
      
      if (clinicasDelMedico.length === 1) {
        const clinica = clinicasDelMedico[0];
        setSelectedClinica(clinica);
        setClinica(clinica.fields?.Nombre || "");
        setDireccion(clinica.fields?.Direccion || "");
      } else {
        setSelectedClinica(null);
        setClinica("");
        setDireccion("");
      }
      
    } catch (error) {
      console.error("Error cargando clínicas del médico:", error);
      setMsg("Error cargando clínicas del médico");
      setDoctorClinicas([]);
      setSelectedClinica(null);
    }
    setLoadingClinicas(false);
  };

  const handleDoctorSelection = (doctor) => {
    setSelectedDoctor(doctor);
    fetchDoctorClinicas(doctor.id);
    setClinica("");
    setDireccion("");
    setSelectedClinica(null);
    setMsg("");
  };

  const toggleHour = (hour) => {
    setSelectedHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort()
    );
  };

  const selectAllMorning = () => {
    const morningHours = availableHours.filter(hour => {
      const hourNum = parseInt(hour.split(':')[0]);
      return hourNum >= 8 && hourNum <= 12;
    });
    setSelectedHours(morningHours);
  };

  const selectAllAfternoon = () => {
    const afternoonHours = availableHours.filter(hour => {
      const hourNum = parseInt(hour.split(':')[0]);
      return hourNum >= 13 && hourNum <= 19;
    });
    setSelectedHours(afternoonHours);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor) {
      setMsg("❌ Debes seleccionar un médico");
      return;
    }
    
    if (selectedHours.length === 0) {
      setMsg("❌ Debes seleccionar al menos un horario");
      return;
    }

    if (!clinica.trim() || !direccion.trim() || !fecha) {
      setMsg("❌ Completa todos los campos requeridos");
      return;
    }

    if (!showPreview) {
      setShowPreview(true);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const promises = selectedHours.map(hora => 
        fetch("/api/sobrecupos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medico: selectedDoctor.id,
            especialidad: selectedDoctor.fields.Especialidad,
            clinica: clinica.trim(),
            direccion: direccion.trim(),
            fecha,
            hora
          }),
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.ok).length;
      
      if (successful === selectedHours.length) {
        setMsg(`✅ Se crearon ${successful} sobrecupos exitosamente`);
        resetForm();
      } else {
        setMsg(`⚠️ Se crearon ${successful} de ${selectedHours.length} sobrecupos`);
      }
    } catch (err) {
      setMsg("❌ Error en la red o el servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setDoctorClinicas([]);
    setSelectedClinica(null);
    setClinica("");
    setDireccion("");
    setFecha("");
    setSelectedHours([]);
    setShowPreview(false);
  };

  const deleteSobrecupo = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este sobrecupo?")) return;
    
    try {
      await fetch(`/api/sobrecupos?id=${id}`, { method: "DELETE" });
      fetchExistingSobrecupos();
      setMsg("✅ Sobrecupo eliminado");
    } catch {
      setMsg("❌ Error eliminando sobrecupo");
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
    <div className="admin-dashboard">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <SobrecuposLogo size={36} className="logo-icon" />
            <div className="logo-text">
              <span className="brand-name">Sobrecupos</span>
              <span className="brand-sub">Admin Panel</span>
            </div>
          </div>
          {/* Botón cerrar en móvil */}
          <button 
            className="close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => {
              setActiveTab("crear");
              setSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === "crear" ? "active" : ""}`}
          >
            <span className="nav-icon">➕</span>
            <span className="nav-label">Crear Sobrecupos</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("gestionar");
              setSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === "gestionar" ? "active" : ""}`}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Gestionar Existentes</span>
          </button>

          <div className="nav-divider"></div>

          <button
            onClick={() => {
              router.push("/admin/doctors");
              setSidebarOpen(false);
            }}
            className="nav-item"
          >
            <span className="nav-icon">👨‍⚕️</span>
            <span className="nav-label">Médicos</span>
          </button>

          <button
            onClick={() => {
              router.push("/admin/clinicas");
              setSidebarOpen(false);
            }}
            className="nav-item"
          >
            <span className="nav-icon">🏥</span>
            <span className="nav-label">Clínicas</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => {
              router.push('/');
              setSidebarOpen(false);
            }}
            className="nav-item back-home"
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Volver al inicio</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Header con hamburger y breadcrumbs */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            
            <div className="breadcrumbs">
              <button 
                onClick={() => router.push('/admin')}
                className="breadcrumb-btn"
              >
                <span className="breadcrumb-icon">⚙️</span>
                <span>Admin</span>
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb active">
                {activeTab === "crear" ? "Crear Sobrecupos" : "Gestionar Sobrecupos"}
              </span>
            </div>
          </div>
          
          {/* Notificaciones de estado */}
          {msg && (
            <div className={`notification ${msg.includes("✅") ? "success" : msg.includes("❌") ? "error" : "warning"}`}>
              <span className="notification-text">{msg}</span>
              <button 
                onClick={() => setMsg("")}
                className="notification-close"
              >
                ✕
              </button>
            </div>
          )}
        </header>

        {/* Contenido dinámico según tab activo */}
        <div className="content-area">
          {activeTab === "crear" && (
            <div className="create-section">
              {!showPreview ? (
                <div className="form-wizard">
                  {/* Paso 1: Selección de Médico */}
                  <div className="wizard-step">
                    <div className="step-header">
                      <div className="step-badge">1</div>
                      <div className="step-info">
                        <h2 className="step-title">Seleccionar Médico</h2>
                        <p className="step-subtitle">Elige el médico para el sobrecupo</p>
                      </div>
                    </div>
                    
                    <div className="doctors-grid">
                      {doctors.map(doctor => (
                        <div 
                          key={doctor.id}
                          className={`doctor-card ${selectedDoctor?.id === doctor.id ? "selected" : ""}`}
                          onClick={() => handleDoctorSelection(doctor)}
                        >
                          <div className="doctor-avatar">
                            <span className="avatar-text">
                              {doctor.fields.Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div className="doctor-details">
                            <h3 className="doctor-name">Dr. {doctor.fields.Name}</h3>
                            <p className="doctor-specialty">{doctor.fields.Especialidad}</p>
                          </div>
                          {selectedDoctor?.id === doctor.id && (
                            <div className="selection-indicator">
                              <span className="checkmark">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDoctor && (
                    <>
                      {/* Paso 2: Ubicación */}
                      <div className="wizard-step">
                        <div className="step-header">
                          <div className="step-badge">2</div>
                          <div className="step-info">
                            <h2 className="step-title">Ubicación</h2>
                            <p className="step-subtitle">Define dónde será la consulta</p>
                          </div>
                        </div>
                        
                        {loadingClinicas ? (
                          <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando clínicas del médico...</p>
                          </div>
                        ) : doctorClinicas.length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-icon">🏥</div>
                            <h3>No hay clínicas registradas</h3>
                            <p>Este médico no tiene clínicas asociadas</p>
                            <button
                              onClick={() => router.push("/admin/doctors")}
                              className="primary-button"
                            >
                              Agregar clínicas al médico
                            </button>
                          </div>
                        ) : (
                          <div className="location-selector">
                            <div className="form-group">
                              <label className="form-label">
                                Seleccionar clínica ({doctorClinicas.length} disponible{doctorClinicas.length !== 1 ? 's' : ''})
                              </label>
                              <div className="select-wrapper">
                                <select
                                  value={selectedClinica?.id || ""}
                                  onChange={(e) => {
                                    const clinica = doctorClinicas.find(c => c.id === e.target.value);
                                    setSelectedClinica(clinica);
                                    if (clinica) {
                                      setClinica(clinica.fields?.Nombre || "");
                                      setDireccion(clinica.fields?.Direccion || "");
                                    }
                                  }}
                                  className="form-select"
                                >
                                  <option value="">Selecciona una clínica...</option>
                                  {doctorClinicas.map(clinica => (
                                    <option key={clinica.id} value={clinica.id}>
                                      {clinica.fields?.Nombre} - {clinica.fields?.Comuna}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            {selectedClinica && (
                              <div className="selected-clinic">
                                <div className="clinic-info">
                                  <h4 className="clinic-name">
                                    <span className="clinic-icon">🏥</span>
                                    {selectedClinica.fields?.Nombre}
                                  </h4>
                                  <p className="clinic-address">
                                    <span className="address-icon">📍</span>
                                    {selectedClinica.fields?.Direccion}
                                  </p>
                                  <p className="clinic-commune">
                                    <span className="commune-icon">🏛️</span>
                                    {selectedClinica.fields?.Comuna}
                                  </p>
                                  {selectedClinica.fields?.Telefono && (
                                    <p className="clinic-phone">
                                      <span className="phone-icon">📞</span>
                                      {selectedClinica.fields.Telefono}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Opción para dirección personalizada */}
                            <div className="custom-location-section">
                              <div className="toggle-section">
                                <label className="toggle-container">
                                  <input
                                    type="checkbox"
                                    checked={!selectedClinica}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedClinica(null);
                                        setClinica("");
                                        setDireccion("");
                                      }
                                    }}
                                    className="toggle-input"
                                  />
                                  <span className="toggle-slider"></span>
                                  <span className="toggle-label">Usar dirección personalizada</span>
                                </label>
                              </div>
                              
                              {!selectedClinica && (
                                <div className="custom-inputs">
                                  <div className="form-group">
                                    <label className="form-label">Clínica/Centro médico</label>
                                    <input
                                      type="text"
                                      value={clinica}
                                      onChange={e => setClinica(e.target.value)}
                                      placeholder="Ej: Consulta particular"
                                      className="form-input"
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label className="form-label">Dirección</label>
                                    <input
                                      type="text"
                                      value={direccion}
                                      onChange={e => setDireccion(e.target.value)}
                                      placeholder="Ej: Av. Las Condes 123"
                                      className="form-input"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Paso 3: Fecha y Horarios */}
                      {(selectedClinica || (!selectedClinica && clinica && direccion)) && (
                        <div className="wizard-step">
                          <div className="step-header">
                            <div className="step-badge">3</div>
                            <div className="step-info">
                              <h2 className="step-title">Fecha y Horarios</h2>
                              <p className="step-subtitle">Define cuándo estará disponible</p>
                            </div>
                          </div>
                          
                          <div className="datetime-section">
                            <div className="form-group">
                              <label className="form-label">Fecha</label>
                              <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="form-input date-input"
                              />
                            </div>
                            
                            <div className="hours-selection">
                              <div className="hours-header">
                                <label className="form-label">Horarios disponibles</label>
                                <div className="quick-actions">
                                  <button
                                    onClick={selectAllMorning}
                                    className="quick-button morning"
                                    type="button"
                                  >
                                    🌅 Mañana
                                  </button>
                                  <button
                                    onClick={selectAllAfternoon}
                                    className="quick-button afternoon"
                                    type="button"
                                  >
                                    🌆 Tarde
                                  </button>
                                  <button
                                    onClick={() => setSelectedHours([])}
                                    className="quick-button clear"
                                    type="button"
                                  >
                                    🗑️ Limpiar
                                  </button>
                                </div>
                              </div>
                              
                              <div className="hours-grid">
                                {availableHours.map(hour => (
                                  <button
                                    key={hour}
                                    type="button"
                                    className={`hour-chip ${selectedHours.includes(hour) ? "selected" : ""}`}
                                    onClick={() => toggleHour(hour)}
                                  >
                                    {hour}
                                  </button>
                                ))}
                              </div>
                              
                              {selectedHours.length > 0 && (
                                <div className="selection-summary">
                                  <span className="selection-count">
                                    {selectedHours.length} horario{selectedHours.length !== 1 ? 's' : ''} seleccionado{selectedHours.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón de acción */}
                      {(selectedClinica || (!selectedClinica && clinica && direccion)) && fecha && selectedHours.length > 0 && (
                        <div className="action-section">
                          <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="action-button primary"
                          >
                            {loading ? (
                              <>
                                <div className="spinner small"></div>
                                <span>Procesando...</span>
                              </>
                            ) : (
                              <>
                                <span className="button-icon">👁️</span>
                                <span>Vista Previa</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Vista Previa */
                <div className="preview-section">
                  <div className="preview-header">
                    <h2 className="preview-title">Confirmar Creación de Sobrecupos</h2>
                    <p className="preview-subtitle">Revisa la información antes de crear</p>
                  </div>
                  
                  <div className="preview-content">
                    <div className="preview-card">
                      <h3 className="preview-section-title">👨‍⚕️ Médico</h3>
                      <div className="preview-doctor">
                        <div className="preview-avatar">
                          {selectedDoctor.fields.Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="preview-doctor-info">
                          <h4 className="preview-doctor-name">Dr. {selectedDoctor.fields.Name}</h4>
                          <p className="preview-doctor-specialty">{selectedDoctor.fields.Especialidad}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="preview-card">
                      <h3 className="preview-section-title">📍 Ubicación</h3>
                      <div className="preview-location">
                        <p className="preview-clinic-name">{clinica}</p>
                        <p className="preview-address">{direccion}</p>
                        {selectedClinica && (
                          <span className="clinic-badge">Clínica registrada</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="preview-card">
                      <h3 className="preview-section-title">🗓️ Programación</h3>
                      <div className="preview-schedule">
                        <p className="preview-date">
                          <strong>{formatDate(fecha)}</strong>
                        </p>
                        <div className="preview-hours">
                          {selectedHours.map(hour => (
                            <span key={hour} className="preview-hour-chip">
                              {hour}
                            </span>
                          ))}
                        </div>
                        <p className="preview-total">
                          Total: <strong>{selectedHours.length} sobrecupo{selectedHours.length !== 1 ? 's' : ''}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="preview-actions">
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="action-button secondary"
                    >
                      <span className="button-icon">←</span>
                      <span>Editar</span>
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="action-button primary large"
                    >
                      {loading ? (
                        <>
                          <div className="spinner small"></div>
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <span className="button-icon">✅</span>
                          <span>Crear {selectedHours.length} Sobrecupo{selectedHours.length !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab de Gestionar Existentes */}
          {activeTab === "gestionar" && (
            <div className="manage-section">
              <div className="section-header">
                <h2 className="section-title">Sobrecupos Existentes</h2>
                <p className="section-subtitle">Gestiona los sobrecupos creados</p>
              </div>
              
              {existingSobrecupos.length === 0 ? (
                <div className="empty-state large">
                  <div className="empty-icon">📋</div>
                  <h3 className="empty-title">No hay sobrecupos creados</h3>
                  <p className="empty-description">
                    Aún no tienes sobrecupos en el sistema. Crea el primero para comenzar.
                  </p>
                  <button
                    onClick={() => setActiveTab("crear")}
                    className="primary-button"
                  >
                    <span className="button-icon">➕</span>
                    <span>Crear primer sobrecupo</span>
                  </button>
                </div>
              ) : (
                <div className="sobrecupos-grid">
                  {existingSobrecupos.map((sobrecupo, index) => (
                    <div key={index} className="sobrecupo-item">
                      <div className="sobrecupo-header">
                        <div className="doctor-info">
                          <h4 className="doctor-name">
                            {sobrecupo.fields?.MedicoNombre || `Dr. ${sobrecupo.fields?.Médico?.[0] || 'Desconocido'}`}
                          </h4>
                          <p className="specialty">{sobrecupo.fields?.Especialidad}</p>
                        </div>
                        <button 
                          onClick={() => deleteSobrecupo(sobrecupo.id)}
                          className="delete-button"
                          title="Eliminar sobrecupo"
                        >
                          <span className="delete-icon">🗑️</span>
                        </button>
                      </div>
                      <div className="sobrecupo-details">
                        <div className="detail-item">
                          <span className="detail-icon">🗓️</span>
                          <span className="detail-text">
                            {formatDate(sobrecupo.fields?.Fecha)} - {sobrecupo.fields?.Hora}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🏥</span>
                          <span className="detail-text">{sobrecupo.fields?.Clínica}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        /* ===================
           VARIABLES & RESET
        =================== */
        :root {
          --primary: #007aff;
          --primary-dark: #0051d5;
          --secondary: #5856d6;
          --success: #34c759;
          --warning: #ff9500;
          --error: #ff3b30;
          --background: #f8faff;
          --surface: #ffffff;
          --text-primary: #1a1a1a;
          --text-secondary: #8e8e93;
          --border: #e5e5e7;
          --shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          --radius: 16px;
          --radius-small: 8px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--background) 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          color: var(--text-primary);
          position: relative;
        }

        /* ===================
           SIDEBAR STYLES
        =================== */
        .sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          width: 280px;
          z-index: 1000;
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 2px 4px rgba(0, 122, 255, 0.2));
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }

        .brand-sub {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .close-sidebar-btn {
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-small);
          transition: var(--transition);
          display: none;
        }

        .close-sidebar-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: 4px;
          text-align: left;
          color: #3c3c43;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(0, 122, 255, 0.08);
          color: var(--primary);
          transform: translateX(2px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .nav-item.active:hover {
          transform: translateX(0);
          background: linear-gradient(135deg, var(--primary-dark), #4c46c7);
        }

        .nav-icon {
          font-size: 18px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          font-weight: 600;
        }

        .nav-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 16px;
        }

        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid var(--border);
        }

        .back-home {
          color: var(--text-secondary) !important;
          font-size: 13px !important;
        }

        .back-home:hover {
          color: var(--primary) !important;
          background: rgba(0, 122, 255, 0.06) !important;
        }

        /* ===================
           MAIN CONTENT STYLES
        =================== */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          margin-left: 0;
        }

        .main-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hamburger-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-small);
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: var(--transition);
        }

        .hamburger-btn:hover {
          background: rgba(0, 122, 255, 0.1);
        }

        .hamburger-line {
          width: 20px;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: var(--transition);
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
        }

        .breadcrumb-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-small);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
        }

        .breadcrumb-btn:hover {
          background: rgba(0, 122, 255, 0.1);
          color: var(--primary);
        }

        .breadcrumb-icon {
          font-size: 12px;
        }

        .breadcrumb.active {
          color: var(--text-primary);
          font-weight: 600;
        }

        .breadcrumb-separator {
          color: #d1d1d6;
        }

        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          animation: slideInFromTop 0.3s ease;
          max-width: 400px;
        }

        .notification.success {
          background: linear-gradient(135deg, #e6ffed, #d4ffdc);
          color: #006400;
          border: 1px solid #c3e6cb;
        }

        .notification.error {
          background: linear-gradient(135deg, #ffe6e6, #ffdbdb);
          color: #b00020;
          border: 1px solid #f5c6cb;
        }

        .notification.warning {
          background: linear-gradient(135deg, #fff8e1, #ffecb3);
          color: #e65100;
          border: 1px solid #ffeaa7;
        }

        .notification-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-close:hover {
          opacity: 1;
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .content-area {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        /* ===================
           WIZARD FORM STYLES
        =================== */
        .form-wizard {
          max-width: 900px;
          margin: 0 auto;
        }

        .wizard-step {
          background: var(--surface);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: var(--transition);
        }

        .wizard-step:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .step-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .step-info {
          flex: 1;
        }

        .step-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .step-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 500;
        }

        /* ===================
           DOCTORS GRID
        =================== */
        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .doctor-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 2px solid #f0f0f0;
          border-radius: var(--radius);
          cursor: pointer;
          transition: var(--transition);
          background: #fafbff;
          position: relative;
          overflow: hidden;
        }

        .doctor-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.02), rgba(88, 86, 214, 0.02));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .doctor-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 122, 255, 0.15);
        }

        .doctor-card:hover::before {
          opacity: 1;
        }

        .doctor-card.selected {
          border-color: var(--primary);
          background: linear-gradient(135deg, #f0f8ff, #e8f4ff);
          box-shadow: 0 8px 32px rgba(0, 122, 255, 0.2);
        }

        .doctor-card.selected::before {
          opacity: 1;
        }

        .doctor-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
          position: relative;
          z-index: 1;
        }

        .doctor-details {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .doctor-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
          line-height: 1.3;
        }

        .doctor-specialty {
          font-size: 14px;
          color: var(--primary);
          margin: 0;
          font-weight: 600;
        }

        .selection-indicator {
          position: relative;
          z-index: 1;
        }

        .checkmark {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--success);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
          animation: checkmarkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* ===================
           FORM ELEMENTS
        =================== */
        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .form-input, .form-select {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border);
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          background: var(--surface);
          transition: var(--transition);
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
          transform: translateY(-1px);
        }

        .select-wrapper {
          position: relative;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 16px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 48px;
        }

        .date-input {
          color-scheme: light;
        }

        /* ===================
           LOADING & EMPTY STATES
        =================== */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 48px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 48px 20px;
          text-align: center;
          background: #fafbff;
          border: 2px dashed #d1d1d6;
          border-radius: var(--radius);
        }

        .empty-state.large {
          padding: 64px 32px;
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .empty-description {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
          max-width: 400px;
        }

        /* ===================
           CLINIC SELECTION
        =================== */
        .selected-clinic {
          background: linear-gradient(135deg, #e6ffed, #d4ffdc);
          border: 2px solid #c3e6cb;
          border-radius: var(--radius);
          padding: 24px;
          margin-top: 16px;
        }

        .clinic-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .clinic-name {
          font-size: 18px;
          font-weight: 700;
          color: #006400;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clinic-address, .clinic-commune, .clinic-phone {
          font-size: 14px;
          color: #2d5a2d;
          margin: 0;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clinic-icon, .address-icon, .commune-icon, .phone-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        /* ===================
           TOGGLE SWITCH
        =================== */
        .custom-location-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .toggle-section {
          margin-bottom: 20px;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--primary);
        }

        .toggle-input {
          position: relative;
          width: 44px;
          height: 24px;
          appearance: none;
          background: var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition);
        }

        .toggle-input:checked {
          background: var(--primary);
        }

        .toggle-input::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: var(--transition);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .toggle-input:checked::before {
          transform: translateX(20px);
        }

        .custom-inputs {
          background: #f8faff;
          border: 2px solid #e8f2ff;
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ===================
           HOURS SELECTION
        =================== */
        .hours-selection {
          margin-top: 20px;
        }

        .hours-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quick-button {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-small);
          background: var(--surface);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .quick-button.morning {
          color: var(--warning);
          border-color: var(--warning);
        }

        .quick-button.afternoon {
          color: var(--secondary);
          border-color: var(--secondary);
        }

        .quick-button.clear {
          color: var(--error);
          border-color: var(--error);
        }

        .quick-button:hover {
          background: currentColor;
          color: white;
          transform: translateY(-1px);
        }

        .hours-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .hour-chip {
          padding: 14px 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
        }

        .hour-chip:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
        }

        .hour-chip.selected {
          border-color: var(--primary);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
          transform: translateY(-2px);
        }

        .selection-summary {
          text-align: center;
          padding: 16px;
          background: #f0f8ff;
          border-radius: 12px;
          border: 1px solid #b3d9ff;
        }

        .selection-count {
          font-size: 14px;
          color: var(--primary-dark);
          font-weight: 600;
        }

        /* ===================
           BUTTONS
        =================== */
        .primary-button, .action-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
          font-family: inherit;
        }

        .primary-button, .action-button.primary {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .primary-button:hover, .action-button.primary:hover {
          background: linear-gradient(135deg, var(--primary-dark), #4c46c7);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
        }

        .action-button.secondary {
          background: var(--surface);
          color: var(--primary);
          border: 2px solid var(--primary);
        }

        .action-button.secondary:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }

        .action-button.large {
          padding: 18px 32px;
          font-size: 18px;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .button-icon {
          font-size: 18px;
        }

        .action-section {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        /* ===================
           PREVIEW SECTION
        =================== */
        .preview-section {
          max-width: 700px;
          margin: 0 auto;
        }

        .preview-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .preview-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 8px;
        }

        .preview-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }

        .preview-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }

        .preview-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0 0 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-doctor {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .preview-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
        }

        .preview-doctor-info {
          flex: 1;
        }

        .preview-doctor-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .preview-doctor-specialty {
          font-size: 14px;
          color: var(--primary);
          margin: 0;
          font-weight: 600;
        }

        .preview-location {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-clinic-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .preview-address {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .clinic-badge {
          font-size: 12px;
          color: var(--success);
          background: #e6ffed;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          align-self: flex-start;
        }

        .preview-schedule {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .preview-date {
          font-size: 18px;
          color: var(--text-primary);
          margin: 0;
        }

        .preview-hours {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preview-hour-chip {
          background: var(--primary);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .preview-total {
          font-size: 16px;
          color: var(--text-primary);
          margin: 0;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        /* ===================
           MANAGE SECTION
        =================== */
        .manage-section {
          max-width: 1000px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 8px;
        }

        .section-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
        }

        .sobrecupos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .sobrecupo-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          transition: var(--transition);
        }

        .sobrecupo-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .sobrecupo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .specialty {
          font-size: 14px;
          color: var(--primary);
          margin: 0;
          font-weight: 600;
        }

        .delete-button {
          background: var(--error);
          color: white;
          border: none;
          border-radius: var(--radius-small);
          padding: 8px 10px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button:hover {
          background: #d70015;
          transform: scale(1.05);
        }

        .delete-icon {
          font-size: 14px;
        }

        .sobrecupo-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #3c3c43;
        }

        .detail-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .detail-text {
          font-weight: 500;
        }

        /* ===================
           RESPONSIVE DESIGN
        =================== */
        @media (min-width: 1024px) {
          .sidebar {
            position: static;
            transform: translateX(0);
            height: 100vh;
          }

          .main-content {
            margin-left: 280px;
          }

          .hamburger-btn {
            display: none;
          }

          .close-sidebar-btn {
            display: none;
          }

          .sidebar-overlay {
            display: none;
          }
        }

        @media (max-width: 1023px) {
          .close-sidebar-btn {
            display: block;
          }

          .main-header {
            padding: 12px 16px;
          }

          .content-area {
            padding: 20px 16px;
          }

          .wizard-step {
            padding: 24px 20px;
          }

          .step-title {
            font-size: 20px;
          }

          .doctors-grid {
            grid-template-columns: 1fr;
          }

          .hours-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .sobrecupos-grid {
            grid-template-columns: 1fr;
          }

          .hours-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .quick-actions {
            justify-content: center;
          }

          .preview-actions {
            flex-direction: column;
            gap: 12px;
          }

          .action-button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .main-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .header-left {
            justify-content: space-between;
          }

          .breadcrumbs {
            font-size: 12px;
          }

          .notification {
            font-size: 13px;
            padding: 10px 16px;
          }

          .wizard-step {
            padding: 20px 16px;
            margin-bottom: 16px;
          }

          .step-header {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .step-badge {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }

          .step-title {
            font-size: 18px;
          }

          .step-subtitle {
            font-size: 14px;
          }

          .doctor-card {
            padding: 16px;
          }

          .doctor-avatar {
            width: 48px;
            height: 48px;
            font-size: 16px;
          }

          .doctor-name {
            font-size: 16px;
          }

          .doctor-specialty {
            font-size: 13px;
          }

          .form-input, .form-select {
            padding: 14px 16px;
            font-size: 16px;
          }

          .hours-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .hour-chip {
            padding: 12px 8px;
            font-size: 13px;
          }

          .quick-button {
            font-size: 11px;
            padding: 6px 8px;
          }

          .preview-section, .form-wizard {
            max-width: 100%;
          }

          .preview-card {
            padding: 20px;
          }

          .sobrecupo-item {
            padding: 16px;
          }

          .empty-state {
            padding: 32px 16px;
          }

          .empty-icon {
            font-size: 36px;
          }

          .empty-title {
            font-size: 18px;
          }

          .empty-description {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .content-area {
            padding: 16px 12px;
          }

          .wizard-step {
            padding: 16px 12px;
          }

          .step-title {
            font-size: 16px;
          }

          .step-subtitle {
            font-size: 13px;
          }

          .doctor-card {
            padding: 12px;
          }

          .doctor-avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .doctor-name {
            font-size: 14px;
          }

          .doctor-specialty {
            font-size: 12px;
          }

          .form-input, .form-select {
            padding: 12px 14px;
            font-size: 15px;
          }

          .hours-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }

          .hour-chip {
            padding: 10px 6px;
            font-size: 12px;
          }

          .preview-card {
            padding: 16px;
          }

          .preview-title {
            font-size: 22px;
          }

          .preview-subtitle {
            font-size: 14px;
          }

          .sobrecupo-item {
            padding: 14px;
          }

          .empty-state {
            padding: 24px 12px;
          }

          .breadcrumbs {
            flex-wrap: wrap;
          }

          .breadcrumb-btn {
            font-size: 12px;
            padding: 2px 6px;
          }
        }

        /* ===================
           ANIMATIONS
        =================== */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .wizard-step {
          animation: fadeInUp 0.5s ease;
        }

        .sobrecupo-item {
          animation: fadeInUp 0.3s ease;
        }

        .notification {
          animation: slideInFromTop 0.3s ease;
        }

        /* ===================
           ACCESSIBILITY & UX
        =================== */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        .nav-item:focus,
        .doctor-card:focus,
        .hour-chip:focus,
        .form-input:focus,
        .form-select:focus,
        .action-button:focus,
        .primary-button:focus,
        .hamburger-btn:focus,
        .breadcrumb-btn:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        /* ===================
           DARK MODE SUPPORT
        =================== */
        @media (prefers-color-scheme: dark) {
          :root {
            --background: #1c1c1e;
            --surface: #2c2c2e;
            --text-primary: #ffffff;
            --text-secondary: #8e8e93;
            --border: rgba(255, 255, 255, 0.1);
          }

          .admin-dashboard {
            background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%);
          }

          .main-header {
            background: rgba(28, 28, 30, 0.95);
          }

          .form-input, .form-select {
            background: #3a3a3c;
            color: #ffffff;
          }

          .doctor-card {
            background: #2c2c2e;
          }

          .hour-chip {
            background: #3a3a3c;
            color: #ffffff;
          }

          .hamburger-line {
            background: #ffffff;
          }
        }

        /* ===================
           PRINT STYLES
        =================== */
        @media print {
          .sidebar,
          .hamburger-btn,
          .action-button,
          .primary-button,
          .delete-button {
            display: none;
          }

          .main-content {
            margin-left: 0;
          }

          .wizard-step,
          .preview-card,
          .sobrecupo-item {
            box-shadow: none;
            border: 1px solid #000;
          }
        }

        /* ===================
           SMOOTH SCROLLING
        =================== */
        html {
          scroll-behavior: smooth;
        }

        .content-area {
          scroll-behavior: smooth;
        }

        /* ===================
           FOCUS MANAGEMENT
        =================== */
        .sidebar:focus-within {
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
        }

        /* ===================
           LOADING STATES
        =================== */
        .loading-state p {
          font-style: italic;
          color: var(--text-secondary);
        }

        /* ===================
           HIGH CONTRAST MODE
        =================== */
        @media (prefers-contrast: high) {
          .nav-item.active {
            background: #000000;
            color: #ffffff;
          }

          .primary-button, .action-button.primary {
            background: #000000;
          }

          .doctor-card.selected {
            border-color: #000000;
            background: #ffffff;
          }
        }
      `}</style>
    </div>
  );
}