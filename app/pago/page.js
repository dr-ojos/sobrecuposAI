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

    if (!data.sobrecupoId || !data.sessionId) {
      setMessage('Enlace de pago inválido o expirado');
      setPaymentStatus('error');
    } else {
      setPaymentData(data);
    }
    
    setLoading(false);
  }, [searchParams]);

  const handlePaymentSubmit = async () => {
    console.log('🟡 === INICIANDO PAGO ===');
    console.log('📋 Payment data:', paymentData);
    
    if (!paymentData) {
      console.error('❌ No hay datos de pago disponibles');
      return;
    }

    console.log('✅ Iniciando proceso de pago...');
    setProcessing(true);
    setPaymentStatus('processing');
    setMessage('Procesando pago...');

    try {
      const response = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sobrecupoId: paymentData.sobrecupoId,
          patientData: {
            name: paymentData.patientName
          },
          appointmentData: {
            doctor: paymentData.doctorName,
            specialty: paymentData.specialty,
            date: paymentData.date,
            time: paymentData.time,
            clinic: paymentData.clinic
          },
          paymentAmount: paymentData.amount,
          sessionId: paymentData.sessionId
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Resultado de simulación:', result);

      if (result.success) {
        setPaymentStatus('success');
        setMessage('¡Pago exitoso! Procesando reserva...');
        
        // Confirmar la reserva en el backend
        console.log('🔄 Iniciando confirmación de reserva...');
        try {
          const confirmPayload = {
            sessionId: paymentData.sessionId,
            transactionId: result.transactionId,
            sobrecupoId: paymentData.sobrecupoId,
            patientData: {
              name: paymentData.patientName,
              rut: paymentData.patientRut || 'N/A',
              phone: paymentData.patientPhone || 'N/A',
              email: paymentData.patientEmail || 'N/A',
              age: paymentData.patientAge || 'N/A'
            },
            appointmentData: {
              doctor: paymentData.doctorName,
              specialty: paymentData.specialty,
              date: paymentData.date,
              time: paymentData.time,
              clinic: paymentData.clinic,
              amount: paymentData.amount
            }
          };
          
          console.log('📦 Payload de confirmación:', confirmPayload);
          
          const confirmResponse = await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(confirmPayload)
          });

          console.log('📡 Confirm response status:', confirmResponse.status);
          console.log('📡 Confirm response ok:', confirmResponse.ok);

          const confirmResult = await confirmResponse.json();
          console.log('📋 Resultado de confirmación:', confirmResult);
          
          if (confirmResult.success) {
            setMessage('¡Reserva confirmada exitosamente! Redirigiendo al chat...');
            
            // Notificar al chat que el pago y reserva fueron exitosos
            if (window.opener) {
              window.opener.postMessage({
                type: 'PAYMENT_SUCCESS',
                transactionId: result.transactionId,
                sessionId: paymentData.sessionId,
                reservationConfirmed: true
              }, '*');
            }
          } else {
            setMessage('Pago exitoso pero error confirmando reserva. Contacta soporte.');
            
            // Notificar el problema al chat
            if (window.opener) {
              window.opener.postMessage({
                type: 'PAYMENT_SUCCESS_RESERVATION_ERROR',
                transactionId: result.transactionId,
                sessionId: paymentData.sessionId,
                error: confirmResult.error
              }, '*');
            }
          }
        } catch (confirmError) {
          console.error('❌ === ERROR CONFIRMANDO RESERVA ===');
          console.error('❌ Error:', confirmError);
          console.error('❌ Stack:', confirmError.stack);
          setMessage('Pago exitoso pero error confirmando reserva. Contacta soporte.');
          
          // Notificar el error al chat
          if (window.opener) {
            window.opener.postMessage({
              type: 'PAYMENT_SUCCESS_RESERVATION_ERROR',
              transactionId: result.transactionId,
              sessionId: paymentData.sessionId,
              error: confirmError.message
            }, '*');
          }
        }

        // Cerrar ventana después de 3 segundos
        setTimeout(() => {
          window.close();
        }, 3000);

      } else {
        setPaymentStatus('error');
        setMessage(result.error || 'Error procesando el pago. Intenta nuevamente.');
      }

    } catch (error) {
      console.error('❌ === ERROR EN FLUJO DE PAGO ===');
      console.error('❌ Error:', error);
      console.error('❌ Stack:', error.stack);
      setPaymentStatus('error');
      setMessage(`Error de conexión: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_CANCELLED',
        sessionId: paymentData?.sessionId
      }, '*');
    }
    window.close();
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

            {/* Simulated Payment Form */}
            <div className="payment-form">
              <div className="card-info">
                <h4>Información de pago simulado</h4>
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <input 
                    type="text" 
                    value="**** **** **** 1234" 
                    disabled 
                    className="card-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vence</label>
                    <input 
                      type="text" 
                      value="12/25" 
                      disabled 
                      className="card-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="text" 
                      value="***" 
                      disabled 
                      className="card-input"
                    />
                  </div>
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
                🔒 Este es un pago simulado para demostración
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

        .card-info h4 {
          margin: 0 0 1rem 0;
          color: #171717;
          font-size: 1rem;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .card-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 0.9rem;
          background: #f9fafb;
          color: #666;
          box-sizing: border-box;
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