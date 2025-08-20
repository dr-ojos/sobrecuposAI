'use client';
import { useState, useEffect } from 'react';

export default function DebugSobrecupos() {
  const [sobrecupos, setSobrecupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSobrecupos();
  }, []);

  const fetchSobrecupos = async () => {
    try {
      // Usando el ID de Alex Espinoza (quien tiene el sobrecupo actualizado)
      const res = await fetch('/api/sobrecupos/medicos/rec8r7ZKWdDAsJrL4');
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
        console.log('📋 Sobrecupos obtenidos:', data);
      } else {
        setError(`Error ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Cargando sobrecupos...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Error: {error}</h1>
        <button onClick={fetchSobrecupos}>Reintentar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔍 Debug - Sobrecupos del Médico</h1>
      <p><strong>Total sobrecupos:</strong> {sobrecupos.length}</p>
      
      <h2>📊 Datos Raw:</h2>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '12px'
      }}>
        {JSON.stringify(sobrecupos, null, 2)}
      </pre>

      <h2>🎯 Sobrecupos Reservados (con datos de paciente):</h2>
      {sobrecupos.filter(s => s.fields?.Disponible !== 'Si').map((sobrecupo, index) => (
        <div key={sobrecupo.id} style={{
          border: '1px solid #ddd',
          margin: '1rem 0',
          padding: '1rem',
          borderRadius: '8px',
          background: '#fff'
        }}>
          <h3>Sobrecupo #{index + 1}</h3>
          <p><strong>ID:</strong> {sobrecupo.id}</p>
          <p><strong>Fecha:</strong> {sobrecupo.fields?.Fecha}</p>
          <p><strong>Hora:</strong> {sobrecupo.fields?.Hora}</p>
          <p><strong>Disponible:</strong> {sobrecupo.fields?.Disponible}</p>
          
          <h4>📋 Datos del Paciente:</h4>
          <p><strong>Nombre:</strong> {sobrecupo.fields?.Nombre || '❌ No disponible'}</p>
          <p><strong>Edad:</strong> {sobrecupo.fields?.Edad || '❌ No disponible'}</p>
          <p><strong>Email:</strong> {sobrecupo.fields?.Email || '❌ No disponible'}</p>
          <p><strong>Teléfono:</strong> {sobrecupo.fields?.Telefono || '❌ No disponible'}</p>
          <p><strong>RUT:</strong> {sobrecupo.fields?.RUT || '❌ No disponible'}</p>
          <p><strong>Motivo:</strong> {sobrecupo.fields?.['Motivo Consulta'] || '❌ No disponible'}</p>
          
          <h4>🔍 Todos los campos disponibles:</h4>
          <ul>
            {Object.keys(sobrecupo.fields || {}).map(field => (
              <li key={field}>
                <strong>{field}:</strong> {JSON.stringify(sobrecupo.fields[field])}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2>✅ Sobrecupos Disponibles:</h2>
      {sobrecupos.filter(s => s.fields?.Disponible === 'Si').map((sobrecupo, index) => (
        <div key={sobrecupo.id} style={{
          border: '1px solid #ddd',
          margin: '1rem 0',
          padding: '1rem',
          borderRadius: '8px',
          background: '#f9f9f9'
        }}>
          <h3>Sobrecupo Disponible #{index + 1}</h3>
          <p><strong>Fecha:</strong> {sobrecupo.fields?.Fecha}</p>
          <p><strong>Hora:</strong> {sobrecupo.fields?.Hora}</p>
          <p><strong>Clínica:</strong> {sobrecupo.fields?.Clínica}</p>
        </div>
      ))}
    </div>
  );
}