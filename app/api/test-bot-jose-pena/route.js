// app/api/test-bot-jose-pena/route.js
import { NextResponse } from 'next/server';

// Copiar las funciones exactas del bot
function detectarMedicoEspecifico(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  const patronesMedico = [
    /\b(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\b(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bhora\s+con\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bhora\s+con\s+(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bnecesito\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bquiero\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bbusco\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\btienes\s+sobrecupo\s+con\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i
  ];
  
  for (const patron of patronesMedico) {
    const match = text.match(patron);
    if (match && match[1]) {
      const nombreMedico = match[1].trim();
      return nombreMedico;
    }
  }
  
  return null;
}

async function buscarMedicoPorNombre(nombreBuscado) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const doctors = data.records || [];
    
    const nombreLimpio = nombreBuscado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const medicoEncontrado = doctors.find(doctor => {
      const nombreDoctor = (doctor.fields?.Name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      
      if (nombreDoctor === nombreLimpio) return true;
      
      const partesNombreBuscado = nombreLimpio.split(' ');
      const partesNombreDoctor = nombreDoctor.split(' ');
      
      return partesNombreBuscado.some(parte => 
        partesNombreDoctor.some(parteDoctor => 
          parte.length > 2 && parteDoctor.includes(parte)
        )
      );
    });

    if (medicoEncontrado) {
      return {
        id: medicoEncontrado.id,
        name: medicoEncontrado.fields?.Name,
        especialidad: medicoEncontrado.fields?.Especialidad
      };
    }

    return null;
  } catch (error) {
    console.error('Error buscando médico por nombre:', error);
    return null;
  }
}

function filterFutureDates(records) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return records.filter(record => {
    const fields = record.fields || {};
    const fechaStr = fields.Fecha;
    
    if (!fechaStr) return false;
    
    const recordDate = new Date(fechaStr);
    return recordDate >= today;
  });
}

async function buscarSobrecuposDeMedicoFixed(medicoId) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log(`🔍 Buscando sobrecupos para médico ID: ${medicoId}`);

    // Usar el método que SABEMOS que funciona (búsqueda manual)
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.log(`❌ Error response: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const allRecords = data.records || [];
    
    console.log(`📊 Total registros: ${allRecords.length}`);
    
    // Filtrar manualmente (MÉTODO QUE FUNCIONA)
    const sobrecuposDelMedico = allRecords.filter(record => {
      const fields = record.fields || {};
      const disponible = fields.Disponible === "Si";
      const medico = fields.Médico;
      const tienemedico = Array.isArray(medico) && medico.includes(medicoId);
      
      if (disponible && tienemedico) {
        console.log(`✅ Sobrecupo encontrado: ${record.id} - ${fields.Fecha} ${fields.Hora}`);
        return true;
      }
      
      return false;
    });
    
    console.log(`📊 Sobrecupos del médico encontrados: ${sobrecuposDelMedico.length}`);
    
    // Filtrar fechas futuras
    const sobrecuposFuturos = filterFutureDates(sobrecuposDelMedico);
    console.log(`📊 Sobrecupos futuros: ${sobrecuposFuturos.length}`);

    return sobrecuposFuturos;
  } catch (error) {
    console.error('Error buscando sobrecupos del médico:', error);
    return [];
  }
}

export async function GET() {
  try {
    const text = "tienes Sobrecupo con Dr. Jose Peña";
    console.log(`🔍 Testeando: "${text}"`);

    // 1. Detectar médico específico
    const medicoEspecifico = detectarMedicoEspecifico(text);
    console.log(`🔍 Médico detectado: "${medicoEspecifico}"`);

    if (!medicoEspecifico) {
      return NextResponse.json({
        success: false,
        error: "No se detectó médico específico"
      });
    }

    // 2. Buscar médico
    const medico = await buscarMedicoPorNombre(medicoEspecifico);
    console.log(`🔍 Médico encontrado:`, medico);

    if (!medico) {
      return NextResponse.json({
        success: false,
        error: `No se encontró médico con nombre "${medicoEspecifico}"`
      });
    }

    // 3. Buscar sobrecupos (MÉTODO FIJO)
    const sobrecupos = await buscarSobrecuposDeMedicoFixed(medico.id);
    console.log(`🔍 Sobrecupos encontrados: ${sobrecupos.length}`);

    return NextResponse.json({
      success: true,
      medicoDetectado: medicoEspecifico,
      medico: medico,
      sobrecupos: sobrecupos.map(s => ({
        id: s.id,
        fecha: s.fields?.Fecha,
        hora: s.fields?.Hora,
        clinica: s.fields?.Clínica || s.fields?.Clinica
      })),
      totalSobrecupos: sobrecupos.length,
      respuestaBot: sobrecupos.length > 0 
        ? `El sobrecupo más próximo con ${medico.name} es:`
        : `Encontré al Dr/a. ${medico.name} (${medico.especialidad}), pero lamentablemente no tiene sobrecupos disponibles en este momento.`
    });

  } catch (error) {
    console.error('Error en test bot:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}