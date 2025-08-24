// Tests unitarios para DoctorNotificationService
// Cobertura: validaciones, mapping, idempotencia, reintentos

import { DoctorNotificationService } from '../lib/services/doctor-notification-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('DoctorNotificationService', () => {
  let service: DoctorNotificationService;
  
  beforeEach(() => {
    service = new DoctorNotificationService();
    (fetch as jest.Mock).mockClear();
    
    // Mock env vars
    process.env.FEATURE_NOTIFY_DOCTOR = 'true';
    process.env.NOTIFY_SANDBOX = '1';
    process.env.SENDGRID_API_KEY = 'test_sendgrid_key';
    process.env.SENDGRID_FROM_EMAIL = 'test@sobrecupos.com';
    process.env.TWILIO_ACCOUNT_SID = 'test_twilio_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
    process.env.TWILIO_WHATSAPP_NUMBER = '+14155238886';
    process.env.SANDBOX_EMAIL = 'test@example.com';
    process.env.SANDBOX_PHONE = '+56912345678';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validaciones de Payload', () => {
    test('debe fallar si falta bookingId', async () => {
      const invalidPayload = {
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      } as any;

      const result = await service.notifyDoctor(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('bookingId requerido');
      expect(result.emailSent).toBe(false);
      expect(result.whatsappSent).toBe(false);
    });

    test('debe fallar si no hay email ni WhatsApp', async () => {
      const invalidPayload = {
        bookingId: 'test-123',
        doctorName: 'Dr. Test',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      } as any;

      const result = await service.notifyDoctor(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Se require al menos doctorEmail o doctorWhatsApp');
    });

    test('debe validar formato de email', async () => {
      const invalidPayload = {
        bookingId: 'test-123',
        doctorName: 'Dr. Test',
        doctorEmail: 'invalid-email',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      } as any;

      const result = await service.notifyDoctor(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Email inválido: invalid-email');
    });

    test('debe validar formato de teléfono', async () => {
      const invalidPayload = {
        bookingId: 'test-123',
        doctorName: 'Dr. Test',
        doctorWhatsApp: '123',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      } as any;

      const result = await service.notifyDoctor(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Teléfono inválido: 123');
    });
  });

  describe('Idempotencia', () => {
    test('debe evitar duplicados usando bookingId', async () => {
      const validPayload = {
        bookingId: 'idempotent-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      // Mock successful SendGrid response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['X-Message-Id', 'msg_123']])
      });

      // Primera llamada
      const result1 = await service.notifyDoctor(validPayload);
      expect(result1.success).toBe(true);
      expect(result1.emailSent).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Segunda llamada - debe usar caché
      const result2 = await service.notifyDoctor(validPayload);
      expect(result2.success).toBe(true);
      expect(result2.emailSent).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // No debe hacer más llamadas
    });
  });

  describe('Envío de Email con Reintentos', () => {
    test('debe reintentar en errores 5xx', async () => {
      const validPayload = {
        bookingId: 'retry-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      // Mock: Falla 2 veces con 500, éxito en el tercer intento
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server Error' })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server Error' })
        .mockResolvedValueOnce({ 
          ok: true, 
          headers: new Map([['X-Message-Id', 'msg_success']]) 
        });

      const result = await service.notifyDoctor(validPayload);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.attempts).toBe(3);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('debe detenerse en errores 4xx permanentes', async () => {
      const validPayload = {
        bookingId: 'permanent-error-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      // Mock error 400 (permanente)
      (fetch as jest.Mock).mockResolvedValueOnce({ 
        ok: false, 
        status: 400, 
        text: async () => 'Bad Request' 
      });

      const result = await service.notifyDoctor(validPayload);

      expect(result.success).toBe(false);
      expect(result.emailSent).toBe(false);
      expect(result.attempts).toBe(1); // Solo 1 intento
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.errors).toContain('Email: Error permanente 400: Bad Request');
    });
  });

  describe('Modo Sandbox', () => {
    test('debe usar email de sandbox cuando NOTIFY_SANDBOX=1', async () => {
      const validPayload = {
        bookingId: 'sandbox-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'real-doctor@clinic.com', // Email real del médico
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['X-Message-Id', 'sandbox_msg']])
      });

      await service.notifyDoctor(validPayload);

      const sentEmailPayload = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      
      // Debe usar email de sandbox, no el real
      expect(sentEmailPayload.personalizations[0].to[0].email).toBe('test@example.com');
      
      // Debe incluir categorías de sandbox
      expect(sentEmailPayload.custom_args.sandbox_mode).toBe('true');
    });
  });

  describe('Formateo de Datos', () => {
    test('debe normalizar números de teléfono chilenos', async () => {
      const validPayload = {
        bookingId: 'phone-format-test',
        doctorName: 'Dr. Test',
        doctorWhatsApp: '912345678', // Sin código de país
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: 'whatsapp_msg_123' })
      });

      await service.notifyDoctor(validPayload);

      const whatsappCall = (fetch as jest.Mock).mock.calls[0];
      const sentData = new URLSearchParams(whatsappCall[1].body);
      
      // Debe normalizar a formato E.164 chileno
      expect(sentData.get('To')).toBe('whatsapp:+56912345678');
    });

    test('debe generar templates HTML correctos', async () => {
      const validPayload = {
        bookingId: 'template-test',
        doctorName: 'Dr. María González',
        doctorEmail: 'maria@clinic.com',
        patientName: 'Juan Pérez',
        patientRut: '12.345.678-9',
        patientAge: 35,
        appointmentDateTime: '25 de agosto de 2025 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Cardiología',
        clinicName: 'Clínica Las Condes',
        pricePaid: '45000',
        notes: 'Control de presión arterial'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['X-Message-Id', 'template_msg']])
      });

      await service.notifyDoctor(validPayload);

      const sentEmailPayload = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const htmlContent = sentEmailPayload.content[0].value;
      
      // Verificar que el template contiene los datos correctos
      expect(htmlContent).toContain('Dr. María González');
      expect(htmlContent).toContain('Juan Pérez');
      expect(htmlContent).toContain('12.345.678-9');
      expect(htmlContent).toContain('Cardiología');
      expect(htmlContent).toContain('Clínica Las Condes');
      expect(htmlContent).toContain('$45000');
      expect(htmlContent).toContain('Control de presión arterial');
      expect(htmlContent).toContain('template-test'); // Booking ID
    });
  });

  describe('Feature Flag', () => {
    test('debe estar deshabilitado cuando FEATURE_NOTIFY_DOCTOR=false', async () => {
      process.env.FEATURE_NOTIFY_DOCTOR = 'false';
      const newService = new DoctorNotificationService();

      const validPayload = {
        bookingId: 'disabled-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      const result = await newService.notifyDoctor(validPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Feature NOTIFY_DOCTOR deshabilitada');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Canales Múltiples', () => {
    test('debe ser exitoso si al menos un canal funciona', async () => {
      const validPayload = {
        bookingId: 'multi-channel-test',
        doctorName: 'Dr. Test',
        doctorEmail: 'doctor@test.com',
        doctorWhatsApp: '+56912345678',
        patientName: 'Patient Test',
        appointmentDateTime: '2025-08-25 10:00',
        appointmentTimezone: 'America/Santiago',
        specialty: 'Medicina General',
        clinicName: 'Clínica Test'
      };

      // Mock: Email éxito, WhatsApp falla
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ // SendGrid success
          ok: true,
          headers: new Map([['X-Message-Id', 'email_success']])
        })
        .mockResolvedValueOnce({ // Twilio failure
          ok: false,
          status: 400,
          text: async () => 'Invalid phone number'
        });

      const result = await service.notifyDoctor(validPayload);

      expect(result.success).toBe(true); // Exitoso porque email funcionó
      expect(result.emailSent).toBe(true);
      expect(result.whatsappSent).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('WhatsApp:');
    });
  });
});