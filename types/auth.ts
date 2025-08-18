// types/auth.ts - Tipos para sistema de autenticación NextAuth
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export interface DoctorData {
  Name: string;
  Email: string;
  Password?: string;
  Especialidad?: string;
  WhatsApp?: string;
  Estado?: string;
  Atiende?: string;
  Clinicas?: string[];
}

export interface AirtableRecord {
  id: string;
  fields: DoctorData;
  createdTime?: string;
}

export interface AirtableResponse {
  records: AirtableRecord[];
}

// Extender tipos de NextAuth
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      doctorId?: string;
      doctorData?: DoctorData;
      userType?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    doctorId?: string;
    doctorData?: DoctorData;
    userType?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    doctorId?: string;
    doctorData?: DoctorData;
    userType?: string;
  }
}

export interface CredentialsInput {
  email: string;
  password: string;
}

export interface AuthorizeResult {
  id: string;
  email: string;
  name: string;
  doctorData: DoctorData;
}