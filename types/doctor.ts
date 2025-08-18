// types/doctor.ts - Tipos para médicos
export interface Doctor {
  id: string;
  fields: DoctorFields;
  createdTime?: string;
}

export interface DoctorFields {
  Name: string;
  Especialidad: string;
  WhatsApp?: string;
  Email?: string;
  Sobrecupostest?: string[];
  Clinicas?: string[];
  Atiende: 'Adultos' | 'Niños' | 'Ambos';
  Seguros?: string[];
  Estado: 'Validado' | 'Pendiente' | 'Rechazado';
  Password?: string;
  PhotoURL?: string;
  RSS?: string;
  Experiencia?: string;
  Telefono?: string;
  Direccion?: string;
  Comuna?: string;
  Precio?: number;
  Disponibilidad?: string;
  Horarios?: string;
}

export interface CreateDoctorRequest {
  Name: string;
  Especialidad: string;
  WhatsApp?: string;
  Email?: string;
  Atiende: 'Adultos' | 'Niños' | 'Ambos';
  Seguros?: string[];
  Estado?: 'Validado' | 'Pendiente' | 'Rechazado';
  Password?: string;
  Experiencia?: string;
  Telefono?: string;
  Direccion?: string;
  Comuna?: string;
  Precio?: number;
}

export interface UpdateDoctorRequest {
  id: string;
  Name?: string;
  Especialidad?: string;
  WhatsApp?: string;
  Email?: string;
  Clinicas?: string[];
  Atiende?: 'Adultos' | 'Niños' | 'Ambos';
  Seguros?: string[];
  Estado?: 'Validado' | 'Pendiente' | 'Rechazado';
  Password?: string;
  PhotoURL?: string;
  Experiencia?: string;
  Telefono?: string;
  Direccion?: string;
  Comuna?: string;
  Precio?: number;
  Disponibilidad?: string;
  Horarios?: string;
}

export interface AirtableResponse<T> {
  records: T[];
  offset?: string;
}

export interface AirtableError {
  error: {
    type: string;
    message: string;
  };
}