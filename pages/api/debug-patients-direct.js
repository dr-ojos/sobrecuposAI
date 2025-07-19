// pages/api/debug-patients-direct.js
// 🎯 DIAGNÓSTICO DIRECTO SIN METADATOS

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo GET permitido' });
  }

  try {
    console.log('🔍 === DIAGNÓSTICO DIRECTO DE PACIENTES ===');

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({
        error: 'Faltan variables básicas de Airtable'
      });
    }

    // Lista de nombres posibles para tabla de pacientes
    const possibleTableNames = [
      'Pacientes',
      'pacientes', 
      'Patients',
      'patients',
      'Clientes',
      'clientes',
      'Usuarios',
      'usuarios',
      'Users',
      'users'
    ];

    console.log('🔍 Probando nombres de tabla:', possibleTableNames);

    const results = {};
    let foundTable = null;

    // Probar cada nombre posible
    for (const tableName of possibleTableNames) {
      console.log(`🧪 Probando tabla: ${tableName}`);
      
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?maxRecords=1`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
        });

        console.log(`📡 ${tableName}: Status ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const record = data.records?.[0];
          
          results[tableName] = {
            status: response.status,
            exists: true,
            fields: record ? Object.keys(record.fields) : [],
            recordCount: data.records?.length || 0,
            sampleRecord: record?.fields || null
          };

          // Marcar como tabla encontrada
          if (!foundTable) {
            foundTable = {
              name: tableName,
              fields: record ? Object.keys(record.fields) : []
            };
          }

          console.log(`✅ ${tableName} ENCONTRADA con ${results[tableName].fields.length} campos`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          results[tableName] = {
            status: response.status,
            exists: false,
            error: errorData.error?.message || `HTTP ${response.status}`
          };

          console.log(`❌ ${tableName}: ${results[tableName].error}`);
        }
      } catch (error) {
        results[tableName] = {
          exists: false,
          error: error.message
        };
        console.error(`❌ Error probando ${tableName}:`, error.message);
      }
    }

    // Probar creación de registro de prueba si encontramos una tabla
    let creationTest = null;
    if (foundTable) {
      console.log(`🧪 Probando creación en tabla: ${foundTable.name}`);
      
      try {
        const testFields = {
          Nombre: "Test Debug",
          Email: "test@debug.com",
          Telefono: "+56912345678"
        };

        // Añadir campos adicionales si existen en la tabla
        if (foundTable.fields.includes('RUT')) {
          testFields.RUT = "12345678-9";
        }
        if (foundTable.fields.includes('Edad')) {
          testFields.Edad = 30;
        }

        const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${foundTable.name}`;
        
        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: testFields
          }),
        });

        const createData = await createResponse.json();
        
        creationTest = {
          tableName: foundTable.name,
          status: createResponse.status,
          ok: createResponse.ok,
          usedFields: Object.keys(testFields),
          response: createData
        };

        // Limpiar registro de prueba si se creó
        if (createResponse.ok && createData.id) {
          console.log('🗑️ Limpiando registro de prueba...');
          
          const deleteResponse = await fetch(`${createUrl}/${createData.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          });

          creationTest.cleanedUp = deleteResponse.ok;
          console.log(`${deleteResponse.ok ? '✅' : '❌'} Limpieza: ${deleteResponse.status}`);
        }

      } catch (error) {
        console.error('❌ Error en test de creación:', error);
        creationTest = {
          tableName: foundTable.name,
          error: error.message
        };
      }
    }

    // Análisis de campos para verificar estructura
    let fieldAnalysis = null;
    if (foundTable) {
      const requiredFields = ['Nombre', 'Email', 'Telefono', 'RUT', 'Edad'];
      const existingFields = foundTable.fields;
      
      fieldAnalysis = {
        table: foundTable.name,
        required: requiredFields,
        existing: existingFields,
        missing: requiredFields.filter(field => !existingFields.includes(field)),
        extra: existingFields.filter(field => !requiredFields.includes(field)),
        compatibility: requiredFields.filter(field => existingFields.includes(field)).length / requiredFields.length
      };
    }

    // Generar recomendaciones
    const recommendations = [];
    
    if (foundTable) {
      recommendations.push(`✅ Tabla encontrada: ${foundTable.name}`);
      recommendations.push(`💡 Agregar a .env: AIRTABLE_PATIENTS_TABLE=${foundTable.name}`);
      
      if (fieldAnalysis && fieldAnalysis.missing.length > 0) {
        recommendations.push(`⚠️ Campos faltantes en ${foundTable.name}: ${fieldAnalysis.missing.join(', ')}`);
      }
      
      if (creationTest && creationTest.ok) {
        recommendations.push(`✅ Tabla ${foundTable.name} funcional para crear registros`);
      } else if (creationTest) {
        recommendations.push(`❌ Error creando en ${foundTable.name}: ${creationTest.error || 'Error desconocido'}`);
      }
    } else {
      recommendations.push('❌ No se encontró tabla de pacientes con nombres estándar');
      recommendations.push('🆕 Crear tabla "Pacientes" en Airtable con campos: Nombre, Email, Telefono, RUT, Edad');
    }

    // Respuesta final
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnosis: {
        foundTable,
        allResults: results,
        fieldAnalysis,
        creationTest,
        recommendations,
        suggestedEnvVar: foundTable ? `AIRTABLE_PATIENTS_TABLE=${foundTable.name}` : null,
        nextSteps: foundTable ? [
          `1. Agregar AIRTABLE_PATIENTS_TABLE=${foundTable.name} a tu .env`,
          '2. Reiniciar tu servidor de desarrollo',
          '3. Probar nuevamente tu funcionalidad de pacientes'
        ] : [
          '1. Ir a tu base de Airtable',
          '2. Crear tabla "Pacientes"', 
          '3. Agregar campos: Nombre, Email, Telefono, RUT, Edad',
          '4. Agregar AIRTABLE_PATIENTS_TABLE=Pacientes a tu .env'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}