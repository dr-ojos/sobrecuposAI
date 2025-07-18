import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// GET: obtener sobrecupos de un médico específico
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      console.error("❌ ID de médico no proporcionado");
      return NextResponse.json({ error: "ID de médico requerido" }, { status: 400 });
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.error("❌ Variables de entorno de Airtable no configuradas");
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    console.log(`🔍 Buscando sobrecupos para médico: ${id}`);
    
    // Construir fórmula para filtrar por médico
    // El campo "Médico" en Airtable es un array de IDs, por eso usamos FIND y ARRAYJOIN
    const filterFormula = `FIND("${id}", ARRAYJOIN({Médico}))>0`;
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?` +
      `filterByFormula=${encodeURIComponent(filterFormula)}&` +
      `sort[0][field]=Fecha&` +
      `sort[0][direction]=desc&` +
      `maxRecords=100`;

    console.log(`📡 Consultando Airtable: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ Error de Airtable:", {
        status: res.status,
        statusText: res.statusText,
        error: data.error
      });
      return NextResponse.json(
        { error: "Error consultando la base de datos" }, 
        { status: res.status }
      );
    }
    
    const sobrecupos = data.records || [];
    
    console.log(`✅ Sobrecupos encontrados para médico ${id}: ${sobrecupos.length}`);
    
    // Registrar algunos detalles para debugging
    if (sobrecupos.length > 0) {
      console.log(`📊 Primer sobrecupo:`, {
        id: sobrecupos[0].id,
        fecha: sobrecupos[0].fields?.Fecha,
        hora: sobrecupos[0].fields?.Hora,
        disponible: sobrecupos[0].fields?.Disponible
      });
    }
    
    return NextResponse.json(sobrecupos);
    
  } catch (err) {
    console.error("❌ Error general obteniendo sobrecupos del médico:", {
      message: err.message,
      stack: err.stack
    });
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      }, 
      { status: 500 }
    );
  }
}

// POST: crear nuevo sobrecupo para el médico
export async function POST(request, { params }) {
  try {
    const { id } = params; // ID del médico
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID de médico requerido" }, { status: 400 });
    }

    // Validar datos requeridos
    const { fecha, hora, clinica, direccion } = body;
    
    if (!fecha || !hora || !clinica || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: fecha, hora, clinica, direccion" }, 
        { status: 400 }
      );
    }

    console.log(`📝 Creando sobrecupo para médico ${id}:`, body);

    // Obtener información del médico para la especialidad
    const doctorRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let especialidad = "Medicina General"; // fallback
    if (doctorRes.ok) {
      const doctorData = await doctorRes.json();
      especialidad = doctorData.fields?.Especialidad || especialidad;
    }

    // Crear registro para Airtable
    const record = {
      fields: {
        Especialidad: especialidad,
        Médico: [id], // Array con ID del médico
        Clínica: clinica.trim(),
        Dirección: direccion.trim(),
        Fecha: fecha,
        Hora: hora,
        Disponible: "Si"
      }
    };

    console.log('📤 Enviando sobrecupo a Airtable:', record);

    // Crear en Airtable
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

    if (!airtableResponse.ok) {
      console.error('❌ Error de Airtable creando sobrecupo:', responseData);
      return NextResponse.json(
        { 
          error: 'Error al guardar en la base de datos',
          details: responseData.error?.message || 'Error desconocido'
        }, 
        { status: 500 }
      );
    }

    console.log('✅ Sobrecupo creado exitosamente:', responseData.id);

    return NextResponse.json({
      success: true,
      id: responseData.id,
      message: 'Sobrecupo creado correctamente',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error general creando sobrecupo:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}