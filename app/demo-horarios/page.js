'use client';
import { useState } from 'react';

export default function DemoHorarios() {
  const [selectedHoras, setSelectedHoras] = useState([]);
  const [showAccordion, setShowAccordion] = useState(false);

  const horarios = [
    "08:00", "09:00", "10:00", "11:00", 
    "12:00", "13:00", "14:00", "15:00", 
    "16:00", "17:00", "18:00", "19:00"
  ];

  const toggleHora = (hora) => {
    setSelectedHoras(prev => 
      prev.includes(hora) 
        ? prev.filter(h => h !== hora)
        : [...prev, hora]
    );
  };

  const selectAllHoras = () => {
    setSelectedHoras(horarios);
  };

  const clearAllHoras = () => {
    setSelectedHoras([]);
  };

  const getDisplayText = () => {
    if (selectedHoras.length === 0) return "Seleccionar horarios";
    if (selectedHoras.length === 1) return selectedHoras[0];
    if (selectedHoras.length === horarios.length) return "Todos los horarios";
    return `${selectedHoras.length} horarios seleccionados`;
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>🕐 Demo Selector de Horarios</h1>
        <p>Acordeón elegante de 4 columnas para selección múltiple</p>
      </div>

      <div className="demo-form">
        <div className="form-section">
          <h2>Crear Sobrecupos</h2>
          
          <div className="form-field">
            <label className="field-label">Fecha *</label>
            <input
              type="date"
              className="field-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-field">
            <label className="field-label">Clínica</label>
            <input
              type="text"
              className="field-input"
              placeholder="Nombre de la clínica"
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              Horarios * ({selectedHoras.length} seleccionado{selectedHoras.length !== 1 ? 's' : ''})
            </label>
            
            {/* Selector Principal */}
            <div 
              className="horario-selector"
              onClick={() => setShowAccordion(!showAccordion)}
            >
              <span className="selector-text">{getDisplayText()}</span>
              <svg 
                className={`selector-arrow ${showAccordion ? 'open' : ''}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Pills de Selección */}
            {selectedHoras.length > 0 && (
              <div className="selected-pills">
                {selectedHoras.map(hora => (
                  <span key={hora} className="time-pill">
                    {hora}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHora(hora);
                      }}
                      className="pill-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Acordeón Elegante */}
            <div className={`accordion-container ${showAccordion ? 'open' : ''}`}>
              <div className="accordion-header">
                <h3>Selecciona los horarios disponibles</h3>
                <div className="accordion-actions">
                  <button onClick={selectAllHoras} className="action-btn primary">
                    Todos
                  </button>
                  <button onClick={clearAllHoras} className="action-btn secondary">
                    Limpiar
                  </button>
                </div>
              </div>
              
              <div className="horarios-grid">
                {horarios.map(hora => (
                  <div
                    key={hora}
                    className={`horario-card ${selectedHoras.includes(hora) ? 'selected' : ''}`}
                    onClick={() => toggleHora(hora)}
                  >
                    <div className="horario-time">{hora}</div>
                    <div className="horario-check">
                      {selectedHoras.includes(hora) && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="submit-btn" disabled={selectedHoras.length === 0}>
            Crear {selectedHoras.length || 0} Sobrecupo{selectedHoras.length !== 1 ? 's' : ''}
          </button>
        </div>

        <div className="demo-info">
          <h3>🎨 Características del Diseño:</h3>
          <ul>
            <li>✨ Acordeón suave con animación</li>
            <li>📱 Grid de 4 columnas responsivo</li>
            <li>🎯 Cards elegantes con hover effects</li>
            <li>💊 Pills para mostrar selección</li>
            <li>⚡ Botones de acción rápida</li>
            <li>🎪 Micro-animaciones profesionales</li>
          </ul>
          
          <div className="demo-stats">
            <strong>Horarios seleccionados: {selectedHoras.length}</strong>
            <br />
            <small>{selectedHoras.join(', ') || 'Ninguno'}</small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .demo-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .demo-header {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .demo-header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .demo-header p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin: 0;
        }

        .demo-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-section {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .form-section h2 {
          margin: 0 0 2rem 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .form-field {
          margin-bottom: 1.5rem;
        }

        .field-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .field-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* Selector Principal */
        .horario-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .horario-selector:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .selector-text {
          color: #374151;
          font-weight: 500;
        }

        .selector-arrow {
          color: #9ca3af;
          transition: transform 0.3s ease;
        }

        .selector-arrow.open {
          transform: rotate(180deg);
        }

        /* Pills */
        .selected-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .time-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .pill-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
          padding: 0;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .pill-remove:hover {
          opacity: 1;
        }

        /* Acordeón */
        .accordion-container {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, opacity 0.3s ease;
          opacity: 0;
          border-radius: 12px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
        }

        .accordion-container.open {
          max-height: 400px;
          opacity: 1;
        }

        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        }

        .accordion-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .accordion-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .action-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .action-btn.secondary {
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
        }

        .action-btn.secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        /* Grid de Horarios */
        .horarios-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 1.5rem;
        }

        .horario-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 80px;
          position: relative;
        }

        .horario-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }

        .horario-card.selected {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: #667eea;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .horario-time {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .horario-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Botón Submit */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Panel Info */
        .demo-info {
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 16px;
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .demo-info h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .demo-info ul {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }

        .demo-info li {
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }

        .demo-stats {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .demo-form {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .horarios-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            padding: 1rem;
          }

          .horario-card {
            min-height: 70px;
            padding: 0.75rem;
          }

          .accordion-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .action-btn {
            padding: 0.75rem;
          }

          .demo-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}