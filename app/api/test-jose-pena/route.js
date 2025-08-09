// app/api/test-jose-pena/route.js
import { NextResponse } from 'next/server';

// Función para filtrar solo fechas futuras
function filterFutureDates(records) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return records.filter(record => {
    const fields = record.fields || {};
    const fechaStr = fields.Fecha;
    
    if (!fechaStr) return false;
    
    try {
      const recordDate = new Date(fechaStr);
      return recordDate >= today;
    } catch (error) {
      console.error('Error parseando fecha:', error);
      return false;
    }
  });
}

export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    const medicoId = "reco0oJFeZ823PK3g"; // ID del Dr. José Peña

    console.log(`🔍 TEST: Buscando sobrecupos para José Peña (ID: ${medicoId})`);

    // Método 1: Filtro con fórmula de Airtable
    console.log(`\n🔍 MÉTODO 1: Filtro con fórmula`);
    const filtroFormula = `AND({Disponible}="Si",FIND("${medicoId}",ARRAYJOIN({Médico},",")))`;
    console.log(`Filtro: ${filtroFormula}`);

    const response1 = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100&filterByFormula=${encodeURIComponent(filtroFormula)}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let sobrecuposMetodo1 = [];
    if (response1.ok) {
      const data1 = await response1.json();
      sobrecuposMetodo1 = data1.records || [];
      console.log(`✅ Método 1 encontró: ${sobrecuposMetodo1.length} sobrecupos`);
    } else {
      console.log(`❌ Método 1 falló con status: ${response1.status}`);
    }

    // Método 2: Búsqueda manual (fallback)
    console.log(`\n🔍 MÉTODO 2: Búsqueda manual`);
    
    const response2 = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let sobrecuposMetodo2 = [];
    if (response2.ok) {
      const data2 = await response2.json();
      const allRecords = data2.records || [];
      
      console.log(`📊 Total registros: ${allRecords.length}`);
      
      // Filtrar manualmente
      sobrecuposMetodo2 = allRecords.filter(record => {
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
      
      console.log(`✅ Método 2 encontró: ${sobrecuposMetodo2.length} sobrecupos disponibles`);
    } else {
      console.log(`❌ Método 2 falló con status: ${response2.status}`);
    }

    // Filtrar fechas futuras
    const sobrecuposFuturosM1 = filterFutureDates(sobrecuposMetodo1);
    const sobrecuposFuturosM2 = filterFutureDates(sobrecuposMetodo2);

    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`Método 1 (filtro): ${sobrecuposFuturosM1.length} sobrecupos futuros`);
    console.log(`Método 2 (manual): ${sobrecuposFuturosM2.length} sobrecupos futuros`);

    // Usar el método que tenga más resultados
    const sobrecuposFuturos = sobrecuposFuturosM2.length > 0 ? sobrecuposFuturosM2 : sobrecuposFuturosM1;

    return NextResponse.json({
      success: true,
      medicoId: medicoId,
      metodo1Resultados: sobrecuposFuturosM1.length,
      metodo2Resultados: sobrecuposFuturosM2.length,
      sobrecuposFuturos: sobrecuposFuturos.map(s => ({
        id: s.id,
        fecha: s.fields?.Fecha,
        hora: s.fields?.Hora,
        clinica: s.fields?.Clínica || s.fields?.Clinica,
        disponible: s.fields?.Disponible,
        medico: s.fields?.['Name (from Médico)']
      })),
      totalEncontrados: sobrecuposFuturos.length
    });

  } catch (error) {
    console.error('❌ Error en test:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}