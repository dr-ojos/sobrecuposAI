import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// GET: obtener sobrecupos de un médico específico
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      console.error("❌ ID de médico no proporcionado");
      return NextResponse.json({ error: "ID de médico requerido" }, { status: 400 });
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.error("❌ Variables de entorno de Airtable no configuradas");
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    console.log(`🔍 Buscando sobrecupos para médico: ${id}`);
    
    // ✅ FÓRMULA CORREGIDA: Para campos Link to another record
    // Probamos múltiples variaciones para asegurar compatibilidad
    const filterFormula = `{Médico} = "${id}"`;
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?` +
      `filterByFormula=${encodeURIComponent(filterFormula)}&` +
      `sort[0][field]=Fecha&` +
      `sort[0][direction]=desc&` +
      `maxRecords=100`;

    console.log(`📡 Consultando Airtable con fórmula corregida: ${filterFormula}`);
    console.log(`📡 URL completa: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ Error de Airtable:", {
        status: res.status,
        statusText: res.statusText,
        error: data.error
      });
      
      // ✅ FALLBACK: Si la primera fórmula falla, intentar con FIND
      if (res.status === 422) {
        console.log("🔄 Intentando con fórmula alternativa...");
        return await tryAlternativeFormula(id);
      }
      
      return NextResponse.json(
        { error: "Error consultando la base de datos" }, 
        { status: res.status }
      );
    }
    
    const sobrecupos = data.records || [];
    
    console.log(`✅ Sobrecupos encontrados para médico ${id}: ${sobrecupos.length}`);
    
    // Registrar algunos detalles para debugging
    if (sobrecupos.length > 0) {
      console.log(`📊 Primer sobrecupo:`, {
        id: sobrecupos[0].id,
        fecha: sobrecupos[0].fields?.Fecha,
        hora: sobrecupos[0].fields?.Hora,
        disponible: sobrecupos[0].fields?.Disponible,
        medico: sobrecupos[0].fields?.Médico
      });
    } else {
      // ✅ Si no encontramos nada, intentar método alternativo
      console.log("🔄 No se encontraron resultados, intentando fórmula alternativa...");
      return await tryAlternativeFormula(id);
    }
    
    return NextResponse.json(sobrecupos);
    
  } catch (err) {
    console.error("❌ Error general obteniendo sobrecupos del médico:", {
      message: err.message,
      stack: err.stack
    });
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      }, 
      { status: 500 }
    );
  }
}

// ✅ FUNCIÓN ALTERNATIVA: Buscar con diferentes fórmulas
async function tryAlternativeFormula(doctorId) {
  try {
    console.log(`🔄 Probando fórmulas alternativas para doctor: ${doctorId}`);
    
    const formulas = [
      `FIND("${doctorId}", ARRAYJOIN({Médico})) > 0`,
      `SEARCH("${doctorId}", ARRAYJOIN({Médico})) > 0`,
      `{Médico} = "${doctorId}"`,
      `FIND("${doctorId}", {Médico}) > 0`
    ];
    
    for (let i = 0; i < formulas.length; i++) {
      const formula = formulas[i];
      console.log(`🧪 Probando fórmula ${i + 1}: ${formula}`);
      
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?` +
        `filterByFormula=${encodeURIComponent(formula)}&` +
        `sort[0][field]=Fecha&` +
        `sort[0][direction]=desc&` +
        `maxRecords=100`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        const sobrecupos = data.records || [];
        
        console.log(`✅ Fórmula ${i + 1} funcionó! Encontrados: ${sobrecupos.length}`);
        
        if (sobrecupos.length > 0) {
          return NextResponse.json(sobrecupos);
        }
      } else {
        console.log(`❌ Fórmula ${i + 1} falló:`, res.status);
      }
    }
    
    // ✅ ÚLTIMO RECURSO: Filtrar en JavaScript
    console.log(`🔄 Todas las fórmulas fallaron, filtrando en JavaScript...`);
    return await filterInJavaScript(doctorId);
    
  } catch (error) {
    console.error("❌ Error en fórmulas alternativas:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// ✅ FILTRO EN JAVASCRIPT: Como último recurso
async function filterInJavaScript(doctorId) {
  try {
    console.log(`🔄 Filtrando en JavaScript para doctor: ${doctorId}`);
    
    // Obtener TODOS los sobrecupos sin filtro
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?` +
      `sort[0][field]=Fecha&` +
      `sort[0][direction]=desc&` +
      `maxRecords=500`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    const data = await res.json();
    const allSobrecupos = data.records || [];
    
    console.log(`📊 Total sobrecupos para filtrar: ${allSobrecupos.length}`);
    
    // Filtrar en JavaScript
    const filtered = allSobrecupos.filter(sobrecupo => {
      const medicos = sobrecupo.fields?.Médico;
      
      if (Array.isArray(medicos)) {
        return medicos.includes(doctorId);
      }
      
      if (typeof medicos === 'string') {
        return medicos === doctorId;
      }
      
      return false;
    });
    
    console.log(`✅ Sobrecupos filtrados en JavaScript: ${filtered.length}`);
    
    return NextResponse.json(filtered);
    
  } catch (error) {
    console.error("❌ Error filtrando en JavaScript:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: crear nuevo sobrecupo para el médico
export async function POST(request, { params }) {
  try {
    const { id } = params; // ID del médico
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID de médico requerido" }, { status: 400 });
    }

    // Validar datos requeridos
    const { fecha, hora, clinica, direccion } = body;
    
    if (!fecha || !hora || !clinica || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: fecha, hora, clinica, direccion" }, 
        { status: 400 }
      );
    }

    console.log(`📝 Creando sobrecupo para médico ${id}:`, body);

    // Obtener información del médico para la especialidad
    const doctorRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let especialidad = "Medicina General"; // fallback
    if (doctorRes.ok) {
      const doctorData = await doctorRes.json();
      especialidad = doctorData.fields?.Especialidad || especialidad;
    }

    // Crear registro para Airtable
    const record = {
      fields: {
        Especialidad: especialidad,
        Médico: [id], // Array con ID del médico
        Clínica: clinica.trim(),
        Dirección: direccion.trim(),
        Fecha: fecha,
        Hora: hora,
        Disponible: "Si"
      }
    };

    console.log('📤 Enviando sobrecupo a Airtable:', record);

    // Crear en Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      }
    );

    const responseData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error('❌ Error de Airtable creando sobrecupo:', responseData);
      return NextResponse.json(
        { 
          error: 'Error al guardar en la base de datos',
          details: responseData.error?.message || 'Error desconocido'
        }, 
        { status: 500 }
      );
    }

    console.log('✅ Sobrecupo creado exitosamente:', responseData.id);

    return NextResponse.json({
      success: true,
      id: responseData.id,
      message: 'Sobrecupo creado correctamente',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error general creando sobrecupo:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}