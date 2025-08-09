// app/api/test-busqueda-ubicacion/route.js
import { NextResponse } from 'next/server';

// Mapa de comunas de Santiago con sinónimos y variantes
const comunasSantiago = {
  'providencia': ['providencia', 'provi', 'manuel montt', 'los leones'],
  'las condes': ['las condes', 'lascondes', 'el bosque norte', 'apoquindo', 'kennedy'],
  'vitacura': ['vitacura', 'bicentenario', 'nueva costanera'],
  'ñuñoa': ['ñuñoa', 'nunoa', 'irarrazaval', 'grecia'],
  'santiago centro': ['santiago', 'centro', 'plaza de armas', 'moneda', 'alameda'],
  'san miguel': ['san miguel', 'gran avenida'],
  'la florida': ['la florida', 'vicuña mackenna sur'],
  'maipú': ['maipu', 'maipú', 'pajaritos'],
  'puente alto': ['puente alto', 'concha y toro'],
  'recoleta': ['recoleta', 'independencia norte'],
  'estación central': ['estacion central', 'estación central', 'alameda poniente'],
  'quilicura': ['quilicura', 'américo vespucio norte'],
  'la reina': ['la reina', 'larrain'],
  'macul': ['macul', 'departamental'],
  'peñalolén': ['peñalolen', 'penalolen', 'tobalaba'],
  'huechuraba': ['huechuraba', 'recoleta norte'],
  'independencia': ['independencia', 'salomón corbalán'],
  'conchalí': ['conchali', 'conchalí', 'vivaceta'],
  'renca': ['renca', 'dorsal'],
  'quinta normal': ['quinta normal', 'matucana'],
  'cerro navia': ['cerro navia', 'san pablo'],
  'lo prado': ['lo prado', 'san pablo poniente'],
  'pudahuel': ['pudahuel', 'aeropuerto'],
  'cerrillos': ['cerrillos', 'pedro aguirre cerda sur'],
  'maipú': ['maipu', 'pajaritos', 'tres poniente'],
  'pedro aguirre cerda': ['pedro aguirre cerda', 'pac', 'club hípico'],
  'lo espejo': ['lo espejo', 'santa rosa sur'],
  'san joaquín': ['san joaquin', 'san joaquín', 'santa rosa'],
  'la cisterna': ['la cisterna', 'gran avenida sur'],
  'el bosque': ['el bosque', 'santa rosa sur'],
  'la granja': ['la granja', 'américo vespucio sur'],
  'san ramón': ['san ramon', 'san ramón', 'santa rosa sur'],
  'la pintana': ['la pintana', 'observatorio'],
  'san bernardo': ['san bernardo', 'eyzaguirre']
};

// Función para detectar comuna en el texto
function detectarComuna(text) {
  const textoLimpio = text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .trim();

  console.log(`🔍 Buscando comuna en: "${textoLimpio}"`);

  for (const [comuna, variantes] of Object.entries(comunasSantiago)) {
    for (const variante of variantes) {
      if (textoLimpio.includes(variante)) {
        console.log(`✅ Comuna detectada: ${comuna} (variante: ${variante})`);
        return {
          comuna: comuna,
          varianteDetectada: variante
        };
      }
    }
  }

  console.log(`❌ No se detectó comuna en el texto`);
  return null;
}

// Función para filtrar fechas futuras
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
      return false;
    }
  });
}

// Función para obtener datos del médico
async function getDoctorDetails(medicoIds) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

    if (!medicoIds || medicoIds.length === 0) return null;
    
    const medicoId = medicoIds[0]; // Tomar el primer médico del array

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id,
      name: data.fields?.Name,
      especialidad: data.fields?.Especialidad,
      atiende: data.fields?.Atiende, // "Adultos", "Niños", "Ambos"
      seguros: data.fields?.Seguros || []
    };
  } catch (error) {
    console.error('Error obteniendo datos del médico:', error);
    return null;
  }
}

// Función para buscar por especialidad y ubicación
async function buscarPorEspecialidadYUbicacion(especialidad, comuna) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log(`🔍 Buscando: ${especialidad} en ${comuna}`);

    // Obtener todos los sobrecupos disponibles
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const allRecords = data.records || [];

    console.log(`📊 Total registros: ${allRecords.length}`);

    // Filtrar por especialidad, disponibilidad y ubicación
    const filteredRecords = allRecords.filter(record => {
      const fields = record.fields || {};
      
      // Filtros básicos
      const esEspecialidad = fields.Especialidad?.toLowerCase().includes(especialidad.toLowerCase());
      const estaDisponible = fields.Disponible === "Si";
      
      if (!esEspecialidad || !estaDisponible) return false;
      
      // Filtro por ubicación (dirección o clínica)
      const direccion = (fields.Dirección || '').toLowerCase();
      const clinica = (fields.Clínica || '').toLowerCase();
      const textoUbicacion = `${direccion} ${clinica}`;
      
      // Buscar la comuna o variantes en dirección/clínica
      const variantes = comunasSantiago[comuna.toLowerCase()] || [];
      const ubicacionCoincide = variantes.some(variante => 
        textoUbicacion.includes(variante.toLowerCase())
      );
      
      if (ubicacionCoincide) {
        console.log(`✅ Sobrecupo encontrado: ${record.id} - ${fields.Fecha} ${fields.Hora} - ${fields.Clínica}`);
        return true;
      }
      
      return false;
    });

    console.log(`📊 Sobrecupos filtrados: ${filteredRecords.length}`);

    // Filtrar fechas futuras
    const futureRecords = filterFutureDates(filteredRecords);
    console.log(`📊 Sobrecupos futuros: ${futureRecords.length}`);

    // Enriquecer con datos del médico
    const enrichedRecords = await Promise.all(
      futureRecords.map(async (record) => {
        const medicoData = await getDoctorDetails(record.fields?.Médico);
        return {
          ...record,
          doctorData: medicoData
        };
      })
    );

    return enrichedRecords;
  } catch (error) {
    console.error('❌ Error buscando por especialidad y ubicación:', error);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const consulta = searchParams.get('q') || "hay algún sobrecupo con oftalmólogo en providencia";
    
    console.log(`🔍 Testeando consulta: "${consulta}"`);

    // 1. Detectar especialidad
    const especialidades = {
      'oftalmologo': 'Oftalmología',
      'oftalmologia': 'Oftalmología', 
      'dermatologo': 'Dermatología',
      'cardiologo': 'Cardiología',
      'pediatra': 'Pediatría',
      'neurologo': 'Neurología'
    };

    let especialidadDetectada = null;
    const consultaLimpia = consulta.toLowerCase();
    
    for (const [key, value] of Object.entries(especialidades)) {
      if (consultaLimpia.includes(key)) {
        especialidadDetectada = value;
        break;
      }
    }

    console.log(`🎯 Especialidad detectada: ${especialidadDetectada}`);

    // 2. Detectar comuna
    const comunaDetectada = detectarComuna(consulta);
    
    if (!especialidadDetectada || !comunaDetectada) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo detectar especialidad y/o comuna',
        especialidadDetectada,
        comunaDetectada
      });
    }

    // 3. Buscar sobrecupos
    const sobrecupos = await buscarPorEspecialidadYUbicacion(especialidadDetectada, comunaDetectada.comuna);

    // 4. Generar respuesta del bot
    let respuestaBot;
    let opcionesAdicionales = [];
    
    if (sobrecupos.length > 0) {
      const primer = sobrecupos[0];
      const fecha = primer.fields?.Fecha;
      const hora = primer.fields?.Hora;
      const clinica = primer.fields?.Clínica;
      const direccion = primer.fields?.Dirección;
      const doctor = primer.doctorData;
      
      // Formatear información del médico
      let doctorInfo = "";
      if (doctor) {
        doctorInfo = `👨‍⚕️ **${doctor.name}**\n`;
        
        // Agregar información de qué pacientes atiende
        if (doctor.atiende) {
          let atencionText = "";
          switch (doctor.atiende) {
            case "Adultos":
              atencionText = "👨‍🦱 Atiende: Solo adultos";
              break;
            case "Niños":
              atencionText = "🧒 Atiende: Solo niños";
              break;
            case "Ambos":
              atencionText = "👨‍🦱🧒 Atiende: Adultos y niños";
              break;
            default:
              atencionText = `👥 Atiende: ${doctor.atiende}`;
          }
          doctorInfo += `${atencionText}\n`;
        }
        
        // Agregar seguros si están disponibles
        if (doctor.seguros && doctor.seguros.length > 0) {
          doctorInfo += `💳 Seguros: ${doctor.seguros.join(", ")}\n`;
        }
        
        doctorInfo += "\n";
      }
      
      // Preparar opciones adicionales (hasta 3 opciones)
      const siguientesOpciones = sobrecupos.slice(1, 4); // Tomar las siguientes 2-3 opciones
      opcionesAdicionales = siguientesOpciones.map((sobrecupo, index) => {
        const doctorAlt = sobrecupo.doctorData;
        let doctorName = doctorAlt?.name || 'Médico no especificado';
        let atencion = '';
        
        if (doctorAlt?.atiende) {
          switch (doctorAlt.atiende) {
            case "Adultos":
              atencion = " (Solo adultos)";
              break;
            case "Niños":
              atencion = " (Solo niños)";
              break;
            case "Ambos":
              atencion = " (Adultos y niños)";
              break;
          }
        }
        
        return {
          numero: index + 2, // Empezar desde 2 porque 1 es la primera opción
          texto: `**Opción ${index + 2}:** Dr/a. ${doctorName}${atencion} - ${sobrecupo.fields?.Fecha} a las ${sobrecupo.fields?.Hora} en ${sobrecupo.fields?.Clínica}`
        };
      });
      
      respuestaBot = `Sí, tengo sobrecupos de ${especialidadDetectada} en ${comunaDetectada.comuna.charAt(0).toUpperCase() + comunaDetectada.comuna.slice(1)}:\n\n${doctorInfo}📅 **${fecha} a las ${hora}**\n📍 ${clinica}\n🗺️ ${direccion}\n\n¿Te interesa reservar esta cita? Responde **"sí"** para continuar, o **"otras"** para ver más alternativas.`;
    } else {
      respuestaBot = `No encontré sobrecupos de ${especialidadDetectada} disponibles en ${comunaDetectada.comuna.charAt(0).toUpperCase() + comunaDetectada.comuna.slice(1)} en este momento.\n\n¿Te gustaría que busque en comunas cercanas o en otra especialidad?`;
    }

    return NextResponse.json({
      success: true,
      consulta: consulta,
      especialidadDetectada,
      comunaDetectada,
      sobrecuposEncontrados: sobrecupos.length,
      sobrecupos: sobrecupos.map(s => ({
        id: s.id,
        fecha: s.fields?.Fecha,
        hora: s.fields?.Hora,
        clinica: s.fields?.Clínica,
        direccion: s.fields?.Dirección,
        medico: {
          id: s.doctorData?.id,
          name: s.doctorData?.name,
          atiende: s.doctorData?.atiende,
          seguros: s.doctorData?.seguros
        }
      })),
      respuestaBot,
      opcionesAdicionales,
      // Respuesta cuando piden "otras" alternativas
      respuestaBotOtras: opcionesAdicionales.length > 0 ? 
        `Aquí tienes más alternativas de ${especialidadDetectada} en ${comunaDetectada.comuna.charAt(0).toUpperCase() + comunaDetectada.comuna.slice(1)}:\n\n${opcionesAdicionales.map(op => op.texto).join('\n\n')}\n\n¿Qué número de opción te interesa? Responde con el **número** de tu preferencia.` 
        : `Esta es la única opción disponible de ${especialidadDetectada} en ${comunaDetectada.comuna.charAt(0).toUpperCase() + comunaDetectada.comuna.slice(1)} en este momento.\n\n¿Te gustaría que busque en comunas cercanas o en otra especialidad?`
    });

  } catch (error) {
    console.error('❌ Error en test de búsqueda por ubicación:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}