import { NextResponse } from "next/server";
import { isValidArea, getAreasByEspecialidad } from '../../../lib/areas-interes.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

// GET: obtener lista de médicos
export async function GET() {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data.records || []);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}

// POST: crear nuevo médico
export async function POST(req) {
  const body = await req.json();
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: body }),
      }
    );
    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: actualizar médico existente
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Validar áreas de interés si se están actualizando
    if (updateData.AreasInteres && updateData.Especialidad) {
      const areasValidas = getAreasByEspecialidad(updateData.Especialidad);
      const areasInvalidas = updateData.AreasInteres.filter(area => 
        !isValidArea(updateData.Especialidad, area)
      );
      
      if (areasInvalidas.length > 0) {
        return NextResponse.json({ 
          error: `Áreas de interés inválidas para ${updateData.Especialidad}: ${areasInvalidas.join(', ')}`,
          areasDisponibles: areasValidas
        }, { status: 400 });
      }
    }
    
    console.log('📝 Actualizando médico:', id, updateData);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: id,
            fields: updateData
          }]
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error actualizando médico:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Médico actualizado:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error en PUT médicos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: eliminar médico por id
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${id}`,
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
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}