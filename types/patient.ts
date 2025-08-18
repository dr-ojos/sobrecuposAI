// types/patient.ts - Tipos para sistema de pacientes
export interface PatientFormData {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
  rut: string;
}

export interface PatientSignUpRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  rut: string;
}

export interface PatientSignUpResponse {
  success: boolean;
  message: string;
  patient?: {
    id: string;
    name: string;
    firstName: string;
    email: string;
    whatsapp: string;
    rut: string;
    registeredAt: string;
  };
}

export interface PatientSignInRequest {
  email: string;
  password: string;
}

export interface PatientSignInResponse {
  success: boolean;
  message: string;
  patient?: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    rut: string;
    registeredAt: string;
    preferredSpecialties?: string[];
    location?: string;
  };
}

// Airtable record types
export interface AirtablePatientRecord {
  id: string;
  fields: {
    Name: string;
    Email: string;
    WhatsApp: string;
    RUT: string;
    Password: string;
    AcceptTerms: boolean;
    AcceptWhatsApp: boolean;
    UserType: string;
    Status: string;
    Created: string;
    RegistrationSource: string;
    LastActivity: string;
    FirstName: string;
    LastName: string;
    IsRegisteredUser: boolean;
    PreferredSpecialties?: string[];
    Location?: string;
  };
  createdTime?: string;
}

export interface AirtableCreateResponse {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export interface AirtableListResponse {
  records: AirtablePatientRecord[];
  offset?: string;
}

export interface AirtableError {
  error: {
    type: string;
    message: string;
  };
}

// API Error response type
export interface ApiErrorResponse {
  message: string;
}

export interface PatientProfile {
  id: string;
  fields: {
    Nombre: string;
    Apellidos?: string;
    Email: string;
    Telefono: string;
    Rut: string;
    FechaRegistro?: string;
    Estado?: string;
  };
  createdTime?: string;
}

export interface PatientSession {
  id: string;
  email: string;
  nombre: string;
  userType: 'patient';
}

export interface PatientDashboardData {
  appointments: PatientAppointment[];
  profile: PatientProfile;
  upcomingCount: number;
  pastCount: number;
}

export interface PatientAppointment {
  id: string;
  fields: {
    Fecha: string;
    Hora: string;
    Especialidad: string;
    Doctor: string;
    Clinica: string;
    Direccion: string;
    Estado: 'Confirmada' | 'Pendiente' | 'Cancelada' | 'Completada';
  };
  createdTime: string;
}

// Additional types for patients API
export interface Patient {
  id: string;
  fields: PatientFields;
  createdTime?: string;
}

export interface PatientFields {
  Name: string;
  Email: string;
  WhatsApp: string;
  RUT: string;
  Password?: string;
  AcceptTerms?: boolean;
  AcceptWhatsApp?: boolean;
  UserType?: string;
  Status?: string;
  Created?: string;
  RegistrationSource?: string;
  LastActivity?: string;
  FirstName?: string;
  LastName?: string;
  IsRegisteredUser?: boolean;
  PreferredSpecialties?: string[];
  Location?: string;
}

export interface CreatePatientRequest {
  name: string;
  email: string;
  phone: string;
  rut?: string;
  userType: string;
  acceptTerms: boolean;
  acceptWhatsApp?: boolean;
  preferredSpecialties?: string[];
  location?: string;
}

export interface UpdatePatientRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  rut?: string;
  preferredSpecialties?: string[];
  location?: string;
}

export interface PatientResponse {
  success: boolean;
  patient?: Patient;
  message?: string;
}

export interface PatientListResponse {
  success: boolean;
  patients: Patient[];
  offset?: string;
  message?: string;
}

export interface AirtablePatchRequest {
  records: Array<{
    id: string;
    fields: Partial<PatientFields>;
  }>;
}

export interface WelcomeWhatsAppData {
  to: string;
  message: string;
  patientId: string;
}