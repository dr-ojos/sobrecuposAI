import { NextResponse, NextRequest } from "next/server";
import type { DoctorProfile } from "../../../../types/dashboard";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

interface DoctorParams {
  params: {
    id: string;
  };
}

interface ErrorResponse {
  error: string;
}

// GET: obtener médico específico por ID
export async function GET(
  request: NextRequest, 
  { params }: any
): Promise<NextResponse<DoctorProfile | ErrorResponse>> {
  try {
    const { id } = params;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_DOCTORS_TABLE) {
      return NextResponse.json({ error: "Configuración de Airtable faltante" }, { status: 500 });
    }
    
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
    
    const data: DoctorProfile = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error obteniendo médico:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}