// app/api/debug-airtable-fields/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sobrecupoId = searchParams.get('sobrecupoId');
    
    if (!sobrecupoId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere sobrecupoId como parámetro'
      }, { status: 400 });
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log('🔍 === DEBUG CAMPOS DE AIRTABLE ===');
    console.log('📋 Intentando obtener registro:', sobrecupoId);

    // Obtener el registro específico para ver su estructura
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error obteniendo registro:', errorData);
      
      return NextResponse.json({
        success: false,
        error: `Error obteniendo registro: ${response.status}`,
        details: errorData
      }, { status: response.status });
    }

    const recordData = await response.json();
    console.log('✅ Registro obtenido:', recordData);

    // Extraer todos los nombres de campos disponibles
    const availableFields = Object.keys(recordData.fields || {});
    
    console.log('📝 Campos disponibles:', availableFields);

    return NextResponse.json({
      success: true,
      recordId: sobrecupoId,
      availableFields: availableFields,
      currentValues: recordData.fields,
      recordStructure: recordData
    });

  } catch (error) {
    console.error('❌ Error en debug de campos:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// También permitir POST para obtener múltiples registros
export async function POST(req) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log('🔍 === DEBUG ESTRUCTURA GENERAL DE TABLA ===');

    // Obtener algunos registros para ver la estructura general
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=3`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error obteniendo registros:', errorData);
      
      return NextResponse.json({
        success: false,
        error: `Error obteniendo registros: ${response.status}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Registros obtenidos:', data);

    // Compilar todos los campos únicos de todos los registros
    const allFields = new Set();
    data.records.forEach(record => {
      Object.keys(record.fields || {}).forEach(field => {
        allFields.add(field);
      });
    });

    const uniqueFields = Array.from(allFields).sort();
    console.log('📝 Todos los campos únicos:', uniqueFields);

    return NextResponse.json({
      success: true,
      totalRecords: data.records.length,
      uniqueFields: uniqueFields,
      sampleRecords: data.records.map(r => ({
        id: r.id,
        fields: Object.keys(r.fields || {})
      })),
      rawData: data
    });

  } catch (error) {
    console.error('❌ Error en debug de estructura:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}