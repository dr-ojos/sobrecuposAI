import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📡 Obteniendo especialidades desde sobrecupos disponibles...');
    
    // Usar el endpoint que ya funciona
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sobrecupos/available`);
    
    if (!response.ok) {
      throw new Error(`Error obteniendo sobrecupos: ${response.status}`);
    }
    
    const data = await response.json();
    
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
        .map(record => record.fields.Especialidad.trim())
        .filter(Boolean)
    )].sort();

    console.log(`✅ Encontradas ${especialidadesDisponibles.length} especialidades disponibles:`, especialidadesDisponibles);

    return NextResponse.json({
      success: true,
      especialidades: especialidadesDisponibles,
      count: especialidadesDisponibles.length,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo especialidades disponibles:', error);
    
    // Fallback con especialidades estáticas para desarrollo
    const fallbackEspecialidades = ['Oftalmología', 'Dermatología', 'Otorrinolaringología'];
    
    return NextResponse.json({
      success: true, // Mantener success: true para mostrar el fallback
      especialidades: fallbackEspecialidades,
      count: fallbackEspecialidades.length,
      updatedAt: new Date().toISOString(),
      fallback: true,
      error: error.message
    });
  }
}