import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Obtener datos del request
    const data = await req.json();

    // 2. Verificar variables de entorno
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.error('❌ Faltan variables de entorno');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' }, 
        { status: 500 }
      );
    }

    // 3. Validar datos recibidos
    console.log('📝 Datos recibidos:', data);

    if (!data.medico || typeof data.medico !== "string") {
      console.error('❌ ID de médico inválido:', data.medico);
      return NextResponse.json(
        { error: 'ID de médico requerido' }, 
        { status: 400 }
      );
    }

    if (!data.especialidad || !data.clinica || !data.direccion || !data.fecha || !data.hora) {
      console.error('❌ Faltan datos obligatorios');
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' }, 
        { status: 400 }
      );
    }

    // 4. Crear registro para Airtable
    const record = {
      fields: {
        Especialidad: data.especialidad,
        Médico: [data.medico], // Array con ID del médico
        Clínica: data.clinica,
        Dirección: data.direccion,
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
      return NextResponse.json(
        { 
          error: 'Error al guardar en la base de datos',
          details: responseData.error?.message || 'Error desconocido'
        }, 
        { status: 500 }
      );
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
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

// GET: obtener lista de sobrecupos existentes
export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' }, 
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100&sort[0][field]=Fecha&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    return NextResponse.json(data.records || []);
  } catch (err) {
    console.error('❌ Error obteniendo sobrecupos:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// DELETE: eliminar sobrecupo por id
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Sobrecupo eliminado correctamente" 
    });
  } catch (err) {
    console.error('❌ Error eliminando sobrecupo:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}