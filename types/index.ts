// types/index.ts - Tipos principales del sistema SobrecuposIA

// ============================================
// TIPOS DE AIRTABLE
// ============================================

export interface AirtableRecord {
  id: string;
  fields: {
    Fecha: string;
    Hora: string;
    Médico: string[] | string;
    Clínica?: string;
    Clinica?: string;
    Dirección?: string;
    Direccion?: string;
    [key: string]: any;
  };
  createdTime?: string;
}

export interface DoctorRecord {
  id: string;
  fields: {
    Nombre: string;
    Especialidad: string;
    Email?: string;
    WhatsApp?: string;
    [key: string]: any;
  };
}

export interface PatientRecord {
  id: string;
  fields: {
    Nombre: string;
    RUT: string;
    Telefono: string;
    Email: string;
    Edad: number;
    "Motivo Consulta": string;
    "Fecha Registro": string;
    [key: string]: any;
  };
}

export interface ClinicRecord {
  id: string;
  fields: {
    Nombre: string;
    Direccion: string;
    Comuna: string;
    Telefono?: string;
    [key: string]: any;
  };
}

// ============================================
// TIPOS DE SESIÓN DEL BOT
// ============================================

export type SessionStage = 
  | 'welcome'
  | 'asking-for-contact-data'
  | 'getting-age-for-filtering'
  | 'choosing-from-options'
  | 'choosing-alternative-dates'
  | 'choosing-alternative'
  | 'asking-for-other-doctors'
  | 'asking-specific-date'
  | 'confirming-appointment'
  | 'getting-name-for-confirmed-appointment'
  | 'getting-age'
  | 'getting-name'
  | 'getting-rut'
  | 'getting-phone'
  | 'getting-email'
  | 'final-confirmation';

export interface PatientSession {
  id?: string;
  stage: SessionStage;
  motivo?: string;
  specialty?: string;
  records?: AirtableRecord[];
  selectedRecord?: AirtableRecord;
  alternativeRecords?: AirtableRecord[];
  alternativeOptions?: AirtableRecord[];
  selectedOptions?: AirtableRecord[];
  
  // Datos del paciente
  patientName?: string;
  patientRut?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  primerNombre?: string;
  
  // Información del médico
  doctorName?: string;
  doctorInfo?: DoctorInfo;
  
  // Estado de la conversación
  attempts?: number;
  lastActivity?: number;
  createdAt?: number;
  messageHistory?: string[];
  emotionalState?: string;
  conversationStage?: string;
  patientProfile?: any;
  
  // Flags especiales
  esMedicoEspecifico?: boolean;
  wasAlternative?: boolean;
  originalSpecialty?: string;
  alternativeSpecialty?: string;
  
  // Respuesta empática
  respuestaEmpatica?: string;
}

// ============================================
// TIPOS DE SERVICIOS
// ============================================

export interface DoctorInfo {
  name: string;
  email?: string;
  whatsapp?: string;
  especialidad?: string;
}

export interface PatientData {
  name: string;
  rut: string;
  phone: string;
  email: string;
  age?: number;
}

export interface AppointmentData {
  fecha: string;
  hora: string;
  clinica: string;
  direccion?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

// ============================================
// TIPOS DE PAGOS
// ============================================

export interface PaymentData {
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  clinic: string;
  amount: string;
  sessionId: string;
  motivo?: string;
}

export interface PaymentSession {
  patientName: string;
  patientRut: string;
  patientPhone: string;
  patientAge: number;
  sobrecupoId: string;
  amount: number;
  motivo?: string;
  createdAt: number;
}

// ============================================
// TIPOS DE API RESPONSES
// ============================================

export interface BotResponse {
  text: string;
  session?: PatientSession;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// TIPOS DE EMAILS
// ============================================

export interface EmailTemplate {
  to: string;
  subject: string;
  content: string;
  html?: string;
}

export interface EmailData {
  patientName: string;
  doctorName: string;
  specialty: string;
  fecha: string;
  hora: string;
  clinica: string;
  direccion: string;
  motivo?: string;
}

// ============================================
// ESPECIALIDADES DISPONIBLES
// ============================================

export const ESPECIALIDADES_DISPONIBLES = [
  'Medicina Familiar',
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Ginecología',
  'Neurología',
  'Oftalmología',
  'Otorrinolaringología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología',
  'Urología'
] as const;

export type Especialidad = typeof ESPECIALIDADES_DISPONIBLES[number];

// ============================================
// UTILIDADES DE TIPOS
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;