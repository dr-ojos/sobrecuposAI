import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json({ error: 'Faltan variables de entorno de Airtable' }, { status: 500 });
    }

    // ¡LOG para depuración!
    console.log('data.medico recibido en backend:', data.medico);

    // Validación: nunca debe ser null o ""
    if (!data.medico || typeof data.medico !== "string") {
      return NextResponse.json({ error: 'ID de médico inválido.' }, { status: 400 });
    }

    const record = {
      fields: {
        Especialidad: data.especialidad,
        Médico: [data.medico], // ARRAY CON EL ID
        Clínica: data.clinica,
        Dirección: data.direccion,
        Fecha: data.fecha,
        Hora: data.hora,
        Disponible: "Si"
      }
    };

    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    const airtableResponse = await res.json();

    if (!res.ok) {
      console.error('Airtable error:', airtableResponse);
      return NextResponse.json({ error: airtableResponse.error }, { status: 500 });
    }

    return NextResponse.json(airtableResponse, { status: 200 });
  } catch (error) {
    console.error('Error en /api/sobrecupos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}