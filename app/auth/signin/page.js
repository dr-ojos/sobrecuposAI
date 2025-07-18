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
    <div className="signin-container">
      <div className="signin-card">
        {/* Header */}
        <div className="signin-header">
          <div className="logo">
            <span className="logo-icon">👨‍⚕️</span>
            <h1 className="logo-text">Portal Médicos</h1>
          </div>
          <p className="subtitle">Accede a tu panel de sobrecupos</p>
        </div>

        {/* Selector de método de login */}
        <div className="login-methods">
          <button
            className={`method-btn ${loginMethod === 'credentials' ? 'active' : ''}`}
            onClick={() => setLoginMethod('credentials')}
          >
            📧 Email y Contraseña
          </button>
          <button
            className={`method-btn ${loginMethod === 'google' ? 'active' : ''}`}
            onClick={() => setLoginMethod('google')}
          >
            🔗 Google
          </button>
        </div>

        {/* Formulario de login por credenciales */}
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

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? '⏳ Iniciando sesión...' : '🔐 Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* Login con Google */}
        {loginMethod === 'google' && (
          <div className="google-login">
            <p className="google-description">
              Usa tu cuenta de Google registrada como médico
            </p>
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="google-button"
            >
              {loading ? (
                <>⏳ Conectando...</>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="signin-footer">
          <p className="footer-text">
            ¿No tienes acceso? Contacta al administrador
          </p>
          <button
            onClick={() => router.push('/')}
            className="back-home"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      <style jsx>{`
        .signin-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .signin-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .signin-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 0.9rem;
        }

        .login-methods {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: #f3f4f6;
          border-radius: 12px;
          padding: 0.25rem;
        }

        .method-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
        }

        .method-btn.active {
          background: white;
          color: #1a1a1a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }

        .form-input {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid #fecaca;
        }

        .login-button, .google-button {
          padding: 0.875rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-button {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .google-login {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .google-description {
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
        }

        .google-button {
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .google-button:hover:not(:disabled) {
          border-color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .google-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signin-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .footer-text {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0 0 1rem;
        }

        .back-home {
          background: none;
          border: none;
          color: #667eea;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .back-home:hover {
          color: #4f46e5;
        }

        @media (max-width: 480px) {
          .signin-card {
            padding: 1.5rem;
            margin: 0.5rem;
          }
          
          .logo-text {
            font-size: 1.3rem;
          }
          
          .method-btn {
            font-size: 0.8rem;
            padding: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}