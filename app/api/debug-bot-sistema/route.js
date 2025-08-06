// app/api/debug-bot-sistema/route.js
// 🔧 DIAGNÓSTICO SISTEMÁTICO PARA IDENTIFICAR EL ERROR EXACTO

import { NextResponse } from 'next/server';

// Permitir tanto GET como POST para facilitar testing
export async function GET(req) {
  return await diagnosticar();
}

export async function POST(req) {
  return await diagnosticar();
}

async function diagnosticar() {
  try {
    console.log('🔍 === INICIANDO DIAGNÓSTICO SISTEMÁTICO ===');
    
    // 1. Verificar variables de entorno CRÍTICAS
    const envVars = {
      AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_ID: !!process.env.AIRTABLE_TABLE_ID,
      AIRTABLE_DOCTORS_TABLE: !!process.env.AIRTABLE_DOCTORS_TABLE,
      AIRTABLE_PATIENTS_TABLE: !!process.env.AIRTABLE_PATIENTS_TABLE,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    };

    console.log('📋 Variables de entorno:', envVars);

    const criticalMissing = [];
    if (!process.env.AIRTABLE_API_KEY) criticalMissing.push('AIRTABLE_API_KEY');
    if (!process.env.AIRTABLE_BASE_ID) criticalMissing.push('AIRTABLE_BASE_ID');
    if (!process.env.AIRTABLE_TABLE_ID) criticalMissing.push('AIRTABLE_TABLE_ID');
    if (!process.env.AIRTABLE_DOCTORS_TABLE) criticalMissing.push('AIRTABLE_DOCTORS_TABLE');

    if (criticalMissing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Variables de entorno críticas faltantes',
        missing: criticalMissing,
        fix: 'Agregar variables faltantes al archivo .env.local'
      });
    }

    // 2. Test conexión Airtable - Sobrecupos
    console.log('📡 Probando conexión a tabla Sobrecupos...');
    let sobrecuposTest = {};
    try {
      const sobrecuposUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?maxRecords=1`;
      const sobrecuposRes = await fetch(sobrecuposUrl, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
      });
      
      if (sobrecuposRes.ok) {
        const sobrecuposData = await sobrecuposRes.json();
        sobrecuposTest = {
          status: 'OK',
          recordCount: sobrecuposData.records?.length || 0,
          sampleRecord: sobrecuposData.records?.[0],
          fields: sobrecuposData.records?.[0] ? Object.keys(sobrecuposData.records[0].fields || {}) : []
        };
      } else {
        const errorData = await sobrecuposRes.json();
        sobrecuposTest = {
          status: 'ERROR',
          error: errorData.error?.message || `HTTP ${sobrecuposRes.status}`
        };
      }
    } catch (err) {
      sobrecuposTest = { status: 'ERROR', error: err.message };
    }

    // 3. Test conexión Airtable - Doctors
    console.log('📡 Probando conexión a tabla Doctors...');
    let doctorsTest = {};
    try {
      const doctorsUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}?maxRecords=1`;
      const doctorsRes = await fetch(doctorsUrl, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
      });
      
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        doctorsTest = {
          status: 'OK',
          recordCount: doctorsData.records?.length || 0,
          fields: doctorsData.records?.[0] ? Object.keys(doctorsData.records[0].fields || {}) : []
        };
      } else {
        const errorData = await doctorsRes.json();
        doctorsTest = {
          status: 'ERROR',
          error: errorData.error?.message || `HTTP ${doctorsRes.status}`
        };
      }
    } catch (err) {
      doctorsTest = { status: 'ERROR', error: err.message };
    }

    // 4. Buscar tabla de Pacientes automáticamente
    console.log('🔍 Buscando tabla de Pacientes...');
    let patientsTest = {};
    try {
      // Primero intentar con variable de entorno
      if (process.env.AIRTABLE_PATIENTS_TABLE) {
        const patientsUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PATIENTS_TABLE}?maxRecords=1`;
        const patientsRes = await fetch(patientsUrl, {
          headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
        });
        
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          patientsTest = {
            status: 'OK',
            tableId: process.env.AIRTABLE_PATIENTS_TABLE,
            source: 'env_var',
            recordCount: patientsData.records?.length || 0,
            fields: patientsData.records?.[0] ? Object.keys(patientsData.records[0].fields || {}) : []
          };
        } else {
          patientsTest = {
            status: 'ERROR',
            tableId: process.env.AIRTABLE_PATIENTS_TABLE,
            source: 'env_var',
            error: `Tabla configurada en env no existe: ${patientsRes.status}`
          };
        }
      } else {
        // Buscar automáticamente
        const metaUrl = `https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`;
        const metaRes = await fetch(metaUrl, {
          headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
        });
        
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const allTables = metaData.tables || [];
          
          const patientTable = allTables.find(table => 
            /pacient/i.test(table.name) || 
            /patient/i.test(table.name) ||
            table.name.toLowerCase() === 'pacientes'
          );
          
          if (patientTable) {
            patientsTest = {
              status: 'OK',
              tableId: patientTable.id,
              tableName: patientTable.name,
              source: 'auto_detected',
              fields: patientTable.fields?.map(f => f.name) || []
            };
          } else {
            patientsTest = {
              status: 'NOT_FOUND',
              source: 'auto_search',
              allTables: allTables.map(t => t.name),
              message: 'No se encontró tabla de pacientes'
            };
          }
        } else {
          patientsTest = {
            status: 'ERROR',
            source: 'meta_api',
            error: `No se pudieron obtener metadatos: ${metaRes.status}`
          };
        }
      }
    } catch (err) {
      patientsTest = { status: 'ERROR', error: err.message };
    }

    // 5. Test OpenAI (opcional)
    let openaiTest = {};
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            max_tokens: 10,
            messages: [{ role: "user", content: "test" }]
          })
        });
        
        openaiTest = {
          status: openaiRes.ok ? 'OK' : 'ERROR',
          httpStatus: openaiRes.status
        };
      } catch (err) {
        openaiTest = { status: 'ERROR', error: err.message };
      }
    } else {
      openaiTest = { status: 'NOT_CONFIGURED' };
    }

    // 6. Generar diagnóstico y recomendaciones
    const diagnosis = [];
    const fixes = [];

    if (sobrecuposTest.status !== 'OK') {
      diagnosis.push('❌ Tabla Sobrecupos no accesible');
      fixes.push('Verificar AIRTABLE_TABLE_ID en .env.local');
    } else {
      diagnosis.push('✅ Tabla Sobrecupos OK');
    }

    if (doctorsTest.status !== 'OK') {
      diagnosis.push('❌ Tabla Doctors no accesible');
      fixes.push('Verificar AIRTABLE_DOCTORS_TABLE en .env.local');
    } else {
      diagnosis.push('✅ Tabla Doctors OK');
    }

    if (patientsTest.status === 'OK') {
      diagnosis.push(`✅ Tabla Pacientes OK (${patientsTest.source})`);
      if (patientsTest.source === 'auto_detected') {
        fixes.push(`Agregar AIRTABLE_PATIENTS_TABLE=${patientsTest.tableId} al .env.local`);
      }
    } else if (patientsTest.status === 'NOT_FOUND') {
      diagnosis.push('⚠️ Tabla Pacientes no encontrada');
      fixes.push('Crear tabla "Pacientes" en Airtable con campos: Nombre, Email, Telefono, RUT, Edad');
    } else {
      diagnosis.push('❌ Error accediendo tabla Pacientes');
      fixes.push('Verificar configuración de tabla Pacientes');
    }

    if (openaiTest.status === 'OK') {
      diagnosis.push('✅ OpenAI OK');
    } else if (openaiTest.status === 'NOT_CONFIGURED') {
      diagnosis.push('⚠️ OpenAI no configurado (opcional)');
    } else {
      diagnosis.push('❌ OpenAI error');
    }

    // Determinar si el bot debería funcionar
    const critical_ok = sobrecuposTest.status === 'OK' && doctorsTest.status === 'OK';
    const bot_functional = critical_ok; // El bot puede funcionar sin tabla de pacientes

    console.log('🔍 === DIAGNÓSTICO COMPLETADO ===');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bot_functional,
      diagnosis,
      fixes,
      details: {
        environment: envVars,
        sobrecupos: sobrecuposTest,
        doctors: doctorsTest,
        patients: patientsTest,
        openai: openaiTest
      },
      next_steps: bot_functional ? [
        'El bot debería funcionar correctamente',
        'Si persiste el error, revisar logs del servidor'
      ] : [
        'Corregir errores identificados arriba',
        'Reiniciar servidor después de cambios en .env',
        'Probar nuevamente'
      ]
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno en diagnóstico',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}