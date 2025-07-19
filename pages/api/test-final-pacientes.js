// pages/api/test-final-pacientes.js
// 🎯 TEST FINAL CON ID REAL: tbl8btPJu6S7nXqNS

export default async function handler(req, res) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    console.log('🧪 === TEST FINAL CON ID REAL ===');
    
    // Usar el ID real que me diste
    const PATIENTS_TABLE_ID = 'tbl8btPJu6S7nXqNS';
    
    console.log(`📋 Probando tabla: ${PATIENTS_TABLE_ID}`);
    
    // 1. Probar acceso directo con ID
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}?maxRecords=3`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    console.log(`📡 Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        tableId: PATIENTS_TABLE_ID,
        message: "❌ No se pudo acceder con el ID proporcionado"
      });
    }

    const data = await response.json();
    console.log(`📊 Registros encontrados: ${data.records?.length || 0}`);

    // 2. Análizar estructura
    const records = data.records || [];
    const allFields = new Set();
    
    records.forEach(record => {
      Object.keys(record.fields || {}).forEach(field => allFields.add(field));
    });

    const fieldsArray = Array.from(allFields);
    console.log(`🔍 Campos únicos encontrados: ${fieldsArray.join(', ')}`);

    // 3. Test de creación usando campos CORRECTOS (Rut no RUT)
    console.log('🧪 Probando creación de registro...');
    
    const testRecord = {
      fields: {
        Nombre: "Paciente Test Final",
        Email: "test.final@sobrecupos.com",
        Telefono: "+56987654321",
        Rut: "98765432-1",        // ← CORREGIDO: "Rut" no "RUT"
        Edad: 35
      }
    };

    const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}`;
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord),
    });

    const createData = await createResponse.json();
    console.log(`📝 Creación: ${createResponse.status} ${createResponse.ok ? '✅' : '❌'}`);

    // 4. Limpiar registro de prueba
    let cleanupResult = null;
    if (createResponse.ok && createData.id) {
      console.log('🗑️ Limpiando registro de prueba...');
      
      const deleteResponse = await fetch(`${createUrl}/${createData.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      });

      cleanupResult = {
        success: deleteResponse.ok,
        status: deleteResponse.status
      };
      console.log(`🗑️ Limpieza: ${deleteResponse.status} ${deleteResponse.ok ? '✅' : '❌'}`);
    }

    // 5. Verificar campos requeridos (CORREGIDOS)
    const requiredFields = ['Nombre', 'Email', 'Telefono', 'Rut', 'Edad']; // ← CORREGIDO
    const missingFields = requiredFields.filter(field => !fieldsArray.includes(field));
    const existingFields = requiredFields.filter(field => fieldsArray.includes(field));

    // 6. Generar respuesta completa
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      tableId: PATIENTS_TABLE_ID,
      analysis: {
        accessible: true,
        recordCount: records.length,
        existingFields: fieldsArray,
        requiredFields,
        missingFields,
        existingRequiredFields: existingFields,
        canCreate: createResponse.ok,
        canDelete: cleanupResult?.success || false
      },
      creationTest: {
        status: createResponse.status,
        ok: createResponse.ok,
        response: createData,
        cleanup: cleanupResult,
        fieldsUsed: Object.keys(testRecord.fields)
      },
      configuration: {
        envVarName: "AIRTABLE_PATIENTS_TABLE",
        envVarValue: PATIENTS_TABLE_ID,
        addToEnv: `AIRTABLE_PATIENTS_TABLE=${PATIENTS_TABLE_ID}`
      },
      recommendations: [
        `✅ Tabla ${PATIENTS_TABLE_ID} es accesible`,
        createResponse.ok ? "✅ Puede crear registros correctamente" : `❌ Error creando registros: ${createData.error?.message}`,
        `💡 Agregar a .env: AIRTABLE_PATIENTS_TABLE=${PATIENTS_TABLE_ID}`,
        missingFields.length === 0 ? "✅ Todos los campos requeridos existen" : `⚠️ Campos faltantes: ${missingFields.join(', ')}`,
        createResponse.ok ? "🚀 Tabla completamente funcional" : "🔧 Necesita ajustes en campos"
      ],
      nextSteps: createResponse.ok ? [
        `1. Agregar AIRTABLE_PATIENTS_TABLE=${PATIENTS_TABLE_ID} a tu .env`,
        "2. Reiniciar servidor: npm run dev", 
        "3. ¡Tu funcionalidad de pacientes está lista! 🎉"
      ] : [
        "1. Verificar nombres de campos en Airtable",
        "2. Asegurar que existan: Nombre, Email, Telefono, Rut, Edad",
        "3. Volver a probar"
      ]
    });

  } catch (error) {
    console.error('❌ Error en test final:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      tableId: 'tbl8btPJu6S7nXqNS'
    });
  }
}