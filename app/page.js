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

          {/* NUEVA SECCIÓN DE CHAT MEJORADA */}
          <div className={`chat-preview-container ${isVisible ? 'visible' : ''} ${chatExpanding ? 'expanding' : ''}`}>
            {/* Marco del teléfono */}
            <div className="phone-frame">
              {/* Header del chat similar a WhatsApp */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="bot-avatar-header">
                    <span>🤖</span>
                  </div>
                  <div className="header-text">
                    <div className="contact-name">Sobrecupos AI</div>
                    <div className="status">En línea</div>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="header-btn">📞</button>
                  <button className="header-btn">⋮</button>
                </div>
              </div>

              {/* Área de conversación */}
              <div className="chat-messages">
                {/* Mensaje del bot */}
                <div className={`message-row bot ${chatExpanding ? 'fade-out' : ''}`}>
                  <div className="message-bubble bot-bubble">
                    <div className="message-text">
                      ¡Hola! 👋 ¿En qué te puedo ayudar? Cuéntame tus síntomas o qué especialista necesitas.
                    </div>
                    <div className="message-time">11:40</div>
                  </div>
                </div>

                {/* Mensaje de ejemplo del usuario (si está escribiendo) */}
                {chatInput && (
                  <div className="message-row user preview">
                    <div className="message-bubble user-bubble">
                      <div className="message-text">{chatInput}</div>
                    </div>
                  </div>
                )}

                {/* Overlay de expansión */}
                {chatExpanding && (
                  <div className="expansion-overlay">
                    <div className="expanding-message">
                      Conectando con Sobrecupos AI...
                    </div>
                  </div>
                )}
              </div>

              {/* Input de chat */}
              <div className="chat-input-section">
                <form onSubmit={handleChatSubmit} className="input-form">
                  <div className="input-container">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        setIsTyping(e.target.value.length > 0);
                      }}
                      placeholder="Escribe tu mensaje..."
                      className="message-input"
                      disabled={chatExpanding}
                    />
                    <button 
                      type="submit"
                      className={`send-btn ${isTyping ? 'active' : ''}`}
                      disabled={!chatInput.trim() || chatExpanding}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M1.101 21.757L23.8 12.028L1.101 2.3l.011 7.912l13.623 1.816l-13.623 1.817l-.011 7.912z"/>
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sugerencias rápidas debajo del teléfono */}
            <div className={`quick-suggestions ${chatExpanding ? 'fade-out' : ''}`}>
              <p className="suggestions-title">Sugerencias populares:</p>
              <div className="suggestions-grid">
                <button
                  className="suggestion-pill"
                  onClick={() => {
                    setChatInput("Necesito oftalmólogo urgente");
                    setIsTyping(true);
                  }}
                >
                  Necesito oftalmólogo urgente
                </button>
                <button
                  className="suggestion-pill"
                  onClick={() => {
                    setChatInput("Consulta con cardiólogo");
                    setIsTyping(true);
                  }}
                >
                  Consulta con cardiólogo
                </button>
                <button
                  className="suggestion-pill"
                  onClick={() => {
                    setChatInput("Dolor de cabeza frecuente");
                    setIsTyping(true);
                  }}
                >
                  Dolor de cabeza frecuente
                </button>
                <button
                  className="suggestion-pill"
                  onClick={() => {
                    setChatInput("Chequeo médico general");
                    setIsTyping(true);
                  }}
                >
                  Chequeo médico general
                </button>
                <button
                  className="suggestion-pill"
                  onClick={() => {
                    setChatInput("Necesito dermatólogo");
                    setIsTyping(true);
                  }}
                >
                  Necesito dermatólogo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resto de las secciones existentes */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Cuéntanos qué necesitas</h3>
              <p>Describe tus síntomas o el especialista que buscas</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Encontramos tu sobrecupo</h3>
              <p>Nuestro AI busca disponibilidad en tiempo real</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Reserva al instante</h3>
              <p>Confirma tu cita directamente por WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-container">
          <h2 className="section-title">Beneficios</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Respuesta inmediata</h3>
              <p>Encuentra sobrecupos en segundos, no en horas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>100% personalizado</h3>
              <p>Adaptado a tu ubicación y necesidades específicas</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💬</div>
              <h3>Súper fácil</h3>
              <p>Todo por WhatsApp, sin apps ni registros complicados</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Precios transparentes</h3>
              <p>Conoce el precio antes de reservar, sin sorpresas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para encontrar tu sobrecupo?</h2>
            <p className="cta-subtitle">Únete a miles de pacientes que ya reservan más rápido</p>
            <div className="cta-buttons">
              <AnimatedButton onClick={goToChat} primary>
                Empezar ahora
              </AnimatedButton>
              <AnimatedButton onClick={() => router.push('/registro')}>
                Registrarse como paciente
              </AnimatedButton>
            </div>
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
            <div className="footer-links">
              <a href="/privacidad">Privacidad</a>
              <a href="/terminos">Términos</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: -2;
        }

        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .element {
          position: absolute;
          font-size: 2rem;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }

        .element-1 { top: 20%; left: 10%; animation-delay: 0s; }
        .element-2 { top: 60%; right: 15%; animation-delay: 2s; }
        .element-3 { bottom: 30%; left: 20%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1rem;
          position: relative;
        }

        .content-wrapper {
          max-width: 1200px;
          width: 100%;
        }

        .logo-container {
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .logo-glow {
          position: relative;
        }

        .logo-text {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1rem;
          position: relative;
          display: inline-block;
        }

        .logo-main {
          background: linear-gradient(45deg, #fff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-ai {
          background: linear-gradient(45deg, #60a5fa, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .tagline {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tagline h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .subtitle {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .cta-text {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        /* NUEVA SECCIÓN DE CHAT MEJORADA */
        .chat-preview-container {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          max-width: 400px;
          margin: 0 auto;
        }

        .chat-preview-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chat-preview-container.expanding {
          transform: scale(1.05) translateY(-10px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Marco del teléfono */
        .phone-frame {
          background: #000;
          border-radius: 25px;
          padding: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .phone-frame::before {
          content: '';
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          z-index: 10;
        }

        .chat-preview-container.expanding .phone-frame {
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, #1a1a1a, #000);
        }

        /* Header del chat */
        .chat-header {
          background: #075e54;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          padding-top: 20px;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-avatar-header {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #25d366, #128c7e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .header-text {
          color: white;
        }

        .contact-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 2px;
        }

        .status {
          font-size: 12px;
          opacity: 0.8;
        }

        .header-actions {
          display: flex;
          gap: 16px;
        }

        .header-btn {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .header-btn:hover {
          opacity: 1;
        }

        /* Área de mensajes */
        .chat-messages {
          background: #e5ddd5;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4aa' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          min-height: 300px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: flex-end;
          position: relative;
        }

        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 4px;
          transition: all 0.4s ease;
        }

        .message-row.bot {
          justify-content: flex-start;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.user.preview {
          animation: slideInFromRight 0.3s ease-out;
        }

        .message-row.fade-out {
          opacity: 0;
          transform: translateY(-20px);
        }

        .message-bubble {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 8px;
          position: relative;
          font-size: 14px;
          line-height: 1.4;
        }

        .bot-bubble {
          background: white;
          border-radius: 8px 8px 8px 2px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .user-bubble {
          background: #dcf8c6;
          border-radius: 8px 8px 2px 8px;
          margin-left: auto;
        }

        .message-text {
          margin-bottom: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #666;
          text-align: right;
        }

        /* Overlay de expansión */
        .expansion-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(4px);
        }

        .expanding-message {
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Input de chat */
        .chat-input-section {
          background: #f0f0f0;
          padding: 8px 16px 12px;
        }

        .input-form {
          width: 100%;
        }

        .input-container {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 20px;
          padding: 8px 16px;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .message-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          background: transparent;
          padding: 4px 0;
        }

        .message-input::placeholder {
          color: #999;
        }

        .message-input:disabled {
          opacity: 0.6;
        }

        .send-btn {
          background: #25d366;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
          transform: scale(0.9);
        }

        .send-btn.active {
          opacity: 1;
          transform: scale(1);
        }

        .send-btn:hover.active {
          background: #128c7e;
        }

        .send-btn:disabled {
          cursor: not-allowed;
        }

        /* Sugerencias rápidas */
        .quick-suggestions {
          margin-top: 2rem;
          text-align: center;
          transition: all 0.4s ease;
        }

        .quick-suggestions.fade-out {
          opacity: 0;
          transform: translateY(-20px);
        }

        .suggestions-title {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1rem;
        }

        .suggestions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 100%;
        }

        .suggestion-pill {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }

        .suggestion-pill:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        /* Animaciones */
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Resto de estilos existentes */
        .how-it-works,
        .benefits,
        .cta-section,
        .for-doctors {
          padding: 5rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
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
          color: #1a1a1a;
        }

        .steps-grid,
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .step-card,
        .benefit-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .step-card:hover,
        .benefit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .step-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 1rem;
        }

        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .step-card h3,
        .benefit-card h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .step-card p,
        .benefit-card p {
          color: #666;
          line-height: 1.6;
        }

        .cta-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .cta-content {
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .for-doctors {
          background: #1a1a1a;
          color: white;
          text-align: center;
        }

        .doctor-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .doctor-content p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        .footer {
          background: #0a0a0a;
          color: white;
          padding: 3rem 2rem 2rem;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-column h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #60a5fa;
        }

        .footer-column ul {
          list-style: none;
          padding: 0;
        }

        .footer-column ul li {
          margin-bottom: 0.5rem;
        }

        .footer-column ul li a {
          color: #ccc;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-column ul li a:hover {
          color: #60a5fa;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
        }

        .footer-links a {
          color: #ccc;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: #60a5fa;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .logo-text { font-size: 3rem; }
          .tagline h1 { font-size: 2.2rem; }
          .subtitle { font-size: 1.2rem; }
          .section-title { font-size: 2.2rem; }
          .steps-grid, .benefits-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
          .cta-buttons { flex-direction: column; align-items: center; }
        }

        @media (max-width: 768px) {
          .hero-section { padding: 1rem; }
          .logo-text { font-size: 2.5rem; }
          .tagline h1 { font-size: 1.8rem; }
          .subtitle { font-size: 1.1rem; }
          .section-title { font-size: 2rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 1.5rem; }
          .steps-grid, .benefits-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .how-it-works, .benefits, .cta-section, .for-doctors { padding: 3rem 1rem; }
          .footer-content { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 1.5rem; }
          
          /* Chat mobile optimizations */
          .chat-preview-container { max-width: 350px; }
          .phone-frame { border-radius: 20px; padding: 6px; }
          .chat-messages { min-height: 250px; padding: 12px; }
          .suggestions-grid { flex-direction: column; align-items: center; }
          .suggestion-pill { min-width: 200px; }
        }

        @media (max-width: 480px) {
          .logo-text { font-size: 2.2rem; }
          .tagline h1 { font-size: 1.6rem; line-height: 1.1; }
          .subtitle { font-size: 1rem; }
          .section-title { font-size: 1.8rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 1.25rem; }
          .content-wrapper { padding: 0.5rem; }
          .section-container { padding: 0 1rem; }
          .footer-content { grid-template-columns: 1fr; gap: 2rem; }
          .cta-title { font-size: 1.8rem; }
          .cta-subtitle { font-size: 1rem; }
          
          /* Chat mobile optimizations */
          .chat-preview-container { max-width: 320px; }
          .chat-messages { min-height: 220px; padding: 10px; }
          .message-bubble { font-size: 13px; padding: 6px 10px; }
          .contact-name { font-size: 14px; }
          .status { font-size: 11px; }
          .message-input { font-size: 14px; }
          .send-btn { width: 32px; height: 32px; }
          .suggestions-grid { gap: 6px; }
          .suggestion-pill { 
            min-width: 150px; 
            font-size: 11px; 
            padding: 6px 12px; 
          }
          .suggestions-title { font-size: 12px; }
        }

        @media (max-width: 320px) {
          .logo-text { font-size: 1.8rem; }
          .tagline h1 { font-size: 1.4rem; }
          .section-title { font-size: 1.6rem; }
          .step-card, .benefit-card { padding: 1rem; }
          .chat-preview-container { max-width: 280px; }
          .phone-frame { border-radius: 18px; padding: 4px; }
          .chat-messages { min-height: 200px; }
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
    >
      {children}
      <style jsx>{`
        .animated-btn {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-block;
          position: relative;
          overflow: hidden;
        }

        .animated-btn.primary {
          background: linear-gradient(45deg, #60a5fa, #34d399);
          color: white;
          box-shadow: 0 4px 15px rgba(96, 165, 250, 0.3);
        }

        .animated-btn.secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .animated-btn:hover {
          transform: translateY(-2px);
        }

        .animated-btn.primary:hover {
          box-shadow: 0 8px 25px rgba(96, 165, 250, 0.4);
        }

        .animated-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .animated-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
}