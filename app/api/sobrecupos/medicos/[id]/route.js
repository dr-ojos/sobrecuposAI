import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// GET: obtener sobrecupos de un médico específico
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Construir fórmula para filtrar por médico
    const filterFormula = `FIND("${id}", ARRAYJOIN({Médico}))>0`;
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Fecha&sort[0][direction]=desc&maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("Error de Airtable:", data);
      return NextResponse.json([], { status: 500 });
    }
    
    console.log(`✅ Sobrecupos obtenidos para médico ${id}:`, data.records?.length || 0);
    return NextResponse.json(data.records || []);
  } catch (err) {
    console.error("Error obteniendo sobrecupos del médico:", err);
    return NextResponse.json([], { status: 500 });
  }
}