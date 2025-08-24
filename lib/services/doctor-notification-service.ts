// Servicio profesional de notificaciones médicas con idempotencia y reintentos
// Respeta convenciones existentes del proyecto SobrecuposIA

export interface DoctorNotificationPayload {
  bookingId: string;
  doctorName: string;
  doctorEmail?: string;
  doctorWhatsApp?: string;
  appointmentDateTime: string;
  appointmentTimezone: string;
  patientName: string;
  patientRut?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  specialty: string;
  clinicName: string;
  pricePaid: string;
  notes?: string;
  bookingUrl?: string;
}

interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  attempts: number;
  errors: string[];
  messageIds: string[];
}

interface NotificationLog {
  bookingId: string;
  doctorNotifiedAt: Date;
  emailSent: boolean;
  whatsappSent: boolean;
  attempts: number;
}

export class DoctorNotificationService {
  private readonly FEATURE_ENABLED = process.env.FEATURE_NOTIFY_DOCTOR === 'true';
  private readonly SANDBOX_MODE = process.env.NOTIFY_SANDBOX === '1';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 25000]; // 1s, 5s, 25s

  // Cache de notificaciones para idempotencia (en producción usar Redis/DB)
  private notificationLogs = new Map<string, NotificationLog>();

  constructor() {
    console.log('🔧 DoctorNotificationService initialized', {
      featureEnabled: this.FEATURE_ENABLED,
      sandboxMode: this.SANDBOX_MODE
    });
  }

  /**
   * Entrada principal: notificar al médico sobre una reserva confirmada
   * Implementa idempotencia usando bookingId como clave
   */
  async notifyDoctor(payload: DoctorNotificationPayload): Promise<NotificationResult> {
    const logPrefix = `[NOTIFY-DOCTOR:${payload.bookingId}]`;
    
    console.log(`${logPrefix} 🚀 Iniciando notificación médica`);
    console.log(`${logPrefix} Doctor: ${payload.doctorName} (${payload.doctorEmail}, ${payload.doctorWhatsApp})`);
    console.log(`${logPrefix} Paciente: ${payload.patientName} - ${payload.appointmentDateTime}`);

    // Validar feature flag
    if (!this.FEATURE_ENABLED) {
      console.log(`${logPrefix} ⚠️ Feature deshabilitada (FEATURE_NOTIFY_DOCTOR=false)`);
      return {
        success: false,
        emailSent: false,
        whatsappSent: false,
        attempts: 0,
        errors: ['Feature NOTIFY_DOCTOR deshabilitada'],
        messageIds: []
      };
    }

    // Verificar idempotencia
    const existingLog = this.notificationLogs.get(payload.bookingId);
    if (existingLog) {
      console.log(`${logPrefix} ✅ Ya notificado previamente`, existingLog);
      return {
        success: true,
        emailSent: existingLog.emailSent,
        whatsappSent: existingLog.whatsappSent,
        attempts: existingLog.attempts,
        errors: [],
        messageIds: []
      };
    }

    // Validaciones previas
    const validationErrors = this.validatePayload(payload);
    if (validationErrors.length > 0) {
      console.error(`${logPrefix} ❌ Errores de validación:`, validationErrors);
      return {
        success: false,
        emailSent: false,
        whatsappSent: false,
        attempts: 0,
        errors: validationErrors,
        messageIds: []
      };
    }

    // Ejecutar notificaciones con reintentos
    const result = await this.executeNotifications(payload, logPrefix);

    // Registrar log para idempotencia (éxito parcial o total)
    if (result.emailSent || result.whatsappSent) {
      this.notificationLogs.set(payload.bookingId, {
        bookingId: payload.bookingId,
        doctorNotifiedAt: new Date(),
        emailSent: result.emailSent,
        whatsappSent: result.whatsappSent,
        attempts: result.attempts
      });
      console.log(`${logPrefix} ✅ Log de notificación guardado`);
    }

    console.log(`${logPrefix} 🏁 Notificación completada:`, {
      success: result.success,
      emailSent: result.emailSent,
      whatsappSent: result.whatsappSent,
      attempts: result.attempts
    });

    return result;
  }

  /**
   * Ejecutar notificaciones con política de reintentos
   */
  private async executeNotifications(payload: DoctorNotificationPayload, logPrefix: string): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      emailSent: false,
      whatsappSent: false,
      attempts: 0,
      errors: [],
      messageIds: []
    };

    // Intentar email si está disponible
    if (payload.doctorEmail) {
      const emailResult = await this.sendEmailWithRetry(payload, logPrefix);
      result.emailSent = emailResult.success;
      result.attempts = Math.max(result.attempts, emailResult.attempts);
      if (emailResult.messageId) result.messageIds.push(emailResult.messageId);
      if (emailResult.error) result.errors.push(`Email: ${emailResult.error}`);
    }

    // Intentar WhatsApp si está disponible
    if (payload.doctorWhatsApp) {
      const whatsappResult = await this.sendWhatsAppWithRetry(payload, logPrefix);
      result.whatsappSent = whatsappResult.success;
      result.attempts = Math.max(result.attempts, whatsappResult.attempts);
      if (whatsappResult.messageId) result.messageIds.push(whatsappResult.messageId);
      if (whatsappResult.error) result.errors.push(`WhatsApp: ${whatsappResult.error}`);
    }

    result.success = result.emailSent || result.whatsappSent;
    return result;
  }

  /**
   * Envío de email con reintentos y backoff exponencial
   */
  private async sendEmailWithRetry(payload: DoctorNotificationPayload, logPrefix: string): Promise<{success: boolean, attempts: number, error?: string, messageId?: string}> {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return {
        success: false,
        attempts: 0,
        error: 'Credenciales SendGrid no configuradas'
      };
    }

    const recipientEmail = this.SANDBOX_MODE ? 
      (process.env.SANDBOX_EMAIL || 'test@example.com') : 
      payload.doctorEmail!;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      console.log(`${logPrefix} 📧 Intento ${attempt}/${this.MAX_RETRIES} - Email a ${recipientEmail}`);

      try {
        const emailPayload = {
          personalizations: [{
            to: [{ email: recipientEmail }],
            subject: `🏥 Nueva Reserva Confirmada - ${payload.patientName} - ${payload.appointmentDateTime}`
          }],
          from: {
            email: SENDGRID_FROM_EMAIL,
            name: "Sistema Sobrecupos"
          },
          content: [{
            type: "text/html",
            value: this.generateDoctorEmailTemplate(payload)
          }],
          categories: ["doctor-notification"],
          custom_args: {
            booking_id: payload.bookingId,
            notification_type: "doctor_confirmation",
            sandbox_mode: this.SANDBOX_MODE.toString()
          }
        };

        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload)
        });

        if (response.ok) {
          const messageId = response.headers.get('X-Message-Id');
          console.log(`${logPrefix} ✅ Email enviado exitosamente (MessageID: ${messageId})`);
          return {
            success: true,
            attempts: attempt,
            messageId: messageId || undefined
          };
        }

        const errorText = await response.text();
        console.warn(`${logPrefix} ⚠️ Email falló intento ${attempt}: ${response.status} - ${errorText}`);

        // Errores 4xx son permanentes, no reintentar
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            attempts: attempt,
            error: `Error permanente ${response.status}: ${errorText}`
          };
        }

        // Esperar antes del siguiente intento (backoff exponencial)
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAYS[attempt - 1]);
        }

      } catch (error: any) {
        console.warn(`${logPrefix} ⚠️ Excepción en email intento ${attempt}:`, error.message);
        if (attempt === this.MAX_RETRIES) {
          return {
            success: false,
            attempts: attempt,
            error: `Excepción después de ${this.MAX_RETRIES} intentos: ${error.message}`
          };
        }
        await this.sleep(this.RETRY_DELAYS[attempt - 1]);
      }
    }

    return {
      success: false,
      attempts: this.MAX_RETRIES,
      error: `Falló después de ${this.MAX_RETRIES} intentos`
    };
  }

  /**
   * Envío de WhatsApp con reintentos
   */
  private async sendWhatsAppWithRetry(payload: DoctorNotificationPayload, logPrefix: string): Promise<{success: boolean, attempts: number, error?: string, messageId?: string}> {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      return {
        success: false,
        attempts: 0,
        error: 'Credenciales Twilio no configuradas'
      };
    }

    const recipientPhone = this.SANDBOX_MODE ? 
      (process.env.SANDBOX_PHONE || '+56912345678') : 
      this.normalizePhoneNumber(payload.doctorWhatsApp!);

    const fromNumber = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    const toNumber = `whatsapp:${recipientPhone}`;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      console.log(`${logPrefix} 📱 Intento ${attempt}/${this.MAX_RETRIES} - WhatsApp desde ${fromNumber} hacia ${toNumber}`);

      try {
        const message = this.generateWhatsAppMessage(payload);
        const whatsappPayload = {
          From: fromNumber,
          To: toNumber,
          Body: message
        };

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(whatsappPayload).toString()
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`${logPrefix} ✅ WhatsApp enviado exitosamente (SID: ${result.sid})`);
          return {
            success: true,
            attempts: attempt,
            messageId: result.sid
          };
        }

        const errorText = await response.text();
        console.warn(`${logPrefix} ⚠️ WhatsApp falló intento ${attempt}: ${response.status} - ${errorText}`);

        // Errores 4xx son permanentes
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            attempts: attempt,
            error: `Error permanente ${response.status}: ${errorText}`
          };
        }

        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAYS[attempt - 1]);
        }

      } catch (error: any) {
        console.warn(`${logPrefix} ⚠️ Excepción en WhatsApp intento ${attempt}:`, error.message);
        if (attempt === this.MAX_RETRIES) {
          return {
            success: false,
            attempts: attempt,
            error: `Excepción después de ${this.MAX_RETRIES} intentos: ${error.message}`
          };
        }
        await this.sleep(this.RETRY_DELAYS[attempt - 1]);
      }
    }

    return {
      success: false,
      attempts: this.MAX_RETRIES,
      error: `Falló después de ${this.MAX_RETRIES} intentos`
    };
  }

  /**
   * Validar payload antes del envío
   */
  private validatePayload(payload: DoctorNotificationPayload): string[] {
    const errors: string[] = [];

    if (!payload.bookingId) errors.push('bookingId requerido');
    if (!payload.doctorName) errors.push('doctorName requerido');
    if (!payload.patientName) errors.push('patientName requerido');
    if (!payload.appointmentDateTime) errors.push('appointmentDateTime requerido');
    if (!payload.specialty) errors.push('specialty requerido');
    if (!payload.clinicName) errors.push('clinicName requerido');

    // Al menos un canal de notificación
    if (!payload.doctorEmail && !payload.doctorWhatsApp) {
      errors.push('Se require al menos doctorEmail o doctorWhatsApp');
    }

    // Validar email
    if (payload.doctorEmail && !this.isValidEmail(payload.doctorEmail)) {
      errors.push(`Email inválido: ${payload.doctorEmail}`);
    }

    // Validar phone
    if (payload.doctorWhatsApp && !this.isValidPhone(payload.doctorWhatsApp)) {
      errors.push(`Teléfono inválido: ${payload.doctorWhatsApp}`);
    }

    return errors;
  }

  /**
   * Template de email HTML para el médico
   */
  private generateDoctorEmailTemplate(payload: DoctorNotificationPayload): string {
    const sandboxBanner = this.SANDBOX_MODE ? `
    <div style="background: #ff6b6b; color: white; padding: 10px; text-align: center; font-weight: bold;">
      🧪 MODO SANDBOX - ESTE ES UN EMAIL DE PRUEBA
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Reserva Confirmada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    ${sandboxBanner}
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #dc2626; margin: 0 0 10px 0;">🏥 Nueva Reserva Confirmada</h1>
        <p style="margin: 0; font-size: 18px; font-weight: bold;">Dr/a. ${payload.doctorName}</p>
        <p style="margin: 5px 0 0 0; color: #666;">Booking ID: ${payload.bookingId}</p>
    </div>
    
    <div style="background: white; padding: 20px; border: 2px solid #dc2626; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">📅 Detalles de la Cita</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Fecha y Hora:</td><td>${payload.appointmentDateTime} (${payload.appointmentTimezone})</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Especialidad:</td><td>${payload.specialty}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Clínica:</td><td>${payload.clinicName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Precio Pagado:</td><td>$${payload.pricePaid}</td></tr>
            ${payload.notes ? `<tr><td style="padding: 8px 0; font-weight: bold;">Notas:</td><td>${payload.notes}</td></tr>` : ''}
        </table>
    </div>
    
    <div style="background: white; padding: 20px; border: 2px solid #059669; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #059669; margin-top: 0;">👤 Datos del Paciente</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Nombre:</td><td>${payload.patientName}</td></tr>
            ${payload.patientRut ? `<tr><td style="padding: 8px 0; font-weight: bold;">RUT:</td><td>${payload.patientRut}</td></tr>` : ''}
            ${payload.patientPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Teléfono:</td><td>${payload.patientPhone}</td></tr>` : ''}
            ${payload.patientEmail ? `<tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${payload.patientEmail}</td></tr>` : ''}
            ${payload.patientAge ? `<tr><td style="padding: 8px 0; font-weight: bold;">Edad:</td><td>${payload.patientAge} años</td></tr>` : ''}
        </table>
    </div>
    
    ${payload.bookingUrl ? `
    <div style="text-align: center; margin: 20px 0;">
        <a href="${payload.bookingUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Ver Detalles de la Reserva
        </a>
    </div>` : ''}
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">✅ El paciente ha confirmado su asistencia y completado el pago.</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
            Sistema Sobrecupos<br>
            <strong>contacto@sobrecupos.com</strong>
        </p>
    </div>
</body>
</html>`;
  }

  /**
   * Generar mensaje de WhatsApp
   */
  private generateWhatsAppMessage(payload: DoctorNotificationPayload): string {
    const sandboxPrefix = this.SANDBOX_MODE ? '🧪 *MODO SANDBOX*\n\n' : '';

    return `${sandboxPrefix}🏥 *Nueva Reserva Confirmada*

Dr/a. ${payload.doctorName}
Booking ID: ${payload.bookingId}

📅 *Detalles de la Cita:*
• Fecha y Hora: ${payload.appointmentDateTime}
• Zona Horaria: ${payload.appointmentTimezone}
• Especialidad: ${payload.specialty}
• Clínica: ${payload.clinicName}
• Precio Pagado: $${payload.pricePaid}${payload.notes ? `\n• Notas: ${payload.notes}` : ''}

👤 *Datos del Paciente:*
• Nombre: ${payload.patientName}${payload.patientRut ? `\n• RUT: ${payload.patientRut}` : ''}${payload.patientPhone ? `\n• Teléfono: ${payload.patientPhone}` : ''}${payload.patientEmail ? `\n• Email: ${payload.patientEmail}` : ''}${payload.patientAge ? `\n• Edad: ${payload.patientAge} años` : ''}

✅ El paciente ha confirmado su asistencia y completado el pago.

${payload.bookingUrl ? `🔗 Ver detalles: ${payload.bookingUrl}\n\n` : ''}_Sistema Sobrecupos_`;
  }

  // Utilidades
  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    if (!normalized.startsWith('56')) {
      normalized = '56' + normalized;
    }
    return '+' + normalized;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    return /^\+56\d{8,9}$/.test(normalized);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para testing/CLI
  async testNotification(bookingId: string): Promise<void> {
    const testPayload: DoctorNotificationPayload = {
      bookingId,
      doctorName: 'Dr. Test Martinez',
      doctorEmail: process.env.SANDBOX_EMAIL || 'test@example.com',
      doctorWhatsApp: process.env.SANDBOX_PHONE || '+56912345678',
      appointmentDateTime: '25/08/2025 10:00',
      appointmentTimezone: 'America/Santiago',
      patientName: 'Paciente Test',
      patientRut: '12.345.678-9',
      patientPhone: '+56987654321',
      patientEmail: 'paciente@test.com',
      patientAge: 35,
      specialty: 'Medicina General',
      clinicName: 'Clínica Test',
      pricePaid: '2990',
      notes: 'Consulta de control - TEST',
      bookingUrl: 'https://sobrecupos.com/booking/' + bookingId
    };

    const result = await this.notifyDoctor(testPayload);
    console.log('🧪 Test de notificación completado:', result);
  }
}