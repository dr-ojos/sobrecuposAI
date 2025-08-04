export default async function handler(req, res) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const PATIENTS_TABLE_ID = 'tbl8btPJu6S7nXqNS';
    
    console.log('Inspeccionando tabla Pacientes...');
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}?maxRecords=3`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        message: "No se pudo acceder a la tabla"
      });
    }

    const data = await response.json();
    const records = data.records || [];
    
    console.log(`Registros encontrados: ${records.length}`);

    const allFieldNames = new Set();
    records.forEach(record => {
      Object.keys(record.fields || {}).forEach(fieldName => {
        allFieldNames.add(fieldName);
      });
    });
    
    const fieldNamesArray = Array.from(allFieldNames).sort();
    console.log('Campos encontrados:', fieldNamesArray.join(', '));

    const fieldAnalysis = {};
    fieldNamesArray.forEach(fieldName => {
      fieldAnalysis[fieldName] = {
        values: [],
        types: new Set()
      };
    });

    records.forEach((record, index) => {
      fieldNamesArray.forEach(fieldName => {
        const value = record.fields[fieldName];
        if (value !== undefined) {
          fieldAnalysis[fieldName].values.push({
            recordIndex: index,
            value: value,
            type: typeof value
          });
          fieldAnalysis[fieldName].types.add(typeof value);
        }
      });
    });

    const fieldMapping = {
      found: {},
      missing: [],
      suggestions: {}
    };

    const requiredBotFields = ['Nombre', 'Email', 'Telefono', 'Rut', 'Edad'];
    
    requiredBotFields.forEach(botField => {
      if (fieldNamesArray.includes(botField)) {
        fieldMapping.found[botField] = botField;
      } else {
        const similar = fieldNamesArray.find(field => 
          field.toLowerCase() === botField.toLowerCase()
        );
        
        if (similar) {
          fieldMapping.found[botField] = similar;
          fieldMapping.suggestions[botField] = `Usar "${similar}" en lugar de "${botField}"`;
        } else {
          fieldMapping.missing.push(botField);
          
          const partial = fieldNamesArray.filter(field =>
            field.toLowerCase().includes(botField.toLowerCase()) ||
            botField.toLowerCase().includes(field.toLowerCase())
          );
          
          if (partial.length > 0) {
            fieldMapping.suggestions[botField] = `Posibles: ${partial.join(', ')}`;
          }
        }
      }
    });

    const correctedBotCode = `
const patientPayload = {
  fields: {
    ${fieldMapping.found.Nombre ? `"${fieldMapping.found.Nombre}": patientName,` : '// FALTA CAMPO NOMBRE'}
    ${fieldMapping.found.Rut ? `"${fieldMapping.found.Rut}": patientRut,` : '// FALTA CAMPO RUT'}
    ${fieldMapping.found.Telefono ? `"${fieldMapping.found.Telefono}": patientPhone,` : '// FALTA CAMPO TELEFONO'}
    ${fieldMapping.found.Email ? `"${fieldMapping.found.Email}": patientEmail,` : '// FALTA CAMPO EMAIL'}
    ${fieldMapping.found.Edad ? `"${fieldMapping.found.Edad}": 30,` : '// FALTA CAMPO EDAD'}
    "Fecha Registro": new Date().toISOString().split('T')[0]
  }
};`;

    let creationTest = null;
    
    if (Object.keys(fieldMapping.found).length >= 2) {
      console.log('Probando creación con campos reales...');
      
      const testFields = {};
      
      if (fieldMapping.found.Nombre) testFields[fieldMapping.found.Nombre] = "Test Inspector";
      if (fieldMapping.found.Email) testFields[fieldMapping.found.Email] = "test.inspector@sobrecupos.com";
      if (fieldMapping.found.Telefono) testFields[fieldMapping.found.Telefono] = "+56912345678";
      if (fieldMapping.found.Rut) testFields[fieldMapping.found.Rut] = "12345678-9";
      if (fieldMapping.found.Edad) testFields[fieldMapping.found.Edad] = 30;
      
      testFields["Fecha Registro"] = new Date().toISOString().split('T')[0];
      
      const testRecord = { fields: testFields };
      
      try {
        const createResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testRecord),
          }
        );
        
        const createData = await createResponse.json();
        
        creationTest = {
          status: createResponse.status,
          success: createResponse.ok,
          data: createData,
          fieldsUsed: Object.keys(testFields)
        };
        
        if (createResponse.ok && createData.id) {
          console.log('Limpiando registro de prueba...');
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}/${createData.id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            }
          );
          creationTest.cleanedUp = true;
        }
        
      } catch (createError) {
        creationTest = {
          error: createError.message
        };
      }
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      tableInfo: {
        id: PATIENTS_TABLE_ID,
        recordCount: records.length,
        allFields: fieldNamesArray
      },
      fieldAnalysis,
      fieldMapping,
      correctedBotCode,
      creationTest,
      recommendations: [
        `Tabla accesible con ${fieldNamesArray.length} campos`,
        `${Object.keys(fieldMapping.found).length}/${requiredBotFields.length} campos requeridos encontrados`,
        creationTest?.success ? "Puede crear registros" : "Error creando registros",
        fieldMapping.missing.length === 0 ? "Todos los campos están disponibles" : `Campos faltantes: ${fieldMapping.missing.join(', ')}`,
        "Usar el código corregido mostrado arriba"
      ],
      nextSteps: [
        "1. Copiar el código corregido al bot.js",
        "2. Reemplazar la sección 'getting-email'",
        "3. Reiniciar el servidor",
        "4. Probar el flujo completo"
      ]
    });

  } catch (error) {
    console.error('Error inspeccionando tabla:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}