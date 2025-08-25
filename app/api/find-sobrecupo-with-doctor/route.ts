// Endpoint para encontrar sobrecupos que tengan médico asignado
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    // Obtener algunos sobrecupos para ver cuáles tienen médico
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos?maxRecords=10`,
      { 
        headers: { 
          Authorization: `Bearer ${AIRTABLE_API_KEY}` 
        } 
      }
    );
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error fetching sobrecupos' }, { status: 500 });
    }
    
    const data = await response.json();
    
    const sobrecuposWithDoctor = data.records.map((record: any) => ({
      id: record.id,
      medico: record.fields?.Médico,
      nombreMedico: record.fields?.['Name (from Médico)'],
      fecha: record.fields?.Fecha,
      hora: record.fields?.Hora,
      especialidad: record.fields?.Especialidad,
      clinica: record.fields?.Clínica,
      disponible: record.fields?.Disponible
    })).filter((sobrecupo: any) => sobrecupo.medico); // Solo los que tienen médico
    
    return NextResponse.json({
      total: sobrecuposWithDoctor.length,
      sobrecupos: sobrecuposWithDoctor
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}