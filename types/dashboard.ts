// types/dashboard.ts - Tipos para dashboard médico
export interface DashboardStats {
  totalSobrecupos: number;
  disponibles: number;
  reservados: number;
  clinicas: number;
}

export interface SobrecupoItem {
  id: string;
  fields: {
    Especialidad: string;
    Fecha: string;
    Hora: string;
    Clínica: string;
    Dirección: string;
    Disponible: 'Si' | 'No' | boolean;
    Médico?: string[];
    Nombre?: string;
  };
  createdTime?: string;
}

export interface DoctorProfile {
  id: string;
  fields: {
    Name: string;
    Especialidad: string;
    Email?: string;
    WhatsApp?: string;
    Estado?: string;
    Atiende?: string;
    Clinicas?: string[];
  };
  createdTime?: string;
}

export interface LoadingState {
  loading: boolean;
  loadingProgress: number;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  userType?: string;
  doctorId?: string;
}

export interface ExtendedSession {
  user?: SessionUser;
  expires: string;
}