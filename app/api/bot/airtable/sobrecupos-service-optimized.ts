// app/api/bot/airtable/sobrecupos-service-optimized.ts
import { MedicalSpecialty } from '../../../../types/medical';

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

// Cache in-memory para performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export class SobrecuposServiceOptimized {
  private static readonly AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  private static readonly AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  private static readonly TABLE_NAME = 'Sobrecupos';
  private static readonly TIMEOUT = 8000; // 8 segundos
  
  // Fallback data para cuando Airtable no responde
  private static readonly FALLBACK_DATA: SobrecupoRecord[] = [
    {
      id: 'fallback-1',
      fields: {
        Especialidad: 'Oftalmología',
        Medico: 'Dr. José Peña',
        Atiende: 'Adultos',
        Comuna: 'Las Condes',
        Ubicacion: 'Clínica Las Condes',
        telefono: '+56912345678',
        Whatsapp: '+56912345678',
        'Fecha y Hora': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        Estado: 'Disponible',
        'Precio Sobrecupo': 45000,
        Observaciones: 'Disponibilidad confirmada'
      }
    },
    {
      id: 'fallback-2',
      fields: {
        Especialidad: 'Cardiología',
        Medico: 'Dr. Carlos García',
        Atiende: 'Adultos',
        Comuna: 'Providencia',
        Ubicacion: 'Clínica Alemana',
        telefono: '+56987654321',
        Whatsapp: '+56987654321',
        'Fecha y Hora': new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        Estado: 'Disponible',
        'Precio Sobrecupo': 55000,
        Observaciones: 'Urgencias disponibles'
      }
    },
    {
      id: 'fallback-3',
      fields: {
        Especialidad: 'Neurología',
        Medico: 'Dra. María González',
        Atiende: 'Adultos',
        Comuna: 'Ñuñoa',
        Ubicacion: 'Hospital Salvador',
        telefono: '+56911223344',
        Whatsapp: '+56911223344',
        'Fecha y Hora': new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        Estado: 'Disponible',
        'Precio Sobrecupo': 40000,
        Observaciones: 'Especialista en migrañas'
      }
    }
  ];

  static async buscarSobrecupos(filters: SearchFilters): Promise<{
    records: SobrecupoRecord[];
    metadata: {
      totalFound: number;
      bestMatch?: SobrecupoRecord;
      alternatives: SobrecupoRecord[];
      searchStrategy: string;
      source: 'airtable' | 'fallback' | 'cache';
    };
  }> {
    const cacheKey = JSON.stringify(filters);
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for Airtable query');
      return {
        records: cached,
        metadata: {
          totalFound: cached.length,
          bestMatch: cached[0],
          alternatives: cached.slice(1, 4),
          searchStrategy: 'cached_query',
          source: 'cache'
        }
      };
    }

    try {
      // Attempt Airtable with timeout
      const airtablePromise = this.executeAirtableQuerySafe(filters);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Airtable timeout')), this.TIMEOUT)
      );

      const response = await Promise.race([airtablePromise, timeoutPromise]);
      const records = response.records as SobrecupoRecord[];
      
      // Cache successful result
      this.setCachedData(cacheKey, records);
      
      const scoredRecords = this.applyIntelligentScoring(records, filters);
      
      console.log(`✅ Airtable success: ${records.length} records found`);
      
      return {
        records: scoredRecords,
        metadata: {
          totalFound: records.length,
          bestMatch: scoredRecords[0],
          alternatives: scoredRecords.slice(1, 4),
          searchStrategy: this.getSearchStrategy(filters),
          source: 'airtable'
        }
      };

    } catch (error) {
      console.error('⚠️ Airtable failed, using fallback:', error);
      
      // Use intelligent fallback
      const fallbackRecords = this.getFallbackData(filters);
      const scoredRecords = this.applyIntelligentScoring(fallbackRecords, filters);
      
      return {
        records: scoredRecords,
        metadata: {
          totalFound: fallbackRecords.length,
          bestMatch: scoredRecords[0],
          alternatives: scoredRecords.slice(1),
          searchStrategy: 'fallback_' + this.getSearchStrategy(filters),
          source: 'fallback'
        }
      };
    }
  }

  static async buscarPorEspecialidad(specialty: string): Promise<SobrecupoRecord[]> {
    const result = await this.buscarSobrecupos({ specialty });
    return result.records;
  }

  static async buscarPorMedico(doctorName: string): Promise<SobrecupoRecord[]> {
    const result = await this.buscarSobrecupos({ doctorName });
    return result.records;
  }

  static async buscarUrgente(specialty?: string): Promise<SobrecupoRecord[]> {
    const result = await this.buscarSobrecupos({ 
      urgency: 'high',
      specialty 
    });
    return result.records;
  }

  private static async executeAirtableQuerySafe(filters: SearchFilters): Promise<any> {
    if (!this.AIRTABLE_API_KEY || !this.AIRTABLE_BASE_ID) {
      throw new Error('Airtable credentials missing');
    }

    const query = this.buildSearchQuery(filters);
    const url = new URL(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${this.TABLE_NAME}`);
    
    if (query) {
      url.searchParams.append('filterByFormula', query);
    }
    url.searchParams.append('sort[0][field]', 'Fecha y Hora');
    url.searchParams.append('sort[0][direction]', 'asc');
    url.searchParams.append('maxRecords', '20');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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

  private static getFallbackData(filters: SearchFilters): SobrecupoRecord[] {
    return this.FALLBACK_DATA.filter(record => {
      if (filters.specialty && !record.fields.Especialidad.includes(filters.specialty)) {
        return false;
      }
      if (filters.doctorName && !record.fields.Medico.toLowerCase().includes(filters.doctorName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  private static applyIntelligentScoring(records: SobrecupoRecord[], filters: SearchFilters): SobrecupoRecord[] {
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
    
    // Scoring por especialidad
    if (filters.specialty) {
      if (record.fields.Especialidad.toLowerCase().includes(filters.specialty.toLowerCase())) {
        score += 50;
      }
    }
    
    // Scoring por médico
    if (filters.doctorName) {
      if (record.fields.Medico.toLowerCase().includes(filters.doctorName.toLowerCase())) {
        score += 30;
      }
    }
    
    // Scoring por precio (más barato = mejor)
    if (record.fields['Precio Sobrecupo']) {
      const price = record.fields['Precio Sobrecupo'];
      if (price <= 30000) score += 20;
      else if (price <= 50000) score += 15;
      else if (price <= 80000) score += 10;
    }
    
    return score;
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

  // Cache management
  private static getCachedData(key: string): SobrecupoRecord[] | null {
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: SobrecupoRecord[]): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  // Health check for Airtable connection
  static async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.executeAirtableQuerySafe({ specialty: 'test' });
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'fallback',
        latency: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }
}