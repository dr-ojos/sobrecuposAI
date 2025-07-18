'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Función para agrupar médicos por especialidad
function groupBySpecialty(doctors) {
  const groups = {};
  for (const d of doctors) {
    const esp = d.fields?.Especialidad || "Sin especialidad";
    if (!groups[esp]) groups[esp] = [];
    groups[esp].push(d);
  }
  return groups;
}

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    Name: "",
    Especialidad: "",
    EspecialidadOtra: "",
    WhatsApp: "",
    Email: "",
    Atiende: "",
    Seguros: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("agregar");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const router = useRouter();

  // Especialidades predefinidas para mejor UX
  const especialidades = [
    "Oftalmología", "Medicina Familiar", "Dermatología", 
    "Pediatría", "Otorrinolaringología", "Neurología", "Cardiología"
  ];

  // Opciones de atención
  const opcionesAtiende = [
    "Adultos", "Niños", "Ambos"
  ];

  // Opciones de seguros
  const opcionesSeguros = [
    "Fonasa", "Isapres", "Particular"
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setMsg("");
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setMsg("No se pudieron cargar los médicos.");
    }
  };

  const handleInput = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Si cambia especialidad, limpiar "otra especialidad"
    if (name === "Especialidad") {
      setForm(prev => ({ ...prev, [name]: value, EspecialidadOtra: "" }));
    }
  };

  const handleSeguroChange = (seguro) => {
    setForm(prev => ({
      ...prev,
      Seguros: prev.Seguros.includes(seguro)
        ? prev.Seguros.filter(s => s !== seguro)
        : [...prev.Seguros, seguro]
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validaciones
    if (!form.Name.trim()) {
      setMsg("❌ El nombre es obligatorio");
      return;
    }
    
    // Validar especialidad
    const especialidadFinal = form.Especialidad === "Otra" 
      ? form.EspecialidadOtra.trim() 
      : form.Especialidad;
    
    if (!especialidadFinal) {
      setMsg("❌ Debes seleccionar o escribir una especialidad");
      return;
    }
    
    if (!form.WhatsApp.trim()) {
      setMsg("❌ El WhatsApp es obligatorio");
      return;
    }
    if (!form.Email.trim() || !form.Email.includes('@')) {
      setMsg("❌ Ingresa un email válido");
      return;
    }
    if (!form.Atiende) {
      setMsg("❌ Debes seleccionar a quién atiende");
      return;
    }
    if (form.Seguros.length === 0) {
      setMsg("❌ Debes seleccionar al menos un tipo de seguro");
      return;
    }

    setLoading(true);
    setMsg("");
    
    try {
      // Preparar datos para enviar
      const dataToSend = {
        ...form,
        Especialidad: especialidadFinal,
        Seguros: form.Seguros.join(", ") // Convertir array a string
      };
      
      // Remover campo temporal
      delete dataToSend.EspecialidadOtra;
      
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (!res.ok) throw new Error("Error registrando médico");
      
      setForm({ 
        Name: "", 
        Especialidad: "", 
        EspecialidadOtra: "", 
        WhatsApp: "", 
        Email: "", 
        Atiende: "", 
        Seguros: [] 
      });
      fetchDoctors();
      setMsg("✅ Médico registrado exitosamente");
      
      // Cambiar a tab de gestión después de agregar
      setTimeout(() => {
        setActiveTab("gestionar");
        setMsg("");
      }, 2000);
      
    } catch {
      setMsg("❌ Error registrando médico");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`¿Estás seguro de eliminar al Dr. ${doctor.fields?.Name}?`)) return;
    
    setLoading(true);
    setMsg("");
    
    try {
      const res = await fetch(`/api/doctors?id=${doctor.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando médico");
      
      fetchDoctors();
      setMsg("✅ Médico eliminado correctamente");
      setShowDoctorModal(false);
      
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("❌ Error eliminando médico");
    } finally {
      setLoading(false);
    }
  };

  const openDoctorModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };

  // Filtrado mejorado
  const filtered = doctors.filter(d => {
    const name = d.fields?.Name?.toLowerCase() || "";
    const specialty = d.fields?.Especialidad?.toLowerCase() || "";
    const email = d.fields?.Email?.toLowerCase() || "";
    const searchTerm = filter.toLowerCase();
    
    return name.includes(searchTerm) || 
           specialty.includes(searchTerm) || 
           email.includes(searchTerm);
  });

  const specialties = Object.entries(groupBySpecialty(filtered));

  return (
    <div className="doctors-container">
      {/* Header Móvil */}
      <div className="mobile-header">
        <button
          onClick={() => router.push("/admin")}
          className="back-button"
        >
          ← Sobrecupos
        </button>
        <div className="header-title">Médicos</div>
        <div className="header-spacer"></div>
      </div>

      {/* Navegación por tabs */}
      <div className="mobile-tabs">
        <button 
          className={`tab-button ${activeTab === "agregar" ? "active" : ""}`}
          onClick={() => setActiveTab("agregar")}
        >
          👨‍⚕️ Agregar
        </button>
        <button 
          className={`tab-button ${activeTab === "gestionar" ? "active" : ""}`}
          onClick={() => setActiveTab("gestionar")}
        >
          📋 Gestionar ({doctors.length})
        </button>
      </div>

      <div className="content-container">
        {/* Mensajes de estado */}
        {msg && (
          <div className={`mobile-message ${msg.includes("✅") ? "success" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Tab Agregar Médico */}
        {activeTab === "agregar" && (
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Nuevo Médico</h2>
              <p className="form-subtitle">Completa todos los campos</p>
            </div>

            <form onSubmit={handleSubmit} className="doctor-form">
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input
                  type="text"
                  name="Name"
                  placeholder="Dr. Juan Pérez"
                  value={form.Name}
                  onChange={handleInput}
                  required
                  maxLength={55}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Especialidad</label>
                <select
                  name="Especialidad"
                  value={form.Especialidad}
                  onChange={handleInput}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona especialidad</option>
                  {especialidades.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                  <option value="Otra">➕ Otra especialidad...</option>
                </select>
                
                {/* Campo condicional para "Otra especialidad" */}
                {form.Especialidad === "Otra" && (
                  <input
                    type="text"
                    name="EspecialidadOtra"
                    placeholder="Escribe la especialidad"
                    value={form.EspecialidadOtra}
                    onChange={handleInput}
                    required
                    maxLength={50}
                    className="form-input otra-especialidad"
                  />
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Atiende a</label>
                <select
                  name="Atiende"
                  value={form.Atiende}
                  onChange={handleInput}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona opción</option>
                  {opcionesAtiende.map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">WhatsApp</label>
                <input
                  type="tel"
                  name="WhatsApp"
                  placeholder="+569 1234 5678"
                  value={form.WhatsApp}
                  onChange={handleInput}
                  required
                  maxLength={20}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  name="Email"
                  placeholder="doctor@ejemplo.com"
                  value={form.Email}
                  onChange={handleInput}
                  required
                  maxLength={60}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Seguros que acepta</label>
                <div className="checkbox-group">
                  {opcionesSeguros.map(seguro => (
                    <label key={seguro} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={form.Seguros.includes(seguro)}
                        onChange={() => handleSeguroChange(seguro)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{seguro}</span>
                    </label>
                  ))}
                </div>
                <div className="seguros-selected">
                  {form.Seguros.length > 0 && (
                    <span className="selected-count">
                      ✓ {form.Seguros.length} seleccionado{form.Seguros.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? "⏳ Guardando..." : "✅ Agregar Médico"}
              </button>
            </form>
          </div>
        )}

        {/* Tab Gestionar Médicos */}
        {activeTab === "gestionar" && (
          <div className="manage-container">
            <div className="search-section">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="🔍 Buscar médico..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="search-input"
                />
                {filter && (
                  <button 
                    onClick={() => setFilter("")}
                    className="clear-search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍⚕️</div>
                <h3 className="empty-title">
                  {filter ? "No encontrado" : "Sin médicos"}
                </h3>
                <p className="empty-text">
                  {filter ? "Intenta otro término" : "Agrega tu primer médico"}
                </p>
                {!filter && (
                  <button
                    onClick={() => setActiveTab("agregar")}
                    className="empty-button"
                  >
                    👨‍⚕️ Agregar Médico
                  </button>
                )}
              </div>
            ) : (
              <div className="doctors-list">
                {specialties.map(([specialty, docs]) => (
                  <div key={specialty} className="specialty-section">
                    <div className="specialty-header">
                      <h3 className="specialty-title">{specialty}</h3>
                      <span className="specialty-count">{docs.length}</span>
                    </div>
                    
                    <div className="doctors-grid">
                      {docs.map(doctor => (
                        <div 
                          key={doctor.id} 
                          className="doctor-card"
                          onClick={() => openDoctorModal(doctor)}
                        >
                          <div className="doctor-avatar">
                            {doctor.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="doctor-info">
                            <div className="doctor-name">
                              Dr. {doctor.fields?.Name}
                            </div>
                            <div className="doctor-details">
                              <div className="doctor-atiende">
                                👥 {doctor.fields?.Atiende || "No especificado"}
                              </div>
                              <div className="doctor-seguros">
                                💳 {doctor.fields?.Seguros || "No especificado"}
                              </div>
                              <div className="doctor-contact">
                                📱 {doctor.fields?.WhatsApp}
                              </div>
                            </div>
                          </div>
                          <div className="card-arrow">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalle del Médico */}
      {showDoctorModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-doctor-avatar">
                {selectedDoctor.fields?.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="modal-doctor-info">
                <h3 className="modal-doctor-name">
                  Dr. {selectedDoctor.fields?.Name}
                </h3>
                <p className="modal-doctor-specialty">
                  {selectedDoctor.fields?.Especialidad}
                </p>
              </div>
              <button 
                onClick={() => setShowDoctorModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="contact-section">
                <div className="contact-item">
                  <div className="contact-label">👥 Atiende a</div>
                  <div className="contact-value">{selectedDoctor.fields?.Atiende || "No especificado"}</div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">💳 Seguros</div>
                  <div className="contact-value">{selectedDoctor.fields?.Seguros || "No especificado"}</div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">📱 WhatsApp</div>
                  <div className="contact-value">{selectedDoctor.fields?.WhatsApp}</div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">📧 Email</div>
                  <div className="contact-value">{selectedDoctor.fields?.Email}</div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={() => setShowDoctorModal(false)}
                className="modal-button secondary"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleDelete(selectedDoctor)}
                disabled={loading}
                className="modal-button danger"
              >
                {loading ? "⏳" : "🗑️"} Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .doctors-container {
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
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .header-spacer {
          width: 64px;
        }

        /* Tabs */
        .mobile-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 56px;
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

        /* Formulario */
        .form-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .form-header {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          padding: 20px 16px;
          text-align: center;
        }

        .form-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .form-subtitle {
          font-size: 13px;
          opacity: 0.9;
          margin: 0;
        }

        .doctor-form {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

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

        .form-input, .form-select {
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 10px;
          font-size: 15px;
          background: white;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Campo de otra especialidad */
        .otra-especialidad {
          margin-top: 8px;
          border-color: #007aff !important;
          background: #f8faff !important;
        }

        /* Checkbox Group */
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 8px 0;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e5e7;
          border-radius: 6px;
          background: white;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #007aff;
          border-color: #007aff;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .checkbox-label {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          user-select: none;
        }

        .seguros-selected {
          margin-top: 6px;
        }

        .selected-count {
          font-size: 12px;
          color: #34c759;
          font-weight: 600;
        }

        /* Sección de Gestión */
        .manage-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-section {
          background: white;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 12px;
          font-size: 15px;
          background: #f8faff;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
          background: white;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          background: #8e8e93;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Estado Vacío */
        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
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

        /* Lista de Médicos */
        .doctors-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .specialty-section {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .specialty-header {
          background: linear-gradient(135deg, #f8faff, #e8f2ff);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
        }

        .specialty-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .specialty-count {
          background: #007aff;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 8px;
          min-width: 18px;
          text-align: center;
        }

        .doctors-grid {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doctor-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          background: #fafbff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .doctor-card:active {
          transform: scale(0.98);
          background: #f0f4fa;
        }

        .doctor-avatar {
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
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doctor-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doctor-atiende, .doctor-seguros, .doctor-contact {
          font-size: 11px;
          color: #8e8e93;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doctor-atiende {
          color: #007aff;
        }

        .doctor-seguros {
          color: #34c759;
        }

        .card-arrow {
          color: #c7c7cc;
          font-size: 16px;
          margin-left: 8px;
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
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          box-sizing: border-box;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: modalSlideUp 0.3s ease;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          padding: 20px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .modal-doctor-avatar {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .modal-doctor-info {
          flex: 1;
        }

        .modal-doctor-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .modal-doctor-specialty {
          font-size: 13px;
          opacity: 0.9;
          margin: 0;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px 16px;
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-label {
          font-size: 11px;
          font-weight: 700;
          color: #8e8e93;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: #f8faff;
        }

        .modal-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-button.secondary {
          background: white;
          color: #007aff;
          border: 1.5px solid #007aff;
        }

        .modal-button.danger {
          background: linear-gradient(135deg, #ff3b30, #d70015);
          color: white;
        }

        .modal-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-button:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Responsive */
        @media (max-width: 430px) {
          .content-container {
            padding: 12px;
          }
          
          .doctor-form {
            padding: 16px 12px;
          }
          
          .form-input, .form-select {
            font-size: 16px; /* Previene zoom en iOS */
          }
          
          .doctor-card {
            padding: 10px;
          }
          
          .doctor-name {
            font-size: 13px;
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
          
          .modal-overlay {
            padding: 16px;
          }
        }

        @media (max-width: 320px) {
          .content-container {
            padding: 8px;
          }
          
          .doctor-form {
            padding: 12px 8px;
          }
          
          .form-input, .form-select {
            padding: 10px 12px;
            font-size: 14px;
          }
          
          .submit-button {
            padding: 12px;
            font-size: 14px;
          }
        }

        /* Mejoras para iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .form-input, .form-select {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .submit-button, .modal-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }

        /* Fix para el notch de iPhone */
        @supports (padding: max(0px)) {
          .mobile-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }
          
          .doctors-container {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}