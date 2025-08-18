// app/api/bot/airtable/sobrecupos-service.ts
import { MedicalSpecialty, SessionData } from '../../../../types/medical';

interface SobrecupoRecord {
  id: string;
  fields: {
    Especialidad: string;
    Medico: string;
    Atiende: string;
    Comuna: string;
    Ubicacion: string;
    telefono: string;
    Whatsapp: string;
    'Fecha y Hora': string;
    Estado: string;
    Motivo?: string;
    'Precio Sobrecupo': number;
    Observaciones?: string;
  };
}

interface SearchFilters {
  specialty?: string;
  comuna?: string;
  doctorName?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  maxPrice?: number;
}

export class SobrecuposService {
  private static readonly AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  private static readonly AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  private static readonly TABLE_NAME = 'Sobrecupos';
  
  private static readonly URGENCY_PRIORITIES = {
    critical: 1,
    high: 2,
    normal: 3,
    low: 4
  };

  static async buscarSobrecupos(filters: SearchFilters): Promise<{
    records: SobrecupoRecord[];
    metadata: {
      totalFound: number;
      bestMatch?: SobrecupoRecord;
      alternatives: SobrecupoRecord[];
      searchStrategy: string;
    };
  }> {
    if (!this.AIRTABLE_API_KEY || !this.AIRTABLE_BASE_ID) {
      throw new Error('Configuración de Airtable incompleta');
    }

    try {
      const query = this.buildSearchQuery(filters);
      const response = await this.executeAirtableQuery(query);
      const records = response.records as SobrecupoRecord[];

      // Aplicar scoring inteligente
      const scoredRecords = this.applyIntelligentScoring(records, filters);
      
      return {
        records: scoredRecords,
        metadata: {
          totalFound: records.length,
          bestMatch: scoredRecords[0],
          alternatives: scoredRecords.slice(1, 4),
          searchStrategy: this.getSearchStrategy(filters)
        }
      };
    } catch (error) {
      console.error('❌ Error SobrecuposService:', error);
      throw new Error('Error al buscar sobrecupos disponibles');
    }
  }

  static async buscarPorEspecialidad(specialty: string): Promise<SobrecupoRecord[]> {
    const filters = { specialty };
    const result = await this.buscarSobrecupos(filters);
    return result.records;
  }

  static async buscarPorMedico(doctorName: string): Promise<SobrecupoRecord[]> {
    const filters = { doctorName };
    const result = await this.buscarSobrecupos(filters);
    return result.records;
  }

  static async buscarUrgente(specialty?: string): Promise<SobrecupoRecord[]> {
    const filters = { 
      urgency: 'high' as const,
      specialty 
    };
    const result = await this.buscarSobrecupos(filters);
    return result.records;
  }

  private static buildSearchQuery(filters: SearchFilters): string {
    const conditions: string[] = [];
    
    // Estado disponible
    conditions.push("Estado = 'Disponible'");
    
    // Filtro por especialidad
    if (filters.specialty) {
      conditions.push(`FIND("${filters.specialty}", Especialidad) > 0`);
    }
    
    // Filtro por médico
    if (filters.doctorName) {
      conditions.push(`FIND("${filters.doctorName}", Medico) > 0`);
    }
    
    // Filtro por comuna
    if (filters.comuna) {
      conditions.push(`FIND("${filters.comuna}", Comuna) > 0`);
    }
    
    // Filtro por precio máximo
    if (filters.maxPrice) {
      conditions.push(`{Precio Sobrecupo} <= ${filters.maxPrice}`);
    }

    return conditions.length > 0 ? `AND(${conditions.join(', ')})` : '';
  }

  private static async executeAirtableQuery(filterFormula: string): Promise<any> {
    const url = new URL(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${this.TABLE_NAME}`);
    
    if (filterFormula) {
      url.searchParams.append('filterByFormula', filterFormula);
    }
    url.searchParams.append('sort[0][field]', 'Fecha y Hora');
    url.searchParams.append('sort[0][direction]', 'asc');
    url.searchParams.append('maxRecords', '50');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    return await response.json();
  }

  private static applyIntelligentScoring(
    records: SobrecupoRecord[], 
    filters: SearchFilters
  ): SobrecupoRecord[] {
    return records
      .map(record => ({
        ...record,
        score: this.calculateRecordScore(record, filters)
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...record }) => record as SobrecupoRecord);
  }

  private static calculateRecordScore(record: SobrecupoRecord, filters: SearchFilters): number {
    let score = 100; // Base score
    
    // Scoring por especialidad (match exacto = +50)
    if (filters.specialty) {
      const specialtyMatch = this.calculateSpecialtyMatch(
        record.fields.Especialidad, 
        filters.specialty
      );
      score += specialtyMatch * 50;
    }
    
    // Scoring por médico (match exacto = +30)
    if (filters.doctorName) {
      const doctorMatch = this.calculateDoctorMatch(
        record.fields.Medico, 
        filters.doctorName
      );
      score += doctorMatch * 30;
    }
    
    // Scoring por urgencia (fecha más cercana = mejor)
    if (filters.urgency) {
      const urgencyScore = this.calculateUrgencyScore(
        record.fields['Fecha y Hora'], 
        filters.urgency
      );
      score += urgencyScore;
    }
    
    // Scoring por precio (más barato = mejor)
    const priceScore = this.calculatePriceScore(record.fields['Precio Sobrecupo']);
    score += priceScore;
    
    // Penalty por falta de información
    if (!record.fields.telefono && !record.fields.Whatsapp) {
      score -= 20;
    }
    
    return score;
  }

  private static calculateSpecialtyMatch(recordSpecialty: string, searchSpecialty: string): number {
    const normalizedRecord = recordSpecialty.toLowerCase();
    const normalizedSearch = searchSpecialty.toLowerCase();
    
    if (normalizedRecord === normalizedSearch) return 1;
    if (normalizedRecord.includes(normalizedSearch)) return 0.8;
    if (normalizedSearch.includes(normalizedRecord)) return 0.6;
    
    // Sinónimos médicos comunes
    const synonyms: Record<string, string[]> = {
      'cardiologia': ['corazon', 'cardiovascular'],
      'otorrinolaringologia': ['oido', 'garganta', 'nariz', 'otorrino'],
      'traumatologia': ['huesos', 'ortopedia', 'traumato'],
      'ginecologia': ['mujer', 'gineco'],
      'pediatria': ['niños', 'pediatra'],
      'dermatologia': ['piel', 'dermato']
    };
    
    for (const [specialty, syns] of Object.entries(synonyms)) {
      if (normalizedRecord.includes(specialty) && 
          syns.some(syn => normalizedSearch.includes(syn))) {
        return 0.7;
      }
    }
    
    return 0;
  }

  private static calculateDoctorMatch(recordDoctor: string, searchDoctor: string): number {
    const normalizedRecord = recordDoctor.toLowerCase();
    const normalizedSearch = searchDoctor.toLowerCase();
    
    if (normalizedRecord.includes(normalizedSearch)) return 1;
    
    // Match por apellido
    const searchWords = normalizedSearch.split(' ');
    const recordWords = normalizedRecord.split(' ');
    
    const matchingWords = searchWords.filter(word => 
      recordWords.some(rWord => rWord.includes(word) || word.includes(rWord))
    );
    
    return matchingWords.length / searchWords.length;
  }

  private static calculateUrgencyScore(fechaHora: string, urgency: string): number {
    try {
      const appointmentDate = new Date(fechaHora);
      const now = new Date();
      const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      const urgencyMultiplier = this.URGENCY_PRIORITIES[urgency as keyof typeof this.URGENCY_PRIORITIES] || 3;
      
      // Para urgencias críticas, priorizar citas más cercanas
      if (urgency === 'critical') {
        if (hoursUntil <= 2) return 40;
        if (hoursUntil <= 6) return 30;
        if (hoursUntil <= 24) return 20;
        return 10;
      }
      
      // Para otras urgencias, balance entre disponibilidad y tiempo
      if (hoursUntil <= 24) return 25;
      if (hoursUntil <= 72) return 20;
      if (hoursUntil <= 168) return 15; // 1 semana
      return 10;
      
    } catch (error) {
      return 0;
    }
  }

  private static calculatePriceScore(price: number): number {
    if (!price) return 0;
    
    // Scoring inverso del precio (más barato = mejor score)
    if (price <= 30000) return 20;
    if (price <= 50000) return 15;
    if (price <= 80000) return 10;
    if (price <= 120000) return 5;
    return 0;
  }

  private static getSearchStrategy(filters: SearchFilters): string {
    const strategies: string[] = [];
    
    if (filters.specialty) strategies.push('especialidad');
    if (filters.doctorName) strategies.push('médico_específico');
    if (filters.urgency === 'critical') strategies.push('urgencia_crítica');
    if (filters.comuna) strategies.push('ubicación');
    if (filters.maxPrice) strategies.push('precio_máximo');
    
    return strategies.join(' + ') || 'búsqueda_general';
  }

  // Método para actualizar estado de sobrecupo
  static async actualizarEstado(recordId: string, nuevoEstado: string, motivo?: string): Promise<boolean> {
    try {
      const updateData: any = {
        fields: {
          Estado: nuevoEstado
        }
      };
      
      if (motivo) {
        updateData.fields.Motivo = motivo;
      }

      const response = await fetch(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${this.TABLE_NAME}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      return false;
    }
  }

  // Método para obtener estadísticas
  static async obtenerEstadisticas(): Promise<{
    totalDisponibles: number;
    porEspecialidad: Record<string, number>;
    promedioPrecios: Record<string, number>;
  }> {
    try {
      const response = await this.executeAirtableQuery("Estado = 'Disponible'");
      const records = response.records as SobrecupoRecord[];
      
      const porEspecialidad = records.reduce((acc, record) => {
        const esp = record.fields.Especialidad;
        acc[esp] = (acc[esp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const promedioPrecios = Object.keys(porEspecialidad).reduce((acc, esp) => {
        const recordsEsp = records.filter(r => r.fields.Especialidad === esp);
        const precios = recordsEsp.map(r => r.fields['Precio Sobrecupo']).filter(p => p > 0);
        const promedio = precios.length > 0 ? 
          precios.reduce((sum, p) => sum + p, 0) / precios.length : 0;
        acc[esp] = Math.round(promedio);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDisponibles: records.length,
        porEspecialidad,
        promedioPrecios
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalDisponibles: 0,
        porEspecialidad: {},
        promedioPrecios: {}
      };
    }
  }
}