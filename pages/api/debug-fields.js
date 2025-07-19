// /pages/api/debug-fields.js
// Script para ver los nombres EXACTOS de los campos en Airtable

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Sobrecupostest
    AIRTABLE_PACIENTES_TABLE
  } = process.env;

  try {
    // 1. Obtener todos los campos de Sobrecupostest
    const sobrecupostestUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=1`;
    const sobrecupostestRes = await fetch(sobrecupostestUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const sobrecupostestData = await sobrecupostestRes.json();
    
    const sobrecupostestFields = sobrecupostestData.records?.[0] 
      ? Object.keys(sobrecupostestData.records[0].fields || {}) 
      : [];

    // 2. Obtener todos los campos de Pacientes
    let pacientesFields = [];
    if (AIRTABLE_PACIENTES_TABLE) {
      try {
        const pacientesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}?maxRecords=1`;
        const pacientesRes = await fetch(pacientesUrl, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        const pacientesData = await pacientesRes.json();
        
        pacientesFields = pacientesData.records?.[0] 
          ? Object.keys(pacientesData.records[0].fields || {}) 
          : [];
      } catch (err) {
        pacientesFields = [`Error: ${err.message}`];
      }
    }

    // 3. Verificar campos específicos que necesitamos
    const requiredFields = ['Nombre', 'Edad', 'RUT', 'Telefono', 'Email', 'Paciente'];
    const fieldCheck = {};
    
    requiredFields.forEach(field => {
      fieldCheck[field] = {
        exists: sobrecupostestFields.includes(field),
        exactMatches: sobrecupostestFields.filter(f => f.toLowerCase().includes(field.toLowerCase())),
        allSimilar: sobrecupostestFields.filter(f => 
          f.toLowerCase().replace(/[^a-z]/g, '').includes(field.toLowerCase().replace(/[^a-z]/g, ''))
        )
      };
    });

    // 4. Probar creación con nombres exactos encontrados
    let creationTest = {};
    if (sobrecupostestData.records?.[0]) {
      const testId = sobrecupostestData.records[0].id;
      
      // Intentar con diferentes variaciones de nombres
      const fieldVariations = {
        Nombre: sobrecupostestFields.find(f => f.toLowerCase().includes('nombre')) || 'Nombre',
        Edad: sobrecupostestFields.find(f => f.toLowerCase().includes('edad')) || 'Edad',
        RUT: sobrecupostestFields.find(f => f.toLowerCase().includes('rut')) || 'RUT',
        Telefono: sobrecupostestFields.find(f => f.toLowerCase().includes('telefono') || f.toLowerCase().includes('phone')) || 'Telefono',
        Email: sobrecupostestFields.find(f => f.toLowerCase().includes('email') || f.toLowerCase().includes('correo')) || 'Email'
      };

      try {
        const updatePayload = {
          fields: {}
        };

        // Solo incluir campos que existen
        Object.entries(fieldVariations).forEach(([key, fieldName]) => {
          if (sobrecupostestFields.includes(fieldName)) {
            switch(key) {
              case 'Nombre':
                updatePayload.fields[fieldName] = "Test Debug";
                break;
              case 'Edad':
                updatePayload.fields[fieldName] = 30;
                break;
              case 'RUT':
                updatePayload.fields[fieldName] = "12345678-9";
                break;
              case 'Telefono':
                updatePayload.fields[fieldName] = "+56912345678";
                break;
              case 'Email':
                updatePayload.fields[fieldName] = "test@debug.com";
                break;
            }
          }
        });

        const updateRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${testId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatePayload)
          }
        );
        const updateData = await updateRes.json();
        
        creationTest = {
          status: updateRes.status,
          ok: updateRes.ok,
          usedFields: Object.keys(updatePayload.fields),
          response: updateData,
          error: updateData.error
        };

        // Limpiar cambios
        if (updateRes.ok) {
          const cleanPayload = { fields: {} };
          Object.keys(updatePayload.fields).forEach(field => {
            if (field.toLowerCase().includes('edad')) {
              cleanPayload.fields[field] = null;
            } else {
              cleanPayload.fields[field] = "";
            }
          });

          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${testId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(cleanPayload)
            }
          );
        }

      } catch (err) {
        creationTest.error = err.message;
      }
    }

    return res.status(200).json({
      success: true,
      analysis: {
        sobrecupostestTableFields: sobrecupostestFields,
        pacientesTableFields: pacientesFields,
        fieldCheck,
        creationTest,
        recommendations: [
          // Verificar cada campo requerido
          ...requiredFields.map(field => {
            if (!fieldCheck[field].exists) {
              if (fieldCheck[field].exactMatches.length > 0) {
                return `⚠️  Campo '${field}' no existe exactamente, pero encontré: ${fieldCheck[field].exactMatches.join(', ')}`;
              } else if (fieldCheck[field].allSimilar.length > 0) {
                return `⚠️  Campo '${field}' no existe, campos similares: ${fieldCheck[field].allSimilar.join(', ')}`;
              } else {
                return `❌ Campo '${field}' no existe en absoluto`;
              }
            } else {
              return `✅ Campo '${field}' existe correctamente`;
            }
          }),
          creationTest.ok && "✅ Test de actualización exitoso",
          !creationTest.ok && creationTest.error && `❌ Error en test: ${JSON.stringify(creationTest.error)}`
        ].filter(Boolean)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
