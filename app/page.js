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
    e.preventDefault();
    if (chatInput.trim() && !chatExpanding) {
      // 1. Trigger expansion animation
      setChatExpanding(true);
      
      // 2. After expansion animation, navigate to chat
      setTimeout(() => {
        router.push(`/chat?initial=${encodeURIComponent(chatInput.trim())}`);
      }, 800);
    }
  };

  const goToChat = () => {
    router.push('/chat');
  };

  const goToMedicoLogin = () => {
    router.push('/auth/signin');
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
            <p className="cta-text">
              Chatea conmigo y encuentra un sobrecupo.
            </p>
          </div>

          <div className={`chat-container ${isVisible ? 'visible' : ''} ${chatExpanding ? 'expanding' : ''}`}>
            <div className="chat-wrapper">
              {/* MINI VENTANA DE CHAT ACTUALIZADA CON TARJETAS INTEGRADAS */}
              <div className={`chat-preview-window ${chatExpanding ? 'fade-out' : ''}`}>
                {/* Header del chat como el real */}
                <div className="chat-preview-header">
                  <div className="preview-avatar">
                    <span>🤖</span>
                  </div>
                  <div className="preview-info">
                    <div className="preview-name">Sobrecupos AI</div>
                    <div className="preview-status">En línea</div>
                  </div>
                </div>
                
                {/* Mensaje del bot */}
                <div className="preview-messages">
                  <div className="preview-message bot-msg">
                    <div className="msg-bubble">
                      ¡Hola! 👋 ¿En qué te puedo ayudar? Cuéntame tus síntomas o qué especialista necesitas.
                    </div>
                  </div>
                  
                  {/* Mensaje del usuario preview */}
                  {chatInput && (
                    <div className="preview-message user-msg">
                      <div className="msg-bubble user-bubble">
                        {chatInput}
                      </div>
                    </div>
                  )}
                </div>

                {/* TARJETAS DE PREGUNTAS INTEGRADAS DENTRO DEL CHAT - SIN TÍTULO */}
                <div className={`integrated-suggestions ${chatExpanding ? 'fade-out' : ''}`}>
                  <div className="integrated-cards-scroll">
                    <div className="integrated-card" onClick={() => setChatInput("Necesito oftalmólogo urgente")}>
                      Necesito oftalmólogo urgente
                    </div>
                    <div className="integrated-card" onClick={() => setChatInput("Consulta con cardiólogo")}>
                      Consulta con cardiólogo
                    </div>
                    <div className="integrated-card" onClick={() => setChatInput("Dolor de cabeza frecuente")}>
                      Dolor de cabeza frecuente
                    </div>
                    <div className="integrated-card" onClick={() => setChatInput("Chequeo médico general")}>
                      Chequeo médico general
                    </div>
                    <div className="integrated-card" onClick={() => setChatInput("Necesito dermatólogo")}>
                      Necesito dermatólogo
                    </div>
                  </div>
                </div>

                {/* Input integrado al final dentro del chat */}
                <div className={`integrated-input-section ${chatExpanding ? 'expanding' : ''}`}>
                  <form onSubmit={handleChatSubmit} className="integrated-form">
                    <div className="integrated-input-container">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value);
                          setIsTyping(e.target.value.length > 0);
                        }}
                        placeholder="Busco un oftalmólogo..."
                        className="integrated-input"
                        autoFocus
                        disabled={chatExpanding}
                      />
                      <button 
                        type="submit"
                        className={`integrated-send-btn ${isTyping ? 'active' : ''} ${chatExpanding ? 'expanding' : ''}`}
                        disabled={!chatInput.trim() || chatExpanding}
                      >
                        {chatExpanding ? (
                          <span className="spinner"></span>
                        ) : (
                          <span className="send-icon">➤</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {chatExpanding && (
                <div className="expansion-overlay">
                  <div className="expanding-message">Abriendo chat...</div>
                </div>
              )}
            </div>
          </div>
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

      <section className="for-doctors">
        <div className="section-container">
          <div className="doctor-content">
            <h2>¿Eres médico?</h2>
            <p>Monetiza tus sobrecupos y llegues a más pacientes</p>
            <AnimatedButton onClick={goToMedicoLogin}>
              Portal médico
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
              <p>Conectando pacientes con sobrecupos médicos disponibles</p>
            </div>
            <div className="footer-column">
              <h4>Pacientes</h4>
              <ul>
                <li><a href="/chat">Buscar sobrecupos</a></li>
                <li><a href="/registro">Registrarse</a></li>
                <li><a href="#como-funciona">Cómo funciona</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Médicos</h4>
              <ul>
                <li><a href="/auth/signin">Iniciar sesión</a></li>
                <li><a href="/medico/registro">Registrarse</a></li>
                <li><a href="/admin">Admin</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Contacto</h4>
              <ul>
                <li><a href="mailto:hola@sobrecupos.com">hola@sobrecupos.com</a></li>
                <li><a href="tel:+56912345678">+56 9 1234 5678</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Sobrecupos AI. Todos los derechos reservados.</p>
            <div className="footer-social">
              <a href="mailto:hola@sobrecupos.ai" className="social-link">📧</a>
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
            #f8faff 0%, 
            #e8f2ff 30%, 
            #dde9ff 60%, 
            #f0f8ff 100%);
          background-size: 400% 400%;
          animation: subtleShift 30s ease infinite;
          z-index: -2;
        }

        @keyframes subtleShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
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

        /* NUEVA MINI VENTANA DE CHAT */
        .chat-container {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          max-width: 700px;
          margin: 0 auto;
        }

        .chat-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chat-wrapper {
          max-width: 700px;
          margin: 0 auto;
        }

        /* MINI VENTANA DE PREVIEW DEL CHAT */
        .chat-preview-window {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0,122,255,0.1);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .chat-preview-window.fade-out {
          opacity: 0;
          transform: translateY(-20px);
        }

        .chat-preview-header {
          background: #f8faff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(0,122,255,0.08);
        }

        .preview-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .preview-info {
          flex: 1;
        }

        .preview-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
        }

        .preview-status {
          font-size: 0.75rem;
          color: #8e8e93;
          margin: 0;
        }

        .preview-messages {
          padding: 16px;
          min-height: 100px;
          max-height: 150px;
          overflow: hidden;
        }

        .preview-message {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
        }

        .preview-message.user-msg {
          justify-content: flex-end;
          animation: slideInFromRight 0.3s ease-out;
        }

        .msg-bubble {
          max-width: 75%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .bot-msg .msg-bubble {
          background: #f0f0f0;
          color: #424245;
          border-radius: 12px 12px 12px 2px;
        }

        .user-bubble {
          background: #007aff;
          color: white;
          border-radius: 12px 12px 2px 12px;
          animation: bubbleIn 0.3s ease-out;
        }

        @keyframes slideInFromRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes bubbleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* TARJETAS DE PREGUNTAS INTEGRADAS */
        .integrated-suggestions {
          padding: 12px 16px;
          background: #fafafa;
          border-top: 1px solid rgba(0,122,255,0.08);
        }

        .integrated-suggestions.fade-out {
          opacity: 0;
          transform: translateY(-10px);
        }

        .integrated-cards-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .integrated-cards-scroll::-webkit-scrollbar {
          display: none;
        }

        .integrated-card {
          background: white;
          border: 1px solid #e5e5e7;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          min-width: 180px;
          max-width: 260px;
          font-size: 13px;
          color: #6e6e73;
          line-height: 1.4;
          text-align: left;
        }

        .integrated-card:hover {
          background: #f5f5f7;
          border-color: #c7c7cc;
          transform: translateY(-1px);
        }

        .integrated-card:active {
          transform: scale(0.98);
        }

        /* INPUT INTEGRADO */
        .integrated-input-section {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid rgba(0,122,255,0.08);
        }

        .integrated-input-section.expanding {
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
        }

        .integrated-form {
          margin: 0;
        }

        .integrated-input-container {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f5f5f7;
          border-radius: 20px;
          padding: 6px 6px 6px 16px;
          transition: all 0.3s ease;
        }

        .integrated-input-section.expanding .integrated-input-container {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0,122,255,0.15);
          background: white;
        }

        .integrated-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 15px;
          padding: 8px 0;
          color: #1d1d1f;
          font-family: inherit;
        }

        .integrated-input::placeholder {
          color: #8e8e93;
        }

        .integrated-input:disabled {
          opacity: 0.6;
        }

        .integrated-send-btn {
          width: 32px;
          height: 32px;
          background: #007aff;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
          opacity: 0.5;
        }

        .integrated-send-btn.active {
          opacity: 1;
          transform: scale(1.05);
        }

        .integrated-send-btn:hover.active {
          background: #0056cc;
        }

        .integrated-send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .integrated-send-btn.expanding {
          animation: rotate 1s linear infinite;
        }

        .send-icon {
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes rotate {
          to { transform: rotate(360deg); }
        }

        /* Animación de expansión */
        .chat-container.expanding {
          animation: expandChat 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes expandChat {
          to {
            transform: scale(20) translateY(-50vh);
            opacity: 0;
          }
        }

        .expansion-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .expanding-message {
          font-size: 1.1rem;
          color: #007aff;
          font-weight: 600;
          animation: expandingPulse 1s ease-in-out infinite;
        }

        @keyframes expandingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        /* Secciones adicionales */
        .how-it-works,
        .benefits,
        .cta-section,
        .for-doctors {
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

        .for-doctors {
          background: #1d1d1f;
          color: white;
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

        .for-doctors .section-title,
        .for-doctors h2 {
          color: white;
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

        .cta-content,
        .doctor-content {
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

        .doctor-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .doctor-content p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
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
          .how-it-works, .benefits, .cta-section, .for-doctors { padding: 3rem 1rem; }
          .footer-content { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 1.5rem; }
          
          /* Chat responsive para móvil */
          .chat-container { 
            max-width: 100%;
            margin-top: 1rem;
          }
          .chat-wrapper {
            max-width: 100%;
            padding: 0 0.5rem;
          }
          .chat-preview-window {
            margin-bottom: 1rem;
          }
          
          /* Tarjetas integradas responsive */
          .integrated-card {
            min-width: 150px;
            font-size: 12px;
            padding: 8px 12px;
          }
          
          .integrated-input {
            font-size: 14px;
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
          .cta-text { font-size: 0.9rem; }
          .section-title { font-size: 1.8rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 1.25rem; }
          .content-wrapper { padding: 0.75rem; }
          .section-container { padding: 0 1rem; }
          .footer-content { grid-template-columns: 1fr; gap: 2rem; }
          .cta-title { font-size: 1.8rem; }
          .cta-subtitle { font-size: 1rem; }
          
          /* Chat optimizado para iPhone */
          .hero-section {
            padding: 0.75rem;
            padding-top: 1rem;
          }
          .chat-container {
            margin-top: 0.75rem;
          }
          .chat-wrapper {
            padding: 0;
          }
          .chat-preview-window {
            margin: 0 0.25rem 1rem;
            border-radius: 12px;
          }
          
          /* Tarjetas y input ajustados para iPhone */
          .integrated-suggestions {
            padding: 10px 12px;
          }
          
          .integrated-cards-scroll {
            gap: 6px;
            padding: 6px 0;
          }
          
          .integrated-card {
            min-width: 120px;
            max-width: 120px;
            padding: 8px 10px;
            font-size: 11px;
            border-radius: 8px;
          }
          
          .integrated-input-section {
            padding: 10px 12px;
          }
          
          .integrated-input-container {
            padding: 5px 5px 5px 14px;
            border-radius: 18px;
          }
          
          .integrated-input {
            font-size: 16px; /* Evita zoom en iOS */
            padding: 6px 0;
          }
          
          .integrated-send-btn {
            width: 28px;
            height: 28px;
          }
          
          .send-icon {
            font-size: 12px;
          }
          
          .preview-messages {
            padding: 12px;
            min-height: 80px;
          }
          
          .msg-bubble {
            font-size: 0.8rem;
            padding: 6px 10px;
          }
        }

        @media (max-width: 375px) {
          .logo-text { font-size: 2rem; }
          .tagline h1 { font-size: 1.4rem; }
          .hero-section {
            padding: 0.5rem;
          }
          .content-wrapper {
            padding: 0.5rem;
          }
          
          /* Chat ultra responsive para iPhone SE y similares */
          .chat-preview-window {
            margin: 0 0 0.75rem;
          }
          
          .integrated-card {
            min-width: 100px;
            max-width: 100px;
            padding: 6px 8px;
            font-size: 10px;
          }
          
          .integrated-cards-scroll {
            gap: 4px;
          }
          
          .integrated-input-container {
            padding: 4px 4px 4px 12px;
          }
          
          .integrated-send-btn {
            width: 26px;
            height: 26px;
          }
          
          .send-icon {
            font-size: 11px;
          }
        }

        /* Mejoras específicas para iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .integrated-input {
            -webkit-appearance: none;
            -webkit-border-radius: 18px;
          }
          
          .integrated-send-btn {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
          
          .integrated-card {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
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