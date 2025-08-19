'use client';
import { useState } from 'react';

export default function DemoSobrecupos() {
  const [activeFilter, setActiveFilter] = useState('reservados');

  // Datos de prueba simulando sobrecupos reservados
  const sobrecuposDemo = [
    {
      id: 'demo1',
      fields: {
        Fecha: '2024-08-20',
        Hora: '09:00',
        Clínica: 'Clínica Las Condes',
        Dirección: 'Lo Fontecilla 441, Las Condes',
        Disponible: 'No',
        Especialidad: 'Cardiología',
        // Datos del paciente que reservó
        Nombre: 'María González Pérez',
        Edad: 45,
        Email: 'maria.gonzalez@email.com',
        Telefono: '+56912345678',
        'Motivo de consulta': 'Control rutinario de presión arterial y dolor en el pecho ocasional'
      }
    },
    {
      id: 'demo2',
      fields: {
        Fecha: '2024-08-21',
        Hora: '14:30',
        Clínica: 'Clínica Alemana',
        Dirección: 'Av. Vitacura 5951, Vitacura',
        Disponible: 'No',
        Especialidad: 'Dermatología',
        // Datos del paciente que reservó
        Nombre: 'Carlos Rodríguez Silva',
        Edad: 32,
        Email: 'carlos.rodriguez@gmail.com',
        Telefono: '+56987654321',
        'Motivo de consulta': 'Revisión de lunar sospechoso en el brazo derecho'
      }
    },
    {
      id: 'demo3',
      fields: {
        Fecha: '2024-08-22',
        Hora: '11:15',
        Clínica: 'Hospital UC Christus',
        Dirección: 'Diagonal Paraguay 362, Santiago',
        Disponible: 'No',
        Especialidad: 'Gastroenterología',
        // Datos del paciente que reservó
        Nombre: 'Ana López Martínez',
        Edad: 28,
        Email: 'ana.lopez@hotmail.com',
        Telefono: '+56956789012',
        'Motivo de consulta': 'Molestias estomacales frecuentes y acidez después de las comidas'
      }
    }
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeFromNow = (dateStr, timeStr) => {
    const now = new Date();
    const appointmentDate = new Date(`${dateStr}T${timeStr}`);
    const diffMs = appointmentDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays < 7) return `En ${diffDays} días`;
    return `${Math.ceil(diffDays / 7)} semanas`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-text">
              <h1 className="header-title">Demo - Sobrecupos Reservados</h1>
              <span className="header-subtitle">Vista previa con datos de ejemplo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="main-title">Vista de sobrecupos con datos del paciente</h2>
            <p className="main-subtitle">Así es como aparecen ahora los datos del paciente y motivo de consulta</p>
          </div>
        </section>

        {/* Lista de sobrecupos de prueba */}
        <section className="results-section">
          <div className="results-grid">
            {sobrecuposDemo.map((sobrecupo, index) => (
              <article key={sobrecupo.id} className="sobrecupo-card">
                
                {/* Card Header */}
                <div className="card-header">
                  <div className="status-info">
                    <div className="status-badge reserved">
                      Reservado
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="card-body">
                  <div className="datetime-info">
                    <div className="date-block">
                      <span className="day">{new Date(sobrecupo.fields?.Fecha).getDate()}</span>
                      <span className="month">
                        {new Date(sobrecupo.fields?.Fecha).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="time-details">
                      <div className="time">{sobrecupo.fields?.Hora}</div>
                      <div className="relative-time">
                        {getTimeFromNow(sobrecupo.fields?.Fecha, sobrecupo.fields?.Hora)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="location-info">
                    <div className="clinic-name">{sobrecupo.fields?.Clínica}</div>
                    <div className="clinic-address">{sobrecupo.fields?.Dirección}</div>
                  </div>
                  
                  {/* NUEVA SECCIÓN: Datos del paciente */}
                  {sobrecupo.fields?.Nombre && (
                    <div className="patient-info">
                      <div className="patient-avatar">
                        <span>{sobrecupo.fields.Nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div className="patient-details">
                        <div className="patient-header">
                          <div className="patient-name">{sobrecupo.fields.Nombre}</div>
                          {sobrecupo.fields?.Edad && (
                            <div className="patient-age">{sobrecupo.fields.Edad} años</div>
                          )}
                        </div>
                        
                        {/* NUEVO: Motivo de consulta destacado */}
                        {sobrecupo.fields?.['Motivo de consulta'] && (
                          <div className="patient-reason">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M9 11H3a1 1 0 00-1 1v3c0 1.66 1.34 3 3 3h1m4-6h7a1 1 0 011 1v3c0 1.66-1.34 3-3 3h-1m-4-6V7c0-1.66 1.34-3-3-3s3 1.34 3 3v4m-8 0V7c0-1.66-1.34-3-3-3S5 5.34 5 7v4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>{sobrecupo.fields['Motivo de consulta']}</span>
                          </div>
                        )}

                        <div className="patient-contacts">
                          {sobrecupo.fields?.Email && (
                            <div className="patient-contact">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              {sobrecupo.fields.Email}
                            </div>
                          )}
                          {sobrecupo.fields?.Telefono && (
                            <div className="patient-contact">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              {sobrecupo.fields.Telefono}
                            </div>
                          )}
                        </div>
                        <div className="confirmed-badge">Confirmado</div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
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

        /* Results Section */
        .results-section {
          min-height: 400px;
        }

        /* Results Grid */
        .results-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
          place-items: center;
        }

        .results-grid > * {
          width: 100%;
          max-width: 600px;
        }

        /* Sobrecupo Card */
        .sobrecupo-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .sobrecupo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .status-info {
          flex: 1;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .status-badge.reserved {
          background: #fff8f0;
          color: #ea580c;
          border-color: rgba(255, 149, 0, 0.1);
        }

        .card-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .datetime-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #171717;
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 48px;
          flex-shrink: 0;
          color: white;
        }

        .day {
          font-size: 1.25rem;
          font-weight: 200;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .month {
          font-size: 0.625rem;
          font-weight: 400;
          margin-top: 0.25rem;
          opacity: 0.8;
          letter-spacing: 1px;
        }

        .time-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .time {
          font-size: 1.125rem;
          font-weight: 300;
          color: #171717;
          line-height: 1.2;
          letter-spacing: -0.25px;
        }

        .relative-time {
          font-size: 0.75rem;
          color: #666;
          font-weight: 400;
          margin-top: 0.25rem;
        }

        .location-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .clinic-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
        }

        .clinic-address {
          font-size: 0.8rem;
          color: #666;
        }

        /* NUEVA SECCIÓN: Info del paciente */
        .patient-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.625rem;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .patient-details {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
          min-width: 0;
        }

        .patient-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .patient-name {
          font-size: 0.875rem;
          color: #171717;
          font-weight: 500;
        }

        .patient-age {
          font-size: 0.75rem;
          color: #666;
          background: #f0f4ff;
          padding: 0.125rem 0.375rem;
          border-radius: 6px;
          font-weight: 500;
        }

        /* DESTACADO: Motivo de consulta */
        .patient-reason {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #171717;
          background: #fef9e7;
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(251, 191, 36, 0.2);
          line-height: 1.3;
        }

        .patient-reason svg {
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .patient-reason span {
          flex: 1;
          font-weight: 500;
        }

        .patient-contacts {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .patient-contact {
          font-size: 0.6875rem;
          color: #666;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .patient-contact svg {
          color: #999;
          flex-shrink: 0;
        }

        .confirmed-badge {
          background: #f0fff4;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 500;
          border: 1px solid rgba(52, 199, 89, 0.1);
          width: fit-content;
        }

        /* Responsive - Mobile First */
        @media (max-width: 768px) {
          .header {
            padding: 0.75rem 1rem;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .header-subtitle {
            font-size: 0.875rem;
          }

          .main-content {
            padding: 1rem;
            gap: 2rem;
          }

          .main-title {
            font-size: 1.75rem;
          }

          .main-subtitle {
            font-size: 1rem;
          }

          .results-grid {
            gap: 1rem;
          }

          .sobrecupo-card {
            border-radius: 12px;
          }

          .card-header {
            padding: 0.75rem;
          }

          .card-body {
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .datetime-info {
            gap: 0.75rem;
          }

          .date-block {
            min-width: 40px;
            padding: 0.5rem;
          }

          .day {
            font-size: 1rem;
          }

          .month {
            font-size: 0.5rem;
          }

          .time {
            font-size: 1rem;
          }

          .relative-time {
            font-size: 0.6875rem;
          }

          .clinic-name {
            font-size: 0.8125rem;
          }

          .clinic-address {
            font-size: 0.75rem;
          }

          .patient-info {
            padding: 0.5rem;
            gap: 0.5rem;
          }

          .patient-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.6875rem;
          }

          .patient-name {
            font-size: 0.8125rem;
          }

          .patient-age {
            font-size: 0.6875rem;
            padding: 0.125rem 0.25rem;
          }

          .patient-reason {
            font-size: 0.6875rem;
            padding: 0.25rem 0.375rem;
            line-height: 1.4;
          }

          .patient-reason svg {
            width: 10px;
            height: 10px;
          }

          .patient-contact {
            font-size: 0.625rem;
            gap: 0.25rem;
          }

          .patient-contact svg {
            width: 8px;
            height: 8px;
          }

          .confirmed-badge {
            font-size: 0.5625rem;
            padding: 0.125rem 0.375rem;
          }

          .status-badge {
            font-size: 0.6875rem;
            padding: 0.25rem 0.5rem;
          }
        }

        /* iPhone SE y pantallas muy pequeñas */
        @media (max-width: 375px) {
          .header {
            padding: 0.5rem;
          }

          .header-title {
            font-size: 1.125rem;
          }

          .header-subtitle {
            font-size: 0.75rem;
          }

          .main-content {
            padding: 0.75rem;
          }

          .main-title {
            font-size: 1.5rem;
          }

          .main-subtitle {
            font-size: 0.875rem;
          }

          .card-header,
          .card-body {
            padding: 0.625rem;
          }

          .date-block {
            min-width: 36px;
            padding: 0.375rem;
          }

          .day {
            font-size: 0.875rem;
          }

          .time {
            font-size: 0.875rem;
          }

          .patient-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.625rem;
          }

          .patient-info {
            padding: 0.375rem;
          }

          .patient-name {
            font-size: 0.75rem;
          }

          .clinic-name {
            font-size: 0.75rem;
          }

          .clinic-address {
            font-size: 0.6875rem;
          }
        }

        /* Tablet y Desktop */
        @media (min-width: 768px) {
          .main-title {
            font-size: 3rem;
          }

          .main-subtitle {
            font-size: 1.2rem;
          }

          .results-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
          }
        }

        @media (min-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2.5rem;
            max-width: 1200px;
          }
        }

        /* Safe area para iPhones con notch */
        @supports (padding: max(0px)) {
          .page-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }

        /* Estados de foco para móvil */
        @media (max-width: 768px) {
          .sobrecupo-card:hover {
            transform: none;
          }

          .sobrecupo-card:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
        }
      `}</style>
    </div>
  );
}