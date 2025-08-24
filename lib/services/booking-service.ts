// Servicio de gestión de bookings con integración de notificaciones médicas
// Integra con el flujo de payment/confirm existente respetando convenciones

import { DoctorNotificationService, type DoctorNotificationPayload } from './doctor-notification-service';

interface BookingData {
  transactionId: string;
  sessionId: string;
  paymentData: {
    sobrecupoId?: string;
    doctorId?: string;
    patientName: string;
    patientEmail?: string;
    patientRut?: string;
    patientAge?: number;
    patientPhone?: string;
    doctorName?: string;
    date?: string;
    time?: string;
    specialty?: string;
    clinic?: string;
    clinicAddress?: string;
    motivo?: string;
    amount?: string;
  };
  isSimulated?: boolean;
}

interface ProcessedBooking {
  bookingId: string;
  status: 'paid' | 'failed' | 'pending';
  doctorData?: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
    specialty?: string;
  };
  patientData: {
    name: string;
    email?: string;
    rut?: string;
    age?: number;
    phone?: string;
  };
  appointmentData: {
    date: string;
    time: string;
    clinic: string;
    clinicAddress?: string;
    specialty: string;
    amount: string;
    notes?: string;
  };
}

export class BookingService {
  private doctorNotificationService: DoctorNotificationService;
  
  constructor() {
    this.doctorNotificationService = new DoctorNotificationService();
  }

  /**
   * Procesar confirmación de pago y disparar notificaciones médicas
   * Integra con el endpoint /api/payment/confirm existente
   */
  async processPaymentConfirmation(bookingData: BookingData): Promise<{
    success: boolean;
    bookingConfirmed: boolean;
    doctorNotified: boolean;
    notificationResult?: any;
    errors: string[];
  }> {
    const logPrefix = `[BOOKING:${bookingData.transactionId}]`;
    console.log(`${logPrefix} 🔄 Procesando confirmación de pago`);

    const result = {
      success: false,
      bookingConfirmed: false,
      doctorNotified: false,
      notificationResult: undefined as any,
      errors: [] as string[]
    };

    try {
      // 1. Procesar booking (confirmar reserva en Airtable, crear paciente, etc.)
      const processedBooking = await this.confirmBooking(bookingData, logPrefix);
      
      if (processedBooking.status === 'paid') {
        result.bookingConfirmed = true;
        console.log(`${logPrefix} ✅ Booking confirmado exitosamente`);

        // 2. Disparar notificación al médico si el pago fue exitoso
        if (processedBooking.doctorData) {
          console.log(`${logPrefix} 📧 Iniciando notificación al médico`);
          
          const notificationPayload = this.mapBookingToNotificationPayload(
            processedBooking, 
            bookingData.transactionId
          );

          result.notificationResult = await this.doctorNotificationService.notifyDoctor(notificationPayload);
          result.doctorNotified = result.notificationResult.success;

          if (result.doctorNotified) {
            console.log(`${logPrefix} ✅ Médico notificado exitosamente`);
          } else {
            console.warn(`${logPrefix} ⚠️ Falló notificación al médico:`, result.notificationResult.errors);
            result.errors.push('Notificación al médico falló: ' + result.notificationResult.errors.join(', '));
          }
        } else {
          console.warn(`${logPrefix} ⚠️ No se encontraron datos del médico - omitiendo notificación`);
          result.errors.push('Datos del médico no encontrados');
        }

        result.success = true; // Booking exitoso independiente de notificación
      } else {
        result.errors.push('Confirmación de booking falló');
        console.error(`${logPrefix} ❌ Confirmación de booking falló`);
      }

    } catch (error: any) {
      console.error(`${logPrefix} ❌ Error procesando booking:`, error);
      result.errors.push(`Error interno: ${error.message}`);
    }

    console.log(`${logPrefix} 🏁 Procesamiento completado:`, {
      success: result.success,
      bookingConfirmed: result.bookingConfirmed,
      doctorNotified: result.doctorNotified,
      errorsCount: result.errors.length
    });

    return result;
  }

  /**
   * Confirmar booking utilizando la lógica existente de payment/confirm
   * Extrae datos del médico desde Airtable
   */
  private async confirmBooking(bookingData: BookingData, logPrefix: string): Promise<ProcessedBooking> {
    console.log(`${logPrefix} 🔍 Confirmando booking y obteniendo datos del médico`);

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    // 1. Extraer doctorId real desde sobrecupo (lógica existente)
    let realDoctorId = bookingData.paymentData.doctorId || '';
    
    if (bookingData.paymentData.sobrecupoId) {
      try {
        console.log(`${logPrefix} 🔍 Extrayendo doctorId desde sobrecupo: ${bookingData.paymentData.sobrecupoId}`);
        
        const sobrecupoResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${bookingData.paymentData.sobrecupoId}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (sobrecupoResponse.ok) {
          const sobrecupoData = await sobrecupoResponse.json();
          const extractedDoctorId = sobrecupoData.fields?.Médico?.[0];
          if (extractedDoctorId) {
            realDoctorId = extractedDoctorId;
            console.log(`${logPrefix} ✅ Doctor ID extraído del sobrecupo: ${realDoctorId}`);
          }
        } else {
          console.warn(`${logPrefix} ⚠️ No se pudo obtener sobrecupo: ${sobrecupoResponse.status}`);
        }
      } catch (error: any) {
        console.warn(`${logPrefix} ⚠️ Error obteniendo sobrecupo:`, error.message);
      }
    }

    // 2. Obtener datos del médico desde tabla Doctors
    let doctorData: any = null;
    
    if (realDoctorId) {
      try {
        console.log(`${logPrefix} 🔍 Obteniendo datos del médico: ${realDoctorId}`);
        
        const doctorResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${realDoctorId}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (doctorResponse.ok) {
          doctorData = await doctorResponse.json();
          console.log(`${logPrefix} ✅ Datos del médico obtenidos:`, {
            name: doctorData.fields?.Name,
            email: doctorData.fields?.Email,
            whatsapp: doctorData.fields?.WhatsApp,
            specialty: doctorData.fields?.Especialidad
          });
        } else {
          console.warn(`${logPrefix} ⚠️ Médico no encontrado en Airtable: ${doctorResponse.status}`);
        }
      } catch (error: any) {
        console.warn(`${logPrefix} ⚠️ Error obteniendo médico:`, error.message);
      }
    }

    // 3. Aquí iría la lógica de confirmar en Airtable, crear paciente, etc.
    // Por ahora, simular que el booking se confirmó exitosamente
    
    const processedBooking: ProcessedBooking = {
      bookingId: bookingData.transactionId,
      status: 'paid', // Asumimos éxito para esta implementación
      doctorData: doctorData ? {
        id: realDoctorId,
        name: doctorData.fields?.Name || bookingData.paymentData.doctorName || 'Doctor',
        email: doctorData.fields?.Email,
        whatsapp: doctorData.fields?.WhatsApp,
        specialty: doctorData.fields?.Especialidad || bookingData.paymentData.specialty
      } : undefined,
      patientData: {
        name: bookingData.paymentData.patientName,
        email: bookingData.paymentData.patientEmail,
        rut: bookingData.paymentData.patientRut,
        age: bookingData.paymentData.patientAge,
        phone: bookingData.paymentData.patientPhone
      },
      appointmentData: {
        date: bookingData.paymentData.date || '',
        time: bookingData.paymentData.time || '',
        clinic: bookingData.paymentData.clinic || '',
        clinicAddress: bookingData.paymentData.clinicAddress,
        specialty: bookingData.paymentData.specialty || '',
        amount: bookingData.paymentData.amount || '2990',
        notes: bookingData.paymentData.motivo
      }
    };

    return processedBooking;
  }

  /**
   * Mapear datos del booking a payload de notificación
   */
  private mapBookingToNotificationPayload(
    booking: ProcessedBooking, 
    transactionId: string
  ): DoctorNotificationPayload {
    // Formatear fecha y hora con zona horaria
    const appointmentDateTime = this.formatAppointmentDateTime(
      booking.appointmentData.date,
      booking.appointmentData.time
    );

    return {
      bookingId: transactionId,
      doctorName: booking.doctorData!.name,
      doctorEmail: booking.doctorData!.email,
      doctorWhatsApp: booking.doctorData!.whatsapp,
      appointmentDateTime: appointmentDateTime.formatted,
      appointmentTimezone: appointmentDateTime.timezone,
      patientName: booking.patientData.name,
      patientRut: booking.patientData.rut,
      patientPhone: booking.patientData.phone,
      patientEmail: booking.patientData.email,
      patientAge: booking.patientData.age,
      specialty: booking.appointmentData.specialty,
      clinicName: booking.appointmentData.clinic,
      pricePaid: booking.appointmentData.amount,
      notes: booking.appointmentData.notes,
      bookingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/${transactionId}`
    };
  }

  /**
   * Formatear fecha y hora con zona horaria chilena
   */
  private formatAppointmentDateTime(date: string, time: string): {formatted: string, timezone: string} {
    const timezone = 'America/Santiago';
    
    try {
      // Intentar parsear y formatear con zona horaria
      const dateTime = new Date(`${date} ${time}`);
      const formatted = dateTime.toLocaleDateString('es-CL', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return {
        formatted: formatted,
        timezone: timezone
      };
    } catch (error) {
      // Fallback si falla el parsing
      return {
        formatted: `${date} ${time}`,
        timezone: timezone
      };
    }
  }

  /**
   * Método de utilidad para testing
   */
  async testDoctorNotification(bookingId: string): Promise<void> {
    await this.doctorNotificationService.testNotification(bookingId);
  }
}