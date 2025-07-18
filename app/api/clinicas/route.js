import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_CLINICAS_TABLE = process.env.AIRTABLE_CLINICAS_TABLE;

// GET: obtener lista de clínicas
export async function GET() {
  try {
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
      return NextResponse.json([], { status: 500 });
    }
    
    console.log('✅ Clínicas obtenidas:', data.records?.length || 0);
    return NextResponse.json(data.records || []);
  } catch (err) {
    console.error('❌ Error obteniendo clínicas:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: crear nueva clínica
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validaciones
    if (!body.Nombre?.trim()) {
      return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
    }
    
    if (!body.Direccion?.trim()) {
      return NextResponse.json({ error: "Dirección es obligatoria" }, { status: 400 });
    }
    
    if (!body.Comuna?.trim()) {
      return NextResponse.json({ error: "Comuna es obligatoria" }, { status: 400 });
    }
    
    console.log('📝 Creando clínica:', body);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          fields: {
            Nombre: body.Nombre.trim(),
            Direccion: body.Direccion.trim(),
            Comuna: body.Comuna.trim(),
            Telefono: body.Telefono?.trim() || ""
          }
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error creando clínica:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Clínica creada:', data.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Error en POST clínicas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: eliminar clínica por id
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
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
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error eliminando clínica:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Clínica eliminada:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Clínica eliminada correctamente" 
    });
  } catch (err) {
    console.error('❌ Error eliminando clínica:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: actualizar clínica existente
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    // Validaciones
    if (updateData.Nombre !== undefined && !updateData.Nombre?.trim()) {
      return NextResponse.json({ error: "Nombre no puede estar vacío" }, { status: 400 });
    }
    
    if (updateData.Direccion !== undefined && !updateData.Direccion?.trim()) {
      return NextResponse.json({ error: "Dirección no puede estar vacía" }, { status: 400 });
    }
    
    if (updateData.Comuna !== undefined && !updateData.Comuna?.trim()) {
      return NextResponse.json({ error: "Comuna no puede estar vacía" }, { status: 400 });
    }
    
    console.log('📝 Actualizando clínica:', id, updateData);
    
    // Limpiar campos
    const cleanData = {};
    if (updateData.Nombre) cleanData.Nombre = updateData.Nombre.trim();
    if (updateData.Direccion) cleanData.Direccion = updateData.Direccion.trim();
    if (updateData.Comuna) cleanData.Comuna = updateData.Comuna.trim();
    if (updateData.Telefono !== undefined) cleanData.Telefono = updateData.Telefono?.trim() || "";
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CLINICAS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: id,
            fields: cleanData
          }]
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error actualizando clínica:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Clínica actualizada:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error actualizando clínica:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}