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
          <h2>Encuentra tu Sobrecupo médico</h2>
          <p className="subtitle">
            Más tiempo <strong>Sano</strong>, menos tiempo <strong>enfermo</strong>.
          </p>
          <p className="cta-text">
            <strong>Chatea conmigo y encuentra un sobrecupo.</strong>
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

        {/* Testimonial más prominente y moderno */}
        <div className={`testimonial ${isVisible ? 'visible' : ''}`}>
          <div className="testimonial-content">
            <p>"Increíble. Encontré oftalmólogo en 2 minutos cuando llevaba días buscando."</p>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍💼</div>
              <div className="author-info">
                <span className="author-name">María José</span>
                <span className="author-location">Santiago, Chile</span>
              </div>
            </div>
          </div>
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

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
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
            #c8ddff 100%);
          background-size: 400% 400%;
          animation: subtleShift 25s ease infinite;
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
          font-size: 1.5rem;
          opacity: 0.04;
          animation: gentleFloat 8s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
        }

        .element-1 { top: 15%; right: 20%; animation-delay: 0s; }
        .element-2 { bottom: 20%; left: 15%; animation-delay: 3s; }
        .element-3 { top: 45%; left: 25%; animation-delay: 6s; }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.04; }
          50% { transform: translateY(-15px) rotate(2deg); opacity: 0.08; }
        }

        .content-wrapper {
          text-align: center;
          max-width: 800px;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        .logo-container {
          margin-bottom: 3.5rem;
          opacity: 0;
          transform: translateY(40px) scale(0.95);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
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
          top: -15px;
          left: -15px;
          right: -15px;
          bottom: -15px;
          background: linear-gradient(45deg, #007aff, #5856d6, #34c759, #007aff);
          border-radius: 30px;
          opacity: 0.12;
          filter: blur(30px);
          animation: logoGlow 5s ease-in-out infinite;
        }

        @keyframes logoGlow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.02); }
        }

        .logo-text {
          position: relative;
          background: linear-gradient(135deg, #1d1d1f 0%, #515154 50%, #1d1d1f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 4.5rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .logo-ai {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 50%, #007aff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tagline {
          margin-bottom: 3.5rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tagline h2 {
          font-size: 2.8rem;
          font-weight: 800;
          color: #1d1d1f;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .subtitle {
          font-size: 1.4rem;
          color: #424245;
          line-height: 1.5;
          font-weight: 300;
          margin-bottom: 1.5rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .subtitle strong {
          color: #1d1d1f;
          font-weight: 600;
        }

        .cta-text {
          font-size: 1.3rem;
          color: #1d1d1f;
          font-weight: 600;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .cta-section {
          margin-bottom: 4rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          text-align: center;
          position: relative;
        }

        .cta-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .highlight {
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .testimonial {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.9s;
        }

        .testimonial.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .testimonial-content {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 28px;
          padding: 2.5rem 2rem;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          position: relative;
        }

        .testimonial-content::before {
          content: '"';
          position: absolute;
          top: 1.2rem;
          left: 1.8rem;
          font-size: 2.5rem;
          color: #007aff;
          opacity: 0.3;
          font-family: Georgia, serif;
        }

        .testimonial-content p {
          color: #1d1d1f;
          font-size: 1.2rem;
          font-style: italic;
          margin-bottom: 1.5rem;
          line-height: 1.6;
          font-weight: 300;
          padding-left: 1rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .author-avatar {
          font-size: 2rem;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        .author-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .author-name {
          color: #1d1d1f;
          font-weight: 400;
          font-size: 1rem;
        }

        .author-location {
          color: #6e6e73;
          font-size: 0.9rem;
          font-weight: 300;
        }

        .trust-indicator {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 1.2s;
        }

        .trust-indicator.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .trust-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 20px;
          padding: 1.5rem 2rem;
          box-shadow: 0 8px 25px rgba(0,0,0,0.05);
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 1.8rem;
          font-weight: 800;
          color: #007aff;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: #6e6e73;
          font-weight: 300;
          margin-top: 0.2rem;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .stat-divider {
          color: #c6c6c8;
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .logo-text {
            font-size: 3rem;
          }
          
          .tagline h2 {
            font-size: 2.2rem;
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

          .cta-section {
            margin-bottom: 3rem;
            padding: 0 1rem;
          }

          .trust-stats {
            flex-direction: column;
            gap: 1rem;
            margin: 0 1rem;
            padding: 1.2rem 1.5rem;
          }

          .stat-divider {
            display: none;
          }

          .testimonial-content {
            margin: 0 1rem;
            padding: 2rem 1.5rem;
          }

          .content-wrapper {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .logo-text {
            font-size: 2.5rem;
          }
          
          .tagline h2 {
            font-size: 1.9rem;
            line-height: 1.1;
          }
          
          .subtitle {
            font-size: 1.1rem;
          }
          
          .cta-text {
            font-size: 1rem;
          }

          .testimonial-content {
            padding: 1.8rem 1.2rem;
          }

          .trust-stats {
            padding: 1rem 1.2rem;
          }
        }
      `}</style>
    </main>
  );
}

// Botón CTA mejorado y más prominente
function AnimatedButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`animated-btn ${primary ? 'primary' : ''}`}
    >
      {children}
      <style jsx>{`
        .animated-btn {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: white;
          border: none;
          padding: 1.5rem 3rem;
          font-size: 1.3rem;
          font-weight: 700;
          border-radius: 50px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 8px 30px rgba(0, 122, 255, 0.3);
          text-decoration: none;
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
          transform: scale(1);
          min-width: 280px;
          justify-content: center;
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

        /* Desktop: centrado normal */
        @media (min-width: 769px) {
          .animated-btn {
            margin: 0 auto;
            display: inline-flex;
          }
        }

        /* Tablet */
        @media (max-width: 768px) and (min-width: 481px) {
          .animated-btn {
            margin: 0 auto;
            display: inline-flex;
            width: auto;
          }
        }

        /* Mobile: centrado absoluto */
        @media (max-width: 480px) {
          .animated-btn {
            width: 85vw;
            max-width: 320px;
            min-width: 280px;
            padding: 1.2rem 2rem;
            font-size: 1.2rem;
            border-radius: 25px;
            gap: 0.8rem;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            margin: 0;
          }
        }

        @media (max-width: 375px) {
          .animated-btn {
            width: 82vw;
            max-width: 300px;
            min-width: 260px;
            padding: 1.1rem 1.8rem;
            font-size: 1.1rem;
            border-radius: 23px;
          }
        }

        @media (max-width: 320px) {
          .animated-btn {
            width: 80vw;
            max-width: 280px;
            min-width: 240px;
            padding: 1rem 1.5rem;
            font-size: 1rem;
            border-radius: 20px;
          }
        }

        .animated-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
        }

        .animated-btn:hover::before {
          left: 100%;
        }

        .animated-btn:active {
          transform: translateY(-2px) scale(0.98);
        }

        /* Hover específico para móvil */
        @media (max-width: 480px) {
          .animated-btn:hover {
            transform: translateX(-50%) translateY(-4px) scale(1.02);
          }

          .animated-btn:active {
            transform: translateX(-50%) translateY(-2px) scale(0.98);
          }
        }

        .button-icon, .button-arrow {
          transition: transform 0.3s ease;
        }

        .animated-btn:hover .button-arrow {
          transform: translateX(6px);
        }

        .animated-btn:hover .button-icon {
          transform: scale(1.1);
        }
      `}</style>
    </button>
  );
}