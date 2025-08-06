// app/api/bot/route.js - VERSIÓN COMPLETA CORREGIDA: Sin fechas pasadas + formato DD-MM-YYYY
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
    'graduacion', 'graduación', 'lentes', 'anteojos', 'gafas',
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
      AIRTABLE_PATIENTS_TABLE,
      OPENAI_API_KEY,
      SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL
    } = process.env;

    const text = message.trim();
    const from = currentSession?.from || "user";

    console.log(`📱 Mensaje recibido: "${text}"`);

    // Respuestas a consultas no médicas
    if (esConsultaNoMedica(text)) {
      const respuestasNoMedicas = [
        "Soy Sobrecupos IA, tu asistente médico especializado. Estoy aquí para ayudarte a encontrar sobrecupos médicos disponibles. 😊\n\n¿Tienes algún síntoma o necesitas ver algún especialista?",
        "Actualmente me especializo en ayudarte con temas de salud y sobrecupos médicos. 🩺\n\n¿En qué puedo ayudarte con tu salud hoy?",
        "Estoy aquí para conectarte con médicos y especialistas disponibles. 👨‍⚕️\n\n¿Qué tipo de consulta médica necesitas?"
      ];
      
      const respuestaAleatoria = respuestasNoMedicas[Math.floor(Math.random() * respuestasNoMedicas.length)];
      return NextResponse.json({ text: respuestaAleatoria });
    }

    // 🔥 MANEJO DE SESIONES EXISTENTES - LÓGICA CORREGIDA PARA CONSERVAR ESPECIALIDAD
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

          // 🔥 CRÍTICO: MANTENER LA ESPECIALIDAD ORIGINAL DE LA SESIÓN
          console.log(`🎯 Manteniendo especialidad original: ${specialty} para edad ${edadIngresada}`);

          // Buscar médicos compatibles con la edad PARA LA ESPECIALIDAD CORRECTA
          const medicosCompatibles = await getMedicosQueAtienden(specialty, edadIngresada);
          
          if (medicosCompatibles.length === 0) {
            return NextResponse.json({
              text: `${respuestaEmpatica}\n\nLamentablemente no encontré médicos de ${specialty} que atiendan pacientes de ${edadIngresada} años en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
            });
          }

          // Obtener IDs de médicos compatibles
          const medicosIds = medicosCompatibles.map(m => m.id);

          // Buscar sobrecupos disponibles de estos médicos
          let records = [];
          try {
            const resp = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            const data = await resp.json();
            records = data.records || [];
          } catch (err) {
            console.error("❌ Error consultando Airtable:", err);
            return NextResponse.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
          }

          // 🔥 FILTRAR POR MÉDICOS COMPATIBLES Y ESPECIALIDAD
          const availableFiltered = records.filter(r => {
            const fields = r.fields || {};
            const medicoField = fields["Médico"];
            
            // Obtener ID del médico del sobrecupo
            const medicoId = Array.isArray(medicoField) ? medicoField[0] : medicoField;
            
            return (
              (fields.Especialidad === specialty) && // 🔥 USA LA ESPECIALIDAD ORIGINAL
              (fields.Disponible === "Si" || fields.Disponible === true) &&
              medicosIds.includes(medicoId)
            );
          });

          // 🆕 FILTRAR SOLO FECHAS FUTURAS
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

          // 🆕 FORMATEAR FECHA EN FORMATO ESPAÑOL
          const fechaFormateada = formatSpanishDate(first.Fecha);

          // 🔥 MANTENER LA ESPECIALIDAD ORIGINAL EN LA NUEVA SESIÓN
          sessions[from] = {
            stage: 'awaiting-confirmation',
            specialty: specialty, // 🎯 ESPECIALIDAD ORIGINAL CONSERVADA
            records: available,
            attempts: 0,
            patientAge: edadIngresada,
            respuestaEmpatica: respuestaEmpatica // También conservar respuesta empática
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
            
            // 🆕 FILTRAR REGISTROS FUTUROS ANTES DE MOSTRAR ALTERNATIVAS
            const futureRecords = filterFutureDates(availableRecords);
            
            if (nextAttempt < futureRecords.length) {
              const nextRecord = futureRecords[nextAttempt].fields;
              const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
              const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
              const medicoId = Array.isArray(nextRecord["Médico"]) ? 
                nextRecord["Médico"][0] : nextRecord["Médico"];
              const medicoNombre = await getDoctorName(medicoId);
              
              // 🆕 FORMATEAR FECHA EN FORMATO ESPAÑOL
              const fechaFormateada = formatSpanishDate(nextRecord.Fecha);
              
              sessions[from] = { 
                ...currentSession, 
                attempts: nextAttempt,
                records: futureRecords // Actualizar con registros filtrados
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

          // PROCESO DE CONFIRMACIÓN FINAL CON MEJOR LOGGING
          const { patientAge, patientName, patientRut, patientPhone } = currentSession;
          const sobrecupoData = records[0]?.fields;
          
          // Verificar que tenemos todos los datos necesarios
          if (!patientAge || !patientName || !patientRut || !patientPhone) {
            console.error("❌ Datos faltantes en sesión:", {
              patientAge: !!patientAge,
              patientName: !!patientName, 
              patientRut: !!patientRut,
              patientPhone: !!patientPhone
            });
            return NextResponse.json({
              text: "Hubo un error con los datos. Por favor, reinicia el proceso escribiendo 'hola'."
            });
          }

          // Verificar variables de entorno críticas
          if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_PATIENTS_TABLE) {
            console.error("❌ Variables de entorno faltantes:", {
              AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
              AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
              AIRTABLE_PATIENTS_TABLE: !!AIRTABLE_PATIENTS_TABLE
            });
            return NextResponse.json({
              text: "Error de configuración del servidor. Por favor, contacta soporte."
            });
          }

          let statusText = "";
          let sobrecupoUpdated = false;
          let updateError = null;
          const emailsSent = { patient: false, doctor: false };

          console.log("🏥 ======================");
          console.log("🏥 INICIANDO CONFIRMACIÓN");
          console.log("🏥 Paciente:", patientName);
          console.log("🏥 Edad:", patientAge);
          console.log("🏥 RUT:", patientRut);
          console.log("🏥 Teléfono:", patientPhone);
          console.log("🏥 Email:", text);
          console.log("🏥 Especialidad:", specialty);
          console.log("🏥 AIRTABLE_PATIENTS_TABLE:", AIRTABLE_PATIENTS_TABLE);
          console.log("🏥 ======================");

          // 1. Crear paciente en Airtable
          let pacienteId = null;
          try {
            console.log("👤 Creando paciente...");
            
            const pacienteData = {
              fields: {
                Nombre: patientName,
                RUT: patientRut,
                Telefono: patientPhone,
                Email: text,
                Edad: patientAge
              }
            };
            
            console.log("📤 Datos del paciente a enviar:", pacienteData);
            
            const pacienteResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(pacienteData),
              }
            );

            console.log("📡 Respuesta Airtable status:", pacienteResponse.status);

            if (pacienteResponse.ok) {
              const pacienteResult = await pacienteResponse.json();
              pacienteId = pacienteResult.id;
              console.log("✅ Paciente creado exitosamente:", pacienteId);
            } else {
              const errorText = await pacienteResponse.text();
              console.error("❌ Error creando paciente:");
              console.error("   Status:", pacienteResponse.status);
              console.error("   Response:", errorText);
              
              // Intentar parsear el error
              try {
                const errorJson = JSON.parse(errorText);
                console.error("   Error JSON:", errorJson);
              } catch (e) {
                console.error("   Error raw:", errorText);
              }
            }
          } catch (err) {
            console.error("❌ Error de conexión creando paciente:", err.message);
            console.error("   Stack:", err.stack);
          }

          // 2. Actualizar sobrecupo
          try {
            console.log("📅 Actualizando sobrecupo...");
            const updateData = {
              fields: {
                Disponible: false,
                RUT: patientRut,
                Edad: patientAge
              }
            };

            // Solo agregar Paciente si se creó exitosamente
            if (pacienteId) {
              updateData.fields.Paciente = [pacienteId];
              console.log("🔗 Vinculando paciente al sobrecupo:", pacienteId);
            } else {
              console.log("⚠️ No se pudo crear paciente, actualizando solo sobrecupo");
            }

            console.log("📤 Datos de actualización:", updateData);

            const updateResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${records[0].id}`,
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
              const errorData = await updateResponse.text();
              updateError = errorData;
              console.error("❌ Error actualizando sobrecupo:");
              console.error("   Status:", updateResponse.status);
              console.error("   Response:", errorData);
            }
          } catch (err) {
            updateError = err.message;
            console.error("❌ Error de conexión actualizando sobrecupo:", err.message);
            console.error("   Stack:", err.stack);
          }

          // 3. Enviar email al paciente
          if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
            try {
              const fechaFormateadaEmail = formatSpanishDate(sobrecupoData.Fecha);
              const emailContent = `
¡Hola ${patientName}!

Tu cita médica ha sido confirmada exitosamente.

📅 DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${fechaFormateadaEmail}
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
Equipo Sobrecupos AI
              `;

              const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SENDGRID_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  personalizations: [{
                    to: [{ email: text, name: patientName }],
                    subject: `🩺 Cita confirmada: ${specialty} - ${fechaFormateadaEmail}`
                  }],
                  from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                  content: [{ type: "text/plain", value: emailContent }]
                })
              });

              if (emailResponse.ok) {
                emailsSent.patient = true;
                console.log("✅ Email enviado al paciente");
              }
            } catch (emailErr) {
              console.error("❌ Error enviando email al paciente:", emailErr);
            }
          }

          // 4. Enviar email al médico
          if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
            try {
              const medicoId = Array.isArray(sobrecupoData["Médico"]) ? 
                sobrecupoData["Médico"][0] : sobrecupoData["Médico"];
              const doctorInfo = await getDoctorInfo(medicoId);
              
              if (doctorInfo.email) {
                const fechaFormateadaEmail = formatSpanishDate(sobrecupoData.Fecha);
                const doctorEmailContent = `
Dr/a. ${doctorInfo.name},

Se ha registrado un nuevo paciente para su sobrecupo:

📅 DETALLES DE LA CITA:
• Fecha: ${fechaFormateadaEmail}
• Hora: ${sobrecupoData.Hora}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}

👤 DATOS DEL PACIENTE:
• Nombre: ${patientName}
• RUT: ${patientRut}
• Teléfono: ${patientPhone}
• Email: ${text}

El paciente ha sido notificado.

Saludos,
Sistema Sobrecupos AI
                `;

                const doctorEmailResp = await fetch("https://api.sendgrid.com/v3/mail/send", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${SENDGRID_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    personalizations: [{
                      to: [{ email: doctorInfo.email, name: doctorInfo.name }],
                      subject: `🩺 Nuevo paciente: ${patientName} - ${fechaFormateadaEmail}`
                    }],
                    from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                    content: [{ type: "text/plain", value: doctorEmailContent }]
                  })
                });

                if (doctorEmailResp.ok) {
                  emailsSent.doctor = true;
                  console.log("✅ Email enviado al médico");
                }
              }
            } catch (emailErr) {
              console.error("❌ Error enviando email al médico:", emailErr);
            }
          }

          // Limpiar sesión
          delete sessions[from];

          // Mensaje final con mejor lógica
          if (sobrecupoUpdated) {
            const fechaFormateadaFinal = formatSpanishDate(sobrecupoData.Fecha);
            statusText = `🎉 ¡CITA CONFIRMADA! 

📋 RESUMEN:
• ${specialty}
• ${fechaFormateadaFinal} a las ${sobrecupoData.Hora}
• ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}

${emailsSent.patient ? "📧 Te hemos enviado la confirmación por email." : "⚠️ No pudimos enviar el email de confirmación."}

💡 Llega 15 minutos antes. ¡Nos vemos pronto!`;
          } else {
            const fechaFormateadaFinal = formatSpanishDate(sobrecupoData.Fecha);
            statusText = `⚠️ Tu cita está siendo procesada.

📋 DATOS REGISTRADOS:
• Nombre: ${patientName}
• Especialidad: ${specialty} 
• Fecha solicitada: ${fechaFormateadaFinal} a las ${sobrecupoData.Hora}

Te contactaremos pronto para confirmar los detalles finales.

${updateError ? `Error técnico: ${updateError.substring(0, 100)}...` : ''}`;
            console.error("❌ Error final actualización sobrecupo:", updateError);
          }

          console.log("🏥 ======================");
          console.log("🏥 PROCESO COMPLETADO");
          console.log("🏥 Paciente creado:", !!pacienteId);
          console.log("🏥 Sobrecupo actualizado:", sobrecupoUpdated);
          console.log("🏥 Email paciente:", emailsSent.patient);
          console.log("🏥 Email médico:", emailsSent.doctor);
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

    // 🔥 DETECTAR ESPECIALIDAD DIRECTA PRIMERO (ej: "necesito oftalmólogo")
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

      // 🔥 CONSERVAR LA ESPECIALIDAD DETECTADA EN LA SESIÓN
      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty, // 🎯 ESPECIALIDAD ORIGINAL GUARDADA
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
      
      // Generar respuesta empática usando OpenAI
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

      // 🔥 CONSERVAR LA ESPECIALIDAD DETECTADA POR SÍNTOMAS EN LA SESIÓN
      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty, // 🎯 ESPECIALIDAD POR SÍNTOMAS GUARDADA
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

      // 🔥 CONSERVAR LA ESPECIALIDAD DETECTADA POR OPENAI EN LA SESIÓN
      sessions[from] = {
        stage: 'getting-age-for-filtering',
        specialty: specialty, // 🎯 ESPECIALIDAD OPENAI GUARDADA
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