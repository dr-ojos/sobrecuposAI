// app/api/doctors/route.ts - API de médicos en TypeScript
import { NextRequest, NextResponse } from "next/server";
import type { 
  Doctor, 
  DoctorFields, 
  CreateDoctorRequest, 
  UpdateDoctorRequest, 
  AirtableResponse, 
  AirtableError 
} from "../../../types/doctor";

// Constants
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;
const TIMEOUT = 10000; // 10 seconds

// Validation helper
function validateEnvironment(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_DOCTORS_TABLE);
}

// HTTP helper with timeout
async function airtableRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}${endpoint}`,
      {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// GET: Obtener lista de médicos
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('📋 GET /api/doctors - Obteniendo lista de médicos');
  
  if (!validateEnvironment()) {
    console.error('❌ Environment variables missing');
    return NextResponse.json(
      { error: "Configuración de base de datos incompleta" }, 
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const maxRecords = searchParams.get('maxRecords') || '100';
    const view = searchParams.get('view');
    const filterByFormula = searchParams.get('filterByFormula');
    
    let endpoint = `?maxRecords=${maxRecords}`;
    
    if (view) {
      endpoint += `&view=${encodeURIComponent(view)}`;
    }
    
    if (filterByFormula) {
      endpoint += `&filterByFormula=${encodeURIComponent(filterByFormula)}`;
    }

    const response = await airtableRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data: AirtableResponse<Doctor> = await response.json();
    
    console.log(`✅ ${data.records.length} médicos obtenidos`);
    
    return NextResponse.json({
      success: true,
      data: data.records,
      count: data.records.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en GET doctors:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Timeout al obtener médicos" }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al obtener médicos" }, 
      { status: 500 }
    );
  }
}

// POST: Crear nuevo médico
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('➕ POST /api/doctors - Creando nuevo médico');
  
  if (!validateEnvironment()) {
    return NextResponse.json(
      { error: "Configuración de base de datos incompleta" }, 
      { status: 500 }
    );
  }

  try {
    const body: CreateDoctorRequest = await request.json();
    
    // Validaciones básicas
    if (!body.Name || !body.Especialidad) {
      return NextResponse.json(
        { error: "Nombre y especialidad son requeridos" }, 
        { status: 400 }
      );
    }

    if (body.Email && !isValidEmail(body.Email)) {
      return NextResponse.json(
        { error: "Email no válido" }, 
        { status: 400 }
      );
    }

    // Preparar datos para Airtable
    const doctorFields: Partial<DoctorFields> = {
      Name: body.Name.trim(),
      Especialidad: body.Especialidad,
      WhatsApp: body.WhatsApp,
      Email: body.Email,
      Atiende: body.Atiende || 'Adultos',
      Seguros: body.Seguros || [],
      Estado: body.Estado || 'Pendiente',
      Password: body.Password,
      Experiencia: body.Experiencia,
      Telefono: body.Telefono,
      Direccion: body.Direccion,
      Comuna: body.Comuna,
      Precio: body.Precio
    };

    const response = await airtableRequest('', {
      method: "POST",
      body: JSON.stringify({ fields: doctorFields }),
    });

    if (!response.ok) {
      const errorData: AirtableError = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data: Doctor = await response.json();
    
    console.log(`✅ Médico creado: ${data.fields.Name} (${data.id})`);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: "Médico creado exitosamente"
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST doctors:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Timeout al crear médico" }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear médico" }, 
      { status: 500 }
    );
  }
}

// PUT: Actualizar médico existente
export async function PUT(request: NextRequest): Promise<NextResponse> {
  console.log('📝 PUT /api/doctors - Actualizando médico');
  
  if (!validateEnvironment()) {
    return NextResponse.json(
      { error: "Configuración de base de datos incompleta" }, 
      { status: 500 }
    );
  }

  try {
    const body: UpdateDoctorRequest = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del médico es requerido" }, 
        { status: 400 }
      );
    }

    // Validar email si está presente
    if (updateData.Email && !isValidEmail(updateData.Email)) {
      return NextResponse.json(
        { error: "Email no válido" }, 
        { status: 400 }
      );
    }

    // Limpiar datos undefined
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    console.log('📝 Actualizando médico:', id, Object.keys(cleanedData));
    
    const response = await airtableRequest('', {
      method: "PATCH",
      body: JSON.stringify({
        records: [{
          id: id,
          fields: cleanedData
        }]
      }),
    });
    
    if (!response.ok) {
      const errorData: AirtableError = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const data: AirtableResponse<Doctor> = await response.json();
    
    if (!data.records || data.records.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" }, 
        { status: 404 }
      );
    }
    
    console.log(`✅ Médico actualizado: ${data.records[0].fields.Name} (${id})`);
    
    return NextResponse.json({
      success: true,
      data: data.records[0],
      message: "Médico actualizado exitosamente"
    });

  } catch (error) {
    console.error('❌ Error en PUT doctors:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Timeout al actualizar médico" }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar médico" }, 
      { status: 500 }
    );
  }
}

// DELETE: Eliminar médico por ID
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  console.log('🗑️ DELETE /api/doctors - Eliminando médico');
  
  if (!validateEnvironment()) {
    return NextResponse.json(
      { error: "Configuración de base de datos incompleta" }, 
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del médico es requerido" }, 
        { status: 400 }
      );
    }

    console.log('🗑️ Eliminando médico:', id);
    
    const response = await airtableRequest(`/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Médico no encontrado" }, 
          { status: 404 }
        );
      }
      
      const errorData: AirtableError = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Médico eliminado: ${id}`);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: "Médico eliminado exitosamente"
    });

  } catch (error) {
    console.error('❌ Error en DELETE doctors:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Timeout al eliminar médico" }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar médico" }, 
      { status: 500 }
    );
  }
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}