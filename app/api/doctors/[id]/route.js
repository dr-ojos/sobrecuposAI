import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

// GET: obtener médico específico por ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error obteniendo médico:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}