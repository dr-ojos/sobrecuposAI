'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoAreasInteres() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('test');

  // Datos de ejemplo de médicos con áreas de interés
  const medicosEjemplo = [
    {
      id: 'demo1',
      name: 'Dr. Ana García',
      especialidad: 'Oftalmología',
      areasInteres: ['Cirugía refractiva Laser', 'Córnea', 'Cataratas'],
      atiende: 'Adultos',
      seguros: ['Fonasa', 'Isapres']
    },
    {
      id: 'demo2', 
      name: 'Dr. Carlos López',
      especialidad: 'Dermatología',
      areasInteres: ['Acné', 'Estética', 'Láser Dermatológico'],
      atiende: 'Ambos',
      seguros: ['Isapres', 'Particular']
    },
    {
      id: 'demo3',
      name: 'Dra. María Silva',
      especialidad: 'Pediatría',
      areasInteres: ['Vacunación Infantil', 'Crecimiento y Desarrollo', 'Alergias Pediátricas'],
      atiende: 'Niños',
      seguros: ['Fonasa', 'Isapres', 'Particular']
    }
  ];

  const ejemplosBusqueda = [
    {
      consulta: "Necesito un especialista en láser para la piel",
      esperado: "Dr. Carlos López (Dermatología) - Láser Dermatológico"
    },
    {
      consulta: "Quiero operarme la vista con láser",
      esperado: "Dr. Ana García (Oftalmología) - Cirugía refractiva Laser"
    },
    {
      consulta: "Mi hijo necesita vacunas",
      esperado: "Dra. María Silva (Pediatría) - Vacunación Infantil"
    },
    {
      consulta: "Tengo cataratas",
      esperado: "Dr. Ana García (Oftalmología) - Cataratas"
    }
  ];

  return (
    <div className="demo-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button onClick={() => router.back()} className="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-text">
            <h1 className="header-title">Áreas de Interés</h1>
            <span className="header-subtitle">Demo Completo</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Navegación de tabs */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            🧪 Test Funcionalidad
          </button>
          <button 
            className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            👨‍⚕️ Médicos con Áreas
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chatbot
          </button>
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Perfil Médico
          </button>
        </div>

        {/* Contenido de Test Funcionalidad */}
        {activeTab === 'test' && (
          <section className="tab-content">
            <div className="info-card">
              <h2>🧪 Test de Funcionalidad</h2>
              <p>Prueba todas las funciones de áreas de interés implementadas</p>
              
              <div className="test-grid">
                <div className="test-item">
                  <h3>1. API de Áreas</h3>
                  <p>Endpoint para obtener áreas por especialidad</p>
                  <button 
                    onClick={() => window.open('/api/areas-interes?especialidad=Oftalmología', '_blank')}
                    className="test-button"
                  >
                    Probar API
                  </button>
                </div>

                <div className="test-item">
                  <h3>2. Selector Interactivo</h3>
                  <p>Prueba el selector de áreas de interés</p>
                  <button 
                    onClick={() => router.push('/test-areas-interes')}
                    className="test-button"
                  >
                    Abrir Test
                  </button>
                </div>

                <div className="test-item">
                  <h3>3. Perfil Médico</h3>
                  <p>Editar áreas de interés en perfil</p>
                  <button 
                    onClick={() => router.push('/medico/perfil')}
                    className="test-button"
                  >
                    Ver Perfil
                  </button>
                </div>

                <div className="test-item">
                  <h3>4. Chatbot Inteligente</h3>
                  <p>Búsqueda por áreas específicas</p>
                  <button 
                    onClick={() => router.push('/chat')}
                    className="test-button"
                  >
                    Probar Chat
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contenido de Médicos */}
        {activeTab === 'doctors' && (
          <section className="tab-content">
            <div className="info-card">
              <h2>👨‍⚕️ Médicos con Áreas de Interés</h2>
              <p>Ejemplos de cómo se ven los médicos con sus especializaciones</p>
            </div>

            <div className="doctors-grid">
              {medicosEjemplo.map(medico => (
                <div key={medico.id} className="doctor-card">
                  <div className="doctor-header">
                    <div className="doctor-avatar">
                      {medico.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </div>
                    <div className="doctor-info">
                      <h3 className="doctor-name">{medico.name}</h3>
                      <p className="doctor-specialty">{medico.especialidad}</p>
                    </div>
                  </div>

                  <div className="areas-section">
                    <h4>Áreas de Interés</h4>
                    <div className="areas-grid">
                      {medico.areasInteres.map(area => (
                        <span key={area} className="area-badge">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-details">
                    <div className="detail-item">
                      <span className="detail-label">Atiende:</span>
                      <span className="detail-value">{medico.atiende}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Seguros:</span>
                      <span className="detail-value">{medico.seguros.join(', ')}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/medico-perfil/${medico.id}`)}
                    className="view-profile-btn"
                  >
                    Ver Perfil Completo
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contenido de Chatbot */}
        {activeTab === 'chat' && (
          <section className="tab-content">
            <div className="info-card">
              <h2>💬 Chatbot con Búsqueda Inteligente</h2>
              <p>El chatbot ahora puede recomendar médicos basándose en áreas específicas</p>
            </div>

            <div className="examples-container">
              <h3>Ejemplos de búsquedas inteligentes:</h3>
              <div className="examples-grid">
                {ejemplosBusqueda.map((ejemplo, index) => (
                  <div key={index} className="example-card">
                    <div className="example-query">
                      <strong>Consulta:</strong> "{ejemplo.consulta}"
                    </div>
                    <div className="example-result">
                      <strong>Resultado esperado:</strong> {ejemplo.esperado}
                    </div>
                    <button 
                      onClick={() => {
                        const encodedQuery = encodeURIComponent(ejemplo.consulta);
                        router.push(`/chat?q=${encodedQuery}`);
                      }}
                      className="try-button"
                    >
                      Probar en Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-preview">
              <h3>Mejoras implementadas:</h3>
              <ul>
                <li>✅ <strong>Búsqueda por área específica:</strong> "láser dermatológico" → encuentra dermatólogos especializados</li>
                <li>✅ <strong>Matching inteligente:</strong> Relaciona síntomas con áreas de interés relevantes</li>
                <li>✅ <strong>Recomendaciones precisas:</strong> Prioriza médicos con experiencia específica</li>
                <li>✅ <strong>Fallback inteligente:</strong> Si no encuentra especialistas, busca por especialidad general</li>
              </ul>
            </div>
          </section>
        )}

        {/* Contenido de Perfil */}
        {activeTab === 'profile' && (
          <section className="tab-content">
            <div className="info-card">
              <h2>👤 Gestión de Áreas de Interés</h2>
              <p>Los médicos pueden seleccionar sus áreas de especialización en el perfil</p>
            </div>

            <div className="profile-features">
              <div className="feature-card">
                <h3>🎯 Selector Dinámico</h3>
                <p>Las áreas cambian automáticamente según la especialidad del médico</p>
                <ul>
                  <li>23 especialidades disponibles</li>
                  <li>8-12 áreas por especialidad</li>
                  <li>Validación en tiempo real</li>
                  <li>Interfaz responsive</li>
                </ul>
              </div>

              <div className="feature-card">
                <h3>💾 Persistencia</h3>
                <p>Las áreas se guardan en Airtable y se muestran en el perfil público</p>
                <ul>
                  <li>Almacenamiento en campo AreasInteres</li>
                  <li>Validación por especialidad</li>
                  <li>API endpoints dedicados</li>
                  <li>Sincronización automática</li>
                </ul>
              </div>

              <div className="feature-card">
                <h3>🎨 Visualización</h3>
                <p>Diseño elegante estilo Apple con badges y animaciones</p>
                <ul>
                  <li>Badges con colores de marca</li>
                  <li>Hover effects suaves</li>
                  <li>Scroll para muchas áreas</li>
                  <li>Contador de seleccionadas</li>
                </ul>
              </div>
            </div>

            <div className="demo-actions">
              <button 
                onClick={() => router.push('/medico/perfil')}
                className="demo-button primary"
              >
                Probar Selector de Áreas
              </button>
              <button 
                onClick={() => router.push('/demo-clinicas')}
                className="demo-button"
              >
                Ver Demo Perfil Público
              </button>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .demo-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

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
          gap: 1rem;
          max-width: 1200px;
          margin: 0 auto;
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
          border-color: #ff9500;
          background: #fff8f0;
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
        }

        .tabs-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .tab {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab:hover {
          color: #171717;
          background: #f9fafb;
        }

        .tab.active {
          color: #ff9500;
          border-bottom-color: #ff9500;
          background: #fff8f0;
        }

        .tab-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .info-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .info-card h2 {
          margin: 0 0 0.5rem;
          color: #171717;
          font-weight: 300;
          font-size: 1.5rem;
        }

        .info-card p {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }

        .test-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }

        .test-item {
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .test-item h3 {
          margin: 0 0 0.5rem;
          color: #171717;
          font-size: 1.125rem;
          font-weight: 500;
        }

        .test-item p {
          margin: 0 0 1rem;
          color: #666;
          font-size: 0.875rem;
        }

        .test-button {
          background: #ff9500;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .test-button:hover {
          background: #ff8800;
          transform: translateY(-1px);
        }

        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .doctor-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .doctor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .doctor-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .doctor-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #171717, #333);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .doctor-name {
          margin: 0 0 0.25rem;
          color: #171717;
          font-weight: 500;
          font-size: 1.125rem;
        }

        .doctor-specialty {
          margin: 0;
          color: #ff9500;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .areas-section h4 {
          margin: 0 0 0.75rem;
          color: #171717;
          font-size: 1rem;
          font-weight: 500;
        }

        .areas-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .area-badge {
          background: linear-gradient(135deg, #fff8f0, #ffebcc);
          border: 1px solid rgba(255, 149, 0, 0.2);
          border-radius: 8px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: #ea580c;
          font-weight: 500;
        }

        .doctor-details {
          border-top: 1px solid #f5f5f5;
          padding-top: 1rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .detail-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          font-size: 0.75rem;
          color: #171717;
        }

        .view-profile-btn {
          width: 100%;
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-profile-btn:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .example-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1rem;
        }

        .example-query {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .example-result {
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #666;
        }

        .try-button {
          background: #171717;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .try-button:hover {
          background: #333;
        }

        .chat-preview {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 2rem;
        }

        .chat-preview h3 {
          margin: 0 0 1rem;
          color: #171717;
        }

        .chat-preview ul {
          margin: 0;
          padding-left: 1rem;
        }

        .chat-preview li {
          margin-bottom: 0.5rem;
          color: #666;
          line-height: 1.4;
        }

        .profile-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .feature-card h3 {
          margin: 0 0 0.5rem;
          color: #171717;
          font-size: 1.125rem;
        }

        .feature-card p {
          margin: 0 0 1rem;
          color: #666;
        }

        .feature-card ul {
          margin: 0;
          padding-left: 1rem;
        }

        .feature-card li {
          margin-bottom: 0.25rem;
          color: #666;
          font-size: 0.875rem;
        }

        .demo-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .demo-button {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-button:hover {
          border-color: #171717;
          background: #f9fafb;
        }

        .demo-button.primary {
          background: linear-gradient(135deg, #ff9500, #ff8800);
          color: white;
          border-color: #ff9500;
        }

        .demo-button.primary:hover {
          background: linear-gradient(135deg, #ff8800, #ff7700);
          transform: translateY(-1px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          .main-content {
            padding: 1rem;
          }

          .tabs-container {
            flex-wrap: wrap;
          }

          .tab {
            padding: 0.75rem 1rem;
            font-size: 0.8125rem;
          }

          .test-grid {
            grid-template-columns: 1fr;
          }

          .doctors-grid {
            grid-template-columns: 1fr;
          }

          .examples-grid {
            grid-template-columns: 1fr;
          }

          .profile-features {
            grid-template-columns: 1fr;
          }

          .demo-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}