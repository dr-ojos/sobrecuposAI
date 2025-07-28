// pages/api/sobrecupos/available.js
// API MEJORADA para obtener sobrecupos con datos completos de médicos

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE
  } = process.env;

  // Verificar variables de entorno
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('❌ Variables de entorno faltantes');
    return res.status(500).json({ 
      error: 'Configuración de Airtable faltante',
      missing: {
        AIRTABLE_API_KEY: !AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID: !AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID: !AIRTABLE_TABLE_ID,
        AIRTABLE_DOCTORS_TABLE: !AIRTABLE_DOCTORS_TABLE
      }
    });
  }

  try {
    console.log('🔍 Obteniendo sobrecupos disponibles desde Airtable...');

    // PASO 1: Obtener sobrecupos disponibles
    const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
    const params = new URLSearchParams({
      'filterByFormula': '{Disponible}="Si"',
      'sort[0][field]': 'Fecha',
      'sort[0][direction]': 'asc',
      'sort[1][field]': 'Hora',
      'sort[1][direction]': 'asc',
      'maxRecords': '100'
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('📡 URL de consulta sobrecupos:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Airtable ${response.status}:`, errorText);
      throw new Error(`Error Airtable: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let records = data.records || [];
    
    console.log(`✅ Encontrados ${records.length} sobrecupos disponibles`);
    
    // Log de ejemplo para ver la estructura
    if (records.length > 0) {
      console.log('📋 Ejemplo de sobrecupo original:', {
        id: records[0].id,
        medico: records[0].fields.Médico,
        medicoType: typeof records[0].fields.Médico,
        isArray: Array.isArray(records[0].fields.Médico)
      });
    }

    // PASO 2: Obtener datos de médicos si hay tabla de médicos
    let doctorsData = {};
    
    if (AIRTABLE_DOCTORS_TABLE && records.length > 0) {
      console.log('👨‍⚕️ Obteniendo datos de médicos...');
      
      try {
        const doctorsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}`;
        const doctorsResponse = await fetch(doctorsUrl, {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
        });

        if (doctorsResponse.ok) {
          const doctorsResult = await doctorsResponse.json();
          const doctors = doctorsResult.records || [];
          
          // Crear mapa de ID -> datos del médico
          doctors.forEach(doctor => {
            doctorsData[doctor.id] = doctor.fields;
          });
          
          console.log(`✅ Obtenidos datos de ${doctors.length} médicos`);
          console.log('👨‍⚕️ Ejemplo de médico:', doctors[0]?.fields);
        } else {
          console.log('⚠️ No se pudieron obtener datos de médicos');
        }
      } catch (doctorsError) {
        console.log('⚠️ Error obteniendo médicos:', doctorsError.message);
      }
    } else {
      console.log('ℹ️ No hay tabla de médicos configurada o no hay sobrecupos');
    }

    // PASO 3: Enriquecer sobrecupos con datos de médicos
    const enrichedRecords = records.map(record => {
      const enrichedRecord = { ...record };
      
      // Si el médico es un array de IDs (linked record)
      if (Array.isArray(record.fields.Médico) && record.fields.Médico.length > 0) {
        const doctorId = record.fields.Médico[0];
        const doctorData = doctorsData[doctorId];
        
        if (doctorData) {
          // Intentar diferentes nombres de campos para el nombre del médico
          const doctorName = 
            doctorData.Nombre || 
            doctorData.nombre || 
            doctorData.Name || 
            doctorData.name ||
            doctorData['Nombre Completo'] ||
            doctorData['Nombre del Médico'] ||
            doctorData['Doctor'] ||
            `Dr. ${doctorData.Apellido || doctorData.apellido || doctorData.Especialidad || 'Médico'}`;

          // Reemplazar el ID con el nombre real y agregar datos del médico
          enrichedRecord.fields = {
            ...record.fields,
            Médico: doctorName,
            MedicoId: doctorId, // Guardamos el ID original por si lo necesitamos
            // Agregar campos del médico
            MedicoEspecialidad: doctorData.Especialidad || record.fields.Especialidad,
            // Agregar seguros y tipo de pacientes desde la tabla de médicos
            Seguro: doctorData.Seguro || doctorData.Seguros || doctorData.Previsiones || record.fields.Seguro || 'Consultar seguros',
            Atiende: doctorData.Atiende || doctorData.Edades || doctorData.Pacientes || record.fields.Atiende || 'Consultar edades'
          };
          
          console.log(`✅ Médico enriquecido: ${doctorId} -> ${enrichedRecord.fields.Médico}`);
          console.log(`💳 Seguros: ${enrichedRecord.fields.Seguro}`);
          console.log(`👥 Atiende: ${enrichedRecord.fields.Atiende}`);
          console.log(`📋 Campos disponibles del médico:`, Object.keys(doctorData));
        } else {
          // Si no encontramos datos del médico, usar un nombre genérico
          enrichedRecord.fields = {
            ...record.fields,
            Médico: `Médico (${doctorId.substring(0, 8)})`,
            MedicoId: doctorId
          };
          
          console.log(`⚠️ Médico no encontrado: ${doctorId}`);
        }
      } else if (typeof record.fields.Médico === 'string') {
        // Si ya es un string, lo dejamos como está
        console.log(`ℹ️ Médico ya es string: ${record.fields.Médico}`);
      } else {
        console.log(`⚠️ Médico en formato desconocido:`, record.fields.Médico);
      }
      
      return enrichedRecord;
    });

    // Verificar que tengan los campos necesarios
    const validRecords = enrichedRecords.filter(record => {
      const fields = record.fields;
      const hasRequired = fields.Especialidad && fields.Médico && fields.Fecha && fields.Hora;
      if (!hasRequired) {
        console.warn('⚠️ Sobrecupo sin campos requeridos:', {
          id: record.id,
          especialidad: !!fields.Especialidad,
          medico: !!fields.Médico,
          fecha: !!fields.Fecha,
          hora: !!fields.Hora
        });
      }
      return hasRequired;
    });

    console.log(`✅ ${validRecords.length} sobrecupos válidos de ${records.length} total`);
    
    // Log de ejemplo para debugging
    if (validRecords.length > 0) {
      console.log('📋 Ejemplo de sobrecupo final:', {
        id: validRecords[0].id,
        medico: validRecords[0].fields.Médico,
        especialidad: validRecords[0].fields.Especialidad,
        fecha: validRecords[0].fields.Fecha,
        hora: validRecords[0].fields.Hora
      });
    }
    
    return res.status(200).json({
      success: true,
      count: validRecords.length,
      records: validRecords,
      timestamp: new Date().toISOString(),
      enriched: Object.keys(doctorsData).length > 0
    });

  } catch (error) {
    console.error('❌ Error obteniendo sobrecupos:', error);
    return res.status(500).json({ 
      error: 'Error obteniendo sobrecupos',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}