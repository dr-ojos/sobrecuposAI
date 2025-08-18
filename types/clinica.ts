// types/clinica.ts - Tipos para sistema de clínicas
export interface ClinicaFields {
  Nombre: string;
  Direccion: string;
  Comuna: string;
  Telefono?: string;
}

export interface Clinica {
  id: string;
  fields: ClinicaFields;
  createdTime?: string;
}

export interface CreateClinicaRequest {
  Nombre: string;
  Direccion: string;
  Comuna: string;
  Telefono?: string;
}

export interface UpdateClinicaRequest {
  id: string;
  Nombre?: string;
  Direccion?: string;
  Comuna?: string;
  Telefono?: string;
}

export interface ClinicaResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface ClinicaListResponse extends Array<Clinica> {}

export interface AirtableClinicaRecord {
  fields: ClinicaFields;
}

export interface AirtableClinicaPatchRequest {
  records: Array<{
    id: string;
    fields: Partial<ClinicaFields>;
  }>;
}