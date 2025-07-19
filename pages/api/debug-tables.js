// pages/api/debug-tables.js
// 🔍 DIAGNÓSTICO COMPLETO DE TABLAS AIRTABLE

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo GET permitido' });
  }

  try {
    console.log('🔍 === INICIANDO DIAGNÓSTICO COMPLETO ===');

    // 1. Verificar variables de entorno
    const envVars = {
      AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_ID: !!process.env.AIRTABLE_TABLE_ID,
      AIRTABLE_DOCTORS_TABLE: !!process.env.AIRTABLE_DOCTORS_TABLE,
      // Estas probablemente NO existen:
      AIRTABLE_PATIENTS_TABLE: !!process.env.AIRTABLE_PATIENTS_TABLE,
      AIRTABLE_CLINICAS_TABLE: !!process.env.AIRTABLE_CLINICAS_TABLE,
    };

    console.log('📋 Variables de entorno:', envVars);

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      return res.status(500).json({
        error: 'Faltan variables básicas de Airtable',
        envVars
      });
    }

    // 2. Obtener metadatos de la base completa
    const baseUrl = `https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`;
    
    console.log('📡 Consultando metadatos en:', baseUrl);

    const metaResponse = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    let allTables = [];
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      allTables = metaData.tables || [];
      console.log('✅ Metadatos obtenidos:', allTables.length, 'tablas encontradas');
    } else {
      console.log('❌ No se pudieron obtener metadatos:', metaResponse.status);
    }

    // 3. Buscar tabla de pacientes por nombre
    const possiblePatientTables = allTables.filter(table => 
      /pacient/i.test(table.name) || 
      /patient/i.test(table.name) ||
      /client/i.test(table.name) ||
      /usuario/i.test(table.name)
    );

    console.log('👥 Posibles tablas de pacientes:', possiblePatientTables);

    // 4. Analizar cada tabla encontrada
    const tableAnalysis = {};

    for (const table of allTables) {
      console.log(`🔍 Analizando tabla: ${table.name} (${table.id})`);
      
      try {
        // Obtener algunos registros de muestra para ver la estructura
        const sampleUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${table.id}?maxRecords=1`;
        
        const sampleResponse = await fetch(sampleUrl, {
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          },
        });

        if (sampleResponse.ok) {
          const sampleData = await sampleResponse.json();
          const record = sampleData.records?.[0];
          
          tableAnalysis[table.name] = {
            id: table.id,
            description: table.description || 'Sin descripción',
            fields: table.fields?.map(f => f.name) || [],
            sampleFields: record ? Object.keys(record.fields) : [],
            recordCount: sampleData.records?.length || 0,
            hasPatientFields: false
          };

          // Verificar si tiene campos típicos de pacientes
          const allFieldNames = [...(table.fields?.map(f => f.name) || []), ...(record ? Object.keys(record.fields) : [])];
          const patientFieldIndicators = ['nombre', 'email', 'telefono', 'phone', 'rut', 'edad', 'age'];
          
          tableAnalysis[table.name].hasPatientFields = patientFieldIndicators.some(indicator =>
            allFieldNames.some(fieldName => fieldName.toLowerCase().includes(indicator))
          );

          console.log(`✅ ${table.name}: ${allFieldNames.length} campos encontrados`);
        } else {
          console.log(`❌ Error accediendo a ${table.name}:`, sampleResponse.status);
          tableAnalysis[table.name] = {
            id: table.id,
            error: `Error HTTP ${sampleResponse.status}`,
            accessible: false
          };
        }
      } catch (error) {
        console.error(`❌ Error procesando ${table.name}:`, error.message);
        tableAnalysis[table.name] = {
          id: table.id,
          error: error.message,
          accessible: false
        };
      }
    }

    // 5. Intentar crear un registro de prueba en tabla de pacientes (si se encuentra)
    let creationTest = null;
    const patientTable = possiblePatientTables[0];
    
    if (patientTable) {
      console.log(`🧪 Probando creación en tabla de pacientes: ${patientTable.name}`);
      
      try {
        const testRecord = {
          fields: {
            Nombre: "Paciente Test Debug",
            Email: "test@debug.com",
            Telefono: "+56912345678",
            RUT: "12345678-9",
            Edad: 30
          }
        };

        const createUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${patientTable.id}`;
        
        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testRecord),
        });

        const createData = await createResponse.json();
        
        creationTest = {
          status: createResponse.status,
          ok: createResponse.ok,
          table: patientTable.name,
          tableId: patientTable.id,
          response: createData,
          usedFields: Object.keys(testRecord.fields)
        };

        // Si se creó exitosamente, eliminarlo inmediatamente
        if (createResponse.ok && createData.id) {
          console.log('🗑️ Eliminando registro de prueba...');
          await fetch(`${createUrl}/${createData.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            },
          });
          creationTest.cleanedUp = true;
        }

        console.log('✅ Test de creación completado');
      } catch (error) {
        console.error('❌ Error en test de creación:', error);
        creationTest = {
          error: error.message,
          table: patientTable.name
        };
      }
    }

    // 6. Generar recomendaciones
    const recommendations = [];

    if (!envVars.AIRTABLE_PATIENTS_TABLE) {
      if (possiblePatientTables.length > 0) {
        recommendations.push(`💡 Agregar variable AIRTABLE_PATIENTS_TABLE=${possiblePatientTables[0].id}`);
      } else {
        recommendations.push('❌ No se encontró tabla de pacientes. Crear tabla "Pacientes" en Airtable');
      }
    }

    if (possiblePatientTables.length === 0) {
      recommendations.push('🆕 Crear tabla "Pacientes" con campos: Nombre, Email, Telefono, RUT, Edad');
    }

    if (possiblePatientTables.length > 1) {
      recommendations.push(`⚠️ Múltiples tablas de pacientes encontradas: ${possiblePatientTables.map(t => t.name).join(', ')}`);
    }

    // 7. Respuesta completa
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnosis: {
        environmentVariables: envVars,
        allTables: allTables.map(t => ({ name: t.name, id: t.id })),
        possiblePatientTables: possiblePatientTables.map(t => ({ name: t.name, id: t.id })),
        tableAnalysis,
        creationTest,
        recommendations,
        // Configuración sugerida para .env
        suggestedEnvVars: possiblePatientTables.length > 0 ? {
          AIRTABLE_PATIENTS_TABLE: possiblePatientTables[0].id,
          AIRTABLE_PATIENTS_TABLE_NAME: possiblePatientTables[0].name
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}