// types/sobrecupo.ts - Tipos para sistema de sobrecupos
export interface SobrecupoFields {
  Especialidad: string;
  Médico: string[]; // Array con ID del médico
  Clínica: string;
  Dirección: string;
  Fecha: string;
  Hora: string;
  Disponible: 'Si' | 'No';
  MedicoNombre?: string; // Campo calculado con nombre real del médico
}

export interface Sobrecupo {
  id: string;
  fields: SobrecupoFields;
  createdTime?: string;
}

export interface CreateSobrecupoRequest {
  medico: string; // ID del médico
  especialidad: string;
  clinica: string;
  direccion: string;
  fecha: string;
  hora: string;
}

export interface SobrecupoResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  details?: string;
}

export interface SobrecupoListResponse extends Array<Sobrecupo> {}

export interface AirtableSobrecupoRecord {
  fields: Omit<SobrecupoFields, 'MedicoNombre'>;
}

export interface DoctorInfo {
  id: string;
  fields?: {
    Name?: string;
  };
}

export interface AirtableErrorResponse {
  error?: {
    message?: string;
    type?: string;
  };
}