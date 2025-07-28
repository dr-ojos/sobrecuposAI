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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
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
    
    // Si no es el texto por defecto, formatear los seguros
    if (seguros !== 'Consultar seguros') {
      // Si es un array, unirlo con comas
      if (Array.isArray(seguros)) {
        seguros = seguros.join(', ');
      }
      // Si es un string, verificar que realmente sea un string
      else if (typeof seguros === 'string') {
        // Separar palabras que empiecen con mayúscula
        seguros = seguros.replace(/([A-Z])/g, ', $1').trim();
        // Remover la coma inicial si existe
        if (seguros.startsWith(', ')) {
          seguros = seguros.substring(2);
        }
        // Limpiar espacios duplicados
        seguros = seguros.replace(/,\s+/g, ', ');
      }
      // Si no es string ni array, convertir a string
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
    
    // Si es un array, tomar el primer elemento o unir con comas
    if (Array.isArray(atiende)) {
      atiende = atiende.length > 0 ? atiende[0] : 'Consultar edades';
    }
    
    // Convertir a string si no lo es
    atiende = String(atiende);
    
    // Si está concatenado sin espacios, separar palabras
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
    
    // Si no coincide con ningún patrón, mostrar el valor formateado
    return `👥 ${atiende}`;
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.logo}>
                <div style={styles.logoText}>
                  <span style={styles.logoMain}>S</span>
                </div>
              </div>
              <div>
                <h1 style={styles.headerTitle}>Sobrecupos</h1>
                <p style={styles.headerSubtitle}>Agendar cita médica</p>
              </div>
            </div>
            <button onClick={handleBackClick} style={styles.backButton}>
              <span style={styles.backArrow}>←</span>
              <span>Volver</span>
            </button>
          </div>
        </div>
      </header>

      <div style={styles.container}>
        {/* Título */}
        <div style={styles.titleSection}>
          <h2 style={styles.mainTitle}>Buscar Sobrecupo</h2>
          <p style={styles.description}>
            Encuentra y reserva citas médicas disponibles con especialistas. 
            Usa los filtros para encontrar exactamente lo que necesitas.
          </p>
        </div>

        {/* Filtros */}
        <div style={styles.filtersContainer}>
          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Especialidad</label>
              <select
                value={filters.especialidad}
                onChange={(e) => setFilters(prev => ({ ...prev, especialidad: e.target.value }))}
                style={styles.select}
              >
                <option value="">Todas las especialidades</option>
                {getUniqueEspecialidades().map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Médico</label>
              <select
                value={filters.medico}
                onChange={(e) => setFilters(prev => ({ ...prev, medico: e.target.value }))}
                style={styles.select}
              >
                <option value="">Todos los médicos</option>
                {getUniqueMedicos().map(medico => (
                  <option key={medico} value={medico}>{medico}</option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} style={styles.clearButton}>
              Limpiar filtros
            </button>
          </div>

          {(filters.especialidad || filters.medico) && (
            <div style={styles.activeFilters}>
              <span style={styles.activeFiltersLabel}>Filtros activos:</span>
              {filters.especialidad && (
                <span style={styles.filterTag}>{filters.especialidad}</span>
              )}
              {filters.medico && (
                <span style={styles.filterTag}>{filters.medico}</span>
              )}
            </div>
          )}
        </div>

        {/* Mensaje */}
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

        {/* Resultados */}
        <div style={styles.resultsHeader}>
          <h3 style={styles.resultsTitle}>
            Resultados
            <span style={styles.resultsCount}>
              ({filteredSobrecupos.length} disponibles)
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Cargando sobrecupos disponibles...</p>
          </div>
        ) : filteredSobrecupos.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>😔</div>
            <h3 style={styles.emptyTitle}>No se encontraron sobrecupos</h3>
            <p style={styles.emptyDescription}>
              {sobrecupos.length === 0 
                ? "No hay sobrecupos disponibles en este momento."
                : "No hay citas disponibles que coincidan con tus filtros."
              }
            </p>
            {sobrecupos.length > 0 && (
              <button onClick={clearFilters} style={styles.primaryButton}>
                Ver todos los sobrecupos
              </button>
            )}
          </div>
        ) : (
          <div style={styles.resultsContainer}>
            {filteredSobrecupos.map((sobrecupo) => (
              <div key={sobrecupo.id} style={styles.card}>
                <div style={styles.cardContent}>
                  <div style={styles.cardLeft}>
                    <div style={styles.doctorHeader}>
                      <div style={styles.avatar}>
                        {sobrecupo.fields.Médico ? 
                          sobrecupo.fields.Médico.split(' ').map(n => n[0]).join('').substring(0, 2) : 
                          'Dr'
                        }
                      </div>
                      <div style={styles.doctorInfo}>
                        <h3 style={styles.doctorName}>
                          {sobrecupo.fields.Médico || 'Médico no especificado'}
                        </h3>
                        <p style={styles.specialty}>
                          {sobrecupo.fields.Especialidad || 'Especialidad no especificada'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={styles.detailsGrid}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>🏥</span>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>Clínica:</span>
                          <span style={styles.detailValue}>
                            {sobrecupo.fields.Clínica || sobrecupo.fields.Clinica || 'Clínica no especificada'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>📍</span>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>Dirección:</span>
                          <span style={styles.detailValue}>
                            {sobrecupo.fields.Dirección || sobrecupo.fields.Direccion || 'Dirección no especificada'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>📅</span>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>Fecha y Hora:</span>
                          <span style={styles.detailValue}>
                            {formatDate(sobrecupo.fields.Fecha)} - {sobrecupo.fields.Hora || 'Hora no especificada'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>💳</span>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>Seguros:</span>
                          <span style={styles.detailValue}>
                            {getPrevisiones(sobrecupo)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>👥</span>
                        <div style={styles.detailContent}>
                          <span style={styles.detailLabel}>Atiende:</span>
                          <span style={styles.detailValue}>
                            {getTipoPacientes(sobrecupo)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.cardRight}>
                    <button
                      onClick={() => handleReservarClick(sobrecupo)}
                      style={styles.reserveButton}
                    >
                      <span style={styles.buttonText}>Reservar Cita</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Reserva */}
      {showReservationModal && selectedSobrecupo && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Agendar sobrecupo</h3>
              <button 
                onClick={handleCloseModal}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalInfo}>
              <div style={styles.modalDoctorHeader}>
                <div style={styles.modalAvatar}>
                  {selectedSobrecupo.fields.Médico ? 
                    selectedSobrecupo.fields.Médico.split(' ').map(n => n[0]).join('').substring(0, 2) : 
                    'Dr'
                  }
                </div>
                <div>
                  <p style={styles.modalDoctorName}>
                    {selectedSobrecupo.fields.Médico || 'Médico no especificado'}
                  </p>
                  <p style={styles.modalSpecialty}>
                    {selectedSobrecupo.fields.Especialidad || 'Especialidad no especificada'}
                  </p>
                  <p style={styles.modalClinic}>
                    {selectedSobrecupo.fields.Clínica || selectedSobrecupo.fields.Clinica}
                  </p>
                  <p style={styles.modalDateTime}>
                    {formatDate(selectedSobrecupo.fields.Fecha)} - {selectedSobrecupo.fields.Hora}
                  </p>
                  <p style={styles.modalSeguro}>
                    Acepta: {getPrevisiones(selectedSobrecupo)}
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.form}>
              <h3 style={styles.formSectionTitle}>Datos personales</h3>
              <p style={styles.formSubtitle}>Ingresa tus datos para agendar la cita.</p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nombres</label>
                <input
                  type="text"
                  value={reservationData.nombre}
                  onChange={(e) => setReservationData(prev => ({ ...prev, nombre: e.target.value }))}
                  style={styles.formInput}
                  placeholder="Juana Martina"
                  disabled={reservationLoading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Apellidos</label>
                <input
                  type="text"
                  value={reservationData.apellidos || ''}
                  onChange={(e) => setReservationData(prev => ({ ...prev, apellidos: e.target.value }))}
                  style={styles.formInput}
                  placeholder="González Urrutia"
                  disabled={reservationLoading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Rut</label>
                <input
                  type="text"
                  value={reservationData.rut}
                  onChange={(e) => setReservationData(prev => ({ ...prev, rut: e.target.value }))}
                  style={styles.formInput}
                  placeholder="12.345.678-9"
                  disabled={reservationLoading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Correo electrónico</label>
                <input
                  type="email"
                  value={reservationData.email}
                  onChange={(e) => setReservationData(prev => ({ ...prev, email: e.target.value }))}
                  style={styles.formInput}
                  placeholder="juanagonzalez@gmail.com"
                  disabled={reservationLoading}
                />
              </div>

              {/* Checkbox de términos y condiciones */}
              <div style={styles.checkboxContainer}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={styles.checkbox}
                    disabled={reservationLoading}
                  />
                  <span style={styles.checkboxText}>
                    Acepto los <a href="#" style={styles.link}>términos y condiciones</a>
                  </span>
                </label>
              </div>

              {/* Mensaje de advertencia */}
              <div style={styles.warningContainer}>
                <div style={styles.warningIcon}>⚠️</div>
                <div style={styles.warningContent}>
                  <strong style={styles.warningTitle}>¡Atención!</strong>
                  <p style={styles.warningText}>
                    Debes pagar el bono de tu consulta al llegar al centro médico.
                  </p>
                </div>
              </div>

              {/* Botón de agendar */}
              <button
                onClick={handleReservationSubmit}
                disabled={reservationLoading || !acceptTerms}
                style={{
                  ...styles.agendarButton,
                  opacity: (!acceptTerms || reservationLoading) ? 0.5 : 1,
                  cursor: (!acceptTerms || reservationLoading) ? 'not-allowed' : 'pointer'
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
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'
  },

  // Header
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '80px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logo: {
    position: 'relative',
    display: 'inline-block'
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    display: 'inline-flex',
    alignItems: 'baseline'
  },
  logoMain: {
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#424245',
    margin: 0,
    fontWeight: '400'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    color: '#424245',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(20px)'
  },
  backArrow: {
    fontSize: '18px'
  },

  // Container
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '3rem 2rem'
  },

  // Title section
  titleSection: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  mainTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: '#1d1d1f',
    marginBottom: '1.5rem',
    letterSpacing: '-2px',
    lineHeight: '1.1'
  },
  description: {
    color: '#424245',
    maxWidth: '700px',
    margin: '0 auto',
    fontSize: '1.3rem',
    lineHeight: '1.6',
    fontWeight: '400'
  },

  // Filters
  filtersContainer: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    marginBottom: '3rem',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  filtersRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '2rem',
    alignItems: 'end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '12px',
    letterSpacing: '-0.2px'
  },
  select: {
    width: '100%',
    padding: '16px 20px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '16px',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px'
  },
  clearButton: {
    padding: '16px 24px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#424245',
    borderRadius: '16px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    height: 'fit-content',
    whiteSpace: 'nowrap'
  },
  activeFilters: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  activeFiltersLabel: {
    fontSize: '14px',
    color: '#6e6e73',
    fontWeight: '500'
  },
  filterTag: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    color: '#007aff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(0, 122, 255, 0.2)'
  },

  // Message
  message: {
    padding: '20px 24px',
    borderRadius: '16px',
    marginBottom: '2rem',
    border: '2px solid',
    fontWeight: '500',
    fontSize: '16px'
  },

  // Results
  resultsHeader: {
    marginBottom: '2rem'
  },
  resultsTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  resultsCount: {
    fontSize: '1.2rem',
    fontWeight: '400',
    color: '#6e6e73',
    marginLeft: '8px'
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },

  // Loading
  loadingContainer: {
    textAlign: 'center',
    padding: '4rem',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(20px)'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(0, 122, 255, 0.1)',
    borderTop: '4px solid #007aff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem'
  },
  loadingText: {
    color: '#6e6e73',
    fontSize: '18px',
    fontWeight: '500'
  },

  // Empty
  emptyContainer: {
    textAlign: 'center',
    padding: '4rem',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(20px)'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '1rem'
  },
  emptyDescription: {
    color: '#6e6e73',
    fontSize: '16px',
    marginBottom: '2rem',
    lineHeight: '1.5'
  },
  primaryButton: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },

  // Cards
  card: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    cursor: 'pointer'
  },
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '2rem'
  },
  cardLeft: {
    flex: 1
  },
  cardRight: {
    flexShrink: 0
  },
  doctorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  avatar: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '24px',
    boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
    letterSpacing: '-0.5px'
  },
  doctorInfo: {
    flex: 1
  },
  doctorName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: 0,
    marginBottom: '4px',
    letterSpacing: '-0.5px',
    lineHeight: '1.2'
  },
  specialty: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#007aff',
    margin: 0,
    letterSpacing: '-0.2px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '12px 0'
  },
  detailIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px'
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6e6e73',
    letterSpacing: '-0.1px'
  },
  detailValue: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1d1d1f',
    lineHeight: '1.4'
  },
  reserveButton: {
    padding: '20px 32px',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
    minWidth: '180px',
    letterSpacing: '-0.2px'
  },
  buttonText: {
    display: 'block'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    zIndex: 1000,
    backdropFilter: 'blur(10px)'
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  closeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: '#424245',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  modalInfo: {
    background: 'rgba(0, 122, 255, 0.05)',
    border: '1px solid rgba(0, 122, 255, 0.1)',
    padding: '2rem',
    borderRadius: '20px',
    marginBottom: '2rem'
  },
  modalDoctorHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem'
  },
  modalAvatar: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '20px',
    flexShrink: 0
  },
  modalDoctorName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: '0 0 4px 0'
  },
  modalSpecialty: {
    color: '#007aff',
    margin: '0 0 4px 0',
    fontWeight: '600',
    fontSize: '16px'
  },
  modalClinic: {
    color: '#424245',
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '500'
  },
  modalDateTime: {
    color: '#424245',
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '500'
  },
  modalSeguro: {
    color: '#424245',
    margin: '0',
    fontSize: '14px',
    fontWeight: '500'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formSectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px'
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#6e6e73',
    margin: '0 0 24px 0',
    lineHeight: '1.4'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '8px',
    letterSpacing: '-0.2px'
  },
  formInput: {
    width: '100%',
    padding: '16px 20px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '16px',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxSizing: 'border-box',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    outline: 'none',
    fontFamily: 'inherit'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem'
  },
  checkboxContainer: {
    marginTop: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#007aff'
  },
  checkboxText: {
    color: '#1d1d1f',
    fontSize: '14px'
  },
  link: {
    color: '#007aff',
    textDecoration: 'underline',
    fontWeight: '500'
  },
  warningContainer: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '12px',
    marginTop: '8px'
  },
  warningIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px'
  },
  warningContent: {
    flex: 1
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#856404',
    margin: '0 0 4px 0'
  },
  warningText: {
    fontSize: '13px',
    color: '#856404',
    margin: 0,
    lineHeight: '1.4'
  },
  agendarButton: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    marginTop: '12px'
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