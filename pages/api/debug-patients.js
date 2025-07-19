// pages/api/debug-patients.js
// Archivo para diagnosticar específicamente el problema de la tabla Pacientes

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_PATIENTS_TABLE
  } = process.env;

  // 1. Verificar variables de entorno
  const envCheck = {
    AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
    AIRTABLE_PATIENTS_TABLE: !!AIRTABLE_PATIENTS_TABLE,
    AIRTABLE_PATIENTS_TABLE_VALUE: AIRTABLE_PATIENTS_TABLE
  };

  // 2. Intentar leer la tabla de pacientes
  let tableReadable = false;
  let tableFields = [];
  let readError = null;

  try {
    const readUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?maxRecords=1`;
    console.log("🔍 URL de lectura:", readUrl);
    
    const readResp = await fetch(readUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (readResp.ok) {
      const readData = await readResp.json();
      tableReadable = true;
      
      // Obtener campos disponibles de un registro existente
      if (readData.records && readData.records.length > 0) {
        tableFields = Object.keys(readData.records[0].fields || {});
      }
    } else {
      const errorData = await readResp.json();
      readError = `HTTP ${readResp.status}: ${errorData.error?.message || 'Error desconocido'}`;
    }
  } catch (err) {
    readError = `Error de conexión: ${err.message}`;
  }

  // 3. Intentar crear un paciente de prueba
  let createTest = null;
  let createError = null;

  if (tableReadable) {
    try {
      const testData = {
        Nombre: "Paciente Test",
        Email: "test@sobrecupos.cl"
      };

      const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`;
      console.log("🔍 URL de creación:", createUrl);
      console.log("🔍 Datos de prueba:", testData);

      const createResp = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: testData })
      });

      if (createResp.ok) {
        const createData = await createResp.json();
        createTest = {
          success: true,
          id: createData.id,
          message: "✅ Paciente de prueba creado exitosamente"
        };

        // Limpiar: eliminar el paciente de prueba
        try {
          await fetch(`${createUrl}/${createData.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          });
          createTest.message += " (y eliminado)";
        } catch (deleteErr) {
          createTest.message += " (no se pudo eliminar)";
        }
      } else {
        const errorData = await createResp.json();
        createError = `HTTP ${createResp.status}: ${JSON.stringify(errorData, null, 2)}`;
        createTest = {
          success: false,
          message: "❌ Error creando paciente de prueba"
        };
      }
    } catch (err) {
      createError = `Error de conexión: ${err.message}`;
      createTest = {
        success: false,
        message: "❌ Error de conexión creando paciente"
      };
    }
  }

  // 4. Respuesta completa del diagnóstico
  return res.json({
    status: "DIAGNÓSTICO TABLA PACIENTES",
    environmentVariables: envCheck,
    tableAccess: {
      readable: tableReadable,
      readError: readError,
      availableFields: tableFields
    },
    createTest: createTest,
    createError: createError,
    recommendations: [
      !envCheck.AIRTABLE_PATIENTS_TABLE && "❌ Variable AIRTABLE_PATIENTS_TABLE no configurada",
      readError && `❌ No se puede leer la tabla: ${readError}`,
      createError && `❌ No se puede crear en la tabla: ${createError}`,
      tableReadable && createTest?.success && "✅ Todo funciona correctamente",
      tableReadable && !createTest?.success && "⚠️ Se puede leer pero no crear - revisar permisos de API Key",
      !tableReadable && "❌ Verificar que el ID de tabla sea correcto y que la API Key tenga permisos"
    ].filter(Boolean),
    nextSteps: [
      "1. Verifica que AIRTABLE_PATIENTS_TABLE tenga el ID correcto (debe empezar con 'tbl')",
      "2. Verifica que tu API Key tenga permisos de escritura en la tabla Pacientes",
      "3. Verifica que los campos 'Nombre' y 'Email' existan en tu tabla Pacientes",
      "4. Si todo está bien, el problema podría ser en los nombres de campos (mayúsculas/minúsculas)"
    ]
  });
}