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
      // Obtener información del médico
      const doctor = doctors.find(d => d.id === doctorId);
      
      if (!doctor?.fields?.Clinicas?.length) {
        setDoctorClinicas([]);
        setSelectedClinica(null);
        setMsg("⚠️ Este médico no tiene clínicas registradas");
        setLoadingClinicas(false);
        return;
      }

      // Obtener todas las clínicas
      const clinicasRes = await fetch(`/api/clinicas`);
      const todasClinicas = await clinicasRes.json();
      
      // Filtrar solo las clínicas del médico
      const clinicasDelMedico = todasClinicas.filter(c => 
        doctor.fields.Clinicas.includes(c.id)
      );
      
      setDoctorClinicas(clinicasDelMedico);
      
      // Auto-seleccionar si solo tiene una clínica
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

  // Función mejorada para manejar selección de médico
  const handleDoctorSelection = (doctor) => {
    setSelectedDoctor(doctor);
    fetchDoctorClinicas(doctor.id);
    // Limpiar campos
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

  // Helper para obtener nombre real del médico
  const getDoctorName = (doctor) => {
    return `Dr. ${doctor.fields?.Name || 'Desconocido'}`;
  };

  return (
    <main className="admin-container">
      {/* Header móvil optimizado */}
      <div className="mobile-header">
        <button
          onClick={() => router.push('/')}
          className="back-button"
        >
          ← Inicio
        </button>
        <div className="header-title">Admin Panel</div>
        <div className="header-spacer"></div>
      </div>

      {/* Navegación adicional */}
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

      {/* Navegación por tabs móvil */}
      <div className="mobile-tabs">
        <button 
          className={`tab-button ${activeTab === "crear" ? "active" : ""}`}
          onClick={() => setActiveTab("crear")}
        >
          💼 Crear
        </button>
        <button 
          className={`tab-button ${activeTab === "gestionar" ? "active" : ""}`}
          onClick={() => setActiveTab("gestionar")}
        >
          📋 Gestionar
        </button>
      </div>

      <div className="content-container">
        {/* Mensajes de estado móvil */}
        {msg && (
          <div className={`mobile-message ${msg.includes("✅") ? "success" : msg.includes("❌") ? "error" : "warning"}`}>
            {msg}
          </div>
        )}

        {/* Tab de Crear Sobrecupos */}
        {activeTab === "crear" && (
          <div className="mobile-form-container">
            {!showPreview ? (
              <div className="form-steps">
                {/* Paso 1: Médico */}
                <div className="step-section">
                  <div className="step-header">
                    <div className="step-number">1</div>
                    <h2 className="step-title">Seleccionar Médico</h2>
                  </div>
                  
                  <div className="doctors-grid">
                    {doctors.map(doctor => (
                      <div 
                        key={doctor.id}
                        className={`doctor-card ${selectedDoctor?.id === doctor.id ? "selected" : ""}`}
                        onClick={() => handleDoctorSelection(doctor)}
                      >
                        <div className="doctor-avatar">
                          {doctor.fields.Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="doctor-info">
                          <div className="doctor-name">
                            Dr. {doctor.fields.Name}
                          </div>
                          <div className="doctor-specialty">
                            {doctor.fields.Especialidad}
                          </div>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <div className="selected-check">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDoctor && (
                  <>
                    {/* Paso 2: Ubicación con Clínicas */}
                    <div className="step-section">
                      <div className="step-header">
                        <div className="step-number">2</div>
                        <h2 className="step-title">Ubicación</h2>
                      </div>
                      
                      {loadingClinicas ? (
                        <div className="loading-clinicas">
                          <p>⏳ Cargando clínicas del médico...</p>
                        </div>
                      ) : doctorClinicas.length === 0 ? (
                        <div className="no-clinicas-warning">
                          <p>⚠️ Este médico no tiene clínicas registradas</p>
                          <button
                            onClick={() => router.push("/admin/doctors")}
                            className="add-clinicas-btn"
                            type="button"
                          >
                            ➕ Agregar clínicas al médico
                          </button>
                        </div>
                      ) : (
                        <div className="clinicas-selection">
                          <div className="input-group">
                            <label className="input-label">
                              Clínica ({doctorClinicas.length} disponible{doctorClinicas.length !== 1 ? 's' : ''})
                            </label>
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
                              className="form-input clinic-select"
                            >
                              <option value="">Selecciona clínica...</option>
                              {doctorClinicas.map(clinica => (
                                <option key={clinica.id} value={clinica.id}>
                                  {clinica.fields?.Nombre} - {clinica.fields?.Comuna}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {selectedClinica && (
                            <div className="selected-clinic-info">
                              <div className="clinic-details">
                                <h4 className="clinic-name">🏥 {selectedClinica.fields?.Nombre}</h4>
                                <p className="clinic-address">📍 {selectedClinica.fields?.Direccion}</p>
                                <p className="clinic-comuna">🏛️ {selectedClinica.fields?.Comuna}</p>
                                {selectedClinica.fields?.Telefono && (
                                  <p className="clinic-phone">📞 {selectedClinica.fields.Telefono}</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Opción para usar dirección personalizada */}
                          <div className="custom-location">
                            <div className="custom-toggle">
                              <label className="toggle-label">
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
                                  className="toggle-checkbox"
                                />
                                <span className="toggle-text">📝 Usar dirección personalizada</span>
                              </label>
                            </div>
                            
                            {!selectedClinica && (
                              <div className="custom-inputs">
                                <div className="input-group">
                                  <label className="input-label">Clínica/Centro médico</label>
                                  <input
                                    type="text"
                                    value={clinica}
                                    onChange={e => setClinica(e.target.value)}
                                    placeholder="Ej: Consulta particular"
                                    className="form-input"
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Dirección</label>
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
                      <div className="step-section">
                        <div className="step-header">
                          <div className="step-number">3</div>
                          <h2 className="step-title">Fecha y Horarios</h2>
                        </div>
                        
                        <div className="date-section">
                          <label className="input-label">Fecha</label>
                          <input
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="form-input date-input"
                          />
                        </div>
                        
                        <div className="hours-section">
                          <div className="hours-header">
                            <label className="input-label">Horarios</label>
                            <div className="quick-select">
                              <button
                                onClick={selectAllMorning}
                                className="quick-btn"
                                type="button"
                              >
                                🌅 Mañana
                              </button>
                              <button
                                onClick={selectAllAfternoon}
                                className="quick-btn"
                                type="button"
                              >
                                🌆 Tarde
                              </button>
                              <button
                                onClick={() => setSelectedHours([])}
                                className="quick-btn clear"
                                type="button"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="hours-grid">
                            {availableHours.map(hour => (
                              <button
                                key={hour}
                                type="button"
                                className={`hour-button ${selectedHours.includes(hour) ? "selected" : ""}`}
                                onClick={() => toggleHour(hour)}
                              >
                                {hour}
                              </button>
                            ))}
                          </div>
                          
                          <div className="selected-count">
                            {selectedHours.length} horarios seleccionados
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="submit-section">
                      <button 
                        onClick={handleSubmit}
                        disabled={loading || !clinica.trim() || !direccion.trim() || !fecha || selectedHours.length === 0}
                        className="submit-button"
                      >
                        {loading ? "⏳ Procesando..." : "👁️ Vista Previa"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Vista Previa Móvil */
              <div className="preview-container">
                <div className="preview-header">
                  <h2 className="preview-title">Confirmar Sobrecupos</h2>
                  <p className="preview-subtitle">Revisa antes de crear</p>
                </div>
                
                <div className="preview-content">
                  <div className="preview-section">
                    <h3 className="preview-section-title">Médico</h3>
                    <div className="preview-doctor">
                      <div className="preview-doctor-avatar">
                        {selectedDoctor.fields.Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="preview-doctor-name">
                          Dr. {selectedDoctor.fields.Name}
                        </div>
                        <div className="preview-doctor-specialty">
                          {selectedDoctor.fields.Especialidad}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="preview-section">
                    <h3 className="preview-section-title">Ubicación</h3>
                    <div className="preview-location">
                      <div className="preview-clinic">{clinica}</div>
                      <div className="preview-address">📍 {direccion}</div>
                      {selectedClinica && (
                        <div className="preview-clinic-badge">🏥 Clínica registrada</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="preview-section">
                    <h3 className="preview-section-title">Fecha y Horarios ({selectedHours.length})</h3>
                    <div className="preview-date">
                      📅 {formatDate(fecha)}
                    </div>
                    <div className="preview-hours">
                      {selectedHours.map(hour => (
                        <span key={hour} className="preview-hour">
                          {hour}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="preview-actions">
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="preview-button secondary"
                  >
                    ← Editar
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="preview-button primary"
                  >
                    {loading ? "⏳ Creando..." : `✅ Crear ${selectedHours.length}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab de Gestionar Existentes */}
        {activeTab === "gestionar" && (
          <div className="manage-container">
            <div className="manage-header">
              <h2 className="manage-title">Sobrecupos Existentes</h2>
            </div>
            
            {existingSobrecupos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3 className="empty-title">No hay sobrecupos</h3>
                <p className="empty-text">Crea tu primer sobrecupo</p>
                <button
                  onClick={() => setActiveTab("crear")}
                  className="empty-button"
                >
                  💼 Crear Sobrecupo
                </button>
              </div>
            ) : (
              <div className="sobrecupos-list">
                {existingSobrecupos.map((sobrecupo, index) => (
                  <div key={index} className="sobrecupo-card">
                    <div className="sobrecupo-info">
                      <div className="sobrecupo-doctor">
                        {sobrecupo.fields?.MedicoNombre || `Dr. ${sobrecupo.fields?.Médico?.[0] || 'Desconocido'}`}
                      </div>
                      <div className="sobrecupo-specialty">
                        {sobrecupo.fields?.Especialidad}
                      </div>
                      <div className="sobrecupo-datetime">
                        📅 {formatDate(sobrecupo.fields?.Fecha)} • 🕐 {sobrecupo.fields?.Hora}
                      </div>
                      <div className="sobrecupo-location">
                        📍 {sobrecupo.fields?.Clínica}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteSobrecupo(sobrecupo.id)}
                      className="delete-button"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
        }

        .header-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
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

        /* Mensajes Móvil */
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

        /* Formulario Móvil */
        .mobile-form-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .form-steps {
          display: flex;
          flex-direction: column;
        }

        .step-section {
          padding: 20px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .step-section:last-child {
          border-bottom: none;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #007aff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        /* Grid de Médicos Móvil */
        .doctors-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doctor-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1.5px solid #f0f0f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .doctor-card.selected {
          border-color: #007aff;
          background: #f8faff;
        }

        .doctor-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .doctor-info {
          flex: 1;
          min-width: 0;
        }

        .doctor-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doctor-specialty {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selected-check {
          color: #007aff;
          font-size: 16px;
          font-weight: 700;
          margin-left: 8px;
        }

        /* Inputs Móvil */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .form-input {
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 10px;
          font-size: 15px;
          background: white;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .form-input:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .date-input {
          color-scheme: light;
        }

        /* Estilos para la selección de clínicas */
        .loading-clinicas {
          text-align: center;
          padding: 20px;
          color: #8e8e93;
          font-style: italic;
        }

        .no-clinicas-warning {
          text-align: center;
          padding: 20px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 12px;
          color: #856404;
        }

        .no-clinicas-warning p {
          margin: 0 0 12px;
          font-weight: 500;
        }

        .add-clinicas-btn {
          background: #007aff;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-clinicas-btn:active {
          transform: scale(0.95);
        }

        .clinicas-selection {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .clinic-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
          appearance: none;
        }

        .selected-clinic-info {
          background: #e6ffed;
          border: 1px solid #c3e6cb;
          border-radius: 12px;
          padding: 16px;
        }

        .clinic-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .clinic-name {
          font-size: 15px;
          font-weight: 700;
          color: #006400;
          margin: 0;
        }

        .clinic-address, .clinic-comuna, .clinic-phone {
          font-size: 13px;
          color: #2d5a2d;
          margin: 0;
          font-weight: 500;
        }

        .custom-location {
          border-top: 1px solid #e5e5e7;
          padding-top: 16px;
        }

        .custom-toggle {
          margin-bottom: 12px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .toggle-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .toggle-text {
          font-size: 13px;
          font-weight: 600;
          color: #007aff;
        }

        .custom-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: #f8faff;
          border: 1px solid #e5e5e7;
          border-radius: 10px;
        }

        /* Sección de Horarios */
        .date-section {
          margin-bottom: 20px;
        }

        .hours-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hours-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .quick-select {
          display: flex;
          gap: 6px;
        }

        .quick-btn {
          padding: 6px 10px;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          background: white;
          font-size: 11px;
          font-weight: 600;
          color: #007aff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-btn.clear {
          color: #ff3b30;
        }

        .quick-btn:active {
          transform: scale(0.95);
        }

        .hours-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .hour-button {
          padding: 10px 6px;
          border: 1.5px solid #e5e5e7;
          border-radius: 8px;
          background: white;
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hour-button.selected {
          border-color: #007aff;
          background: #007aff;
          color: white;
        }

        .hour-button:active {
          transform: scale(0.95);
        }

        .selected-count {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
          text-align: center;
        }

        /* Botón Submit */
        .submit-section {
          padding: 20px 16px;
          background: #f8faff;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Vista Previa Móvil */
        .preview-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .preview-header {
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          padding: 20px 16px;
          text-align: center;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .preview-subtitle {
          font-size: 13px;
          opacity: 0.9;
          margin: 0;
        }

        .preview-content {
          padding: 20px 16px;
        }

        .preview-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .preview-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .preview-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #8e8e93;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px;
        }

        .preview-doctor {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-doctor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        .preview-doctor-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .preview-doctor-specialty {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
        }

        .preview-location {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-clinic {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .preview-address {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
        }

        .preview-clinic-badge {
          font-size: 11px;
          color: #34c759;
          font-weight: 600;
          padding: 2px 6px;
          background: #e6ffed;
          border-radius: 4px;
          align-self: flex-start;
        }

        .preview-date {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
        }

        .preview-hours {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .preview-hour {
          background: #007aff;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        /* Acciones de Vista Previa */
        .preview-actions {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: #f8faff;
        }

        .preview-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preview-button.secondary {
          background: white;
          color: #007aff;
          border: 1.5px solid #007aff;
        }

        .preview-button.primary {
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
        }

        .preview-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-button:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Gestionar Existentes Móvil */
        .manage-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .manage-header {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          padding: 20px 16px;
          text-align: center;
        }

        .manage-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        /* Estado Vacío */
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #8e8e93;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px;
        }

        .empty-text {
          font-size: 14px;
          margin: 0 0 24px;
          color: #8e8e93;
        }

        .empty-button {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .empty-button:active {
          transform: scale(0.95);
        }

        /* Lista de Sobrecupos */
        .sobrecupos-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 60vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .sobrecupo-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          background: #fafbff;
          transition: all 0.2s ease;
        }

        .sobrecupo-card:active {
          transform: scale(0.98);
        }

        .sobrecupo-info {
          flex: 1;
          min-width: 0;
        }

        .sobrecupo-doctor {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sobrecupo-specialty {
          font-size: 12px;
          color: #007aff;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .sobrecupo-datetime {
          font-size: 11px;
          color: #34c759;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .sobrecupo-location {
          font-size: 11px;
          color: #8e8e93;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-button {
          background: #ff3b30;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 12px;
          flex-shrink: 0;
        }

        .delete-button:active {
          transform: scale(0.95);
          background: #d70015;
        }

        /* Responsive específico para iPhone */
        @media (max-width: 430px) {
          .content-container {
            padding: 12px;
          }
          
          .step-section {
            padding: 16px 12px;
          }
          
          .hours-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .hour-button {
            padding: 8px 4px;
            font-size: 11px;
          }
          
          .doctor-name {
            font-size: 13px;
          }
          
          .doctor-specialty {
            font-size: 11px;
          }
        }

        @media (max-width: 375px) {
          .mobile-header {
            padding: 10px 12px;
          }
          
          .header-title {
            font-size: 15px;
          }
          
          .tab-button {
            font-size: 12px;
            padding: 10px 6px;
          }
          
          .step-title {
            font-size: 15px;
          }
          
          .form-input {
            font-size: 14px;
            padding: 10px 12px;
          }
          
          .sobrecupo-card {
            padding: 12px;
          }
          
          .sobrecupo-doctor {
            font-size: 13px;
          }
        }

        @media (max-width: 320px) {
          .content-container {
            padding: 8px;
          }
          
          .step-section {
            padding: 12px 8px;
          }
          
          .hours-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }
          
          .hour-button {
            padding: 6px 2px;
            font-size: 10px;
          }
          
          .quick-btn {
            padding: 4px 6px;
            font-size: 10px;
          }
        }

        /* Mejoras para iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .form-input {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .submit-button, .preview-button, .delete-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }

        /* Prevenir zoom en inputs */
        @media (max-width: 768px) {
          .form-input {
            font-size: 16px;
          }
        }

        /* Smooth scrolling para toda la página */
        * {
          -webkit-overflow-scrolling: touch;
        }

        /* Fix para el notch de iPhone */
        @supports (padding: max(0px)) {
          .mobile-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }
          
          .admin-container {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}