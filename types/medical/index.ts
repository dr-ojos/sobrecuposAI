// types/medical/index.ts - Tipos médicos profesionales

export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';
export type EmotionalState = 'neutral' | 'anxiety' | 'pain' | 'urgency' | 'frustration' | 'hope';
export type PatientAgeGroup = 'child' | 'adult' | 'senior';
export type Gender = 'male' | 'female' | 'other';
export type SessionStage = 
  | 'welcome'
  | 'symptom_analysis' 
  | 'specialty_selection'
  | 'options_presentation'
  | 'appointment_confirmation'
  | 'data_collection'
  | 'final_confirmation';

export interface MedicalSymptom {
  description: string;
  keywords: string[];
  severity: 'leve' | 'moderado' | 'severo';
  duration?: string;
  bodyPart?: string;
  urgency: UrgencyLevel;
}

export interface PatientPsychProfile {
  emotionalState: EmotionalState;
  urgencyLevel: UrgencyLevel;
  communicationStyle: 'direct' | 'detailed' | 'anxious' | 'confused';
  keywords: string[];
  hasChildren?: boolean;
  chronicConditions?: string[];
  ageGroup?: PatientAgeGroup;
  gender?: Gender;
}

export interface MedicalContext {
  symptoms: MedicalSymptom[];
  psychProfile: PatientPsychProfile;
  recommendedSpecialty: string;
  confidence: number; // 0-1
  alternativeSpecialties?: string[];
}

export interface SessionData {
  id: string;
  stage: SessionStage;
  medicalContext?: MedicalContext;
  
  // Datos del paciente
  patientData?: {
    name?: string;
    rut?: string;
    phone?: string;
    email?: string;
    age?: number;
  };
  
  // Estado de la conversación
  conversationState: {
    motivo?: string;
    specialty?: string;
    selectedOptions?: any[];
    attempts: number;
    lastActivity: number;
    messageHistory: string[];
  };
  
  // Información médica
  appointmentData?: {
    selectedRecord?: any;
    doctorInfo?: {
      name: string;
      specialty: string;
      atiende: string;
    };
    alternativeRecords?: any[];
  };
}

export interface EmpathyContext {
  emotionalState: EmotionalState;
  urgency: UrgencyLevel;
  patientProfile: PatientPsychProfile;
  medicalSymptoms: MedicalSymptom[];
  conversationStage: SessionStage;
}

export interface BotResponse {
  text: string;
  session?: SessionData;
  error?: string;
  paymentButton?: {
    text: string;
    amount: string;
    url: string;
  };
  metadata?: {
    confidence: number;
    specialty?: string;
    nextStage?: SessionStage;
    empathyGenerated?: boolean;
    processingTime?: number;
    source?: string;
    fastPath?: boolean;
    airtableResults?: any;
    doctorSearch?: any;
    fallbackMode?: boolean;
    noResults?: boolean;
    medicalAnalysis?: any;
    needsMoreInfo?: boolean;
  };
}

export interface AnalysisResult {
  isGreeting: boolean;
  isMedical: boolean;
  isSpecificDoctor: boolean;
  medicalContext?: MedicalContext;
  doctorName?: string;
  confidence: number;
}

// Constantes médicas
export const MEDICAL_SPECIALTIES = [
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

export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number];

export const SYMPTOM_KEYWORDS: Record<MedicalSpecialty, string[]> = {
  'Oftalmología': ['ojos', 'vista', 'visión', 'borroso', 'manchas', 'flotantes', 'lagrimeo', 'picazón', 'rojo', 'irritado', 'oftalmólogo', 'oftalmología', 'oculista'],
  'Cardiología': ['corazón', 'pecho', 'palpitaciones', 'taquicardia', 'presión', 'dolor pectoral', 'cardiólogo', 'cardiología', 'cardiovascular'],
  'Neurología': ['cabeza', 'dolor de cabeza', 'migraña', 'mareo', 'vértigo', 'memoria', 'temblor', 'neurólogo', 'neurología', 'nervioso'],
  'Dermatología': ['piel', 'rash', 'picazón', 'roncha', 'acné', 'mancha', 'lunar', 'dermatitis', 'dermatólogo', 'dermatología'],
  'Gastroenterología': ['estómago', 'digestión', 'acidez', 'reflujo', 'diarrea', 'estreñimiento', 'dolor abdominal', 'gastroenterólogo', 'gastroenterología', 'digestivo'],
  'Otorrinolaringología': ['oído', 'garganta', 'nariz', 'ronquera', 'dolor de garganta', 'sinusitis', 'otorrino', 'otorrinolaringólogo', 'orl'],
  'Ginecología': ['menstruación', 'regla', 'embarazo', 'dolor pélvico', 'flujo vaginal', 'ginecólogo', 'ginecología', 'gineco'],
  'Urología': ['orina', 'riñón', 'vejiga', 'próstata', 'dolor al orinar', 'sangre en orina', 'urólogo', 'urología'],
  'Traumatología': ['hueso', 'fractura', 'esguince', 'articulación', 'dolor muscular', 'lesión', 'traumatólogo', 'traumatología', 'ortopedia'],
  'Endocrinología': ['diabetes', 'tiroides', 'hormona', 'glucosa', 'peso', 'metabolismo', 'endocrinólogo', 'endocrinología'],
  'Pediatría': ['niño', 'bebé', 'fiebre infantil', 'crecimiento', 'vacuna', 'pediatra', 'pediatría'],
  'Psiquiatría': ['ansiedad', 'depresión', 'estrés', 'insomnio', 'pánico', 'estado de ánimo', 'psiquiatra', 'psiquiatría', 'mental'],
  'Medicina Familiar': ['control', 'chequeo', 'general', 'rutina', 'preventivo', 'medicina general', 'médico general', 'familiar']
};