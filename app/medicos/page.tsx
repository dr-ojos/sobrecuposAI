'use client';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { CreateDoctorRequest } from '../../types/doctor';

interface RegistrationFormData {
  nombre: string;
  especialidad: string;
  atencion: 'Adultos' | 'Niños' | 'Ambos' | '';
  lugares: string;
  email: string;
  whatsapp: string;
  seguros: string[];
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

type RegistrationStep = 'login' | 'form' | 'success';

export default function RegistroMedicosPage(): React.JSX.Element {
  const [step, setStep] = useState<RegistrationStep>('login');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [formData, setFormData] = useState<RegistrationFormData>({
    nombre: '',
    especialidad: '',
    atencion: '',
    lugares: '',
    email: '',
    whatsapp: '',
    seguros: []
  });

  const especialidades: string[] = [
    "Oftalmología", "Medicina Familiar", "Medicina Familiar Niños", "Medicina Familiar Adultos",
    "Dermatología", "Pediatría", "Otorrinolaringología", "Neurología", "Cardiología", 
    "Ginecología", "Traumatología", "Psiquiatría", "Urología", "Endocrinología",
    "Gastroenterología", "Neumología", "Reumatología", "Oncología",
    "Hematología", "Nefrología", "Infectología", "Geriatría",
    "Medicina Interna", "Anestesiología", "Radiología", "Patología"
  ];

  const opcionesAtencion: Array<'Adultos' | 'Niños' | 'Ambos'> = ['Adultos', 'Niños', 'Ambos'];
  const opcionesSeguros: string[] = ['Fonasa', 'Isapres', 'Particular'];

  const handleGoogleLogin = async (): Promise<void> => {
    setLoading(true);
    try {
      // Aquí iría la lógica con NextAuth
      // await signIn("google", { callbackUrl: "/medicos?step=form" })
      
      // Simulación para desarrollo
      setTimeout(() => {
        setStep('form');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error en login:', error);
      setMessage('Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationFormData) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSeguroChange = (seguro: string): void => {
    setFormData(prev => ({
      ...prev,
      seguros: prev.seguros.includes(seguro)
        ? prev.seguros.filter(s => s !== seguro)
        : [...prev.seguros, seguro]
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validación básica
    if (!formData.nombre || !formData.especialidad || !formData.email) {
      setMessage('Por favor completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      const doctorRequest: CreateDoctorRequest = {
        Name: formData.nombre,
        Especialidad: formData.especialidad,
        Email: formData.email,
        WhatsApp: formData.whatsapp,
        Atiende: formData.atencion || 'Ambos',
        Seguros: formData.seguros,
        Estado: 'Pendiente'
      };

      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorRequest),
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        setStep('success');
        setMessage('Registro exitoso. Tu cuenta será revisada y activada pronto.');
      } else {
        setMessage(result.error || result.message || 'Error al registrar médico');
      }
    } catch (error) {
      console.error('Error registrando médico:', error);
      setMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setFormData({
      nombre: '',
      especialidad: '',
      atencion: '',
      lugares: '',
      email: '',
      whatsapp: '',
      seguros: []
    });
    setStep('login');
    setMessage('');
  };

  return (
    <div className="registro-container">
      <div className="registro-content">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <span className="logo-text">Sobrecupos</span>
            <span className="logo-ai">AI</span>
          </div>
          {step !== 'login' && (
            <button onClick={resetForm} className="back-button">
              ← Volver al inicio
            </button>
          )}
        </div>

        {/* Contenido principal */}
        <div className="main-content">
          {step === 'login' && (
            <div className="login-section">
              <div className="welcome-content">
                <h1 className="main-title">Registro de Médicos</h1>
                <p className="main-subtitle">
                  Únete a nuestra plataforma y amplía tu práctica médica
                </p>
                <ul className="benefits-list">
                  <li>✅ Gestiona tus sobrecupos de manera eficiente</li>
                  <li>✅ Conecta con pacientes que necesitan atención</li>
                  <li>✅ Optimiza tu agenda médica</li>
                  <li>✅ Aumenta tus ingresos profesionales</li>
                </ul>
              </div>
              
              <div className="login-actions">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="google-login-btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>
                
                <p className="login-help">
                  Al continuar, aceptas nuestros términos de servicio y política de privacidad
                </p>
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="form-section">
              <div className="form-header">
                <h2 className="form-title">Completa tu perfil profesional</h2>
                <p className="form-subtitle">
                  Información necesaria para validar tu cuenta médica
                </p>
              </div>

              {message && (
                <div className={`message ${message.includes('exitoso') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="registration-form">
                {/* Información Personal */}
                <div className="form-card">
                  <h3 className="card-title">Información Personal</h3>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="field-label">Nombre completo *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={handleInputChange('nombre')}
                        required
                        className="field-input"
                        placeholder="Dr. Juan Pérez Silva"
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">Email profesional *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                        className="field-input"
                        placeholder="doctor@ejemplo.com"
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={handleInputChange('whatsapp')}
                        className="field-input"
                        placeholder="+56912345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Información Profesional */}
                <div className="form-card">
                  <h3 className="card-title">Información Profesional</h3>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="field-label">Especialidad *</label>
                      <select
                        value={formData.especialidad}
                        onChange={handleInputChange('especialidad')}
                        required
                        className="field-input"
                      >
                        <option value="">Seleccionar especialidad...</option>
                        {especialidades.map(esp => (
                          <option key={esp} value={esp}>{esp}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-label">Atiendo a</label>
                      <select
                        value={formData.atencion}
                        onChange={handleInputChange('atencion')}
                        className="field-input"
                      >
                        <option value="">Seleccionar...</option>
                        {opcionesAtencion.map(opcion => (
                          <option key={opcion} value={opcion}>{opcion}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field full-width">
                      <label className="field-label">Seguros que acepto</label>
                      <div className="checkbox-group">
                        {opcionesSeguros.map(seguro => (
                          <label key={seguro} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.seguros.includes(seguro)}
                              onChange={() => handleSeguroChange(seguro)}
                              className="checkbox-input"
                            />
                            <div className="checkbox-custom">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <span className="checkbox-label">{seguro}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-field full-width">
                      <label className="field-label">Lugares de atención</label>
                      <textarea
                        value={formData.lugares}
                        onChange={handleInputChange('lugares')}
                        className="field-textarea"
                        placeholder="Describe dónde atiendes: clínicas, consultas privadas, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="submit-button"
                  >
                    {loading ? 'Registrando...' : 'Completar Registro'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="success-section">
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h2 className="success-title">¡Registro Exitoso!</h2>
                <p className="success-message">
                  Tu solicitud de registro ha sido enviada correctamente. 
                  Nuestro equipo revisará tu información y te contactaremos pronto.
                </p>
                
                <div className="next-steps">
                  <h3>Próximos pasos:</h3>
                  <ol>
                    <li>Revisaremos tu información profesional</li>
                    <li>Validaremos tu especialidad y credenciales</li>
                    <li>Te enviaremos las credenciales de acceso</li>
                    <li>Podrás comenzar a gestionar tus sobrecupos</li>
                  </ol>
                </div>

                <button onClick={resetForm} className="restart-button">
                  Registrar otro médico
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .registro-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
        }

        .registro-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .logo {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .logo-text {
          font-size: 2rem;
          font-weight: 800;
          color: #171717;
          letter-spacing: -1px;
        }

        .logo-ai {
          font-size: 1.4rem;
          font-weight: 300;
          color: #666;
        }

        .back-button {
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          color: #666;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          border-color: #171717;
          color: #171717;
        }

        .main-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        /* Login Section */
        .login-section {
          padding: 3rem;
          text-align: center;
        }

        .welcome-content {
          margin-bottom: 3rem;
        }

        .main-title {
          font-size: 2.5rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 1rem 0;
          letter-spacing: -1px;
        }

        .main-subtitle {
          font-size: 1.1rem;
          color: #666;
          margin: 0 0 2rem 0;
          font-weight: 400;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: left;
          max-width: 400px;
          margin: 0 auto;
        }

        .benefits-list li {
          padding: 0.5rem 0;
          color: #374151;
          font-size: 0.875rem;
        }

        .google-login-btn {
          background: white;
          border: 1px solid #dadce0;
          border-radius: 8px;
          padding: 1rem 2rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 0 auto 1rem;
          min-width: 240px;
        }

        .google-login-btn:hover:not(:disabled) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-color: #171717;
        }

        .google-login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #666;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-help {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
          max-width: 300px;
          margin: 0 auto;
          line-height: 1.4;
        }

        /* Form Section */
        .form-section {
          padding: 2rem;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 2rem;
          text-align: center;
        }

        .message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .registration-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-card {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.25px;
        }

        .form-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .field-input,
        .field-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
          background: white;
          font-family: inherit;
        }

        .field-input:focus,
        .field-textarea:focus {
          border-color: #ff9500;
          box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1);
        }

        .field-textarea {
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
        }

        /* Checkbox */
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e5e5;
          border-radius: 4px;
          background: white;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-custom svg {
          opacity: 0;
          transition: opacity 0.2s ease;
          color: white;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #ff9500;
          border-color: #ff9500;
        }

        .checkbox-input:checked + .checkbox-custom svg {
          opacity: 1;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: #171717;
          user-select: none;
        }

        .form-actions {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
        }

        .submit-button {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 1rem 3rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
          min-width: 200px;
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Success Section */
        .success-section {
          padding: 3rem;
          text-align: center;
        }

        .success-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .success-title {
          font-size: 1.75rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1rem 0;
          letter-spacing: -0.5px;
        }

        .success-message {
          color: #666;
          font-size: 1rem;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }

        .next-steps {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .next-steps h3 {
          font-size: 1rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1rem 0;
        }

        .next-steps ol {
          margin: 0;
          padding-left: 1.25rem;
          color: #666;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .next-steps li {
          margin-bottom: 0.5rem;
        }

        .restart-button {
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: #666;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .restart-button:hover {
          border-color: #171717;
          color: #171717;
        }

        /* Select styling */
        select.field-input {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1rem;
          padding-right: 2.5rem;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .registro-content {
            padding: 1rem;
          }

          .header {
            margin-bottom: 2rem;
          }

          .logo-text {
            font-size: 1.5rem;
          }

          .logo-ai {
            font-size: 1rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .login-section,
          .form-section,
          .success-section {
            padding: 1.5rem;
          }

          .form-card {
            padding: 1.5rem;
          }

          .submit-button {
            width: 100%;
            min-width: auto;
          }
        }

        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          .field-input,
          .field-textarea {
            -webkit-appearance: none;
            -webkit-border-radius: 8px;
          }
          
          .submit-button,
          .google-login-btn {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
      `}</style>
    </div>
  );
}