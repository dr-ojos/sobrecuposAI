// types/whatsapp.ts - Tipos para sistema de WhatsApp
export interface WhatsAppPatient {
  id: string;
  fields: {
    Name: string;
    WhatsApp?: string;
    Status: 'active' | 'inactive' | 'suspended';
    AcceptWhatsApp: boolean;
    PreferredSpecialties?: string[];
    LastNotification?: string;
    LastActivity?: string;
  };
}

export interface SobrecupoNotificationData {
  sobrecupoId: string;
  specialty: string;
  location?: string;
  fecha: string;
  hora: string;
  clinica: string;
}

export interface WhatsAppNotificationRequest {
  sobrecupoId: string;
  specialty: string;
  location?: string;
  fecha: string;
  hora: string;
  clinica: string;
}

export interface WhatsAppNotificationResponse {
  success: boolean;
  message?: string;
  sentCount?: number;
  failedCount?: number;
  totalPatients?: number;
  error?: string;
  details?: string;
}

export interface WhatsAppMessageData {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppApiResponse {
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export interface PatientUpdateRequest {
  records: Array<{
    id: string;
    fields: {
      LastNotification: string;
      LastActivity: string;
    };
  }>;
}

export interface WebhookVerificationParams {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}