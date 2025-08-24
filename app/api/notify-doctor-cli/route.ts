// CLI endpoint para testing del sistema de notificaciones médicas
// Uso: POST /api/notify-doctor-cli con { bookingId, mode: 'test' | 'booking' }

import { NextResponse } from 'next/server';
import { DoctorNotificationService } from '../../../lib/services/doctor-notification-service';
import { BookingService } from '../../../lib/services/booking-service';

export async function POST(req: Request) {
  try {
    const { bookingId, mode, payload } = await req.json();
    
    console.log('🔧 === CLI DOCTOR NOTIFICATION TEST ===');
    console.log('🔧 Booking ID:', bookingId);
    console.log('🔧 Mode:', mode);
    
    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'bookingId requerido'
      }, { status: 400 });
    }

    const doctorService = new DoctorNotificationService();
    
    if (mode === 'test') {
      // Modo test con datos simulados
      console.log('🧪 Ejecutando test con datos simulados');
      await doctorService.testNotification(bookingId);
      
      return NextResponse.json({
        success: true,
        message: 'Test de notificación ejecutado. Revisa los logs.',
        mode: 'test',
        bookingId
      });
      
    } else if (mode === 'booking') {
      // Modo booking completo con BookingService
      console.log('🏥 Ejecutando con BookingService completo');
      
      const bookingService = new BookingService();
      
      // Simular datos de booking para testing
      const mockBookingData = {
        transactionId: bookingId,
        sessionId: `cli-test-${Date.now()}`,
        paymentData: {
          sobrecupoId: payload?.sobrecupoId || 'recFj7aKdC9zBDwxu',
          doctorId: payload?.doctorId || 'rec6wz8ItOyK7JDJO',
          patientName: payload?.patientName || 'CLI Test Patient',
          patientEmail: payload?.patientEmail || 'test@example.com',
          patientRut: '12.345.678-9',
          patientAge: 35,
          patientPhone: '+56912345678',
          doctorName: payload?.doctorName || 'Dr. CLI Test',
          date: '2025-08-25',
          time: '10:00 AM',
          specialty: 'Medicina General',
          clinic: 'Clínica CLI Test',
          motivo: 'Test desde CLI endpoint',
          amount: '2990'
        },
        isSimulated: false
      };
      
      const result = await bookingService.processPaymentConfirmation(mockBookingData);
      
      return NextResponse.json({
        success: result.success,
        message: 'Booking completo ejecutado',
        mode: 'booking',
        bookingId,
        result: {
          bookingConfirmed: result.bookingConfirmed,
          doctorNotified: result.doctorNotified,
          notificationResult: result.notificationResult,
          errors: result.errors
        }
      });
      
    } else if (mode === 'custom' && payload) {
      // Modo personalizado con payload específico
      console.log('⚙️ Ejecutando con payload personalizado');
      
      const result = await doctorService.notifyDoctor(payload);
      
      return NextResponse.json({
        success: result.success,
        message: 'Notificación personalizada ejecutada',
        mode: 'custom',
        bookingId,
        result
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Modo no válido. Use: test, booking, o custom (con payload)',
        availableModes: {
          test: 'Test básico con datos simulados',
          booking: 'Test completo con BookingService',
          custom: 'Payload personalizado (requiere payload)'
        },
        exampleUsage: {
          test: { bookingId: 'test-123', mode: 'test' },
          booking: { 
            bookingId: 'booking-123', 
            mode: 'booking',
            payload: { sobrecupoId: 'recXXX', patientName: 'Test' }
          },
          custom: {
            bookingId: 'custom-123',
            mode: 'custom', 
            payload: {
              doctorName: 'Dr. Test',
              doctorEmail: 'doctor@test.com',
              // ... resto de campos requeridos
            }
          }
        }
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('❌ Error en CLI doctor notification:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET para mostrar ayuda y estado
export async function GET() {
  const envStatus = {
    FEATURE_NOTIFY_DOCTOR: process.env.FEATURE_NOTIFY_DOCTOR,
    NOTIFY_SANDBOX: process.env.NOTIFY_SANDBOX,
    SENDGRID_CONFIGURED: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
    TWILIO_CONFIGURED: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER),
    AIRTABLE_CONFIGURED: !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID)
  };

  return NextResponse.json({
    service: 'Doctor Notification CLI',
    version: '1.0.0',
    status: 'ready',
    environment: envStatus,
    usage: {
      endpoint: '/api/notify-doctor-cli',
      methods: ['POST', 'GET'],
      examples: {
        test: {
          method: 'POST',
          body: { bookingId: 'test-123', mode: 'test' },
          description: 'Test básico con datos simulados'
        },
        booking: {
          method: 'POST', 
          body: { bookingId: 'booking-123', mode: 'booking' },
          description: 'Test completo simulando flujo de pago'
        },
        custom: {
          method: 'POST',
          body: { 
            bookingId: 'custom-123', 
            mode: 'custom',
            payload: '{ /* DoctorNotificationPayload completo */ }'
          },
          description: 'Payload personalizado para testing específico'
        }
      }
    },
    recommendations: [
      envStatus.FEATURE_NOTIFY_DOCTOR !== 'true' && 'Set FEATURE_NOTIFY_DOCTOR=true to enable',
      envStatus.NOTIFY_SANDBOX !== '1' && 'Set NOTIFY_SANDBOX=1 for safe testing',
      !envStatus.SENDGRID_CONFIGURED && 'Configure SendGrid env vars',
      !envStatus.TWILIO_CONFIGURED && 'Configure Twilio WhatsApp env vars',
      !envStatus.AIRTABLE_CONFIGURED && 'Configure Airtable env vars'
    ].filter(Boolean)
  });
}