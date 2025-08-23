// Tipos para el bot médico inteligente
export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    Especialidad?: string;
    Médico?: string[];
    Fecha?: string;
    Hora?: string;
    Disponible?: string;
    Dirección?: string;
    Direccion?: string;
    Clínica?: string;
    Clinica?: string;
    'Name (from Médico)'?: string[];
    [key: string]: any;
  };
}

export interface DoctorInfo {
  Name?: string;
  Especialidad?: string;
  WhatsApp?: string;
  Email?: string;
  Atiende?: 'Niños' | 'Adultos' | 'Ambos';
  Seguros?: string[];
  Estado?: string;
  PhotoURL?: string;
  RSS?: string;
  Experiencia?: string;
  AreasInteres?: string;
  [key: string]: any;
}

export interface ProcessedDoctorInfo {
  name: string;
  atiende: 'Niños' | 'Adultos' | 'Ambos';
  areasInteres?: string;
}

export type BotStage = 
  | 'getting-name'
  | 'getting-rut' 
  | 'getting-age'
  | 'getting-phone'
  | 'getting-email'
  | 'choosing-from-options'
  | 'confirming-appointment'
  | 'awaiting-confirmation'
  | 'collecting-basic-data'
  | 'getting-name-for-confirmed-appointment'
  | 'getting-age-for-confirmed-appointment'
  | 'getting-name-for-specialty'
  | 'getting-rut-for-specialty'
  | 'getting-age-for-filtering'
  | 'choosing-alternative'
  | 'pending-payment'
  | 'payment-completed'
  | 'completed'
  | 'asking-specific-date'
  | 'asking-for-contact-data'
  | 'asking-for-other-doctors';

export interface BotSession {
  stage: BotStage;
  specialty?: string;
  records?: AirtableRecord[];
  motivo?: string;
  respuestaEmpatica?: string;
  attempts: number;
  patientName?: string;
  patientRut?: string;
  patientAge?: number;
  patientPhone?: string;
  patientEmail?: string;
  selectedOptions?: AirtableRecord[];
  selectedRecord?: AirtableRecord;
  previouslyRejectedOptions?: AirtableRecord[];
  rejectedAllOptions?: boolean;
  userPreferences?: any;
  doctorInfo?: ProcessedDoctorInfo;
  alternativeSpecialty?: string | null;
  alternativeRecords?: AirtableRecord[];
  originalSpecialty?: string;
  paymentUrl?: string;
  lastActivity?: number;
  emotionalState?: string;
  patientProfile?: any;
  urgency?: string;
  [key: string]: any;
}

export interface BotResponse {
  text: string;
  session?: BotSession;
  paymentButton?: {
    text: string;
    url: string;
    amount: string;
  };
}

export interface MedicalDetection {
  specialty: string;
  confidence: number;
  symptoms: string[];
  areas?: string[];
}

export interface AppointmentPresentation {
  text: string;
  stage: 'choosing-from-options' | 'confirming-appointment';
  doctorInfo?: ProcessedDoctorInfo;
}

export interface PatientInsights {
  urgency: 'low' | 'medium' | 'high';
  emotionalState: string;
  symptoms: string[];
}

// Constantes del sistema
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
export const RATE_LIMIT_MAX_ATTEMPTS = 20;
export const RATE_LIMIT_WINDOW = 60000; // 1 minuto

// Tipos de respuesta estándar
export interface StandardResponses {
  GREETING: string;
  ERROR_INTERNAL: string;
  ERROR_VALIDATION: string;
  NO_AVAILABILITY: string;
}