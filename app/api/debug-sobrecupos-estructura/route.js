// app/api/debug-sobrecupos-estructura/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log(`\n🔍 =========================`);
    console.log(`🔍 DEBUG ESTRUCTURA SOBRECUPOS`);
    console.log(`🔍 =========================\n`);

    // Obtener todos los sobrecupos
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=50`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching sobrecupos: ${response.status}`);
    }

    const data = await response.json();
    const sobrecupos = data.records || [];

    console.log(`📊 Total sobrecupos: ${sobrecupos.length}`);

    // Analizar estructura
    const camposUnicos = new Set();
    const ejemplosPorCampo = {};

    sobrecupos.forEach((record, idx) => {
      console.log(`\n📋 Sobrecupo ${idx + 1} (ID: ${record.id}):`);
      
      Object.keys(record.fields || {}).forEach(campo => {
        camposUnicos.add(campo);
        
        const valor = record.fields[campo];
        console.log(`  ${campo}: ${JSON.stringify(valor)}`);
        
        // Guardar ejemplos
        if (!ejemplosPorCampo[campo]) {
          ejemplosPorCampo[campo] = [];
        }
        if (ejemplosPorCampo[campo].length < 3) {
          ejemplosPorCampo[campo].push(valor);
        }
      });
    });

    const camposArray = Array.from(camposUnicos);
    console.log(`\n📋 Campos encontrados: ${camposArray.join(', ')}`);

    // Buscar específicamente sobrecupos del Dr. José Peña
    console.log(`\n🔍 Buscando sobrecupos de José Peña...`);
    
    const medicoId = "reco0oJFeZ823PK3g"; // ID del Dr. José Peña
    
    const sobrecuposJosePena = sobrecupos.filter(record => {
      const fields = record.fields || {};
      
      // Buscar en todos los campos posibles
      let encontrado = false;
      let razon = "";
      
      Object.keys(fields).forEach(campo => {
        const valor = fields[campo];
        
        if (Array.isArray(valor) && valor.includes(medicoId)) {
          encontrado = true;
          razon = `Campo "${campo}" contiene ID ${medicoId}`;
        } else if (valor === medicoId) {
          encontrado = true;
          razon = `Campo "${campo}" es igual a ID ${medicoId}`;
        } else if (typeof valor === 'string' && valor.toLowerCase().includes('jose') && valor.toLowerCase().includes('pena')) {
          encontrado = true;
          razon = `Campo "${campo}" contiene nombre "Jose Pena"`;
        } else if (typeof valor === 'string' && valor.toLowerCase().includes('josé') && valor.toLowerCase().includes('peña')) {
          encontrado = true;
          razon = `Campo "${campo}" contiene nombre "José Peña"`;
        }
      });
      
      if (encontrado) {
        console.log(`✅ Sobrecupo encontrado: ${record.id} - Razón: ${razon}`);
        console.log(`   Datos:`, fields);
      }
      
      return encontrado;
    });

    console.log(`\n📊 Sobrecupos de José Peña encontrados: ${sobrecuposJosePena.length}`);

    // También mostrar sobrecupos disponibles
    const disponibles = sobrecupos.filter(s => s.fields?.Disponible === "Si" || s.fields?.Disponible === true);
    console.log(`📊 Sobrecupos disponibles (total): ${disponibles.length}`);

    return NextResponse.json({
      success: true,
      totalSobrecupos: sobrecupos.length,
      campos: camposArray,
      ejemplosPorCampo: ejemplosPorCampo,
      sobrecuposJosePena: sobrecuposJosePena.length,
      sobrecuposDisponibles: disponibles.length,
      primeros5Sobrecupos: sobrecupos.slice(0, 5).map(s => ({
        id: s.id,
        fields: s.fields
      }))
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}