'use client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <main className="login-container">
      <div className="login-card">
        
        {/* Header Minimalista */}
        <header className="login-header">
          <div className="logo-section">
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
            <p className="logo-subtitle">Sistema de Sobrecupos Médicos</p>
          </div>
          <h1 className="login-title">Accede a tu cuenta</h1>
          <p className="login-description">Regístrate para acceder a sobrecupos</p>
        </header>

        {/* Opciones de acceso */}
        <div className="access-options">
          
          {/* Soy Paciente */}
          <div className="patient-section">
            <h2 className="section-title">Soy Paciente</h2>
            
            {/* Botones principales */}
            <div className="main-buttons">
              <button 
                className="action-btn primary"
                onClick={() => router.push('/auth/patient/signin')}
              >
                Ingresar
              </button>
              
              <button 
                className="action-btn gmail"
                onClick={() => router.push('/auth/patient/signup?method=gmail')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Gmail
              </button>
              
              <button 
                className="action-btn secondary"
                onClick={() => router.push('/auth/patient/signup')}
              >
                Crear cuenta
              </button>
            </div>
            
            {/* Links de texto */}
            <div className="text-links">
              <button 
                className="text-link"
                onClick={() => router.push('/auth/signin')}
              >
                Ingreso médicos
              </button>
            </div>
          </div>

        </div>

        {/* Acceso como invitado */}
        <footer className="login-footer">
          <p className="footer-text">¿Prefieres continuar sin registrarte?</p>
          <p className="footer-benefit">Si te registras es más rápido buscar sobrecupos.</p>
          <button 
            className="guest-button"
            onClick={() => router.push('/')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Continuar como invitado
          </button>
        </footer>

      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          padding: 2rem 1rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .login-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 3rem 2rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header */
        .login-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .logo-section {
          margin-bottom: 2rem;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .logo-svg {
          width: 300px;
          height: auto;
          max-width: 100%;
        }

        .logo-subtitle {
          font-size: 0.9rem;
          color: #666;
          font-weight: 400;
          margin: 0;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.25px;
        }

        .login-description {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        /* Access Options */
        .access-options {
          margin-bottom: 2.5rem;
        }
        
        .patient-section {
          text-align: center;
        }
        
        .section-title {
          font-size: 1.3rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 2rem 0;
          letter-spacing: -0.25px;
        }
        
        .main-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .text-links {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e5e5;
        }

        .text-link {
          background: none;
          border: none;
          color: #666;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
          transition: color 0.2s ease;
          padding: 0.5rem 0;
        }

        .text-link:hover {
          color: #171717;
        }

        .action-btn {
          padding: 0.65rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: inherit;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: auto;
          min-width: 140px;
        }

        .action-btn.primary {
          background: #171717;
          color: white;
        }

        .action-btn.primary:hover {
          background: #000;
          transform: translateY(-1px);
        }

        .action-btn.secondary {
          background: white;
          color: #171717;
          border: 1px solid #e5e5e5;
        }

        .action-btn.secondary:hover {
          border-color: #171717;
        }

        .action-btn.gmail {
          background: white;
          color: #171717;
          border: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn.gmail:hover {
          border-color: #4285F4;
          color: #4285F4;
        }

        /* Footer */
        .login-footer {
          text-align: center;
          border-top: 1px solid #e5e5e5;
          padding-top: 2rem;
        }

        .footer-text {
          color: #666;
          font-size: 0.8rem;
          margin: 0 0 0.5rem;
          font-weight: 400;
        }
        
        .footer-benefit {
          color: #666;
          font-size: 0.8rem;
          margin: 0 0 1rem;
          font-weight: 600;
        }

        .guest-button {
          background: none;
          border: 1px solid #e5e5e5;
          color: #666;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 400;
          transition: all 0.2s ease;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: inherit;
        }

        .guest-button:hover {
          border-color: #171717;
          color: #171717;
        }


        /* Responsive */
        @media (max-width: 768px) {
          .login-container {
            padding: 1rem;
          }

          .login-card {
            padding: 2rem 1.5rem;
          }

          .logo-svg {
            width: 260px;
          }
          
          .main-buttons {
            gap: 0.75rem;
            align-items: center;
          }

          .login-title {
            font-size: 1.3rem;
          }

          .option-card {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .option-content {
            width: 100%;
          }

          .option-actions {
            width: 100%;
            justify-content: stretch;
          }

          .action-btn {
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem 1rem;
          }

          .logo-svg {
            width: 220px;
          }
          
          .section-title {
            font-size: 1.2rem;
          }

          .login-title {
            font-size: 1.2rem;
          }

          .action-btn {
            font-size: 0.8rem;
            padding: 0.6rem 0.8rem;
            min-width: 120px;
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .login-container {
            padding-top: max(2rem, env(safe-area-inset-top));
            padding-bottom: max(2rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}