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
          setSobrecupos(records);
          setFilteredSobrecupos(records);
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

  // Función para obtener seguros/previsiones con formato mejorado
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

  // Función para obtener tipo de pacientes con formato mejorado
  const getTipoPacientes = (sobrecupo) => {
    let atiende = sobrecupo.fields.Atiende || 
                  sobrecupo.fields.Edades || 
                  sobrecupo.fields.Pacientes || 
                  sobrecupo.fields['Tipo Pacientes'] ||
                  '';
    
    if (!atiende || atiende === 'Consultar edades') return '👥 Consultar edades';
    
    if (Array.isArray(atiende)) {
      atiende = atiende.length > 0 ? atiende[0] : 'Consultar edades';
    }
    
    atiende = String(atiende);
    
    if (atiende.length > 10 && !atiende.includes(' ')) {
      atiende = atiende.replace(/([A-Z])/g, ' $1').trim();
    }
    
    const atiendeStr = atiende.toLowerCase();
    
    if (atiendeStr.includes('ambos') || (atiendeStr.includes('adulto') && atiendeStr.includes('niño'))) {
      return '👨‍👩‍👧‍👦 Adultos y Niños';
    } else if (atiendeStr.includes('adulto')) {
      return '👨‍👩‍👧‍👦 Solo Adultos';
    } else if (atiendeStr.includes('niño') || atiendeStr.includes('pediatr')) {
      return '👶 Solo Niños';
    }
    
    return `👥 ${atiende}`;
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header mejorado */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <button onClick={handleBackClick} style={styles.backButton}>
                <span style={styles.backArrow}>←</span>
              </button>
              <div style={styles.logoContainer}>
                <div style={styles.logoIcon}>S</div>
              </div>
              <div>
                <h1 style={styles.headerTitle}>Sobrecupos</h1>
                <p style={styles.headerSubtitle}>Agenda tu cita</p>
              </div>
            </div>
            <div style={styles.headerStats}>
              {!loading && (
                <span style={styles.statsText}>
                  {filteredSobrecupos.length} disponibles
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout mejorado para desktop */}
      <main style={styles.mainContent}>
        <div style={styles.desktopLayout}>
          {/* Sidebar con filtros y título - lado izquierdo */}
          <aside style={styles.sidebar}>
            <div style={styles.titleSection}>
              <h2 style={styles.mainTitle}>Buscar Sobrecupo</h2>
              <p style={styles.subtitle}>
                Encuentra y reserva citas médicas disponibles
              </p>
            </div>

            {/* Filtros mejorados */}
            <div style={styles.filtersCard}>
              <h3 style={styles.filtersTitle}>Filtrar por</h3>
              
              <div style={styles.filtersContainer}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Especialidad</label>
                  <select
                    value={filters.especialidad}
                    onChange={(e) => setFilters(prev => ({ ...prev, especialidad: e.target.value }))}
                    style={styles.filterSelect}
                  >
                    <option value="">Todas</option>
                    {getUniqueEspecialidades().map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Médico</label>
                  <select
                    value={filters.medico}
                    onChange={(e) => setFilters(prev => ({ ...prev, medico: e.target.value }))}
                    style={styles.filterSelect}
                  >
                    <option value="">Todos</option>
                    {getUniqueMedicos().map(medico => (
                      <option key={medico} value={medico}>{medico}</option>
                    ))}
                  </select>
                </div>

                <button onClick={clearFilters} style={styles.clearButton}>
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Información adicional */}
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>¿Cómo funciona?</h4>
              <div style={styles.infoSteps}>
                <div style={styles.infoStep}>
                  <span style={styles.stepNumber}>1</span>
                  <p style={styles.stepText}>Elige tu sobrecupo</p>
                </div>
                <div style={styles.infoStep}>
                  <span style={styles.stepNumber}>2</span>
                  <p style={styles.stepText}>Completa tus datos</p>
                </div>
                <div style={styles.infoStep}>
                  <span style={styles.stepNumber}>3</span>
                  <p style={styles.stepText}>¡Confirma tu cita!</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido principal - lado derecho */}
          <div style={styles.content}>
            {/* Message */}
            {message && (
              <div style={{
                ...styles.message,
                backgroundColor: message.includes('confirmada') ? '#d1fae5' : '#fee2e2',
                color: message.includes('confirmada') ? '#065f46' : '#991b1b',
                borderColor: message.includes('confirmada') ? '#a7f3d0' : '#fecaca'
              }}>
                {message}
              </div>
            )}

            {/* Results Header */}
            <div style={styles.resultsHeader}>
              <h3 style={styles.resultsTitle}>
                {loading ? 'Cargando...' : `${filteredSobrecupos.length} sobrecupos disponibles`}
              </h3>
            </div>

            {/* Results Grid optimizado para desktop */}
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Cargando sobrecupos...</p>
              </div>
            ) : filteredSobrecupos.length === 0 ? (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>😔</div>
                <h3 style={styles.emptyTitle}>No se encontraron sobrecupos</h3>
                <p style={styles.emptyText}>Intenta ajustar los filtros</p>
                {sobrecupos.length > 0 && (
                  <button onClick={clearFilters} style={styles.primaryButton}>
                    Ver todos los sobrecupos
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.resultsGrid}>
                {filteredSobrecupos.map((sobrecupo) => (
                  <div key={sobrecupo.id} style={styles.sobrecupoCard}>
                    {/* Header del médico */}
                    <div style={styles.cardHeader}>
                      <div style={styles.doctorInfo}>
                        <div style={styles.avatar}>
                          {sobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div style={styles.doctorDetails}>
                          <h3 style={styles.doctorName}>
                            {sobrecupo.fields.Médico}
                          </h3>
                          <p style={styles.specialty}>
                            {sobrecupo.fields.Especialidad}
                          </p>
                        </div>
                      </div>
                      <div style={styles.dateTime}>
                        <div style={styles.dateText}>
                          {formatDate(sobrecupo.fields.Fecha)}
                        </div>
                        <div style={styles.timeText}>
                          {sobrecupo.fields.Hora}
                        </div>
                      </div>
                    </div>

                    {/* Detalles de la clínica */}
                    <div style={styles.cardBody}>
                      <div style={styles.clinicInfo}>
                        <div style={styles.detailRow}>
                          <span style={styles.detailIcon}>🏥</span>
                          <div style={styles.detailText}>
                            <span style={styles.clinicName}>{sobrecupo.fields.Clínica}</span>
                            <p style={styles.address}>{sobrecupo.fields.Dirección}</p>
                          </div>
                        </div>
                        
                        <div style={styles.additionalInfo}>
                          <div style={styles.infoItem}>
                            <span style={styles.infoIcon}>💳</span>
                            <span style={styles.infoText}>{getPrevisiones(sobrecupo)}</span>
                          </div>
                          <div style={styles.infoItem}>
                            <span style={styles.infoIcon}>👥</span>
                            <span style={styles.infoText}>Atiende {sobrecupo.fields.Atiende || 'Consultar'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer con botón */}
                    <div style={styles.cardFooter}>
                      <button
                        onClick={() => handleReservarClick(sobrecupo)}
                        style={styles.reserveButton}
                      >
                        Reservar Cita
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal (mantener igual) */}
      {showReservationModal && selectedSobrecupo && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}>
          <div style={styles.modalContent}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Agendar sobrecupo</h3>
              <button onClick={handleCloseModal} style={styles.closeButton}>
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              {/* Doctor Info Summary */}
              <div style={styles.modalInfoBox}>
                <div style={styles.modalDoctorInfo}>
                  <div style={styles.modalAvatar}>
                    {selectedSobrecupo.fields.Médico?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div style={styles.modalDoctorDetails}>
                    <p style={styles.modalDoctorName}>{selectedSobrecupo.fields.Médico}</p>
                    <p style={styles.modalSpecialty}>{selectedSobrecupo.fields.Especialidad}</p>
                    <p style={styles.modalClinicInfo}>{selectedSobrecupo.fields.Clínica}</p>
                    <p style={styles.modalDateTime}>
                      {formatDate(selectedSobrecupo.fields.Fecha)} - {selectedSobrecupo.fields.Hora}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div style={styles.formContainer}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Nombres *</label>
                  <input
                    type="text"
                    value={reservationData.nombre}
                    onChange={(e) => setReservationData(prev => ({ ...prev, nombre: e.target.value }))}
                    style={styles.formInput}
                    placeholder="Juan Carlos"
                    disabled={reservationLoading}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Apellidos</label>
                  <input
                    type="text"
                    value={reservationData.apellidos}
                    onChange={(e) => setReservationData(prev => ({ ...prev, apellidos: e.target.value }))}
                    style={styles.formInput}
                    placeholder="González López"
                    disabled={reservationLoading}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>RUT *</label>
                  <input
                    type="text"
                    value={reservationData.rut}
                    onChange={(e) => setReservationData(prev => ({ ...prev, rut: e.target.value }))}
                    style={styles.formInput}
                    placeholder="12.345.678-9"
                    disabled={reservationLoading}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Email *</label>
                  <input
                    type="email"
                    value={reservationData.email}
                    onChange={(e) => setReservationData(prev => ({ ...prev, email: e.target.value }))}
                    style={styles.formInput}
                    placeholder="juan@email.com"
                    disabled={reservationLoading}
                  />
                </div>

                {/* Terms Checkbox */}
                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={styles.checkbox}
                    disabled={reservationLoading}
                  />
                  <label htmlFor="terms" style={styles.checkboxLabel}>
                    Acepto los <a href="#" style={styles.link}>términos y condiciones</a>
                  </label>
                </div>

                {/* Warning Box */}
                <div style={styles.warningBox}>
                  <span style={styles.warningIcon}>⚠️</span>
                  <div>
                    <p style={styles.warningTitle}>¡Atención!</p>
                    <p style={styles.warningText}>Debes pagar el bono al llegar.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleReservationSubmit}
                  disabled={reservationLoading || !acceptTerms}
                  style={{
                    ...styles.submitButton,
                    ...((!acceptTerms || reservationLoading) ? styles.submitButtonDisabled : {})
                  }}
                >
                  {reservationLoading ? (
                    <span style={styles.loadingButtonContent}>
                      <span style={styles.buttonSpinner}></span>
                      Procesando...
                    </span>
                  ) : (
                    'Agendar sobrecupo $2.990'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
        
        @media (max-width: 768px) {
          .modal-content {
            animation: slideUp 0.3s ease-out;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  // Container
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },

  // Header mejorado
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerContainer: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '0 24px',
    '@media (max-width: 768px)': {
      padding: '0 16px'
    }
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '18px',
    color: '#4b5563'
  },
  backArrow: {
    fontSize: '18px'
  },
  logoContainer: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  logoIcon: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  headerStats: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block'
    }
  },
  statsText: {
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '500'
  },

  // Layout mejorado
  mainContent: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '24px',
    '@media (max-width: 768px)': {
      padding: '16px'
    }
  },
  desktopLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    '@media (min-width: 1024px)': {
      gridTemplateColumns: '360px 1fr',
      gap: '32px'
    }
  },

  // Sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    '@media (min-width: 1024px)': {
      position: 'sticky',
      top: '88px',
      height: 'fit-content'
    }
  },

  // Title Section
  titleSection: {
    textAlign: 'center',
    '@media (min-width: 1024px)': {
      textAlign: 'left'
    }
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px',
    '@media (min-width: 1024px)': {
      fontSize: '32px'
    }
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5
  },

  // Filters Card
  filtersCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  filtersTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
    margin: 0
  },
  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  filterSelect: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '16px',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px'
  },
  clearButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    display: 'none',
    '@media (min-width: 1024px)': {
      display: 'block'
    }
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
    margin: 0
  },
  infoSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  stepText: {
    fontSize: '14px',
    color: '#374151',
    margin: 0
  },

  // Content Area
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  // Message
  message: {
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid'
  },

  // Results
  resultsHeader: {
    marginBottom: '16px'
  },
  resultsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  resultsGrid: {
    display: 'grid',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
      gap: '20px'
    },
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
      gap: '24px'
    }
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(59, 130, 246, 0.1)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '16px'
  },

  // Empty State
  emptyContainer: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '24px'
  },
  primaryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },

  // Sobrecupo Card mejorada
  sobrecupoCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
    }
  },

  // Card Header
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px 20px',
    borderBottom: '1px solid #f3f4f6'
  },
  doctorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  avatar: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0
  },
  doctorDetails: {
    flex: 1,
    minWidth: 0
  },
  doctorName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  specialty: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#3b82f6',
    margin: 0
  },
  dateTime: {
    textAlign: 'right',
    flexShrink: 0
  },
  dateText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '2px'
  },
  timeText: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Card Body
  cardBody: {
    padding: '16px 20px'
  },
  clinicInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  detailIcon: {
    fontSize: '16px',
    color: '#9ca3af',
    marginTop: '2px',
    flexShrink: 0
  },
  detailText: {
    flex: 1
  },
  clinicName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '2px'
  },
  address: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  additionalInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '8px'
    }
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  infoIcon: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  infoText: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: '500'
  },

  // Card Footer
  cardFooter: {
    padding: '16px 20px 20px 20px',
    borderTop: '1px solid #f3f4f6'
  },
  reserveButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s'
  },

  // Modal Styles (mantener iguales)
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 0,
    '@media (min-width: 768px)': {
      alignItems: 'center',
      padding: '16px'
    }
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    '@media (min-width: 768px)': {
      maxWidth: '500px',
      borderRadius: '16px'
    }
  },
  modalHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    '@media (min-width: 768px)': {
      padding: '20px 24px'
    }
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
    '@media (min-width: 768px)': {
      fontSize: '24px'
    }
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '@media (min-width: 768px)': {
      width: '40px',
      height: '40px'
    }
  },
  modalBody: {
    padding: '16px',
    '@media (min-width: 768px)': {
      padding: '24px'
    }
  },
  modalInfoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    border: '1px solid #dbeafe'
  },
  modalDoctorInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  modalAvatar: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    flexShrink: 0
  },
  modalDoctorDetails: {
    flex: 1,
    minWidth: 0
  },
  modalDoctorName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 4px 0'
  },
  modalSpecialty: {
    fontSize: '14px',
    color: '#3b82f6',
    fontWeight: '500',
    margin: '0 0 4px 0'
  },
  modalClinicInfo: {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 4px 0'
  },
  modalDateTime: {
    fontSize: '14px',
    color: '#374151',
    margin: 0
  },

  // Form Styles
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column'
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    '@media (min-width: 768px)': {
      fontSize: '16px',
      padding: '12px 16px'
    }
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginTop: '8px'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#3b82f6'
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline'
  },
  warningBox: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    marginTop: '8px'
  },
  warningIcon: {
    fontSize: '18px',
    flexShrink: 0
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#92400e',
    margin: '0 0 2px 0'
  },
  warningText: {
    fontSize: '13px',
    color: '#92400e',
    margin: 0
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s',
    marginTop: '12px',
    '@media (min-width: 768px)': {
      fontSize: '16px',
      padding: '14px'
    }
  },
  submitButtonDisabled: {
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  loadingButtonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default AgendarSobrecuposPage;