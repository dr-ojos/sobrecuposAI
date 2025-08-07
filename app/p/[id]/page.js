'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';

function PaymentRedirectContent() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const redirectToPayment = async () => {
      try {
        console.log('🔗 Redirigiendo enlace corto:', params.id);

        // Obtener datos del enlace corto
        const response = await fetch(`/api/payment/create-link?id=${params.id}`);
        const result = await response.json();

        if (result.success) {
          const data = result.data;
          
          // Construir URL completa de pago
          const paymentUrl = `/pago?sobrecupoId=${data.sobrecupoId}&patientName=${encodeURIComponent(data.patientName)}&patientRut=${encodeURIComponent(data.patientRut)}&patientPhone=${encodeURIComponent(data.patientPhone)}&patientEmail=${encodeURIComponent(data.patientEmail)}&patientAge=${encodeURIComponent(data.patientAge)}&doctorName=${encodeURIComponent(data.doctorName)}&specialty=${encodeURIComponent(data.specialty)}&date=${encodeURIComponent(data.date)}&time=${encodeURIComponent(data.time)}&clinic=${encodeURIComponent(data.clinic)}&amount=${data.amount}&sessionId=${data.sessionId}`;
          
          console.log('✅ Redirigiendo a:', paymentUrl);
          
          // Redirigir a la página de pago
          window.location.href = paymentUrl;
          
        } else {
          setError(result.error || 'Enlace inválido o expirado');
        }

      } catch (err) {
        console.error('❌ Error redirigiendo:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      redirectToPayment();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="redirect-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Redirigiendo al pago...</h2>
          <p>Espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="redirect-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Enlace inválido</h2>
          <p>{error}</p>
          <button onClick={() => window.close()} className="close-button">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const PaymentRedirectPage = () => {
  return (
    <Suspense fallback={
      <div className="redirect-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Cargando...</h2>
        </div>
      </div>
    }>
      <PaymentRedirectContent />
      
      <style jsx>{`
        .redirect-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .loading-content, .error-content {
          text-align: center;
          background: white;
          padding: 3rem 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          max-width: 400px;
          width: 100%;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem auto;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        p {
          color: #666;
          margin: 0 0 2rem 0;
          font-size: 0.9rem;
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
        }

        .close-button:hover {
          background: #000;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .redirect-container {
            padding: 1rem;
          }

          .loading-content, .error-content {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </Suspense>
  );
};

export default PaymentRedirectPage;