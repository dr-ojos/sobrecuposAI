'use client';
import { useState } from 'react';

export default function DemoCalendar() {
  const [sobrecupos, setSobrecupos] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalData, setModalData] = useState({
    clinica: '',
    direccion: ''
  });

  // Generar semana actual
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM a 7 PM

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getSlotKey = (date, hour) => {
    return `${formatDate(date)}-${hour}`;
  };

  const handleSlotClick = (date, hour) => {
    const slotKey = getSlotKey(date, hour);
    
    if (sobrecupos[slotKey]) {
      // Si ya existe, alternar estado reservado/disponible
      setSobrecupos(prev => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          estado: prev[slotKey].estado === 'disponible' ? 'reservado' : 'disponible'
        }
      }));
    } else {
      // Crear nuevo sobrecupo
      setSelectedSlot({ date, hour, slotKey });
      setShowModal(true);
    }
  };

  const handleCreateSobrecupo = () => {
    if (!selectedSlot) return;

    const newSobrecupo = {
      fecha: formatDate(selectedSlot.date),
      hora: formatTime(selectedSlot.hour),
      clinica: modalData.clinica || 'Consulta particular',
      direccion: modalData.direccion || 'Por definir',
      estado: 'disponible'
    };

    setSobrecupos(prev => ({
      ...prev,
      [selectedSlot.slotKey]: newSobrecupo
    }));

    setShowModal(false);
    setSelectedSlot(null);
    setModalData({ clinica: '', direccion: '' });
  };

  const getSobrecupoCount = () => {
    const disponibles = Object.values(sobrecupos).filter(s => s.estado === 'disponible').length;
    const reservados = Object.values(sobrecupos).filter(s => s.estado === 'reservado').length;
    return { disponibles, reservados, total: disponibles + reservados };
  };

  const stats = getSobrecupoCount();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>📅 Calendario de Sobrecupos</h1>
        <p>Haz clic en cualquier hora para crear un sobrecupo</p>
        
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number orange">{stats.disponibles}</span>
            <span className="stat-label">Disponibles</span>
          </div>
          <div className="stat-item">
            <span className="stat-number green">{stats.reservados}</span>
            <span className="stat-label">Reservados</span>
          </div>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Disponible</span>
          </div>
          <div className="legend-item">
            <div className="legend-color reserved"></div>
            <span>Reservado</span>
          </div>
          <div className="legend-item">
            <div className="legend-color empty"></div>
            <span>Sin sobrecupo</span>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Header con días */}
        <div className="time-column"></div>
        {weekDays.map((day, index) => (
          <div key={day.toISOString()} className="day-header">
            <div className="day-name">{dayNames[index]}</div>
            <div className="day-number">{day.getDate()}</div>
            <div className="day-month">
              {day.toLocaleDateString('es', { month: 'short' })}
            </div>
          </div>
        ))}

        {/* Grid de horas */}
        {hours.map(hour => (
          <div key={hour} className="hour-row">
            <div className="time-label">
              {formatTime(hour)}
            </div>
            {weekDays.map(day => {
              const slotKey = getSlotKey(day, hour);
              const sobrecupo = sobrecupos[slotKey];
              
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={`time-slot ${sobrecupo ? sobrecupo.estado : 'empty'}`}
                  onClick={() => handleSlotClick(day, hour)}
                >
                  {sobrecupo && (
                    <div className="sobrecupo-info">
                      <div className="sobrecupo-time">{sobrecupo.hora}</div>
                      <div className="sobrecupo-clinic">{sobrecupo.clinica}</div>
                      {sobrecupo.estado === 'reservado' && (
                        <div className="sobrecupo-status">✓ Reservado</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal para crear sobrecupo */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Sobrecupo</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="selected-time">
                <strong>
                  {selectedSlot && `${dayNames[selectedSlot.date.getDay() - 1]} ${selectedSlot.date.getDate()}, ${formatTime(selectedSlot.hour)}`}
                </strong>
              </div>
              
              <div className="form-field">
                <label>Clínica</label>
                <input
                  type="text"
                  value={modalData.clinica}
                  onChange={(e) => setModalData(prev => ({ ...prev, clinica: e.target.value }))}
                  placeholder="Nombre de la clínica"
                  className="modal-input"
                />
              </div>

              <div className="form-field">
                <label>Dirección</label>
                <input
                  type="text"
                  value={modalData.direccion}
                  onChange={(e) => setModalData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección de la clínica"
                  className="modal-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleCreateSobrecupo} className="btn-primary">
                Crear Sobrecupo
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-header {
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }

        .calendar-header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .calendar-header p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin: 0 0 2rem 0;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-number.orange {
          color: #ff9500;
        }

        .stat-number.green {
          color: #10b981;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .legend-color.available {
          background: #ff9500;
        }

        .legend-color.reserved {
          background: #10b981;
        }

        .legend-color.empty {
          background: rgba(255, 255, 255, 0.2);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: 80px repeat(7, 1fr);
          gap: 1px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          max-width: 1200px;
          margin: 0 auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .time-column {
          background: rgba(255, 255, 255, 0.95);
        }

        .day-header {
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .day-name {
          font-weight: 700;
          color: #374151;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .day-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.125rem;
        }

        .day-month {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hour-row {
          display: contents;
        }

        .time-label {
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem 0.5rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .time-slot {
          background: rgba(255, 255, 255, 0.95);
          min-height: 60px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .time-slot:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.02);
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .time-slot.disponible {
          background: #ff9500;
          color: white;
        }

        .time-slot.disponible:hover {
          background: #ff8800;
        }

        .time-slot.reservado {
          background: #10b981;
          color: white;
        }

        .time-slot.reservado:hover {
          background: #059669;
        }

        .sobrecupo-info {
          text-align: center;
          padding: 0.5rem;
          width: 100%;
        }

        .sobrecupo-time {
          font-weight: 700;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .sobrecupo-clinic {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .sobrecupo-status {
          font-size: 0.6875rem;
          font-weight: 600;
          opacity: 0.8;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          margin: 1rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .selected-time {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #0c4a6e;
        }

        .form-field {
          margin-bottom: 1rem;
        }

        .form-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .modal-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .modal-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary, .btn-primary {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .calendar-container {
            padding: 1rem;
          }

          .calendar-grid {
            grid-template-columns: 60px repeat(7, 1fr);
            font-size: 0.875rem;
          }

          .time-slot {
            min-height: 50px;
          }

          .stats-bar {
            gap: 1rem;
          }

          .legend {
            gap: 1rem;
          }

          .day-header {
            padding: 0.75rem 0.5rem;
          }

          .day-number {
            font-size: 1.25rem;
          }

          .sobrecupo-info {
            padding: 0.25rem;
          }

          .sobrecupo-time {
            font-size: 0.75rem;
          }

          .sobrecupo-clinic {
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </div>
  );
}