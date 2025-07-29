'use client';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('credentials'); // 'credentials' o 'google'
  const router = useRouter();

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos');
      } else {
        // Login exitoso
        router.push('/medico/dashboard');
      }
    } catch (error) {
      setError('Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        callbackUrl: '/medico/dashboard',
        redirect: false
      });

      if (result?.error) {
        if (result.error === 'AccessDenied') {
          setError('Tu email no está registrado como médico en nuestro sistema');
        } else {
          setError('Error en el login con Google');
        }
      }
    } catch (error) {
      setError('Error en el login con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signin-container">
      <div className="signin-card">
        
        {/* Header Minimalista */}
        <header className="signin-header">
          <div className="logo-section">
            <div className="logo-text">
              <span className="logo-main">Sobrecupos</span>
              <span className="logo-ai">AI</span>
            </div>
            <p className="logo-subtitle">Portal Médicos</p>
          </div>
          <h1 className="signin-title">Iniciar sesión</h1>
          <p className="signin-description">Accede a tu panel de sobrecupos</p>
        </header>

        {/* Selector de método minimalista */}
        <div className="login-methods">
          <button
            className={`method-btn ${loginMethod === 'credentials' ? 'active' : ''}`}
            onClick={() => setLoginMethod('credentials')}
          >
            Email
          </button>
          <button
            className={`method-btn ${loginMethod === 'google' ? 'active' : ''}`}
            onClick={() => setLoginMethod('google')}
          >
            Google
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Formulario de credenciales */}
        {loginMethod === 'credentials' && (
          <form onSubmit={handleCredentialsLogin} className="signin-form">
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@ejemplo.com"
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`login-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <span className="loading-content">
                  <span className="loading-spinner"></span>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        )}

        {/* Login con Google */}
        {loginMethod === 'google' && (
          <div className="google-login">
            <p className="google-description">
              Usa tu cuenta de Google registrada como médico
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`google-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <span className="loading-content">
                  <span className="loading-spinner"></span>
                  Conectando...
                </span>
              ) : (
                <span className="google-content">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </span>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="signin-footer">
          <p className="footer-text">
            ¿No tienes acceso? Contacta al administrador
          </p>
          <button
            onClick={() => router.push('/')}
            className="back-home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver al inicio
          </button>
        </footer>
      </div>

      <style jsx>{`
        .signin-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          padding: 2rem 1rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .signin-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 3rem 2rem;
          width: 100%;
          max-width: 400px;
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
        .signin-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-section {
          margin-bottom: 2rem;
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .logo-main {
          font-size: 2rem;
          font-weight: 800;
          color: #171717;
          letter-spacing: -0.5px;
        }

        .logo-ai {
          font-size: 1.4rem;
          font-weight: 300;
          color: #666;
        }

        .logo-subtitle {
          font-size: 0.9rem;
          color: #666;
          font-weight: 400;
          margin: 0;
        }

        .signin-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.25px;
        }

        .signin-description {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
          font-weight: 400;
        }

        /* Login Methods */
        .login-methods {
          display: flex;
          gap: 0;
          margin-bottom: 2rem;
          background: #f5f5f5;
          border-radius: 6px;
          padding: 2px;
        }

        .method-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
          font-family: inherit;
        }

        .method-btn.active {
          background: white;
          color: #171717;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .method-btn:hover:not(.active) {
          color: #171717;
        }

        /* Error Message */
        .error-message {
          background: #fef2f2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 400;
          border: 1px solid #fecaca;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        /* Form */
        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s ease;
          background: white;
          font-family: inherit;
          outline: none;
        }

        .form-input:focus {
          border-color: #171717;
          box-shadow: 0 0 0 1px #171717;
        }

        .form-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .form-input::placeholder {
          color: #999;
        }

        /* Buttons */
        .login-button, .google-button {
          padding: 0.875rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          outline: none;
        }

        .login-button {
          background: #171717;
          color: white;
        }

        .login-button:hover:not(.loading) {
          background: #000;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          cursor: not-allowed;
          transform: none;
        }

        .google-button {
          background: white;
          color: #374151;
          border: 1px solid #e5e5e5;
        }

        .google-button:hover:not(.loading) {
          border-color: #171717;
          transform: translateY(-1px);
        }

        .google-button:disabled {
          cursor: not-allowed;
          transform: none;
        }

        /* Google Login */
        .google-login {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .google-description {
          text-align: center;
          color: #666;
          font-size: 0.875rem;
          margin: 0;
          font-weight: 400;
        }

        .google-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Loading States */
        .loading-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .google-button .loading-spinner {
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top: 2px solid currentColor;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .signin-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .footer-text {
          color: #666;
          font-size: 0.8rem;
          margin: 0 0 1rem;
          font-weight: 400;
        }

        .back-home {
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

        .back-home:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .signin-container {
            padding: 1rem;
          }

          .signin-card {
            padding: 2rem 1.5rem;
          }

          .logo-main {
            font-size: 1.75rem;
          }

          .logo-ai {
            font-size: 1.2rem;
          }

          .signin-title {
            font-size: 1.3rem;
          }
        }

        @media (max-width: 480px) {
          .signin-card {
            padding: 1.5rem 1rem;
          }

          .logo-main {
            font-size: 1.5rem;
          }

          .logo-ai {
            font-size: 1rem;
          }

          .signin-title {
            font-size: 1.2rem;
          }

          .method-btn {
            font-size: 0.8rem;
            padding: 0.6rem;
          }

          .form-input {
            font-size: 16px;
          }
        }

        @media (max-width: 375px) {
          .signin-container {
            padding: 0.5rem;
          }

          .signin-card {
            padding: 1.25rem 0.75rem;
          }

          .logo-main {
            font-size: 1.3rem;
          }

          .signin-title {
            font-size: 1.1rem;
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .signin-container {
            padding-top: max(2rem, env(safe-area-inset-top));
            padding-bottom: max(2rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}