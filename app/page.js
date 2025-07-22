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

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      router.push(`/chat?initial=${encodeURIComponent(chatInput.trim())}`);
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

          <div className={`chat-container ${isVisible ? 'visible' : ''}`}>
            <div className="chat-wrapper">
              <div className="bot-greeting">
                ¡Hola! 👋 Soy Sobrecupos IA. Te ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas.
              </div>
              
              <form onSubmit={handleChatSubmit} className="chat-form">
                <div className="chat-input-container">
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
                  />
                  <button 
                    type="submit"
                    className={`send-button ${isTyping ? 'active' : ''}`}
                    disabled={!chatInput.trim()}
                  >
                    <span className="send-icon">→</span>
                  </button>
                </div>
              </form>
              <div className="chat-suggestions">
                <button 
                  onClick={() => setChatInput('Necesito un cardiólogo urgente')}
                  className="suggestion-chip"
                >
                  💓 Cardiólogo urgente
                </button>
                <button 
                  onClick={() => setChatInput('Busco dermatólogo para esta semana')}
                  className="suggestion-chip"
                >
                  👨‍⚕️ Dermatólogo esta semana
                </button>
                <button 
                  onClick={() => setChatInput('¿Hay pediatras disponibles hoy?')}
                  className="suggestion-chip"
                >
                  👶 Pediatra hoy
                </button>
              </div>
            </div>
          </div>

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
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">💬</div>
              <h3 className="step-title">Conversa</h3>
              <p className="step-description">
                Cuéntame qué especialista necesitas, cuándo y dónde.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h3 className="step-title">Busco</h3>
              <p className="step-description">
                Encuentro los sobrecupos disponibles que se ajusten a tus necesidades.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">📅</div>
              <h3 className="step-title">Agendas</h3>
              <p className="step-description">
                Te ayudo a agendar directamente con el profesional disponible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-container">
          <h2 className="section-title">¿Por qué elegir Sobrecupos?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3 className="benefit-title">Velocidad</h3>
              <p className="benefit-description">
                Encuentra citas médicas en minutos, no en semanas.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">🤖</div>
              <h3 className="benefit-title">Inteligencia Artificial</h3>
              <p className="benefit-description">
                Conversación natural que entiende exactamente lo que necesitas.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">🏥</div>
              <h3 className="benefit-title">Profesionales Verificados</h3>
              <p className="benefit-description">
                Solo médicos registrados y acreditados por la Superintendencia de Salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="section-container">
          <h2 className="cta-title">¿Listo para encontrar tu cita?</h2>
          <p className="cta-subtitle">
            Comienza ahora mismo y encuentra el sobrecupo que necesitas.
          </p>
          <div className="cta-buttons">
            <AnimatedButton onClick={goToChat} primary>
              <span className="button-icon">💬</span>
              Empezar ahora
            </AnimatedButton>
            <AnimatedButton onClick={goToMedicoLogin}>
              <span className="button-icon">👨‍⚕️</span>
              Soy médico
            </AnimatedButton>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-main">Sobrecupos</span>
                <span className="logo-ai">AI</span>
              </div>
              <p className="footer-description">
                Conectando pacientes con médicos disponibles al instante.
              </p>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Pacientes</h4>
              <ul className="footer-links">
                <li><a href="/chat">Buscar sobrecupos</a></li>
                <li><a href="/como-funciona">Cómo funciona</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Médicos</h4>
              <ul className="footer-links">
                <li><a href="/auth/signin">Iniciar sesión</a></li>
                <li><a href="/registro-medico">Registrarse</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="/terminos">Términos de uso</a></li>
                <li><a href="/privacidad">Privacidad</a></li>
                <li><a href="/contacto">Contacto</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Sobrecupos AI. Todos los derechos reservados.
            </p>
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
          background: linear-gradient(45deg, #007aff, #5856d6, #34c759, #007aff);
          border-radius: 40px;
          opacity: 0.1;
          filter: blur(40px);
          animation: logoGlow 8s ease-in-out infinite;
        }

        @keyframes logoGlow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
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
          margin-bottom: 3rem;
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

        .chat-container {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
        }

        .chat-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chat-wrapper {
          max-width: 700px;
          margin: 0 auto;
        }

        .bot-greeting {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(0,122,255,0.1);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          color: #424245;
          line-height: 1.5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 400;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .chat-form {
          margin-bottom: 2rem;
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

        .chat-input-container:focus-within {
          border-color: #007aff;
          box-shadow: 0 12px 50px rgba(0,122,255,0.15);
          transform: translateY(-2px);
        }

        .chat-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          color: #1d1d1f;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 400;
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
          border: none;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
        }

        .send-button.active {
          opacity: 1;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 6px 20px rgba(0,122,255,0.3);
        }

        .send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .send-icon {
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          transform: translateX(1px);
        }

        .chat-suggestions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .suggestion-chip {
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(0,122,255,0.2);
          border-radius: 20px;
          padding: 0.8rem 1.5rem;
          font-size: 0.9rem;
          color: #007aff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 500;
        }

        .suggestion-chip:hover {
          background: rgba(0,122,255,0.1);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,122,255,0.2);
        }

        .cta-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.9s;
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
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .footer-logo .logo-ai {
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

        @media (max-width: 768px) {
          .logo-text { font-size: 3.5rem; }
          .tagline h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.2rem; }
          .subtitle { font-size: 1.2rem; margin-bottom: 1.2rem; }
          .section-title { font-size: 2.2rem; margin-bottom: 3rem; }
          .steps-grid, .benefits-grid { grid-template-columns: 1fr; gap: 2rem; }
          .cta-buttons { flex-direction: column; gap: 1rem; }
          .content-wrapper { padding: 1rem; }
          section { padding: 4rem 0; }
          .footer-content { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; gap: 1.5rem; }
          .chat-input-container { padding: 1.2rem 4.5rem 1.2rem 1.5rem; }
          .chat-input { font-size: 1rem; }
          .send-button { width: 40px; height: 40px; right: 0.8rem; }
          .chat-suggestions { flex-direction: column; align-items: center; gap: 0.8rem; }
          .suggestion-chip { width: 100%; max-width: 300px; text-align: center; }
        }

        @media (max-width: 480px) {
          .logo-text { font-size: 2.8rem; }
          .tagline h1 { font-size: 2rem; line-height: 1.1; }
          .subtitle { font-size: 1.1rem; }
          .section-title { font-size: 1.8rem; margin-bottom: 2rem; }
          .step-card, .benefit-card { padding: 2rem 1.5rem; }
          .content-wrapper { padding: 0.5rem; }
          .section-container { padding: 0 1rem; }
          .footer-content { grid-template-columns: 1fr; gap: 2rem; }
          .cta-title { font-size: 2rem; }
          .cta-subtitle { font-size: 1.1rem; }
          .chat-input-container { padding: 1rem 4rem 1rem 1.2rem; border-radius: 20px; }
          .chat-input { font-size: 0.95rem; }
          .send-button { width: 36px; height: 36px; right: 0.7rem; }
          .send-icon { font-size: 1rem; }
          .suggestion-chip { font-size: 0.8rem; padding: 0.6rem 1rem; }
        }

        @media (max-width: 320px) {
          .logo-text { font-size: 2.4rem; }
          .tagline h1 { font-size: 1.8rem; }
          .section-title { font-size: 1.6rem; }
          .step-card, .benefit-card { padding: 1.5rem 1rem; }
          .chat-input-container { padding: 0.9rem 3.5rem 0.9rem 1rem; }
          .send-button { width: 32px; height: 32px; right: 0.5rem; }
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