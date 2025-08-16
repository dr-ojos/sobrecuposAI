'use client';
import { useRouter } from 'next/navigation';

export default function TerminosPacientes() {
  const router = useRouter();

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="legal-container">
      
      {/* Header */}
      <header className="legal-header">
        <div className="header-content">
          <button onClick={handleBackClick} className="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-logo">
            <svg className="logo-svg" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
                <path fill="#dc2626" d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z"/>
                <path fill="#171717" d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z"/>
                <path fill="#171717" d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z"/>
                <path fill="#171717" d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
                <path fill="#171717" d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z"/>
                <path fill="#171717" d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z"/>
                <path fill="#171717" d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
                <path fill="#171717" d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z"/>
                <path fill="#171717" d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z"/>
                <path fill="#171717" d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z"/>
                <path fill="#171717" d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z"/>
              </g>
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="legal-content">
        <div className="legal-wrapper">
          
          <h1 className="legal-title">Términos y Condiciones para Pacientes</h1>
          <p className="legal-updated">Última actualización: 16 de agosto de 2025</p>

          <section className="legal-section">
            <h2>1. Aceptación de los Términos</h2>
            <p>Al utilizar los servicios de Sobrecupos, usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo con algún aspecto de estos términos, no debe utilizar nuestros servicios.</p>
          </section>

          <section className="legal-section">
            <h2>2. Descripción del Servicio</h2>
            <p>Sobrecupos es una plataforma digital que conecta pacientes con profesionales de la salud para:</p>
            <ul>
              <li>Facilitar la reserva de sobrecupos médicos disponibles</li>
              <li>Proporcionar acceso rápido a atención médica especializada</li>
              <li>Procesar pagos de manera segura</li>
              <li>Coordinar citas entre pacientes y profesionales</li>
            </ul>
            <p><strong>Importante:</strong> Sobrecupos es un intermediario tecnológico. No somos un prestador de servicios médicos ni reemplazamos la relación médico-paciente.</p>
          </section>

          <section className="legal-section">
            <h2>3. Registro y Cuenta de Usuario</h2>
            
            <h3>3.1 Requisitos de Registro</h3>
            <ul>
              <li>Ser mayor de 18 años o contar con autorización de un tutor legal</li>
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de sus credenciales</li>
              <li>Notificar inmediatamente cualquier uso no autorizado</li>
            </ul>

            <h3>3.2 Responsabilidades del Usuario</h3>
            <ul>
              <li>Mantener actualizada su información personal y médica</li>
              <li>Usar la plataforma de manera responsable y ética</li>
              <li>Respetar a los profesionales de la salud y otros usuarios</li>
              <li>No compartir información falsa o engañosa</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Reserva de Sobrecupos</h2>
            
            <h3>4.1 Proceso de Reserva</h3>
            <ul>
              <li>Las reservas están sujetas a disponibilidad</li>
              <li>Se requiere pago completo al momento de la reserva</li>
              <li>La confirmación se enviará por correo electrónico</li>
              <li>El paciente debe presentarse con identificación válida</li>
            </ul>

            <h3>4.2 Tarifa de Gestión</h3>
            <p>Al reservar un sobrecupo, usted acepta pagar una tarifa de gestión de <strong>$2.990 CLP</strong> que cubre:</p>
            <ul>
              <li>Coordinación con el profesional médico</li>
              <li>Gestión de la reserva y confirmación</li>
              <li>Soporte técnico de la plataforma</li>
              <li>Procesamiento seguro de pagos</li>
            </ul>
            <p><strong>Nota importante:</strong> Esta tarifa NO incluye el costo de la consulta médica, que debe ser pagada directamente en la clínica o consultorio.</p>
          </section>

          <section className="legal-section">
            <h2>5. Pagos y Facturación</h2>
            
            <h3>5.1 Métodos de Pago</h3>
            <p>Aceptamos los siguientes métodos de pago seguros:</p>
            <ul>
              <li>Tarjetas de crédito (Visa, MasterCard, American Express)</li>
              <li>Tarjetas de débito</li>
              <li>Otros métodos según disponibilidad regional</li>
            </ul>

            <h3>5.2 Política de Reembolsos</h3>
            <ul>
              <li><strong>Cancelación con 24+ horas:</strong> Reembolso completo</li>
              <li><strong>Cancelación con 12-24 horas:</strong> Reembolso del 50%</li>
              <li><strong>Cancelación con menos de 12 horas:</strong> Sin reembolso</li>
              <li><strong>No presentación (No-show):</strong> Sin reembolso</li>
            </ul>
            <p>Los reembolsos se procesan en 5-10 días hábiles al método de pago original.</p>
          </section>

          <section className="legal-section">
            <h2>6. Cancelaciones y Reagendamiento</h2>
            
            <h3>6.1 Cancelaciones por el Paciente</h3>
            <ul>
              <li>Puede cancelar a través de la plataforma o contactando soporte</li>
              <li>Se aplican las políticas de reembolso mencionadas anteriormente</li>
              <li>Debe proporcionar un motivo válido para la cancelación</li>
            </ul>

            <h3>6.2 Cancelaciones por el Profesional</h3>
            <ul>
              <li>En caso de emergencia o fuerza mayor</li>
              <li>Reembolso completo garantizado</li>
              <li>Asistencia para encontrar alternativas disponibles</li>
              <li>Notificación inmediata al paciente</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Responsabilidades y Limitaciones</h2>
            
            <h3>7.1 Limitaciones de Responsabilidad</h3>
            <p>Sobrecupos no es responsable por:</p>
            <ul>
              <li>La calidad o resultados de la atención médica recibida</li>
              <li>Diagnósticos, tratamientos o decisiones médicas</li>
              <li>Cancelaciones de último minuto por parte del profesional</li>
              <li>Problemas técnicos fuera de nuestro control</li>
              <li>Daños indirectos o consecuenciales</li>
            </ul>

            <h3>7.2 Responsabilidades del Paciente</h3>
            <ul>
              <li>Llegar puntualmente a la cita programada</li>
              <li>Traer documentación médica relevante</li>
              <li>Informar sobre alergias o condiciones importantes</li>
              <li>Seguir las instrucciones del profesional de salud</li>
              <li>Pagar los costos de consulta directamente al prestador</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Privacidad y Confidencialidad</h2>
            <p>Su privacidad es fundamental para nosotros:</p>
            <ul>
              <li>Cumplimos con todas las leyes de protección de datos aplicables</li>
              <li>Su información médica es tratada con estricta confidencialidad</li>
              <li>Solo compartimos datos necesarios para coordinar su atención</li>
              <li>Consulte nuestra <a href="/privacidad">Política de Privacidad</a> para más detalles</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Uso Aceptable</h2>
            <p>Está prohibido:</p>
            <ul>
              <li>Usar la plataforma para fines ilegales o no autorizados</li>
              <li>Interferir con el funcionamiento del sistema</li>
              <li>Crear múltiples cuentas para el mismo usuario</li>
              <li>Compartir credenciales de acceso con terceros</li>
              <li>Realizar reservas falsas o fraudulentas</li>
              <li>Acosar o amenazar a otros usuarios o profesionales</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Terminación del Servicio</h2>
            <p>Podemos suspender o terminar su acceso si:</p>
            <ul>
              <li>Viola estos términos y condiciones</li>
              <li>Proporciona información falsa o engañosa</li>
              <li>Realiza actividades fraudulentas</li>
              <li>No cumple con los pagos acordados</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>11. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados con al menos 30 días de anticipación a través de nuestra plataforma o por correo electrónico.</p>
          </section>

          <section className="legal-section">
            <h2>12. Ley Aplicable y Jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de Chile. Cualquier disputa será resuelta en los tribunales competentes de Santiago, Chile.</p>
          </section>

          <section className="legal-section">
            <h2>13. Contacto y Soporte</h2>
            <p>Para consultas sobre estos términos o nuestros servicios:</p>
            <div className="contact-info">
              <p><strong>Email de soporte:</strong> soporte@sobrecupos.com</p>
              <p><strong>Email legal:</strong> legal@sobrecupos.com</p>
              <p><strong>Teléfono:</strong> +56 2 1234 5678</p>
              <p><strong>Horario de atención:</strong> Lunes a Viernes, 8:00 - 18:00</p>
            </div>
          </section>

        </div>
      </main>

      <style jsx>{`
        .legal-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .legal-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: #f9f9f9;
          border-color: #d1d5db;
        }

        .header-logo {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .logo-svg {
          width: 120px;
          height: auto;
          max-width: 100%;
        }

        .legal-content {
          padding: 2rem;
        }

        .legal-wrapper {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 3rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .legal-title {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.5rem 0;
          text-align: center;
        }

        .legal-updated {
          text-align: center;
          color: #666;
          font-size: 0.9rem;
          margin: 0 0 2rem 0;
          font-style: italic;
        }

        .legal-section {
          margin-bottom: 2rem;
        }

        .legal-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .legal-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 1.5rem 0 0.75rem 0;
        }

        .legal-section p {
          color: #555;
          line-height: 1.6;
          margin: 0 0 1rem 0;
        }

        .legal-section ul {
          margin: 0 0 1rem 0;
          padding-left: 1.5rem;
        }

        .legal-section li {
          color: #555;
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }

        .contact-info {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .contact-info p {
          margin: 0.5rem 0;
          color: #333;
        }

        strong {
          color: #171717;
          font-weight: 600;
        }

        a {
          color: #dc2626;
          text-decoration: none;
          font-weight: 500;
        }

        a:hover {
          text-decoration: underline;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .legal-content {
            padding: 1rem;
          }

          .legal-wrapper {
            padding: 2rem 1.5rem;
          }

          .legal-title {
            font-size: 1.75rem;
          }

          .header-content {
            padding: 0 1rem;
          }

          .logo-svg {
            width: 100px;
          }
        }

        @media (max-width: 480px) {
          .legal-wrapper {
            padding: 1.5rem 1rem;
          }

          .legal-title {
            font-size: 1.5rem;
          }

          .logo-svg {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}