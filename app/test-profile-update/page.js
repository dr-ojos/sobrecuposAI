'use client';
import { useState } from 'react';

export default function TestProfileUpdate() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testUpdateProfile = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Primero obtener un doctor real para usar su ID
      const doctorsResponse = await fetch('/api/doctors');
      const doctors = await doctorsResponse.json();
      
      if (!doctors || doctors.length === 0) {
        throw new Error('No se encontraron doctores para probar');
      }

      const firstDoctor = doctors[0];
      
      // Buscar específicamente a José Peña o usar el primero
      const josePena = doctors.find(d => d.fields?.Name?.includes('José') || d.fields?.Name?.includes('Peña'));
      const targetDoctor = josePena || firstDoctor;
      
      // Datos de prueba usando ID real
      const testData = {
        id: targetDoctor.id,
        Name: targetDoctor.fields.Name || 'Dr. Test',
        Email: targetDoctor.fields.Email || 'test@test.com',
        Especialidad: targetDoctor.fields.Especialidad || 'Medicina Interna',
        AreasInteres: targetDoctor.fields.Especialidad === 'Medicina Interna' 
          ? ['Medicina Hospitalaria', 'Diabetes', 'Hipertensión']
          : ['Cirugía refractiva Láser', 'Córnea']
      };

      console.log('🧪 Enviando datos de prueba:', testData);
      console.log('🔍 Doctor original:', firstDoctor);

      const response = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toLocaleTimeString()
      });

      console.log('📊 Resultado de prueba:', {
        success: response.ok,
        status: response.status,
        data: result
      });

    } catch (error) {
      console.error('❌ Error en prueba:', error);
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test de endpoint de áreas de interés
      const response = await fetch('/api/areas-interes?especialidad=Oftalmología');
      const result = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        endpoint: '/api/areas-interes',
        timestamp: new Date().toLocaleTimeString()
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        endpoint: '/api/areas-interes',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🧪 Test Profile Update API</h1>
      <p>Prueba la API de actualización de perfil médico</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={testUpdateProfile}
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#ff9500',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Probando...' : '🚀 Test PUT /api/doctors'}
        </button>

        <button
          onClick={testAPI}
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#171717',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Probando...' : '🔍 Test Areas API'}
        </button>
      </div>

      {testResult && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid ${testResult.success ? '#4ade80' : '#ef4444'}`,
          borderRadius: '8px',
          background: testResult.success ? '#f0fdf4' : '#fef2f2',
          marginBottom: '2rem'
        }}>
          <h3>📋 Resultado del Test</h3>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
            <p><strong>Timestamp:</strong> {testResult.timestamp}</p>
            <p><strong>Success:</strong> {testResult.success ? '✅ Sí' : '❌ No'}</p>
            {testResult.status && <p><strong>Status:</strong> {testResult.status}</p>}
            {testResult.endpoint && <p><strong>Endpoint:</strong> {testResult.endpoint}</p>}
            {testResult.error && (
              <p style={{ color: '#dc2626' }}><strong>Error:</strong> {testResult.error}</p>
            )}
            {testResult.data && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Respuesta:</strong>
                <pre style={{ 
                  background: '#f9fafb', 
                  padding: '1rem', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '0.8125rem',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ 
        background: '#f9fafb', 
        padding: '1rem', 
        borderRadius: '8px',
        fontSize: '0.875rem'
      }}>
        <h3>💡 Instrucciones</h3>
        <ul>
          <li><strong>Test PUT /api/doctors:</strong> Simula una actualización de perfil con AreasInteres</li>
          <li><strong>Test Areas API:</strong> Verifica que el endpoint de áreas funcione</li>
          <li>Revisa la consola del navegador (F12 → Console) para logs detallados</li>
          <li>Revisa la terminal del servidor para logs del backend</li>
        </ul>
      </div>
    </div>
  );
}