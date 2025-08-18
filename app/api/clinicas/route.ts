// app/api/clinicas/route.ts - API de clínicas en TypeScript
import { NextRequest, NextResponse } from "next/server";
import type {
  Clinica,
  ClinicaFields,
  CreateClinicaRequest,
  UpdateClinicaRequest,
  ClinicaResponse,
  ClinicaListResponse,
  AirtableClinicaRecord,
  AirtableClinicaPatchRequest
} from "../../../types/clinica";

// Environment variables con tipos
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID as string;
const AIRTABLE_CLINICAS_TABLE = process.env.AIRTABLE_CLINICAS_TABLE as string;

// Validación de configuración
function validateEnvironment(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_CLINICAS_TABLE);
}

// GET: obtener lista de clínicas
export async function GET(): Promise<NextResponse<ClinicaListResponse | { error: string }>> {
  try {
    if (!validateEnvironment()) {
      console.error('❌ Variables de entorno de Airtable no configuradas para clínicas');
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}?sort[0][field]=Nombre&sort[0][direction]=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ Error Airtable clínicas:', data);
      return NextResponse.json({ error: "Error obteniendo clínicas" }, { status: 500 });
    }
    
    const clinicas: Clinica[] = data.records || [];
    console.log('✅ Clínicas obtenidas:', clinicas.length);
    
    return NextResponse.json(clinicas);
  } catch (err) {
    console.error('❌ Error obteniendo clínicas:', err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: crear nueva clínica
export async function POST(request: NextRequest): Promise<NextResponse<Clinica | ClinicaResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        error: "Configuración de base de datos incompleta"
      }, { status: 500 });
    }

    const body: CreateClinicaRequest = await request.json();
    
    // Validaciones
    if (!body.Nombre?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Nombre es obligatorio" 
      }, { status: 400 });
    }
    
    if (!body.Direccion?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Dirección es obligatoria" 
      }, { status: 400 });
    }
    
    if (!body.Comuna?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Comuna es obligatoria" 
      }, { status: 400 });
    }
    
    console.log('📝 Creando clínica:', body);
    
    const clinicaData: AirtableClinicaRecord = {
      fields: {
        Nombre: body.Nombre.trim(),
        Direccion: body.Direccion.trim(),
        Comuna: body.Comuna.trim(),
        Telefono: body.Telefono?.trim() || ""
      }
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clinicaData),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error creando clínica:', data.error);
      return NextResponse.json({ 
        success: false,
        error: data.error.message || "Error creando clínica"
      }, { status: 500 });
    }
    
    console.log('✅ Clínica creada:', data.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Error en POST clínicas:', err);
    return NextResponse.json({ 
      success: false,
      error: err instanceof Error ? err.message : "Error interno del servidor"
    }, { status: 500 });
  }
}

// DELETE: eliminar clínica por id
export async function DELETE(request: NextRequest): Promise<NextResponse<ClinicaResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        error: "Configuración de base de datos incompleta"
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
    
    console.log('🗑️ Eliminando clínica:', id);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Error eliminando clínica:', errorData);
      return NextResponse.json({ 
        success: false,
        error: errorData.error?.message || "Error eliminando clínica"
      }, { status: res.status });
    }

    const data = await res.json();
    
    console.log('✅ Clínica eliminada:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Clínica eliminada correctamente" 
    });
  } catch (err) {
    console.error('❌ Error eliminando clínica:', err);
    return NextResponse.json({ 
      success: false,
      error: err instanceof Error ? err.message : "Error interno del servidor"
    }, { status: 500 });
  }
}

// PUT: actualizar clínica existente
export async function PUT(request: NextRequest): Promise<NextResponse<Clinica | ClinicaResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        error: "Configuración de base de datos incompleta"
      }, { status: 500 });
    }

    const body: UpdateClinicaRequest = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "ID requerido" 
      }, { status: 400 });
    }
    
    // Validaciones
    if (updateData.Nombre !== undefined && !updateData.Nombre?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Nombre no puede estar vacío" 
      }, { status: 400 });
    }
    
    if (updateData.Direccion !== undefined && !updateData.Direccion?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Dirección no puede estar vacía" 
      }, { status: 400 });
    }
    
    if (updateData.Comuna !== undefined && !updateData.Comuna?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "Comuna no puede estar vacía" 
      }, { status: 400 });
    }
    
    console.log('📝 Actualizando clínica:', id, updateData);
    
    // Limpiar campos
    const cleanData: Partial<ClinicaFields> = {};
    if (updateData.Nombre) cleanData.Nombre = updateData.Nombre.trim();
    if (updateData.Direccion) cleanData.Direccion = updateData.Direccion.trim();
    if (updateData.Comuna) cleanData.Comuna = updateData.Comuna.trim();
    if (updateData.Telefono !== undefined) cleanData.Telefono = updateData.Telefono?.trim() || "";
    
    const patchData: AirtableClinicaPatchRequest = {
      records: [{
        id: id,
        fields: cleanData
      }]
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchData),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error actualizando clínica:', data.error);
      return NextResponse.json({ 
        success: false,
        error: data.error.message || "Error actualizando clínica"
      }, { status: 500 });
    }
    
    console.log('✅ Clínica actualizada:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error actualizando clínica:', err);
    return NextResponse.json({ 
      success: false,
      error: err instanceof Error ? err.message : "Error interno del servidor"
    }, { status: 500 });
  }
}