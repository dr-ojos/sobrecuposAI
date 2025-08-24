// Servicio robusto de notificaciones con múltiples intentos
import { WhatsAppService } from './whatsapp-service.js';

interface NotificationConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackEmails?: string[];
}

interface NotificationResult {
  success: boolean;
  attempts: number;
  lastError?: string;
  deliveryMethod?: string;
  messageId?: string;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig = { maxRetries: 3, retryDelay: 2000 }) {
    this.config = config;
  }

  // Envío de email robusto con reintentos
  async sendEmailWithRetry(
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    senderName: string = "Sistema Sobrecupos"
  ): Promise<NotificationResult> {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return {
        success: false,
        attempts: 0,
        lastError: "Variables de entorno SendGrid no configuradas"
      };
    }

    let attempts = 0;
    let lastError = '';

    for (let i = 0; i < this.config.maxRetries; i++) {
      attempts++;
      
      try {
        console.log(`📧 Intento ${attempts} de email a: ${recipientEmail}`);
        
        const emailPayload = {
          personalizations: [{
            to: [{ email: recipientEmail }],
            subject: subject
          }],
          from: { 
            email: SENDGRID_FROM_EMAIL, 
            name: senderName 
          },
          reply_to: {
            email: SENDGRID_FROM_EMAIL,
            name: senderName
          },
          categories: ["medical-notification", "sobrecupos-system"],
          custom_args: {
            "attempt": attempts.toString(),
            "timestamp": new Date().toISOString()
          },
          content: [{
            type: "text/html",
            value: htmlContent
          }]
        };

        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload)
        });

        const responseText = await response.text();
        
        if (response.ok) {
          console.log(`✅ Email enviado exitosamente en intento ${attempts}`);
          return {
            success: true,
            attempts,
            deliveryMethod: 'sendgrid',
            messageId: response.headers.get('X-Message-Id') || 'unknown'
          };
        } else {
          lastError = `SendGrid error ${response.status}: ${responseText}`;
          console.log(`❌ Intento ${attempts} falló: ${lastError}`);
        }
        
      } catch (error: any) {
        lastError = `Network error: ${error.message}`;
        console.log(`❌ Intento ${attempts} excepción: ${lastError}`);
      }

      // Esperar antes del siguiente intento (excepto en el último)
      if (i < this.config.maxRetries - 1) {
        console.log(`⏳ Esperando ${this.config.retryDelay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    return {
      success: false,
      attempts,
      lastError
    };
  }

  // WhatsApp robusto con reintentos
  async sendWhatsAppWithRetry(
    recipientPhone: string,
    message: string,
    doctorName: string = "Doctor"
  ): Promise<NotificationResult> {
    let attempts = 0;
    let lastError = '';

    for (let i = 0; i < this.config.maxRetries; i++) {
      attempts++;
      
      try {
        console.log(`📱 Intento ${attempts} de WhatsApp a: ${recipientPhone}`);
        
        // Usar el servicio existente de WhatsApp
        const whatsAppService = new (await import('./whatsapp-service.js')).default();
        
        const result = await whatsAppService.sendMessage(recipientPhone, message);
        
        if (result.success) {
          console.log(`✅ WhatsApp enviado exitosamente en intento ${attempts}`);
          return {
            success: true,
            attempts,
            deliveryMethod: 'twilio',
            messageId: result.messageId
          };
        } else {
          lastError = result.error || 'Error desconocido de WhatsApp';
          console.log(`❌ Intento ${attempts} falló: ${lastError}`);
        }
        
      } catch (error: any) {
        lastError = `WhatsApp error: ${error.message}`;
        console.log(`❌ Intento ${attempts} excepción: ${lastError}`);
      }

      // Esperar antes del siguiente intento
      if (i < this.config.maxRetries - 1) {
        console.log(`⏳ Esperando ${this.config.retryDelay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    return {
      success: false,
      attempts,
      lastError
    };
  }

  // Notificación dual con fallbacks
  async notifyDoctorWithFallback(
    doctorData: {
      name: string;
      email?: string;
      whatsapp?: string;
    },
    patientData: {
      name: string;
      rut: string;
      phone: string;
      email: string;
    },
    appointmentData: {
      fecha: string;
      hora: string;
      clinica: string;
    },
    emailTemplate: string,
    motivo?: string
  ): Promise<{
    emailResult: NotificationResult;
    whatsappResult: NotificationResult;
    overallSuccess: boolean;
  }> {
    console.log(`🎯 Notificando al Dr/a. ${doctorData.name} con sistema robusto...`);

    const results = {
      emailResult: { success: false, attempts: 0 } as NotificationResult,
      whatsappResult: { success: false, attempts: 0 } as NotificationResult,
      overallSuccess: false
    };

    // Intentar email si está configurado
    if (doctorData.email) {
      const subject = `Nueva Cita Confirmada - ${patientData.name} - ${appointmentData.fecha}`;
      results.emailResult = await this.sendEmailWithRetry(
        doctorData.email,
        subject,
        emailTemplate,
        "Sistema Sobrecupos"
      );
    } else {
      results.emailResult = {
        success: false,
        attempts: 0,
        lastError: "Email del médico no configurado"
      };
    }

    // Intentar WhatsApp si está configurado
    if (doctorData.whatsapp) {
      const whatsappMessage = `👨‍⚕️ *Dr/a. ${doctorData.name}*

*¡Tienes un nuevo Sobrecupo!* 🎉

📅 *DETALLES DE LA CITA:*
• Fecha: ${appointmentData.fecha}
• Hora: ${appointmentData.hora}
• Clínica: ${appointmentData.clinica}

👤 *DATOS DEL PACIENTE:*
• Nombre: ${patientData.name}
• RUT: ${patientData.rut}
• Teléfono: ${patientData.phone}
• Email: ${patientData.email}${motivo ? `\n• Motivo: ${motivo}` : ''}

✅ El paciente ha confirmado su asistencia.

_Sistema Sobrecupos AI_`;

      results.whatsappResult = await this.sendWhatsAppWithRetry(
        doctorData.whatsapp,
        whatsappMessage,
        doctorData.name
      );
    } else {
      results.whatsappResult = {
        success: false,
        attempts: 0,
        lastError: "WhatsApp del médico no configurado"
      };
    }

    // El éxito general requiere al menos una notificación exitosa
    results.overallSuccess = results.emailResult.success || results.whatsappResult.success;

    console.log(`📊 Resultado de notificaciones para Dr/a. ${doctorData.name}:`);
    console.log(`📧 Email: ${results.emailResult.success ? '✅' : '❌'} (${results.emailResult.attempts} intentos)`);
    console.log(`📱 WhatsApp: ${results.whatsappResult.success ? '✅' : '❌'} (${results.whatsappResult.attempts} intentos)`);
    console.log(`🎯 Éxito general: ${results.overallSuccess ? '✅' : '❌'}`);

    return results;
  }
}