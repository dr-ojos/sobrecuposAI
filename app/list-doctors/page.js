'use client';
import React, { useState, useEffect } from 'react';

export default function ListDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [foundTable, setFoundTable] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/list-doctors');
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.doctors);
        setFoundTable(data.foundTable);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copiado: ${text}`);
  };

  if (loading) return <div style={{ padding: '20px' }}>🔄 Cargando médicos...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>❌ Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👨‍⚕️ Lista de Médicos - Airtable IDs</h1>
      <p>Tabla encontrada: <strong>{foundTable}</strong></p>
      <p>Total médicos: <strong>{doctors.length}</strong></p>
      
      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {doctors.map((doctor) => (
          <div 
            key={doctor.id} 
            style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              borderRadius: '8px',
              background: '#f9f9f9'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
              {doctor.name}
            </h3>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>ID:</strong> 
              <code 
                style={{ 
                  background: '#e1f5fe', 
                  padding: '2px 6px', 
                  margin: '0 5px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                onClick={() => copyToClipboard(doctor.id)}
                title="Clic para copiar"
              >
                {doctor.id}
              </code>
              📋
            </div>
            
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div><strong>Email:</strong> {doctor.email}</div>
              <div><strong>WhatsApp:</strong> {doctor.whatsapp}</div>
              <div><strong>Especialidad:</strong> {doctor.especialidad}</div>
              <div><strong>Estado:</strong> {doctor.estado}</div>
            </div>

            <button
              onClick={() => {
                const url = `/debug-doctor-notifications?doctorId=${doctor.id}`;
                window.open(url, '_blank');
              }}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🧪 Probar Notificaciones
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f0f8ff', border: '1px solid #ccc' }}>
        <h3>💡 Cómo usar:</h3>
        <ol>
          <li><strong>Copia el ID</strong> del médico haciendo clic en el código azul</li>
          <li><strong>Ve a /debug-doctor-notifications</strong></li>
          <li><strong>Pega el ID</strong> en el campo "Doctor ID (Airtable)"</li>
          <li><strong>Prueba las notificaciones</strong> para ver si funcionan</li>
        </ol>
        <p>O usa el botón "🧪 Probar Notificaciones" para ir directamente.</p>
      </div>
    </div>
  );
}