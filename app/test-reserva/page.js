'use client';
import { useState } from 'react';

export default function TestReserva() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testCompleteFlow = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🎯 Iniciando test de reserva completa...');

      // Paso 1: Crear enlace de pago simulado
      const paymentData = {
        sobrecupoId: 'recSuKHp2FWpPCz9W', // ID de sobrecupo real de José Peña
        patientName: 'María González Test',
        patientRut: '12.345.678-9',
        patientPhone: '+56912345678',
        patientEmail: 'maria.test@email.com',
        patientAge: '35',
        doctorName: 'José Peña',
        specialty: 'Medicina General',
        date: '2024-08-20',
        time: '10:00',
        clinic: 'Clínica Test',
        amount: '2990',
        motivo: 'Test de motivo de consulta - dolor de cabeza frecuente',
        fromChat: false,
        sessionId: `test-${Date.now()}`
      };

      console.log('📋 Datos de pago:', paymentData);

      const paymentResponse = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await paymentResponse.json();
      console.log('💳 Resultado enlace pago:', paymentResult);

      if (!paymentResult.success) {
        throw new Error('Error creando enlace de pago: ' + paymentResult.error);
      }

      // Paso 2: Simular confirmación de pago
      const confirmData = {
        sessionId: paymentData.sessionId,
        transactionId: `test-tx-${Date.now()}`,
        sobrecupoId: paymentData.sobrecupoId,
        patientData: {
          name: paymentData.patientName,
          rut: paymentData.patientRut,
          phone: paymentData.patientPhone,
          email: paymentData.patientEmail,
          age: paymentData.patientAge
        },
        appointmentData: {
          doctorName: paymentData.doctorName,
          specialty: paymentData.specialty,
          date: paymentData.date,
          time: paymentData.time,
          clinic: paymentData.clinic,
          amount: paymentData.amount
        },
        motivo: paymentData.motivo
      };

      console.log('📋 Datos de confirmación:', confirmData);

      const confirmResponse = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmData)
      });

      const confirmResult = await confirmResponse.json();
      console.log('✅ Resultado confirmación:', confirmResult);

      if (confirmResult.success) {
        setResult({
          success: true,
          message: '✅ Reserva test completada exitosamente',
          details: {
            paymentLink: paymentResult.shortUrl,
            transactionId: confirmData.transactionId,
            sobrecupoId: confirmData.sobrecupoId,
            patientName: confirmData.patientData.name,
            motivo: confirmData.motivo
          }
        });
      } else {
        throw new Error('Error en confirmación: ' + confirmResult.error);
      }

    } catch (error) {
      console.error('❌ Error en test:', error);
      setResult({
        success: false,
        message: '❌ Error en el test: ' + error.message,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test Reserva Completa</h1>
      <p>Este test simula el flujo completo de reserva para verificar que los datos del paciente se guarden correctamente.</p>
      
      <button 
        onClick={testCompleteFlow}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading ? '#ccc' : '#ff9500',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {loading ? '⏳ Procesando...' : '🚀 Ejecutar Test Completo'}
      </button>

      {result && (
        <div style={{
          padding: '1rem',
          border: `2px solid ${result.success ? '#4ade80' : '#ef4444'}`,
          borderRadius: '8px',
          backgroundColor: result.success ? '#f0fdf4' : '#fef2f2'
        }}>
          <h2>{result.message}</h2>
          
          {result.success && result.details && (
            <div>
              <h3>📋 Detalles del Test:</h3>
              <ul>
                <li><strong>Sobrecupo ID:</strong> {result.details.sobrecupoId}</li>
                <li><strong>Paciente:</strong> {result.details.patientName}</li>
                <li><strong>Motivo:</strong> {result.details.motivo}</li>
                <li><strong>Transaction ID:</strong> {result.details.transactionId}</li>
              </ul>
              
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
                <p><strong>✅ Ahora ve a verificar:</strong></p>
                <p>1. <a href="/debug-sobrecupos" target="_blank">Debug Sobrecupos</a> - Para ver si aparecen los datos</p>
                <p>2. <a href="/demo-sobrecupos" target="_blank">Demo Sobrecupos</a> - Para comparar con el diseño</p>
              </div>
            </div>
          )}
          
          {result.error && (
            <div>
              <h3>❌ Error Details:</h3>
              <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h3>📝 Qué hace este test:</h3>
        <ol>
          <li>Crea un enlace de pago con datos de paciente simulados</li>
          <li>Simula la confirmación del pago</li>
          <li>Actualiza el sobrecupo con los datos del paciente</li>
          <li>Guarda el motivo de consulta</li>
          <li>Verifica que todo se guardó correctamente</li>
        </ol>
      </div>
    </div>
  );
}