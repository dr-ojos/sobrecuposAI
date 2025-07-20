'use client';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const logoRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Función para navegar al chat completo
  const goToChat = () => {
    router.push('/chat');
  };

  // Función para ir al login de médicos
  const goToMedicoLogin = () => {
    router.push('/auth/signin');
  };

  useEffect(() => {
    // Animación inicial más suave
    setTimeout(() => setIsVisible(true), 500);
    
    // Efecto parallax muy sutil
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Logo SVG Component (tu logo real)
  const SobrecuposLogo = ({ size = 48, className = "" }) => (
    <svg 
      width={size} 
      height={size * 0.588}
      viewBox="0 0 1005 591" 
      className={className}
      fill="currentColor"
    >
      <g transform="translate(0,591) scale(0.1,-0.1)">
        <path d="M1363 3665 c-143 -39 -241 -131 -293 -272 -19 -53 -22 -77 -18 -156
3 -84 8 -103 40 -168 34 -67 64 -101 320 -357 l283 -282 398 398 c372 372 397
400 397 432 -1 57 -48 98 -98 85 -17 -4 -116 -95 -262 -240 -272 -271 -297
-288 -430 -289 -128 -1 -165 18 -307 157 -144 141 -173 188 -173 282 0 113 70
209 174 240 119 36 179 13 316 -121 l105 -103 -60 -61 -60 -60 -95 94 c-98 98
-132 117 -172 95 -34 -18 -47 -40 -48 -79 0 -30 12 -46 118 -151 92 -92 126
-120 157 -128 83 -22 97 -12 360 249 132 131 255 245 274 255 45 22 126 30
178 16 105 -28 183 -134 183 -245 -1 -110 -4 -114 -438 -548 l-397 -398 60
-60 60 -60 403 402 c374 374 406 408 440 477 36 73 37 78 37 186 0 108 -1 113
-38 187 -103 210 -346 293 -563 194 -42 -19 -87 -56 -164 -131 -58 -58 -110
-105 -115 -105 -5 0 -56 47 -114 104 -59 57 -124 113 -146 124 -102 51 -211
64 -312 37z"/>
      </g>
    </svg>
  );

  return (
    <main className="homepage">
      {/* Fondo con gradiente suave y elegante */}
      <div className="bg-gradient" />
      
      {/* Elementos flotantes minimalistas */}
      <div className="floating-elements">
        <div className="element element-1" style={{transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`}}>💊</div>
        <div className="element element-2" style={{transform: `translate(${mousePos.x * -0.2}px, ${mousePos.y * 0.2}px)`}}>🩺</div>
        <div className="element element-3" style={{transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * -0.3}px)`}}>⚡</div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="content-wrapper">
          {/* Logo principal mejorado con SVG real */}
          <div 
            ref={logoRef}
            className={`logo-container ${isVisible ? 'visible' : ''}`}
          >
            <div className="logo-glow">
              <SobrecuposLogo size={120} className="sobrecupos-logo" />
              <div className="logo-text">
                <span className="logo-main">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
            </div>
          </div>

          {/* Nuevo tagline más directo y poderoso */}
          <div className={`tagline ${isVisible ? 'visible' : ''}`}>
            <h1>Encuentra tu Sobrecupo médico</h1>
            <p className="subtitle">
              <strong>Más tiempo</strong> sano, <strong>menos tiempo</strong> enfermo.
            </p>
            <p className="cta-text">
              Chatea conmigo y encuentra un sobrecupo.
            </p>
          </div>

          {/* Botón CTA original mejorado */}
          <div className={`cta-section ${isVisible ? 'visible' : ''}`}>
            <AnimatedButton 
              onClick={goToChat}
              primary
            >
              <span className="button-icon">💬</span>
              Comenzar Chat
              <span className="button-arrow">→</span>
            </AnimatedButton>
          </div>

          {/* Indicador de confianza minimalista */}
          <div className={`trust-indicator ${isVisible ? 'visible' : ''}`}>
            <div className="trust-stats">
              <div className="stat">
                <span className="stat-number">2,847</span>
                <span className="stat-label">Sobrecupos encontrados</span>
              </div>
              <div className="stat-divider">•</div>
              <div className="stat">
                <span className="stat-number">30s</span>
                <span className="stat-label">Tiempo promedio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Embebido Modal */}
      {showEmbeddedChat && (
        <div className="chat-overlay">
          <div className="embedded-chat">
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="bot-avatar-small">🤖</div>
                <div>
                  <h3>Sobrecupos AI</h3>
                  <p className="status">En línea</p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button onClick={goToChat} className="expand-btn" title="Abrir chat completo">
                  ↗️
                </button>
                <button onClick={() => setShowEmbeddedChat(false)} className="close-btn">
                  ✕
                </button>
              </div>
            </div>

            <div className="chat-messages-container">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.from}`}>
                  {msg.from === "bot" && <div className="msg-avatar">🤖</div>}
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="msg-time">
                      {msg.timestamp.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="chat-message bot">
                  <div className="msg-avatar">🤖</div>
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="input-container">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendEmbeddedMessage()}
                  placeholder="Escribe tu consulta..."
                  disabled={chatLoading}
                />
                <button 
                  onClick={() => sendEmbeddedMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="send-btn"
                >
                  {chatLoading ? "⏳" : "➤"}
                </button>
              </div>
              <div className="chat-footer-actions">
                <button onClick={openWhatsApp} className="whatsapp-btn">
                  📱 Continuar en WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección ¿Cómo funciona? */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h3 className="step-title">Busca</h3>
              <p className="step-description">
                Encuentra profesionales médicos disponibles por especialidad, nombre y/o síntomas.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">📅</div>
              <h3 className="step-title">Agenda</h3>
              <p className="step-description">
                Selecciona el sobrecupo que necesitas y agéndalo al instante.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">✅</div>
              <h3 className="step-title">Confirma</h3>
              <p className="step-description">
                Recibe confirmación inmediata de tu cita por correo electrónico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección ¿Por qué elegir Sobrecupos? */}
      <section className="benefits">
        <div className="section-container">
          <h2 className="section-title">¿Por qué elegir Sobrecupos?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3 className="benefit-title">Ahorra tiempo</h3>
              <p className="benefit-description">
                Obtén citas médicas en días, no en meses. Accede a sobrecupos que se ajusten a tus necesidades.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3 className="benefit-title">Búsqueda inteligente</h3>
              <p className="benefit-description">
                Filtra por especialidad, ubicación, fecha y hora para encontrar el profesional ideal.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">🏆</div>
              <h3 className="benefit-title">Atención de calidad</h3>
              <p className="benefit-description">
                Todos nuestros profesionales están verificados y acreditados por la Superintendencia de Salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial mejorado */}
      <section className="testimonials">
        <div className="section-container">
          <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>"Increíble. Encontré oftalmólogo en 2 minutos cuando llevaba días buscando."</p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <span className="author-name">María José</span>
                  <span className="author-location">Santiago, Chile</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <p>"Como médico, Sobrecupos me ha permitido optimizar mi agenda y ayudar a más pacientes."</p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍⚕️</div>
                <div className="author-info">
                  <span className="author-name">Dr. Carlos Mendoza</span>
                  <span className="author-location">Cardiólogo</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <p>"Mi hijo necesitaba un pediatra con urgencia y gracias a Sobrecupos encontramos un sobrecupo para ese mismo día."</p>
              <div className="testimonial-author">
                <div className="author-avatar">👶</div>
                <div className="author-info">
                  <span className="author-name">Ana Rodríguez</span>
                  <span className="author-location">Madre de familia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="final-cta">
        <div className="section-container">
          <h2 className="cta-title">Agenda un sobrecupo hoy</h2>
          <p className="cta-subtitle">
            No esperes más para cuidar tu salud. Agenda un sobrecupo y recibe la atención que necesitas al instante.
          </p>
          <div className="cta-buttons">
            <AnimatedButton onClick={goToChat} primary>
              <span className="button-icon">💬</span>
              Agendar sobrecupo
            </AnimatedButton>
            <AnimatedButton onClick={goToMedicoLogin}>
              <span className="button-icon">👨‍⚕️</span>
              Soy médico
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <SobrecuposLogo size={32} className="footer-logo-svg" />
                <div className="footer-logo-text">
                  <span className="logo-main">Sobrecupos</span>
                  <span className="logo-ai">AI</span>
                </div>
              </div>
              <p className="footer-description">
                La plataforma que conecta pacientes con médicos disponibles al instante.
              </p>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Pacientes</h4>
              <ul className="footer-links">
                <li><a href="/chat">Buscar sobrecupos</a></li>
                <li><a href="/especialidades">Especialidades</a></li>
                <li><a href="/como-funciona">Cómo funciona</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Médicos</h4>
              <ul className="footer-links">
                <li><a href="/auth/signin">Iniciar sesión</a></li>
                <li><a href="/registro-medico">Registrarse</a></li>
                <li><a href="/beneficios-medicos">Beneficios</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="/terminos">Términos de uso</a></li>
                <li><a href="/privacidad">Política de privacidad</a></li>
                <li><a href="/contacto">Contacto</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Sobrecupos AI. Todos los derechos reservados.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link">📧</a>
              <a href="#" className="social-link">📱</a>
              <a href="#" className="social-link">🌐</a>
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

        /* Hero Section */
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
          background: linear-gradient(45deg, #007aff, #5856d6, #34c759, #ff3b30, #007aff);
          border-radius: 40px;
          opacity: 0.1;
          filter: blur(40px);
          animation: logoGlow 8s ease-in-out infinite;
        }

        @keyframes logoGlow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }

        .sobrecupos-logo {
          color: #ff3b30;
          filter: drop-shadow(0 8px 16px rgba(255, 59, 48, 0.3));
          animation: logoFloat 6s ease-in-out infinite;
          display: block;
          margin: 0 auto 1rem;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .logo-text {
          position: relative;
          background: linear-gradient(135deg, #1d1d1f 0%, #515154 50%, #1d1d1f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 5rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .logo-ai {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 50%, #007aff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tagline {
          margin-bottom: 4rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tagline h1 {
          font-size: 3.5rem;
          font-weight: 800;
          color: #1d1d1f;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .subtitle {
          font-size: 1.5rem;
          color: #424245;
          line-height: 1.4;
          font-weight: 400;
          margin-bottom: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .subtitle strong {
          color: #1d1d1f;
          font-weight: 700;
        }

        .cta-text {
          font-size: 1.25rem;
          color: #007aff;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .cta-section {
          margin-bottom: 4rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          text-align: center;
          position: relative;
          padding: 2rem 0;
        }

        .cta-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .cta-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto 2rem;
        }

        .trust-indicator {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.9s;
        }

        .trust-indicator.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .trust-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 24px;
          padding: 2rem 3rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2.2rem;
          font-weight: 800;
          color: #007aff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .stat-label {
          display: block;
          font-size: 0.9rem;
          color: #6e6e73;
          font-weight: 400;
          margin-top: 0.3rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .stat-divider {
          color: #c6c6c8;
          font-size: 1.5rem;
        }

        /* Chat Overlay */
        .chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .embedded-chat {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          height: 600px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .chat-header {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bot-avatar-small {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .status {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .chat-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .expand-btn, .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .expand-btn:hover, .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-message {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          max-width: 80%;
        }

        .chat-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-message.bot {
          align-self: flex-start;
        }

        .msg-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .message-bubble {
          background: white;
          padding: 0.8rem 1rem;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .chat-message.user .message-bubble {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
        }

        .message-bubble p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .msg-time {
          display: block;
          font-size: 0.7rem;
          opacity: 0.6;
          margin-top: 0.3rem;
        }

        .typing-indicator {
          background: white;
          padding: 1rem;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .typing-dots {
          display: flex;
          gap: 0.3rem;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #007aff;
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .chat-input-area {
          background: white;
          border-top: 1px solid #e9ecef;
          padding: 1rem;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          background: #f8f9fa;
          border-radius: 25px;
          padding: 0.5rem;
          margin-bottom: 0.8rem;
        }

        .input-container input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          color: #1d1d1f;
        }

        .input-container input::placeholder {
          color: #8e8e93;
        }

        .send-btn {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-footer-actions {
          text-align: center;
        }

        .whatsapp-btn {
          background: linear-gradient(135deg, #25d366, #128c7e);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .whatsapp-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }

        /* Secciones */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        section {
          padding: 6rem 0;
          position: relative;
        }

        .section-title {
          font-size: 2.8rem;
          font-weight: 800;
          color: #1d1d1f;
          text-align: center;
          margin-bottom: 4rem;
          letter-spacing: -0.02em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Cómo funciona */
        .how-it-works {
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(20px);
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 3rem;
          margin-top: 4rem;
        }

        .step-card {
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(255,255,255,0.8);
          border-radius: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          transition: all 0.4s ease;
          border: 1px solid rgba(255,255,255,0.9);
        }

        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }

        .step-icon {
          font-size: 4rem;
          margin-bottom: 2rem;
          display: block;
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1d1d1f;
          margin-bottom: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .step-description {
          font-size: 1rem;
          color: #424245;
          line-height: 1.6;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Beneficios */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 3rem;
          margin-top: 4rem;
        }

        .benefit-card {
          padding: 3rem 2rem;
          background: rgba(255,255,255,0.7);
          border-radius: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          transition: all 0.4s ease;
          border: 1px solid rgba(255,255,255,0.8);
        }

        .benefit-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }

        .benefit-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          display: block;
        }

        .benefit-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1d1d1f;
          margin-bottom: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .benefit-description {
          font-size: 1rem;
          color: #424245;
          line-height: 1.6;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Testimonios */
        .testimonials {
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(20px);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 4rem;
        }

        .testimonial-card {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          transition: all 0.4s ease;
          position: relative;
        }

        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }

        .testimonial-card::before {
          content: '"';
          position: absolute;
          top: 1.5rem;
          left: 2rem;
          font-size: 3rem;
          color: #007aff;
          opacity: 0.3;
          font-family: Georgia, serif;
        }

        .testimonial-card p {
          color: #1d1d1f;
          font-size: 1.1rem;
          font-style: italic;
          margin-bottom: 2rem;
          line-height: 1.6;
          font-weight: 400;
          padding-left: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 12px rgba(0,122,255,0.3));
        }

        .author-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .author-name {
          color: #1d1d1f;
          font-weight: 600;
          font-size: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .author-location {
          color: #6e6e73;
          font-size: 0.9rem;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* CTA Final */
        .final-cta {
          background: linear-gradient(135deg, rgba(0,122,255,0.05), rgba(88,86,214,0.05));
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1d1d1f;
          margin-bottom: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          color: #424245;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .cta-buttons {
          display: flex;
          gap: 2rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Footer */
        .footer {
          background: linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%);
          color: white;
          padding: 5rem 0 2rem;
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

        .footer-section h4 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .footer-logo-svg {
          color: #ff3b30;
        }

        .footer-logo-text {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
        }

        .footer-logo-text .logo-main {
          font-size: 1.8rem;
          font-weight: 900;
          color: white;
        }

        .footer-logo-text .logo-ai {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-description {
          color: #a1a1a6;
          line-height: 1.6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 0.8rem;
        }

        .footer-links a {
          color: #a1a1a6;
          text-decoration: none;
          transition: color 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .footer-links a:hover {
          color: #007aff;
        }

        .footer-bottom {
          border-top: 1px solid #48484a;
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-copyright {
          color: #a1a1a6;
          font-size: 0.9rem;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          font-size: 1.2rem;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .social-link:hover {
          transform: scale(1.1);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .section-container {
            padding: 0 1.5rem;
          }

          .steps-grid, .benefits-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
          }

          .testimonials-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
          }

          .cta-buttons-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .logo-text {
            font-size: 3.5rem;
          }

          .tagline h1 {
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 1.2rem;
          }

          .subtitle {
            font-size: 1.2rem;
            margin-bottom: 1.2rem;
          }

          .cta-text {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
          }

          .section-title {
            font-size: 2.2rem;
            margin-bottom: 3rem;
          }

          .steps-grid, .benefits-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .cta-buttons {
            flex-direction: column;
            gap: 1rem;
          }

          .trust-stats {
            flex-direction: column;
            gap: 1.5rem;
            padding: 1.5rem 2rem;
          }

          .stat-divider {
            display: none;
          }

          .content-wrapper {
            padding: 1rem;
          }

          section {
            padding: 4rem 0;
          }

          .footer-content {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }

          .embedded-chat {
            max-width: 100%;
            height: 100%;
            border-radius: 0;
          }

          .chat-overlay {
            padding: 0;
          }
        }

        @media (max-width: 480px) {
          .logo-text {
            font-size: 2.8rem;
          }

          .tagline h1 {
            font-size: 2rem;
            line-height: 1.1;
          }

          .subtitle {
            font-size: 1.1rem;
          }

          .cta-text {
            font-size: 1rem;
          }

          .section-title {
            font-size: 1.8rem;
            margin-bottom: 2rem;
          }

          .step-card, .benefit-card {
            padding: 2rem 1.5rem;
          }

          .testimonial-card {
            padding: 2rem 1.5rem;
          }

          .trust-stats {
            padding: 1.2rem 1.5rem;
          }

          .content-wrapper {
            padding: 0.5rem;
          }

          .section-container {
            padding: 0 1rem;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .cta-title {
            font-size: 2rem;
          }

          .cta-subtitle {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 320px) {
          .logo-text {
            font-size: 2.4rem;
          }

          .tagline h1 {
            font-size: 1.8rem;
          }

          .section-title {
            font-size: 1.6rem;
          }

          .step-card, .benefit-card, .testimonial-card {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </main>
  );
}

// Botón CTA mejorado estilo Apple con WhatsApp
function AnimatedButton({ children, onClick, primary = false, secondary = false, whatsapp = false }) {
  return (
    <button
      onClick={onClick}
      className={`animated-btn ${primary ? 'primary' : secondary ? 'secondary' : whatsapp ? 'whatsapp' : 'default'}`}
    >
      {children}
      <style jsx>{`
        .animated-btn {
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          text-decoration: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-width: 200px;
          justify-content: center;
          backdrop-filter: blur(20px);
        }

        .animated-btn.primary {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: white;
          box-shadow: 0 8px 30px rgba(0, 122, 255, 0.3);
        }

        .animated-btn.whatsapp {
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          color: white;
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.3);
        }

        .animated-btn.secondary {
          background: rgba(255, 255, 255, 0.8);
          color: #007aff;
          border: 1px solid rgba(0, 122, 255, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .animated-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }

        .animated-btn:hover {
          transform: translateY(-2px);
        }

        .animated-btn.primary:hover {
          box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
        }

        .animated-btn.whatsapp:hover {
          box-shadow: 0 12px 40px rgba(37, 211, 102, 0.4);
        }

        .animated-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .animated-btn:hover::before {
          left: 100%;
        }

        .animated-btn:active {
          transform: translateY(0);
        }

        .button-icon, .button-arrow {
          transition: transform 0.3s ease;
        }

        .animated-btn:hover .button-arrow {
          transform: translateX(4px);
        }

        .animated-btn:hover .button-icon {
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .animated-btn {
            width: 100%;
            max-width: 280px;
            padding: 1rem 2rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .animated-btn {
            width: 90%;
            max-width: 260px;
            padding: 0.9rem 1.8rem;
            font-size: 0.95rem;
            min-width: 180px;
          }
        }
      `}</style>
    </button>
  );
}