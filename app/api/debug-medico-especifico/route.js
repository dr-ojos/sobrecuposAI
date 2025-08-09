// app/api/debug-medico-especifico/route.js
import { NextResponse } from 'next/server';

// Función para filtrar solo fechas futuras
function filterFutureDates(records) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return records.filter(record => {
    const fields = record.fields || {};
    const fechaStr = fields.Fecha;
    
    if (!fechaStr) return false;
    
    // Convertir fecha del registro a objeto Date
    const recordDate = new Date(fechaStr);
    
    // Solo incluir si la fecha es hoy o futura
    return recordDate >= today;
  });
}

// Función para buscar médico por nombre en Airtable
async function buscarMedicoPorNombre(nombreBuscado) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

    console.log(`🔍 Buscando médico: "${nombreBuscado}"`);

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.log(`❌ Error fetching doctors: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const doctors = data.records || [];
    
    console.log(`📊 Total médicos en BD: ${doctors.length}`);
    console.log(`📋 Nombres de médicos:`, doctors.map(d => d.fields?.Name).filter(Boolean));
    
    const nombreLimpio = nombreBuscado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    console.log(`🔍 Nombre buscado (limpio): "${nombreLimpio}"`);
    
    // Buscar coincidencia exacta o parcial
    const medicoEncontrado = doctors.find(doctor => {
      const nombreDoctor = (doctor.fields?.Name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      
      console.log(`🔍 Comparando "${nombreLimpio}" con "${nombreDoctor}"`);
      
      // Coincidencia exacta
      if (nombreDoctor === nombreLimpio) {
        console.log(`✅ Coincidencia exacta encontrada`);
        return true;
      }
      
      // Coincidencia por apellido o nombre
      const partesNombreBuscado = nombreLimpio.split(' ');
      const partesNombreDoctor = nombreDoctor.split(' ');
      
      const coincidencia = partesNombreBuscado.some(parte => 
        partesNombreDoctor.some(parteDoctor => 
          parte.length > 2 && parteDoctor.includes(parte)
        )
      );
      
      if (coincidencia) {
        console.log(`✅ Coincidencia parcial encontrada`);
        return true;
      }
      
      return false;
    });

    if (medicoEncontrado) {
      console.log(`✅ Médico encontrado: ${medicoEncontrado.fields?.Name}`);
      console.log(`📊 Datos del médico:`, {
        id: medicoEncontrado.id,
        name: medicoEncontrado.fields?.Name,
        especialidad: medicoEncontrado.fields?.Especialidad,
        campos: Object.keys(medicoEncontrado.fields || {})
      });
      
      return {
        id: medicoEncontrado.id,
        name: medicoEncontrado.fields?.Name,
        especialidad: medicoEncontrado.fields?.Especialidad,
        allFields: medicoEncontrado.fields
      };
    }

    console.log(`❌ No se encontró médico con nombre "${nombreBuscado}"`);
    return null;
  } catch (error) {
    console.error('❌ Error buscando médico por nombre:', error);
    return null;
  }
}

// Función para buscar sobrecupos del médico específico
async function buscarSobrecuposDeMedico(medicoId, medicoName) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log(`🔍 Buscando sobrecupos para médico ID: ${medicoId} (${medicoName})`);

    // Primero, hacer consulta sin filtro para debug
    const debugResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=20`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log(`📊 Total sobrecupos en BD: ${debugData.records?.length || 0}`);
      
      const sampleRecord = debugData.records?.[0];
      if (sampleRecord) {
        console.log(`📋 Estructura de sobrecupo ejemplo:`, Object.keys(sampleRecord.fields || {}));
        console.log(`📊 Ejemplo completo:`, sampleRecord.fields);
        
        // Buscar sobrecupos que mencionan al médico
        const sobrecuposDelMedico = debugData.records.filter(record => {
          const fields = record.fields || {};
          
          // Verificar diferentes campos posibles
          const doctorField = fields.Doctor;
          const medicoField = fields.Medico;
          const nameField = fields.Name;
          
          console.log(`🔍 Sobrecupo ${record.id}:`, {
            Doctor: doctorField,
            Medico: medicoField,
            Name: nameField,
            Disponible: fields.Disponible,
            Fecha: fields.Fecha
          });
          
          // Verificar si coincide con el médico buscado
          const coincideConID = (Array.isArray(doctorField) && doctorField.includes(medicoId)) ||
                               (Array.isArray(medicoField) && medicoField.includes(medicoId)) ||
                               doctorField === medicoId || 
                               medicoField === medicoId;
          
          const coincideConNombre = (nameField && nameField.toLowerCase().includes(medicoName.toLowerCase())) ||
                                   (fields.MedicoNombre && fields.MedicoNombre.toLowerCase().includes(medicoName.toLowerCase()));
          
          if (coincideConID || coincideConNombre) {
            console.log(`✅ Sobrecupo coincide con médico buscado`);
            return true;
          }
          
          return false;
        });
        
        console.log(`📊 Sobrecupos encontrados del médico: ${sobrecuposDelMedico.length}`);
        
        if (sobrecuposDelMedico.length > 0) {
          const disponibles = sobrecuposDelMedico.filter(s => 
            s.fields?.Disponible === "Si" || s.fields?.Disponible === true
          );
          console.log(`📊 Sobrecupos disponibles: ${disponibles.length}`);
          
          const futurosSobrecupos = filterFutureDates(disponibles);
          console.log(`📊 Sobrecupos futuros: ${futurosSobrecupos.length}`);
          
          futurosSobrecupos.forEach((s, idx) => {
            console.log(`📅 Sobrecupo ${idx + 1}:`, {
              id: s.id,
              fecha: s.fields?.Fecha,
              hora: s.fields?.Hora,
              clinica: s.fields?.Clinica || s.fields?.Clínica,
              disponible: s.fields?.Disponible
            });
          });
          
          return futurosSobrecupos;
        }
      }
    }

    return [];
  } catch (error) {
    console.error('❌ Error buscando sobrecupos del médico:', error);
    return [];
  }
}

export async function GET() {
  try {
    console.log(`\n🔍 =========================`);
    console.log(`🔍 DEBUG MÉDICO ESPECÍFICO`);
    console.log(`🔍 =========================\n`);

    const nombreBuscado = "Jose Peña";
    console.log(`🎯 Buscando médico: "${nombreBuscado}"`);

    // 1. Buscar médico
    const medico = await buscarMedicoPorNombre(nombreBuscado);
    
    if (!medico) {
      return NextResponse.json({
        success: false,
        error: `No se encontró médico con nombre "${nombreBuscado}"`
      });
    }

    // 2. Buscar sobrecupos del médico
    const sobrecupos = await buscarSobrecuposDeMedico(medico.id, medico.name);

    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`✅ Médico: ${medico.name} (${medico.especialidad})`);
    console.log(`📊 Sobrecupos disponibles: ${sobrecupos.length}`);

    return NextResponse.json({
      success: true,
      medico: {
        id: medico.id,
        name: medico.name,
        especialidad: medico.especialidad
      },
      sobrecupos: sobrecupos.map(s => ({
        id: s.id,
        fecha: s.fields?.Fecha,
        hora: s.fields?.Hora,
        clinica: s.fields?.Clinica || s.fields?.Clínica,
        disponible: s.fields?.Disponible
      })),
      totalSobrecupos: sobrecupos.length
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}