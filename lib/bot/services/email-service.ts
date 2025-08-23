// Servicio de email y WhatsApp para confirmaciones de citas
import { BotSession, ProcessedDoctorInfo } from '../types';
import { airtableService } from './airtable-service';
import { formatSpanishDate } from '../utils';

interface EmailConfig {
  sendgridApiKey: string;
  fromEmail: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || ''
    };
  }

  // Verificar si la configuración de email está disponible
  isConfigured(): boolean {
    return !!(this.config.sendgridApiKey && this.config.fromEmail);
  }

  // Enviar email de confirmación al paciente
  async sendPatientConfirmation(session: BotSession, confirmationNumber: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('⚠️ Email service not configured - skipping patient email');
      return false;
    }

    const { patientEmail, patientName, selectedRecord } = session;
    if (!patientEmail || !selectedRecord) return false;

    const doctorName = selectedRecord.fields?.['Name (from Médico)']?.[0] || 'Médico';
    const fecha = selectedRecord.fields?.Fecha || '';
    const hora = selectedRecord.fields?.Hora || '';
    const clinica = selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || 'Clínica';
    const direccion = selectedRecord.fields?.['Dirección'] || selectedRecord.fields?.['Direccion'] || '';
    const especialidad = selectedRecord.fields?.Especialidad || 'Especialidad';

    const emailContent = this.generatePatientEmailTemplate({
      patientName: patientName || 'Paciente',
      confirmationNumber,
      doctorName,
      fecha,
      hora,
      clinica,
      direccion,
      especialidad,
      patientRut: session.patientRut || '',
      patientAge: session.patientAge || 0,
      patientPhone: session.patientPhone || ''
    });

    return await this.sendEmail(
      patientEmail,
      `✅ Confirmación de Cita - ${especialidad} - ${fecha}`,
      emailContent
    );
  }

  // Enviar notificación al doctor (email + WhatsApp)
  async sendDoctorNotification(session: BotSession, doctorId: string): Promise<boolean> {
    console.log('🏥 === ENVIANDO NOTIFICACIÓN AL DOCTOR ===');
    
    try {
      // Obtener información completa del doctor desde Airtable
      const doctorInfo = await airtableService.getDoctorInfo(doctorId);
      if (!doctorInfo) {
        console.error('❌ No se pudo obtener información del doctor');
        return false;
      }

      console.log(`👨‍⚕️ Doctor: ${doctorInfo.Name}`);
      console.log(`📧 Email: ${doctorInfo.Email || 'No configurado'}`);
      console.log(`📱 WhatsApp: ${doctorInfo.WhatsApp || 'No configurado'}`);

      const { selectedRecord, patientName, patientRut, patientPhone, patientEmail, motivo } = session;
      if (!selectedRecord) {
        console.error('❌ No hay información del sobrecupo seleccionado');
        return false;
      }

      let emailSuccess = false;
      let whatsappSuccess = false;

      // 1. Enviar email al doctor (si tiene email configurado)
      if (this.isConfigured() && doctorInfo.Email) {
        console.log('📧 Enviando email al doctor...');
        
        const emailContent = this.generateDoctorEmailTemplate({
          doctorName: doctorInfo.Name || 'Doctor',
          patientName: patientName || 'Paciente',
          patientRut: patientRut || '',
          patientPhone: patientPhone || '',
          patientEmail: patientEmail || '',
          motivo: motivo || '',
          fecha: formatSpanishDate(selectedRecord.fields?.Fecha || ''),
          hora: selectedRecord.fields?.Hora || '',
          clinica: selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || 'Clínica',
          direccion: selectedRecord.fields?.['Dirección'] || selectedRecord.fields?.['Direccion'] || '',
          especialidad: selectedRecord.fields?.Especialidad || 'Especialidad'
        });

        emailSuccess = await this.sendEmail(
          doctorInfo.Email,
          `🏥 Nueva Cita Confirmada - ${patientName} - ${formatSpanishDate(selectedRecord.fields?.Fecha || '')}`,
          emailContent
        );
      } else {
        console.log('⚠️ Email al doctor no enviado - falta configuración o email del doctor');
      }

      // 2. Enviar WhatsApp al doctor (si tiene WhatsApp configurado)
      if (doctorInfo.WhatsApp) {
        console.log('📱 Enviando WhatsApp al doctor...');
        
        whatsappSuccess = await this.sendWhatsAppToDoctor({
          doctorName: doctorInfo.Name || 'Doctor',
          doctorWhatsApp: doctorInfo.WhatsApp,
          patientName: patientName || 'Paciente',
          patientRut: patientRut || '',
          patientPhone: patientPhone || '',
          patientEmail: patientEmail || '',
          motivo: motivo || '',
          fecha: formatSpanishDate(selectedRecord.fields?.Fecha || ''),
          hora: selectedRecord.fields?.Hora || '',
          clinica: selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || 'Clínica'
        });
      } else {
        console.log('⚠️ WhatsApp al doctor no enviado - doctor sin WhatsApp configurado');
      }

      const success = emailSuccess || whatsappSuccess;
      console.log(`🏥 Resultado notificación doctor: Email=${emailSuccess}, WhatsApp=${whatsappSuccess}, Success=${success}`);
      
      return success;
    } catch (error) {
      console.error('❌ Error enviando notificación al doctor:', error);
      return false;
    }
  }

  // Método genérico para enviar emails
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject
            }
          ],
          from: { 
            email: this.config.fromEmail, 
            name: "SobrecuposIA" 
          },
          content: [
            {
              type: "text/html",
              value: html
            }
          ]
        })
      });

      if (response.ok) {
        console.log(`✅ Email sent successfully to ${to}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Email sending failed to ${to}:`, errorText);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error);
      return false;
    }
  }

  // Generar template de email para paciente
  private generatePatientEmailTemplate(data: {
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
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de Cita - SobrecuposIA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .confirmation { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
        .important { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #0066cc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 SobrecuposIA</h1>
            <h2>¡Confirmación de Cita Médica!</h2>
        </div>
        
        <div class="content">
            <div class="confirmation">
                ✅ Tu cita ha sido confirmada exitosamente
            </div>
            
            <p>Hola <strong>${data.patientName}</strong>,</p>
            
            <p>Tu cita médica ha sido reservada y confirmada. A continuación encontrarás todos los detalles:</p>
            
            <div class="details">
                <h3>📋 Detalles de la Cita</h3>
                <div class="detail-row"><span class="label">Paciente:</span> ${data.patientName}</div>
                <div class="detail-row"><span class="label">RUT:</span> ${data.patientRut}</div>
                <div class="detail-row"><span class="label">Edad:</span> ${data.patientAge} años</div>
                <div class="detail-row"><span class="label">Especialidad:</span> ${data.especialidad}</div>
                <div class="detail-row"><span class="label">Médico:</span> Dr. ${data.doctorName}</div>
                <div class="detail-row"><span class="label">Fecha:</span> ${data.fecha}</div>
                <div class="detail-row"><span class="label">Hora:</span> ${data.hora}</div>
                <div class="detail-row"><span class="label">Clínica:</span> ${data.clinica}</div>
                <div class="detail-row"><span class="label">Dirección:</span> ${data.direccion}</div>
                <div class="detail-row"><span class="label">Teléfono:</span> ${data.patientPhone}</div>
                <div class="detail-row"><span class="label">Costo:</span> $2.990 CLP (PAGADO ✅)</div>
                <div class="detail-row"><span class="label">N° Confirmación:</span> <strong>${data.confirmationNumber}</strong></div>
            </div>
            
            <div class="important">
                <h3>📝 Instrucciones Importantes:</h3>
                <ul>
                    <li><strong>Llega 15 minutos antes</strong> de tu cita</li>
                    <li>Trae tu <strong>carnet de identidad</strong></li>
                    <li>Si necesitas cancelar, hazlo con al menos <strong>2 horas de anticipación</strong></li>
                    <li>Guarda este email como comprobante de tu reserva</li>
                </ul>
            </div>
            
            <p>Si tienes alguna consulta o necesitas reagendar, no dudes en contactarnos.</p>
            
            <p>¡Te esperamos! 😊</p>
        </div>
        
        <div class="footer">
            <p><strong>SobrecuposIA</strong> - Tu asistente médico inteligente</p>
            <p>Este es un mensaje automático, por favor no respondas a este email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Enviar WhatsApp al doctor usando el servicio existente
  private async sendWhatsAppToDoctor(data: {
    doctorName: string;
    doctorWhatsApp: string;
    patientName: string;
    patientRut: string;
    patientPhone: string;
    patientEmail: string;
    motivo: string;
    fecha: string;
    hora: string;
    clinica: string;
  }): Promise<boolean> {
    try {
      // Importar dinámicamente el servicio de WhatsApp
      const whatsAppService = (await import('../../whatsapp-service.js')).default;
      
      const result = await (whatsAppService as any).notifyDoctorNewPatient(
        {
          name: data.doctorName,
          whatsapp: data.doctorWhatsApp
        },
        {
          name: data.patientName,
          rut: data.patientRut,
          phone: data.patientPhone,
          email: data.patientEmail
        },
        {
          fecha: data.fecha,
          hora: data.hora,
          clinica: data.clinica
        },
        data.motivo || null
      );

      return result.success;
    } catch (error) {
      console.error('❌ Error enviando WhatsApp al doctor:', error);
      return false;
    }
  }

  // Generar template de email para doctor
  private generateDoctorEmailTemplate(data: {
    doctorName: string;
    patientName: string;
    patientRut: string;
    patientPhone: string;
    patientEmail: string;
    motivo: string;
    fecha: string;
    hora: string;
    clinica: string;
    direccion: string;
    especialidad: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nueva Cita Confirmada - SobrecuposIA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .new-patient { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
        .important { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #0066cc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 SobrecuposIA</h1>
            <h2>¡Nuevo Paciente Confirmado!</h2>
        </div>
        
        <div class="content">
            <div class="new-patient">
                🎉 Tienes un nuevo sobrecupo confirmado
            </div>
            
            <p>Estimado/a <strong>Dr/a. ${data.doctorName}</strong>,</p>
            
            <p>Te informamos que tienes un nuevo paciente confirmado para tu sobrecupo:</p>
            
            <div class="details">
                <h3>📅 Detalles de la Cita</h3>
                <div class="detail-row"><span class="label">Fecha:</span> ${data.fecha}</div>
                <div class="detail-row"><span class="label">Hora:</span> ${data.hora}</div>
                <div class="detail-row"><span class="label">Especialidad:</span> ${data.especialidad}</div>
                <div class="detail-row"><span class="label">Clínica:</span> ${data.clinica}</div>
                <div class="detail-row"><span class="label">Dirección:</span> ${data.direccion}</div>
            </div>
            
            <div class="details">
                <h3>👤 Datos del Paciente</h3>
                <div class="detail-row"><span class="label">Nombre:</span> ${data.patientName}</div>
                <div class="detail-row"><span class="label">RUT:</span> ${data.patientRut}</div>
                <div class="detail-row"><span class="label">Teléfono:</span> ${data.patientPhone}</div>
                <div class="detail-row"><span class="label">Email:</span> ${data.patientEmail}</div>
                ${data.motivo ? `<div class="detail-row"><span class="label">Motivo de consulta:</span> ${data.motivo}</div>` : ''}
            </div>
            
            <div class="important">
                <h3>📝 Información Importante:</h3>
                <ul>
                    <li>El paciente ha <strong>confirmado su asistencia</strong> y realizado el pago</li>
                    <li>Recibirá recordatorios automáticos antes de la cita</li>
                    <li>En caso de no presentarse, podrás reportarlo en el sistema</li>
                </ul>
            </div>
            
            <p>Para más detalles o gestionar tus sobrecupos, ingresa a tu panel de control.</p>
            
            <p>¡Gracias por ser parte de SobrecuposIA! 👨‍⚕️</p>
        </div>
        
        <div class="footer">
            <p><strong>SobrecuposIA</strong> - Sistema de gestión de sobrecupos médicos</p>
            <p>Este es un mensaje automático, por favor no respondas a este email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Instancia singleton del servicio
export const emailService = new EmailService();