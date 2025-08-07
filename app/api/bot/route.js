// app/api/bot/route.js - VERSIÓN FINAL CORREGIDA Y COMPLETA
import { NextResponse } from 'next/server';

// Estado de sesiones en memoria
const sessions = {};

// Saludos simples para detección
const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

// 🆕 FUNCIÓN PARA FILTRAR SOLO FECHAS FUTURAS
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

// 🆕 FUNCIÓN PARA FORMATEAR FECHA A DD-MM-YYYY
function formatSpanishDate(dateStr) {
  if (!dateStr) return dateStr;
  
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return dateStr; // Fallback al formato original
  }
}

// Función para detectar saludo simple
function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Si contiene síntomas o palabras médicas, NO es saludo simple
  const palabrasMedicas = [
    "dolor", "duele", "molestia", "sintoma", "síntoma", "vision", "visión", 
    "ojo", "ojos", "cabeza", "pecho", "estomago", "estómago", "fiebre", 
    "mareo", "nausea", "náusea", "cansancio", "fatiga", "tos", "gripe",
    "resfriado", "alergia", "picazon", "picazón", "roncha", "sarpullido",
    "medico", "médico", "doctor", "especialista", "consulta", "cita", "hora",
    "urgente", "emergencia", "necesito", "busco", "quiero", "tengo", "siento",
    "me duele", "me pica", "veo", "no veo", "borrosa", "borroso", "manchas",
    "flotantes", "rojo", "irritado", "lagrimeo", "ardor", "quemazón"
  ];
  
  const contieneTerminoMedico = palabrasMedicas.some(palabra => 
    limpio.includes(palabra.toLowerCase())
  );
  
  if (contieneTerminoMedico) return false;
  
  return saludosSimples.includes(limpio);
}

// Función para validar RUT chileno
function validarRUT(rut) {
  rut = rut.replace(/[.\-]/g, '').toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(rut)) return false;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
  }
  const dvCalculado = 11 - (suma % 11);
  let dvEsperado;
  if (dvCalculado === 11) dvEsperado = '0';
  else if (dvCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvCalculado.toString();
  return dv === dvEsperado;
}

// Función para detectar especialidad directa
function detectarEspecialidadDirecta(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  const especialidadesDirectas = {
    'reumatologo': 'Reumatología', 'reumatologia': 'Reumatología',
    'traumatologo': 'Traumatología', 'traumatologia': 'Traumatología',
    'oftalmologo': 'Oftalmología', 'oftalmologia': 'Oftalmología',
    'dermatologo': 'Dermatología', 'dermatologia': 'Dermatología',
    'pediatra': 'Pediatría', 'pediatria': 'Pediatría',
    'cardiologo': 'Cardiología', 'cardiologia': 'Cardiología',
    'neurologo': 'Neurología', 'neurologia': 'Neurología',
    'otorrino': 'Otorrinolaringología', 'otorrinolaringologia': 'Otorrinolaringología',
    'medicina familiar': 'Medicina Familiar', 'medico general': 'Medicina Familiar',
    'general': 'Medicina Familiar', 'familiar': 'Medicina Familiar',
    'urologo': 'Urología', 'urologia': 'Urología',
    'ginecologo': 'Ginecología', 'ginecologia': 'Ginecología',
    'psiquiatra': 'Psiquiatría', 'psiquiatria': 'Psiquiatría',
    'endocrinologo': 'Endocrinología', 'endocrinologia': 'Endocrinología'
  };
  
  for (const [key, value] of Object.entries(especialidadesDirectas)) {
    if (textoLimpio.includes(key)) return value;
  }
  return null;
}

// Función para detectar consultas no médicas
function esConsultaNoMedica(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Consultas de información general que NO son médicas
  const consultasGenerales = [
    'que hora es', 'qué hora es', 'hora es', 'que dia es', 'qué día es',
    'como estas', 'cómo estás', 'como te llamas', 'cómo te llamas',
    'quien eres', 'quién eres', 'que eres', 'qué eres',
    'donde estas', 'dónde estás', 'de donde eres', 'de dónde eres'
  ];
  
  // Si es una consulta general específica, es no médica
  for (const consulta of consultasGenerales) {
    if (textoLimpio.includes(consulta)) return true;
  }
  
  const temasCotidianos = [
    'pizza', 'comida', 'restaurant', 'comer', 'almuerzo', 'cena', 'desayuno',
    'clima', 'tiempo', 'lluvia', 'sol', 'temperatura',
    'futbol', 'deporte', 'partido', 'equipo',
    'musica', 'cancion', 'cantante', 'banda',
    'pelicula', 'serie', 'netflix', 'television',
    'trabajo', 'jefe', 'oficina', 'reunion',
    'universidad', 'colegio', 'estudiar', 'examen',
    'viaje', 'vacaciones', 'hotel', 'avion',
    'dinero', 'plata', 'banco', 'credito',
    'amor', 'pareja', 'novia', 'novio', 'esposa', 'esposo',
    'auto', 'carro', 'vehiculo', 'manejar',
    'casa', 'departamento', 'arriendo', 'mudanza',
    'computador', 'celular', 'telefono', 'internet',
    'ropa', 'zapatos', 'comprar', 'tienda'
  ];
  
  // Si contiene algún tema cotidiano y NO contiene términos médicos específicos
  const contieneTemasCotidianos = temasCotidianos.some(tema => textoLimpio.includes(tema));
  
  // Términos médicos específicos (removiendo "hora" para evitar conflictos)
  const terminosMedicos = [
    'dolor', 'duele', 'molestia', 'sintoma', 'síntoma', 'vision', 'visión', 
    'ojo', 'ojos', 'cabeza', 'pecho', 'estomago', 'estómago', 'fiebre', 
    'mareo', 'nausea', 'náusea', 'cansancio', 'fatiga', 'tos', 'gripe',
    'resfriado', 'alergia', 'picazon', 'picazón', 'roncha', 'sarpullido',
    'medico', 'médico', 'doctor', 'especialista', 'consulta', 'cita',
    'urgente', 'emergencia', 'salud', 'enfermo', 'enferma', 'malestar',
    'sobrecupo', 'atencion medica', 'atención médica'
  ];
  
  const contieneTerminosMedicos = terminosMedicos.some(termino => 
    textoLimpio.includes(termino.toLowerCase())
  );
  
  return contieneTemasCotidianos && !contieneTerminosMedicos;
}

// 🔥 FUNCIÓN MEJORADA: Detectar especialidad por síntomas - CON FIX PARA OFTALMOLOGÍA
function detectarEspecialidadPorSintomas(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // 🔍 SÍNTOMAS OFTALMOLÓGICOS - EXPANDIDOS Y MEJORADOS
  const sintomasOftalmologia = [
    // Visión y problemas visuales
    'vision borrosa', 'visión borrosa', 'borrosa', 'borroso', 'veo borroso',
    'no veo bien', 'veo mal', 'veo doble', 'vision doble', 'visión doble',
    'manchas flotantes', 'moscas volantes', 'puntos negros', 'manchas en la vista',
    
    // Síntomas oculares específicos  
    'ojo rojo', 'ojos rojos', 'irritado', 'irritados', 'ojos irritados',
    'ardor en los ojos', 'quemazón ojos', 'lagrimeo', 'lagrimean', 'ojo llora',
    'dolor de ojos', 'duelen los ojos', 'ojo duele', 'me duele el ojo',
    
    // Síntomas relacionados con luz
    'sensible a la luz', 'fotofobia', 'molesta la luz', 'me molesta la luz',
    
    // Palabras clave oftalmológicas
    'graduacion', 'graduación', 'lentes', 'anteojos', 'gafas', 'control',
    'revision ojos', 'revisión ojos', 'examen vista', 'control vista',
    
    // 🆕 NUEVOS SÍNTOMAS ESPECÍFICOS - INCLUYE "PICAN" - FIX CRÍTICO
    'me pican los ojos', 'ojos pican', 'picazon ojos', 'picazón ojos',
    'comezon ojos', 'comezón ojos', 'pica el ojo', 'pican', 'picor ojos',
    'ojos secos', 'sequedad ocular', 'ojo seco',
    'inflamacion ojo', 'inflamación ojo', 'hinchazon ojo', 'hinchazón ojo',
    'conjuntivitis', 'orzuelo', 'chalazion', 'chalación'
  ];
  
  // Síntomas dermatológicos
  const sintomasDermatologia = [
    'picazon piel', 'picazón piel', 'me pica la piel', 'comezón piel',
    'sarpullido', 'roncha', 'ronchas', 'eruption', 'erupcion',
    'alergia piel', 'dermatitis', 'eczema',
    'lunar', 'lunares', 'mancha piel', 'manchas piel',
    'acne', 'acné', 'espinillas', 'granos'
  ];
  
  // Síntomas cardiológicos
  const sintomasCardiologia = [
    'dolor pecho', 'duele pecho', 'opresion pecho', 'opresión pecho',
    'palpitaciones', 'taquicardia', 'corazon late rapido', 'corazón late rápido',
    'falta aire', 'sin aire', 'agitacion', 'agitación', 'cansancio extremo'
  ];
  
  // Síntomas neurológicos
  const sintomasNeurologia = [
    'dolor cabeza', 'dolor de cabeza', 'cefalea', 'migrana', 'migraña',
    'mareo', 'vertigo', 'vértigo', 'desmayo',
    'hormigueo', 'entumecimiento', 'adormecimiento',
    'perdida memoria', 'pérdida memoria', 'olvidos', 'confusion', 'confusión'
  ];
  
  // Síntomas pediátricos
  const sintomasPediatria = [
    'niño', 'niña', 'bebe', 'bebé', 'hijo', 'hija',
    'mi hijo', 'mi hija', 'mi bebe', 'mi bebé',
    'menor', 'pequeño', 'pequeña', 'infante'
  ];
  
  // 🔥 EVALUAR SÍNTOMAS EN ORDEN DE PRIORIDAD - OFTALMOLOGÍA PRIMERO
  if (sintomasOftalmologia.some(s => textoLimpio.includes(s))) {
    console.log('🔍 Síntomas oftalmológicos detectados:', textoLimpio);
    return 'Oftalmología';
  }
  if (sintomasDermatologia.some(s => textoLimpio.includes(s))) return 'Dermatología';
  if (sintomasCardiologia.some(s => textoLimpio.includes(s))) return 'Cardiología';
  if (sintomasNeurologia.some(s => textoLimpio.includes(s))) return 'Neurología';
  if (sintomasPediatria.some(s => textoLimpio.includes(s))) return 'Pediatría';
  
  return null;
}

// Función para obtener especialidades disponibles
async function getEspecialidadesDisponibles() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

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
    const records = data.records || [];
    
    const especialidades = [...new Set(
      records
        .filter(r => r.fields?.Especialidad && (r.fields?.Disponible === "Si" || r.fields?.Disponible === true))
        .map(r => r.fields.Especialidad)
    )];

    return especialidades;
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    return [];
  }
}

// Función para obtener nombre del doctor
async function getDoctorName(doctorId) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return doctorId; // Fallback al ID si no se puede obtener el nombre
    }

    const data = await response.json();
    return data.fields?.Name || doctorId;
  } catch (error) {
    console.error(`Error obteniendo nombre del médico ${doctorId}:`, error);
    return doctorId; // Fallback al ID en caso de error
  }
}

// Función para obtener médicos que atienden la edad del paciente
async function getMedicosQueAtienden(especialidad, edad) {
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

    if (!response.ok) return [];

    const data = await response.json();
    const medicos = data.records || [];
    
    // Filtrar médicos por especialidad y capacidad de atender la edad
    const medicosCompatibles = medicos.filter(medico => {
      const fields = medico.fields || {};
      
      // Verificar especialidad
      if (fields.Especialidad !== especialidad) return false;
      
      // Verificar si puede atender la edad del paciente
      const atiende = fields.Atiende;
      if (!atiende) return true; // Si no está especificado, asumimos que atiende a todos
      
      if (atiende === "Ambos") return true;
      if (atiende === "Niños" && edad <= 17) return true;
      if (atiende === "Adultos" && edad >= 18) return true;
      
      return false;
    });

    console.log(`👨‍⚕️ Médicos compatibles para ${especialidad} (${edad} años): ${medicosCompatibles.length}`);
    return medicosCompatibles;
  } catch (error) {
    console.error('Error obteniendo médicos compatibles:', error);
    return [];
  }
}

// Función para obtener información completa del doctor
async function getDoctorInfo(doctorId) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return { name: doctorId, email: null };
    }

    const data = await response.json();
    return {
      name: data.fields?.Name || doctorId,
      email: data.fields?.Email || null
    };
  } catch (error) {
    console.error(`Error obteniendo info del médico ${doctorId}:`, error);
    return { name: doctorId, email: null };
  }
}

// Handler principal POST
export async function POST(req) {
  try {
    const { message, session: currentSession } = await req.json();
    
    if (!message) {
      return NextResponse.json({ text: "No se recibió mensaje" }, { status: 400 });
    }

    // Variables de entorno
    const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_ID,
      AIRTABLE_DOCTORS_TABLE,
      OPENAI_API_KEY,
      SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL
    } = process.env;

    const text = message.trim();
    const from = currentSession?.from || "user";

    console.log(`📱 Mensaje recibido: "${text}"`);

    // Respuestas a consultas no médicas con OpenAI para mayor humanidad
    if (esConsultaNoMedica(text)) {
      // Si tenemos OpenAI, generar respuesta inteligente y humana
      if (OPENAI_API_KEY) {
        try {
          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.8,
              max_tokens: 120,
              messages: [
                {
                  role: "system",
                  content: `Eres Sobrecupos IA, un asistente médico chileno muy humano y empático. El usuario te escribió algo que no es médico: "${text}". 

Responde de forma:
1. HUMANA y con humor sutil si es apropiado
2. Reconoce lo que dijeron de forma natural 
3. Redirige suavemente hacia temas de salud
4. Pregunta si tienen algún problema de salud o síntoma
5. Máximo 3 líneas
6. Usa emojis apropiados pero sin exceso
7. Sé conversacional, no robótico

Ejemplos:
- Si mencionan pizza: "¡Mmm, pizza! 🍕 Espero que sea una pizza saludable 😄 Hablando de salud, ¿hay algo que te moleste físicamente o necesitas ver algún especialista?"
- Si mencionan música: "¡La música es genial para el alma! 🎵 Y hablando de bienestar, ¿cómo has estado de salud? ¿Algún síntoma o consulta médica que tengas pendiente?"
- Si mencionan trabajo: "El trabajo puede ser estresante a veces 😅 ¿Has sentido que el estrés te está afectando físicamente? ¿Tienes algún síntoma o necesitas ver algún médico?"`
                },
                { role: "user", content: text }
              ]
            })
          });

          const aiJson = await aiRes.json();
          const respuestaIA = aiJson.choices?.[0]?.message?.content?.trim();
          
          if (respuestaIA) {
            return NextResponse.json({ text: respuestaIA });
          }
        } catch (err) {
          console.error("❌ Error OpenAI para consulta no médica:", err);
        }
      }
      
      // Fallback: respuestas más humanas predefinidas
      const respuestasNoMedicas = [
        "¡Jaja! Me especializo más en temas de salud que en eso 😄\n\nPero hablando de bienestar, ¿cómo has estado? ¿Tienes algún síntoma o necesitas ver algún especialista?",
        "Entiendo, pero soy más experto en conectarte con médicos 👨‍⚕️\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte hoy?",
        "Me encantaría ayudarte con eso, pero mi especialidad es la salud 🩺\n\n¿Tienes algún malestar o consulta médica pendiente?"
      ];
      
      const respuestaAleatoria = respuestasNoMedicas[Math.floor(Math.random() * respuestasNoMedicas.length)];
      return NextResponse.json({ text: respuestaAleatoria });
    }

    // 🔥 MANEJO DE SESIONES EXISTENTES
    if (currentSession?.stage) {
      const { stage, specialty, records, attempts = 0, patientName, patientRut, patientPhone, patientEmail, respuestaEmpatica } = currentSession;

      switch (stage) {
        case 'getting-age-for-filtering':
          const edadIngresada = parseInt(text);
          if (isNaN(edadIngresada) || edadIngresada < 1 || edadIngresada > 120) {
            return NextResponse.json({
              text: "Por favor ingresa una edad válida (número entre 1 y 120)."
            });
          }

          console.log(`🎯 Manteniendo especialidad original: ${specialty} para edad ${edadIngresada}`);

          // Buscar médicos compatibles con la edad
          const medicosCompatibles = await getMedicosQueAtienden(specialty, edadIngresada);
          
          if (medicosCompatibles.length === 0) {
            return NextResponse.json({
              text: `${respuestaEmpatica}\n\nLamentablemente no encontré médicos de ${specialty} que atiendan pacientes de ${edadIngresada} años en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
            });
          }

          // Obtener IDs de médicos compatibles
          const medicosIds = medicosCompatibles.map(m => m.id);

          // Buscar sobrecupos disponibles de estos médicos
          let sobrecuposRecords = [];
          try {
            const resp = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            const data = await resp.json();
            sobrecuposRecords = data.records || [];
          } catch (err) {
            console.error("❌ Error consultando Airtable:", err);
            return NextResponse.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
          }

          // Filtrar por médicos compatibles y especialidad
          const availableFiltered = sobrecuposRecords.filter(r => {
            const fields = r.fields || {};
            const medicoField = fields["Médico"];
            
            const medicoId = Array.isArray(medicoField) ? medicoField[0] : medicoField;
            
            return (
              (fields.Especialidad === specialty) &&
              (fields.Disponible === "Si" || fields.Disponible === true) &&
              medicosIds.includes(medicoId)
            );
          });

          // Filtrar solo fechas futuras
          const available = filterFutureDates(availableFiltered);
          console.log(`📅 Sobrecupos futuros encontrados: ${available.length} de ${availableFiltered.length} totales`);

          if (available.length === 0) {
            return NextResponse.json({
              text: `${respuestaEmpatica}\n\nEncontré médicos de ${specialty} que atienden pacientes de ${edadIngresada} años, pero no tienen sobrecupos disponibles para fechas futuras.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
            });
          }

          // Ordenar por fecha más próxima
          available.sort((a, b) => {
            const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
            const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
            return dateA - dateB;
          });

          const first = available[0].fields;
          const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
          const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
          const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
          const medicoNombre = await getDoctorName(medicoId);

          // Formatear fecha en formato español
          const fechaFormateada = formatSpanishDate(first.Fecha);

          sessions[from] = {
            stage: 'awaiting-confirmation',
            specialty: specialty,
            records: available,
            attempts: 0,
            patientAge: edadIngresada,
            respuestaEmpatica: respuestaEmpatica
          };

          return NextResponse.json({
            text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty} para pacientes de ${edadIngresada} años:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${fechaFormateada} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
            session: sessions[from]
          });

        case 'awaiting-confirmation':
          if (text.toLowerCase().includes('si') || text.toLowerCase().includes('sí') || text.toLowerCase().includes('ok')) {
            sessions[from] = { 
              ...currentSession, 
              stage: 'getting-name' 
            };
            return NextResponse.json({
              text: "¡Excelente! 🎉\n\nPara confirmar tu cita necesito algunos datos.\n\nPrimero, ¿cuál es tu nombre completo?",
              session: sessions[from]
            });
          }
          
          if (text.toLowerCase().includes('no')) {
            const nextAttempt = attempts + 1;
            const availableRecords = records || [];
            
            const futureRecords = filterFutureDates(availableRecords);
            
            if (nextAttempt < futureRecords.length) {
              const nextRecord = futureRecords[nextAttempt].fields;
              const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
              const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
              const medicoId = Array.isArray(nextRecord["Médico"]) ? 
                nextRecord["Médico"][0] : nextRecord["Médico"];
              const medicoNombre = await getDoctorName(medicoId);
              
              const fechaFormateada = formatSpanishDate(nextRecord.Fecha);
              
              sessions[from] = { 
                ...currentSession, 
                attempts: nextAttempt,
                records: futureRecords
              };
              
              return NextResponse.json({
                text: `Te muestro otra opción de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${fechaFormateada} a las ${nextRecord.Hora}\n\n¿Te sirve esta? Confirma con "sí".`,
                session: sessions[from]
              });
            } else {
              delete sessions[from];
              return NextResponse.json({
                text: `Lo siento, esas eran todas las opciones futuras de ${specialty} disponibles.\n\n¿Te gustaría que te contacte cuando tengamos nuevos sobrecupos disponibles?`
              });
            }
          }
          
          return NextResponse.json({
            text: "No entendí tu respuesta. ¿Te sirve esta cita? Responde \"sí\" para confirmar o \"no\" para ver otras opciones."
          });

        case 'getting-name':
          if (text.length < 2) {
            return NextResponse.json({
              text: "Por favor ingresa tu nombre completo para continuar."
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-rut',
            patientName: text 
          };
          return NextResponse.json({
            text: `Gracias ${text}! 👤\n\nAhora necesito tu RUT (con guión y dígito verificador).\nEjemplo: 12.345.678-9`,
            session: sessions[from]
          });

        case 'getting-rut':
          if (!validarRUT(text)) {
            return NextResponse.json({
              text: "El RUT no es válido. Por favor ingresa tu RUT completo con el formato correcto.\nEjemplo: 12.345.678-9"
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-phone',
            patientRut: text 
          };
          return NextResponse.json({
            text: "Perfecto! 📋\n\nAhora tu número de teléfono (incluye +56 si es de Chile).\nEjemplo: +56912345678",
            session: sessions[from]
          });

        case 'getting-phone':
          if (text.length < 8) {
            return NextResponse.json({
              text: "Por favor ingresa un número de teléfono válido.\nEjemplo: +56912345678"
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-email',
            patientPhone: text 
          };
          return NextResponse.json({
            text: "Excelente! 📞\n\nFinalmente, tu email para enviarte la confirmación:",
            session: sessions[from]
          });

        case 'getting-email':
          if (!text.includes('@') || !text.includes('.')) {
            return NextResponse.json({
              text: "Por favor ingresa un email válido.\nEjemplo: nombre@email.com"
            });
          }

          // 🔥 VERIFICACIÓN ROBUSTA DE DATOS DE SESIÓN
          const { patientAge, patientName, patientRut, patientPhone, records, specialty } = currentSession;
          
          console.log("🔍 === DEBUG SESIÓN ===");
          console.log("📋 Datos de sesión disponibles:", {
            patientAge: !!patientAge,
            patientName: !!patientName, 
            patientRut: !!patientRut,
            patientPhone: !!patientPhone,
            records: !!records,
            recordsLength: records?.length || 0,
            specialty: !!specialty
          });

          // 🔥 VALIDACIÓN CRÍTICA: Verificar que tenemos todos los datos
          if (!patientAge || !patientName || !patientRut || !patientPhone || !records || !records[0]) {
            console.error("❌ DATOS DE SESIÓN INCOMPLETOS:", {
              patientAge: !!patientAge,
              patientName: !!patientName, 
              patientRut: !!patientRut,
              patientPhone: !!patientPhone,
              records: !!records,
              recordsLength: records?.length || 0
            });
            
            delete sessions[from];
            return NextResponse.json({
              text: "Lo siento, se perdieron algunos datos durante el proceso. Por favor, comienza nuevamente escribiendo 'hola'."
            });
          }

          const sobrecupoData = records[0]?.fields;
          const sobrecupoId = records[0]?.id;
          
          if (!sobrecupoData || !sobrecupoId) {
            console.error("❌ DATOS DE SOBRECUPO INCOMPLETOS:", {
              sobrecupoData: !!sobrecupoData,
              sobrecupoId: !!sobrecupoId,
              recordsStructure: records[0]
            });
            
            delete sessions[from];
            return NextResponse.json({
              text: "Error con los datos del sobrecupo. Por favor, intenta nuevamente."
            });
          }

          console.log("✅ Datos validados correctamente - Procediendo con confirmación");
          console.log("📋 ID del sobrecupo:", sobrecupoId);
          
          // Verificar variables de entorno críticas
          if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
            console.error("❌ Variables de entorno críticas faltantes:", {
              AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
              AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
              AIRTABLE_TABLE_ID: !!AIRTABLE_TABLE_ID
            });
            return NextResponse.json({
              text: "Error de configuración del servidor. Por favor, contacta soporte."
            });
          }

          let statusText = "";
          let sobrecupoUpdated = false;
          let pacienteCreated = false;
          let emailSent = false;

          try {
            // 1. CREAR PACIENTE EN TABLA PACIENTES (SI EXISTE)
            let pacienteId = null;
            if (process.env.AIRTABLE_PATIENTS_TABLE) {
              try {
                console.log("👤 Creando paciente en tabla Pacientes...");
                
                const pacienteData = {
                  fields: {
                    Nombre: patientName,
                    RUT: patientRut,
                    Telefono: patientPhone,
                    Email: text,
                    Edad: patientAge,
                    "Fecha Registro": new Date().toISOString().split('T')[0]
                  }
                };
                
                console.log("📤 Datos del paciente:", pacienteData);
                
                const pacienteResponse = await fetch(
                  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PATIENTS_TABLE}`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(pacienteData),
                  }
                );

                if (pacienteResponse.ok) {
                  const pacienteResult = await pacienteResponse.json();
                  pacienteId = pacienteResult.id;
                  pacienteCreated = true;
                  console.log("✅ Paciente creado exitosamente:", pacienteId);
                } else {
                  const errorData = await pacienteResponse.json();
                  console.error("⚠️ Error creando paciente:", errorData);
                  
                  console.error("📋 Detalles del error paciente:", {
                    status: pacienteResponse.status,
                    message: errorData.error?.message || 'Error desconocido',
                    type: errorData.error?.type || 'N/A',
                    fieldsEnviados: Object.keys(pacienteData.fields)
                  });
                }
              } catch (pacienteErr) {
                console.error("⚠️ Error de conexión creando paciente:", pacienteErr);
              }
            } else {
              console.log("⚠️ AIRTABLE_PATIENTS_TABLE no configurado, saltando creación de paciente");
            }

            // 2. ACTUALIZAR SOBRECUPO (CRÍTICO) - SIN CAMPO PACIENTE
            console.log("📅 Actualizando sobrecupo...");
            console.log("🎯 Sobrecupo ID:", sobrecupoId);
            
            const updateData = {
              fields: {
                Disponible: "No",
                RUT: patientRut,
                Edad: patientAge,
                Nombre: patientName,
                Telefono: patientPhone,
                Email: text
                // 🔥 REMOVIDO: Campo "Paciente" no existe en tabla Sobrecupos
              }
            };

            console.log("📤 Datos de actualización sobrecupo:", updateData);

            const updateResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
              }
            );

            console.log("📡 Respuesta actualización sobrecupo:", updateResponse.status);

            if (updateResponse.ok) {
              sobrecupoUpdated = true;
              console.log("✅ Sobrecupo actualizado exitosamente");
            } else {
              const errorData = await updateResponse.json();
              console.error("❌ Error actualizando sobrecupo:", errorData);
              
              console.error("🚨 Detalles del error sobrecupo:", {
                status: updateResponse.status,
                message: errorData.error?.message || 'Error desconocido',
                type: errorData.error?.type || 'N/A',
                recordId: sobrecupoId,
                fieldsEnviados: Object.keys(updateData.fields),
                updateData: updateData
              });
              
              throw new Error(`Error actualizando sobrecupo: ${updateResponse.status} - ${errorData.error?.message}`);
            }

            // 3. ENVIAR EMAIL DE CONFIRMACIÓN (SI ESTÁ CONFIGURADO)
            if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && sobrecupoUpdated) {
              try {
                console.log("📧 Enviando email de confirmación...");
                
                const fechaFormateada = formatSpanishDate(sobrecupoData.Fecha);
                const emailContent = `¡Hola ${patientName}!

Tu cita médica ha sido confirmada exitosamente.

📅 DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${fechaFormateada}
• Hora: ${sobrecupoData.Hora}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}
• Dirección: ${sobrecupoData["Dirección"] || sobrecupoData["Direccion"]}

👤 TUS DATOS:
• Nombre: ${patientName}
• RUT: ${patientRut}
• Teléfono: ${patientPhone}

📝 RECOMENDACIONES:
• Llega 15 minutos antes de tu cita
• Trae tu cédula de identidad
• Si tienes seguros médicos, trae la credencial

¡Nos vemos pronto!

Saludos,
Equipo Sobrecupos AI`;

                const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${SENDGRID_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    personalizations: [{
                      to: [{ email: text, name: patientName }],
                      subject: `🩺 Cita confirmada: ${specialty} - ${fechaFormateada}`
                    }],
                    from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                    content: [{ type: "text/plain", value: emailContent }]
                  })
                });

                if (emailResponse.ok) {
                  emailSent = true;
                  console.log("✅ Email enviado exitosamente");
                } else {
                  console.log("⚠️ Error enviando email (no crítico)");
                }
              } catch (emailErr) {
                console.error("⚠️ Error enviando email (no crítico):", emailErr);
              }
            }

          } catch (error) {
            console.error("❌ Error en proceso de confirmación:", error);
            
            let errorMessage = "Lo siento, hubo un error procesando tu reserva.";
            
            if (error.message.includes('404')) {
              errorMessage = "Error: No se pudo encontrar el registro. Por favor intenta nuevamente.";
            } else if (error.message.includes('422')) {
              errorMessage = "Error: Datos inválidos. Verifica la información e intenta nuevamente.";
            } else if (error.message.includes('403')) {
              errorMessage = "Error: Sin permisos para actualizar. Contacta soporte.";
            }
            
            delete sessions[from];
            
            return NextResponse.json({
              text: `${errorMessage}\n\nDetalles técnicos: ${error.message}\n\nPor favor intenta nuevamente escribiendo 'hola'.`
            });
          }

          // Limpiar sesión
          delete sessions[from];

          // MENSAJE FINAL DE CONFIRMACIÓN
          if (sobrecupoUpdated) {
            const fechaFormateadaFinal = formatSpanishDate(sobrecupoData.Fecha);
            statusText = `🎉 ¡CITA CONFIRMADA! 

📋 RESUMEN:
• ${specialty}
• ${fechaFormateadaFinal} a las ${sobrecupoData.Hora}
• ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}

${emailSent ? "📧 Te hemos enviado la confirmación por email." : ""}
${pacienteCreated ? "👤 Registro de paciente creado." : ""}

💡 Llega 15 minutos antes. ¡Nos vemos pronto!`;
          } else {
            statusText = `⚠️ Tu cita está siendo procesada.

📋 DATOS REGISTRADOS:
• Nombre: ${patientName}
• Especialidad: ${specialty} 
• Email: ${text}

Te contactaremos pronto para confirmar los detalles finales.`;
          }

          console.log("🏥 ======================");
          console.log("🏥 PROCESO COMPLETADO");
          console.log("🏥 Paciente creado:", pacienteCreated);
          console.log("🏥 Sobrecupo actualizado:", sobrecupoUpdated);
          console.log("🏥 Email enviado:", emailSent);
          console.log("🏥 Status final:", sobrecupoUpdated ? 'ÉXITO' : 'ERROR');
          console.log("🏥 ======================");

          return NextResponse.json({ text: statusText });

        default:
          break;
      }
    }

    // Saludo simple - respuesta inicial
    if (esSaludoSimple(text)) {
      return NextResponse.json({
        text: "¡Hola! 😊 Soy Sobrecupos IA, tu asistente médico personal.\n\n¿En qué te puedo ayudar? Cuéntame tus síntomas, el médico o especialidad que buscas y te ayudo a encontrar una hora disponible."
      });
    }

    // 🔥 DETECTAR ESPECIALIDAD DIRECTA PRIMERO
    const especialidadDirecta = detectarEspecialidadDirecta(text);
    
    if (especialidadDirecta) {
      const especialidadesDisponibles = await getEspecialidadesDisponibles();
      
      if (!especialidadesDisponibles.includes(especialidadDirecta)) {
        return NextResponse.json({
          text: `Entiendo que estás buscando atención especializada.\n\nLamentablemente no tengo sobrecupos de ${especialidadDirecta} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n¿Te gustaría que te contacte cuando tengamos ${especialidadDirecta} disponible?`
        });
      }
      
      const specialty = especialidadDirecta;
      
      let respuestaEmpatica = "";
      if (OPENAI_API_KEY) {
        try {
          const empatRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.7,
              max_tokens: 40,
              messages: [
                {
                  role: "system",
                  content: "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al usuario que busca una especialidad específica. No menciones 'Sobrecupos IA' ni uses comillas."
                },
                { role: "user", content: `Usuario busca: "${specialty}"` }
              ]
            })
          });
          const empatJson = await empatRes.json();
          respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
        } catch (err) {
          respuestaEmpatica = "Entiendo que necesitas atención especializada.";
        }
      }

      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty,
        respuestaEmpatica,
        attempts: 0
      };

      return NextResponse.json({
        text: `${respuestaEmpatica}\n\nPara encontrar el médico más adecuado para ti, ¿me podrías decir tu edad?\nEjemplo: 25`,
        session: sessions[from]
      });
    }

    // 🔥 DETECTAR SÍNTOMAS Y MAPEAR A ESPECIALIDADES
    const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
    
    if (especialidadPorSintomas) {
      const specialty = especialidadPorSintomas;
      console.log(`🎯 Especialidad detectada por síntomas: ${specialty}`);
      
      let respuestaEmpatica = "Entiendo tu preocupación.";
      if (OPENAI_API_KEY) {
        try {
          const empatRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.7,
              max_tokens: 50,
              messages: [
                {
                  role: "system",
                  content: "Eres Sobrecupos IA, asistente médico chileno empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al paciente que describe síntomas. Sé humano y cercano."
                },
                { role: "user", content: `Paciente dice: "${text}"` }
              ]
            })
          });
          const empatJson = await empatRes.json();
          respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "Entiendo tu preocupación.";
        } catch (err) {
          console.error("❌ Error OpenAI empático:", err);
        }
      }

      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty,
        respuestaEmpatica,
        attempts: 0
      };

      return NextResponse.json({
        text: `${respuestaEmpatica}\n\nPor lo que me describes, sería bueno que veas a un especialista en ${specialty}.\n\nPara encontrar el médico más adecuado, ¿me podrías decir tu edad?\nEjemplo: 25`,
        session: sessions[from]
      });
    }

    // Si llega aquí, usar OpenAI como respaldo
    if (OPENAI_API_KEY) {
      const especialidadesDisponibles = await getEspecialidadesDisponibles();
      const especialidadesString = especialidadesDisponibles.join(", ");

      let rawEsp = "";
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            max_tokens: 20,
            messages: [
              {
                role: "system",
                content: `Eres Sobrecupos IA, asistente médico empático. Dado un síntoma o consulta médica, responde SOLO con EXACTAMENTE una de las siguientes especialidades disponibles (y nada más): ${especialidadesString}. Elige la especialidad que con mayor probabilidad se encarga de ese síntoma. Si mencionan un niño, elige Pediatría. Si no puedes determinar una especialidad específica, elige Medicina Familiar.`
              },
              { role: "user", content: `Paciente: "${text}"` }
            ]
          })
        });
        const j = await aiRes.json();
        rawEsp = j.choices?.[0]?.message?.content?.trim() || "";
      } catch (err) {
        console.error("❌ Error OpenAI:", err);
        return NextResponse.json({ text: "Lo siento, no entendí. ¿Puedes describirlo de otra forma?" });
      }

      const specialty = especialidadesDisponibles.includes(rawEsp) ? rawEsp : "Medicina Familiar";

      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty,
        respuestaEmpatica: "Por lo que me describes, sería recomendable que veas a un especialista.",
        attempts: 0
      };

      return NextResponse.json({
        text: `Por lo que me describes, sería recomendable que veas a un especialista en ${specialty}.\n\nPara encontrar el médico más adecuado, ¿me podrías decir tu edad?\nEjemplo: 25`,
        session: sessions[from]
      });
    }

    // Si no hay OpenAI, respuesta por defecto
    return NextResponse.json({
      text: "Para ayudarte mejor, ¿podrías contarme qué tipo de especialista necesitas o qué síntomas tienes?\n\nPor ejemplo:\n• \"Necesito un oftalmólogo\"\n• \"Tengo dolor de cabeza\"\n• \"Me duele el pecho\""
    });

  } catch (error) {
    console.error('❌ Error en bot route:', error);
    return NextResponse.json(
      { text: "Lo siento, hubo un error interno. Por favor, intenta nuevamente." },
      { status: 500 }
    );
  }
}
