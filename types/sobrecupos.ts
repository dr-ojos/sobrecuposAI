// types/sobrecupos.ts - Tipos para página de sobrecupos médicos
export interface NewSobrecupo {
  clinica: string;
  direccion: string;
  fecha: string;
  hora: string;
  clinicaId: string;
}

export interface Clinica {
  id: string;
  fields: {
    Nombre: string;
    Direccion: string;
    Telefono?: string;
    Email?: string;
  };
  createdTime?: string;
}

export interface SobrecupoFilter {
  'proximos': string;
  'reservados': string;
  'disponibles': string;
  'pasados': string;
}

export type FilterType = keyof SobrecupoFilter;

export interface SobrecupoFormData {
  clinica: string;
  direccion: string;
  fecha: string;
  hora: string;
  especialidad?: string;
}

export interface CreateSobrecupoRequest {
  fields: {
    Médico: string[];
    Especialidad: string;
    Fecha: string;
    Hora: string;
    Clínica: string;
    Dirección: string;
    Disponible: 'Si';
  };
}

export interface CreateSobrecupoResponse {
  id: string;
  fields: {
    Médico: string[];
    Especialidad: string;
    Fecha: string;
    Hora: string;
    Clínica: string;
    Dirección: string;
    Disponible: 'Si';
  };
  createdTime: string;
}