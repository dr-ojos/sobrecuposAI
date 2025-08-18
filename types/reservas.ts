// types/reservas.ts - Tipos para sistema de reservas
export interface PacienteData {
  nombre: string;
  email: string;
  telefono: string;
  rut: string;
  edad: number;
}

export interface ReservaRequest {
  sobrecupoId: string;
  pacienteData: PacienteData;
}

export interface ReservaResponse {
  success: boolean;
  message: string;
  data: {
    sobrecupoId: string;
    patientId: string | null;
    patientData: {
      nombre: string;
      email: string;
      telefono: string;
    };
    timestamp: string;
  };
}

export interface ReservaError {
  error: string;
  message?: string;
  required?: string[];
  timestamp?: string;
}

export interface AirtablePatient {
  id: string;
  fields: {
    Nombre: string;
    Email: string;
    Telefono: string;
    Rut: string;
    Edad: number;
  };
  createdTime?: string;
}

export interface SobrecupoUpdateFields {
  Disponible: 'Si' | 'No';
  Nombre?: string;
  Email?: string;
  Telefono?: string;
  RUT?: string;
  Edad?: number;
  Paciente?: string[];
}

export interface AirtableUpdateResponse {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
}