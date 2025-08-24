'use client';
import React, { useState } from 'react';

export default function DebugNotificaciones() {
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState('reco0oJFeZ823PK3g'); // Dr. José Peña por defecto

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    setDiagnostico(null);
    
    try {
      const response = await fetch('/api/debug-notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId })
      });
      
      const result = await response.json();
      setDiagnostico(result);
    } catch (error) {
      setDiagnostico({
        success: false,
        errores: [{ mensaje: `Error ejecutando diagnóstico: ${error.message}`, tipo: 'error' }],
        etapas: [],
        warnings: []
      });
    }
    
    setLoading(false);
  };

  const renderLogEntry = (entry, index) => {
    const bgColor = entry.tipo === 'error' ? 'bg-red-50 border-red-200' : 
                   entry.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
                   'bg-blue-50 border-blue-200';
    
    const textColor = entry.tipo === 'error' ? 'text-red-800' : 
                     entry.tipo === 'warning' ? 'text-yellow-800' : 
                     'text-blue-800';
    
    const icon = entry.tipo === 'error' ? '❌' : 
                entry.tipo === 'warning' ? '⚠️' : 
                '📋';

    return (
      <div key={index} className={`p-3 mb-2 border rounded-lg ${bgColor}`}>
        <div className={`font-mono text-sm ${textColor} flex items-start gap-2`}>
          <span className="flex-shrink-0">{icon}</span>
          <span className="break-all">{entry.mensaje}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🚨 Diagnóstico de Notificaciones - SobrecuposIA
          </h1>
          <p className="text-gray-600 mb-6">
            Herramienta de diagnóstico completo para identificar problemas con emails y WhatsApp
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor ID para probar:
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="Ingresa el ID del doctor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={ejecutarDiagnostico}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Ejecutando...' : '🔍 Ejecutar Diagnóstico'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ID por defecto: reco0oJFeZ823PK3g (Dr. José Peña)
            </p>
          </div>
        </div>

        {diagnostico && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Resumen */}
            <div className={`p-4 rounded-lg mb-6 ${
              diagnostico.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h2 className={`text-xl font-bold mb-2 ${
                diagnostico.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {diagnostico.success ? '✅ Diagnóstico Exitoso' : '❌ Diagnóstico Fallido'}
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Errores:</span> {diagnostico.errores?.length || 0}
                </div>
                <div>
                  <span className="font-semibold">Warnings:</span> {diagnostico.warnings?.length || 0}
                </div>
                <div>
                  <span className="font-semibold">Tiempo:</span> {diagnostico.timestamp ? new Date(diagnostico.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Errores Críticos */}
            {diagnostico.errores?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-red-800 mb-3">❌ Errores Críticos</h3>
                <div>
                  {diagnostico.errores.map(renderLogEntry)}
                </div>
              </div>
            )}

            {/* Warnings */}
            {diagnostico.warnings?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-3">⚠️ Warnings</h3>
                <div>
                  {diagnostico.warnings.map(renderLogEntry)}
                </div>
              </div>
            )}

            {/* Log Completo */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Log Completo</h3>
              <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                {diagnostico.etapas?.map(renderLogEntry)}
              </div>
            </div>

            {/* Resultado Detallado */}
            {diagnostico.resultadoFinal && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resultado Detallado</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(diagnostico.resultadoFinal, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Crítico del Sistema */}
            {diagnostico.errorCritico && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-red-800 mb-3">💀 Error Crítico del Sistema</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800 font-semibold mb-2">{diagnostico.errorCritico.mensaje}</p>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-x-auto">
                    {diagnostico.errorCritico.stack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-bold text-blue-800 mb-2">📖 Instrucciones de Uso</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Ingresa el ID del doctor que quieres probar (por defecto Dr. José Peña)</li>
            <li>2. Haz clic en "Ejecutar Diagnóstico"</li>
            <li>3. El sistema probará variables de entorno, búsqueda en Airtable, SendGrid y WhatsApp</li>
            <li>4. Revisa los errores y warnings para identificar el problema</li>
            <li>5. Si todo está ✅, las notificaciones deberían funcionar correctamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}