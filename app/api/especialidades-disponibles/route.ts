// app/api/especialidades-disponibles/route.ts - API de especialidades disponibles en TypeScript
import { NextResponse } from 'next/server';
import type { EspecialidadResponse } from '../../../types/homepage';

interface SobrecupoRecord {
  fields?: {
    Fecha?: string;
    Especialidad?: string;
    Disponible?: string;
  };
}

interface SobrecuposApiResponse {
  success: boolean;
  records?: SobrecupoRecord[];
  error?: string;
}

export async function GET(): Promise<NextResponse<EspecialidadResponse>> {
  try {
    console.log('📡 Obteniendo especialidades desde sobrecupos disponibles...');
    
    // Usar el endpoint que ya funciona
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sobrecupos/available`);
    
    if (!response.ok) {
      throw new Error(`Error obteniendo sobrecupos: ${response.status}`);
    }
    
    const data: SobrecuposApiResponse = await response.json();
    
    if (!data.success || !data.records) {
      throw new Error('No se pudieron obtener los sobrecupos');
    }
    
    // Filtrar por fecha futura y extraer especialidades únicas
    const today = new Date().toISOString().split('T')[0];
    
    const especialidadesDisponibles = [...new Set(
      data.records
        .filter(record => {
          const fields = record.fields || {};
          const fecha = fields.Fecha;
          const especialidad = fields.Especialidad;
          const disponible = fields.Disponible;
          
          // Verificar que esté disponible, tenga especialidad y sea fecha futura
          return disponible === 'Si' && 
                 especialidad && 
                 especialidad.trim() && 
                 fecha && 
                 fecha >= today;
        })
        .map(record => record.fields?.Especialidad?.trim())
        .filter((especialidad): especialidad is string => !!especialidad)
    )].sort();

    console.log(`✅ Encontradas ${especialidadesDisponibles.length} especialidades disponibles:`, especialidadesDisponibles);

    return NextResponse.json({
      success: true,
      especialidades: especialidadesDisponibles
    });

  } catch (error) {
    console.error('❌ Error obteniendo especialidades disponibles:', error);
    
    // Fallback con especialidades estáticas para desarrollo
    const fallbackEspecialidades = ['Oftalmología', 'Dermatología', 'Otorrinolaringología'];
    
    return NextResponse.json({
      success: true, // Mantener success: true para mostrar el fallback
      especialidades: fallbackEspecialidades,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}