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
            <div className="logo-svg-container">
              <svg width="500" height="206" viewBox="0 0 1000 413" className="main-logo-svg">
                <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
                  {/* Corazón en rojo */}
                  <path d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z" fill="#dc2626"/>
                  {/* Texto en negro */}
                  <path d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z" fill="#171717"/>
                  <path d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z" fill="#171717"/>
                  <path d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z" fill="#171717"/>
                  <path d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z" fill="#171717"/>
                  <path d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z" fill="#171717"/>
                  <path d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z" fill="#171717"/>
                  <path d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z" fill="#171717"/>
                  <path d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z" fill="#171717"/>
                  <path d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z" fill="#171717"/>
                  <path d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z" fill="#171717"/>
                </g>
              </svg>
            </div>
          </div>

          <div className={`tagline ${isVisible ? 'visible' : ''}`}>
            <p className="subtitle">
              <strong>Más tiempo sano, </strong>  menos tiempo enfermo.
            </p>
          </div>

          {/* Chat section - Minimalista */}
          <div className={`chat-container ${isVisible ? 'visible' : ''} ${chatExpanding ? 'expanding' : ''}`}>
            <div className="chat-wrapper">
              <div className="chat-section">
                <h1 className="main-chat-title">No encuentras hora médica, entonces pide aquí tu Sobrecupo médico</h1>
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
                        const maxHeight = window.innerWidth <= 480 ? 70 : window.innerWidth <= 768 ? 80 : 120;
                        e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
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
              <p>Te mostramos Sobrecupos disponibles</p>
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
          <h2 className="section-title">Por qué elegir Sobrecupos</h2>
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
              <svg className="logo-svg" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
                  <path fill="#dc2626" d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z"/>
                  <path fill="#ffffff" d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z"/>
                  <path fill="#ffffff" d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z"/>
                  <path fill="#ffffff" d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
                  <path fill="#ffffff" d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z"/>
                  <path fill="#ffffff" d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z"/>
                  <path fill="#ffffff" d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
                  <path fill="#ffffff" d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z"/>
                  <path fill="#ffffff" d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z"/>
                  <path fill="#ffffff" d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z"/>
                  <path fill="#ffffff" d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z"/>
                </g>
              </svg>
            </div>
            <div className="footer-links">
              <a href="/chat">Buscar</a>
              <a href="/auth/signin">Login Médicos</a>
              <a href="mailto:contacto@sobrecupos.com">Contacto</a>
            </div>
            <div className="footer-legal">
              <a href="/privacidad">Política de Privacidad</a>
              <a href="/terminos-pacientes">Términos Pacientes</a>
              <a href="/terminos-profesionales">Términos Profesionales</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Sobrecupos</p>
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
          max-width: 680px;
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

        .logo-svg-container {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          margin-left: -20px;
        }

        .main-logo-svg {
          transition: opacity 0.2s ease;
        }

        .main-logo-svg:hover {
          opacity: 0.9;
        }

        .tagline {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;
          margin-bottom: 8.5rem;
          margin-top: -4rem;
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
          font-size: 1.6rem;
          color: #171717;
          font-weight: 300;
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 1.5rem;
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

        .main-chat-title {
          font-size: 1.1rem;
          font-weight: 100;
          color: #171717;
          text-align: center;
          margin-bottom: 1.5rem;
          margin-top: 0;
          line-height: 1.3;
          letter-spacing: -0.3px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .chat-title {
          font-size: 1rem;
          font-weight: 400;
          color: #666;
          text-align: center;
          margin-bottom: 1rem;
          margin-top: 0;
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
          border-radius: 24px;
          padding: 1rem;
          min-height: 80px;
          transition: all 0.3s ease;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
          margin: 0 auto;
          max-width: 100%;
        }

        .input-wrapper:focus-within {
          border-color: #171717;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 0 0 1px #171717;
          transform: translateY(-1px);
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
          -webkit-appearance: none;
          -webkit-border-radius: 0;
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
          background: #666;
          border: 1px solid #666;
          border-radius: 16px;
          padding: 0.75rem 1.5rem;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(102, 102, 102, 0.2);
        }

        .explore-button:hover {
          background: #555;
          border-color: #555;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 102, 102, 0.3);
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
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-logo .logo-svg {
          width: 120px;
          height: auto;
          max-width: 100%;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
          justify-content: center;
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

        .footer-legal {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .footer-legal a {
          color: #999;
          text-decoration: none;
          font-size: 0.8rem;
          transition: color 0.2s ease;
        }

        .footer-legal a:hover {
          color: #ccc;
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
            padding: 1.5rem 0.75rem;
            min-height: 100vh;
          }
          
          .content-wrapper {
            max-width: 100%;
            padding: 0;
            width: 100%;
          }
          
          .logo-container {
            margin-bottom: 2rem;
            padding: 0 0.5rem;
          }
          
          .main-logo-svg {
            width: 400px;
            height: 165px;
          }
          
          .tagline {
            margin-bottom: 4rem;
            padding: 0 0.5rem;
          }
          
          .subtitle {
            font-size: 1.2rem;
            line-height: 1.3;
            margin-bottom: 1.25rem;
          }
          
          .chat-container {
            margin-bottom: 2rem;
            padding: 0 0.25rem;
          }
          
          .input-wrapper {
            padding: 0.875rem;
            min-height: 70px;
            margin: 0;
            border-radius: 20px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03);
          }
          
          .chat-input {
            font-size: 16px;
            max-height: 80px;
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
          .hero-section {
            padding: 1rem 0.5rem;
            min-height: 100vh;
          }
          
          .content-wrapper {
            max-width: 100%;
            padding: 0;
            width: 100%;
          }
          
          .logo-container {
            margin-bottom: 1.5rem;
            padding: 0 0.5rem;
          }
          
          .main-logo-svg {
            width: 350px;
            height: 145px;
          }
          
          .tagline {
            margin-bottom: 3.5rem;
            padding: 0 0.5rem;
          }
          
          .tagline h1 {
            font-size: 0.9rem;
            margin-bottom: 0.8rem;
          }
          
          .subtitle {
            font-size: 1rem;
            line-height: 1.25;
            margin-bottom: 1rem;
          }
          
          .main-chat-title {
            font-size: 1rem;
            margin-bottom: 1.2rem;
            line-height: 1.25;
            padding: 0 0.5rem;
            font-weight: 100;
          }

          .chat-title {
            font-size: 0.95rem;
            margin-bottom: 1rem;
            line-height: 1.3;
            padding: 0;
          }
          
          .chat-container {
            padding: 0 0.25rem;
          }
          
          .input-wrapper {
            padding: 0.75rem;
            min-height: 65px;
            margin: 0 0.25rem;
            border-radius: 18px;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03);
          }
          
          .chat-input {
            font-size: 16px;
            min-height: 40px;
            max-height: 70px;
            -webkit-appearance: none;
            -webkit-border-radius: 0;
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
          
          .main-chat-title {
            font-size: 0.9rem;
            margin-bottom: 1rem;
            line-height: 1.2;
            padding: 0 0.25rem;
            font-weight: 100;
          }

          .chat-title {
            font-size: 0.875rem;
          }
          
          .input-wrapper {
            min-height: 70px;
          }
          
          .chat-input {
            font-size: 16px;
            min-height: 40px;
            max-height: 70px;
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

        @media (max-width: 360px) {
          .hero-section {
            padding: 0.75rem 0.25rem;
            min-height: 100vh;
          }
          
          .content-wrapper {
            padding: 0;
            width: 100%;
          }
          
          .logo-container {
            margin-bottom: 1.25rem;
            padding: 0 0.25rem;
          }
          
          .main-logo-svg {
            width: 280px;
            height: 116px;
          }
          
          .tagline {
            margin-bottom: 3rem;
            padding: 0 0.25rem;
          }
          
          .tagline h1 {
            font-size: 0.8rem;
            margin-bottom: 0.6rem;
          }
          
          .subtitle {
            font-size: 0.85rem;
            line-height: 1.2;
            margin-bottom: 0.75rem;
          }
          
          .main-chat-title {
            font-size: 0.8rem;
            margin-bottom: 0.8rem;
            line-height: 1.15;
            padding: 0 0.25rem;
            font-weight: 100;
          }

          .chat-title {
            font-size: 0.85rem;
            margin-bottom: 0.8rem;
            padding: 0;
          }
          
          .chat-container {
            padding: 0 0.25rem;
          }
          
          .input-wrapper {
            padding: 0.75rem;
            min-height: 60px;
            margin: 0 0.125rem;
            border-radius: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
          }
          
          .chat-input {
            font-size: 16px;
            min-height: 36px;
            max-height: 60px;
            -webkit-appearance: none;
            -webkit-border-radius: 0;
          }
          
          .send-button {
            width: 28px;
            height: 28px;
            bottom: 0.75rem;
            right: 0.75rem;
          }
          
          .suggestion-pill {
            font-size: 0.75rem;
            padding: 0.35rem 0.7rem;
          }
          
          .suggestions-container {
            padding: 0 0.25rem;
          }

          .footer-links {
            flex-direction: column;
            gap: 1rem;
          }

          .footer-legal {
            flex-direction: column;
            gap: 0.75rem;
            text-align: center;
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