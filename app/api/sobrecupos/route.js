// app/api/sobrecupos/route.js
/**
 * API Route · /api/sobrecupos
 * Compatible con el App Router (Next 15).
 *
 * Acepta dos formatos de payload en POST:
 *  1. Nuevo  → { medico, especialidad, clinica, direccion, fecha, hora }
 *  2. Legacy → { MedicoNombre, Especialidad, Clinica, Fecha, Hora }
 *
 * Requiere las env vars:
 *  - AIRTABLE_API_KEY
 *  - AIRTABLE_BASE_ID
 *  - AIRTABLE_SOBRECUPOS_TABLE   (o AIRTABLE_TABLE_ID como fallback)
 *  - AIRTABLE_DOCTORS_TABLE      (para resolver nombres en GET)
 */

import { NextResponse } from 'next/server';

const {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_SOBRECUPOS_TABLE,
  AIRTABLE_TABLE_ID,
  AIRTABLE_DOCTORS_TABLE,
} = process.env;

const TABLE_NAME = AIRTABLE_SOBRECUPOS_TABLE || AIRTABLE_TABLE_ID || 'Sobrecupostest';

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function assertEnv() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !TABLE_NAME) {
    throw new Error('⚠️  Env vars de Airtable incompletas');
  }
}

async function airtableFetch(path, options = {}) {
  assertEnv();
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      ...options,
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const err = data?.error?.message || res.statusText;
    throw new Error(err);
  }
  return data;
}

// Cache simple en memoria para nombres de médicos durante el lifetime del lambda
const doctorNameCache = new Map();

/* -------------------------------------------------------------------------- */
/* POST – crear sobrecupo                                                     */
/* -------------------------------------------------------------------------- */
export async function POST(req) {
  try {
    const body = await req.json();

    /* 1️⃣ Normalizar si viene formato legacy */
    if (body.MedicoNombre) {
      body.medico       = body.MedicoNombre;
      body.especialidad = body.Especialidad;
      body.clinica      = body.Clinica;
      body.direccion    = body.Direccion || '';
      body.fecha        = body.Fecha;
      body.hora         = body.Hora;
    }

    /* 2️⃣ Validar mínimos */
    if (!body.medico || !body.fecha || !body.hora) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validación básica de fecha (YYYY-MM-DD) y hora (HH:MM)
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(body.fecha);
    const hourFmt = /^\d{2}:\d{2}$/.test(body.hora);
    if (!isoDate || !hourFmt) {
      return NextResponse.json(
        { error: 'Formato de fecha u hora inválido' },
        { status: 400 }
      );
    }

    /* 3️⃣ Mapear a campos de Airtable */
    const fields = {
      Especialidad: body.especialidad || '',
      Clínica: body.clinica || '',
      Dirección: body.direccion || '',
      Fecha: body.fecha,
      Hora: body.hora,
      Estado: 'Disponible',
    };

    // Si el id parece un recordId de Airtable, lo enviamos como linked record
    if (/^rec[a-zA-Z0-9]{14}$/.test(body.medico)) {
      fields['Médico'] = [body.medico];
    } else {
      fields['MedicoNombre'] = body.medico;
    }

    /* 4️⃣ Crear sobrecupo */
    const record = await airtableFetch(TABLE_NAME, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });

    return NextResponse.json(
      { success: true, id: record.id, fields: record.fields },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Sobrecupos] POST error:', err);
    return NextResponse.json(
      { error: 'Error al crear sobrecupo', details: err.message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* GET – listar sobrecupos (con nombre de médico si es linked record)         */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    assertEnv();

    // 1. Obtener sobrecupos
    const data = await airtableFetch(
      `${TABLE_NAME}?maxRecords=100&sort[0][field]=Fecha&sort[0][direction]=desc`
    );
    const records = data.records || [];

    // 2. Enriquecer con nombre de médico
    const enriched = await Promise.all(
      records.map(async (rec) => {
        const medicoIds = rec.fields?.Médico;
        if (Array.isArray(medicoIds) && medicoIds.length > 0) {
          const id = medicoIds[0];
          if (!doctorNameCache.has(id)) {
            try {
              const doc = await airtableFetch(`${AIRTABLE_DOCTORS_TABLE}/${id}`);
              doctorNameCache.set(id, doc.fields?.Name || id);
            } catch {
              doctorNameCache.set(id, id);
            }
          }
          rec.fields.MedicoNombre = doctorNameCache.get(id);
        }
        return rec;
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('[Sobrecupos] GET error:', err);
    return NextResponse.json(
      { error: 'Error al listar sobrecupos', details: err.message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE – eliminar sobrecupo por ?id=recXXXX                                */
/* -------------------------------------------------------------------------- */
export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await airtableFetch(`${TABLE_NAME}/${id}`, { method: 'DELETE' });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[Sobrecupos] DELETE error:', err);
    return NextResponse.json(
      { error: 'Error al eliminar sobrecupo', details: err.message },
      { status: 500 }
    );
  }
}