'use client';
import { useState, useEffect } from 'react';

export default function DebugDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/doctors');
        const data = await response.json();
        console.log('🔍 Raw doctors data:', data);
        setDoctors(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) return <div style={{padding: '2rem'}}>Cargando...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🔍 Debug Doctor Data</h1>
      <p>Datos completos de médicos desde Airtable</p>

      {doctors.map((doctor, index) => (
        <div key={doctor.id} style={{
          background: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{color: '#171717', marginBottom: '1rem'}}>
            {doctor.fields?.Name || 'Sin nombre'} (ID: {doctor.id})
          </h2>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
            <div>
              <h3 style={{color: '#ff9500', fontSize: '1rem', marginBottom: '0.5rem'}}>Datos básicos:</h3>
              <ul style={{fontSize: '0.875rem', lineHeight: '1.5'}}>
                <li><strong>Nombre:</strong> {doctor.fields?.Name || 'N/A'}</li>
                <li><strong>Email:</strong> {doctor.fields?.Email || 'N/A'}</li>
                <li><strong>Especialidad:</strong> {doctor.fields?.Especialidad || 'N/A'}</li>
                <li><strong>WhatsApp:</strong> {doctor.fields?.WhatsApp || 'N/A'}</li>
              </ul>
            </div>

            <div>
              <h3 style={{color: '#ff9500', fontSize: '1rem', marginBottom: '0.5rem'}}>AreasInteres:</h3>
              <div style={{
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e5e5e5'
              }}>
                <p><strong>Tipo:</strong> {typeof doctor.fields?.AreasInteres}</p>
                <p><strong>Es Array:</strong> {Array.isArray(doctor.fields?.AreasInteres) ? 'Sí' : 'No'}</p>
                <p><strong>Valor raw:</strong></p>
                <pre style={{
                  fontSize: '0.75rem',
                  background: '#171717',
                  color: '#fff',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(doctor.fields?.AreasInteres, null, 2)}
                </pre>
                
                {doctor.fields?.AreasInteres && typeof doctor.fields.AreasInteres === 'string' && (
                  <>
                    <p><strong>Parsed JSON:</strong></p>
                    <pre style={{
                      fontSize: '0.75rem',
                      background: '#0f5132',
                      color: '#fff',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      overflow: 'auto'
                    }}>
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(doctor.fields.AreasInteres), null, 2);
                        } catch (e) {
                          return 'Error parsing: ' + e.message;
                        }
                      })()}
                    </pre>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{marginTop: '1rem'}}>
            <h3 style={{color: '#ff9500', fontSize: '1rem', marginBottom: '0.5rem'}}>Todos los campos:</h3>
            <pre style={{
              fontSize: '0.75rem',
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(doctor.fields, null, 2)}
            </pre>
          </div>

          <div style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
            <button
              onClick={() => window.open(`/medico-info/${encodeURIComponent(doctor.fields?.Name)}`, '_blank')}
              style={{
                background: '#ff9500',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Ver Perfil Público
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}