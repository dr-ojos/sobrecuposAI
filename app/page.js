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
              {/* NUEVA MINI VENTANA DE CHAT - Similar al chat real */}
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
              </div>
              
              {/* Sugerencias ANTES del input - como en el artefacto anterior */}
              <div className={`suggestions-section ${chatExpanding ? 'fade-out' : ''}`}>
                <p className="suggestions-title">Prueba con:</p>
                <div className="suggestions-carousel">
                  <div className="suggestion-card" onClick={() => setChatInput("Necesito oftalmólogo urgente")}>
                    <h4 className="card-title">Necesito oftalmólogo urgente</h4>
                    <p className="card-description">Consulta de ojos</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setChatInput("Consulta con cardiólogo")}>
                    <h4 className="card-title">Consulta con cardiólogo</h4>
                    <p className="card-description">Salud del corazón</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setChatInput("Dolor de cabeza frecuente")}>
                    <h4 className="card-title">Dolor de cabeza frecuente</h4>
                    <p className="card-description">Síntomas neurológicos</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setChatInput("Chequeo médico general")}>
                    <h4 className="card-title">Chequeo médico general</h4>
                    <p className="card-description">Medicina preventiva</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setChatInput("Necesito dermatólogo")}>
                    <p className="card-text">Necesito dermatólogo</p>
                  </div>
                </div>
              </div>

              {/* Input al FINAL */}
              <form onSubmit={handleChatSubmit} className="chat-form">
                <div className={`chat-input-container ${chatExpanding ? 'expanding' : ''}`}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      setIsTyping(e.target.value.length > 0);
                    }}
                    placeholder="Busco un oftalmólogo..."
                    className="chat-input"
                    autoFocus
                    disabled={chatExpanding}
                  />
                  <button 
                    type="submit"
                    className={`send-button ${isTyping ? 'active' : ''} ${chatExpanding ? 'expanding' : ''}`}
                    disabled={!chatInput.trim() || chatExpanding}
                  >
                    <span className="send-icon">→</span>
                  </button>
                  
                  {/* Overlay de expansión */}
                  {chatExpanding && (
                    <div className="expansion-overlay">
                      <div className="expanding-message">
                        {chatInput}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Resto del contenido original */}
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

        .logo-glow::before {
          content: '';
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          background: radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(20px);
          animation: logoGlow 4s ease-in-out infinite alternate;
        }

        @keyframes logoGlow {
          from { opacity: 0.3; transform: scale(0.95); }
          to { opacity: 0.6; transform: scale(1.05); }
        }

        .logo-text {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }

        .logo-main {
          background: linear-gradient(135deg, #1d1d1f 0%, #424245 50%, #1d1d1f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-ai {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .logo-ai::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 2px;
          animation: underlineGlow 2s ease-in-out infinite alternate;
        }

        @keyframes underlineGlow {
          from { opacity: 0.6; transform: scaleX(0.8); }
          to { opacity: 1; transform: scaleX(1); }
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
          color: #1d1d1f;
          margin-bottom: 1.5rem;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .subtitle {
          font-size: 1.3rem;
          color: #424245;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .cta-text {
          font-size: 1.1rem;
          color: #8e8e93;
          margin: 0;
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
          margin-bottom: 1.5rem;
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
        }

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

        /* Resto de estilos originales */
        .chat-form {
          margin-bottom: 1.5rem;
        }

        .chat-input-container {
          position: relative;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(0,122,255,0.1);
          border-radius: 24px;
          padding: 1.5rem 5rem 1.5rem 2rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .chat-input-container:focus-within:not(.expanding) {
          border-color: #007aff;
          box-shadow: 0 12px 50px rgba(0,122,255,0.15);
          transform: translateY(-2px);
        }

        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.1rem;
          color: #1d1d1f;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .chat-input::placeholder {
          color: #8e8e93;
          font-weight: 400;
        }

        .send-button {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.6;
          transform: translateY(-50%) scale(0.9);
          box-shadow: 0 4px 12px rgba(0,122,255,0.3);
        }

        .send-button.active {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        .send-button:hover.active {
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 6px 20px rgba(0,122,255,0.4);
        }

        .send-icon {
          font-size: 1.2rem;
          font-weight: bold;
        }

        /* Animaciones de expansión */
        .chat-container.expanding {
          transform: scale(1.02);
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chat-greeting.fade-out,
        .suggestions-section.fade-out {
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.4s ease;
        }

        .chat-input-container.expanding {
          transform: scale(1.05) translateY(-10px);
          box-shadow: 0 20px 60px rgba(0,122,255,0.25);
          border-color: #007aff;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .expansion-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
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

        /* Sección de sugerencias */
        .suggestions-section {
          text-align: left;
        }

        .suggestions-title {
          font-size: 0.9rem;
          color: #8e8e93;
          margin: 0 0 1rem 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 500;
        }

        .suggestions-carousel {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0.5rem 0 1rem 0;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestions-carousel::-webkit-scrollbar {
          display: none;
        }

        .suggestion-card {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          padding: 1rem;
          min-width: 160px;
          max-width: 160px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          backdrop-filter: blur(20px);
        }

        .suggestion-card:hover {
          background: rgba(255,255,255,0.95);
          border-color: rgba(0,122,255,0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,122,255,0.12);
        }

        .card-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 0.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.2;
        }

        .card-description {
          font-size: 0.75rem;
          color: #8e8e93;
          line-height: 1.3;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 400;
        }

        .card-text {
          font-size: 0.8rem;
          color: #8e8e93;
          line-height: 1.4;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 400;
          text-align: center;
        }

        /* Resto de secciones originales */
        .how-it-works,
        .benefits,
        .cta-section,
        .for-doctors {
          padding: 5rem 2rem;
          background: rgba(255, 255, 255, 0.8);
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
          color: #1d1d1f;
          letter-spacing: -0.01em;
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
          background: rgba(255, 255, 255, 0.9);
          padding: 3rem 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .step-card:hover,
        .benefit-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 50px rgba(0, 0, 0, 0.12);
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
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
        }

        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .step-card h3,
        .benefit-card h3 {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1d1d1f;
        }

        .step-card p,
        .benefit-card p {
          color: #424245;
          line-height: 1.6;
          font-size: 1rem;
        }

        .cta-section {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }

        .cta-content {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .cta-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .cta-subtitle {
          font-size: 1.3rem;
          margin-bottom: 2.5rem;
          opacity: 0.9;
        }

        .cta-buttons {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .for-doctors {
          background: #1d1d1f;
          color: white;
          text-align: center;
        }

        .doctor-content h2 {
          font-size: 2.2rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .doctor-content p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        .footer {
          background: #000;
          color: white;
          padding: 4rem 2rem 2rem;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-column h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #007aff;
        }

        .footer-column ul {
          list-style: none;
          padding: 0;
        }

        .footer-column ul li {
          margin-bottom: 0.8rem;
        }

        .footer-column ul li a {
          color: #8e8e93;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-column ul li a:hover {
          color: #007aff;
        }

        .footer-logo {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          color: #8e8e93;
          text-decoration: none;
          transition: color 0.2s ease;
          font-size: 1.2rem;
        }

        .social-link:hover {
          color: #007aff;
        }

        /* Media Queries - MEJORADO RESPONSIVE PARA IPHONE */
        @media (max-width: 1024px) {
          .logo-text { font-size: 3rem; }
          .tagline h1 { font-size: 2.2rem; }
          .subtitle { font-size: 1.2rem; }
          .section-title { font-size: 2.2rem; margin-bottom: 2.5rem; }
          .steps-grid, .benefits-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
          .step-card, .benefit-card { padding: 2.5rem 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
          .footer-content { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 1.5rem; }
          
          /* Chat responsive para tablet */
          .chat-container { max-width: 600px; }
          .chat-input-container { padding: 1.2rem 4.5rem 1.2rem 1.5rem; }
          .chat-input { font-size: 1rem; }
          .send-button { width: 40px; height: 40px; right: 0.8rem; }
          .suggestions-carousel { gap: 0.8rem; }
          .suggestion-card { min-width: 140px; max-width: 140px; padding: 0.875rem; }
          .card-title { font-size: 0.8rem; }
          .card-description { font-size: 0.7rem; }
          .card-text { font-size: 0.75rem; }
        }

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
          .chat-input-container { 
            padding: 1rem 3.5rem 1rem 1rem;
            margin: 0 0.5rem;
          }
          .chat-input { font-size: 0.95rem; }
          .send-button { width: 36px; height: 36px; right: 0.7rem; }
          .suggestions-carousel { 
            gap: 0.6rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          .suggestion-card { 
            min-width: 130px; 
            max-width: 130px; 
            padding: 0.75rem 0.5rem;
          }
          .card-title { font-size: 0.75rem; }
          .card-description { font-size: 0.65rem; }
          .suggestions-title { 
            font-size: 0.8rem; 
            padding-left: 0.5rem;
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
          .chat-input-container { 
            padding: 0.875rem 3.25rem 0.875rem 0.875rem; 
            border-radius: 18px;
            margin: 0 0.25rem;
          }
          .chat-input { font-size: 16px; } /* Evita zoom en iOS */
          .send-button { 
            width: 32px; 
            height: 32px; 
            right: 0.5rem; 
          }
          .send-icon { font-size: 0.9rem; }
          .suggestions-carousel { 
            gap: 0.5rem;
            padding: 0.5rem 0.25rem 1rem;
          }
          .suggestion-card { 
            min-width: 110px; 
            max-width: 110px; 
            padding: 0.625rem 0.375rem;
            border-radius: 10px;
          }
          .card-title { 
            font-size: 0.7rem; 
            margin-bottom: 0.25rem;
            line-height: 1.1;
          }
          .card-description { 
            font-size: 0.6rem; 
            line-height: 1.2;
          }
          .card-text {
            font-size: 0.65rem;
            line-height: 1.3;
          }
          .suggestions-title { 
            font-size: 0.75rem; 
            padding-left: 0.25rem;
            margin-bottom: 0.75rem;
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
          .chat-input-container {
            padding: 0.75rem 3rem 0.75rem 0.75rem;
            margin: 0;
          }
          .send-button {
            width: 28px;
            height: 28px;
            right: 0.4rem;
          }
          .send-icon { font-size: 0.8rem; }
          .suggestions-carousel {
            gap: 0.4rem;
            padding: 0.4rem 0 0.75rem;
          }
          .suggestion-card {
            min-width: 100px;
            max-width: 100px;
            padding: 0.5rem 0.3rem;
          }
          .card-title {
            font-size: 0.65rem;
            margin-bottom: 0.2rem;
          }
          .card-description {
            font-size: 0.55rem;
          }
          .card-text {
            font-size: 0.6rem;
          }
          .suggestions-title {
            font-size: 0.7rem;
            margin-bottom: 0.5rem;
          }
        }

        @media (max-width: 320px) {
          .logo-text { font-size: 1.8rem; }
          .tagline h1 { font-size: 1.2rem; }
          .section-title { font-size: 1.4rem; }
          .step-card, .benefit-card { padding: 1rem; }
          
          /* Chat para pantallas muy pequeñas */
          .chat-input-container { 
            padding: 0.625rem 2.75rem 0.625rem 0.625rem; 
          }
          .send-button { 
            width: 26px; 
            height: 26px; 
            right: 0.3rem; 
          }
          .send-icon { font-size: 0.7rem; }
          .suggestions-carousel { gap: 0.3rem; }
          .suggestion-card { 
            min-width: 85px; 
            max-width: 85px; 
            padding: 0.4rem 0.25rem;
          }
          .card-title { font-size: 0.6rem; }
          .card-description { font-size: 0.5rem; }
          .card-text { font-size: 0.55rem; }
          .suggestions-title { font-size: 0.65rem; }
        }

        /* Mejoras específicas para iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .chat-input {
            -webkit-appearance: none;
            -webkit-border-radius: 18px;
          }
          
          .send-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
          
          .suggestion-card {
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
    >
      {children}
      <style jsx>{`
        .animated-btn {
          padding: 1.2rem 2.5rem;
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .animated-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .animated-btn:hover::before {
          left: 100%;
        }

        .animated-btn.primary {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
        }

        .animated-btn.secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #007aff;
          border: 2px solid rgba(0, 122, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .animated-btn:hover {
          transform: translateY(-3px);
        }

        .animated-btn.primary:hover {
          box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
        }

        .animated-btn.secondary:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(0, 122, 255, 0.4);
          box-shadow: 0 8px 30px rgba(0, 122, 255, 0.15);
        }

        .animated-btn:active {
          transform: translateY(-1px);
        }
      `}</style>
    </button>
  );
}