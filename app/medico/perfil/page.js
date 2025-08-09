'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function PerfilMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [doctorData, setDoctorData] = useState({
    Name: '',
    Email: '',
    WhatsApp: '',
    Especialidad: '',
    Atiende: '',
    Seguros: [],
    Password: '',
    PhotoURL: '',
    RSS: '',
    Experiencia: '',
  });

  const especialidades = [
    "Oftalmología", "Medicina Familiar", "Medicina Familiar Niños", "Medicina Familiar Adultos",
    "Dermatología", "Pediatría", "Otorrinolaringología", "Neurología", "Cardiología", 
    "Ginecología", "Traumatología", "Psiquiatría", "Urología", "Endocrinología",
    "Gastroenterología", "Neumología", "Reumatología", "Oncología",
    "Hematología", "Nefrología", "Infectología", "Geriatría",
    "Medicina Interna", "Anestesiología", "Radiología", "Patología"
  ];

  const opcionesAtiende = ["Adultos", "Niños", "Ambos"];
  const opcionesSeguros = ["Fonasa", "Isapres", "Particular"];

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchDoctorData();
    }
  }, [session, status, router]);

  const fetchDoctorData = async () => {
    try {
      const res = await fetch(`/api/doctors/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorData({
          Name: data.fields?.Name || '',
          Email: data.fields?.Email || '',
          WhatsApp: data.fields?.WhatsApp || '',
          Especialidad: data.fields?.Especialidad || '',
          Atiende: data.fields?.Atiende || '',
          Seguros: data.fields?.Seguros || [],
          Password: '',
          PhotoURL: data.fields?.PhotoURL || '',
          RSS: data.fields?.RSS || '',
          Experiencia: data.fields?.Experiencia || '',
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage('Error cargando datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDoctorData(prev => ({ ...prev, PhotoURL: e.target.result }));
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('doctorId', session.user.doctorId);
      
      if (doctorData.PhotoURL && doctorData.PhotoURL.includes('s3.') && doctorData.PhotoURL.includes('amazonaws.com')) {
        formData.append('oldImageUrl', doctorData.PhotoURL);
      }

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (uploadData.success) {
        setDoctorData(prev => ({ ...prev, PhotoURL: uploadData.url }));
        setMessage('Foto subida correctamente');
      } else {
        throw new Error(uploadData.error || 'Error desconocido');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setMessage(`Error subiendo la imagen: ${error.message}`);
      fetchDoctorData();
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (doctorData.RSS && !/^\d{6,8}$/.test(doctorData.RSS.replace(/\D/g, ''))) {
      setMessage('Formato de RSS inválido. Debe contener 6-8 dígitos');
      setSaving(false);
      return;
    }

    try {
      const updateData = { ...doctorData };
      if (!updateData.Password) {
        delete updateData.Password;
      }

      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.user.doctorId,
          ...updateData
        })
      });

      if (res.ok) {
        setMessage('Perfil actualizado correctamente');
        setDoctorData(prev => ({ ...prev, Password: '' }));
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setMessage(`${errorData.message || 'Error actualizando perfil'}`);
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleSeguroChange = (seguro) => {
    setDoctorData(prev => ({
      ...prev,
      Seguros: prev.Seguros.includes(seguro)
        ? prev.Seguros.filter(s => s !== seguro)
        : [...prev.Seguros, seguro]
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="logo-container">
            <div className="logo-text">
              <span className="logo-sobrecupos">Sobrecupos</span>
              <span className="logo-ai">AI</span>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-track">
              <div className="progress-fill"></div>
            </div>
            <p className="loading-text">Cargando tu perfil...</p>
          </div>
        </div>

        <style jsx>{`
          .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          }

          .loading-content {
            text-align: center;
            position: relative;
          }

          .logo-container {
            margin-bottom: 3rem;
          }

          .logo-text {
            font-size: 3rem;
            font-weight: 200;
            letter-spacing: -2px;
            display: inline-flex;
            align-items: baseline;
            gap: 0.5rem;
          }

          .logo-sobrecupos {
            color: #171717;
            font-weight: 800;
          }

          .logo-ai {
            color: #666;
            font-size: 0.7em;
            font-weight: 300;
          }

          .progress-container {
            width: 320px;
            margin: 0 auto;
          }

          .progress-track {
            width: 100%;
            height: 2px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 1px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: #171717;
            border-radius: 1px;
            width: 100%;
            animation: progressAnimation 2s ease-in-out infinite;
          }

          .loading-text {
            color: #666;
            font-size: 0.875rem;
            margin-top: 2rem;
            font-weight: 400;
            letter-spacing: 0.5px;
          }

          @keyframes progressAnimation {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header minimalista estilo Apple */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => router.back()} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <h1 className="header-title">Mi Perfil</h1>
              <span className="header-subtitle">Configuración</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Mensaje de estado */}
        {message && (
          <div className={`message ${message.includes('correctamente') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="main-title">Configuración del perfil</h2>
            <p className="main-subtitle">Mantén actualizada tu información profesional</p>
          </div>
        </section>

        {/* Formulario */}
        <section className="form-section">
          <form onSubmit={handleSave} className="profile-form">
            
            {/* Foto de perfil */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Foto de Perfil</h3>
                <p className="card-subtitle">Esta imagen será visible para los pacientes</p>
              </div>
              
              <div className="photo-container">
                <div className="photo-preview">
                  {doctorData.PhotoURL ? (
                    <img 
                      src={doctorData.PhotoURL} 
                      alt="Foto de perfil" 
                      className="profile-image"
                    />
                  ) : (
                    <div className="placeholder-image">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="upload-overlay">
                      <div className="upload-spinner"></div>
                    </div>
                  )}
                </div>
                
                <div className="photo-actions">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="upload-button"
                  >
                    {uploadingImage ? 'Subiendo...' : 'Cambiar Foto'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <p className="upload-help">
                    Tamaño máximo: 5MB. Formatos: JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Información Personal */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Información Personal</h3>
                <p className="card-subtitle">Datos de contacto y personales</p>
              </div>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Nombre Completo *</label>
                  <input
                    type="text"
                    value={doctorData.Name}
                    onChange={(e) => setDoctorData({...doctorData, Name: e.target.value})}
                    required
                    className="field-input"
                    placeholder="Dr. Juan Pérez Silva"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Email *</label>
                  <input
                    type="email"
                    value={doctorData.Email}
                    onChange={(e) => setDoctorData({...doctorData, Email: e.target.value})}
                    required
                    className="field-input"
                    placeholder="doctor@ejemplo.com"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">WhatsApp</label>
                  <input
                    type="tel"
                    value={doctorData.WhatsApp}
                    onChange={(e) => setDoctorData({...doctorData, WhatsApp: e.target.value})}
                    className="field-input"
                    placeholder="+56912345678"
                  />
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Información Profesional</h3>
                <p className="card-subtitle">Detalles de tu práctica médica</p>
              </div>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Especialidad *</label>
                  <select
                    value={doctorData.Especialidad}
                    onChange={(e) => setDoctorData({...doctorData, Especialidad: e.target.value})}
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
                    value={doctorData.Atiende}
                    onChange={(e) => setDoctorData({...doctorData, Atiende: e.target.value})}
                    className="field-input"
                  >
                    <option value="">Seleccionar...</option>
                    {opcionesAtiende.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Seguros que acepto</label>
                  <div className="checkbox-group">
                    {opcionesSeguros.map(seguro => (
                      <label key={seguro} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={doctorData.Seguros.includes(seguro)}
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
                  {doctorData.Seguros.length > 0 && (
                    <p className="selected-count">
                      {doctorData.Seguros.length} seleccionado{doctorData.Seguros.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="field-label">Registro Superintendencia de Salud (RSS)</label>
                  <input
                    type="text"
                    value={doctorData.RSS}
                    onChange={(e) => setDoctorData({...doctorData, RSS: e.target.value})}
                    className="field-input"
                    placeholder="123456"
                    maxLength="8"
                  />
                  <p className="field-help">
                    Número de registro profesional otorgado por la Superintendencia de Salud
                  </p>
                </div>
              </div>
            </div>

            {/* Experiencia Profesional */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Experiencia Profesional</h3>
                <p className="card-subtitle">Información visible para los pacientes</p>
              </div>
              
              <div className="form-field">
                <label className="field-label">Experiencia Profesional</label>
                <textarea
                  value={doctorData.Experiencia}
                  onChange={(e) => setDoctorData({...doctorData, Experiencia: e.target.value})}
                  className="field-textarea"
                  placeholder="Describe tu experiencia profesional, logros destacados, áreas de especialización, procedimientos que realizas, etc."
                  rows="4"
                />
                <p className="field-help">
                  Esta información será visible para los pacientes en tu perfil público
                </p>
              </div>
            </div>

            {/* Seguridad */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Seguridad</h3>
                <p className="card-subtitle">Cambiar contraseña de acceso</p>
              </div>
              
              <div className="form-field">
                <label className="field-label">Nueva Contraseña</label>
                <input
                  type="password"
                  value={doctorData.Password}
                  onChange={(e) => setDoctorData({...doctorData, Password: e.target.value})}
                  className="field-input"
                  placeholder="Dejar vacío para mantener actual"
                />
                <p className="field-help">
                  Solo completa si quieres cambiar tu contraseña actual
                </p>
              </div>
            </div>

            {/* Botón de guardar */}
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={saving || uploadingImage}
                className="save-button"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </section>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #171717;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(250, 250, 250, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 1rem 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
          width: 36px;
          height: 36px;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          border-color: #171717;
          background: #f9fafb;
        }

        .header-text {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #171717;
          margin: 0;
        }

        .header-subtitle {
          font-size: 1rem;
          font-weight: 300;
          color: #666;
        }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Mensaje */
        .message {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
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

        /* Hero Section */
        .hero-section {
          text-align: center;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto;
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
          margin: 0;
          font-weight: 400;
        }

        /* Form */
        .form-section {
          width: 100%;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 300;
          color: #171717;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .card-subtitle {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .form-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
          align-items: start;
          grid-auto-rows: min-content;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-self: start;
          min-height: 80px;
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
          min-height: 100px;
          line-height: 1.5;
        }

        .field-help {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
          font-style: italic;
          margin-top: auto;
        }

        .rss-help {
          margin-top: -1rem;
          margin-bottom: 0.5rem;
        }

        /* Photo Upload */
        .photo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .photo-preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 60px;
          overflow: hidden;
          border: 4px solid #f5f5f5;
          background: #f9fafb;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          background: #f9fafb;
        }

        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .photo-actions {
          text-align: center;
        }

        .upload-button {
          background: #f5f5f5;
          color: #171717;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.5rem;
        }

        .upload-button:hover:not(:disabled) {
          background: #e5e5e5;
          border-color: #171717;
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-help {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
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

        .selected-count {
          font-size: 0.75rem;
          color: #ff9500;
          font-weight: 500;
          margin: 0;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
        }

        .save-button {
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

        .save-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive - Tablet */
        @media (min-width: 768px) {
          .header {
            padding: 1rem 2rem;
          }

          .main-content {
            padding: 3rem 2rem;
            gap: 3rem;
          }

          .main-title {
            font-size: 3rem;
          }

          .main-subtitle {
            font-size: 1.2rem;
          }

          .form-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            align-items: start;
            grid-auto-rows: min-content;
          }

          .form-field {
            min-height: 85px;
          }

          .photo-preview {
            width: 140px;
            height: 140px;
            border-radius: 70px;
          }

          .form-card {
            padding: 2.5rem;
          }
        }

        /* Responsive - Desktop */
        @media (min-width: 1024px) {
          .main-content {
            max-width: 900px;
            gap: 4rem;
          }

          .form-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            align-items: start;
            grid-auto-rows: min-content;
          }

          .form-field {
            min-height: 90px;
          }

          .form-field.full-width {
            grid-column: 1 / -1;
            min-height: auto;
          }

          .card-header {
            margin-bottom: 2.5rem;
          }

          .form-card {
            padding: 3rem;
          }
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .main-content {
            padding: 1.5rem 1rem;
            gap: 1.5rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .main-subtitle {
            font-size: 1rem;
          }

          .form-card {
            padding: 1.5rem;
          }

          .card-header {
            margin-bottom: 1.5rem;
          }

          .photo-preview {
            width: 100px;
            height: 100px;
            border-radius: 50px;
          }

          .save-button {
            width: 100%;
            min-width: auto;
          }
        }

        /* iPhone SE and very small devices */
        @media (max-width: 375px) {
          .main-title {
            font-size: 1.75rem;
          }

          .header-content {
            gap: 0.5rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .form-card {
            padding: 1rem;
          }

          .photo-preview {
            width: 80px;
            height: 80px;
            border-radius: 40px;
          }
        }

        /* Estados de foco */
        .back-button:focus,
        .upload-button:focus,
        .save-button:focus,
        .field-input:focus,
        .field-textarea:focus,
        .checkbox-item:focus-within {
          outline: 2px solid #ff9500;
          outline-offset: 2px;
        }

        /* Modo de Alto Contraste */
        @media (prefers-contrast: high) {
          .page-container {
            background: #ffffff;
          }

          .form-card {
            border-color: #000000;
            background: #ffffff;
          }

          .main-title,
          .card-title {
            color: #000000;
          }
        }

        /* Reducir Movimiento */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Safe area for iPhones with notch */
        @supports (padding: max(0px)) {
          .page-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
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

        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          .field-input,
          .field-textarea {
            -webkit-appearance: none;
            -webkit-border-radius: 8px;
          }
          
          .save-button,
          .upload-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
      `}</style>
    </div>
  );
}