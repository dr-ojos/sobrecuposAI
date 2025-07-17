'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSobrecuposPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
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
      setDoctors(data);
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

  const toggleHour = (hour) => {
    setSelectedHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort()
    );
  };

  const selectTimeRange = () => {
    const startHour = prompt("Hora de inicio (ej: 09:00)");
    const endHour = prompt("Hora de fin (ej: 17:00)");
    
    if (startHour && endHour) {
      const startIndex = availableHours.indexOf(startHour);
      const endIndex = availableHours.indexOf(endHour);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        const rangeHours = availableHours.slice(startIndex, endIndex + 1);
        setSelectedHours(rangeHours);
      } else {
        alert("Horarios inválidos");
      }
    }
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #fafdff 0%, #e8f0fb 100%)',
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      color: '#23272F'
    }}>
      {/* Header con logo y navegación */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(155, 171, 186, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <img
            src="/sobrecupos.svg"
            alt="Sobrecupos"
            style={{
              height: '32px',
              width: 'auto'
            }}
          />
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#23263b'
          }}>
            Panel de Administración
          </div>
        </div>
        
        <button
          onClick={() => router.push('/')}
          style={{
            background: '#23263b',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.17s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={e => {
            e.target.style.background = '#1a1d2e';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.target.style.background = '#23263b';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Volver al Inicio
        </button>
      </div>

      {/* Navegación por tabs */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(155, 171, 186, 0.2)',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <button 
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === "crear" ? '#23263b' : '#9cabba',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === "crear" ? '3px solid #23263b' : '3px solid transparent',
              fontFamily: 'inherit'
            }}
            onClick={() => setActiveTab("crear")}
          >
            💼 Crear Sobrecupos
          </button>
          <button 
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === "gestionar" ? '#23263b' : '#9cabba',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === "gestionar" ? '3px solid #23263b' : '3px solid transparent',
              fontFamily: 'inherit'
            }}
            onClick={() => setActiveTab("gestionar")}
          >
            📋 Gestionar Existentes
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Mensajes de estado */}
        {msg && (
          <div style={{
            padding: '1rem 1.5rem',
            borderRadius: '18px',
            marginBottom: '2rem',
            background: msg.includes("✅") ? '#e6ffed' : msg.includes("❌") ? '#fee' : '#fff3cd',
            color: msg.includes("✅") ? '#006400' : msg.includes("❌") ? '#b00020' : '#856404',
            border: `1px solid ${msg.includes("✅") ? '#c3e6cb' : msg.includes("❌") ? '#f5c6cb' : '#ffeaa7'}`,
            fontSize: '1rem',
            fontWeight: '500',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
          }}>
            {msg}
          </div>
        )}

        {/* Tab de Crear Sobrecupos */}
        {activeTab === "crear" && (
          <div>
            {!showPreview ? (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              }}>
                {/* Header del formulario */}
                <div style={{
                  background: 'linear-gradient(135deg, #23263b 0%, #1a1d2e 100%)',
                  color: 'white',
                  padding: '2.5rem 2rem',
                  textAlign: 'center'
                }}>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem',
                    letterSpacing: '-0.02em'
                  }}>
                    Crear Sobrecupos
                  </h1>
                  <p style={{
                    fontSize: '1.1rem',
                    opacity: '0.9',
                    margin: '0',
                    fontWeight: '400'
                  }}>
                    Agrega horarios disponibles de forma rápida y eficiente
                  </p>
                </div>

                {/* Paso 1: Médico */}
                <div style={{ padding: '2.5rem 2rem' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#23263b',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}>
                        1
                      </div>
                      <h2 style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        margin: '0',
                        color: '#23272F'
                      }}>
                        Seleccionar Médico
                      </h2>
                    </div>
                    <p style={{
                      fontSize: '1rem',
                      color: '#9cabba',
                      margin: '0',
                      paddingLeft: '2.75rem'
                    }}>
                      Elige el profesional para crear sobrecupos
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.2rem'
                  }}>
                    {doctors.map(doctor => (
                      <div 
                        key={doctor.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1.5rem',
                          border: `2px solid ${selectedDoctor?.id === doctor.id ? '#23263b' : '#f1f5f9'}`,
                          borderRadius: '18px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: selectedDoctor?.id === doctor.id ? '#f8faff' : 'white',
                          boxShadow: selectedDoctor?.id === doctor.id ? '0 8px 32px rgba(35, 38, 59, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                        onClick={() => setSelectedDoctor(doctor)}
                        onMouseEnter={e => {
                          if (selectedDoctor?.id !== doctor.id) {
                            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                            e.target.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (selectedDoctor?.id !== doctor.id) {
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: selectedDoctor?.id === doctor.id ? '#23263b' : '#e8f0fb',
                          color: selectedDoctor?.id === doctor.id ? 'white' : '#23263b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          marginRight: '1rem',
                          flexShrink: '0'
                        }}>
                          {doctor.fields.Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: '1', minWidth: '0' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#23272F',
                            marginBottom: '0.25rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            Dr. {doctor.fields.Name}
                          </div>
                          <div style={{
                            fontSize: '0.95rem',
                            color: '#9cabba',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {doctor.fields.Especialidad}
                          </div>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <div style={{
                            color: '#23263b',
                            fontSize: '1.4rem',
                            marginLeft: '0.75rem'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDoctor && (
                  <>
                    <div style={{
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, #e8f0fb, transparent)',
                      margin: '0 2rem'
                    }}></div>

                    {/* Paso 2: Ubicación */}
                    <div style={{ padding: '2.5rem 2rem' }}>
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#23263b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: '700'
                          }}>
                            2
                          </div>
                          <h2 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            margin: '0',
                            color: '#23272F'
                          }}>
                            Información de la Consulta
                          </h2>
                        </div>
                        <p style={{
                          fontSize: '1rem',
                          color: '#9cabba',
                          margin: '0',
                          paddingLeft: '2.75rem'
                        }}>
                          Datos del lugar donde se realizará la atención
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.5rem'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#23272F',
                            marginBottom: '0.75rem'
                          }}>
                            Clínica o Centro Médico
                          </label>
                          <input
                            type="text"
                            value={clinica}
                            onChange={e => setClinica(e.target.value)}
                            placeholder="Ej: Clínica Las Condes"
                            style={{
                              width: '100%',
                              padding: '1rem 1.25rem',
                              border: '2px solid #e8f0fb',
                              borderRadius: '12px',
                              fontSize: '1rem',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s ease',
                              background: 'white',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => {
                              e.target.style.borderColor = '#23263b';
                              e.target.style.boxShadow = '0 0 0 3px rgba(35, 38, 59, 0.1)';
                            }}
                            onBlur={e => {
                              e.target.style.borderColor = '#e8f0fb';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#23272F',
                            marginBottom: '0.75rem'
                          }}>
                            Dirección
                          </label>
                          <input
                            type="text"
                            value={direccion}
                            onChange={e => setDireccion(e.target.value)}
                            placeholder="Ej: Av. Las Condes 123"
                            style={{
                              width: '100%',
                              padding: '1rem 1.25rem',
                              border: '2px solid #e8f0fb',
                              borderRadius: '12px',
                              fontSize: '1rem',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s ease',
                              background: 'white',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => {
                              e.target.style.borderColor = '#23263b';
                              e.target.style.boxShadow = '0 0 0 3px rgba(35, 38, 59, 0.1)';
                            }}
                            onBlur={e => {
                              e.target.style.borderColor = '#e8f0fb';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, #e8f0fb, transparent)',
                      margin: '0 2rem'
                    }}></div>

                    {/* Paso 3: Fecha y Horarios */}
                    <div style={{ padding: '2.5rem 2rem' }}>
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#23263b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: '700'
                          }}>
                            3
                          </div>
                          <h2 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            margin: '0',
                            color: '#23272F'
                          }}>
                            Fecha y Horarios
                          </h2>
                        </div>
                        <p style={{
                          fontSize: '1rem',
                          color: '#9cabba',
                          margin: '0',
                          paddingLeft: '2.75rem'
                        }}>
                          Selecciona el día y los horarios disponibles
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '3rem',
                        alignItems: 'start'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#23272F',
                            marginBottom: '0.75rem'
                          }}>
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                              padding: '1rem 1.25rem',
                              border: '2px solid #e8f0fb',
                              borderRadius: '12px',
                              fontSize: '1rem',
                              fontFamily: 'inherit',
                              background: 'white'
                            }}
                          />
                        </div>
                        
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                          }}>
                            <label style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#23272F'
                            }}>
                              Horarios disponibles
                            </label>
                            <div style={{
                              display: 'flex',
                              gap: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              <AnimatedButton
                                onClick={selectAllMorning}
                                color="#23263b" bg="#fff" shadow="#23263b22"
                                small
                              >
                                🌅 Mañana (8-12)
                              </AnimatedButton>
                              <AnimatedButton
                                onClick={selectAllAfternoon}
                                color="#23263b" bg="#fff" shadow="#23263b22"
                                small
                              >
                                🌆 Tarde (13-19)
                              </AnimatedButton>
                              <AnimatedButton
                                onClick={selectTimeRange}
                                color="#23263b" bg="#fff" shadow="#23263b22"
                                small
                              >
                                ⚙️ Personalizado
                              </AnimatedButton>
                              <AnimatedButton
                                onClick={() => setSelectedHours([])}
                                color="#dc3545" bg="#fff" shadow="#dc354522"
                                small
                              >
                                🗑️ Limpiar
                              </AnimatedButton>
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                            gap: '0.75rem'
                          }}>
                            {availableHours.map(hour => (
                              <button
                                key={hour}
                                style={{
                                  padding: '0.75rem 0.5rem',
                                  border: `2px solid ${selectedHours.includes(hour) ? '#23263b' : '#e8f0fb'}`,
                                  borderRadius: '12px',
                                  background: selectedHours.includes(hour) ? '#23263b' : 'white',
                                  color: selectedHours.includes(hour) ? 'white' : '#23272F',
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontFamily: 'inherit'
                                }}
                                onClick={() => toggleHour(hour)}
                                onMouseEnter={e => {
                                  if (!selectedHours.includes(hour)) {
                                    e.target.style.borderColor = '#23263b';
                                    e.target.style.background = '#f8faff';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!selectedHours.includes(hour)) {
                                    e.target.style.borderColor = '#e8f0fb';
                                    e.target.style.background = 'white';
                                  }
                                }}
                              >
                                {hour}
                              </button>
                            ))}
                          </div>
                          
                          <div style={{
                            marginTop: '1.5rem',
                            fontSize: '1rem',
                            color: '#9cabba',
                            fontWeight: '500'
                          }}>
                            <span style={{
                              fontWeight: '700',
                              color: '#23263b'
                            }}>
                              {selectedHours.length}
                            </span> horarios seleccionados
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '2rem',
                      background: '#f8faff',
                      textAlign: 'center'
                    }}>
                      <AnimatedButton 
                        onClick={handleSubmit}
                        disabled={loading || !clinica.trim() || !direccion.trim() || !fecha || selectedHours.length === 0}
                        color="#fff" bg="#23263b" shadow="#23263b44"
                      >
                        {loading ? "⏳ Procesando..." : "👁️ Vista Previa y Confirmar"}
                      </AnimatedButton>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Vista Previa */
              <div style={{
                background: 'white',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  padding: '2.5rem 2rem',
                  textAlign: 'center'
                }}>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem'
                  }}>
                    Confirmar Sobrecupos
                  </h2>
                  <p style={{
                    fontSize: '1.1rem',
                    opacity: '0.9',
                    margin: '0'
                  }}>
                    Revisa la información antes de crear los sobrecupos
                  </p>
                </div>
                
                <div style={{ padding: '2.5rem 2rem' }}>
                  <div style={{
                    background: '#f8faff',
                    borderRadius: '18px',
                    padding: '2rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2.5rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: '#9cabba',
                          marginBottom: '1rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}>
                          Médico
                        </h3>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: '#23272F',
                          marginBottom: '0.5rem'
                        }}>
                          Dr. {selectedDoctor.fields.Name}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#9cabba',
                          fontWeight: '500'
                        }}>
                          {selectedDoctor.fields.Especialidad}
                        </div>
                      </div>
                      
                      <div>
                        <h3 style={{
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: '#9cabba',
                          marginBottom: '1rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}>
                          Ubicación
                        </h3>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: '#23272F',
                          marginBottom: '0.5rem'
                        }}>
                          {clinica}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#9cabba',
                          fontWeight: '500'
                        }}>
                          📍 {direccion}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: '2.5rem',
                      paddingTop: '2rem',
                      borderTop: '2px solid #e8f0fb'
                    }}>
                      <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#9cabba',
                        marginBottom: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Fecha y Horarios ({selectedHours.length})
                      </h3>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: '#23272F',
                        marginBottom: '1.5rem'
                      }}>
                        📅 {formatDate(fecha)}
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        {selectedHours.map(hour => (
                          <span key={hour} style={{
                            background: '#23263b',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}>
                            🕐 {hour}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center'
                  }}>
                    <AnimatedButton 
                      onClick={() => setShowPreview(false)}
                      color="#23263b" bg="#fff" shadow="#23263b22"
                    >
                      ← Editar
                    </AnimatedButton>
                    <AnimatedButton 
                      onClick={handleSubmit}
                      disabled={loading}
                      color="#fff" bg="#16a34a" shadow="#16a34a44"
                    >
                      {loading ? "⏳ Creando..." : `✅ Crear ${selectedHours.length} Sobrecupos`}
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab de Gestionar Existentes */}
        {activeTab === "gestionar" && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #23263b 0%, #1a1d2e 100%)',
              color: 'white',
              padding: '2.5rem 2rem',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 0.5rem'
              }}>
                Sobrecupos Existentes
              </h2>
              <p style={{
                fontSize: '1.1rem',
                opacity: '0.9',
                margin: '0'
              }}>
                Gestiona y elimina sobrecupos ya creados
              </p>
            </div>
            
            <div style={{ padding: '2.5rem 2rem' }}>
              {existingSobrecupos.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: '#9cabba'
                }}>
                  <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    opacity: '0.6'
                  }}>
                    📋
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#23272F',
                    margin: '0 0 1rem'
                  }}>
                    No hay sobrecupos registrados
                  </h3>
                  <p style={{
                    fontSize: '1.1rem',
                    margin: '0 0 2rem',
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    Ve a "Crear Sobrecupos" para comenzar a agregar horarios disponibles
                  </p>
                  <AnimatedButton
                    onClick={() => setActiveTab("crear")}
                    color="#fff" bg="#23263b" shadow="#23263b44"
                  >
                    💼 Crear Primer Sobrecupo
                  </AnimatedButton>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {existingSobrecupos.map((sobrecupo, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      border: '2px solid #f1f5f9',
                      borderRadius: '18px',
                      background: '#fafbff',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#23272F',
                          marginBottom: '0.5rem'
                        }}>
                          Dr. {sobrecupo.fields?.["Médico"] || "N/A"}
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          color: '#23263b',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>
                          🏥 {sobrecupo.fields?.Especialidad}
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          color: '#16a34a',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>
                          📅 {sobrecupo.fields?.Fecha} • 🕐 {sobrecupo.fields?.Hora}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#9cabba',
                          fontWeight: '500'
                        }}>
                          📍 {sobrecupo.fields?.Clínica} - {sobrecupo.fields?.Dirección}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteSobrecupo(sobrecupo.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          marginLeft: '1rem'
                        }}
                        title="Eliminar sobrecupo"
                        onMouseEnter={e => {
                          e.target.style.background = '#c82333';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = '#dc3545';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Botón animado como en la página principal
function AnimatedButton({ children, onClick, color, bg, shadow, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '0.6rem 1.2rem' : '1rem 2rem',
        borderRadius: small ? '12px' : '18px',
        border: 'none',
        fontSize: small ? '0.9rem' : '1rem',
        fontWeight: '600',
        background: disabled ? '#9cabba' : bg,
        color: disabled ? '#fff' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 16px ${shadow}`,
        transition: 'all 0.17s',
        outline: 'none',
        fontFamily: 'inherit',
        opacity: disabled ? '0.6' : '1'
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}
      onTouchStart={e => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onTouchEnd={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}