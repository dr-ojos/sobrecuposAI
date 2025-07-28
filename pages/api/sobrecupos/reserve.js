// pages/api/sobrecupos/reserve.js
// API para reservar un sobrecupo específico

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { sobrecupoId, pacienteData } = req.body;

  // Validar datos de entrada
  if (!sobrecupoId) {
    return res.status(400).json({ error: 'ID del sobrecupo es requerido' });
  }

  if (!pacienteData || !pacienteData.nombre || !pacienteData.email || !pacienteData.telefono) {
    return res.status(400).json({ 
      error: 'Datos del paciente incompletos',
      required: ['nombre', 'email', 'telefono', 'rut', 'edad']
    });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_PATIENTS_TABLE
  } = process.env;

  // Verificar variables de entorno
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.status(500).json({ error: 'Configuración de Airtable faltante' });
  }

  console.log('🎯 Iniciando proceso de reserva...');
  console.log('📋 Datos del paciente:', {
    nombre: pacienteData.nombre,
    email: pacienteData.email,
    telefono: pacienteData.telefono,
    rut: pacienteData.rut
  });
  console.log('🏥 ID del sobrecupo:', sobrecupoId);

  try {
    let patientId = null;

    // PASO 1: Crear paciente en tabla de pacientes (si existe la tabla)
    if (AIRTABLE_PATIENTS_TABLE) {
      console.log('👤 Creando paciente en tabla de pacientes...');
      
      try {
        const patientResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                Nombre: pacienteData.nombre,
                Email: pacienteData.email,
                Telefono: pacienteData.telefono,
                Rut: pacienteData.rut, // Usar "Rut" según tu estructura real
                Edad: parseInt(pacienteData.edad) || 0
              }
            }),
          }
        );

        if (patientResponse.ok) {
          const patient = await patientResponse.json();
          patientId = patient.id;
          console.log('✅ Paciente creado con ID:', patientId);
        } else {
          const errorData = await patientResponse.json();
          console.log('⚠️ No se pudo crear paciente:', errorData.error?.message);
          // Continuamos sin paciente - agregaremos datos directamente al sobrecupo
        }
      } catch (patientError) {
        console.log('⚠️ Error creando paciente, continuando...', patientError.message);
      }
    } else {
      console.log('ℹ️ No hay tabla de pacientes configurada');
    }

    // PASO 2: Actualizar sobrecupo con datos del paciente
    console.log('🔄 Actualizando sobrecupo...');
    
    // Preparar campos para actualizar
    const updateFields = {
      Disponible: 'No',
      // Agregar datos del paciente directamente al sobrecupo
      Nombre: pacienteData.nombre,
      Email: pacienteData.email,
      Telefono: pacienteData.telefono,
      RUT: pacienteData.rut,
      Edad: parseInt(pacienteData.edad) || 0
    };

    // Si se creó el paciente exitosamente, también linkear
    if (patientId) {
      updateFields.Paciente = [patientId];
    }

    console.log('📝 Campos a actualizar:', updateFields);

    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: updateFields
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Error actualizando sobrecupo:', errorData);
      throw new Error(`Error actualizando sobrecupo: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const updatedSobrecupo = await updateResponse.json();
    console.log('✅ Sobrecupo actualizado exitosamente');

    // PASO 3: Opcional - Enviar notificaciones (implementar después)
    // Aquí podrías agregar lógica para enviar emails o WhatsApp

    return res.status(200).json({ 
      success: true, 
      message: 'Reserva confirmada exitosamente',
      data: {
        sobrecupoId: sobrecupoId,
        patientId: patientId,
        patientData: {
          nombre: pacienteData.nombre,
          email: pacienteData.email,
          telefono: pacienteData.telefono
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en reserva:', error);
    return res.status(500).json({ 
      error: 'Error procesando la reserva',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}