'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, error
  const [message, setMessage] = useState('');
  const [isFromChat, setIsFromChat] = useState(false);
  // Función simple de logging para producción
  const addDebugLog = (message) => {
    console.log(message);
  };

  useEffect(() => {
    // Obtener datos del pago desde URL params
    const data = {
      sobrecupoId: searchParams.get('sobrecupoId'),
      patientName: searchParams.get('patientName'),
      patientRut: searchParams.get('patientRut'),
      patientPhone: searchParams.get('patientPhone'),
      patientEmail: searchParams.get('patientEmail'),
      patientAge: searchParams.get('patientAge'),
      doctorName: searchParams.get('doctorName'),
      specialty: searchParams.get('specialty'),
      date: searchParams.get('date'),
      time: searchParams.get('time'),
      clinic: searchParams.get('clinic'),
      amount: searchParams.get('amount') || '2990',
      sessionId: searchParams.get('sessionId')
    };

    // Detectar si viene del chat o directamente
    const fromChatParam = searchParams.get('fromChat');
    const fromChat = fromChatParam === 'true' || (fromChatParam === null && window.opener);
    setIsFromChat(fromChat);
    
    addDebugLog(`🔍 Detectado origen: ${fromChat ? 'CHAT' : 'DIRECTO'}`);
    addDebugLog(`🔍 window.opener exists: ${!!window.opener}`);
    addDebugLog(`🔍 fromChat param: ${searchParams.get('fromChat')}`);

    if (!data.sobrecupoId || !data.sessionId) {
      setMessage('Enlace de pago inválido o expirado');
      setPaymentStatus('error');
    } else {
      setPaymentData(data);
    }
    
    setLoading(false);
  }, [searchParams]);

  const handlePaymentSubmit = async () => {
    addDebugLog('🟡 === INICIANDO PAGO CON FLOW.CL ===');
    addDebugLog(`📋 Payment data: ${JSON.stringify(paymentData)}`);
    
    if (!paymentData) {
      addDebugLog('❌ No hay datos de pago disponibles');
      return;
    }

    addDebugLog('✅ Iniciando proceso de pago con Flow.cl...');
    setProcessing(true);
    setPaymentStatus('processing');
    setMessage('Creando orden de pago...');

    try {
      // Crear orden de pago en Flow.cl
      const response = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sobrecupoId: paymentData.sobrecupoId,
          sessionId: paymentData.sessionId,
          patientData: {
            name: paymentData.patientName,
            email: paymentData.patientEmail
          },
          appointmentData: {
            doctor: paymentData.doctorName,
            specialty: paymentData.specialty,
            date: paymentData.date,
            time: paymentData.time,
            clinic: paymentData.clinic
          },
          amount: paymentData.amount
        })
      });

      addDebugLog(`📡 Flow response status: ${response.status}`);
      addDebugLog(`📡 Flow response ok: ${response.ok}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      addDebugLog(`📋 Resultado de Flow: ${JSON.stringify(result)}`);

      if (result.success) {
        addDebugLog('✅ Orden creada en Flow.cl, redirigiendo...');
        setMessage('Redirigiendo a Flow.cl...');
        
        // Redirigir a Flow.cl para completar el pago
        window.location.href = result.url;
            
            // Si viene del chat, usar el flujo actual
            if (isFromChat && window.opener) {
              setMessage('¡Reserva confirmada exitosamente! Cerrando ventana...');
              const successMessage = {
                type: 'PAYMENT_SUCCESS',
                transactionId: result.transactionId,
                sessionId: paymentData.sessionId,
                reservationConfirmed: true,
                appointmentDetails: {
                  doctorName: paymentData.doctorName,
                  specialty: paymentData.specialty,
                  date: paymentData.date,
                  time: paymentData.time,
                  clinic: paymentData.clinic,
                  patientName: paymentData.patientName
                }
              };
              
              console.log('📨 === ENVIANDO MENSAJE AL CHAT ===');
              console.log('📨 Message:', successMessage);
              console.log('📨 Window opener exists:', !!window.opener);
              console.log('📨 Window opener closed:', window.opener && window.opener.closed);
              console.log('📨 Target origin:', window.location.origin);
              console.log('📨 Current URL:', window.location.href);
              
              // 🆘 DEBUG TEMPORAL - Alert para confirmar envío
              alert('📨 ENVIANDO POSTMESSAGE AL CHAT - Verifica consola del chat!');
              
              try {
                window.opener.postMessage(successMessage, window.location.origin);
                console.log('✅ Mensaje enviado al chat con origin específico');
              } catch (postMessageError) {
                console.error('❌ Error enviando postMessage:', postMessageError);
                // Intentar con * como fallback
                try {
                  window.opener.postMessage(successMessage, '*');
                  console.log('✅ Mensaje enviado al chat con origin wildcard');
                } catch (fallbackError) {
                  console.error('❌ Error enviando postMessage fallback:', fallbackError);
                }
              }
              
              // Dar un momento para que se procese el mensaje antes de cerrar
              setTimeout(() => {
                console.log('🔄 Cerrando ventana de pago...');
                // Intentar enfocar la ventana padre antes de cerrar
                if (window.opener && !window.opener.closed) {
                  window.opener.focus();
                }
                window.close();
              }, 1500); // Optimizado para cierre rápido
              
            } else if (isFromChat) {
              // Flujo del chat sin window.opener (fallback)
              console.log('❌ Chat sin window.opener - usando localStorage como fallback');
              
              const fallbackMessage = {
                type: 'PAYMENT_SUCCESS',
                transactionId: result.transactionId,
                sessionId: paymentData.sessionId,
                reservationConfirmed: true,
                appointmentDetails: {
                  doctorName: paymentData.doctorName,
                  specialty: paymentData.specialty,
                  date: paymentData.date,
                  time: paymentData.time,
                  clinic: paymentData.clinic,
                  patientName: paymentData.patientName
                },
                timestamp: new Date().toISOString()
              };
              
              localStorage.setItem('payment_success_message', JSON.stringify(fallbackMessage));
              console.log('💾 Mensaje guardado en localStorage para el chat');
              
              setMessage('¡Pago y reserva exitosos! 🎉\n\nCierra esta ventana y revisa el chat para ver los detalles.\n\nTambién recibirás email de confirmación.');
              
              setTimeout(() => {
                window.close();
              }, 3000);
              
            } else {
              // Flujo de reserva directa - redirigir a página de confirmación
              console.log('🔄 Reserva directa exitosa - redirigiendo a página de confirmación');
              
              const confirmationParams = new URLSearchParams({
                doctor: paymentData.doctorName,
                specialty: paymentData.specialty,
                date: paymentData.date,
                time: paymentData.time,
                clinic: paymentData.clinic,
                patient: paymentData.patientName,
                transactionId: result.transactionId,
                amount: paymentData.amount
              });
              
              // Redirigir a la página de confirmación
              router.push(`/reserva-exitosa?${confirmationParams.toString()}`);
            }
          } else {
            setMessage('Pago exitoso pero error confirmando reserva. Contacta soporte.');
            console.error('❌ Error en confirmación:', confirmResult);
            
            // NO CERRAR LA VENTANA cuando hay error para poder ver los logs
            
            // Notificar el problema al chat si viene del chat
            if (isFromChat && window.opener) {
              window.opener.postMessage({
                type: 'PAYMENT_SUCCESS_RESERVATION_ERROR',
                transactionId: result.transactionId,
                sessionId: paymentData.sessionId,
                error: confirmResult.error
              }, '*');
            }
          }
        } catch (confirmError) {
          addDebugLog('❌ === ERROR CONFIRMANDO RESERVA ===');
          addDebugLog(`❌ Error: ${confirmError.message}`);
          addDebugLog(`❌ Stack: ${confirmError.stack}`);
          setMessage('Pago exitoso pero error confirmando reserva. Contacta soporte.');
          console.error('❌ Catch error confirmando reserva:', confirmError);
          
          // NO CERRAR LA VENTANA cuando hay error para poder ver los logs
          
          // Notificar el error al chat si viene del chat
          if (isFromChat && window.opener) {
            window.opener.postMessage({
              type: 'PAYMENT_SUCCESS_RESERVATION_ERROR',
              transactionId: result.transactionId,
              sessionId: paymentData.sessionId,
              error: confirmError.message
            }, '*');
          }
        }

        // El cierre se maneja individualmente en cada caso arriba

      } else {
        setPaymentStatus('error');
        setMessage(result.error || 'Error procesando el pago. Intenta nuevamente.');
        console.error('❌ Error en simulación de pago:', result);
        // NO CERRAR LA VENTANA cuando hay error para poder ver los logs
      }

    } catch (error) {
      console.error('❌ === ERROR EN FLUJO DE PAGO ===');
      console.error('❌ Error:', error);
      console.error('❌ Stack:', error.stack);
      setPaymentStatus('error');
      setMessage(`Error de conexión: ${error.message}`);
      // NO CERRAR LA VENTANA cuando hay error para poder ver los logs
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (isFromChat) {
      // Si viene del chat, notificar y cerrar ventana
      if (window.opener) {
        window.opener.postMessage({
          type: 'PAYMENT_CANCELLED',
          sessionId: paymentData?.sessionId
        }, '*');
      }
      window.close();
    } else {
      // Si es reserva directa, volver a la página principal
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-spinner"></div>
        <p>Cargando información de pago...</p>
      </div>
    );
  }

  if (!paymentData || paymentStatus === 'error') {
    return (
      <div className="payment-container error-state">
        <div className="error-icon">❌</div>
        <h2>Error en el pago</h2>
        <p>{message || 'No se pudo cargar la información de pago'}</p>
        <button onClick={handleClose} className="close-button">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container">
      
      {/* Header */}
      <div className="payment-header">
        <h1 className="payment-title">Confirmar Pago</h1>
        <button onClick={handleClose} className="close-button-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Payment Content */}
      <div className="payment-content">
        
        {paymentStatus === 'success' && (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h2>¡Pago Exitoso!</h2>
            <p>{message}</p>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <>
            {/* Appointment Summary */}
            <div className="appointment-summary">
              <div className="summary-header">
                <div className="doctor-avatar">
                  {paymentData.doctorName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="summary-details">
                  <h3 className="doctor-name">{paymentData.doctorName}</h3>
                  <p className="specialty">{paymentData.specialty}</p>
                  <p className="clinic">{paymentData.clinic}</p>
                  <p className="datetime">{paymentData.date} - {paymentData.time}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">Paciente:</span>
                <span className="detail-value">{paymentData.patientName}</span>
              </div>
              <div className="detail-row total">
                <span className="detail-label">Total a pagar:</span>
                <span className="detail-value">${parseInt(paymentData.amount).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            {/* Flow.cl Payment Form */}
            <div className="payment-form">
              <div className="payment-info">
                <h4>Pago seguro con Flow.cl</h4>
                <p className="payment-description">
                  Serás redirigido a Flow.cl para completar el pago de forma segura.
                </p>
                <div className="payment-methods">
                  <span className="method-badge">💳 Tarjetas</span>
                  <span className="method-badge">🏦 Transferencia</span>
                  <span className="method-badge">📱 App Banco</span>
                </div>
              </div>

              {message && (
                <div className={`message ${paymentStatus === 'error' ? 'error' : ''}`}>
                  {message}
                </div>
              )}

              <button
                onClick={handlePaymentSubmit}
                disabled={processing}
                className={`pay-button ${processing ? 'processing' : ''}`}
              >
                {processing ? (
                  <span className="loading-content">
                    <span className="button-spinner"></span>
                    Procesando...
                  </span>
                ) : (
                  `Pagar $${parseInt(paymentData.amount).toLocaleString('es-CL')} CLP`
                )}
              </button>

              <p className="payment-notice">
                🔒 Pago seguro procesado por Flow.cl
              </p>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="processing-state">
            <div className="processing-spinner"></div>
            <h2>Procesando pago...</h2>
            <p>No cierres esta ventana</p>
          </div>
        )}

      </div>

      <style jsx>{`
        .payment-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .payment-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .payment-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        .close-button-header {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .close-button-header:hover {
          background: #f5f5f5;
        }

        .payment-content {
          flex: 1;
          padding: 1.5rem;
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .appointment-summary {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .summary-header {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .doctor-avatar {
          width: 48px;
          height: 48px;
          background: #171717;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .summary-details {
          flex: 1;
        }

        .doctor-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.25rem 0;
        }

        .specialty {
          font-size: 0.9rem;
          color: #666;
          margin: 0 0 0.25rem 0;
        }

        .clinic {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 0.25rem 0;
        }

        .datetime {
          font-size: 0.9rem;
          color: #171717;
          font-weight: 500;
          margin: 0;
        }

        .payment-details {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .detail-row.total {
          border-top: 1px solid #e5e5e5;
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-weight: 600;
        }

        .detail-label {
          color: #666;
          font-size: 0.9rem;
        }

        .detail-value {
          color: #171717;
          font-size: 0.9rem;
        }

        .detail-row.total .detail-value {
          font-size: 1.1rem;
          color: #171717;
        }

        .payment-form {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .payment-info h4 {
          margin: 0 0 0.5rem 0;
          color: #171717;
          font-size: 1rem;
          font-weight: 600;
        }

        .payment-description {
          color: #666;
          font-size: 0.85rem;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .payment-methods {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .method-badge {
          background: #f0f9ff;
          color: #0369a1;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid #bae6fd;
        }

        .message {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          text-align: center;
          margin: 1rem 0;
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .pay-button {
          width: 100%;
          padding: 1rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 1rem;
        }

        .pay-button:hover:not(.processing) {
          background: #000;
        }

        .pay-button.processing {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .payment-notice {
          font-size: 0.75rem;
          color: #666;
          text-align: center;
          margin: 0.75rem 0 0 0;
          font-style: italic;
        }

        .success-state, .processing-state, .error-state {
          text-align: center;
          padding: 2rem;
        }

        .success-icon, .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .processing-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        .close-button {
          padding: 0.75rem 1.5rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .payment-content {
            padding: 1rem;
          }

          .appointment-summary,
          .payment-details,
          .payment-form {
            padding: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

const PagoPage = () => {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Helvetica Neue, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #171717',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p>Cargando pago...</p>
        </div>
      </div>
    }>
      <PagoContent />
    </Suspense>
  );
};

export default PagoPage;