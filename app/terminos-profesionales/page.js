'use client';
import { useRouter } from 'next/navigation';

export default function TerminosProfesionales() {
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
          
          <h1 className="legal-title">Términos y Condiciones para Profesionales</h1>
          <p className="legal-updated">Última actualización: 16 de agosto de 2025</p>

          <section className="legal-section">
            <h2>1. Aceptación de los Términos</h2>
            <p>Al registrarse y utilizar la plataforma Sobrecupos como profesional de la salud, usted acepta estos términos y condiciones en su totalidad. Estos términos constituyen un acuerdo legal vinculante entre usted y Sobrecupos.</p>
          </section>

          <section className="legal-section">
            <h2>2. Definiciones</h2>
            <ul>
              <li><strong>Profesional:</strong> Médico, especialista u otro profesional de la salud registrado</li>
              <li><strong>Sobrecupo:</strong> Cita médica adicional disponible en horarios específicos</li>
              <li><strong>Plataforma:</strong> El sistema tecnológico de Sobrecupos</li>
              <li><strong>Paciente:</strong> Usuario que solicita servicios médicos a través de la plataforma</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Requisitos y Elegibilidad</h2>
            
            <h3>3.1 Requisitos Profesionales</h3>
            <p>Para usar nuestra plataforma, usted debe:</p>
            <ul>
              <li>Poseer título profesional válido en ciencias de la salud</li>
              <li>Estar inscrito en el registro profesional correspondiente (Colegio Médico, etc.)</li>
              <li>Contar con licencia vigente para ejercer en Chile</li>
              <li>Mantener seguros de responsabilidad profesional actualizados</li>
              <li>Cumplir con todas las regulaciones sanitarias aplicables</li>
            </ul>

            <h3>3.2 Documentación Requerida</h3>
            <ul>
              <li>Título profesional certificado</li>
              <li>Certificado de registro profesional vigente</li>
              <li>Cédula de identidad o pasaporte</li>
              <li>Comprobante de seguro de responsabilidad civil</li>
              <li>Certificados de especialización (si aplica)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Servicios de la Plataforma</h2>
            
            <h3>4.1 Servicios Incluidos</h3>
            <p>Sobrecupos proporciona:</p>
            <ul>
              <li>Plataforma tecnológica para gestión de sobrecupos</li>
              <li>Sistema de reservas y confirmaciones automatizado</li>
              <li>Procesamiento seguro de pagos</li>
              <li>Comunicación con pacientes registrados</li>
              <li>Reportes y estadísticas de uso</li>
              <li>Soporte técnico especializado</li>
            </ul>

            <h3>4.2 Responsabilidades de Sobrecupos</h3>
            <ul>
              <li>Mantener la plataforma operativa y segura</li>
              <li>Procesar pagos de manera confiable</li>
              <li>Proteger la información personal y médica</li>
              <li>Proporcionar soporte técnico durante horarios establecidos</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Responsabilidades del Profesional</h2>
            
            <h3>5.1 Obligaciones Profesionales</h3>
            <ul>
              <li>Mantener los más altos estándares de atención médica</li>
              <li>Cumplir con todos los códigos de ética profesional</li>
              <li>Respetar la confidencialidad médico-paciente</li>
              <li>Mantener registros médicos apropiados</li>
              <li>Informar cambios en su estado profesional o licencias</li>
            </ul>

            <h3>5.2 Gestión de Sobrecupos</h3>
            <ul>
              <li>Publicar sobrecupos disponibles de manera oportuna y precisa</li>
              <li>Mantener actualizada su disponibilidad</li>
              <li>Confirmar o cancelar citas dentro de los plazos establecidos</li>
              <li>Notificar cambios de horario con la mayor anticipación posible</li>
              <li>Proporcionar atención médica de calidad a todos los pacientes</li>
            </ul>

            <h3>5.3 Comunicación con Pacientes</h3>
            <ul>
              <li>Responder de manera profesional y oportuna</li>
              <li>Proporcionar instrucciones claras sobre preparación para citas</li>
              <li>Mantener comunicación respetuosa en todo momento</li>
              <li>Usar únicamente canales oficiales de la plataforma</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Modelo de Ingresos y Pagos</h2>
            
            <h3>6.1 Estructura de Comisiones</h3>
            <p>Sobrecupos retiene una comisión del <strong>15%</strong> sobre la tarifa de gestión de $2.990 CLP por cada sobrecupo confirmado.</p>
            <ul>
              <li><strong>Tarifa al paciente:</strong> $2.990 CLP</li>
              <li><strong>Comisión Sobrecupos:</strong> $449 CLP (15%)</li>
              <li><strong>Pago al profesional:</strong> $2.541 CLP (85%)</li>
            </ul>

            <h3>6.2 Pagos y Facturación</h3>
            <ul>
              <li>Los pagos se procesan mensualmente</li>
              <li>Transferencia directa a cuenta bancaria registrada</li>
              <li>Documentos tributarios según normativa chilena</li>
              <li>Retenciones de impuestos cuando corresponda</li>
            </ul>

            <h3>6.3 Costos de Consulta</h3>
            <p><strong>Importante:</strong> Los honorarios por la consulta médica son establecidos y cobrados directamente por el profesional al paciente. Sobrecupos no interviene en esta transacción.</p>
          </section>

          <section className="legal-section">
            <h2>7. Cancelaciones y Reagendamiento</h2>
            
            <h3>7.1 Cancelaciones por el Profesional</h3>
            <ul>
              <li><strong>Más de 24 horas:</strong> Sin penalización</li>
              <li><strong>12-24 horas:</strong> Advertencia en el historial</li>
              <li><strong>Menos de 12 horas:</strong> Penalización del 50% de la comisión</li>
              <li><strong>Emergencias médicas:</strong> Exención de penalizaciones con justificación</li>
            </ul>

            <h3>7.2 No Presentación del Paciente</h3>
            <ul>
              <li>El profesional mantiene el 100% de la comisión</li>
              <li>Debe reportar la ausencia en la plataforma</li>
              <li>Documentar adecuadamente para registros</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Calidad y Estándares</h2>
            
            <h3>8.1 Evaluaciones de Pacientes</h3>
            <ul>
              <li>Los pacientes pueden calificar la experiencia</li>
              <li>Las calificaciones son visibles para futuros pacientes</li>
              <li>Calificaciones consistentemente bajas pueden resultar en revisión de cuenta</li>
            </ul>

            <h3>8.2 Monitoreo de Calidad</h3>
            <ul>
              <li>Sobrecupos se reserva el derecho de monitorear la calidad del servicio</li>
              <li>Investigación de quejas graves de pacientes</li>
              <li>Posible suspensión en casos de mala práctica</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Privacidad y Confidencialidad</h2>
            
            <h3>9.1 Protección de Datos</h3>
            <ul>
              <li>Cumplimiento estricto con leyes de protección de datos</li>
              <li>Información médica tratada con máxima confidencialidad</li>
              <li>Acceso limitado solo a personal autorizado</li>
              <li>Sistemas seguros de almacenamiento y transmisión</li>
            </ul>

            <h3>9.2 Obligaciones del Profesional</h3>
            <ul>
              <li>Mantener confidencialidad de información de pacientes</li>
              <li>No compartir datos fuera de la relación médico-paciente</li>
              <li>Usar información únicamente para propósitos médicos</li>
              <li>Reportar cualquier brecha de seguridad inmediatamente</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Limitaciones de Responsabilidad</h2>
            
            <h3>10.1 Responsabilidad de Sobrecupos</h3>
            <p>Sobrecupos no es responsable por:</p>
            <ul>
              <li>Diagnósticos, tratamientos o decisiones médicas</li>
              <li>Mala práctica médica o negligencia profesional</li>
              <li>Disputas entre profesionales y pacientes</li>
              <li>Problemas técnicos fuera de nuestro control</li>
              <li>Pérdidas de ingresos por interrupciones del servicio</li>
            </ul>

            <h3>10.2 Responsabilidad del Profesional</h3>
            <p>El profesional es completamente responsable por:</p>
            <ul>
              <li>La calidad y seguridad de la atención médica proporcionada</li>
              <li>Cumplimiento de regulaciones profesionales y sanitarias</li>
              <li>Mantenimiento de seguros profesionales adecuados</li>
              <li>Consecuencias de decisiones médicas y tratamientos</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>11. Terminación del Servicio</h2>
            
            <h3>11.1 Terminación por el Profesional</h3>
            <ul>
              <li>Puede terminar la relación con 30 días de aviso</li>
              <li>Debe cumplir con citas ya programadas</li>
              <li>Liquidación final de pagos pendientes</li>
            </ul>

            <h3>11.2 Terminación por Sobrecupos</h3>
            <p>Podemos terminar el servicio por:</p>
            <ul>
              <li>Violación de estos términos y condiciones</li>
              <li>Pérdida de licencia profesional</li>
              <li>Quejas graves o repetidas de pacientes</li>
              <li>Actividades fraudulentas o antiéticas</li>
              <li>Incumplimiento de estándares de calidad</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Propiedad Intelectual</h2>
            <ul>
              <li>La plataforma y su tecnología son propiedad de Sobrecupos</li>
              <li>El profesional conserva derechos sobre su información profesional</li>
              <li>Prohibido copiar, modificar o distribuir la tecnología</li>
              <li>Uso limitado únicamente para servicios autorizados</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>13. Ley Aplicable y Resolución de Disputas</h2>
            <ul>
              <li>Estos términos se rigen por las leyes de Chile</li>
              <li>Jurisdicción en tribunales de Santiago, Chile</li>
              <li>Mediación preferida antes de litigio</li>
              <li>Arbitraje para disputas comerciales cuando sea apropiado</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>14. Contacto y Soporte Profesional</h2>
            <p>Para consultas relacionadas con su cuenta profesional:</p>
            <div className="contact-info">
              <p><strong>Email profesionales:</strong> profesionales@sobrecupos.com</p>
              <p><strong>Soporte técnico:</strong> soporte@sobrecupos.com</p>
              <p><strong>Legal:</strong> legal@sobrecupos.com</p>
              <p><strong>Teléfono:</strong> +56 2 1234 5678</p>
              <p><strong>Horario:</strong> Lunes a Viernes, 8:00 - 18:00</p>
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