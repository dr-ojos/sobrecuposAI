'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PerfilMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [doctorData, setDoctorData] = useState({
    Name: '',
    Email: '',
    WhatsApp: '',
    Especialidad: '',
    Atiende: '',
    Seguros: [],
    Password: ''
  });

  const especialidades = [
    "Oftalmología", "Medicina Familiar", "Dermatología", 
    "Pediatría", "Otorrinolaringología", "Neurología", "Cardiología"
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
          Password: ''
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage('❌ Error cargando datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

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
        setMessage('❌ Error actualizando perfil');
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
                placeholder="Dr. Juan Pérez"
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

          <div className="form-section">
            <h3 className="section-title">🩺 Información Profesional</h3>
            
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
            disabled={saving}
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

        .perfil-form {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .form-section {
          padding: 20px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-section:last-of-type {
          border-bottom: none;
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

        .form-input, .form-select {
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
        }

        .form-input:focus, .form-select:focus {
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
          
          .form-input, .form-select {
            font-size: 16px;
          }
        }

        @media (max-width: 375px) {
          .perfil-header {
            padding: 10px 12px;
          }
          
          .perfil-header h1 {
            font-size: 15px;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .form-input, .form-select {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .save-btn {
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