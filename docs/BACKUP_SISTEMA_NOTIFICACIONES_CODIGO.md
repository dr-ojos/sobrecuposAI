# 🛡️ BACKUP COMPLETO DEL CÓDIGO - SISTEMA NOTIFICACIONES MÉDICAS

> **Propósito**: Respaldo del código completo del sistema en caso de corrupción  
> **Fecha**: 24 de Agosto 2025  
> **Archivo fuente**: `/app/api/payment/confirm/route.ts` (líneas 836-1200+)

## 📋 INSTRUCCIONES DE RESTAURACIÓN

Si el código se corrompe, copiar y pegar la sección completa en el archivo:
`/Users/joseandrespena/SobrecuposIA/app/api/payment/confirm/route.ts`

**Ubicación exacta**: Después de la línea que contiene el primer `try {` del bloque principal de notificaciones, buscar:
```javascript
// INTEGRACIÓN NUEVA: Sistema profesional de notificaciones médicas (EMBEBIDO)
```

## 🔧 CÓDIGO COMPLETO DEL SISTEMA

```typescript
      // INTEGRACIÓN NUEVA: Sistema profesional de notificaciones médicas (EMBEBIDO)
      try {
        console.log('🚀 === INICIANDO SISTEMA PROFESIONAL DE NOTIFICACIONES MÉDICAS ===');
        
        // Sistema profesional SIEMPRE ACTIVO - sin variables adicionales requeridas
        const FEATURE_ENABLED = true; // Siempre activo
        const SANDBOX_MODE = process.env.NODE_ENV !== 'production'; // Auto-detectar modo
        
        console.log('🔧 Sistema profesional: SIEMPRE ACTIVO');
        console.log('🔧 Sandbox mode (auto):', SANDBOX_MODE);
        
        // Buscar datos del médico para el sistema profesional
        let professionalDoctorEmail: string | null = null;
        let professionalDoctorWhatsApp: string | null = null;
        
        // Extraer datos del médico directamente para el sistema profesional
        console.log('🔧 Extrayendo datos del médico para sistema profesional');
        
        try {
          let realDoctorId = paymentData.doctorId || '';
          
          if (paymentData.sobrecupoId) {
            const sobrecupoResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${paymentData.sobrecupoId}`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            if (sobrecupoResponse.ok) {
              const sobrecupoData = await sobrecupoResponse.json();
              const extractedDoctorId = sobrecupoData.fields?.Médico?.[0];
              if (extractedDoctorId) realDoctorId = extractedDoctorId;
            }
          }
          
          if (realDoctorId) {
            const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;
            const doctorResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${realDoctorId}`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            
            if (doctorResponse.ok) {
              const doctorData = await doctorResponse.json();
              professionalDoctorEmail = doctorData.fields?.Email || null;
              professionalDoctorWhatsApp = doctorData.fields?.WhatsApp || null;
              console.log('🔧 Doctor extraído para sistema profesional:', professionalDoctorEmail);
            }
          }
        } catch (extractionError: any) {
          console.warn('⚠️ Error extrayendo médico para sistema profesional:', extractionError.message);
        }
        
        console.log('🔧 Doctor email disponible:', !!professionalDoctorEmail);
        console.log('🔧 Doctor WhatsApp disponible:', !!professionalDoctorWhatsApp);
        
        if (professionalDoctorEmail) {
          console.log('📧 Enviando notificación profesional al médico:', professionalDoctorEmail);
          
          // Formatear fecha y hora profesional
          const appointmentDateTime = `${paymentData.date} ${paymentData.time}`;
          const bookingUrl = `https://sobrecupos-ai-esb7.vercel.app/booking/${transactionId}`;
          
          // Email profesional al médico usando plantilla de ejemplos/medico.eml
          const professionalEmailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Sobrecupo Confirmado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  ${SANDBOX_MODE ? '<div style="background: #ff6b6b; color: white; padding: 10px; text-align: center; font-weight: bold; margin-bottom: 20px;">🧪 MODO SANDBOX - EMAIL DE PRUEBA</div>' : ''}
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Greeting -->
      <div style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0 0 0.5rem 0; color: #171717; font-size: 1.25rem; font-weight: 600;">
          ¡Hola Dr/a. ${paymentData.doctorName || 'Doctor'}!
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
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${appointmentDateTime}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${paymentData.time || 'No especificada'}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${paymentData.specialty || 'No especificada'}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${paymentData.clinic || 'No especificada'}</td>
          </tr>
          ${paymentData.amount ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Precio:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">$${paymentData.amount}</td>
          </tr>` : ''}
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
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${patientName}</td>
          </tr>
          ${patientRut ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">RUT:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientRut}</td>
          </tr>` : ''}
          ${patientPhone ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Teléfono:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientPhone}</td>
          </tr>` : ''}
          ${patientEmail ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Email:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem;">${patientEmail}</td>
          </tr>` : ''}
          ${patientAge ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Edad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientAge} años</td>
          </tr>` : ''}
          ${paymentData.motivo ? `<tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Motivo:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${paymentData.motivo}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Status Confirmation -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1.5rem;">
        <span style="color: #166534; font-size: 0.9rem; font-weight: 600;">
          ✅ El paciente ha confirmado su asistencia
        </span>
        <br><small style="color: #666; font-size: 0.8rem;">Booking ID: ${transactionId}</small>
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
          </g>
        </svg>
      </div>
    </div>

  </div>
</body>
</html>`;

          // Enviar email profesional con reintentos
          let professionalEmailSent = false;
          const recipientEmail = SANDBOX_MODE ? 'joseandres@outlook.com' : professionalDoctorEmail; // En sandbox siempre a tu email
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`📧 Sistema profesional - Intento ${attempt}/3 al médico: ${recipientEmail}`);
              
              const professionalEmailPayload = {
                personalizations: [{
                  to: [{ email: recipientEmail }],
                  subject: `🏥 Nueva Reserva Confirmada - ${patientName} - ${appointmentDateTime}`
                }],
                from: {
                  email: SENDGRID_FROM_EMAIL,
                  name: "Sistema Profesional Sobrecupos"
                },
                content: [{
                  type: "text/html",
                  value: professionalEmailHtml
                }],
                categories: ["doctor-notification-professional"],
                custom_args: {
                  booking_id: transactionId,
                  system: "professional",
                  sandbox_mode: SANDBOX_MODE.toString(),
                  attempt: attempt.toString()
                }
              };

              const professionalEmailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(professionalEmailPayload)
              });

              if (professionalEmailResponse.ok) {
                console.log('✅ Sistema profesional: Email al médico enviado');
                professionalEmailSent = true;
                break;
              } else {
                const errorText = await professionalEmailResponse.text();
                console.error(`❌ Sistema profesional - Error email intento ${attempt}:`, professionalEmailResponse.status, errorText);
                
                if (professionalEmailResponse.status < 500 && attempt === 3) {
                  console.error('❌ Sistema profesional: Error permanente en email, abandonando reintentos');
                  break;
                }
              }
            } catch (emailError: any) {
              console.error(`❌ Sistema profesional - Error envío email intento ${attempt}:`, emailError.message);
            }
            
            if (attempt < 3) {
              const delay = Math.pow(5, attempt) * 200;
              console.log(`⏳ Sistema profesional - Esperando ${delay}ms antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        // 2. WHATSAPP PROFESIONAL AL MÉDICO
        if (professionalDoctorWhatsApp) {
          console.log('📱 Enviando WhatsApp profesional al médico:', professionalDoctorWhatsApp);
          
          let professionalWhatsAppSent = false;
          const recipientWhatsApp = SANDBOX_MODE ? '+56912345678' : professionalDoctorWhatsApp; // En sandbox a número de testing
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`📱 Sistema profesional - WhatsApp intento ${attempt}/3 al médico: ${recipientWhatsApp}`);
              
              const professionalWhatsAppMessage = `🏥 *NUEVA RESERVA CONFIRMADA*

Dr/a. ${paymentData.doctorName || 'Doctor'}
Paciente: ${patientName}
📅 ${paymentData.date} ${paymentData.time}
🏥 ${paymentData.clinic || 'Clínica no especificada'}
💰 $${paymentData.amount || '2990'}

✅ Pago confirmado y paciente registrado
📋 Booking: ${transactionId}

${paymentData.motivo ? `📝 Motivo: ${paymentData.motivo}` : ''}

_Sistema Automático Sobrecupos_`;

              const professionalWhatsAppPayload = {
                from: TWILIO_WHATSAPP_NUMBER,
                to: recipientWhatsApp,
                body: professionalWhatsAppMessage
              };

              const professionalWhatsAppResponse = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams(professionalWhatsAppPayload).toString()
                }
              );

              if (professionalWhatsAppResponse.ok) {
                console.log('✅ Sistema profesional: WhatsApp al médico enviado');
                professionalWhatsAppSent = true;
                break;
              } else {
                const errorText = await professionalWhatsAppResponse.text();
                console.error(`❌ Sistema profesional - Error WhatsApp intento ${attempt}:`, professionalWhatsAppResponse.status, errorText);
                
                if (professionalWhatsAppResponse.status < 500 && attempt === 3) {
                  console.error('❌ Sistema profesional: Error permanente en WhatsApp, abandonando reintentos');
                  break;
                }
              }
            } catch (whatsappError: any) {
              console.error(`❌ Sistema profesional - Error envío WhatsApp intento ${attempt}:`, whatsappError.message);
            }
            
            if (attempt < 3) {
              const delay = Math.pow(5, attempt) * 200;
              console.log(`⏳ Sistema profesional - Esperando ${delay}ms antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        console.log('🏁 Sistema profesional completado:', {
          emailAvailable: !!professionalDoctorEmail,
          whatsappAvailable: !!professionalDoctorWhatsApp,
          emailSent: professionalEmailSent,
          whatsappSent: professionalWhatsAppSent,
          sandbox: SANDBOX_MODE
        });
        
      } catch (professionalSystemError: any) {
        console.error('❌ Error crítico en sistema profesional de notificaciones médicas:', professionalSystemError);
      }
      // FIN SISTEMA PROFESIONAL DE NOTIFICACIONES MÉDICAS
```

## 🚨 PUNTOS CRÍTICOS DE RESTAURACIÓN

### 1. **Ubicación Exacta**
El código debe ir **DESPUÉS** de la línea que dice:
```javascript
// INTEGRACIÓN NUEVA: Sistema profesional de notificaciones médicas (EMBEBIDO)
```

### 2. **Variables Requeridas**
Asegurar que estas variables estén disponibles en el contexto:
```javascript
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Y las variables del pago:
const { transactionId, sessionId, paymentData } = req.json();
const { patientName, patientRut, patientEmail, patientAge, patientPhone } = paymentData;
```

### 3. **Compilación TypeScript**
Después de restaurar el código, ejecutar:
```bash
npm run build
```

### 4. **Testing Inmediato**
Para verificar que funciona:
```bash
curl -X POST https://sobrecupos-ai-esb7.vercel.app/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "RESTORE_TEST", "sessionId": "test", "paymentData": {"sobrecupoId": "recFj7aKdC9zBDwxu", "patientName": "Test Restore", "doctorName": "Dr. Test"}}'
```

## 📝 NOTAS ADICIONALES

- **Modo Sandbox**: Se activa automáticamente en desarrollo (`NODE_ENV !== 'production'`)
- **Emails en Sandbox**: Van a `joseandres@outlook.com`
- **WhatsApp en Sandbox**: Van a `+56912345678`
- **Logs**: Buscar `🚀 === INICIANDO SISTEMA PROFESIONAL ===` en Vercel Functions

---

**Este backup fue creado automáticamente por**: Claude Code  
**Fecha**: 24 de Agosto 2025  
**Versión**: Sistema Profesional v1.0 con plantilla actualizada