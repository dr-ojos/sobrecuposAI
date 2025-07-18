// app/medico/sobrecupos/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SobrecuposMedico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sobrecupos, setSobrecupos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');
  const [newSobrecupo, setNewSobrecupo] = useState({
    clinica: '',
    direccion: '',
    fecha: '',
    hora: '',
    clinicaId: ''
  });

  const horarios = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00"
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchSobrecupos();
      fetchClinicas();
    }
  }, [session, status, router]);

  const fetchSobrecupos = async () => {
    try {
      const res = await fetch(`/api/sobrecupos/medicos/${session.user.doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setSobrecupos(data);
      }
    } catch (error) {
      console.error('Error cargando sobrecupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const data = await res.json();
        setClinicas(data);
      }
    } catch (error) {
      console.error('Error cargando clínicas:', error);
    }
  };

  const handleCreateSobrecupo = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!newSobrecupo.fecha || !newSobrecupo.hora) {
      setMessage('❌ Fecha y hora son obligatorios');
      return;
    }

    try {
      const doctorData = session.user.doctorData;
      
      const res = await fetch('/api/sobrecupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medico: session.user.doctorId,
          especialidad: doctorData?.Especialidad || 'Sin especialidad',
          clinica: newSobrecupo.clinica || 'Consulta particular',
          direccion: newSobrecupo.direccion || 'Por definir',
          fecha: newSobrecupo.fecha,
          hora: newSobrecupo.hora
        })
      });

      if (res.ok) {
        setMessage('✅ Sobrecupo creado correctamente');
        setNewSobrecupo({
          clinica: '',
          direccion: '',
          fecha: '',
          hora: '',
          clinicaId: ''
        });
        setShowCreateForm(false);
        fetchSobrecupos();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error creando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const handleClinicaSelect = (e) => {
    const clinicaId = e.target.value;
    const clinica = clinicas.find(c => c.id === clinicaId);
    
    if (clinica) {
      setNewSobrecupo({
        ...newSobrecupo,
        clinicaId,
        clinica: clinica.fields?.Nombre || '',
        direccion: clinica.fields?.Direccion || ''
      });
    } else {
      setNewSobrecupo({
        ...newSobrecupo,
        clinicaId: '',
        clinica: '',
        direccion: ''
      });
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const deleteSobrecupo = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este sobrecupo?')) return;

    try {
      const res = await fetch(`/api/sobrecupos?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage('✅ Sobrecupo eliminado');
        fetchSobrecupos();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error eliminando sobrecupo');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="loading-screen">⏳ Cargando sobrecupos...</div>;
  }

  return (
    <div className="sobrecupos-container">
      <div className="sobrecupos-header">
        <button onClick={() => router.back()} className="back-btn">← Volver</button>
        <h1>Mis Sobrecupos</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="create-btn"
        >
          {showCreateForm ? '✕ Cancelar' : '+ Crear'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-container">
          <form onSubmit={handleCreateSobrecupo} className="create-form">
            <h3>Nuevo Sobrecupo</h3>
            
            <div className="form-row">
              <div className="input-group">
                <label>Clínica</label>
                <select
                  value={newSobrecupo.clinicaId}
                  onChange={handleClinicaSelect}
                >
                  <option value="">Seleccionar clínica...</option>
                  {clinicas.map(clinica => (
                    <option key={clinica.id} value={clinica.id}>
                      {clinica.fields?.Nombre} - {clinica.fields?.Comuna}
                    </option>
                  ))}
                  <option value="custom">📝 Dirección personalizada</option>
                </select>
              </div>
            </div>

            {(newSobrecupo.clinicaId === 'custom' || !newSobrecupo.clinicaId) && (
              <div className="form-row">
                <div className="input-group">
                  <label>Nombre del lugar</label>
                  <input
                    type="text"
                    value={newSobrecupo.clinica}
                    onChange={(e) => setNewSobrecupo({...newSobrecupo, clinica: e.target.value})}
                    placeholder="Ej: Consulta particular"
                  />
                </div>
                <div className="input-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={newSobrecupo.direccion}
                    onChange={(e) => setNewSobrecupo({...newSobrecupo, direccion: e.target.value})}
                    placeholder="Ej: Av. Las Condes 123"
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="input-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={newSobrecupo.fecha}
                  onChange={(e) => setNewSobrecupo({...newSobrecupo, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="input-group">
                <label>Hora</label>
                <select
                  value={newSobrecupo.hora}
                  onChange={(e) => setNewSobrecupo({...newSobrecupo, hora: e.target.value})}
                  required
                >
                  <option value="">Seleccionar hora...</option>
                  {horarios.map(hora => (
                    <option key={hora} value={hora}>{hora}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              💾 Crear Sobrecupo
            </button>
          </form>
        </div>
      )}

      <div className="sobrecupos-list">
        {sobrecupos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Sin sobrecupos</h3>
            <p>Crea tu primer sobrecupo para comenzar</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="empty-action"
            >
              + Crear Sobrecupo
            </button>
          </div>
        ) : (
          <div className="sobrecupos-grid">
            {sobrecupos.map((sobrecupo, index) => (
              <div key={index} className="sobrecupo-card">
                <div className="card-header">
                  <div className={`status-badge ${sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? 'available' : 'reserved'}`}>
                    {sobrecupo.fields?.Disponible === 'Si' || sobrecupo.fields?.Disponible === true ? '✅ Disponible' : '🗓️ Reservado'}
                  </div>
                  <button 
                    onClick={() => deleteSobrecupo(sobrecupo.id)}
                    className="delete-btn"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="card-content">
                  <div className="sobrecupo-datetime">
                    📅 {formatDate(sobrecupo.fields?.Fecha)} • 🕐 {sobrecupo.fields?.Hora}
                  </div>
                  <div className="sobrecupo-location">
                    📍 {sobrecupo.fields?.Clínica}
                  </div>
                  <div className="sobrecupo-address">
                    {sobrecupo.fields?.Dirección}
                  </div>
                  {sobrecupo.fields?.Nombre && (
                    <div className="sobrecupo-patient">
                      👤 Paciente: {sobrecupo.fields.Nombre}
                      {sobrecupo.fields?.Email && (
                        <div className="patient-contact">
                          📧 {sobrecupo.fields.Email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sobrecupos-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .sobrecupos-header {
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

        .back-btn, .create-btn {
          background: #007aff;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .create-btn {
          background: linear-gradient(135deg, #34c759, #30a14e);
        }

        .back-btn:hover, .create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .sobrecupos-header h1 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          flex: 1;
          text-align: center;
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

        .create-form-container {
          margin: 16px;
          background: white;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .create-form h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        @media (min-width: 768px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .input-group input,
        .input-group select {
          padding: 12px 14px;
          border: 1.5px solid #e5e5e7;
          border-radius: 10px;
          font-size: 15px;
          background: white;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: #34c759;
          box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.1);
        }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
        }

        .sobrecupos-list {
          padding: 16px;
        }

        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0 0 24px;
        }

        .empty-action {
          background: linear-gradient(135deg, #34c759, #30a14e);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .empty-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
        }

        .sobrecupos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .sobrecupos-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }

        .sobrecupo-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px 8px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.available {
          background: #e6ffed;
          color: #006400;
        }

        .status-badge.reserved {
          background: #fff3cd;
          color: #856404;
        }

        .delete-btn {
          background: #ff3b30;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: #d70015;
          transform: scale(1.05);
        }

        .card-content {
          padding: 8px 16px 16px;
        }

        .sobrecupo-datetime {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .sobrecupo-location {
          font-size: 13px;
          color: #007aff;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .sobrecupo-address {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .sobrecupo-patient {
          font-size: 12px;
          color: #34c759;
          font-weight: 600;
          padding: 8px;
          background: #e6ffed;
          border-radius: 6px;
        }

        .patient-contact {
          font-size: 11px;
          color: #2d5a2d;
          margin-top: 4px;
          font-weight: 400;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .sobrecupos-header {
            padding: 10px 12px;
          }
          
          .sobrecupos-header h1 {
            font-size: 15px;
          }
          
          .create-form-container {
            margin: 12px;
            padding: 12px;
          }
          
          .sobrecupos-list {
            padding: 12px;
          }
          
          .form-input, .form-select {
            font-size: 16px;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .form-input, .form-select {
            -webkit-appearance: none;
            -webkit-border-radius: 10px;
          }
          
          .submit-btn, .empty-action {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
      `}</style>
    </div>
  );
}