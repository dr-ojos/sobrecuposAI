'use client';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const logoRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatExpanding, setChatExpanding] = useState(false);

  // Función para manejar el envío del chat con efecto de expansión
  const handleChatSubmit = (e) => {
    if (e) e.preventDefault();
    if (chatInput.trim() && !chatExpanding) {
      // 1. Trigger expansion animation
      setChatExpanding(true);
      
      // 2. Faster navigation - reduced from 800ms to 400ms
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

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 500);
    
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="homepage">
      <div className="bg-gradient" />
      
      <div className="floating-elements">
        <div className="element element-1" style={{transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`}}>💊</div>
        <div className="element element-2" style={{transform: `translate(${mousePos.x * -0.2}px, ${mousePos.y * 0.2}px)`}}>🩺</div>
        <div className="element element-3" style={{transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * -0.3}px)`}}>⚡</div>
      </div>

      <section className="hero-section">
        <div className="content-wrapper">
          <div 
            ref={logoRef}
            className={`logo-container ${isVisible ? 'visible' : ''}`}
          >
            <div className="logo-glow">
              <div className="logo-text">
                <span className="logo-main">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
            </div>
          </div>

          <div className={`tagline ${isVisible ? 'visible' : ''}`}>
            <h1>Encuentra tu Sobrecupo médico</h1>
            <p className="subtitle">
              <strong>Más tiempo</strong> sano, <strong>menos tiempo</strong> enfermo.
            </p>
          </div>

          {/* NUEVA SECCIÓN DE CHAT - ESTILO LOVABLE */}
          <div className={`chat-container ${isVisible ? 'visible' : ''} ${chatExpanding ? 'expanding' : ''}`}>
            <div className="chat-wrapper">
              <div className="chat-section">
                {/* Título fuera del input */}
                <h2 className="chat-title">¡Hola! 👋 Soy Sobrecupos IA. Te ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas.</h2>

                {/* INPUT HERO - Solo el área gris */}
                <div className={`input-hero ${chatExpanding ? 'expanding' : ''}`}>
                  <div className="input-wrapper">
                    <textarea 
                      className="chat-input" 
                      placeholder="Ejemplo: Tengo visión borrosa y dolor de cabeza desde ayer..."
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        setIsTyping(e.target.value.length > 0);
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
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
                        <div className="arrow-up"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tarjetas de sugerencias en carrusel */}
                <div className="suggestions-container">
                  <div className="suggestions-label">Prueba preguntando:</div>
                  <div className="suggestions-scroll">
                    <div className="suggestion-card" onClick={() => selectSuggestion('Tengo visión borrosa hace 3 días')}>
                      <div className="card-text">Visión borrosa hace 3 días</div>
                    </div>
                    <div className="suggestion-card" onClick={() => selectSuggestion('Necesito revisar mi graduación de lentes')}>
                      <div className="card-text">Revisar graduación de lentes</div>
                    </div>
                    <div className="suggestion-card" onClick={() => selectSuggestion('Me duelen los ojos con la luz')}>
                      <div className="card-text">Dolor de ojos con luz</div>
                    </div>
                    <div className="suggestion-card" onClick={() => selectSuggestion('Veo manchas flotantes en el ojo')}>
                      <div className="card-text">Manchas flotantes</div>
                    </div>
                    <div className="suggestion-card" onClick={() => selectSuggestion('Ojo rojo e irritado desde ayer')}>
                      <div className="card-text">Ojo rojo e irritado</div>
                    </div>
                    <div className="suggestion-card" onClick={() => selectSuggestion('Pérdida súbita de visión parcial')}>
                      <div className="card-text">Pérdida de visión</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay de expansión */}
          {chatExpanding && (
            <div className="expansion-overlay">
              <div className="expanding-message">Abriendo chat...</div>
            </div>
          )}
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Cuéntanos tus síntomas</h3>
              <p>Describe lo que sientes o qué especialista necesitas</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Encuentra sobrecupos</h3>
              <p>Te mostramos las horas disponibles de último minuto</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Reserva tu hora</h3>
              <p>Confirma tu cita médica en segundos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-container">
          <h2 className="section-title">Beneficios para ti</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Atención rápida</h3>
              <p>Accede a citas médicas de último minuto cuando más lo necesitas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Búsqueda inteligente</h3>
              <p>Nuestra IA encuentra el especialista perfecto según tus síntomas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Ahorra tiempo</h3>
              <p>No más llamadas ni esperas, todo en segundos desde tu celular</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">✅</div>
              <h3>100% confiable</h3>
              <p>Médicos verificados y sobrecupos reales confirmados al instante</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para sentirte mejor?</h2>
            <p className="cta-subtitle">Encuentra tu sobrecupo médico ahora</p>
            <AnimatedButton onClick={goToChat} primary>
              Comenzar chat
            </AnimatedButton>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-column">
              <div className="footer-logo">
                <span className="logo-main">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
              <p>Conectando pacientes con médicos</p>
            </div>
            <div className="footer-column">
              <h4>Pacientes</h4>
              <ul>
                <li><a href="/chat">Buscar sobrecupos</a></li>
                <li><a href="/registro">Registrarse para WhatsApp</a></li>
                <li><a href="#como-funciona">Cómo funciona</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Médicos</h4>
              <ul>
                <li><a href="/auth/signin">Iniciar sesión</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Contacto</h4>
              <ul>
                <li><a href="mailto:contacto@sobrecupos.com">contacto@sobrecupos.com</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Sobrecupos AI. Todos los derechos reservados.</p>
            <div className="footer-social">
              <a href="mailto:contacto@sobrecupos.com" className="social-link">📧</a>
              <a href="#" className="social-link">📱</a>
            </div>
          </div>
        </div>
      </footer>  

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          overflow-x: hidden;
        }

        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            #667eea 0%, 
            #764ba2 25%, 
            #f093fb 50%, 
            #f5576c 75%, 
            #4facfe 100%);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          z-index: -2;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
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
          font-size: 2rem;
          opacity: 0.04;
          animation: gentleFloat 12s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
        }

        .element-1 { top: 15%; right: 20%; animation-delay: 0s; }
        .element-2 { bottom: 20%; left: 15%; animation-delay: 4s; }
        .element-3 { top: 45%; left: 25%; animation-delay: 8s; }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.04; }
          50% { transform: translateY(-20px) rotate(3deg); opacity: 0.08; }
        }

        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .content-wrapper {
          text-align: center;
          max-width: 900px;
          padding: 2rem;
          position: relative;
        }

        .logo-container {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(40px) scale(0.95);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-container.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .logo-glow {
          position: relative;
          display: inline-block;
        }

        .logo-text {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -1px;
          display: inline-flex;
          align-items: baseline;
          gap: 0.3rem;
        }

        .logo-main {
          background: linear-gradient(135deg, #1d1d1f 0%, #424245 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-ai {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 0.85em;
          font-weight: 900;
          animation: aiPulse 3s ease-in-out infinite;
        }

        @keyframes aiPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .tagline {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
          margin-bottom: 3rem;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tagline h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1d1d1f;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .subtitle {
          font-size: 1.4rem;
          color: #424245;
          margin-bottom: 1rem;
          font-weight: 400;
        }

        .cta-text {
          font-size: 1.1rem;
          color: #6e6e73;
          font-weight: 400;
        }

        /* NUEVA SECCIÓN DE CHAT - ESTILO LOVABLE */
        .chat-container {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .chat-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chat-wrapper {
          max-width: 100%;
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }

        .chat-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 600px;
          width: 100%;
        }

        /* Títulos fuera del input */
        .chat-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: #4a5568;
          text-align: center;
          margin-bottom: 2rem;
          line-height: 1.5;
          max-width: 500px;
        }

        /* INPUT HERO - Solo el área gris con glassmorphism */
        .input-hero {
          width: 100%;
          margin-bottom: 1.5rem;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-hero.expanding {
          transform: scale(1.02);
        }

        .input-wrapper {
          display: flex;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 1rem;
          min-height: 120px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 4px 16px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          position: relative;
        }

        .input-wrapper:focus-within {
          border-color: rgba(0, 122, 255, 0.4);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 12px 40px rgba(0, 122, 255, 0.15),
            0 4px 16px rgba(0, 122, 255, 0.1),
            0 0 0 4px rgba(0, 122, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .chat-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 1.1rem;
          color: #1d1d1f;
          font-family: inherit;
          resize: none;
          min-height: 80px;
          line-height: 1.5;
          padding: 0;
          padding-right: 3rem;
          vertical-align: top;
        }

        .chat-input::placeholder {
          color: #a0aec0;
          font-size: 1rem;
        }

        .chat-input:disabled {
          opacity: 0.6;
        }

        /* Botón redondo con flecha - ABAJO A LA DERECHA con glassmorphism */
        .send-button {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          flex-shrink: 0;
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          opacity: 0.6;
          transform: scale(0.9);
          box-shadow: 
            0 4px 16px rgba(0, 122, 255, 0.3),
            0 1px 4px rgba(0, 122, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .send-button.active {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: white;
          opacity: 1;
          transform: scale(1);
          box-shadow: 
            0 6px 24px rgba(0, 122, 255, 0.4),
            0 2px 8px rgba(0, 122, 255, 0.3);
        }

        .send-button:hover.active {
          transform: scale(1.05);
          box-shadow: 
            0 8px 32px rgba(0, 122, 255, 0.5),
            0 4px 12px rgba(0, 122, 255, 0.4);
        }

        .send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .send-button.expanding .spinner {
          animation: spin 0.8s linear infinite;
        }

        .arrow-up {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid currentColor;
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

        /* Sugerencias en carrusel */
        .suggestions-container {
          width: 100%;
        }

        .suggestions-label {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 0.75rem;
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

        .suggestion-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 16px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          flex-shrink: 0;
          min-width: 120px;
          max-width: 130px;
          min-height: 80px;
          text-align: center;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .suggestion-card:hover {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(0, 122, 255, 0.3);
          transform: translateY(-3px);
          box-shadow: 
            0 12px 32px rgba(0, 122, 255, 0.12),
            0 4px 16px rgba(0, 122, 255, 0.08),
            0 1px 0 rgba(255, 255, 255, 0.5) inset;
        }

        .suggestion-card:active {
          transform: scale(0.98);
        }

        .card-text {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.4;
          font-weight: 500;
        }

        /* Animación de expansión mantenida */
        .chat-container.expanding {
          animation: expandChat 0.4s cubic-bezier(0.32, 0, 0.67, 0) forwards;
        }

        @keyframes expandChat {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5) translateY(-20vh);
            opacity: 0;
          }
        }

        .expansion-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from { 
            opacity: 0;
            background: rgba(255,255,255,0);
          }
          to { 
            opacity: 1;
            background: #ffffff;
          }
        }

        .expanding-message {
          font-size: 1.1rem;
          color: #007aff;
          font-weight: 600;
          opacity: 0;
          animation: messageAppear 0.3s ease-out 0.1s forwards;
        }

        @keyframes messageAppear {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Secciones adicionales */
        .how-it-works,
        .benefits,
        .cta-section {
          padding: 5rem 2rem;
          position: relative;
          z-index: 1;
        }

        .how-it-works {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(20px);
        }

        .benefits {
          background: transparent;
        }

        .cta-section {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
          color: #1d1d1f;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .step-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          text-align: center;
          transition: transform 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
        }

        .step-card h3 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #1d1d1f;
        }

        .step-card p {
          color: #6e6e73;
          line-height: 1.6;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .benefit-card {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }

        .benefit-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.95);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }

        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .benefit-card h3 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #1d1d1f;
        }

        .benefit-card p {
          color: #6e6e73;
          line-height: 1.6;
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1d1d1f;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          color: #6e6e73;
          margin-bottom: 2rem;
        }

        /* Footer */
        .footer {
          background: #1d1d1f;
          color: white;
          padding: 3rem 0 2rem;
          position: relative;
          z-index: 1;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
        }

        .footer-logo .logo-main {
          color: white;
        }

        .footer-logo .logo-ai {
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-column h4 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .footer-column ul {
          list-style: none;
          padding: 0;
        }

        .footer-column li {
          margin-bottom: 0.5rem;
        }

        .footer-column a {
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-column a:hover {
          color: #007aff;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }

        .social-link:hover {
          transform: scale(1.2);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-section { 
            padding: 1rem; 
            min-height: auto;
            padding-top: 2rem;
            padding-bottom: 2rem;
          }
          .content-wrapper { 
            padding: 1rem; 
            max-width: 100%;
          }
          .logo-text { font-size: 2.5rem; }
          .tagline h1 { font-size: 1.8rem; }
          .subtitle { font-size: 1.1rem; }
          .section-title { font-size: 2rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 1.5rem; }
          .steps-grid, .benefits-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .how-it-works, .benefits, .cta-section { padding: 3rem 1rem; }
          .footer-content { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 1.5rem; }
          
          /* Chat responsive */
          .chat-title {
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }

          .input-wrapper {
            min-height: 100px;
            padding: 0.8rem;
            align-items: flex-start;
            position: relative;
            border-radius: 18px;
          }

          .chat-input {
            padding-right: 2.5rem;
          }

          .send-button {
            bottom: 0.8rem;
            right: 0.8rem;
            width: 32px;
            height: 32px;
          }

          .suggestion-card {
            min-width: 110px;
            max-width: 120px;
            min-height: 70px;
            padding: 0.6rem;
            border-radius: 14px;
          }

          .card-text {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .logo-text { font-size: 2.2rem; }
          .tagline { margin-bottom: 2rem; }
          .tagline h1 { 
            font-size: 1.6rem; 
            line-height: 1.2; 
            margin-bottom: 1rem;
          }
          .subtitle { font-size: 1rem; }
          .section-title { font-size: 1.8rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 1.25rem; }
          .content-wrapper { padding: 0.75rem; }
          .section-container { padding: 0 1rem; }
          .footer-content { grid-template-columns: 1fr; gap: 2rem; }
          .cta-title { font-size: 1.8rem; }
          .cta-subtitle { font-size: 1rem; }
          
          /* Chat mobile */
          .chat-container {
            padding: 0 0.5rem;
          }

          .chat-title {
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
          }

          .input-wrapper {
            min-height: 100px;
            padding: 0.8rem;
            align-items: flex-start;
            position: relative;
            border-radius: 16px;
          }

          .chat-input {
            font-size: 1rem;
            min-height: 60px;
            padding-right: 2.5rem;
          }

          .send-button {
            bottom: 0.8rem;
            right: 0.8rem;
            width: 32px;
            height: 32px;
          }

          .suggestion-card {
            min-width: 100px;
            max-width: 110px;
            min-height: 65px;
            padding: 0.5rem;
            border-radius: 12px;
          }

          .card-text {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 375px) {
          .logo-text { font-size: 2rem; }
          .tagline h1 { font-size: 1.4rem; }
          .hero-section {
            padding: 0;
            padding-top: 0.5rem;
          }
          .content-wrapper {
            padding: 0;
          }
          
          .tagline {
            padding: 0 0.5rem;
          }
          
          .logo-container {
            padding: 0 0.5rem;
          }
          
          .chat-container {
            padding: 0 0.25rem;
          }
          
          .chat-title {
            font-size: 0.9rem;
            margin-bottom: 1.2rem;
          }
          
          .input-wrapper {
            min-height: 90px;
            padding: 0.7rem;
            align-items: flex-start;
            position: relative;
            border-radius: 14px;
          }

          .chat-input {
            font-size: 0.95rem;
            min-height: 50px;
            padding-right: 2.2rem;
          }

          .send-button {
            bottom: 0.7rem;
            right: 0.7rem;
            width: 28px;
            height: 28px;
          }
          
          .suggestion-card {
            min-width: 90px;
            max-width: 100px;
            min-height: 60px;
            padding: 0.4rem;
            border-radius: 10px;
          }
          
          .card-text {
            font-size: 0.7rem;
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .hero-section {
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(2rem, env(safe-area-inset-bottom));
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
      className={`animated-btn ${primary ? 'primary' : 'secondary'}`}
      style={{
        padding: '1rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        background: primary 
          ? 'linear-gradient(135deg, #007aff, #5856d6)' 
          : 'rgba(255,255,255,0.9)',
        color: primary ? 'white' : '#007aff',
        backdropFilter: 'blur(20px)',
        boxShadow: primary
          ? '0 4px 20px rgba(0,122,255,0.3)'
          : '0 4px 20px rgba(0,0,0,0.08)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = primary
          ? '0 8px 30px rgba(0,122,255,0.4)'
          : '0 8px 30px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = primary
          ? '0 4px 20px rgba(0,122,255,0.3)'
          : '0 4px 20px rgba(0,0,0,0.08)';
      }}
    >
      {children}
    </button>
  );
}