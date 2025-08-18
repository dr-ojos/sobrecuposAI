// app/medico/clinicas/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clinica } from '../../../types/clinica';
import { Doctor, DoctorFields, UpdateDoctorRequest } from '../../../types/doctor';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  user: {
    id: string;
    doctorId?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface ApiResponse {
  fields?: DoctorFields;
  success?: boolean;
  error?: string;
  message?: string;
}

export default function ClinicasMedico(): React.JSX.Element {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [doctorClinicas, setDoctorClinicas] = useState<Clinica[]>([]);
  const [allClinicas, setAllClinicas] = useState<Clinica[]>([]);
  const [message, setMessage] = useState<string>('');
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      fetchDoctorData();
      fetchAllClinicas();
    }
  }, [session, status, router]);

  const fetchDoctorData = async (): Promise<void> => {
    if (!session?.user?.doctorId) return;

    try {
      const res = await fetch(`/api/doctors/${session.user.doctorId}`);
      if (res.ok) {
        const data: Doctor = await res.json();
        setDoctorData(data);
        
        if (data.fields?.Clinicas) {
          fetchDoctorClinicas(data.fields.Clinicas);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del médico:', error);
      setLoading(false);
    }
  };

  const fetchDoctorClinicas = async (clinicaIds: string[]): Promise<void> => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const todasClinicas: Clinica[] = await res.json();
        const clinicasDelMedico = todasClinicas.filter(c => 
          clinicaIds.includes(c.id)
        );
        setDoctorClinicas(clinicasDelMedico);
      }
    } catch (error) {
      console.error('Error cargando clínicas del médico:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClinicas = async (): Promise<void> => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const data: Clinica[] = await res.json();
        setAllClinicas(data);
      }
    } catch (error) {
      console.error('Error cargando todas las clínicas:', error);
    }
  };

  const addClinicaToDoctor = async (clinicaId: string): Promise<void> => {
    if (!session?.user?.doctorId) return;

    try {
      const currentClinicas = doctorData?.fields?.Clinicas || [];
      if (currentClinicas.includes(clinicaId)) {
        setMessage('❌ Esta clínica ya está agregada');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const updatedClinicas = [...currentClinicas, clinicaId];
      
      const updateData: UpdateDoctorRequest = {
        id: session.user.doctorId,
        Clinicas: updatedClinicas
      };

      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setMessage('✅ Clínica agregada correctamente');
        fetchDoctorData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error agregando clínica');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const removeClinicaFromDoctor = async (clinicaId: string): Promise<void> => {
    if (!confirm('¿Estás seguro de eliminar esta clínica de tu perfil?')) return;
    if (!session?.user?.doctorId) return;

    try {
      const currentClinicas = doctorData?.fields?.Clinicas || [];
      const updatedClinicas = currentClinicas.filter(id => id !== clinicaId);
      
      const updateData: UpdateDoctorRequest = {
        id: session.user.doctorId,
        Clinicas: updatedClinicas
      };

      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setMessage('✅ Clínica eliminada de tu perfil');
        fetchDoctorData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error eliminando clínica');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }
  };

  const availableClinicas = allClinicas.filter(clinica => 
    !(doctorData?.fields?.Clinicas || []).includes(clinica.id)
  );

  if (status === 'loading' || loading) {
    return <div className="loading-screen">⏳ Cargando clínicas...</div>;
  }

  return (
    <div className="clinicas-container">
      <div className="clinicas-header">
        <button onClick={() => router.back()} className="back-btn">← Volver</button>
        <div className="logo-header">
          <svg width="120" height="50" viewBox="0 0 1000 413" className="logo-svg">
            <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
              {/* Corazón en rojo */}
              <path d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z" fill="#dc2626"/>
              {/* Texto en negro */}
              <path d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z" fill="#171717"/>
              <path d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z" fill="#171717"/>
              <path d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z" fill="#171717"/>
              <path d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z" fill="#171717"/>
              <path d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z" fill="#171717"/>
              <path d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z" fill="#171717"/>
              <path d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z" fill="#171717"/>
              <path d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z" fill="#171717"/>
              <path d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z" fill="#171717"/>
              <path d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z" fill="#171717"/>
            </g>
          </svg>
        </div>
        <div className="header-spacer"></div>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="content-container">
        <div className="section">
          <h2>🏥 Mis Clínicas ({doctorClinicas.length})</h2>
          
          {doctorClinicas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h3>Sin clínicas registradas</h3>
              <p>Agrega clínicas donde atiendes para crear sobrecupos</p>
            </div>
          ) : (
            <div className="clinicas-grid">
              {doctorClinicas.map(clinica => (
                <div key={clinica.id} className="clinica-card my-clinica">
                  <div className="card-header">
                    <div className="clinica-badge">✅ Mi Clínica</div>
                    <button 
                      onClick={() => removeClinicaFromDoctor(clinica.id)}
                      className="remove-btn"
                      title="Eliminar de mi perfil"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <span className="detail-text">{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <span className="detail-icon">📞</span>
                          <span className="detail-text">{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>➕ Agregar Clínicas ({availableClinicas.length} disponibles)</h2>
          
          {availableClinicas.length === 0 ? (
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              <span>Ya tienes todas las clínicas disponibles agregadas</span>
            </div>
          ) : (
            <div className="clinicas-grid">
              {availableClinicas.map(clinica => (
                <div key={clinica.id} className="clinica-card available-clinica">
                  <div className="card-header">
                    <div className="clinica-badge available">Disponible</div>
                    <button 
                      onClick={() => addClinicaToDoctor(clinica.id)}
                      className="add-btn"
                      title="Agregar a mi perfil"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="clinica-name">{clinica.fields?.Nombre}</h3>
                    <div className="clinica-details">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{clinica.fields?.Direccion}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <span className="detail-text">{clinica.fields?.Comuna}</span>
                      </div>
                      {clinica.fields?.Telefono && (
                        <div className="detail-item">
                          <span className="detail-icon">📞</span>
                          <span className="detail-text">{clinica.fields.Telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .clinicas-container {
          min-height: 100vh;
          background: linear-gradient(180deg, 
            #fafafa 0%, 
            #f5f5f5 50%,
            #e5e5e5 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #171717;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .clinicas-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e5e5;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-btn {
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #171717;
          font-size: 0.875rem;
          font-weight: 400;
          text-decoration: none;
        }

        .back-btn:hover {
          border-color: #d4d4d4;
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .logo-header {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-svg {
          transition: opacity 0.2s ease;
        }

        .logo-svg:hover {
          opacity: 0.8;
        }

        .header-spacer {
          width: 64px;
        }

        .message {
          margin: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 400;
          text-align: center;
          border: 1px solid transparent;
        }

        .message.success {
          background: #f0f9ff;
          color: #0369a1;
          border-color: #bae6fd;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section {
          background: none;
        }

        .section h2 {
          font-size: 1.25rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 1rem;
          letter-spacing: -0.25px;
        }

        .empty-state {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .empty-state:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-state h3 {
          font-size: 1.125rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 0.5rem;
          letter-spacing: -0.25px;
        }

        .empty-state p {
          color: #666;
          margin: 0;
          font-weight: 400;
          font-size: 0.875rem;
        }

        .info-message {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-weight: 400;
        }

        .info-icon {
          font-size: 1.125rem;
        }

        .clinicas-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .clinicas-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .clinicas-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .clinica-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .clinica-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .clinica-card.my-clinica {
          border-left: 3px solid #16a34a;
        }

        .clinica-card.available-clinica {
          border-left: 3px solid #2563eb;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem 0.75rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .clinica-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .clinica-badge:not(.available) {
          background: #dcfce7;
          color: #166534;
        }

        .clinica-badge.available {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .remove-btn, .add-btn {
          border: 1px solid;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          background: white;
        }

        .remove-btn {
          color: #dc2626;
          border-color: #fecaca;
        }

        .add-btn {
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .remove-btn:hover {
          background: #fef2f2;
          border-color: #f87171;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
        }

        .add-btn:hover {
          background: #eff6ff;
          border-color: #60a5fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
        }

        .card-content {
          padding: 0.75rem 1.5rem 1.5rem;
        }

        .clinica-name {
          font-size: 1.125rem;
          font-weight: 500;
          color: #171717;
          margin: 0 0 1rem;
          letter-spacing: -0.25px;
          line-height: 1.3;
        }

        .clinica-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .detail-icon {
          font-size: 0.875rem;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .detail-text {
          font-size: 0.875rem;
          color: #666;
          line-height: 1.4;
          font-weight: 400;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          color: #666;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .clinicas-header {
            padding: 1rem;
          }
          
          .logo-svg {
            width: 100px;
            height: 42px;
          }
          
          .content-container {
            padding: 1rem;
            gap: 1.5rem;
          }
          
          .section h2 {
            font-size: 1.125rem;
          }

          .clinicas-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .content-container {
            padding: 0.75rem;
            gap: 1.25rem;
          }
          
          .section h2 {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }
          
          .clinicas-grid {
            gap: 0.75rem;
          }
          
          .card-header {
            padding: 0.75rem 1rem 0.5rem;
          }
          
          .card-content {
            padding: 0.5rem 1rem 1rem;
          }
          
          .clinica-name {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }
          
          .detail-text {
            font-size: 0.8125rem;
          }
          
          .clinica-badge {
            font-size: 0.6875rem;
            padding: 0.1875rem 0.5rem;
          }
          
          .remove-btn, .add-btn {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .back-btn {
            font-size: 0.8125rem;
            padding: 0.375rem 0.5rem;
          }

          .logo-svg {
            width: 80px;
            height: 34px;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .remove-btn, .add-btn {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
      `}</style>
    </div>
  );
}