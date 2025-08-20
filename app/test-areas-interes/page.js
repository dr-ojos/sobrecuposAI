'use client';
import { useState, useEffect } from 'react';
import { getAreasByEspecialidad, getEspecialidadesDisponibles } from '../../lib/areas-interes.js';

export default function TestAreasInteres() {
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('');
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const especialidades = getEspecialidadesDisponibles();

  useEffect(() => {
    if (especialidadSeleccionada) {
      const areas = getAreasByEspecialidad(especialidadSeleccionada);
      setAreasDisponibles(areas);
      setAreasSeleccionadas([]);
    } else {
      setAreasDisponibles([]);
      setAreasSeleccionadas([]);
    }
  }, [especialidadSeleccionada]);

  const handleAreaChange = (area) => {
    setAreasSeleccionadas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const testAPI = async () => {
    if (!especialidadSeleccionada || areasSeleccionadas.length === 0) {
      setTestResult({
        success: false,
        message: 'Selecciona una especialidad y al menos un área de interés'
      });
      return;
    }

    setLoading(true);
    try {
      // Test 1: Validar usando nuestra API
      const response = await fetch(`/api/areas-interes?especialidad=${encodeURIComponent(especialidadSeleccionada)}`);
      const data = await response.json();
      
      // Test 2: Verificar que las áreas seleccionadas sean válidas
      const areasValidas = data.areas || [];
      const areasInvalidas = areasSeleccionadas.filter(area => !areasValidas.includes(area));
      
      setTestResult({
        success: areasInvalidas.length === 0,
        message: areasInvalidas.length === 0 
          ? `✅ Todas las áreas son válidas para ${especialidadSeleccionada}`
          : `❌ Áreas inválidas: ${areasInvalidas.join(', ')}`,
        data: {
          especialidad: especialidadSeleccionada,
          areasSeleccionadas,
          areasValidas,
          areasInvalidas
        }
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error en la API: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🧪 Test Áreas de Interés</h1>
      <p>Prueba la funcionalidad de áreas de interés por especialidad</p>

      <div style={{ marginBottom: '2rem' }}>
        <h3>1. Selecciona una Especialidad</h3>
        <select 
          value={especialidadSeleccionada}
          onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
          style={{ 
            padding: '0.5rem', 
            fontSize: '1rem', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            width: '100%',
            marginBottom: '1rem'
          }}
        >
          <option value="">Selecciona una especialidad...</option>
          {especialidades.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>

        {especialidadSeleccionada && (
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            📊 {areasDisponibles.length} áreas disponibles para {especialidadSeleccionada}
          </p>
        )}
      </div>

      {areasDisponibles.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>2. Selecciona Áreas de Interés</h3>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #e5e5e5', 
            borderRadius: '8px',
            padding: '1rem',
            background: '#fafafa'
          }}>
            {areasDisponibles.map(area => (
              <label key={area} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                background: areasSeleccionadas.includes(area) ? '#fff8f0' : 'transparent'
              }}>
                <input
                  type="checkbox"
                  checked={areasSeleccionadas.includes(area)}
                  onChange={() => handleAreaChange(area)}
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.875rem' }}>{area}</span>
              </label>
            ))}
          </div>
          
          {areasSeleccionadas.length > 0 && (
            <p style={{ color: '#ff9500', fontWeight: '500', marginTop: '0.5rem' }}>
              ✨ {areasSeleccionadas.length} área{areasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{areasSeleccionadas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3>3. Probar API</h3>
        <button
          onClick={testAPI}
          disabled={loading || !especialidadSeleccionada || areasSeleccionadas.length === 0}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            background: loading ? '#ccc' : '#ff9500',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '🔄 Probando...' : '🚀 Probar API'}
        </button>
      </div>

      {testResult && (
        <div style={{
          padding: '1rem',
          border: `2px solid ${testResult.success ? '#4ade80' : '#ef4444'}`,
          borderRadius: '8px',
          background: testResult.success ? '#f0fdf4' : '#fef2f2',
          marginBottom: '2rem'
        }}>
          <h3>📋 Resultado del Test</h3>
          <p style={{ fontWeight: '500' }}>{testResult.message}</p>
          
          {testResult.data && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Detalles:</h4>
              <ul style={{ fontSize: '0.875rem' }}>
                <li><strong>Especialidad:</strong> {testResult.data.especialidad}</li>
                <li><strong>Áreas seleccionadas:</strong> {testResult.data.areasSeleccionadas.join(', ')}</li>
                <li><strong>Total áreas válidas:</strong> {testResult.data.areasValidas.length}</li>
                {testResult.data.areasInvalidas.length > 0 && (
                  <li style={{ color: '#dc2626' }}>
                    <strong>Áreas inválidas:</strong> {testResult.data.areasInvalidas.join(', ')}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
        <h3>📝 Información del Test</h3>
        <ul style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
          <li>Verifica que las especialidades se carguen correctamente</li>
          <li>Comprueba que las áreas cambien dinámicamente según la especialidad</li>
          <li>Valida que la API /api/areas-interes funcione</li>
          <li>Confirma que solo se puedan seleccionar áreas válidas</li>
        </ul>
      </div>
    </div>
  );
}