// Servicio para todas las operaciones con Airtable
import { AirtableRecord, DoctorInfo, ProcessedDoctorInfo } from '../types';

interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableId: string;
  doctorsTable: string;
  patientsTable: string;
}

export class AirtableService {
  private config: AirtableConfig;

  constructor() {
    this.config = {
      apiKey: process.env.AIRTABLE_API_KEY!,
      baseId: process.env.AIRTABLE_BASE_ID!,
      tableId: 'SobrecuposTest', // Usar tabla correcta
      doctorsTable: process.env.AIRTABLE_DOCTORS_TABLE!,
      patientsTable: process.env.AIRTABLE_PATIENTS_TABLE!,
    };
  }

  // Helper para normalizar booleanos de Airtable
  normalizeBoolean(value: any): boolean {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'si' || value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  // Obtener todos los sobrecupos
  async fetchAllSobrecupos(): Promise<AirtableRecord[]> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.tableId}?maxRecords=100`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        console.log(`❌ Error response: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('❌ Error fetching all sobrecupos:', error);
      return [];
    }
  }

  // Obtener sobrecupos por especialidad
  async fetchSobrecuposBySpecialty(specialty: string): Promise<AirtableRecord[]> {
    try {
      const allRecords = await this.fetchAllSobrecupos();
      
      // Filtrar por especialidad y disponibilidad
      const filtered = allRecords.filter(record => {
        const especialidadRecord = record.fields?.Especialidad;
        const disponible = this.normalizeBoolean(record.fields?.Disponible);
        return especialidadRecord === specialty && disponible;
      });

      console.log(`📊 Sobrecupos encontrados para ${specialty}: ${filtered.length}`);
      return filtered;
    } catch (error) {
      console.error(`❌ Error fetching sobrecupos para ${specialty}:`, error);
      return [];
    }
  }

  // Obtener información de un médico específico
  async getDoctorInfo(doctorId: string): Promise<DoctorInfo | null> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.doctorsTable}/${doctorId}`,
        { headers: { Authorization: `Bearer ${this.config.apiKey}` } }
      );

      if (!response.ok) {
        console.log(`❌ Error getting doctor ${doctorId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.fields || null;
    } catch (error) {
      console.error(`❌ Error getting doctor info for ${doctorId}:`, error);
      return null;
    }
  }

  // Procesar información del médico con cache
  async getDoctorInfoCached(doctorId: string, cache = new Map()): Promise<ProcessedDoctorInfo> {
    if (cache.has(doctorId)) {
      return cache.get(doctorId);
    }

    try {
      const doctorInfo = await this.getDoctorInfo(doctorId);
      
      const processed: ProcessedDoctorInfo = {
        name: doctorInfo?.Name || 'Médico',
        atiende: doctorInfo?.Atiende || 'Adultos',
        areasInteres: doctorInfo?.AreasInteres
      };

      cache.set(doctorId, processed);
      return processed;
    } catch (error) {
      console.error(`❌ Error processing doctor info for ${doctorId}:`, error);
      const defaultInfo: ProcessedDoctorInfo = { name: 'Médico', atiende: 'Adultos' };
      cache.set(doctorId, defaultInfo);
      return defaultInfo;
    }
  }

  // Obtener todos los médicos
  async getAllDoctors(): Promise<DoctorInfo[]> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.doctorsTable}?maxRecords=100`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.records || []).map((record: any) => record.fields);
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return [];
    }
  }

  // Obtener especialidades disponibles
  async getAvailableSpecialties(): Promise<string[]> {
    try {
      const records = await this.fetchAllSobrecupos();
      
      const especialidades = [...new Set(
        records
          .filter(r => r.fields?.Especialidad && this.normalizeBoolean(r.fields?.Disponible))
          .map(r => r.fields.Especialidad!)
      )];

      return especialidades;
    } catch (error) {
      console.error('Error obteniendo especialidades:', error);
      return [];
    }
  }

  // Buscar médicos por especialidad
  async findDoctorsBySpecialty(specialty: string, excludeName?: string): Promise<DoctorInfo[]> {
    try {
      const allDoctors = await this.getAllDoctors();
      return allDoctors.filter(doctor => 
        doctor.Especialidad === specialty && 
        (!excludeName || doctor.Name !== excludeName)
      );
    } catch (error) {
      console.error(`Error finding doctors for ${specialty}:`, error);
      return [];
    }
  }

  // Buscar sobrecupos de un médico específico
  async findSobrecuposByDoctor(doctorId: string): Promise<AirtableRecord[]> {
    try {
      const allRecords = await this.fetchAllSobrecupos();
      
      // Filtrar manualmente por médico y disponibilidad
      return allRecords.filter(record => {
        const medicos = record.fields?.Médico || [];
        const disponible = this.normalizeBoolean(record.fields?.Disponible);
        const medicoArray = Array.isArray(medicos) ? medicos : [medicos];
        
        return medicoArray.includes(doctorId) && disponible;
      });
    } catch (error) {
      console.error(`❌ Error finding sobrecupos for doctor ${doctorId}:`, error);
      return [];
    }
  }

  // Crear paciente en Airtable
  async createPatient(patientData: any): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.patientsTable}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: patientData
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating patient: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      return null;
    }
  }

  // Actualizar sobrecupo (marcar como reservado)
  async updateSobrecupo(sobrecupoId: string, updateData: any): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.config.baseId}/${this.config.tableId}/${sobrecupoId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: updateData
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error(`❌ Error updating sobrecupo ${sobrecupoId}:`, error);
      return false;
    }
  }
}

// Instancia singleton del servicio
export const airtableService = new AirtableService();