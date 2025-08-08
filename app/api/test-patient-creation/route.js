// app/api/test-patient-creation/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('👤 === TEST DE CREACIÓN DE PACIENTE ===');
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE;

    console.log('🔧 Variables de entorno:', {
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_PATIENTS_TABLE: AIRTABLE_PATIENTS_TABLE ? '✅ Presente' : '❌ Faltante'
    });

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_PATIENTS_TABLE) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Airtable no configuradas'
      }, { status: 500 });
    }

    // 1. Primero listar algunos registros existentes para ver la estructura
    console.log('📋 Obteniendo estructura de tabla Pacientes...');
    const listResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?maxRecords=1`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let existingStructure = null;
    if (listResponse.ok) {
      const listData = await listResponse.json();
      existingStructure = listData.records?.[0]?.fields || {};
      console.log('✅ Estructura existente:', Object.keys(existingStructure));
    } else {
      console.log('⚠️ No se pudo obtener estructura existente');
    }

    // 2. Intentar crear un paciente de prueba con campos mínimos
    console.log('👤 Creando paciente de prueba...');
    
    const testPatientData = {
      fields: {
        Nombre: "Test Patient API",
        RUT: "99999999-9",
        Telefono: "+56912345678",
        Email: "test@example.com",
        Edad: 25,
        "Fecha Registro": new Date().toISOString().split('T')[0]
      }
    };

    console.log('📦 Datos de paciente de prueba:', testPatientData);

    const createResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPatientData),
      }
    );

    console.log('📡 Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Paciente creado exitosamente:', createResult.id);
      
      return NextResponse.json({
        success: true,
        message: 'Paciente de prueba creado exitosamente',
        patientId: createResult.id,
        existingStructure: existingStructure,
        createdPatient: createResult
      });
    } else {
      const errorData = await createResponse.json();
      console.error('❌ Error creando paciente:', errorData);
      
      return NextResponse.json({
        success: false,
        error: `Error creando paciente: ${createResponse.status}`,
        details: errorData,
        existingStructure: existingStructure
      });
    }

  } catch (error) {
    console.error('❌ Error en test de paciente:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}