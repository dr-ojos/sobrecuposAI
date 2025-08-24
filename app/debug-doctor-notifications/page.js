'use client';
import React, { useState } from 'react';

export default function DebugDoctorNotifications() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorEmail: '',
    doctorWhatsapp: '',
    doctorName: 'Dr. Test',
    patientName: 'Juan Pérez Test',
    motivo: 'Test de notificaciones del sistema'
  });

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/debug-doctor-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error de conexión: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Debug Notificaciones Médicas</h1>
      <p>Herramienta para probar notificaciones en producción</p>
      
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Datos del Médico</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Doctor ID (Airtable):</label><br/>
          <input 
            type="text"
            placeholder="recXXXXXXXX"
            value={formData.doctorId}
            onChange={e => setFormData({...formData, doctorId: e.target.value})}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Email del médico:</label><br/>
          <input 
            type="email"
            placeholder="doctor@example.com"
            value={formData.doctorEmail}
            onChange={e => setFormData({...formData, doctorEmail: e.target.value})}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>WhatsApp del médico:</label><br/>
          <input 
            type="text"
            placeholder="+56912345678"
            value={formData.doctorWhatsapp}
            onChange={e => setFormData({...formData, doctorWhatsapp: e.target.value})}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Nombre del médico:</label><br/>
          <input 
            type="text"
            value={formData.doctorName}
            onChange={e => setFormData({...formData, doctorName: e.target.value})}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Nombre del paciente:</label><br/>
          <input 
            type="text"
            value={formData.patientName}
            onChange={e => setFormData({...formData, patientName: e.target.value})}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Motivo de consulta:</label><br/>
          <textarea 
            value={formData.motivo}
            onChange={e => setFormData({...formData, motivo: e.target.value})}
            style={{ width: '300px', height: '60px', padding: '5px' }}
          />
        </div>
        
        <button 
          onClick={handleTest}
          disabled={loading || (!formData.doctorId && !formData.doctorEmail && !formData.doctorWhatsapp)}
          style={{ 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#007bff',
            color: 'white', 
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Enviando...' : '🚀 Probar Notificaciones'}
        </button>
      </div>
      
      {result && (
        <div style={{ 
          border: '1px solid #333', 
          padding: '15px', 
          background: '#f8f8f8',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>📊 Resultado:</h3>
          <div style={{ 
            background: result.success ? '#d4edda' : '#f8d7da',
            padding: '10px',
            marginBottom: '10px',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {result.success ? '✅ SUCCESS' : '❌ FAILED'}
          </div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}