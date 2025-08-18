// lib/whatsapp-service.ts
// Servicio centralizado para manejar todas las notificaciones de WhatsApp

// Types for WhatsApp service
export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  status?: string;
  simulated?: boolean;
  recoveredFrom63016?: boolean;
  error?: string;
  originalError?: any;
  code?: number;
}

export interface DoctorData {
  name: string;
  whatsapp: string;
  especialidad?: string;
}

export interface PatientData {
  name: string;
  rut: string;
  phone: string;
  email: string;
  whatsapp?: string;
}

export interface AppointmentData {
  fecha: string;
  hora: string;
  clinica: string;
  direccion?: string;
}

// Import type for Twilio client
type TwilioClient = any;

class WhatsAppService {
  private client: TwilioClient | null = null;
  private fromNumber: string | null = null;

  // Verificar configuración dinámicamente
  get twilioConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_WHATSAPP_NUMBER
    );
  }

  // Inicializar Twilio de forma lazy (solo cuando sea necesario)
  async initTwilio(): Promise<boolean> {
    console.log('🔧 === INICIALIZANDO TWILIO ===');
    console.log('🔧 twilioConfigured:', this.twilioConfigured);
    console.log('🔧 TWILIO_ACCOUNT_SID presente:', !!process.env.TWILIO_ACCOUNT_SID);
    console.log('🔧 TWILIO_AUTH_TOKEN presente:', !!process.env.TWILIO_AUTH_TOKEN);
    console.log('🔧 TWILIO_WHATSAPP_NUMBER presente:', !!process.env.TWILIO_WHATSAPP_NUMBER);
    console.log('🔧 TWILIO_WHATSAPP_NUMBER value:', process.env.TWILIO_WHATSAPP_NUMBER);
    
    if (!this.twilioConfigured) {
      console.log('❌ Twilio no está configurado - falta alguna variable');
      return false;
    }
    
    if (!this.client) {
      try {
        console.log('🔧 Importando librería Twilio...');
        const { default: twilio } = await import('twilio');
        console.log('🔧 Twilio importado exitosamente');
        
        console.log('🔧 Creando cliente Twilio...');
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID!, 
          process.env.TWILIO_AUTH_TOKEN!
        );
        this.fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
        console.log('🔧 Cliente Twilio creado exitosamente');
        console.log('🔧 From number:', this.fromNumber);
      } catch (error) {
        console.error('❌ Error inicializando Twilio:', error);
        if (error instanceof Error) {
          console.error('❌ Error stack:', error.stack);
        }
        return false;
      }
    }
    
    console.log('✅ Twilio inicializado correctamente');
    return true;
  }

  // Formatear número de teléfono chileno
  formatPhoneNumber(phone: string | null | undefined): string | null {
    if (!phone) return null;
    
    // Remover caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Si ya tiene código de país
    if (cleaned.startsWith('56')) {
      return `+${cleaned}`;
    }
    
    // Si empieza con 9 (celular chileno)
    if (cleaned.startsWith('9')) {
      return `+56${cleaned}`;
    }
    
    // Si es número de 8 dígitos (sin el 9)
    if (cleaned.length === 8) {
      return `+569${cleaned}`;
    }
    
    // Por defecto, asumir Chile
    return `+56${cleaned}`;
  }

  // Enviar mensaje genérico
  async sendMessage(to: string, message: string): Promise<WhatsAppResult> {
    console.log('📱 === INICIANDO ENVÍO WHATSAPP ===');
    console.log('📱 Número original:', to);
    
    const formattedNumber = this.formatPhoneNumber(to);
    console.log('📱 Número formateado:', formattedNumber);
    
    if (!formattedNumber) {
      console.error('❌ Número de teléfono inválido:', to);
      throw new Error('Número de teléfono inválido');
    }

    // Inicializar Twilio si es necesario
    console.log('📱 Intentando inicializar Twilio...');
    console.log('📱 Twilio configurado:', this.twilioConfigured);
    
    const initialized = await this.initTwilio();
    console.log('📱 Twilio inicializado:', initialized);
    
    if (initialized && this.client) {
      try {
        console.log('📱 Enviando con Twilio...');
        console.log('📱 From:', this.fromNumber);
        console.log('📱 To:', `whatsapp:${formattedNumber}`);
        console.log('📱 Message length:', message.length);
        
        const result = await this.client.messages.create({
          from: this.fromNumber,
          to: `whatsapp:${formattedNumber}`,
          body: message
        });
        
        console.log('✅ WhatsApp enviado exitosamente:', result.sid);
        console.log('✅ Status:', result.status);
        return { success: true, messageId: result.sid, status: result.status };
      } catch (error: any) {
        console.error('❌ Error Twilio completo:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error status:', error.status);
        
        // Manejar Error 63016 - Ventana de conversación cerrada
        if (error.code === 63016) {
          console.log('🔧 Error 63016 detectado - Ventana de WhatsApp cerrada');
          console.log('🔧 Intentando enviar mensaje de template básico...');
          
          try {
            // Enviar mensaje template básico para reabrir ventana
            const templateResult = await this.client.messages.create({
              from: this.fromNumber,
              to: `whatsapp:${formattedNumber}`,
              body: `Hola! Tienes una nueva notificación de Sobrecupos. Responde con cualquier mensaje para reactivar las notificaciones.`
            });
            
            console.log('✅ Mensaje template enviado:', templateResult.sid);
            
            // Esperar 2 segundos e intentar enviar el mensaje original nuevamente
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const retryResult = await this.client.messages.create({
              from: this.fromNumber,
              to: `whatsapp:${formattedNumber}`,
              body: message
            });
            
            console.log('✅ Mensaje original enviado después de template:', retryResult.sid);
            return { success: true, messageId: retryResult.sid, status: retryResult.status, recoveredFrom63016: true };
            
          } catch (retryError) {
            console.error('❌ Error en recuperación 63016:', retryError);
            // Devolver el error original con información adicional
            return { 
              success: false, 
              error: 'Error 63016 - Ventana WhatsApp cerrada. El destinatario debe responder para reactivar notificaciones.',
              originalError: error,
              code: 63016
            };
          }
        }
        
        throw error;
      }
    }
    
    // Modo desarrollo - simular envío
    console.log('📱 === MODO SIMULADO (Twilio no configurado) ===');
    console.log('📱 To:', formattedNumber);
    console.log('📱 Message:', message.substring(0, 100) + '...');
    
    return { 
      success: true, 
      messageId: 'SIMULATED_' + Date.now(),
      simulated: true 
    };
  }

  // Notificar nuevo sobrecupo a médico
  async notifyDoctorNewPatient(
    doctorData: DoctorData, 
    patientData: PatientData, 
    appointmentData: AppointmentData, 
    motivo: string | null = null
  ): Promise<WhatsAppResult> {
    console.log('📱 === INICIANDO NOTIFICACIÓN WHATSAPP AL MÉDICO ===');
    console.log('📱 Doctor data:', doctorData);
    console.log('📱 Patient data:', patientData);
    console.log('📱 Appointment data:', appointmentData);
    console.log('📱 Motivo:', motivo);

    if (!doctorData.whatsapp) {
      console.error('❌ Doctor no tiene WhatsApp configurado:', doctorData);
      return { success: false, error: 'Doctor sin WhatsApp' };
    }

    const message = `
👨‍⚕️ *Dr/a. ${doctorData.name}*

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

    console.log('📱 Mensaje a enviar:', message);
    console.log('📱 Número destino:', doctorData.whatsapp);

    try {
      const result = await this.sendMessage(doctorData.whatsapp, message);
      console.log('📱 ✅ Resultado del envío:', result);
      return result;
    } catch (error) {
      console.error('📱 ❌ Error enviando WhatsApp al médico:', error);
      throw error;
    }
  }

  // Notificar cancelación a médico
  async notifyDoctorCancellation(
    doctorData: DoctorData, 
    patientData: PatientData, 
    appointmentData: AppointmentData
  ): Promise<WhatsAppResult> {
    const message = `
👨‍⚕️ *Dr/a. ${doctorData.name}*

*⚠️ Cancelación de cita*

📅 *CITA CANCELADA:*
• Fecha: ${appointmentData.fecha}
• Hora: ${appointmentData.hora}
• Paciente: ${patientData.name}

El sobrecupo está nuevamente disponible.

_Sistema Sobrecupos AI_`;

    return await this.sendMessage(doctorData.whatsapp, message);
  }

  // Recordatorio de cita a médico
  async notifyDoctorReminder(
    doctorData: DoctorData, 
    appointmentsCount: number, 
    date: string
  ): Promise<WhatsAppResult> {
    const message = `
👨‍⚕️ *Dr/a. ${doctorData.name}*

📅 *Recordatorio de citas para ${date}*

Tiene ${appointmentsCount} paciente(s) agendado(s) para mañana.

Para ver el detalle, ingrese a su panel:
https://sobrecupos.com/medico/dashboard

_Sistema Sobrecupos AI_`;

    return await this.sendMessage(doctorData.whatsapp, message);
  }

  // Notificar a paciente
  async notifyPatientConfirmation(
    patientData: PatientData, 
    appointmentData: AppointmentData, 
    doctorData: DoctorData
  ): Promise<WhatsAppResult> {
    const message = `
¡Hola ${patientData.name}! 👋

*Tu cita ha sido confirmada* ✅

📋 *DETALLES:*
• Médico: Dr/a. ${doctorData.name}
• Especialidad: ${doctorData.especialidad}
• Fecha: ${appointmentData.fecha}
• Hora: ${appointmentData.hora}
• Clínica: ${appointmentData.clinica}
• Dirección: ${appointmentData.direccion}

💰 *Importante:* Debes pagar el bono al llegar.
⏰ *Recuerda:* Llegar 15 minutos antes.

¿Necesitas cancelar? Responde CANCELAR.

_Sobrecupos AI_`;

    const phoneNumber = patientData.whatsapp || patientData.phone;
    return await this.sendMessage(phoneNumber, message);
  }
}

// Exportar instancia única
const whatsAppService = new WhatsAppService();
export default whatsAppService;