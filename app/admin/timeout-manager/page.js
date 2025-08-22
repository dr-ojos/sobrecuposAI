'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TimeoutManager() {
  const { data: session, status } = useSession();
  const [timeouts, setTimeouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  const fetchTimeouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sobrecupos/cleanup-timeouts');
      if (response.ok) {
        const data = await response.json();
        setTimeouts(data.sobrecupos || []);
        setStats({
          total: data.total || 0,
          active: data.active || 0,
          expired: data.expired || 0
        });
      } else {
        setMessage('❌ Error obteniendo timeouts');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
    setLoading(false);
  };

  const executeCleanup = async () => {
    setLoading(true);
    setMessage('🧹 Ejecutando limpieza...');
    
    try {
      const response = await fetch('/api/sobrecupos/cleanup-timeouts', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ ${data.message}`);
        // Actualizar datos después de la limpieza
        setTimeout(fetchTimeouts, 1000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      setMessage('❌ Error ejecutando limpieza');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTimeouts();
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchTimeouts, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>⏳ Cargando...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>🔒 Acceso no autorizado</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            margin: '0 0 2rem 0',
            color: '#171717',
            fontSize: '1.75rem',
            fontWeight: 600
          }}>⏰ Gestión de Timeouts de Pago</h1>

          {/* Estadísticas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#171717' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Total Temporales
              </div>
            </div>

            <div style={{
              background: '#f0f9ff',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0369a1' }}>
                {stats.active}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0369a1', marginTop: '0.5rem' }}>
                Activos
              </div>
            </div>

            <div style={{
              background: '#fef2f2',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              border: '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
                {stats.expired}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.5rem' }}>
                Vencidos
              </div>
            </div>
          </div>

          {/* Controles */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={fetchTimeouts}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loading ? 0.6 : 1
              }}
            >
              🔄 Actualizar
            </button>

            <button
              onClick={executeCleanup}
              disabled={loading || stats.expired === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: stats.expired > 0 ? '#dc2626' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || stats.expired === 0) ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              🧹 Limpiar Vencidos ({stats.expired})
            </button>
          </div>

          {/* Mensaje */}
          {message && (
            <div style={{
              background: message.includes('❌') ? '#fef2f2' : '#f0f9ff',
              color: message.includes('❌') ? '#dc2626' : '#0369a1',
              border: `1px solid ${message.includes('❌') ? '#fecaca' : '#bae6fd'}`,
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              {message}
            </div>
          )}

          {/* Lista de Timeouts */}
          <div>
            <h2 style={{
              margin: '0 0 1rem 0',
              color: '#171717',
              fontSize: '1.25rem',
              fontWeight: 600
            }}>Sobrecupos con Timeout Activo</h2>

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                ⏳ Cargando...
              </div>
            )}

            {!loading && timeouts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                ✅ No hay sobrecupos con timeout pendiente
              </div>
            )}

            {!loading && timeouts.length > 0 && (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {timeouts.map(timeout => (
                  <div
                    key={timeout.id}
                    style={{
                      background: timeout.status === 'expired' ? '#fef2f2' : '#f0f9ff',
                      border: `1px solid ${timeout.status === 'expired' ? '#fecaca' : '#bae6fd'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: timeout.status === 'expired' ? '#dc2626' : '#0369a1'
                    }}></div>

                    <div>
                      <div style={{ fontWeight: 600, color: '#171717' }}>
                        ID: {timeout.id}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        Session: {timeout.sessionId}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: timeout.status === 'expired' ? '#dc2626' : '#0369a1',
                        fontWeight: 600
                      }}>
                        {timeout.status === 'expired' ? 'VENCIDO' : `${timeout.remainingMinutes}m restantes`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {timeout.paymentTimeout && new Date(timeout.paymentTimeout).toLocaleString('es-ES')}
                      </div>
                    </div>

                    <div>
                      {timeout.status === 'expired' ? '⏰' : '⏳'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}