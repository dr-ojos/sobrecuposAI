import { NextResponse } from "next/server";
import { AREAS_INTERES, getAreasByEspecialidad, getEspecialidadesDisponibles, searchAreas } from '../../../lib/areas-interes.js';

// GET: obtener áreas de interés
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const especialidad = searchParams.get('especialidad');
    const search = searchParams.get('search');

    // Si se especifica una especialidad, devolver solo sus áreas
    if (especialidad) {
      const areas = getAreasByEspecialidad(especialidad);
      if (areas.length === 0) {
        return NextResponse.json({ 
          error: `Especialidad '${especialidad}' no encontrada`,
          especialidadesDisponibles: getEspecialidadesDisponibles()
        }, { status: 404 });
      }
      return NextResponse.json({
        especialidad,
        areas
      });
    }

    // Si se especifica una búsqueda, buscar en todas las áreas
    if (search) {
      const resultados = searchAreas(search);
      return NextResponse.json({
        search,
        resultados
      });
    }

    // Por defecto, devolver todas las áreas organizadas por especialidad
    return NextResponse.json({
      areas: AREAS_INTERES,
      especialidades: getEspecialidadesDisponibles()
    });

  } catch (error) {
    console.error('Error en GET areas-interes:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}