// app/page.js - Página principal optimizada para iPhone
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    // Marcar como cargado para optimizaciones
    setIsLoaded(true)

    return () => clearTimeout(timer)
  }, [])

  // Navegación optimizada
  const goToChat = () => {
    // WhatsApp con mensaje predefinido
    const message = encodeURIComponent('Hola, necesito un sobrecupo médico urgente 🩺')
    window.open(`https://wa.me/56912345678?text=${message}`, '_blank')
  }

  const goToMedicoLogin = () => {
    router.push('/auth/signin')
  }

  const goToRegistro = () => {
    router.push('/registro')
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Componente AnimatedButton reutilizable
  const AnimatedButton = ({ children, onClick, primary = false, secondary = false, large = false, className = "" }) => (
    <button
      onClick={onClick}
      className={`animated-button ${primary ? 'primary' : ''} ${secondary ? 'secondary' : ''} ${large ? 'large' : ''} ${className}`}
    >
      {children}
    </button>
  )

  return (
    <div className="landing-page">
      {/* Header optimizado para iPhone */}
      <header className="mobile-header">
        <nav className="nav-container">
          <div className="nav-brand">
            <span className="logo-main">Sobrecupos</span>
            <span className="logo-ai">AI</span>
          </div>
          <AnimatedButton onClick={goToMedicoLogin} className="nav-login-btn">
            Soy médico
          </AnimatedButton>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="hero-container">
          {/* Badge superior */}
          <div className="hero-badge">
            <span className="badge-icon">🩺</span>
            <span className="badge-text">Más tiempo sano, menos tiempo enfermo</span>
          </div>
          
          {/* Título principal */}
          <h1 className="hero-title">
            Encuentra tu
            <span className="title-highlight"> sobrecupo médico </span>
            al instante
          </h1>
          
          {/* Descripción */}
          <p className="hero-description">
            Te conectamos con médicos disponibles hoy mismo. 
            Sin esperas, sin trámites complicados.
          </p>
          
          {/* Botones de acción */}
          <div className="hero-buttons">
            <AnimatedButton onClick={goToChat} primary large>
              <span className="button-icon">📱</span>
              <span className="button-text">Buscar sobrecupo</span>
            </AnimatedButton>
            
            <AnimatedButton onClick={() => scrollToSection('como-funciona')} secondary>
              <span className="button-text">¿Cómo funciona?</span>
              <span className="button-arrow">↓</span>
            </AnimatedButton>
          </div>
        </div>
        
        {/* Elementos decorativos animados */}
        <div className="hero-bg-elements" aria-hidden="true">
          <div className="floating-element element-1">🏥</div>
          <div className="floating-element element-2">⚕️</div>
          <div className="floating-element element-3">💊</div>
          <div className="floating-element element-4">🩹</div>
        </div>
      </section>

      {/* Sección: Cómo funciona */}
      <section id="como-funciona" className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">¿Cómo funciona?</h2>
            <p className="section-subtitle">En 3 simples pasos tienes tu cita médica</p>
          </div>
          
          <div className="steps-container">
            {[
              {
                number: "1",
                title: "Contacta por WhatsApp",
                description: "Envía un mensaje con tu especialidad médica necesaria",
                icon: "💬"
              },
              {
                number: "2", 
                title: "Te encontramos opciones",
                description: "Nuestro sistema busca sobrecupos disponibles para hoy",
                icon: "🔍"
              },
              {
                number: "3",
                title: "Confirmas y listo",
                description: "Recibes todos los detalles de tu cita confirmada",
                icon: "✅"
              }
            ].map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
                <div className="step-icon">{step.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección: Estadísticas */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            {[
              { number: "+500", label: "Pacientes atendidos" },
              { number: "24h", label: "Tiempo promedio" },
              { number: "15+", label: "Especialidades" }
            ].map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección: Testimonios */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">Lo que dicen nuestros pacientes</h2>
          
          <div className="testimonials-container">
            {[
              {
                text: "En solo 2 horas tenía mi cita con un cardiólogo. Increíble servicio.",
                author: "Carlos M.",
                location: "Santiago",
                avatar: "👨"
              },
              {
                text: "Mi hija necesitaba un pediatra urgente. Los contacté y en la tarde ya estábamos en consulta.",
                author: "María P.", 
                location: "Valparaíso",
                avatar: "👩"
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.avatar}</div>
                    <div className="author-info">
                      <div className="author-name">{testimonial.author}</div>
                      <div className="author-location">{testimonial.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección: Para médicos */}
      <section className="medicos-section">
        <div className="section-container">
          <div className="medicos-content">
            <div className="medicos-icon">👨‍⚕️</div>
            <h2 className="medicos-title">¿Eres médico?</h2>
            <p className="medicos-description">
              Únete a nuestra plataforma y monetiza tus sobrecupos. 
              Aumenta tu flujo de pacientes de manera inteligente.
            </p>
            <div className="medicos-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <span className="benefit-text">Ingresos adicionales</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📅</span>
                <span className="benefit-text">Gestión automática</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Panel de control</span>
              </div>
            </div>
            <div className="medicos-buttons">
              <AnimatedButton onClick={goToMedicoLogin} primary>
                <span className="button-icon">👨‍⚕️</span>
                Iniciar sesión
              </AnimatedButton>
              <AnimatedButton 
                onClick={() => window.open('https://wa.me/56912345678?text=Quiero%20registrarme%20como%20médico', '_blank')} 
                secondary
              >
                Registrarse
              </AnimatedButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="final-cta">
        <div className="section-container">
          <h2 className="cta-title">¿Listo para encontrar tu cita?</h2>
          <p className="cta-subtitle">
            Comienza ahora mismo y encuentra el sobrecupo que necesitas.
          </p>
          <div className="cta-buttons">
            <AnimatedButton onClick={goToChat} primary large>
              <span className="button-icon">📱</span>
              <span className="button-text">Buscar mi sobrecupo</span>
            </AnimatedButton>
            <AnimatedButton onClick={goToRegistro} secondary>
              <span className="button-icon">📝</span>
              <span className="button-text">Registrarme como paciente</span>
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
                Conectando pacientes con médicos disponibles al instante.
              </p>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4 className="footer-title">Pacientes</h4>
                <ul className="footer-links">
                  <li><button onClick={goToChat}>Buscar sobrecupos</button></li>
                  <li><button onClick={() => scrollToSection('como-funciona')}>Cómo funciona</button></li>
                  <li><button onClick={goToRegistro}>Registrarse</button></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-title">Médicos</h4>
                <ul className="footer-links">
                  <li><button onClick={goToMedicoLogin}>Iniciar sesión</button></li>
                  <li><button onClick={() => window.open('https://wa.me/56912345678?text=Quiero%20registrarme%20como%20médico', '_blank')}>Registrarse</button></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Sobrecupos AI. Todos los derechos reservados.
            </p>
            <div className="footer-legal">
              <button onClick={() => router.push('/terminos')}>Términos</button>
              <button onClick={() => router.push('/privacidad')}>Privacidad</button>
              <button onClick={() => window.open('https://wa.me/56912345678?text=Necesito%20ayuda', '_blank')}>Contacto</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Estilos integrados optimizados para iPhone */}
      <style jsx>{`
        /* Reset y base */
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f4ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          color: #1d1d1f;
          overflow-x: hidden;
          position: relative;
        }

        /* Header optimizado */
        .mobile-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding-top: env(safe-area-inset-top);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .logo-main {
          font-size: 20px;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }

        .logo-ai {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Botones animados */
        .animated-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 28px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          -webkit-tap-highlight-color: transparent;
          position: relative;
          overflow: hidden;
        }

        .animated-button:active {
          transform: scale(0.95);
        }

        .animated-button.primary {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          padding: 14px 32px;
          font-size: 16px;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
          min-width: 200px;
        }

        .animated-button.primary.large {
          padding: 16px 40px;
          font-size: 17px;
          min-width: 240px;
        }

        .animated-button.primary:active {
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
        }

        .animated-button.secondary {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          color: #007aff;
          border: 1px solid rgba(0, 122, 255, 0.2);
          padding: 12px 24px;
          font-size: 15px;
        }

        .animated-button.secondary:active {
          background: rgba(255, 255, 255, 0.9);
        }

        .nav-login-btn {
          background: rgba(0, 122, 255, 0.1);
          color: #007aff;
          border: 1px solid rgba(0, 122, 255, 0.2);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
        }

        .nav-login-btn:active {
          background: rgba(0, 122, 255, 0.15);
        }

        /* Hero Section */
        .hero-section {
          padding: 40px 16px 60px;
          text-align: center;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .hero-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-container {
          max-width: 380px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 122, 255, 0.15);
          border-radius: 24px;
          padding: 8px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 600;
          color: #007aff;
        }

        .hero-title {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .title-highlight {
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 17px;
          line-height: 1.4;
          color: #6e6e73;
          margin-bottom: 32px;
          font-weight: 400;
        }

        .hero-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .button-icon {
          font-size: 16px;
        }

        .button-arrow {
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        /* Elementos flotantes */
        .hero-bg-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          opacity: 0.1;
        }

        .floating-element {
          position: absolute;
          font-size: 24px;
          animation: float 6s ease-in-out infinite;
        }

        .element-1 { top: 20%; left: 15%; animation-delay: 0s; }
        .element-2 { top: 60%; right: 20%; animation-delay: 1s; }
        .element-3 { top: 80%; left: 20%; animation-delay: 2s; }
        .element-4 { top: 40%; right: 15%; animation-delay: 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        /* Secciones generales */
        .section-container {
          max-width: 380px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .section-title {
          font-size: 28px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 16px;
          color: #6e6e73;
          text-align: center;
          margin-bottom: 32px;
          font-weight: 400;
        }

        /* Cómo funciona */
        .how-it-works {
          padding: 60px 0;
          background: white;
        }

        .section-header {
          margin-bottom: 40px;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .step-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(248, 250, 255, 0.6);
          border: 1px solid rgba(0, 122, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border-radius: 50%;
          font-size: 16px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #1d1d1f;
        }

        .step-description {
          font-size: 14px;
          color: #6e6e73;
          line-height: 1.4;
        }

        .step-icon {
          font-size: 20px;
          opacity: 0.7;
        }

        /* Stats */
        .stats-section {
          padding: 50px 0;
          background: linear-gradient(135deg, #007aff, #5856d6);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          text-align: center;
        }

        .stat-item {
          color: white;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          opacity: 0.9;
          font-weight: 500;
        }

        /* Testimonials */
        .testimonials-section {
          padding: 60px 0;
          background: #fafbff;
        }

        .testimonials-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 32px;
        }

        .testimonial-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .testimonial-text {
          font-size: 15px;
          line-height: 1.5;
          color: #1d1d1f;
          margin-bottom: 16px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .author-name {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .author-location {
          font-size: 12px;
          color: #6e6e73;
        }

        /* Sección médicos */
        .medicos-section {
          padding: 60px 0;
          background: white;
        }

        .medicos-content {
          text-align: center;
        }

        .medicos-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .medicos-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .medicos-description {
          font-size: 16px;
          color: #6e6e73;
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .medicos-benefits {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(248, 250, 255, 0.6);
          border: 1px solid rgba(0, 122, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
        }

        .benefit-icon {
          font-size: 18px;
        }

        .benefit-text {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .medicos-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        /* CTA Final */
        .final-cta {
          padding: 60px 0;
          background: white;
          text-align: center;
        }

        .cta-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .cta-subtitle {
          font-size: 16px;
          color: #6e6e73;
          margin-bottom: 32px;
          line-height: 1.4;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        /* Footer */
        .footer {
          background: #1d1d1f;
          color: white;
          padding: 40px 0 20px;
        }

        .footer-container {
          max-width: 380px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .footer-content {
          margin-bottom: 32px;
        }

        .footer-section {
          margin-bottom: 24px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 12px;
        }

        .footer-logo .logo-main {
          font-size: 18px;
          font-weight: 800;
          color: white;
        }

        .footer-logo .logo-ai {
          font-size: 18px;
          font-weight: 800;
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-description {
          font-size: 14px;
          color: #a1a1a6;
          line-height: 1.4;
        }

        .footer-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .footer-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: white;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-links button {
          background: none;
          border: none;
          color: #a1a1a6;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          text-align: left;
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          font-family: inherit;
        }

        .footer-links button:active {
          color: #007aff;
        }

        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 16px;
          text-align: center;
        }

        .footer-copyright {
          font-size: 12px;
          color: #8e8e93;
          margin-bottom: 8px;
        }

        .footer-legal {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .footer-legal button {
          background: none;
          border: none;
          color: #8e8e93;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 0;
          font-family: inherit;
          -webkit-tap-highlight-color: transparent;
        }

        .footer-legal button:active {
          color: #007aff;
        }

        /* Media queries para diferentes iPhones */
        @media (max-width: 430px) {
          .hero-title {
            font-size: 28px;
          }
          
          .section-title {
            font-size: 24px;
          }

          .medicos-title,
          .cta-title {
            font-size: 24px;
          }
        }

        @media (max-width: 375px) {
          .section-container,
          .hero-container,
          .footer-container {
            max-width: 100%;
            padding: 0 12px;
          }

          .nav-container {
            padding: 10px 12px;
          }

          .logo-main,
          .logo-ai {
            font-size: 18px;
          }

          .hero-section {
            padding: 32px 12px 48px;
          }

          .hero-title {
            font-size: 26px;
          }

          .section-title {
            font-size: 22px;
          }

          .animated-button.primary {
            min-width: 180px;
            padding: 12px 24px;
            font-size: 15px;
          }

          .animated-button.primary.large {
            min-width: 200px;
            padding: 14px 32px;
            font-size: 16px;
          }
        }

        @media (max-width: 320px) {
          .nav-container {
            padding: 8px 10px;
          }

          .hero-section {
            padding: 24px 10px 40px;
          }

          .hero-title {
            font-size: 24px;
          }

          .section-title {
            font-size: 20px;
          }

          .steps-container {
            gap: 16px;
          }

          .step-card {
            padding: 16px;
          }

          .stats-grid {
            gap: 16px;
          }

          .stat-number {
            font-size: 28px;
          }

          .testimonials-container {
            gap: 12px;
          }

          .testimonial-card {
            padding: 16px;
          }
        }

        /* Mejoras específicas para iPhone Safari */
        @supports (-webkit-touch-callout: none) {
          .animated-button {
            -webkit-appearance: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }

          .hero-section,
          .how-it-works,
          .stats-section,
          .testimonials-section,
          .medicos-section,
          .final-cta {
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Soporte para notch y safe areas */
        @supports (padding: max(0px)) {
          .mobile-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }
          
          .footer {
            padding-bottom: max(20px, env(safe-area-inset-bottom));
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .landing-page {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #f2f2f7;
          }

          .mobile-header {
            background: rgba(0, 0, 0, 0.95);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .logo-main {
            color: #f2f2f7;
          }

          .nav-login-btn {
            background: rgba(0, 122, 255, 0.15);
            border-color: rgba(0, 122, 255, 0.3);
          }

          .how-it-works,
          .testimonials-section,
          .medicos-section,
          .final-cta {
            background: #1c1c1e;
          }

          .step-card,
          .testimonial-card {
            background: #2c2c2e;
            border-color: rgba(255, 255, 255, 0.1);
          }

          .hero-description,
          .section-subtitle,
          .step-description,
          .medicos-description,
          .cta-subtitle {
            color: #98989d;
          }

          .testimonial-text,
          .step-title,
          .benefit-text,
          .author-name {
            color: #f2f2f7;
          }

          .author-location {
            color: #98989d;
          }

          .author-avatar {
            background: #3a3a3c;
          }

          .benefit-item,
          .step-card {
            background: rgba(58, 58, 60, 0.3);
            border-color: rgba(255, 255, 255, 0.08);
          }
        }

        /* Animaciones reducidas para accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .hero-section,
          .floating-element,
          .animated-button {
            animation: none;
            transition: none;
          }

          .hero-section {
            opacity: 1;
            transform: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .mobile-header {
            border-bottom: 2px solid;
          }

          .animated-button {
            border: 2px solid currentColor;
          }

          .step-card,
          .testimonial-card,
          .benefit-item {
            border: 2px solid;
          }
        }
      `}</style>
    </div>
  )
}