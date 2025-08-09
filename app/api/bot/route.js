// app/api/bot/route.js - VERSIÓN FINAL CORREGIDA Y COMPLETA
import { NextResponse } from 'next/server';
import whatsAppService from '../../../lib/whatsapp-service';

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

// 🆕 FUNCIONES DE VALIDACIÓN INTELIGENTE

// Detectar si el usuario confunde RUT con teléfono
function esFormatoTelefono(text) {
  const cleaned = text.replace(/[^\d+]/g, '');
  return (cleaned.startsWith('+56') && cleaned.length >= 11) || 
         (cleaned.startsWith('56') && cleaned.length >= 10) ||
         (cleaned.startsWith('9') && cleaned.length === 9) ||
         (cleaned.length === 8 && /^\d+$/.test(cleaned));
}

// Detectar si el usuario confunde teléfono con RUT  
function esFormatoRUT(text) {
  const cleaned = text.replace(/[.\-\s]/g, '').toUpperCase();
  return /^\d{7,8}[0-9K]$/.test(cleaned) && !esFormatoTelefono(text);
}

// Validar teléfono chileno más inteligentemente
function validarTelefono(telefono) {
  const cleaned = telefono.replace(/[^\d+]/g, '');
  
  // Formatos válidos:
  // +56912345678 (con +56)
  // 56912345678 (sin +)
  // 912345678 (solo celular)
  // 12345678 (teléfono fijo)
  
  if (cleaned.startsWith('+56')) {
    return cleaned.length >= 11 && cleaned.length <= 12;
  }
  if (cleaned.startsWith('56')) {
    return cleaned.length >= 10 && cleaned.length <= 11;
  }
  if (cleaned.startsWith('9')) {
    return cleaned.length === 9;
  }
  if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
    return true; // Teléfono fijo
  }
  
  return false;
}

// Validar email más estricto
function validarEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Validar edad
function validarEdad(edad) {
  const num = parseInt(edad);
  return !isNaN(num) && num >= 0 && num <= 120;
}

// Detectar confusiones entre campos y dar feedback específico
function analizarConfusion(text, campoEsperado) {
  const mensajes = {
    rut: {
      esEmail: "Veo que ingresaste un email 📧. Necesito tu RUT primero.\n\nPor favor ingresa tu RUT con el formato: 12.345.678-9",
      esTelefono: "Parece un número de teléfono 📱. Necesito tu RUT primero.\n\nPor favor ingresa tu RUT con el formato: 12.345.678-9", 
      general: "El RUT debe tener el formato: 12.345.678-9\n\nPor favor ingresa tu RUT completo con guión y dígito verificador."
    },
    telefono: {
      esRUT: "Veo que ingresaste un RUT 🆔. Ya tengo tu RUT, ahora necesito tu teléfono.\n\nIngresa tu número de teléfono: +56912345678",
      esEmail: "Parece un email 📧. Necesito tu teléfono primero.\n\nIngresa tu número con formato: +56912345678",
      general: "Por favor ingresa un teléfono válido.\n\nEjemplos: +56912345678 o 912345678"
    },
    email: {
      esRUT: "Veo que ingresaste un RUT 🆔. Ya tengo tus datos, ahora necesito tu email.\n\nIngresa tu email: nombre@email.com",
      esTelefono: "Parece un teléfono 📱. Ya tengo tu teléfono, ahora necesito tu email.\n\nIngresa tu email: nombre@email.com",
      general: "Por favor ingresa un email válido.\n\nEjemplo: nombre@email.com"
    },
    edad: {
      general: "Por favor ingresa solo tu edad en números.\n\nEjemplo: 25"
    }
  };

  if (campoEsperado === 'rut') {
    if (text.includes('@')) return mensajes.rut.esEmail;
    if (esFormatoTelefono(text)) return mensajes.rut.esTelefono;
    return mensajes.rut.general;
  }
  
  if (campoEsperado === 'telefono') {
    if (esFormatoRUT(text)) return mensajes.telefono.esRUT;
    if (text.includes('@')) return mensajes.telefono.esEmail;
    return mensajes.telefono.general;
  }
  
  if (campoEsperado === 'email') {
    if (esFormatoRUT(text)) return mensajes.email.esRUT;
    if (esFormatoTelefono(text)) return mensajes.email.esTelefono;
    return mensajes.email.general;
  }
  
  if (campoEsperado === 'edad') {
    return mensajes.edad.general;
  }
  
  return null;
}

// 🆕 FUNCIÓN PARA DETECTAR MÉDICO ESPECÍFICO POR NOMBRE
function detectarMedicoEspecifico(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Patrones que indican búsqueda de médico específico
  const patronesMedico = [
    /\b(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\b(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bhora\s+con\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bhora\s+con\s+(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bnecesito\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bquiero\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
    /\bbusco\s+(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i
  ];
  
  for (const patron of patronesMedico) {
    const match = text.match(patron);
    if (match && match[1]) {
      const nombreMedico = match[1].trim();
      console.log(`🔍 Médico específico detectado: "${nombreMedico}"`);
      return nombreMedico;
    }
  }
  
  return null;
}

// Función para buscar médico por nombre en Airtable
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
    
    // Buscar coincidencia exacta o parcial
    const medicoEncontrado = doctors.find(doctor => {
      const nombreDoctor = (doctor.fields?.Name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      
      // Coincidencia exacta
      if (nombreDoctor === nombreLimpio) return true;
      
      // Coincidencia por apellido o nombre
      const partesNombreBuscado = nombreLimpio.split(' ');
      const partesNombreDoctor = nombreDoctor.split(' ');
      
      return partesNombreBuscado.some(parte => 
        partesNombreDoctor.some(parteDoctor => 
          parte.length > 2 && parteDoctor.includes(parte)
        )
      );
    });

    if (medicoEncontrado) {
      console.log(`✅ Médico encontrado: ${medicoEncontrado.fields?.Name}`);
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

// Función para buscar sobrecupos del médico específico
async function buscarSobrecuposDeMedico(medicoId) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    console.log(`🔍 DEBUG: Buscando sobrecupos para médico ID: ${medicoId}`);

    // Primero, hacer consulta sin filtro para debug
    const debugResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=10`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      const sampleRecord = debugData.records?.[0];
      if (sampleRecord) {
        console.log(`🔍 DEBUG: Estructura de sobrecupo ejemplo:`, Object.keys(sampleRecord.fields || {}));
        console.log(`🔍 DEBUG: Campo Doctor en ejemplo:`, sampleRecord.fields?.Doctor);
        console.log(`🔍 DEBUG: Campo Medico en ejemplo:`, sampleRecord.fields?.Medico);
      }
    }

    // Probar diferentes filtros posibles
    const filtrosPosibles = [
      `AND(Disponible="Si",Doctor="${medicoId}")`,
      `AND(Disponible="Si",Medico="${medicoId}")`,
      `AND({Disponible}="Si",{Doctor}="${medicoId}")`,
      `AND({Disponible}="Si",{Medico}="${medicoId}")`,
      `AND(Disponible=TRUE(),Doctor="${medicoId}")`,
      `AND(Disponible=TRUE(),Medico="${medicoId}")`
    ];

    let sobrecuposEncontrados = [];
    
    for (const filtro of filtrosPosibles) {
      try {
        console.log(`🔍 DEBUG: Probando filtro: ${filtro}`);
        
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100&filterByFormula=${encodeURIComponent(filtro)}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const sobrecupos = data.records || [];
          
          console.log(`🔍 DEBUG: Filtro "${filtro}" encontró ${sobrecupos.length} sobrecupos`);
          
          if (sobrecupos.length > 0) {
            // Filtrar solo fechas futuras
            sobrecuposEncontrados = filterFutureDates(sobrecupos);
            console.log(`✅ DEBUG: Después de filtrar fechas futuras: ${sobrecuposEncontrados.length} sobrecupos`);
            break; // Usar el primer filtro que funcione
          }
        } else {
          console.log(`❌ DEBUG: Filtro "${filtro}" falló con status: ${response.status}`);
        }
      } catch (filterError) {
        console.log(`❌ DEBUG: Error con filtro "${filtro}":`, filterError.message);
      }
    }

    return sobrecuposEncontrados;
  } catch (error) {
    console.error('Error buscando sobrecupos del médico:', error);
    return [];
  }
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
    // Comida y bebidas
    'pizza', 'hamburguesa', 'sandwich', 'empanada', 'asado', 'completo', 'sopaipilla',
    'comida', 'restaurant', 'comer', 'almuerzo', 'cena', 'desayuno', 'once',
    'cafe', 'te', 'jugo', 'bebida', 'cerveza', 'vino', 'pisco',
    // Clima y tiempo
    'clima', 'tiempo', 'lluvia', 'sol', 'temperatura', 'frio', 'calor', 'nieve',
    // Deportes y entretenimiento
    'futbol', 'deporte', 'partido', 'equipo', 'gimnasio', 'ejercicio',
    'musica', 'cancion', 'cantante', 'banda', 'concierto',
    'pelicula', 'serie', 'netflix', 'television', 'youtube',
    // Trabajo y estudios
    'trabajo', 'jefe', 'oficina', 'reunion', 'sueldo', 'pega',
    'universidad', 'colegio', 'estudiar', 'examen', 'clase',
    // Viajes y lugares
    'viaje', 'vacaciones', 'hotel', 'avion', 'playa', 'campo', 'ciudad',
    // Dinero y compras
    'dinero', 'plata', 'banco', 'credito', 'comprar', 'tienda', 'mall',
    // Relaciones
    'amor', 'pareja', 'novia', 'novio', 'esposa', 'esposo', 'familia',
    // Transporte y tecnología
    'auto', 'carro', 'vehiculo', 'manejar', 'micro', 'metro', 'uber', 'taxi', 'bus', 'colectivo',
    'computador', 'celular', 'telefono', 'internet', 'whatsapp', 'instagram', 'tiktok',
    // Vivienda y otros
    'casa', 'departamento', 'arriendo', 'mudanza', 'ropa', 'zapatos'
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
    'sobrecupo', 'atencion medica', 'atención médica',
    // 🆕 Términos oftalmológicos específicos
    'lentes', 'anteojos', 'gafas', 'control', 'revision', 'revisión',
    'examen vista', 'control vista', 'manchas flotantes', 'pican ojos'
  ];
  
  const contieneTerminosMedicos = terminosMedicos.some(termino => 
    textoLimpio.includes(termino.toLowerCase())
  );
  
  return contieneTemasCotidianos && !contieneTerminosMedicos;
}

// 🔥 FUNCIÓN MEJORADA: Detectar especialidad por síntomas - CON FIX PARA OFTALMOLOGÍA
function detectarEspecialidadPorSintomas(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // 🔍 SÍNTOMAS OFTALMOLÓGICOS - EXPANDIDOS Y MEJORADOS + FRASES DIRECTAS
  const sintomasOftalmologia = [
    // Visión y problemas visuales
    'vision borrosa', 'visión borrosa', 'borrosa', 'borroso', 'veo borroso',
    'no veo bien', 'veo mal', 'veo doble', 'vision doble', 'visión doble',
    'manchas flotantes', 'moscas volantes', 'puntos negros', 'manchas en la vista',
    
    // 🆕 FRASES DIRECTAS DE LAS TARJETAS DE EJEMPLO - FIX CRÍTICO
    'veo manchas flotantes', 'necesito control de lentes', 'control de lentes',
    'me pican los ojos', 'tengo el ojo irritado', 'ojo irritado',
    'revision de lentes', 'revisión de lentes', 'examen de vista',
    'control vista', 'control de vista', 'control ocular',
    
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
    'ojos pican', 'picazon ojos', 'picazón ojos',
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
  const sintomaDetectado = sintomasOftalmologia.find(s => textoLimpio.includes(s));
  if (sintomaDetectado) {
    console.log('🔍 Síntomas oftalmológicos detectados:', sintomaDetectado, '- Texto original:', textoLimpio);
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
      return { name: doctorId, email: null, whatsapp: null };
    }

    const data = await response.json();
    return {
      name: data.fields?.Name || doctorId,
      email: data.fields?.Email || null,
      whatsapp: data.fields?.WhatsApp || data.fields?.Whatsapp || data.fields?.Telefono || null
    };
  } catch (error) {
    console.error(`Error obteniendo info del médico ${doctorId}:`, error);
    return { name: doctorId, email: null, whatsapp: null };
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

    // 🔥 PRIMERO: Detectar si es consulta médica específica
    const especialidadDetectada = detectarEspecialidadPorSintomas(text);
    if (especialidadDetectada) {
      console.log(`🎯 Especialidad detectada directamente: ${especialidadDetectada} para texto: "${text}"`);
      // Saltamos toda la lógica de consulta no médica y vamos directo al procesamiento médico
      // Esto significa que ejecutaremos el código que está en la línea ~1275
      // No hacemos nada aquí, solo evitamos que se ejecute esConsultaNoMedica
    } else if (esConsultaNoMedica(text)) {
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
        case 'confirming-appointment':
          // 🆕 CONFIRMAR SI LE SIRVE LA CITA PROPUESTA
          const respuesta = text.toLowerCase().trim();
          
          if (respuesta.includes('sí') || respuesta.includes('si') || respuesta === 's' || respuesta === 'yes' || respuesta === 'ok' || respuesta === 'vale') {
            // Confirmar cita y preguntar nombre completo primero
            sessions[from] = {
              ...currentSession,
              stage: 'getting-name-for-confirmed-appointment'
            };
            
            return NextResponse.json({
              text: "¡Excelente! Para completar tu reserva, necesito tus datos.\n\nPor favor dime tu **nombre completo**:",
              session: sessions[from]
            });
          } 
          else if (respuesta.includes('no') || respuesta === 'n') {
            // Ofrecer otras opciones
            const { records, selectedRecord } = currentSession;
            const otrasOpciones = records.filter(r => r !== selectedRecord).slice(0, 2);
            
            if (otrasOpciones.length > 0) {
              let mensaje = "Entiendo. Te muestro otras opciones disponibles:\n\n";
              
              otrasOpciones.forEach((record, index) => {
                const fecha = new Date(record.fields.Fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                });
                mensaje += `${index + 1}. 📅 ${fecha} a las ${record.fields.Hora}\n📍 ${record.fields["Clínica"] || record.fields["Clinica"]}\n\n`;
              });
              
              mensaje += "¿Alguna de estas opciones te sirve mejor? Responde con el número (1 o 2) o escribe 'no' si ninguna te conviene.";
              
              sessions[from] = {
                ...currentSession,
                stage: 'choosing-alternative',
                alternativeOptions: otrasOpciones
              };
              
              return NextResponse.json({
                text: mensaje,
                session: sessions[from]
              });
            } else {
              return NextResponse.json({
                text: "Entiendo. Lamentablemente no tengo más opciones disponibles en este momento.\n\n¿Te gustaría que te ayude con algún otro síntoma o consulta?"
              });
            }
          } 
          else {
            return NextResponse.json({
              text: "No entendí tu respuesta. ¿Te sirve la cita que te propuse?\n\nResponde **Sí** para confirmar o **No** si prefieres otra opción."
            });
          }

        case 'choosing-alternative':
          // 🆕 ELEGIR ENTRE OPCIONES ALTERNATIVAS
          const opcionText = text.toLowerCase().trim();
          const { alternativeOptions } = currentSession;
          
          if (opcionText === '1' && alternativeOptions[0]) {
            const selectedAlt = alternativeOptions[0];
            const doctorId = Array.isArray(selectedAlt.fields["Médico"]) ? 
              selectedAlt.fields["Médico"][0] : selectedAlt.fields["Médico"];
            
            const doctorInfo = await getDoctorInfo(doctorId);
            
            sessions[from] = {
              ...currentSession,
              selectedRecord: selectedAlt,
              doctorInfo: doctorInfo,
              stage: 'getting-name-for-confirmed-appointment'
            };
            
            return NextResponse.json({
              text: "¡Excelente elección! Para completar tu reserva, necesito tus datos.\n\nPor favor dime tu **nombre completo**:",
              session: sessions[from]
            });
          } 
          else if (opcionText === '2' && alternativeOptions[1]) {
            const selectedAlt = alternativeOptions[1];
            const doctorId = Array.isArray(selectedAlt.fields["Médico"]) ? 
              selectedAlt.fields["Médico"][0] : selectedAlt.fields["Médico"];
            
            const doctorInfo = await getDoctorInfo(doctorId);
            
            sessions[from] = {
              ...currentSession,
              selectedRecord: selectedAlt,
              doctorInfo: doctorInfo,
              stage: 'getting-name-for-confirmed-appointment'
            };
            
            return NextResponse.json({
              text: "¡Excelente elección! Para completar tu reserva, necesito tus datos.\n\nPor favor dime tu **nombre completo**:",
              session: sessions[from]
            });
          }
          else if (opcionText.includes('no') || opcionText === 'n') {
            return NextResponse.json({
              text: "Entiendo. Lamentablemente no tengo más opciones disponibles en este momento.\n\n¿Te gustaría que te ayude con algún otro síntoma o consulta?"
            });
          }
          else {
            return NextResponse.json({
              text: "Por favor responde con el número de la opción que prefieres (1 o 2) o escribe 'no' si ninguna te conviene."
            });
          }

        case 'getting-name-for-confirmed-appointment':
          // 🆕 OBTENER NOMBRE COMPLETO DESPUÉS DE CONFIRMAR LA CITA
          const nombreCompleto = text.trim();
          
          if (nombreCompleto.length < 2) {
            return NextResponse.json({
              text: "Por favor ingresa tu nombre completo."
            });
          }

          // Extraer primer nombre para saludo personalizado
          const primerNombre = nombreCompleto.split(' ')[0];
          
          // Guardar nombre y pasar a solicitar edad
          sessions[from] = {
            ...currentSession,
            patientName: nombreCompleto,
            stage: 'getting-age-for-confirmed-appointment'
          };

          return NextResponse.json({
            text: `¡Perfecto, ${primerNombre}! Ahora necesito conocer tu edad para completar la reserva.\n\nPor favor dime tu edad:\nEjemplo: 25`,
            session: sessions[from]
          });

        case 'getting-age-for-confirmed-appointment':
          // 🆕 VALIDAR EDAD DESPUÉS DE CONFIRMAR LA CITA
          if (!validarEdad(text)) {
            const mensajeError = analizarConfusion(text, 'edad');
            currentSession.attempts = (currentSession.attempts || 0) + 1;
            
            // Si ya intentó 3 veces, ofrecer ayuda adicional
            const ayudaAdicional = currentSession.attempts >= 3 ? 
              "\n\n💡 *Solo necesito tu edad en números:*\n• Si tienes 25 años, escribe: 25\n• Si tienes 3 años, escribe: 3\n• Solo números del 1 al 120" : "";
            
            sessions[from] = { ...currentSession };
            return NextResponse.json({
              text: mensajeError + ayudaAdicional
            });
          }
          
          const edadConfirmada = parseInt(text);

          // Validar si el médico atiende pacientes de esa edad
          const { doctorInfo, selectedRecord } = currentSession;
          const atiende = doctorInfo.atiende || "Ambos";
          
          let edadCompatible = true;
          let mensajeEdad = "";
          
          if (atiende === "Niños" && edadConfirmada >= 18) {
            edadCompatible = false;
            mensajeEdad = "Este médico se especializa en pediatría (menores de 18 años).";
          } else if (atiende === "Adultos" && edadConfirmada < 18) {
            edadCompatible = false;
            mensajeEdad = "Este médico atiende solo adultos (18 años o más).";
          }

          if (!edadCompatible) {
            // Buscar alternativas para la edad
            try {
              const alternativas = currentSession.records.filter(record => {
                const altDoctorId = Array.isArray(record.fields["Médico"]) ? 
                  record.fields["Médico"][0] : record.fields["Médico"];
                return altDoctorId !== (Array.isArray(selectedRecord.fields["Médico"]) ? 
                  selectedRecord.fields["Médico"][0] : selectedRecord.fields["Médico"]);
              });

              if (alternativas.length > 0) {
                const altRecord = alternativas[0];
                const altDoctorId = Array.isArray(altRecord.fields["Médico"]) ? 
                  altRecord.fields["Médico"][0] : altRecord.fields["Médico"];
                
                const altDoctorInfo = await getDoctorInfo(altDoctorId);
                const altAtiende = altDoctorInfo.atiende || "Ambos";
                
                // Verificar si la alternativa es compatible
                let altCompatible = true;
                if (altAtiende === "Niños" && edadConfirmada >= 18) altCompatible = false;
                if (altAtiende === "Adultos" && edadConfirmada < 18) altCompatible = false;
                
                if (altCompatible) {
                  const fechaAlt = new Date(altRecord.fields.Fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  let altAtiendeTxt = "";
                  switch(altAtiende) {
                    case "Niños": altAtiendeTxt = " (especialista en pediatría)"; break;
                    case "Adultos": altAtiendeTxt = " (atiende solo adultos)"; break;
                    case "Ambos": altAtiendeTxt = " (atiende pacientes de todas las edades)"; break;
                    default: altAtiendeTxt = " (atiende pacientes de todas las edades)";
                  }
                  
                  // Actualizar sesión con nueva selección
                  sessions[from] = {
                    ...currentSession,
                    selectedRecord: altRecord,
                    doctorInfo: altDoctorInfo,
                    patientAge: edadConfirmada,
                    stage: 'getting-rut'
                  };
                  
                  return NextResponse.json({
                    text: `${mensajeEdad}\n\n✅ Sin embargo, tengo otra opción perfecta para ti:\n\n👨‍⚕️ **Dr. ${altDoctorInfo.name}**${altAtiendeTxt}\n📅 ${fechaAlt} a las ${altRecord.fields.Hora}\n📍 ${altRecord.fields["Clínica"] || altRecord.fields["Clinica"]}\n\n¡Perfecto! Ahora necesito tu RUT para completar la reserva.\n\nPor favor, ingresa tu RUT:\nEjemplo: 12345678-9`,
                    session: sessions[from]
                  });
                }
              }
              
              return NextResponse.json({
                text: `${mensajeEdad}\n\nLamentablemente no tengo otros médicos disponibles para tu edad en este momento. Te sugiero intentar más tarde o contactar directamente a la clínica.`
              });
              
            } catch (error) {
              console.error("❌ Error buscando alternativas:", error);
              return NextResponse.json({
                text: `${mensajeEdad}\n\nPor favor, intenta nuevamente más tarde.`
              });
            }
          }

          // Si la edad es compatible, continuar (ya tenemos el nombre)
          const nombrePaciente = currentSession.patientName.split(' ')[0];
          sessions[from] = {
            ...currentSession,
            patientAge: edadConfirmada,
            stage: 'getting-rut',
            attempts: 0 // Reset attempts para el siguiente campo
          };

          return NextResponse.json({
            text: `¡Perfecto, ${nombrePaciente}! La cita te queda ideal.\n\nAhora necesito tu RUT para completar la reserva.\n\nPor favor, ingresa tu RUT:\nEjemplo: 12345678-9`,
            session: sessions[from]
          });

        case 'getting-age-for-filtering':
          if (!validarEdad(text)) {
            const mensajeError = analizarConfusion(text, 'edad');
            currentSession.attempts = (currentSession.attempts || 0) + 1;
            
            // Si ya intentó 3 veces, ofrecer ayuda adicional
            const ayudaAdicional = currentSession.attempts >= 3 ? 
              "\n\n💡 *Solo necesito tu edad en números:*\n• Si tienes 25 años, escribe: 25\n• Si tienes 3 años, escribe: 3\n• Solo números del 1 al 120" : "";
            
            sessions[from] = { ...currentSession };
            return NextResponse.json({
              text: mensajeError + ayudaAdicional
            });
          }
          
          const edadIngresada = parseInt(text);

          console.log(`🎯 Manteniendo especialidad original: ${specialty} para edad ${edadIngresada}`);

          // Buscar médicos compatibles con la edad
          const medicosCompatibles = await getMedicosQueAtienden(specialty, edadIngresada);
          
          if (medicosCompatibles.length === 0) {
            return NextResponse.json({
              text: `Lamentablemente no encontré médicos de ${specialty} que atiendan pacientes de ${edadIngresada} años en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
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
              text: `Encontré médicos de ${specialty} que atienden pacientes de ${edadIngresada} años, pero no tienen sobrecupos disponibles para fechas futuras.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
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
            text: `✅ Encontré un sobrecupo de ${specialty} para pacientes de ${edadIngresada} años:\n\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${fechaFormateada} a las ${first.Hora}\n📍 ${clin}\n📍 ${dir}\n\n¿Te sirve? Confirma con "sí".`,
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
                text: `Te muestro otra opción de ${specialty}:\n\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${fechaFormateada} a las ${nextRecord.Hora}\n📍 ${clin}\n📍 ${dir}\n\n¿Te sirve esta? Confirma con "sí".`,
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
            const mensajeError = analizarConfusion(text, 'rut');
            currentSession.attempts = (currentSession.attempts || 0) + 1;
            
            // Si ya intentó 3 veces, ofrecer ayuda adicional
            const ayudaAdicional = currentSession.attempts >= 3 ? 
              "\n\n💡 *¿Necesitas ayuda?* Un RUT válido tiene esta forma:\n• 12.345.678-9 (con puntos y guión)\n• 12345678-9 (sin puntos pero con guión)\n• El último dígito puede ser un número del 0-9 o la letra K" : "";
            
            sessions[from] = { ...currentSession };
            return NextResponse.json({
              text: mensajeError + ayudaAdicional
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-phone',
            patientRut: text,
            attempts: 0 // Reset attempts para el siguiente campo
          };
          return NextResponse.json({
            text: "Perfecto! 📋\n\nAhora tu número de teléfono (incluye +56 si es de Chile).\nEjemplo: +56912345678",
            session: sessions[from]
          });

        case 'getting-phone':
          if (!validarTelefono(text)) {
            const mensajeError = analizarConfusion(text, 'telefono');
            currentSession.attempts = (currentSession.attempts || 0) + 1;
            
            // Si ya intentó 3 veces, ofrecer ayuda adicional
            const ayudaAdicional = currentSession.attempts >= 3 ? 
              "\n\n💡 *Formatos válidos de teléfono:*\n• +56912345678 (celular con +56)\n• 912345678 (celular sin código)\n• 221234567 (fijo con código de área)\n• 12345678 (fijo sin código)" : "";
            
            sessions[from] = { ...currentSession };
            return NextResponse.json({
              text: mensajeError + ayudaAdicional
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-email',
            patientPhone: text,
            attempts: 0 // Reset attempts para el siguiente campo
          };
          return NextResponse.json({
            text: "Excelente! 📞\n\nFinalmente, tu email para enviarte la confirmación:",
            session: sessions[from]
          });

        case 'getting-email':
          if (!validarEmail(text)) {
            const mensajeError = analizarConfusion(text, 'email');
            currentSession.attempts = (currentSession.attempts || 0) + 1;
            
            // Si ya intentó 3 veces, ofrecer ayuda adicional
            const ayudaAdicional = currentSession.attempts >= 3 ? 
              "\n\n💡 *Un email válido debe tener:*\n• Un nombre: juan\n• El símbolo @\n• Un dominio: gmail.com\n• Ejemplo completo: juan@gmail.com" : "";
            
            sessions[from] = { ...currentSession };
            return NextResponse.json({
              text: mensajeError + ayudaAdicional
            });
          }

          // Generar sesión de pago
          const paymentSessionId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const sobrecupoDataForPayment = currentSession.records[0]?.fields;
          const paymentAmount = "2990"; // Precio actualizado: $2.990 CLP
          
          // Obtener nombre del doctor para la URL de pago
          const doctorNameForPayment = await getDoctorName(
            Array.isArray(sobrecupoDataForPayment["Médico"]) ? 
              sobrecupoDataForPayment["Médico"][0] : sobrecupoDataForPayment["Médico"]
          );
          
          try {
            // Crear enlace corto de pago
            const linkResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payment/create-link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sobrecupoId: currentSession.records[0].id,
                patientName: currentSession.patientName,
                patientRut: currentSession.patientRut,
                patientPhone: currentSession.patientPhone,
                patientEmail: text,
                patientAge: currentSession.patientAge,
                doctorName: doctorNameForPayment,
                specialty: currentSession.specialty,
                date: formatSpanishDate(sobrecupoDataForPayment.Fecha),
                time: sobrecupoDataForPayment.Hora,
                clinic: sobrecupoDataForPayment.Clínica || sobrecupoDataForPayment.Clinica || 'Clínica',
                amount: paymentAmount,
                sessionId: paymentSessionId,
                motivo: currentSession.motivo || null // 🆕 AGREGAR MOTIVO DE CONSULTA
              })
            });

            const linkResult = await linkResponse.json();
            
            let paymentUrl = '';
            if (linkResult.success) {
              paymentUrl = linkResult.shortUrl;
              console.log('✅ Enlace corto creado:', paymentUrl);
            } else {
              // Fallback al enlace largo si falla
              paymentUrl = `/pago?sobrecupoId=${currentSession.records[0].id}&patientName=${encodeURIComponent(currentSession.patientName)}&patientRut=${encodeURIComponent(currentSession.patientRut)}&patientPhone=${encodeURIComponent(currentSession.patientPhone)}&patientEmail=${encodeURIComponent(text)}&patientAge=${encodeURIComponent(currentSession.patientAge)}&doctorName=${encodeURIComponent(doctorNameForPayment)}&specialty=${encodeURIComponent(currentSession.specialty)}&date=${encodeURIComponent(formatSpanishDate(sobrecupoDataForPayment.Fecha))}&time=${encodeURIComponent(sobrecupoDataForPayment.Hora)}&clinic=${encodeURIComponent(sobrecupoDataForPayment.Clínica || sobrecupoDataForPayment.Clinica || 'Clínica')}&amount=${paymentAmount}&sessionId=${paymentSessionId}`;
              console.log('⚠️ Fallback a enlace largo:', linkResult.error);
            }

            // Actualizar sesión con datos de pago
            sessions[from] = { 
              ...currentSession, 
              stage: 'pending-payment',
              patientEmail: text,
              paymentSessionId: paymentSessionId,
              paymentUrl: paymentUrl
            };
            
            return NextResponse.json({
              text: `✅ ¡Perfecto! Tengo todos tus datos:\n\n👤 ${currentSession.patientName}\n📧 ${text}\n📱 ${currentSession.patientPhone}\n🆔 ${currentSession.patientRut}\n📅 ${currentSession.patientAge} años\n\n💰 **Último paso: Confirmar pago**\n\nValor autorización de sobrecupo: **$${parseInt(paymentAmount).toLocaleString('es-CL')} CLP**\n\n🔗 **ENLACE DE PAGO:**\n${paymentUrl}`,
              session: sessions[from],
              paymentButton: {
                text: "💳 Procesar Pago",
                url: paymentUrl,
                amount: `$${parseInt(paymentAmount).toLocaleString('es-CL')} CLP`
              }
            });

          } catch (linkError) {
            console.error('❌ Error creando enlace de pago:', linkError);
            
            // Fallback al enlace largo
            const fallbackPaymentUrl = `/pago?sobrecupoId=${currentSession.records[0].id}&patientName=${encodeURIComponent(currentSession.patientName)}&patientRut=${encodeURIComponent(currentSession.patientRut)}&patientPhone=${encodeURIComponent(currentSession.patientPhone)}&patientEmail=${encodeURIComponent(text)}&patientAge=${encodeURIComponent(currentSession.patientAge)}&doctorName=${encodeURIComponent(doctorNameForPayment)}&specialty=${encodeURIComponent(currentSession.specialty)}&date=${encodeURIComponent(formatSpanishDate(sobrecupoDataForPayment.Fecha))}&time=${encodeURIComponent(sobrecupoDataForPayment.Hora)}&clinic=${encodeURIComponent(sobrecupoDataForPayment.Clínica || sobrecupoDataForPayment.Clinica || 'Clínica')}&amount=${paymentAmount}&sessionId=${paymentSessionId}`;
            
            sessions[from] = { 
              ...currentSession, 
              stage: 'pending-payment',
              patientEmail: text,
              paymentSessionId: paymentSessionId,
              paymentUrl: fallbackPaymentUrl
            };
            
            return NextResponse.json({
              text: `✅ ¡Perfecto! Tengo todos tus datos:\n\n👤 ${currentSession.patientName}\n📧 ${text}\n📱 ${currentSession.patientPhone}\n🆔 ${currentSession.patientRut}\n📅 ${currentSession.patientAge} años\n\n💰 **Último paso: Confirmar pago**\n\nValor autorización de sobrecupo: **$${parseInt(paymentAmount).toLocaleString('es-CL')} CLP**\n\n🔗 **ENLACE DE PAGO:**\n${fallbackPaymentUrl}`,
              session: sessions[from],
              paymentButton: {
                text: "💳 Procesar Pago",
                url: fallbackPaymentUrl,
                amount: `$${parseInt(paymentAmount).toLocaleString('es-CL')} CLP`
              }
            });
          }

        case 'pending-payment':
          // Usuario escribió algo mientras esperaba el pago
          if (text.toLowerCase().includes('enlace') || text.toLowerCase().includes('pago') || text.toLowerCase().includes('reenviar')) {
            // Reenviar enlace de pago
            const paymentUrl = currentSession.paymentUrl || '/pago';
            return NextResponse.json({
              text: `🔗 **Aquí tienes nuevamente el enlace de pago:**\n\nValor: **$2.990 CLP**\n\nCompleta el pago para confirmar tu reserva.`,
              paymentButton: {
                text: "💳 Procesar Pago",
                url: paymentUrl,
                amount: "$2.990 CLP"
              }
            });
          }
          
          return NextResponse.json({
            text: `⏳ Tu pago está pendiente.\n\nPor favor, completa el pago haciendo clic en el enlace que te envié para confirmar tu reserva.\n\nEscribe "enlace" si necesitas que te reenvíe el enlace de pago.`
          });

        case 'payment-completed':
          // Esta sección se ejecutará después de que se confirme el pago
          // 🔥 VERIFICACIÓN ROBUSTA DE DATOS DE SESIÓN
          const { patientAge, patientName, patientRut, patientPhone, patientEmail, records, specialty } = currentSession;
          
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

            // 3. NOTIFICAR AL MÉDICO VIA WHATSAPP
            if (sobrecupoUpdated) {
              try {
                console.log("📱 Enviando WhatsApp al médico...");
                
                const medicoId = Array.isArray(sobrecupoData["Médico"]) ? 
                  sobrecupoData["Médico"][0] : sobrecupoData["Médico"];
                
                // Obtener datos completos del médico incluyendo WhatsApp
                const doctorInfo = await getDoctorInfo(medicoId);
                
                if (doctorInfo.whatsapp) {
                  const fechaFormateada = formatSpanishDate(sobrecupoData.Fecha);
                  
                  await whatsAppService.notifyDoctorNewPatient(
                    {
                      name: doctorInfo.name,
                      whatsapp: doctorInfo.whatsapp
                    },
                    {
                      name: patientName,
                      rut: patientRut,
                      phone: patientPhone,
                      email: text
                    },
                    {
                      fecha: fechaFormateada,
                      hora: sobrecupoData.Hora,
                      clinica: sobrecupoData["Clínica"] || sobrecupoData["Clinica"] || "Clínica",
                      direccion: sobrecupoData["Dirección"] || sobrecupoData["Direccion"] || ""
                    }
                  );
                  
                  console.log("✅ WhatsApp enviado al médico exitosamente");
                  
                  // Enviar email al médico también
                  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && doctorInfo.email) {
                    try {
                      console.log("📧 Enviando email de notificación al médico...");
                      
                      const doctorEmailContent = `¡Hola Dr/a. ${doctorInfo.name}!

¡Tienes un nuevo paciente registrado! 🎉

📅 DETALLES DE LA CITA:
• Fecha: ${fechaFormateada}
• Hora: ${sobrecupoData.Hora}  
• Especialidad: ${specialty}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"] || "Clínica"}
• Dirección: ${sobrecupoData["Dirección"] || sobrecupoData["Direccion"] || ""}

👤 DATOS DEL PACIENTE:
• Nombre: ${patientName}
• RUT: ${patientRut}
• Teléfono: ${patientPhone}
• Email: ${text}
• Edad: ${patientAge} años

✅ El paciente ha confirmado su asistencia.

Saludos,
Sistema Sobrecupos AI`;

                      const doctorEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${SENDGRID_API_KEY}`,
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          personalizations: [{
                            to: [{ email: doctorInfo.email, name: doctorInfo.name }],
                            subject: `👨‍⚕️ Nuevo paciente: ${patientName} - ${fechaFormateada} ${sobrecupoData.Hora}`
                          }],
                          from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                          content: [{ type: "text/plain", value: doctorEmailContent }]
                        })
                      });

                      if (doctorEmailResponse.ok) {
                        console.log("✅ Email enviado al médico exitosamente");
                      } else {
                        const errorData = await doctorEmailResponse.json();
                        console.error("❌ Error enviando email al médico:", errorData);
                      }
                    } catch (doctorEmailErr) {
                      console.error("⚠️ Error enviando email al médico (no crítico):", doctorEmailErr);
                    }
                  } else {
                    console.log("⚠️ Email al médico no enviado - falta SendGrid config o email del médico");
                  }
                } else {
                  console.log("⚠️ Médico no tiene WhatsApp configurado");
                }
              } catch (whatsappErr) {
                console.error("⚠️ Error enviando WhatsApp al médico (no crítico):", whatsappErr);
              }
            }

            // 4. ENVIAR EMAIL DE CONFIRMACIÓN (SI ESTÁ CONFIGURADO)
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

    // 🔥 DETECTAR MÉDICO ESPECÍFICO POR NOMBRE
    const medicoEspecifico = detectarMedicoEspecifico(text);
    
    if (medicoEspecifico) {
      console.log(`🔍 Buscando médico específico: ${medicoEspecifico}`);
      
      try {
        // Buscar médico en la base de datos
        const medico = await buscarMedicoPorNombre(medicoEspecifico);
        
        if (medico) {
          console.log(`✅ Médico encontrado: ${medico.name} - ${medico.especialidad}`);
          
          // Buscar sobrecupos disponibles de este médico
          const sobrecupos = await buscarSobrecuposDeMedico(medico.id);
          
          if (sobrecupos.length > 0) {
            // Mostrar sobrecupos disponibles del médico específico
            const sobrecupo = sobrecupos[0]; // Tomar el primero disponible
            const fechaFormateada = formatSpanishDate(sobrecupo.fields?.Fecha);
            
            sessions[from] = {
              stage: 'confirming-appointment',
              selectedSobrecupo: sobrecupo.id,
              doctorName: medico.name,
              specialty: medico.especialidad,
              attempts: 0
            };

            return NextResponse.json({
              text: `¡Perfecto! Encontré disponibilidad con ${medico.name} (${medico.especialidad}).\n\n📅 **Sobrecupo disponible:**\n• Fecha: ${fechaFormateada}\n• Hora: ${sobrecupo.fields?.Hora}\n• Clínica: ${sobrecupo.fields?.["Clínica"] || sobrecupo.fields?.["Clinica"]}\n\n¿Te interesa reservar esta cita? Responde **"sí"** para continuar.`,
              session: sessions[from]
            });
          } else {
            return NextResponse.json({
              text: `Encontré al Dr/a. ${medico.name} (${medico.especialidad}), pero lamentablemente no tiene sobrecupos disponibles en este momento.\n\n¿Te gustaría que te ayude a encontrar otro médico de ${medico.especialidad} que sí tenga disponibilidad?`
            });
          }
        } else {
          return NextResponse.json({
            text: `No pude encontrar al médico "${medicoEspecifico}" en nuestra base de datos.\n\n¿Podrías verificar el nombre completo? O si prefieres, puedo ayudarte a encontrar un especialista por área médica.\n\nPor ejemplo: "Necesito un oftalmólogo" o "Busco un dermatólogo"`
          });
        }
      } catch (error) {
        console.error('Error buscando médico específico:', error);
        return NextResponse.json({
          text: `Hubo un problema buscando al médico "${medicoEspecifico}". ¿Podrías intentar nuevamente o prefieres que te ayude a buscar por especialidad?`
        });
      }
    }

    // 🔥 DETECTAR SÍNTOMAS Y MAPEAR A ESPECIALIDADES - FLUJO MEJORADO
    const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
    
    if (especialidadPorSintomas) {
      const specialty = especialidadPorSintomas;
      console.log(`🎯 Especialidad detectada por síntomas: ${specialty}`);
      
      // 🆕 BUSCAR MÉDICOS DISPONIBLES INMEDIATAMENTE
      try {
        const resp = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );
        const data = await resp.json();
        const sobrecuposRecords = data.records || [];

        // Filtrar por especialidad y disponibilidad
        const availableFiltered = sobrecuposRecords.filter(record => {
          const fields = record.fields || {};
          return fields.Especialidad === specialty && 
                 (fields.Disponible === "Si" || fields.Disponible === true);
        });

        // Filtrar solo fechas futuras
        const available = filterFutureDates(availableFiltered);

        if (available.length === 0) {
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

          return NextResponse.json({
            text: `${respuestaEmpatica}\n\nPor lo que me describes, necesitas ver a un especialista en ${specialty}, pero lamentablemente no tengo sobrecupos disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
          });
        }

        // Ordenar por fecha más próxima y tomar el primero
        available.sort((a, b) => {
          const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
          const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
          return dateA - dateB;
        });

        const first = available[0].fields;
        const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
        
        // 🆕 OBTENER INFO COMPLETA DEL MÉDICO
        let doctorInfo = { name: 'Doctor', atiende: 'Ambos' };
        try {
          const doctorResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          
          if (doctorResponse.ok) {
            const doctorData = await doctorResponse.json();
            doctorInfo = {
              name: doctorData.fields?.Name || doctorData.fields?.Nombre || 'Doctor',
              atiende: doctorData.fields?.Atiende || 'Ambos'
            };
          }
        } catch (err) {
          console.error("❌ Error obteniendo info del médico:", err);
        }

        // Generar respuesta empática
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
                max_tokens: 60,
                messages: [
                  {
                    role: "system",
                    content: "Eres una secretaria médica chilena empática y profesional. Responde con comprensión al paciente que describe su problema médico. Máximo 2 líneas, tono cálido y humano."
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

        // Formatear fecha en español
        const fechaFormateada = formatSpanishDate(first.Fecha);
        const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
        const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";

        // 🆕 TEXTO SOBRE QUÉ PACIENTES ATIENDE
        let atiendeTxt = "";
        switch(doctorInfo.atiende) {
          case "Niños":
            atiendeTxt = " (especialista en pediatría)";
            break;
          case "Adultos":
            atiendeTxt = " (atiende solo adultos)";
            break;
          case "Ambos":
            atiendeTxt = " (atiende niños y adultos)";
            break;
          default:
            atiendeTxt = " (atiende pacientes de todas las edades)";
        }

        // Guardar en sesión incluyendo motivo original
        sessions[from] = {
          stage: 'confirming-appointment',
          specialty: specialty,
          respuestaEmpatica,
          motivo: text, // 🆕 GUARDAR MOTIVO ORIGINAL
          records: available,
          attempts: 0,
          doctorInfo,
          selectedRecord: first
        };

        return NextResponse.json({
          text: `${respuestaEmpatica}\n\n✅ Por lo que me describes, te recomiendo ver a un especialista en **${specialty}**.\n\n👨‍⚕️ Tengo disponible al **Dr. ${doctorInfo.name}**${atiendeTxt}\n📅 ${fechaFormateada} a las ${first.Hora}\n📍 ${clin}, ${dir}\n\n¿Te sirve esta cita?\n\nResponde **Sí** para confirmar o **No** si prefieres otra opción.`,
          session: sessions[from]
        });

      } catch (error) {
        console.error("❌ Error consultando médicos:", error);
        return NextResponse.json({
          text: "Disculpa, hay un problema técnico consultando la disponibilidad. Intenta más tarde."
        });
      }
    }

    // 🔥 MANEJO ESPECIAL PARA CONSULTAS SOBRE ESPECIALIDADES
    const consultaEspecialidades = text.toLowerCase().includes('especialidad') || 
                                  text.toLowerCase().includes('especialidades') ||
                                  text.toLowerCase().includes('qué médicos') ||
                                  text.toLowerCase().includes('que medicos') ||
                                  text.toLowerCase().includes('qué doctores') ||
                                  text.toLowerCase().includes('que doctores');

    if (consultaEspecialidades) {
      try {
        const especialidadesDisponibles = await getEspecialidadesDisponibles();
        
        if (especialidadesDisponibles.length > 0) {
          const especialidadesText = especialidadesDisponibles
            .map((esp, idx) => `• ${esp}`)
            .join('\n');
            
          return NextResponse.json({
            text: `¡Tengo disponibilidad de sobrecupos en estas especialidades médicas! 🩺\n\n${especialidadesText}\n\n¿En cuál de estas necesitas una cita? O cuéntame tus síntomas para recomendarte la especialidad más adecuada.`
          });
        } else {
          return NextResponse.json({
            text: `Por el momento no tengo sobrecupos disponibles, pero puedo ayudarte a reservar una cita regular.\n\n¿Qué tipo de especialista necesitas o qué síntomas tienes?`
          });
        }
      } catch (error) {
        console.error("Error obteniendo especialidades:", error);
      }
    }

    // Si llega aquí, usar OpenAI como evaluador inteligente
    if (OPENAI_API_KEY) {
      try {
        // PRIMER PASO: Evaluar si es consulta médica o no médica
        const evaluationRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.3,
            max_tokens: 150,
            messages: [
              {
                role: "system",
                content: `Eres un evaluador inteligente. Analiza si el mensaje del usuario es:
1. MÉDICO: Síntomas, dolencias, necesidad de especialistas, problemas de salud
2. NO_MÉDICO: Temas cotidianos (comida, transporte, entretenimiento, etc.)

Si es NO_MÉDICO, responde de forma humana y redirige hacia salud (SIN incluir "NO_MÉDICO:" en la respuesta).
Si es MÉDICO, responde solo "MÉDICO".

Ejemplos:
- "Quiero uber" → "¡Uber para moverse por la ciudad! 🚗 Mientras esperas, ¿cómo has estado de salud? ¿Algún malestar o consulta médica?"
- "Me duele la cabeza" → MÉDICO
- "Tengo hambre" → "¡El hambre es normal! 🍽️ Espero que comas algo rico y saludable. Hablando de salud, ¿cómo te has sentido últimamente?"
- "Qué especialidades tienes" → "¡Hay muchas especialidades médicas interesantes! 🩺 Pero antes de hablar de eso, ¿cómo te sientes de salud? ¿Tienes alguna consulta o malestar?"`
              },
              { role: "user", content: text }
            ]
          })
        });

        const evaluationJson = await evaluationRes.json();
        const evaluationResult = evaluationJson.choices?.[0]?.message?.content?.trim() || "";

        // Si la respuesta es "MÉDICO", proceder con detección de especialidad
        if (evaluationResult === "MÉDICO") {
          const especialidadesDisponibles = await getEspecialidadesDisponibles();
          const especialidadesString = especialidadesDisponibles.join(", ");

          const specialtyRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  content: `Responde SOLO con una de estas especialidades: ${especialidadesString}. Si mencionan niño, elige Pediatría. Si no estás seguro, elige Medicina Familiar.`
                },
                { role: "user", content: text }
              ]
            })
          });

          const specialtyJson = await specialtyRes.json();
          const rawEsp = specialtyJson.choices?.[0]?.message?.content?.trim() || "";
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
        } else {
          // Si no es "MÉDICO", usar la respuesta generada (ya incluye redirección)
          return NextResponse.json({ text: evaluationResult });
        }

      } catch (err) {
        console.error("❌ Error OpenAI evaluación:", err);
        return NextResponse.json({
          text: "No estoy seguro de cómo ayudarte con eso 🤔\n\nSoy tu asistente médico, así que cuéntame: ¿tienes algún síntoma o necesitas ver algún especialista?"
        });
      }
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
