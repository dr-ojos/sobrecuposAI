'use client';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const logoRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Función para navegar al chat
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
          {/* Logo principal mejorado */}
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

          {/* Botón CTA mejorado con más prominencia */}
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

      {/* Sección ¿Cómo funciona? */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h3 className="step-title">Busca</h3>
              <p className="step-description">
                Encuentra profesionales médicos disponibles por especialidad, nombre y/o sintomas.
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
                <span className="logo-main">Sobrecupos</span>
                <span className="logo-ai">AI</span>
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

// Botón CTA mejorado estilo Apple
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
