'use client';
import React, { useState } from 'react';

export default function TestDelivery() {
  const [email, setEmail] = useState('doctor.jpm@gmail.com');
  const [whatsapp, setWhatsapp] = useState('+56978459140');
  const [testType, setTestType] = useState('both');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const ejecutarTest = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/test-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whatsapp, testType })
      });
      
      const result = await response.json();
      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: `Error ejecutando test: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  };

  const renderAttemptResult = (attempt, index) => {
    const bgColor = attempt.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = attempt.success ? 'text-green-800' : 'text-red-800';
    const icon = attempt.success ? '✅' : '❌';

    return (
      <div key={index} className={`p-3 mb-2 border rounded-lg ${bgColor}`}>
        <div className={`${textColor} flex items-center gap-2 mb-2`}>
          <span>{icon}</span>
          <span className="font-semibold">Intento {attempt.attempt}</span>
          <span className="text-sm text-gray-600">
            {new Date(attempt.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {attempt.messageId && (
          <div className="text-sm text-gray-700 mb-1">
            <strong>Message ID:</strong> {attempt.messageId}
          </div>
        )}
        
        {attempt.responseCode && (
          <div className="text-sm text-gray-700 mb-1">
            <strong>Response Code:</strong> {attempt.responseCode}
          </div>
        )}
        
        {attempt.status && (
          <div className="text-sm text-gray-700 mb-1">
            <strong>Status:</strong> {attempt.status}
          </div>
        )}
        
        {attempt.error && (
          <div className="text-sm text-red-700 mt-2 p-2 bg-red-100 rounded">
            <strong>Error:</strong> {attempt.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Test de Delivery - SobrecuposIA
          </h1>
          <p className="text-gray-600 mb-6">
            Prueba directa del sistema robusto de notificaciones con múltiples reintentos
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email de prueba:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor.jpm@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 WhatsApp de prueba:
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+56978459140"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de test:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="both"
                  checked={testType === 'both'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-2"
                />
                Ambos (Email + WhatsApp)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={testType === 'email'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-2"
                />
                Solo Email
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="whatsapp"
                  checked={testType === 'whatsapp'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-2"
                />
                Solo WhatsApp
              </label>
            </div>
          </div>
          
          <button
            onClick={ejecutarTest}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {loading ? '🔄 Ejecutando Test...' : '🚀 Ejecutar Test de Delivery'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Resumen */}
            <div className={`p-4 rounded-lg mb-6 ${
              results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h2 className={`text-xl font-bold mb-2 ${
                results.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {results.success ? '✅ Test Exitoso' : '❌ Test Fallido'}
              </h2>
              <p className="text-sm text-gray-600">
                Ejecutado: {new Date(results.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Resultados de Email */}
            {results.emailResults?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📧 Resultados de Email</h3>
                <div>
                  {results.emailResults.map(renderAttemptResult)}
                </div>
              </div>
            )}

            {/* Resultados de WhatsApp */}
            {results.whatsappResults?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📱 Resultados de WhatsApp</h3>
                <div>
                  {results.whatsappResults.map(renderAttemptResult)}
                </div>
              </div>
            )}

            {/* Error General */}
            {results.error && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-red-800 mb-3">💀 Error del Sistema</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800 font-semibold mb-2">{results.error}</p>
                  {results.stack && (
                    <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-x-auto">
                      {results.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-bold text-blue-800 mb-2">📖 Instrucciones</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Ingresa el email y WhatsApp que quieres probar</li>
            <li>2. Selecciona el tipo de test (recomendado: Ambos)</li>
            <li>3. Haz clic en "Ejecutar Test" </li>
            <li>4. El sistema intentará hasta 3 veces cada notificación</li>
            <li>5. Revisa tu email/WhatsApp para confirmar que lleguen los mensajes de test</li>
            <li>6. Si el test es exitoso, las notificaciones reales también deberían funcionar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}