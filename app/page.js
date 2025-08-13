'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const logoRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatExpanding, setChatExpanding] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Función para manejar el envío del chat con efecto de expansión
  const handleChatSubmit = (e) => {
    if (e) e.preventDefault();
    if (chatInput.trim() && !chatExpanding) {
      setChatExpanding(true);
      setTimeout(() => {
        router.push(`/chat?initial=${encodeURIComponent(chatInput.trim())}`);
      }, 400);
    }
  };

  // Nueva función para seleccionar sugerencias
  const selectSuggestion = (text) => {
    setChatInput(text);
    setIsTyping(true);
    setChatExpanding(true);
    setTimeout(() => {
      router.push(`/chat?initial=${encodeURIComponent(text)}`);
    }, 400);
  };

  const goToChat = () => {
    router.push('/chat');
  };

  const goToSobrecupos = () => {
    router.push('/agendar');
  };


  // Cargar especialidades disponibles
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch('/api/especialidades-disponibles');
        const data = await response.json();
        if (data.success && data.especialidades.length > 0) {
          setEspecialidades(data.especialidades);
        }
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      }
    };
    
    fetchEspecialidades();
  }, []);


  useEffect(() => {
    setTimeout(() => setIsVisible(true), 300);
    
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 5,
        y: (e.clientY / window.innerHeight - 0.5) * 5
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="homepage">
      <div className="bg-gradient" />
      
      {/* Elementos geométricos minimalistas */}
      <div className="floating-elements">
        <div className="element element-1" style={{transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`}}>
          <div className="geometric-circle"></div>
        </div>
        <div className="element element-2" style={{transform: `translate(${mousePos.x * -0.15}px, ${mousePos.y * 0.15}px)`}}>
          <div className="geometric-square"></div>
        </div>
        <div className="element element-3" style={{transform: `translate(${mousePos.x * 0.25}px, ${mousePos.y * -0.2}px)`}}>
          <div className="geometric-triangle"></div>
        </div>
      </div>

      <section className="hero-section">
        <div className="content-wrapper">
          <div 
            ref={logoRef}
            className={`logo-container ${isVisible ? 'visible' : ''}`}
          >
            <div className="logo-text">
              <span className="logo-main">Sobrecupos</span>
              <span className="logo-ai">AI</span>
            </div>
          </div>

          <div className={`tagline ${isVisible ? 'visible' : ''}`}>
            <h1>Encuentra tu Sobrecupo médico</h1>
            <p className="subtitle">
              <strong>Más tiempo sano, </strong>  menos tiempo enfermo.
            </p>
          </div>

          {/* Chat section - Minimalista */}
          <div className={`chat-container ${isVisible ? 'visible' : ''} ${chatExpanding ? 'expanding' : ''}`}>
            <div className="chat-wrapper">
              <div className="chat-section">
                <h2 className="chat-title">Cuéntanos cómo te sientes o qué especialista necesitas</h2>

                <div className={`input-hero ${chatExpanding ? 'expanding' : ''}`}>
                  <div className="input-wrapper">
                    <textarea 
                      className="chat-input" 
                      placeholder="Ej: Tengo los ojos rojos y me pican..."
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        setIsTyping(e.target.value.length > 0);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      rows="1"
                      disabled={chatExpanding}
                    />
                    <button 
                      className={`send-button ${isTyping ? 'active' : ''} ${chatExpanding ? 'expanding' : ''}`}
                      onClick={handleChatSubmit}
                      disabled={!chatInput.trim() || chatExpanding}
                    >
                      {chatExpanding ? (
                        <div className="spinner"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sugerencias minimalistas */}
                <div className="suggestions-container">
                  <div className="suggestions-label">Prueba preguntando:</div>
                  <div className="suggestions-scroll">
                    <div className="suggestion-pill" onClick={() => selectSuggestion('Veo borroso')}>
                      Veo borroso
                    </div>
                    <div className="suggestion-pill" onClick={() => selectSuggestion('Necesito control de lentes')}>
                      Necesito control de lentes
                    </div>
                    <div className="suggestion-pill" onClick={() => selectSuggestion('Me pican los ojos')}>
                      Me pican los ojos
                    </div>
                    <div className="suggestion-pill" onClick={() => selectSuggestion('Veo manchas flotantes')}>
                      Veo manchas flotantes
                    </div>
                    <div className="suggestion-pill" onClick={() => selectSuggestion('Tengo el ojo irritado')}>
                      Tengo el ojo irritado
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay de expansión */}
          {chatExpanding && (
            <div className="expansion-overlay">
              <div className="expanding-message">
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
          )}

          {/* Botón ver sobrecupos - Centrado */}
          <div className={`additional-options ${isVisible ? 'visible' : ''}`}>
            <div className="explore-button-container">
              <button 
                onClick={goToSobrecupos}
                className="explore-button"
              >
                <span>Ver Sobrecupos disponibles</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Especialidades Disponibles Mejoradas */}
          {especialidades.length > 0 && (
            <div className={`especialidades-section ${isVisible ? 'visible' : ''}`}>
              <div className="especialidades-content">
                <span className="especialidades-label">Especialidades con sobrecupos disponibles</span>
                <div className="especialidades-grid">
                  {especialidades.map((specialty, index) => (
                    <span key={specialty} className="especialidad-tag">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">Cómo funciona</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Describe</h3>
              <p>Cuéntanos tus síntomas o especialidad</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Encuentra</h3>
              <p>Mostramos citas disponibles</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Reserva</h3>
              <p>Confirma en segundos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-container">
          <h2 className="section-title">Por qué elegir Sobrecupos AI</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-number">01</div>
              <h3>Atención rápida</h3>
              <p>Accede a citas médicas cuando más lo necesitas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">02</div>
              <h3>Búsqueda inteligente</h3>
              <p>Nuestra IA encuentra el especialista perfecto según tus síntomas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">03</div>
              <h3>Ahorra tiempo</h3>
              <p>No más llamadas ni esperas, todo en segundos desde tu celular</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">04</div>
              <h3>100% confiable</h3>
              <p>Médicos verificados y sobrecupos reales confirmados al instante</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-main">Sobrecupos</span>
              <span className="logo-ai">AI</span>
            </div>
            <div className="footer-links">
              <a href="/chat">Buscar</a>
              <a href="/auth/signin">Médicos</a>
              <a href="mailto:contacto@sobrecupos.com">Contacto</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Sobrecupos AI</p>
          </div>
        </div>
      </footer>  

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          position: relative;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          overflow-x: hidden;
        }

        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, 
            #fafafa 0%, 
            #f5f5f5 50%, 
            #e5e5e5 100%);
          z-index: -2;
        }

        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: -1;
        }

        .element {
          position: absolute;
          opacity: 0.03;
          transition: transform 0.1s ease-out;
        }

        .element-1 { top: 20%; right: 15%; }
        .element-2 { bottom: 25%; left: 10%; }
        .element-3 { top: 60%; right: 25%; }

        .geometric-circle {
          width: 120px;
          height: 120px;
          border: 1px solid #999;
          border-radius: 50%;
        }

        .geometric-square {
          width: 80px;
          height: 80px;
          border: 1px solid #999;
          transform: rotate(45deg);
        }

        .geometric-triangle {
          width: 0;
          height: 0;
          border-left: 40px solid transparent;
          border-right: 40px solid transparent;
          border-bottom: 70px solid #999;
        }

        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 2rem 1rem;
        }

        .content-wrapper {
          text-align: center;
          max-width: 640px;
          width: 100%;
        }

        .logo-container {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .logo-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .logo-text {
          font-size: 4rem;
          font-weight: 200;
          letter-spacing: -2px;
          display: inline-flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .logo-main {
          color: #171717;
          font-weight: 800;
        }

        .logo-ai {
          color: #666;
          font-size: 0.7em;
          font-weight: 300;
        }

        .tagline {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;
          margin-bottom: 5rem;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tagline h1 {
          font-size: 1rem;
          font-weight: 400;
          color: #666;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }

        .subtitle {
          font-size: 2rem;
          color: #171717;
          font-weight: 300;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        /* Especialidades Disponibles Mejoradas */
        .especialidades-section {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s;
          margin-top: 3rem;
          margin-bottom: 3rem;
          text-align: center;
        }

        .especialidades-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .especialidades-content {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .especialidades-label {
          font-size: 1rem;
          color: #666;
          font-weight: 400;
          letter-spacing: 0.3px;
        }

        .especialidades-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
          max-width: 100%;
        }

        .especialidad-tag {
          background: transparent;
          border: none;
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          color: #666;
          font-weight: 400;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }


        .chat-container {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s;
          margin-bottom: 3rem;
        }

        .chat-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chat-wrapper {
          max-width: 100%;
          margin: 0 auto;
        }

        .chat-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .chat-title {
          font-size: 1rem;
          font-weight: 400;
          color: #666;
          text-align: center;
          margin-bottom: 1rem;
          line-height: 1.4;
          letter-spacing: 0.2px;
        }

        .input-hero {
          width: 100%;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .input-hero.expanding {
          transform: scale(1.02);
        }

        .input-wrapper {
          display: flex;
          align-items: flex-start;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 1rem;
          min-height: 80px;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .input-wrapper:focus-within {
          border-color: #171717;
          box-shadow: 0 0 0 1px #171717;
        }

        .chat-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 1rem;
          color: #171717;
          font-family: inherit;
          resize: none;
          min-height: 48px;
          line-height: 1.5;
          padding: 0;
          padding-right: 3rem;
          font-weight: 400;
        }

        .chat-input::placeholder {
          color: #999;
          font-weight: 400;
        }

        .chat-input:disabled {
          opacity: 0.6;
        }

        .send-button {
          width: 36px;
          height: 36px;
          background: #171717;
          border: none;
          border-radius: 18px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          opacity: 0.3;
          transform: scale(0.9);
        }

        .send-button.active {
          opacity: 1;
          transform: scale(1);
        }

        .send-button:hover.active {
          background: #000;
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .send-button.expanding .spinner {
          animation: spin 0.8s linear infinite;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid currentColor;
          border-radius: 50%;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .suggestions-container {
          width: 100%;
        }

        .suggestions-label {
          font-size: 0.875rem;
          color: #999;
          font-weight: 400;
          margin-bottom: 1rem;
          text-align: left;
        }

        .suggestions-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestions-scroll::-webkit-scrollbar {
          display: none;
        }

        .suggestion-pill {
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-size: 0.875rem;
          color: #666;
          font-weight: 400;
          white-space: nowrap;
        }

        .suggestion-pill:hover {
          background: #e5e5e5;
          border-color: #d4d4d4;
          color: #171717;
        }

        .suggestion-pill:active {
          transform: scale(0.98);
        }

        .chat-container.expanding {
          animation: expandChat 0.4s cubic-bezier(0.32, 0, 0.67, 0) forwards;
        }

        @keyframes expandChat {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(1.1) translateY(-20vh);
            opacity: 0;
          }
        }

        .expansion-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .expanding-message {
          opacity: 0;
          animation: messageAppear 0.3s ease-out 0.1s forwards;
        }

        @keyframes messageAppear {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots div {
          width: 8px;
          height: 8px;
          background: #666;
          border-radius: 50%;
          animation: loadingDot 1.4s ease-in-out infinite both;
        }

        .loading-dots div:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots div:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots div:nth-child(3) { animation-delay: 0s; }

        @keyframes loadingDot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .additional-options {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s;
        }

        .additional-options.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .explore-button-container {
          display: flex;
          justify-content: center;
        }

        .explore-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ff9500;
          border: 1px solid #ff9500;
          border-radius: 16px;
          padding: 0.75rem 1.5rem;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(255, 149, 0, 0.2);
        }

        .explore-button:hover {
          background: #e6850a;
          border-color: #e6850a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
        }

        .explore-button:active {
          transform: scale(0.98);
        }

        .benefits {
          padding: 6rem 2rem;
          background: #f9f9f9;
          border-top: 1px solid #f0f0f0;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 3rem;
        }

        .benefit-card {
          text-align: center;
        }

        .benefit-number {
          font-size: 0.875rem;
          color: #999;
          margin-bottom: 1rem;
          font-weight: 400;
          letter-spacing: 2px;
        }

        .benefit-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: #171717;
          font-weight: 400;
          letter-spacing: -0.25px;
        }

        .benefit-card p {
          color: #666;
          line-height: 1.5;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .how-it-works {
          padding: 6rem 2rem;
          background: #fff;
          border-top: 1px solid #f0f0f0;
        }
          padding: 6rem 2rem;
          background: #fff;
          border-top: 1px solid #f0f0f0;
        }

        .section-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 200;
          text-align: center;
          margin-bottom: 4rem;
          color: #171717;
          letter-spacing: -1px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
        }

        .step-card {
          text-align: center;
        }

        .step-number {
          font-size: 0.875rem;
          color: #999;
          margin-bottom: 1rem;
          font-weight: 400;
          letter-spacing: 2px;
        }

        .step-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #171717;
          font-weight: 300;
          letter-spacing: -0.5px;
        }

        .step-card p {
          color: #666;
          line-height: 1.5;
          font-weight: 400;
        }

        .footer {
          background: #171717;
          color: #999;
          padding: 3rem 2rem 2rem;
        }

        .footer-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .footer-logo {
          font-size: 1.25rem;
          font-weight: 200;
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
        }

        .footer-logo .logo-main {
          color: #fff;
        }

        .footer-logo .logo-ai {
          color: #666;
          font-size: 0.8em;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
        }

        .footer-links a {
          color: #999;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 400;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: #fff;
        }

        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-section {
            padding: 1rem;
          }
          
          .logo-text {
            font-size: 3rem;
          }
          
          .subtitle {
            font-size: 1.5rem;
          }
          
          .section-title {
            font-size: 2rem;
            margin-bottom: 3rem;
          }
          
          .steps-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .benefits {
            padding: 4rem 1rem;
          }
          
          .benefits-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
          }
          
          .how-it-works {
            padding: 4rem 1rem;
          }
          
          .footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .logo-text {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.25rem;
          }
          
          .especialidades-label {
            font-size: 0.875rem;
          }

          .especialidades-grid {
            gap: 0.5rem;
          }

          .especialidad-tag {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .especialidades-content {
            gap: 1rem;
          }
          
          .chat-title {
            font-size: 0.875rem;
          }
          
          .input-wrapper {
            min-height: 70px;
          }
          
          .chat-input {
            font-size: 0.875rem;
            min-height: 40px;
          }
          
          .send-button {
            width: 32px;
            height: 32px;
          }
          
          .suggestion-pill {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
        }
      `}</style>
    </main>
  );
}

function AnimatedButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className="animated-btn"
      style={{
        padding: '1rem 2rem',
        fontSize: '1rem',
        fontWeight: '400',
        border: primary ? 'none' : '1px solid #e5e5e5',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        background: primary ? '#171717' : '#fff',
        color: primary ? 'white' : '#666',
      }}
      onMouseOver={(e) => {
        if (primary) {
          e.currentTarget.style.background = '#000';
        } else {
          e.currentTarget.style.borderColor = '#171717';
          e.currentTarget.style.color = '#171717';
        }
      }}
      onMouseOut={(e) => {
        if (primary) {
          e.currentTarget.style.background = '#171717';
        } else {
          e.currentTarget.style.borderColor = '#e5e5e5';
          e.currentTarget.style.color = '#666';
        }
      }}
    >
      {children}
    </button>
  );
}