'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ReservaExitosaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservaData, setReservaData] = useState(null);

  useEffect(() => {
    // Obtener datos de la reserva desde URL params
    const data = {
      doctorName: searchParams.get('doctor') || 'Doctor',
      specialty: searchParams.get('specialty') || 'Especialidad',
      date: searchParams.get('date') || 'Fecha',
      time: searchParams.get('time') || 'Hora',
      clinic: searchParams.get('clinic') || 'Clínica',
      patientName: searchParams.get('patient') || 'Paciente',
      transactionId: searchParams.get('transactionId') || 'N/A',
      amount: searchParams.get('amount') || '2990'
    };
    
    setReservaData(data);
  }, [searchParams]);

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!reservaData) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <svg className="logo-svg" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
              <path fill="#dc2626" d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z"/>
              <path fill="#171717" d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z"/>
              <path fill="#171717" d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z"/>
              <path fill="#171717" d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
              <path fill="#171717" d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z"/>
              <path fill="#171717" d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z"/>
              <path fill="#171717" d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
              <path fill="#171717" d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z"/>
              <path fill="#171717" d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z"/>
              <path fill="#171717" d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z"/>
              <path fill="#171717" d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z"/>
            </g>
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        
        {/* Success Message */}
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1 className="success-title">¡Reserva Exitosa!</h1>
          <p className="success-subtitle">Tu sobrecupo ha sido reservado correctamente</p>
        </div>

        {/* Appointment Details */}
        <div className="appointment-card">
          <div className="card-header">
            <h2 className="card-title">Detalles de tu cita</h2>
          </div>
          
          <div className="appointment-details">
            <div className="doctor-section">
              <div className="doctor-avatar">
                {reservaData.doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{reservaData.doctorName}</h3>
                <p className="specialty">{reservaData.specialty}</p>
              </div>
            </div>

            <div className="appointment-info">
              <div className="info-row">
                <span className="info-label">📅 Fecha:</span>
                <span className="info-value">{reservaData.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">🕐 Hora:</span>
                <span className="info-value">{reservaData.time}</span>
              </div>
              <div className="info-row">
                <span className="info-label">🏥 Clínica:</span>
                <span className="info-value">{reservaData.clinic}</span>
              </div>
              <div className="info-row">
                <span className="info-label">👤 Paciente:</span>
                <span className="info-value">{reservaData.patientName}</span>
              </div>
              <div className="info-row payment-row">
                <span className="info-label">💳 Monto pagado:</span>
                <span className="info-value amount">${parseInt(reservaData.amount).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="transaction-info">
            <p className="transaction-label">ID de transacción:</p>
            <p className="transaction-id">{reservaData.transactionId}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3 className="steps-title">¿Qué sigue?</h3>
          <div className="steps-list">
            <div className="step-item">
              <span className="step-icon">📧</span>
              <span className="step-text">Recibirás un email de confirmación con los detalles</span>
            </div>
            <div className="step-item">
              <span className="step-icon">📱</span>
              <span className="step-text">Te contactaremos para confirmar la cita</span>
            </div>
            <div className="step-item">
              <span className="step-icon">🏥</span>
              <span className="step-text">Preséntate en la clínica el día de tu cita</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="action-section">
          <button 
            className="back-button"
            onClick={handleBackToHome}
          >
            Volver a la página principal
          </button>
        </div>

      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo-container {
          display: flex;
          justify-content: center;
        }

        .logo-svg {
          width: 180px;
          height: auto;
          max-width: 100%;
        }

        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .loading {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #171717;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        .success-container {
          text-align: center;
          margin-bottom: 2rem;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .success-title {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .success-subtitle {
          font-size: 1.1rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        .appointment-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .card-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
        }

        .appointment-details {
          margin-bottom: 1.5rem;
        }

        .doctor-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .doctor-avatar {
          width: 60px;
          height: 60px;
          background: #171717;
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .doctor-info {
          flex: 1;
        }

        .doctor-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.25rem 0;
        }

        .specialty {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .appointment-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
        }

        .info-row.payment-row {
          border-top: 1px solid #f0f0f0;
          margin-top: 0.5rem;
          padding-top: 1rem;
        }

        .info-label {
          font-size: 0.95rem;
          color: #666;
          font-weight: 500;
        }

        .info-value {
          font-size: 0.95rem;
          color: #171717;
          font-weight: 500;
          text-align: right;
        }

        .info-value.amount {
          font-size: 1.1rem;
          font-weight: 600;
          color: #059669;
        }

        .transaction-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .transaction-label {
          font-size: 0.8rem;
          color: #666;
          margin: 0 0 0.25rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transaction-id {
          font-size: 0.9rem;
          color: #171717;
          font-family: 'Courier New', monospace;
          font-weight: 500;
          margin: 0;
        }

        .next-steps {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .steps-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 1.5rem 0;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .step-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .step-text {
          font-size: 0.95rem;
          color: #666;
          line-height: 1.4;
        }

        .action-section {
          text-align: center;
        }

        .back-button {
          background: #171717;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .back-button:hover {
          background: #000;
          transform: translateY(-1px);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .main-content {
            padding: 1.5rem;
          }

          .appointment-card,
          .next-steps {
            padding: 1.5rem;
          }

          .success-title {
            font-size: 1.75rem;
          }

          .success-subtitle {
            font-size: 1rem;
          }

          .logo-svg {
            width: 150px;
          }

          .header {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 1rem;
          }

          .appointment-card,
          .next-steps {
            padding: 1rem;
          }

          .success-title {
            font-size: 1.5rem;
          }

          .doctor-section {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }

          .doctor-avatar {
            width: 50px;
            height: 50px;
            font-size: 1rem;
          }

          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .info-value {
            text-align: left;
          }

          .back-button {
            width: 100%;
            padding: 1rem;
          }

          .logo-svg {
            width: 120px;
          }
        }
      `}</style>
    </div>
  );
}

const ReservaExitosaPage = () => {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Helvetica Neue, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #171717',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p>Cargando confirmación...</p>
        </div>
      </div>
    }>
      <ReservaExitosaContent />
    </Suspense>
  );
};

export default ReservaExitosaPage;