// /pages/api/debug-bot.js
// Script para diagnosticar problemas con Airtable en el bot

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Sobrecupostest
    AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PACIENTES_TABLE
  } = process.env;

  try {
    // 1. Verificar variables de entorno
    const envCheck = {
      AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_ID: !!AIRTABLE_TABLE_ID,
      AIRTABLE_DOCTORS_TABLE: !!AIRTABLE_DOCTORS_TABLE,
      AIRTABLE_PACIENTES_TABLE: !!AIRTABLE_PACIENTES_TABLE
    };

    console.log('🔍 Variables de entorno:', envCheck);

    // 2. Probar conexión a Sobrecupostest
    let sobrecupostestCheck = {};
    try {
      const sobrecupostestUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=3`;
      const sobrecupostestRes = await fetch(sobrecupostestUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const sobrecupostestData = await sobrecupostestRes.json();
      
      sobrecupostestCheck = {
        status: sobrecupostestRes.status,
        ok: sobrecupostestRes.ok,
        recordCount: sobrecupostestData.records?.length || 0,
        firstRecord: sobrecupostestData.records?.[0],
        error: sobrecupostestData.error,
        availableFields: sobrecupostestData.records?.[0] ? Object.keys(sobrecupostestData.records[0].fields || {}) : []
      };
    } catch (err) {
      sobrecupostestCheck.error = err.message;
    }

    // 3. Probar conexión a Doctors
    let doctorsCheck = {};
    try {
      const doctorsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?maxRecords=3`;
      const doctorsRes = await fetch(doctorsUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const doctorsData = await doctorsRes.json();
      
      doctorsCheck = {
        status: doctorsRes.status,
        ok: doctorsRes.ok,
        recordCount: doctorsData.records?.length || 0,
        error: doctorsData.error,
        especialidades: doctorsData.records?.map(r => r.fields?.Especialidad).filter(Boolean) || []
      };
    } catch (err) {
      doctorsCheck.error = err.message;
    }

    // 4. Probar conexión a Pacientes (si existe)
    let pacientesCheck = {};
    if (AIRTABLE_PACIENTES_TABLE) {
      try {
        const pacientesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}?maxRecords=1`;
        const pacientesRes = await fetch(pacientesUrl, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        const pacientesData = await pacientesRes.json();
        
        pacientesCheck = {
          status: pacientesRes.status,
          ok: pacientesRes.ok,
          recordCount: pacientesData.records?.length || 0,
          error: pacientesData.error,
          tableExists: pacientesRes.ok
        };
      } catch (err) {
        pacientesCheck.error = err.message;
      }
    } else {
      pacientesCheck.error = "AIRTABLE_PACIENTES_TABLE no configurado";
    }

    // 5. Simular creación de paciente
    let testPacienteCreation = {};
    if (AIRTABLE_PACIENTES_TABLE && pacientesCheck.ok) {
      try {
        const testPacientePayload = {
          fields: {
            Nombre: "Test Paciente Debug",
            Edad: 30,
            RUT: "12345678-9",
            Telefono: "+56912345678",
            Email: "test@debug.com",
            "Fecha Registro": new Date().toISOString().split('T')[0]
          }
        };

        const createRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(testPacientePayload)
          }
        );
        const createData = await createRes.json();
        
        testPacienteCreation = {
          status: createRes.status,
          ok: createRes.ok,
          createdId: createData.id,
          error: createData.error
        };

        // Si se creó exitosamente, intentar eliminarlo
        if (createData.id) {
          try {
            await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}/${createData.id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
              }
            );
            testPacienteCreation.cleanedUp = true;
          } catch (delErr) {
            testPacienteCreation.cleanupError = delErr.message;
          }
        }
      } catch (err) {
        testPacienteCreation.error = err.message;
      }
    }

    // 6. Simular actualización de sobrecupo
    let testSobrecupoUpdate = {};
    if (sobrecupostestCheck.ok && sobrecupostestCheck.firstRecord) {
      try {
        const testId = sobrecupostestCheck.firstRecord.id;
        const updatePayload = {
          fields: {
            Nombre: "Test Update Debug",
            Edad: 25,
            RUT: "98765432-1"
          }
        };

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
        
        testSobrecupoUpdate = {
          status: updateRes.status,
          ok: updateRes.ok,
          updatedId: updateData.id,
          error: updateData.error
        };

        // Revertir cambios
        if (updateData.id) {
          try {
            await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${testId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  fields: {
                    Nombre: "",
                    Edad: null,
                    RUT: ""
                  }
                })
              }
            );
            testSobrecupoUpdate.reverted = true;
          } catch (revertErr) {
            testSobrecupoUpdate.revertError = revertErr.message;
          }
        }
      } catch (err) {
        testSobrecupoUpdate.error = err.message;
      }
    }

    return res.status(200).json({
      success: true,
      diagnosis: {
        environmentVariables: envCheck,
        sobrecupostestTable: sobrecupostestCheck,
        doctorsTable: doctorsCheck,
        pacientesTable: pacientesCheck,
        testPacienteCreation,
        testSobrecupoUpdate,
        recommendations: [
          !envCheck.AIRTABLE_API_KEY && "❌ Falta AIRTABLE_API_KEY",
          !envCheck.AIRTABLE_BASE_ID && "❌ Falta AIRTABLE_BASE_ID",
          !envCheck.AIRTABLE_TABLE_ID && "❌ Falta AIRTABLE_TABLE_ID (Sobrecupostest)",
          !envCheck.AIRTABLE_DOCTORS_TABLE && "❌ Falta AIRTABLE_DOCTORS_TABLE",
          !envCheck.AIRTABLE_PACIENTES_TABLE && "❌ Falta AIRTABLE_PACIENTES_TABLE",
          !sobrecupostestCheck.ok && "❌ No se puede acceder a tabla Sobrecupostest",
          !doctorsCheck.ok && "❌ No se puede acceder a tabla Doctors",
          !pacientesCheck.ok && "❌ No se puede acceder a tabla Pacientes (crear tabla)",
          sobrecupostestCheck.ok && !sobrecupostestCheck.availableFields.includes('Edad') && "❌ Falta campo 'Edad' en Sobrecupostest",
          sobrecupostestCheck.ok && !sobrecupostestCheck.availableFields.includes('RUT') && "❌ Falta campo 'RUT' en Sobrecupostest",
          sobrecupostestCheck.ok && !sobrecupostestCheck.availableFields.includes('Paciente') && "⚠️  Campo 'Paciente' no existe en Sobrecupostest (opcional)",
          testPacienteCreation.ok && testSobrecupoUpdate.ok && "✅ Todo funciona correctamente"
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