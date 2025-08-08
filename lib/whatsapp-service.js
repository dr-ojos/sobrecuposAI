// lib/whatsapp-service.js
// Servicio centralizado para manejar todas las notificaciones de WhatsApp

class WhatsAppService {
  constructor() {
    this.twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_WHATSAPP_NUMBER
    );

    this.client = null;
    this.fromNumber = null;
  }

  // Inicializar Twilio de forma lazy (solo cuando sea necesario)
  async initTwilio() {
    if (!this.twilioConfigured) return false;
    
    if (!this.client) {
      try {
        const { default: twilio } = await import('twilio');
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID, 
          process.env.TWILIO_AUTH_TOKEN
        );
        this.fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
      } catch (error) {
        console.error('❌ Error inicializando Twilio:', error);
        return false;
      }
    }
    
    return true;
  }

  // Formatear número de teléfono chileno
  formatPhoneNumber(phone) {
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
  async sendMessage(to, message) {
    const formattedNumber = this.formatPhoneNumber(to);
    
    if (!formattedNumber) {
      throw new Error('Número de teléfono inválido');
    }

    // Inicializar Twilio si es necesario
    const initialized = await this.initTwilio();
    
    if (initialized && this.client) {
      try {
        const result = await this.client.messages.create({
          from: this.fromNumber,
          to: `whatsapp:${formattedNumber}`,
          body: message
        });
        
        console.log('✅ WhatsApp enviado:', result.sid);
        return { success: true, messageId: result.sid };
      } catch (error) {
        console.error('❌ Error Twilio:', error);
        throw error;
      }
    }
    
    // Modo desarrollo - simular envío
    console.log('📱 WhatsApp simulado:');
    console.log(`To: ${formattedNumber}`);
    console.log(`Message: ${message}`);
    
    return { 
      success: true, 
      messageId: 'SIMULATED_' + Date.now(),
      simulated: true 
    };
  }

  // Notificar nuevo sobrecupo a médico
  async notifyDoctorNewPatient(doctorData, patientData, appointmentData, motivo = null) {
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
  async notifyDoctorCancellation(doctorData, patientData, appointmentData) {
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
  async notifyDoctorReminder(doctorData, appointmentsCount, date) {
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
  async notifyPatientConfirmation(patientData, appointmentData, doctorData) {
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

    return await this.sendMessage(patientData.whatsapp, message);
  }
}

// Exportar instancia única
const whatsAppService = new WhatsAppService();
export default whatsAppService;