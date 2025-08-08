// app/api/test-airtable-update/route.js
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

    console.log('🧪 === TEST DE ACTUALIZACIÓN DE AIRTABLE ===');
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log('🔧 Variables de entorno:', {
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_TABLE_ID: AIRTABLE_TABLE_ID ? '✅ Presente' : '❌ Faltante'
    });

    // 1. Primero obtener el registro actual
    console.log('📋 Obteniendo registro actual...');
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      console.error('❌ Error obteniendo registro:', errorData);
      return NextResponse.json({
        success: false,
        error: `Error obteniendo registro: ${getResponse.status}`,
        details: errorData
      });
    }

    const currentRecord = await getResponse.json();
    console.log('✅ Registro actual:', currentRecord);

    // 2. Intentar una actualización mínima de prueba (igual que el endpoint real)
    console.log('🔄 Probando actualización mínima igual al endpoint de confirmación...');
    
    const testUpdateData = {
      fields: {
        Disponible: "No"
      }
    };

    console.log('📦 Datos de prueba:', testUpdateData);

    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUpdateData),
      }
    );

    console.log('📡 Update response status:', updateResponse.status);
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Actualización exitosa:', updateResult);
      
      return NextResponse.json({
        success: true,
        message: 'Actualización de prueba exitosa',
        currentRecord: currentRecord,
        updateResult: updateResult
      });
    } else {
      const errorData = await updateResponse.json();
      console.error('❌ Error en actualización:', errorData);
      
      return NextResponse.json({
        success: false,
        error: `Error actualizando: ${updateResponse.status}`,
        details: errorData,
        currentRecord: currentRecord
      });
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}