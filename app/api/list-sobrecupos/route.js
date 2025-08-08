// app/api/list-sobrecupos/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📋 === LISTANDO SOBRECUPOS PARA PRUEBAS ===');
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Airtable no configuradas'
      }, { status: 500 });
    }

    // Obtener algunos sobrecupos para testing
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
    const params = new URLSearchParams({
      maxRecords: '5',
      'fields[]': 'Disponible',
      'fields[]': 'Fecha', 
      'fields[]': 'Hora',
      'fields[]': 'Médico'
    });
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error obteniendo sobrecupos:', errorData);
      return NextResponse.json({
        success: false,
        error: `Error obteniendo sobrecupos: ${response.status}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Sobrecupos obtenidos:', data.records?.length);

    return NextResponse.json({
      success: true,
      records: data.records?.map(record => ({
        id: record.id,
        fields: record.fields
      })) || []
    });

  } catch (error) {
    console.error('❌ Error en list-sobrecupos:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}