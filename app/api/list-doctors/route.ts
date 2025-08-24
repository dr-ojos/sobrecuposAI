// Endpoint para listar doctores con sus IDs de Airtable
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Variables de entorno Airtable no configuradas'
      });
    }

    console.log('🔍 Buscando médicos en todas las tablas posibles...');
    
    const DOCTOR_TABLES = ['Doctors', 'Médicos', 'Medicos', 'Doctor'];
    let allDoctors: any[] = [];
    let foundTable = '';

    for (const tableName of DOCTOR_TABLES) {
      try {
        console.log(`🔍 Probando tabla: ${tableName}`);
        
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?maxRecords=100`,
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
          }
        );

        const responseText = await response.text();
        console.log(`📋 Respuesta ${tableName} (${response.status}):`, responseText.substring(0, 200));

        if (response.ok) {
          const data = JSON.parse(responseText);
          if (data.records && data.records.length > 0) {
            allDoctors = data.records;
            foundTable = tableName;
            console.log(`✅ Encontrados ${allDoctors.length} médicos en tabla: ${tableName}`);
            break;
          }
        } else {
          console.log(`❌ Error ${response.status} en tabla ${tableName}`);
        }
      } catch (error: any) {
        console.log(`❌ Error en tabla ${tableName}:`, error.message);
        continue;
      }
    }

    if (allDoctors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron médicos en ninguna tabla',
        tablesChecked: DOCTOR_TABLES
      });
    }

    // Formatear datos para mostrar información útil
    const formattedDoctors = allDoctors.map(doctor => ({
      id: doctor.id,
      name: doctor.fields?.Name || doctor.fields?.Nombre || 'Sin nombre',
      email: doctor.fields?.Email || 'Sin email',
      whatsapp: doctor.fields?.WhatsApp || 'Sin WhatsApp',
      especialidad: doctor.fields?.Especialidad || 'Sin especialidad',
      estado: doctor.fields?.Estado || 'Sin estado',
      allFields: doctor.fields
    }));

    return NextResponse.json({
      success: true,
      foundTable,
      count: formattedDoctors.length,
      doctors: formattedDoctors
    });

  } catch (error: any) {
    console.error('❌ Error listando médicos:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}