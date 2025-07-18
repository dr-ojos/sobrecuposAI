'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClinicasAdminPage() {
  const [clinicas, setClinicas] = useState([]);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    Nombre: "",
    Direccion: "",
    Comuna: "",
    Telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("agregar");
  const [selectedClinica, setSelectedClinica] = useState(null);
  const [showClinicaModal, setShowClinicaModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const router = useRouter();

  // Comunas principales de Santiago
  const comunas = [
    "Las Condes", "Providencia", "Vitacura", "Ñuñoa", "Santiago Centro",
    "La Reina", "Lo Barnechea", "Macul", "San Miguel", "La Florida",
    "Maipú", "Pudahuel", "Quilicura", "Renca", "Independencia",
    "Recoleta", "Conchalí", "Huechuraba", "Estación Central",
    "Pedro Aguirre Cerda", "San Joaquín", "San Ramón", "El Bosque",
    "La Cisterna", "Lo Espejo", "San Bernardo", "Puente Alto",
    "La Pintana", "Peñalolén", "Cerrillos"
  ];

  useEffect(() => {
    fetchClinicas();
  }, []);

  const fetchClinicas = async () => {
    setMsg("");
    try {
      const res = await fetch("/api/clinicas");
      const data = await res.json();
      setClinicas(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Error cargando clínicas");
    }
  };

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validaciones
    if (!form.Nombre.trim()) {
      setMsg("❌ El nombre es obligatorio");
      return;
    }
    if (!form.Direccion.trim()) {
      setMsg("❌ La dirección es obligatoria");
      return;
    }
    if (!form.Comuna) {
      setMsg("❌ Debes seleccionar una comuna");
      return;
    }

    setLoading(true);
    setMsg("");
    
    try {
      const method = editMode ? "PUT" : "POST";
      const body = editMode 
        ? { ...form, id: selectedClinica.id }
        : form;
      
      const res = await fetch("/api/clinicas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error("Error guardando clínica");
      
      setForm({ Nombre: "", Direccion: "", Comuna: "", Telefono: "" });
      setEditMode(false);
      setSelectedClinica(null);
      fetchClinicas();
      setMsg(`✅ Clínica ${editMode ? 'actualizada' : 'registrada'} exitosamente`);
      
      // Cambiar a tab de gestión después de agregar
      setTimeout(() => {
        setActiveTab("gestionar");
        setMsg("");
      }, 2000);
      
    } catch {
      setMsg(`❌ Error ${editMode ? 'actualizando' : 'registrando'} clínica`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clinica) => {
    if (!window.confirm(`¿Estás seguro de eliminar ${clinica.fields?.Nombre}?`)) return;
    
    setLoading(true);
    setMsg("");
    
    try {
      const res = await fetch(`/api/clinicas?id=${clinica.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando clínica");
      
      fetchClinicas();
      setMsg("✅ Clínica eliminada correctamente");
      setShowClinicaModal(false);
      
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("❌ Error eliminando clínica");
    } finally {
      setLoading(false);
    }
  };

  const openClinicaModal = (clinica) => {
    setSelectedClinica(clinica);
    setShowClinicaModal(true);
  };

  const startEdit = (clinica) => {
    setForm({
      Nombre: clinica.fields?.Nombre || "",
      Direccion: clinica.fields?.Direccion || "",
      Comuna: clinica.fields?.Comuna || "",
      Telefono: clinica.fields?.Telefono || "",
    });
    setSelectedClinica(clinica);
    setEditMode(true);
    setActiveTab("agregar");
    setShowClinicaModal(false);
  };

  const cancelEdit = () => {
    setForm({ Nombre: "", Direccion: "", Comuna: "", Telefono: "" });
    setEditMode(false);
    setSelectedClinica(null);
  };

  // Filtrado mejorado
  const filtered = clinicas.filter(c => {
    const nombre = c.fields?.Nombre?.toLowerCase() || "";
    const direccion = c.fields?.Direccion?.toLowerCase() || "";
    const comuna = c.fields?.Comuna?.toLowerCase() || "";
    const searchTerm = filter.toLowerCase();
    
    return nombre.includes(searchTerm) || 
           direccion.includes(searchTerm) || 
           comuna.includes(searchTerm);
  });

  // Agrupar por comuna
  const groupedByComuna = {};
  filtered.forEach(clinica => {
    const comuna = clinica.fields?.Comuna || "Sin comuna";
    if (!groupedByComuna[comuna]) groupedByComuna[comuna] = [];
    groupedByComuna[comuna].push(clinica);
  });

  const comunasWithClinicas = Object.entries(groupedByComuna).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="clinicas-container">
      {/* Header Móvil */}
      <div className="mobile-header">
        <button
          onClick={() => router.push("/admin")}
          className="back-button"
        >
          ← Sobrecupos
        </button>
        <div className="header-title">Clínicas</div>
        <div className="header-spacer"></div>
      </div>

      {/* Navegación por tabs */}
      <div className="mobile-tabs">
        <button 
          className={`tab-button ${activeTab === "agregar" ? "active" : ""}`}
          onClick={() => setActiveTab("agregar")}
        >
          🏥 {editMode ? "Editar" : "Agregar"}
        </button>
        <button 
          className={`tab-button ${activeTab === "gestionar" ? "active" : ""}`}
          onClick={() => setActiveTab("gestionar")}
        >
          📋 Gestionar ({clinicas.length})
        </button>
      </div>

      <div className="content-container">
        {/* Mensajes de estado */}
        {msg && (
          <div className={`mobile-message ${msg.includes("✅") ? "success" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Tab Agregar/Editar Clínica */}
        {activeTab === "agregar" && (
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">
                {editMode ? "Editar Clínica" : "Nueva Clínica"}
              </h2>
              <p className="form-subtitle">
                {editMode ? "Modifica los datos" : "Completa todos los campos"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="clinica-form">
              <div className="input-group">
                <label className="input-label">Nombre de la Clínica</label>
                <input
                  type="text"
                  name="Nombre"
                  placeholder="Clínica Las Condes"
                  value={form.Nombre}
                  onChange={handleInput}
                  required
                  maxLength={100}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección Completa</label>
                <textarea
                  name="Direccion"
                  placeholder="Av. Las Condes 123, Las Condes, Santiago"
                  value={form.Direccion}
                  onChange={handleInput}
                  required
                  maxLength={200}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Comuna</label>
                <select
                  name="Comuna"
                  value={form.Comuna}
                  onChange={handleInput}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona comuna</option>
                  {comunas.map(comuna => (
                    <option key={comuna} value={comuna}>{comuna}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Teléfono (Opcional)</label>
                <input
                  type="tel"
                  name="Telefono"
                  placeholder="+56 2 2345 6789"
                  value={form.Telefono}
                  onChange={handleInput}
                  maxLength={20}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                {editMode && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="cancel-button"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? "⏳ Guardando..." : editMode ? "✅ Actualizar" : "✅ Agregar Clínica"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Gestionar Clínicas */}
        {activeTab === "gestionar" && (
          <div className="manage-container">
            <div className="search-section">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="🔍 Buscar clínica..."
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
                <div className="empty-icon">🏥</div>
                <h3 className="empty-title">
                  {filter ? "No encontrado" : "Sin clínicas"}
                </h3>
                <p className="empty-text">
                  {filter ? "Intenta otro término" : "Agrega tu primera clínica"}
                </p>
                {!filter && (
                  <button
                    onClick={() => setActiveTab("agregar")}
                    className="empty-button"
                  >
                    🏥 Agregar Clínica
                  </button>
                )}
              </div>
            ) : (
              <div className="clinicas-list">
                {comunasWithClinicas.map(([comuna, clinicas]) => (
                  <div key={comuna} className="comuna-section">
                    <div className="comuna-header">
                      <h3 className="comuna-title">📍 {comuna}</h3>
                      <span className="comuna-count">{clinicas.length}</span>
                    </div>
                    
                    <div className="clinicas-grid">
                      {clinicas.map(clinica => (
                        <div 
                          key={clinica.id} 
                          className="clinica-card"
                          onClick={() => openClinicaModal(clinica)}
                        >
                          <div className="clinica-icon">🏥</div>
                          <div className="clinica-info">
                            <div className="clinica-name">
                              {clinica.fields?.Nombre}
                            </div>
                            <div className="clinica-address">
                              📍 {clinica.fields?.Direccion}
                            </div>
                            {clinica.fields?.Telefono && (
                              <div className="clinica-phone">
                                📞 {clinica.fields.Telefono}
                              </div>
                            )}
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

      {/* Modal de Detalle de Clínica */}
      {showClinicaModal && selectedClinica && (
        <div className="modal-overlay" onClick={() => setShowClinicaModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-clinica-icon">🏥</div>
              <div className="modal-clinica-info">
                <h3 className="modal-clinica-name">
                  {selectedClinica.fields?.Nombre}
                </h3>
                <p className="modal-clinica-comuna">
                  {selectedClinica.fields?.Comuna}
                </p>
              </div>
              <button 
                onClick={() => setShowClinicaModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="contact-section">
                <div className="contact-item">
                  <div className="contact-label">📍 Dirección</div>
                  <div className="contact-value">{selectedClinica.fields?.Direccion}</div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">🏛️ Comuna</div>
                  <div className="contact-value">{selectedClinica.fields?.Comuna}</div>
                </div>
                {selectedClinica.fields?.Telefono && (
                  <div className="contact-item">
                    <div className="contact-label">📞 Teléfono</div>
                    <div className="contact-value">{selectedClinica.fields.Telefono}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={() => setShowClinicaModal(false)}
                className="modal-button secondary"
              >
                Cerrar
              </button>
              <button
                onClick={() => startEdit(selectedClinica)}
                className="modal-button primary"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(selectedClinica)}
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
        .clinicas-container {
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
          background: linear-gradient(135deg, #34c759, #30a14e);
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

        .clinica-form {
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

        .form-input, .form-select, .form-textarea {
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 10px;
          font-size: 15px;
          background: white;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
          font-family: inherit;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #34c759;
          box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.1);
        }

        .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .cancel-button {
          flex: 1;
          padding: 14px;
          border: 1.5px solid #ff3b30;
          border-radius: 12px;
          background: white;
          color: #ff3b30;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-button {
          flex: 2;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:active, .submit-button:not(:disabled):active {
          transform: scale(0.98);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Gestión */
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
          border-color: #34c759;
          box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.1);
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
          background: linear-gradient(135deg, #34c759, #30a14e);
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

        /* Lista de Clínicas */
        .clinicas-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comuna-section {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .comuna-header {
          background: linear-gradient(135deg, #f8faff, #e8f2ff);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
        }

        .comuna-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .comuna-count {
          background: #34c759;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 8px;
          min-width: 18px;
          text-align: center;
        }

        .clinicas-grid {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .clinica-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          background: #fafbff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clinica-card:active {
          transform: scale(0.98);
          background: #f0f4fa;
        }

        .clinica-icon {
          font-size: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .clinica-info {
          flex: 1;
          min-width: 0;
        }

        .clinica-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clinica-address {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clinica-phone {
          font-size: 11px;
          color: #34c759;
          font-weight: 500;
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
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          padding: 20px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .modal-clinica-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .modal-clinica-info {
          flex: 1;
        }

        .modal-clinica-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .modal-clinica-comuna {
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
          word-wrap: break-word;
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
          color: #8e8e93;
          border: 1.5px solid #e5e5e7;
        }

        .modal-button.primary {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
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
          
          .clinica-form {
            padding: 16px 12px;
          }
          
          .form-input, .form-select, .form-textarea {
            font-size: 16px; /* Previene zoom en iOS */
          }
          
          .clinica-card {
            padding: 10px;
          }
          
          .clinica-name {
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
          
          .modal-actions {
            flex-direction: column;
          }
          
          .modal-button {
            flex: none;
          }
        }

        @media (max-width: 320px) {
          .content-container {
            padding: 8px;
          }
          
          .clinica-form {
            padding: 12px 8px;
          }
          
          .form-input, .form-select, .form-textarea {
            padding: 10px 12px;
            font-size: 14px;
          }
          
          .submit-button, .cancel-button {
            padding: 12px;
            font-size: 14px;
          }
        }

        /* Mejoras para iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .form-input, .form-select, .form-textarea {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .submit-button, .modal-button, .cancel-button {
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
          
          .clinicas-container {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}