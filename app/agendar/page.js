'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AgendarSobrecuposPage = () => {
  const router = useRouter();
  const [sobrecupos, setSobrecupos] = useState([]);
  const [filteredSobrecupos, setFilteredSobrecupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSobrecupo, setSelectedSobrecupo] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [filters, setFilters] = useState({
    especialidad: '',
    medico: ''
  });
  const [reservationData, setReservationData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    rut: '',
    edad: ''
  });
  const [message, setMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Cargar sobrecupos desde la API real
  useEffect(() => {
    const fetchSobrecupos = async () => {
      try {
        console.log('📡 Cargando sobrecupos desde API...');
        setLoading(true);
        
        const response = await fetch('/api/sobrecupos/available');
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const records = data.records || [];
          console.log(`✅ Cargados ${records.length} sobrecupos`);
          
          // Filtrar solo sobrecupos desde la fecha actual hacia adelante
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const futureSobrecupos = records.filter(sobrecupo => {
            const sobrecupoDate = new Date(sobrecupo.fields?.Fecha);
            return sobrecupoDate >= today;
          });
          
          console.log(`📅 Sobrecupos futuros: ${futureSobrecupos.length}`);
          setSobrecupos(futureSobrecupos);
          setFilteredSobrecupos(futureSobrecupos);
        } else {
          throw new Error(data.error || 'Error obteniendo datos');
        }
      } catch (error) {
        console.error('❌ Error fetching sobrecupos:', error);
        setMessage('Error cargando sobrecupos. Intenta recargar la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchSobrecupos();
  }, []);

  // Filtrar sobrecupos
  useEffect(() => {
    let filtered = sobrecupos.filter(s => s.fields.Disponible === 'Si');

    if (filters.especialidad) {
      filtered = filtered.filter(s => 
        s.fields.Especialidad && s.fields.Especialidad.toLowerCase().includes(filters.especialidad.toLowerCase())
      );
    }

    if (filters.medico) {
      filtered = filtered.filter(s => 
        s.fields.Médico && s.fields.Médico.toLowerCase().includes(filters.medico.toLowerCase())
      );
    }

    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.fields.Fecha}T${a.fields.Hora}`);
      const dateB = new Date(`${b.fields.Fecha}T${b.fields.Hora}`);
      return dateA - dateB;
    });

    setFilteredSobrecupos(filtered);
  }, [sobrecupos, filters]);

  const handleReservarClick = (sobrecupo) => {
    setSelectedSobrecupo(sobrecupo);
    setShowReservationModal(true);
  };

  const handleReservationSubmit = async () => {
    if (!reservationData.nombre || !reservationData.email || !reservationData.rut) {
      setMessage('Por favor, completa todos los campos obligatorios.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!acceptTerms) {
      setMessage('Debes aceptar los términos y condiciones para continuar.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setReservationLoading(true);

    try {
      console.log('🎯 Enviando reserva...');
      const response = await fetch('/api/sobrecupos/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sobrecupoId: selectedSobrecupo.id,
          pacienteData: {
            ...reservationData,
            nombreCompleto: `${reservationData.nombre} ${reservationData.apellidos || ''}`.trim()
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('¡Reserva confirmada! Te contactaremos pronto para confirmar tu cita.');
        setShowReservationModal(false);
        setReservationData({
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
          rut: '',
          edad: ''
        });
        setAcceptTerms(false);
        
        // Actualizar estado local
        setSobrecupos(prev => prev.map(s => 
          s.id === selectedSobrecupo.id 
            ? { ...s, fields: { ...s.fields, Disponible: 'No' }}
            : s
        ));
      } else {
        setMessage(result.error || result.message || 'Error al procesar la reserva. Intenta nuevamente.');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setReservationLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getUniqueEspecialidades = () => {
    const especialidades = sobrecupos
      .map(s => s.fields.Especialidad)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return especialidades.sort();
  };

  const getUniqueMedicos = () => {
    const medicos = sobrecupos
      .map(s => s.fields.Médico)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return medicos.sort();
  };

  const clearFilters = () => {
    setFilters({ especialidad: '', medico: '' });
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleCloseModal = () => {
    setShowReservationModal(false);
    setSelectedSobrecupo(null);
    setReservationData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      rut: '',
      edad: ''
    });
    setAcceptTerms(false);
  };

  const getPrevisiones = (sobrecupo) => {
    let seguros = sobrecupo.fields.Seguro || 
                  sobrecupo.fields.Seguros || 
                  sobrecupo.fields.Previsiones || 
                  sobrecupo.fields.Isapres || 
                  sobrecupo.fields.Prevision ||
                  'Consultar seguros';
    
    if (seguros !== 'Consultar seguros') {
      if (Array.isArray(seguros)) {
        seguros = seguros.join(', ');
      }
      else if (typeof seguros === 'string') {
        seguros = seguros.replace(/([A-Z])/g, ', $1').trim();
        if (seguros.startsWith(', ')) {
          seguros = seguros.substring(2);
        }
        seguros = seguros.replace(/,\s+/g, ', ');
      }
      else {
        seguros = String(seguros);
      }
    }
    
    return seguros;
  };

  return (
    <main className="page-container">
      {/* Header Minimalista */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <button onClick={handleBackClick} className="back-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="header-text">
                <h1 className="header-title">Sobrecupos</h1>
                <span className="header-subtitle">AI</span>
              </div>
            </div>
            <div className="header-stats">
              {!loading && (
                <span className="stats-badge">
                  {filteredSobrecupos.length} disponibles
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="main-layout">
        <div className="content-container">
          
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="main-title">Encuentra tu Sobrecupo</h2>
              <p className="main-subtitle">Sobrecupos disponibles para reservar ahora</p>
            </div>
          </section>

          {/* Filtros Minimalistas */}
          <section className="filters-section">
            <div className="filters-container">
              <div className="filter-group">
                <select
                  value={filters.especialidad}
                  onChange={(e) => setFilters(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">Especialidades</option>
                  {getUniqueEspecialidades().map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={filters.medico}
                  onChange={(e) => setFilters(prev => ({ ...prev, medico: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">Todos los médicos</option>
                  {getUniqueMedicos().map(medico => (
                    <option key={medico} value={medico}>{medico}</option>
                  ))}
                </select>
              </div>

              {(filters.especialidad || filters.medico) && (
                <button onClick={clearFilters} className="clear-filters">
                  Limpiar
                </button>
              )}
            </div>
          </section>

          {/* Mensaje */}
          {message && (
            <div className={`message ${message.includes('confirmada') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Contenido Principal */}
          <section className="results-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Cargando sobrecupos...</p>
              </div>
            ) : filteredSobrecupos.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No se encontraron sobrecupos</h3>
                <p className="empty-text">Intenta ajustar los filtros o revisa más tarde</p>
                {sobrecupos.length > 0 && (
                  <button onClick={clearFilters} className="empty-button">
                    Ver todos los sobrecupos
                  </button>
                )}
              </div>
            ) : (
              <div className="results-grid">
                {filteredSobrecupos.map((sobrecupo) => (
                  <article key={sobrecupo.id} className="sobrecupo-card">
                    
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="doctor-info">
                        <div className="doctor-avatar">
                          {sobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="doctor-details">
                          <h3 className="doctor-name">
                            {sobrecupo.fields.Médico}
                          </h3>
                          <p className="doctor-specialty">
                            {sobrecupo.fields.Especialidad}
                          </p>
                        </div>
                      </div>
                      <div className="appointment-time">
                        <div className="date-text">
                          {formatDate(sobrecupo.fields.Fecha)}
                        </div>
                        <div className="time-text">
                          {sobrecupo.fields.Hora}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                      <div className="location-info">
                        <div className="clinic-name">{sobrecupo.fields.Clínica}</div>
                        <div className="clinic-address">{sobrecupo.fields.Dirección}</div>
                      </div>
                      
                      <div className="additional-info">
                        <div className="info-item">
                          <span className="info-label">Previsión</span>
                          <span className="info-value">{getPrevisiones(sobrecupo)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Atiende</span>
                          <span className="info-value">{sobrecupo.fields.Atiende || 'Consultar'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                      <div className="footer-actions">
                        <button
                          onClick={() => router.push(`/medico-info/${encodeURIComponent(sobrecupo.fields.Médico)}`)}
                          className="info-button"
                        >
                          Más información
                        </button>
                        <button
                          onClick={() => handleReservarClick(sobrecupo)}
                          className="reserve-button"
                        >
                          Reservar Sobrecupo
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal de Reserva */}
      {showReservationModal && selectedSobrecupo && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}>
          <div className="modal-content">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">Reservar sobrecupo</h3>
              <button onClick={handleCloseModal} className="modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              
              {/* Resumen de la cita */}
              <div className="appointment-summary">
                <div className="summary-avatar">
                  {selectedSobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="summary-details">
                  <div className="summary-doctor">{selectedSobrecupo.fields.Médico}</div>
                  <div className="summary-specialty">{selectedSobrecupo.fields.Especialidad}</div>
                  <div className="summary-clinic">{selectedSobrecupo.fields.Clínica}</div>
                  <div className="summary-datetime">
                    {formatDate(selectedSobrecupo.fields.Fecha)} - {selectedSobrecupo.fields.Hora}
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="form-container">
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Nombres *</label>
                    <input
                      type="text"
                      value={reservationData.nombre}
                      onChange={(e) => setReservationData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="field-input"
                      placeholder="Juan Carlos"
                      disabled={reservationLoading}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Apellidos</label>
                    <input
                      type="text"
                      value={reservationData.apellidos}
                      onChange={(e) => setReservationData(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="field-input"
                      placeholder="González López"
                      disabled={reservationLoading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">RUT *</label>
                    <input
                      type="text"
                      value={reservationData.rut}
                      onChange={(e) => setReservationData(prev => ({ ...prev, rut: e.target.value }))}
                      className="field-input"
                      placeholder="12.345.678-9"
                      disabled={reservationLoading}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Email *</label>
                    <input
                      type="email"
                      value={reservationData.email}
                      onChange={(e) => setReservationData(prev => ({ ...prev, email: e.target.value }))}
                      className="field-input"
                      placeholder="juan@email.com"
                      disabled={reservationLoading}
                    />
                  </div>
                </div>

                {/* Términos */}
                <div className="terms-container">
                  <label className="terms-label">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="terms-checkbox"
                      disabled={reservationLoading}
                    />
                    <span className="terms-text">
                      Acepto los términos y condiciones
                    </span>
                  </label>
                </div>

                {/* Aviso */}
                <div className="warning-notice">
                  <span className="warning-icon">!</span>
                  <div>
                    <div className="warning-title">Importante</div>
                    <div className="warning-text">Debes pagar el valor de la consulta al llegar a la clínica</div>
                  </div>
                </div>

                {/* Botón de envío */}
                <button
                  onClick={handleReservationSubmit}
                  disabled={reservationLoading || !acceptTerms}
                  className={`submit-button ${(!acceptTerms || reservationLoading) ? 'disabled' : ''}`}
                >
                  {reservationLoading ? (
                    <span className="loading-content">
                      <span className="button-spinner"></span>
                      Procesando...
                    </span>
                  ) : (
                    'Confirmar reserva'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
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

        .header-stats {
          display: none;
        }

        .stats-badge {
          font-size: 0.875rem;
          color: #666;
          background: #f5f5f5;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid #e5e5e5;
        }

        /* Layout Principal */
        .main-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          margin-bottom: 1rem;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .main-title {
          font-size: 2rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .main-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        /* Filtros */
        .filters-section {
          display: flex;
          justify-content: center;
        }

        .filters-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          max-width: 100%;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .filter-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          font-size: 0.875rem;
          color: #171717;
          outline: none;
          transition: border-color 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1rem;
          padding-right: 2.5rem;
        }

        .filter-select:focus {
          border-color: #171717;
        }

        .clear-filters {
          padding: 0.75rem 1rem;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .clear-filters:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Mensaje */
        .message {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          margin-bottom: 1rem;
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

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Empty State */
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        .empty-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 2rem 0;
        }

        .empty-button {
          padding: 0.75rem 1.5rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .empty-button:hover {
          background: #000;
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
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .sobrecupo-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        /* Card Header */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .doctor-avatar {
          width: 40px;
          height: 40px;
          background: #171717;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .doctor-details {
          flex: 1;
          min-width: 0;
        }

        .doctor-name {
          font-size: 1.1rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doctor-specialty {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }

        .appointment-time {
          text-align: right;
          flex-shrink: 0;
        }

        .date-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 2px;
        }

        .time-text {
          font-size: 0.75rem;
          color: #666;
        }

        /* Card Body */
        .card-body {
          padding: 1rem 1.5rem;
        }

        .location-info {
          margin-bottom: 1rem;
        }

        .clinic-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .clinic-address {
          font-size: 0.8rem;
          color: #666;
        }

        .additional-info {
          display: flex;
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #999;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 0.8rem;
          color: #666;
          font-weight: 400;
        }

        /* Card Footer */
        .card-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f5f5f5;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .info-button {
          flex: 1;
          padding: 0.75rem;
          background: none;
          color: #ff9500;
          border: 1px solid #ff9500;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .info-button:hover {
          background: #ff9500;
          color: white;
          transform: translateY(-1px);
        }

        .reserve-button {
          flex: 2;
          padding: 0.75rem;
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .reserve-button:hover {
          background: #e6850a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
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
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          padding: 0;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .modal-close:hover {
          background: #f5f5f5;
        }

        .modal-body {
          padding: 1.5rem;
        }

        /* Appointment Summary */
        .appointment-summary {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .summary-avatar {
          width: 48px;
          height: 48px;
          background: #171717;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .summary-details {
          flex: 1;
          min-width: 0;
        }

        .summary-doctor {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .summary-specialty {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .summary-clinic {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .summary-datetime {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
        }

        /* Form */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .field-input:focus {
          border-color: #171717;
        }

        .field-input:disabled {
          opacity: 0.6;
          background: #f9fafb;
        }

        /* Terms */
        .terms-container {
          margin: 0.5rem 0;
        }

        .terms-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .terms-checkbox {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #171717;
        }

        .terms-text {
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.4;
        }

        /* Warning Notice */
        .warning-notice {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
        }

        .warning-icon {
          width: 20px;
          height: 20px;
          background: #f59e0b;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .warning-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.25rem;
        }

        .warning-text {
          font-size: 0.8rem;
          color: #92400e;
        }

        /* Submit Button */
        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 0.5rem;
        }

        .submit-button:hover:not(.disabled) {
          background: #000;
        }

        .submit-button.disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .header-stats {
            display: block;
          }

          .main-layout {
            padding: 3rem 2rem;
          }

          .main-title {
            font-size: 2.5rem;
          }

          .main-subtitle {
            font-size: 1.1rem;
          }

          .filter-group {
            max-width: 250px;
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

          .modal-overlay {
            align-items: center;
            padding: 1rem;
          }

          .modal-content {
            max-width: 500px;
            border-radius: 12px;
            animation: none;
          }

          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Responsive - Desktop */
        @media (min-width: 1024px) {
          .content-container {
            gap: 2rem;
          }

          .hero-section {
            margin-bottom: 1.5rem;
          }

          .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 1.5rem;
            justify-items: center;
            max-width: 1200px;
            margin: 0 auto;
          }

          .sobrecupo-card {
            max-width: 500px;
            width: 100%;
          }

          .card-header {
            padding: 1.25rem 1.5rem;
          }

          .card-body {
            padding: 1rem 1.5rem;
          }

          .card-footer {
            padding: 1rem 1.5rem;
          }

          .additional-info {
            gap: 1.5rem;
          }
        }

        /* iPhone Specific Optimizations */
        @media (max-width: 480px) {
          .main-layout {
            padding: 1rem 0.75rem;
          }

          .main-title {
            font-size: 1.75rem;
          }

          .main-subtitle {
            font-size: 0.9rem;
          }

          .filters-container {
            flex-direction: column;
            width: 100%;
          }

          .filter-group {
            min-width: auto;
          }

          .clear-filters {
            width: 100%;
            justify-self: stretch;
          }

          .card-header {
            padding: 1rem;
          }

          .card-body {
            padding: 0.75rem 1rem;
          }

          .card-footer {
            padding: 1rem;
          }

          .additional-info {
            flex-direction: column;
            gap: 0.75rem;
          }

          .footer-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .info-button,
          .reserve-button {
            flex: none;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .appointment-summary {
            padding: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .summary-avatar {
            width: 40px;
            height: 40px;
          }
        }

        /* iPhone SE and very small devices */
        @media (max-width: 375px) {
          .main-title {
            font-size: 1.5rem;
          }

          .header-content {
            height: 56px;
          }

          .back-button {
            width: 32px;
            height: 32px;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .doctor-name {
            font-size: 1rem;
          }

          .doctor-specialty {
            font-size: 0.8rem;
          }
        }

        /* Safe area for iPhones with notch */
        @supports (padding: max(0px)) {
          .page-container {
            padding-top: max(0px, env(safe-area-inset-top));
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }

          .modal-content {
            margin-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
};

export default AgendarSobrecuposPage;