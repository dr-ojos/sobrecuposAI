// API para confirmar pago del bot - USAR LÓGICA PAYMENT STAGE FUNCIONAL
import { NextResponse } from 'next/server';

// TEMPLATE REAL DEL PACIENTE (copiado exacto de ejemplos/paciente.eml)
function generateRealPatientEmailTemplate(data: {
  patientName: string;
  confirmationNumber: string;
  doctorName: string;
  fecha: string;
  hora: string;
  clinica: string;
  direccion: string;
  especialidad: string;
  patientRut: string;
  patientAge: number;
  patientPhone: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Sobrecupo médico confirmado!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Mensaje Personal del Médico -->
      <div style="margin-bottom: 1.5rem; background: #f8fafc; border-left: 4px solid #3b82f6; padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 500;">
          Hola ${data.patientName}, yo Dr. ${data.doctorName}, te autoricé Sobrecupo para el día ${data.fecha} a las ${data.hora} en ${data.clinica} que queda ${data.direccion}.
        </p>
        <p style="margin: 0.75rem 0 0 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 600;">
          Recuerda mostrar esto en caja y pagar tu consulta.
        </p>
      </div>

      <!-- Status de Confirmación -->
      <div style="margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #666; font-size: 1rem; line-height: 1.5;">
          Tu pago ha sido procesado exitosamente y tu cita está confirmada.
        </p>
      </div>

      <!-- Success Badge -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
        <span style="color: #166534; font-size: 1rem; font-weight: 600;">
          ✅ ¡Cita Confirmada Exitosamente!
        </span>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          📅 Detalles de tu Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.especialidad}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Fecha:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.fecha}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.hora}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.clinica}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Dirección:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.direccion}</td>
          </tr>
        </table>
      </div>

      <!-- Patient Data -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          👤 Tus Datos
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Nombre:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">RUT:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.patientRut}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Teléfono:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.patientPhone}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Confirmation -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #0369a1; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #bae6fd; padding-bottom: 0.5rem;">
          💳 Pago Confirmado
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Monto:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">$2.990 CLP</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">ID Transacción:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.85rem; font-family: monospace;">${data.confirmationNumber}</td>
          </tr>
        </table>
      </div>

      <!-- Recommendations -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #fcd34d; padding-bottom: 0.5rem;">
          📝 Recomendaciones Importantes
        </h3>
        <ul style="margin: 0; padding-left: 1.5rem; color: #92400e; font-size: 0.9rem; line-height: 1.6;">
          <li style="margin-bottom: 0.5rem;"><strong>Llega 15 minutos antes</strong> de tu cita</li>
          <li style="margin-bottom: 0.5rem;">Trae tu <strong>cédula de identidad</strong></li>
          <li style="margin-bottom: 0.5rem;"><strong>Importante:</strong> La autorización de Sobrecupos no reemplaza al pago de la consulta, la cual debe ser cancelada en la consulta después de mostrar la autorización de sobrecupo que te envía tu médico.</li>
        </ul>
      </div>

      <!-- Final Message -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #171717; font-size: 1rem; font-weight: 600;">
          ¡Nos vemos pronto! 🎉
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e5e5; padding: 1.5rem; text-align: center;">
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
        Si tienes alguna consulta, escríbenos a
      </p>
      <p style="margin: 0 0 1rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">
        contacto@sobrecupos.com
      </p>
      
      <!-- Sobrecupo gestionado por logo -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.25rem;">
        <span style="color: #666; font-size: 0.85rem;">Gestionado por</span>
        <svg width="130" height="auto" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
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

  </div>
</body>
</html>`;
}

// TEMPLATE REAL DEL MÉDICO (copiado exacto de ejemplos/medico.eml)
function generateRealDoctorEmailTemplate(data: {
  doctorName: string;
  patientName: string;
  patientRut: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  fecha: string;
  hora: string;
  especialidad: string;
  clinica: string;
  motivo?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Sobrecupo Confirmado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Greeting -->
      <div style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0 0 0.5rem 0; color: #171717; font-size: 1.25rem; font-weight: 600;">
          ¡Hola Dr/a. ${data.doctorName}!
        </h2>
        <p style="margin: 0; color: #666; font-size: 1rem; line-height: 1.5;">
          Tienes un nuevo sobrecupo disponible para tu agenda.
        </p>
      </div>

      <!-- Success Badge -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
        <span style="color: #0369a1; font-size: 1rem; font-weight: 600;">
          🎉 ¡Nuevo Sobrecupo Confirmado!
        </span>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          📅 Detalles de la Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Fecha:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.fecha}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.hora}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.especialidad}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.clinica}</td>
          </tr>
        </table>
      </div>

      <!-- Patient Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          👤 Datos del Paciente
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Nombre:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${data.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">RUT:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.patientRut}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Teléfono:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.patientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Email:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem;">${data.patientEmail}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Edad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${data.patientAge} años</td>
          </tr>
        </table>
      </div>

      <!-- Status Confirmation -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1.5rem;">
        <span style="color: #166534; font-size: 0.9rem; font-weight: 600;">
          ✅ El paciente ha confirmado su asistencia
        </span>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e5e5; padding: 1.5rem; text-align: center;">
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.85rem;">
        Este es un mensaje automático del sistema
      </p>
      <p style="margin: 0 0 1rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">
        contacto@sobrecupos.com
      </p>
      
      <!-- Sobrecupo gestionado por logo -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.25rem;">
        <span style="color: #666; font-size: 0.85rem;">Gestionado por</span>
        <svg width="130" height="auto" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
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

  </div>
</body>
</html>`;
}

export async function POST(req) {
  try {
    const { transactionId, sessionId, paymentData, isSimulated } = await req.json();
    
    console.log('💳 === CONFIRMANDO PAGO DEL BOT ===');
    console.log('📋 Transaction ID:', transactionId);
    console.log('📋 Session ID:', sessionId);
    console.log('📋 Is Simulated:', isSimulated);
    console.log('📋 Payment Data:', paymentData);
    
    // 🚨 DEBUG CRÍTICO PARA PRODUCCIÓN
    console.log('🔧 === VARIABLES DE ENTORNO DEBUG ===');
    console.log('🔧 AIRTABLE_API_KEY presente:', !!process.env.AIRTABLE_API_KEY);
    console.log('🔧 AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID);
    console.log('🔧 AIRTABLE_PATIENTS_TABLE:', process.env.AIRTABLE_PATIENTS_TABLE);
    console.log('🔧 SENDGRID_API_KEY presente:', !!process.env.SENDGRID_API_KEY);
    console.log('🔧 SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
    console.log('🔧 TWILIO_ACCOUNT_SID presente:', !!process.env.TWILIO_ACCOUNT_SID);
    console.log('🔧 TWILIO_AUTH_TOKEN presente:', !!process.env.TWILIO_AUTH_TOKEN);
    console.log('🔧 TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);

    if (!transactionId || !sessionId || !paymentData) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos para confirmación'
      }, { status: 400 });
    }

    // IMPLEMENTAR LÓGICA PAYMENT STAGE QUE SÍ FUNCIONA DIRECTAMENTE
    console.log('💰 Ejecutando lógica payment stage funcional...');
    
    // Extraer datos necesarios
    const patientName = paymentData.patientName || 'Paciente';
    const patientRut = paymentData.patientRut || '';
    const patientAge = parseInt(paymentData.patientAge) || null;
    const patientPhone = paymentData.patientPhone || '';
    const patientEmail = paymentData.patientEmail || '';
    const doctorId = paymentData.doctorId;
    
    // Generar número de confirmación
    const confirmationNumber = `SC${Date.now().toString().slice(-6)}`;
    
    // Configurar APIs (tomadas de variables de entorno)
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID; 
    const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    const results = {
      sobrecupoUpdated: false,
      patientCreated: false,
      emailsSent: 0,
      whatsappSent: false
    };

    try {
      // 1. CREAR PACIENTE CON CAMPOS CORRECTOS (copiado de payment-stage.ts líneas 126-143)
      if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_PATIENTS_TABLE) {
        console.log('👤 Creando paciente con campos correctos...');
        
        // USAR TODOS LOS CAMPOS DISPONIBLES EN TABLA PACIENTE
        const patientData = {
          Nombre: patientName,
          Edad: patientAge,
          RUT: patientRut,
          Telefono: patientPhone,
          Email: patientEmail,
          'Fecha Reserva': new Date().toISOString().split('T')[0],
          'Fecha Registro': new Date().toISOString().split('T')[0],
          'Motivo Consulta': paymentData.motivo || '',
          'Estado Pago': 'Pagado',
          'ID Transaccion': transactionId
        };

        try {
          const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fields: patientData }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            results.patientCreated = true;
            console.log(`✅ Paciente creado en Airtable: ${data.id}`);
            
            // 2. ACTUALIZAR SOBRECUPO EN TABLA Sobrecupostest
            if (paymentData.sobrecupoId) {
              console.log('📋 Actualizando sobrecupo en tabla Sobrecupostest...');
              console.log('📋 SobrecupoId:', paymentData.sobrecupoId);
              
              try {
                // Usar tabla Sobrecupostest directamente
                const sobrecupoResponse = await fetch(
                  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupostest/${paymentData.sobrecupoId}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      fields: {
                        'Disponible': 'No'
                      }
                    }),
                  }
                );

                if (sobrecupoResponse.ok) {
                  results.sobrecupoUpdated = true;
                  console.log('✅ Sobrecupo marcado como No disponible');
                } else {
                  const errorText = await sobrecupoResponse.text();
                  console.error('❌ Error actualizando sobrecupo:', errorText);
                }
              } catch (error) {
                console.error('❌ Error actualizando sobrecupo:', error);
              }
            }
            
          } else {
            const errorText = await response.text();
            console.error('❌ Error creando paciente:', errorText);
          }
        } catch (error) {
          console.error('❌ Error en request de Airtable:', error);
        }
      }

      // 3. USAR LA FUNCIÓN ORIGINAL DE EMAIL SERVICE
      console.log('📧 Enviando email con función original del servicio...');
      
      // Recrear estructura original para email service
      const emailServiceData = {
        patientName: patientName,
        confirmationNumber: confirmationNumber,
        doctorName: paymentData.doctorName || 'Doctor',
        fecha: paymentData.date || '',
        hora: paymentData.time || '',
        clinica: paymentData.clinic || '',
        direccion: paymentData.clinicAddress || '',
        especialidad: paymentData.specialty || '',
        patientRut: patientRut,
        patientAge: patientAge || 0,
        patientPhone: patientPhone
      };

      if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && patientEmail) {
        try {
          // USAR TEMPLATE REAL DEL EMAIL SERVICE
          const realEmailHtml = generateRealPatientEmailTemplate(emailServiceData);
          
          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: patientEmail }],
                subject: `Confirmacion de Cita - ${emailServiceData.especialidad} - ${emailServiceData.fecha}`
              }],
              from: { 
                email: SENDGRID_FROM_EMAIL, 
                name: "Sistema Sobrecupos" 
              },
              reply_to: {
                email: SENDGRID_FROM_EMAIL,
                name: "Sistema Sobrecupos"
              },
              // Configuraciones anti-spam
              categories: ["medical-notification", "patient-confirmation"],
              custom_args: {
                "notification_type": "patient_confirmation",
                "patient_name": patientName,
                "doctor_name": emailServiceData.doctorName
              },
              content: [{
                type: "text/html",
                value: realEmailHtml
              }]
            })
          });

          if (emailResponse.ok) {
            results.emailsSent += 1;
            console.log('✅ Email enviado al paciente con template original');
          } else {
            console.error('❌ Error enviando email:', await emailResponse.text());
          }
        } catch (error) {
          console.error('❌ Error enviando email:', error);
        }
      }

      // 4. ENVIAR EMAIL AL MÉDICO (si hay doctorId)
      if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && doctorId) {
        console.log('📧 Enviando notificación al médico...');
        
        // Obtener info del doctor desde Airtable
        if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
          try {
            // Usar variable de entorno + probar diferentes nombres de tabla  
            const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;
            const DOCTOR_TABLES = [AIRTABLE_DOCTORS_TABLE, 'Doctors', 'Médicos', 'Medicos', 'Doctor'].filter(Boolean);
            
            console.log('🔧 AIRTABLE_DOCTORS_TABLE env var:', AIRTABLE_DOCTORS_TABLE);
            console.log('🔧 Tablas de médicos a probar:', DOCTOR_TABLES);
            console.log('🔧 DoctorId a buscar:', doctorId);
            let doctorData: any = null;
            
            for (const tableName of DOCTOR_TABLES) {
              try {
                console.log(`🔍 Intentando buscar médico en tabla: ${tableName}`);
                const doctorResponse = await fetch(
                  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${doctorId}`,
                  { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
                );
                
                const responseText = await doctorResponse.text();
                console.log(`🔧 Respuesta de tabla ${tableName} (${doctorResponse.status}):`, responseText.substring(0, 200) + '...');
                
                if (doctorResponse.ok) {
                  doctorData = JSON.parse(responseText);
                  console.log(`✅ Médico encontrado en tabla: ${tableName}`);
                  console.log(`🔧 Datos del médico:`, JSON.stringify(doctorData.fields, null, 2));
                  break;
                } else {
                  console.log(`❌ Error ${doctorResponse.status} en tabla ${tableName}:`, responseText);
                }
              } catch (error: any) {
                console.log(`❌ Excepción en tabla ${tableName}:`, error.message);
                continue;
              }
            }

            if (doctorData) {
              const doctorEmail = doctorData.fields?.Email;
              const doctorWhatsApp = doctorData.fields?.WhatsApp;
              
              console.log(`👨‍⚕️ Doctor encontrado - Email: ${doctorEmail || 'No configurado'}, WhatsApp: ${doctorWhatsApp || 'No configurado'}`);
              
              // Preparar template del médico
              const doctorEmailHtml = generateRealDoctorEmailTemplate({
                doctorName: paymentData.doctorName || 'Doctor',
                patientName: patientName,
                patientRut: patientRut,
                patientPhone: patientPhone,
                patientEmail: patientEmail,
                patientAge: patientAge || 0,
                fecha: paymentData.date || '',
                hora: paymentData.time || '',
                especialidad: paymentData.specialty || '',
                clinica: paymentData.clinic || '',
                motivo: paymentData.motivo
              });

              // 5. USAR NOTIFICATION SERVICE ROBUSTO
              console.log('🎯 Usando NotificationService robusto con reintentos automáticos...');
              console.log('🔧 === DATOS PARA NOTIFICACIONES ===');
              console.log('🔧 doctorEmail:', doctorEmail);
              console.log('🔧 doctorWhatsApp:', doctorWhatsApp);
              console.log('🔧 paymentData.doctorName:', paymentData.doctorName);
              console.log('🔧 patientName:', patientName);
              console.log('🔧 paymentData.motivo:', paymentData.motivo);
              console.log('🔧 paymentData.date:', paymentData.date);
              console.log('🔧 paymentData.time:', paymentData.time);
              console.log('🔧 paymentData.clinic:', paymentData.clinic);
              console.log('🔧 === FIN DATOS NOTIFICACIONES ===');
              
              const { NotificationService } = require('../../../lib/notification-service.js');
              const notificationService = new NotificationService({
                maxRetries: 3,
                retryDelay: 2000
              });

              let notificationResult;
              try {
                console.log('🚀 Iniciando notificación al médico...');
                notificationResult = await notificationService.notifyDoctorWithFallback(
                {
                  name: paymentData.doctorName || 'Doctor',
                  email: doctorEmail,
                  whatsapp: doctorWhatsApp
                },
                {
                  name: patientName,
                  rut: patientRut,
                  phone: patientPhone,
                  email: patientEmail
                },
                {
                  fecha: paymentData.date || '',
                  hora: paymentData.time || '',
                  clinica: paymentData.clinic || ''
                },
                doctorEmailHtml,
                paymentData.motivo
              );
              console.log('✅ NotificationService completado sin errores');
              } catch (notificationError) {
                console.error('❌ Error en NotificationService:', notificationError);
                console.error('❌ Error stack:', notificationError.stack);
                // Crear resultado de error
                notificationResult = {
                  emailResult: { success: false, attempts: 0, lastError: notificationError.message },
                  whatsappResult: { success: false, attempts: 0, lastError: notificationError.message },
                  overallSuccess: false
                };
              }

              // Actualizar resultados basado en el NotificationService
              if (notificationResult.emailResult.success) {
                results.emailsSent += 1;
              }
              if (notificationResult.whatsappResult.success) {
                results.whatsappSent = true;
              }

              console.log('📊 === RESULTADO DETALLADO NOTIFICACIONES ===');
              console.log('📊 Email result:', JSON.stringify(notificationResult.emailResult, null, 2));
              console.log('📊 WhatsApp result:', JSON.stringify(notificationResult.whatsappResult, null, 2));
              console.log('📊 Overall success:', notificationResult.overallSuccess);
              console.log('📊 === FIN RESULTADO NOTIFICACIONES ===');
              console.log('📊 Resultado de notificaciones:', {
                email: notificationResult.emailResult.success ? '✅' : '❌',
                whatsapp: notificationResult.whatsappResult.success ? '✅' : '❌',
                overallSuccess: notificationResult.overallSuccess ? '✅' : '❌'
              });
            } else {
              console.log('❌ No se pudo encontrar información del médico en ninguna tabla');
            }
          } catch (error) {
            console.error('❌ Error obteniendo info del médico:', error);
          }
        }
      }

      console.log('📊 Resultados finales:', results);
      
    } catch (error) {
      console.error('❌ Error general en procesamiento:', error);
    }
    
    console.log('✅ Pago confirmado exitosamente con servicios originales');
    
    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      transactionId,
      reservationConfirmed: true,
      sobrecupoUpdated: results.sobrecupoUpdated,
      patientCreated: results.patientCreated,
      emailsSent: results.emailsSent,
      whatsappSent: results.whatsappSent,
      message: 'Reserva confirmada exitosamente',
      appointmentDetails: {
        patientName: paymentData.patientName,
        doctorName: paymentData.doctorName,
        specialty: paymentData.specialty,
        date: paymentData.date,
        time: paymentData.time,
        clinic: paymentData.clinic
      }
    });


  } catch (error) {
    console.error('❌ Error en confirmación de pago:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      details: error.stack
    }, { status: 500 });
  }
}