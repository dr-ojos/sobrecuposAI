'use client';
import { useState } from 'react';

export default function TestWhatsApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState(null);

  // Cargar configuración al iniciar
  const loadConfig = async () => {
    try {
      const res = await fetch('/api/test-whatsapp');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Error cargando config:', error);
    }
  };

  // Enviar mensaje de prueba
  const sendTestMessage = async () => {
    if (!phoneNumber.trim()) {
      alert('Ingresa un número de teléfono');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testNumber: phoneNumber })
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Error de conexión: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar config al montar
  useState(() => {
    loadConfig();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Prueba WhatsApp - Sobrecupos AI
          </h1>

          {/* Configuración */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 Configuración</h2>
            {config ? (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Estado:</strong> {config.configured ? 
                    <span className="text-green-600">✅ Configurado</span> : 
                    <span className="text-red-600">❌ No configurado</span>
                  }
                </div>
                <div><strong>Account SID:</strong> {config.accountSid}</div>
                <div><strong>WhatsApp Number:</strong> {config.whatsappNumber}</div>
                <div><strong>Ambiente:</strong> {config.environment}</div>
              </div>
            ) : (
              <div className="text-gray-500">Cargando configuración...</div>
            )}
            <button 
              onClick={loadConfig}
              className="mt-3 text-blue-600 hover:text-blue-800 underline text-sm"
            >
              🔄 Recargar configuración
            </button>
          </div>

          {/* Formulario de prueba */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📱 Número de Prueba
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+56912345678 o 912345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes usar formato chileno: +56912345678 o 912345678
            </p>
          </div>

          <button
            onClick={sendTestMessage}
            disabled={loading || !config?.configured}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? '📤 Enviando...' : '📱 Enviar Mensaje de Prueba'}
          </button>

          {/* Resultado */}
          {result && (
            <div className="mt-6 p-4 rounded-lg">
              {result.success ? (
                <div className="bg-green-50 border border-green-200">
                  <div className="text-green-800">
                    <h3 className="font-semibold">✅ Éxito</h3>
                    <p className="mt-1">{result.message}</p>
                    {result.result?.simulated && (
                      <div className="mt-2 text-sm bg-yellow-100 text-yellow-800 p-2 rounded">
                        ⚠️ Mensaje simulado - Revisa los logs del servidor
                      </div>
                    )}
                    {result.result?.messageId && (
                      <div className="mt-2 text-xs text-gray-600">
                        ID: {result.result.messageId}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200">
                  <div className="text-red-800">
                    <h3 className="font-semibold">❌ Error</h3>
                    <p className="mt-1">{result.error}</p>
                    {result.details && (
                      <div className="mt-2 text-xs text-gray-600">
                        Código: {result.details}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">💡 Instrucciones:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Verifica que la configuración esté en ✅</li>
              <li>Ingresa tu número de WhatsApp</li>
              <li>Haz clic en "Enviar Mensaje de Prueba"</li>
              <li>Deberías recibir un mensaje en WhatsApp</li>
              <li>Si es modo desarrollo, revisa los logs del servidor</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}