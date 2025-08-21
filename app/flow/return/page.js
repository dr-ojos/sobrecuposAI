'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function FlowReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Verificando estado del pago...');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const token = searchParams.get('token');
        const sessionId = searchParams.get('sessionId');
        const commerceOrder = searchParams.get('commerceOrder');

        console.log('🔍 [FLOW RETURN] Verificando pago:', { token, sessionId, commerceOrder });

        if (!token) {
          setStatus('error');
          setMessage('Token de pago no encontrado');
          return;
        }

        // Verificar estado del pago en Flow.cl
        const response = await fetch('/api/flow/check-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, sessionId, commerceOrder })
        });

        const result = await response.json();
        console.log('📋 [FLOW RETURN] Resultado:', result);

        if (result.success) {
          setStatus('success');
          setMessage('¡Pago confirmado exitosamente!');
          setPaymentDetails(result.paymentDetails);

          // Si viene del chat, comunicar el éxito
          if (window.opener) {
            const successMessage = {
              type: 'PAYMENT_SUCCESS',
              transactionId: token,
              sessionId,
              reservationConfirmed: true,
              paymentMethod: 'flow'
            };

            try {
              window.opener.postMessage(successMessage, window.location.origin);
              console.log('✅ [FLOW RETURN] Mensaje enviado al chat');
            } catch (error) {
              console.error('❌ [FLOW RETURN] Error enviando mensaje:', error);
            }

            // Cerrar ventana después de un momento
            setTimeout(() => {
              if (window.opener && !window.opener.closed) {
                window.opener.focus();
              }
              window.close();
            }, 3000);
          } else {
            // Redirigir a página de confirmación después de un momento
            setTimeout(() => {
              router.push('/dashboard/patient');
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(result.error || 'Error verificando el pago');
        }

      } catch (error) {
        console.error('❌ [FLOW RETURN] Error:', error);
        setStatus('error');
        setMessage('Error de conexión verificando el pago');
      }
    };

    checkPaymentStatus();
  }, [searchParams, router]);

  return (
    <div className="return-container">
      <div className="return-content">
        {status === 'processing' && (
          <div className="processing-state">
            <div className="spinner"></div>
            <h2>Verificando pago</h2>
            <p>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h2>¡Pago exitoso!</h2>
            <p>{message}</p>
            {paymentDetails && (
              <div className="payment-info">
                <p><strong>Monto:</strong> ${parseInt(paymentDetails.amount).toLocaleString('es-CL')} CLP</p>
                <p><strong>Método:</strong> Flow.cl</p>
              </div>
            )}
            <p className="closing-notice">
              {window.opener ? 'Cerrando ventana...' : 'Redirigiendo...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Error en el pago</h2>
            <p>{message}</p>
            <button 
              onClick={() => window.opener ? window.close() : router.push('/')} 
              className="close-button"
            >
              {window.opener ? 'Cerrar ventana' : 'Volver al inicio'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .return-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .return-content {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .processing-state, .success-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .success-icon, .error-icon {
          font-size: 3rem;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
        }

        .payment-info {
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .payment-info p {
          margin: 0.25rem 0;
          color: #171717;
        }

        .closing-notice {
          font-style: italic;
          font-size: 0.8rem;
          color: #999;
          margin-top: 1rem;
        }

        .close-button {
          padding: 0.75rem 1.5rem;
          background: #171717;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 1rem;
        }

        .close-button:hover {
          background: #000;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .return-content {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

const FlowReturnPage = () => {
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
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <FlowReturnContent />
    </Suspense>
  );
};

export default FlowReturnPage;