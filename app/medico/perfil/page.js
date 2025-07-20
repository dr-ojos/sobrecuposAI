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
    // Nuevos campos simplificados
    PhotoURL: '',
    RSS: '', // Registro Superintendencia de Salud
    Experiencia: '', // Experiencia profesional
  });

  const especialidades = [
    "Oftalmología", "Medicina Familiar", "Dermatología", 
    "Pediatría", "Otorrinolaringología", "Neurología", 
    "Cardiología", "Ginecología", "Traumatología", 
    "Psiquiatría", "Urología", "Endocrinología"
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
          // Nuevos campos con valores por defecto
          PhotoURL: data.fields?.PhotoURL || '',
          RSS: data.fields?.RSS || '',
          Experiencia: data.fields?.Experiencia || '',
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage('❌ Error cargando datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setMessage('❌ La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    try {
      // Convertir a base64 para preview inmediato
      const reader = new FileReader();
      reader.onload = (e) => {
        setDoctorData(prev => ({ ...prev, PhotoURL: e.target.result }));
      };
      reader.readAsDataURL(file);

      // Aquí normalmente subirías a un servicio como Cloudinary, AWS S3, etc.
      // Por ahora simularemos la subida
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('doctorId', session.user.doctorId);

      // Simulación de upload (reemplazar con tu servicio real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('✅ Foto subida correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setMessage('❌ Error subiendo la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    // Validación del RSS (formato chileno)
    if (doctorData.RSS && !/^\d{6,8}$/.test(doctorData.RSS.replace(/\D/g, ''))) {
      setMessage('❌ Formato de RSS inválido. Debe contener 6-8 dígitos');
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
        setMessage('✅ Perfil actualizado correctamente');
        setDoctorData(prev => ({ ...prev, Password: '' }));
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setMessage(`❌ ${errorData.message || 'Error actualizando perfil'}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
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
        <div className="loading-spinner">⏳</div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <button onClick={() => router.back()} className="back-btn">← Volver</button>
        <h1>Mi Perfil</h1>
        <div className="header-spacer"></div>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSave} className="perfil-form">
          
          {/* Sección de Foto de Perfil */}
          <div className="form-section photo-section">
            <h3 className="section-title">📸 Foto de Perfil</h3>
            <div className="photo-upload-container">
              <div className="photo-preview">
                {doctorData.PhotoURL ? (
                  <img 
                    src={doctorData.PhotoURL} 
                    alt="Foto de perfil" 
                    className="profile-image"
                  />
                ) : (
                  <div className="placeholder-image">
                    <span className="placeholder-icon">👨‍⚕️</span>
                    <span className="placeholder-text">Sin foto</span>
                  </div>
                )}
                {uploadingImage && (
                  <div className="upload-overlay">
                    <div className="upload-spinner">⏳</div>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="upload-btn"
              >
                {uploadingImage ? '⏳ Subiendo...' : '📷 Cambiar Foto'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-help">
                Tamaño máximo: 5MB. Formatos: JPG, PNG, WebP
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="form-section">
            <h3 className="section-title">👤 Información Personal</h3>
            
            <div className="input-group">
              <label className="input-label">Nombre Completo</label>
              <input
                type="text"
                value={doctorData.Name}
                onChange={(e) => setDoctorData({...doctorData, Name: e.target.value})}
                required
                className="form-input"
                placeholder="Dr. Juan Pérez Silva"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                value={doctorData.Email}
                onChange={(e) => setDoctorData({...doctorData, Email: e.target.value})}
                required
                className="form-input"
                placeholder="doctor@ejemplo.com"
              />
            </div>

            <div className="input-group">
              <label className="input-label">WhatsApp</label>
              <input
                type="tel"
                value={doctorData.WhatsApp}
                onChange={(e) => setDoctorData({...doctorData, WhatsApp: e.target.value})}
                className="form-input"
                placeholder="+56912345678"
              />
            </div>
          </div>

          {/* Información Profesional */}
          <div className="form-section">
            <h3 className="section-title">🩺 Información Profesional</h3>
            
            <div className="input-group">
              <label className="input-label">Registro Superintendencia de Salud (RSS)</label>
              <input
                type="text"
                value={doctorData.RSS}
                onChange={(e) => setDoctorData({...doctorData, RSS: e.target.value})}
                className="form-input"
                placeholder="123456"
                maxLength="8"
              />
              <div className="input-help">
                Número de registro profesional otorgado por la Superintendencia de Salud
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Especialidad</label>
              <select
                value={doctorData.Especialidad}
                onChange={(e) => setDoctorData({...doctorData, Especialidad: e.target.value})}
                required
                className="form-select"
              >
                <option value="">Seleccionar especialidad...</option>
                {especialidades.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Atiendo a</label>
              <select
                value={doctorData.Atiende}
                onChange={(e) => setDoctorData({...doctorData, Atiende: e.target.value})}
                className="form-select"
              >
                <option value="">Seleccionar...</option>
                {opcionesAtiende.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Seguros que acepto</label>
              <div className="checkbox-group">
                {opcionesSeguros.map(seguro => (
                  <label key={seguro} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={doctorData.Seguros.includes(seguro)}
                      onChange={() => handleSeguroChange(seguro)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">{seguro}</span>
                  </label>
                ))}
              </div>
              {doctorData.Seguros.length > 0 && (
                <div className="selected-count">
                  ✓ {doctorData.Seguros.length} seleccionado{doctorData.Seguros.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Experiencia Profesional */}
          <div className="form-section">
            <h3 className="section-title">📝 Experiencia Profesional</h3>
            
            <div className="input-group">
              <label className="input-label">Experiencia Profesional</label>
              <textarea
                value={doctorData.Experiencia}
                onChange={(e) => setDoctorData({...doctorData, Experiencia: e.target.value})}
                className="form-textarea"
                placeholder="Describe tu experiencia profesional, logros destacados, áreas de especialización, procedimientos que realizas, etc."
                rows="4"
              />
              <div className="input-help">
                Esta información será visible para los pacientes en tu perfil público
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="form-section">
            <h3 className="section-title">🔐 Seguridad</h3>
            
            <div className="input-group">
              <label className="input-label">Nueva Contraseña</label>
              <input
                type="password"
                value={doctorData.Password}
                onChange={(e) => setDoctorData({...doctorData, Password: e.target.value})}
                className="form-input"
                placeholder="Dejar vacío para mantener actual"
              />
              <div className="input-help">
                Solo completa si quieres cambiar tu contraseña actual
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving || uploadingImage}
            className="save-btn"
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .perfil-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        @media (min-width: 768px) {
          .perfil-container {
            background: linear-gradient(135deg, #f0f4ff 0%, #e0ebff 100%);
            padding: 0;
          }
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
        }

        .loading-spinner {
          font-size: 2rem;
          margin-bottom: 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .perfil-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
          box-sizing: border-box;
        }

        .back-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(0, 122, 255, 0.1);
        }

        .perfil-header h1 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .header-spacer {
          width: 64px;
        }

        .message {
          margin: 16px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }

        .message.success {
          background: #e6ffed;
          color: #006400;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #fee;
          color: #b00020;
          border: 1px solid #f5c6cb;
        }

        .form-container {
          padding: 16px;
          max-width: 100vw;
          box-sizing: border-box;
        }

        @media (min-width: 768px) {
          .form-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 32px 24px;
          }
        }

        @media (min-width: 1024px) {
          .form-container {
            max-width: 900px;
            padding: 40px 32px;
          }
        }

        .perfil-form {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        @media (min-width: 768px) {
          .perfil-form {
            border-radius: 20px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
          }
        }

        .form-section {
          padding: 20px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        @media (min-width: 768px) {
          .form-section {
            padding: 32px 24px;
          }
          
          .form-section:not(.photo-section) {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            align-items: start;
          }

          .form-section .section-title {
            grid-column: 1 / -1;
            margin-bottom: 24px;
          }

          .form-section .input-group:last-child {
            grid-column: 1 / -1;
          }

          .form-section .checkbox-group {
            grid-column: 1 / -1;
          }
        }

        @media (min-width: 1024px) {
          .form-section {
            padding: 40px 32px;
          }
        }

        .photo-section {
          text-align: center;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .photo-section .section-title {
          justify-content: center;
        }

        .photo-upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .photo-preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 60px;
          overflow: hidden;
          border: 4px solid #f0f0f0;
          background: #f8f8f8;
        }

        @media (min-width: 768px) {
          .photo-preview {
            width: 140px;
            height: 140px;
            border-radius: 70px;
            border-width: 5px;
          }
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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          color: #8e8e93;
        }

        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 4px;
        }

        .placeholder-text {
          font-size: 12px;
          font-weight: 500;
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
          color: white;
          font-size: 24px;
        }

        .upload-spinner {
          animation: spin 1s linear infinite;
        }

        .upload-btn {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-help {
          font-size: 11px;
          color: #8e8e93;
          text-align: center;
          max-width: 200px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-group:last-child {
          margin-bottom: 0;
        }

        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 6px;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 10px;
          font-size: 15px;
          background: white;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          line-height: 1.4;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        .input-help {
          font-size: 11px;
          color: #8e8e93;
          margin-top: 4px;
          font-style: italic;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 8px 0;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e5e7;
          border-radius: 6px;
          background: white;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #007aff;
          border-color: #007aff;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .checkbox-label {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          user-select: none;
        }

        .selected-count {
          font-size: 12px;
          color: #34c759;
          font-weight: 600;
          margin-top: 6px;
        }

        .save-btn {
          width: 100%;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin: 20px 16px 16px;
          box-sizing: border-box;
          width: calc(100% - 32px);
        }

        @media (min-width: 768px) {
          .save-btn {
            margin: 32px 24px 24px;
            width: calc(100% - 48px);
            padding: 18px;
            font-size: 16px;
            border-radius: 14px;
          }
        }

        @media (min-width: 1024px) {
          .save-btn {
            margin: 40px 32px 32px;
            width: calc(100% - 64px);
            padding: 20px;
          }
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn:not(:disabled):active {
          transform: scale(0.98);
        }

        @media (max-width: 430px) {
          .form-container {
            padding: 12px;
          }
          
          .form-section {
            padding: 16px 12px;
          }
          
          .form-input, .form-select, .form-textarea {
            font-size: 16px;
          }
          
          .photo-preview {
            width: 100px;
            height: 100px;
          }
        }

        @media (max-width: 375px) {
          .perfil-header {
            padding: 10px 12px;
          }
          
          .perfil-header h1 {
            font-size: 15px;
          }
          
          .photo-preview {
            width: 90px;
            height: 90px;
          }
        }

        /* Mejoras para iPhone específico */
        @media (max-width: 414px) and (-webkit-min-device-pixel-ratio: 2) {
          .form-input, .form-select, .form-textarea {
            font-size: 16px;
            padding: 14px 16px;
          }
          
          .save-btn {
            padding: 18px;
            font-size: 16px;
          }
          
          .upload-btn {
            padding: 12px 24px;
            font-size: 14px;
          }
        }

        /* Desktop específico */
        @media (min-width: 1200px) {
          .form-container {
            max-width: 1000px;
            padding: 48px 40px;
          }
          
          .form-section {
            padding: 48px 40px;
          }
          
          .form-section:not(.photo-section) {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
          }
          
          .section-title {
            font-size: 18px;
          }
          
          .form-input, .form-select, .form-textarea {
            padding: 14px 16px;
            font-size: 16px;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .form-input, .form-select, .form-textarea {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .save-btn, .upload-btn {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }

        @supports (padding: max(0px)) {
          .perfil-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }
          
          .perfil-container {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}