// app/api/sobrecupos/route.ts - API de sobrecupos en TypeScript
import { NextRequest, NextResponse } from 'next/server';
import type {
  Sobrecupo,
  SobrecupoFields,
  CreateSobrecupoRequest,
  SobrecupoResponse,
  SobrecupoListResponse,
  AirtableSobrecupoRecord,
  DoctorInfo,
  AirtableErrorResponse
} from "../../../types/sobrecupo";

// Environment variables con tipos
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID as string;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID as string;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE as string;

// Constantes
const MAX_RECORDS = 100;

// Validación de configuración
function validateEnvironment(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_TABLE_ID);
}

// POST: crear nuevo sobrecupo
export async function POST(request: NextRequest): Promise<NextResponse<SobrecupoResponse>> {
  try {
    // 1. Verificar variables de entorno
    if (!validateEnvironment()) {
      console.error('❌ Faltan variables de entorno');
      return NextResponse.json({
        success: false,
        error: 'Error de configuración del servidor'
      }, { status: 500 });
    }

    // 2. Obtener datos del request
    const data: CreateSobrecupoRequest = await request.json();

    // 3. Validar datos recibidos
    console.log('📝 Datos recibidos:', data);

    if (!data.medico || typeof data.medico !== "string") {
      console.error('❌ ID de médico inválido:', data.medico);
      return NextResponse.json({
        success: false,
        error: 'ID de médico requerido'
      }, { status: 400 });
    }

    if (!data.especialidad || !data.clinica || !data.direccion || !data.fecha || !data.hora) {
      console.error('❌ Faltan datos obligatorios');
      return NextResponse.json({
        success: false,
        error: 'Todos los campos son obligatorios: especialidad, clinica, direccion, fecha, hora'
      }, { status: 400 });
    }

    // Validaciones adicionales
    if (data.especialidad.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Especialidad debe tener al menos 2 caracteres'
      }, { status: 400 });
    }

    if (data.clinica.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Clínica debe tener al menos 2 caracteres'
      }, { status: 400 });
    }

    // Validar formato de fecha básico
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
      return NextResponse.json({
        success: false,
        error: 'Fecha debe estar en formato YYYY-MM-DD'
      }, { status: 400 });
    }

    // Validar formato de hora básico
    if (!/^\d{2}:\d{2}$/.test(data.hora)) {
      return NextResponse.json({
        success: false,
        error: 'Hora debe estar en formato HH:MM'
      }, { status: 400 });
    }

    // 4. Crear registro para Airtable
    const record: AirtableSobrecupoRecord = {
      fields: {
        Especialidad: data.especialidad.trim(),
        Médico: [data.medico], // Array con ID del médico
        Clínica: data.clinica.trim(),
        Dirección: data.direccion.trim(),
        Fecha: data.fecha,
        Hora: data.hora,
        Disponible: "Si"
      }
    };

    console.log('📤 Enviando a Airtable:', record);

    // 5. Enviar a Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      }
    );

    const responseData = await airtableResponse.json();

    // 6. Manejar respuesta de Airtable
    if (!airtableResponse.ok) {
      console.error('❌ Error de Airtable:', responseData);
      const errorData = responseData as AirtableErrorResponse;
      
      return NextResponse.json({
        success: false,
        error: 'Error al guardar en la base de datos',
        details: errorData.error?.message || 'Error desconocido'
      }, { status: 500 });
    }

    console.log('✅ Sobrecupo creado exitosamente:', responseData.id);

    // 7. Respuesta exitosa
    return NextResponse.json({
      success: true,
      id: responseData.id,
      message: 'Sobrecupo creado correctamente'
    });

  } catch (error) {
    console.error('❌ Error general en /api/sobrecupos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET: obtener lista de sobrecupos existentes CON nombres de médicos
export async function GET(): Promise<NextResponse<SobrecupoListResponse | { error: string }>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({ 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }

    // 1. Obtener sobrecupos de Airtable
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=${MAX_RECORDS}&sort[0][field]=Fecha&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      console.error('❌ Error obteniendo sobrecupos:', res.status, res.statusText);
      return NextResponse.json({ error: 'Error obteniendo sobrecupos' }, { status: 500 });
    }

    const data = await res.json();
    const sobrecupos: Sobrecupo[] = data.records || [];

    // 2. Para cada sobrecupo, obtener el nombre real del médico
    const sobrecuposWithDoctorNames = await Promise.all(
      sobrecupos.map(async (sobrecupo) => {
        const medicoIds = sobrecupo.fields?.Médico;
        
        if (Array.isArray(medicoIds) && medicoIds.length > 0) {
          // Obtener nombre del primer médico (normalmente solo hay uno)
          const doctorName = await getDoctorName(medicoIds[0]);
          
          return {
            ...sobrecupo,
            fields: {
              ...sobrecupo.fields,
              MedicoNombre: doctorName // Agregar campo con nombre real
            }
          };
        }
        
        return sobrecupo;
      })
    );

    console.log('✅ Sobrecupos obtenidos con nombres de médicos:', sobrecuposWithDoctorNames.length);
    
    return NextResponse.json(sobrecuposWithDoctorNames);
  } catch (err) {
    console.error('❌ Error obteniendo sobrecupos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: eliminar sobrecupo por id
export async function DELETE(request: NextRequest): Promise<NextResponse<SobrecupoResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        error: 'Error de configuración del servidor'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: "ID requerido"
      }, { status: 400 });
    }

    console.log('🗑️ Eliminando sobrecupo:', id);

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Error eliminando sobrecupo:', errorData);
      
      return NextResponse.json({
        success: false,
        error: 'Error eliminando sobrecupo',
        details: errorData.error?.message || res.statusText
      }, { status: res.status });
    }

    const data = await res.json();
    
    console.log('✅ Sobrecupo eliminado:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: "Sobrecupo eliminado correctamente",
      id: id
    });
  } catch (err) {
    console.error('❌ Error eliminando sobrecupo:', err);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Helper function para obtener nombre del médico
async function getDoctorName(doctorId: string): Promise<string> {
  try {
    if (!AIRTABLE_DOCTORS_TABLE) {
      console.warn('⚠️ AIRTABLE_DOCTORS_TABLE no configurada');
      return doctorId; // Fallback al ID
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Error obteniendo médico ${doctorId}:`, response.status, response.statusText);
      return doctorId; // Fallback al ID si no se puede obtener el nombre
    }

    const data: DoctorInfo = await response.json();
    return data.fields?.Name || doctorId;
  } catch (error) {
    console.error(`❌ Error obteniendo nombre del médico ${doctorId}:`, error);
    return doctorId; // Fallback al ID en caso de error
  }
}