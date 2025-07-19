// /pages/api/bot.js - VERSION DEBUG
const sessions = {};

// Lista de saludos simples para detectar sólo un saludo sin contexto
const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return saludosSimples.includes(limpio);
}

// Función para validar RUT chileno
function validarRUT(rut) {
  // Remover puntos y guión, convertir a mayúsculas
  rut = rut.replace(/[.\-]/g, '').toUpperCase();
  
  // Verificar formato básico
  if (!/^[0-9]+[0-9K]$/.test(rut)) return false;
  
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  
  // Calcular dígito verificador
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

// Función para detectar si el usuario menciona una especialidad específicamente
function detectarEspecialidadDirecta(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  const especialidadesDirectas = {
    'reumatologo': 'Reumatología',
    'reumatologia': 'Reumatología',
    'traumatologo': 'Traumatología',
    'traumatologia': 'Traumatología',
    'oftalmologo': 'Oftalmología',
    'oftalmologia': 'Oftalmología',
    'dermatologo': 'Dermatología',
    'dermatologia': 'Dermatología',
    'pediatra': 'Pediatría',
    'pediatria': 'Pediatría',
    'cardiologo': 'Cardiología',
    'cardiologia': 'Cardiología',
    'neurologo': 'Neurología',
    'neurologia': 'Neurología',
    'otorrino': 'Otorrinolaringología',
    'otorrinolaringologia': 'Otorrinolaringología',
    'medicina familiar': 'Medicina Familiar',
    'medico general': 'Medicina Familiar',
    'general': 'Medicina Familiar',
    'familiar': 'Medicina Familiar',
    'urologo': 'Urología',
    'urologia': 'Urología',
    'ginecologo': 'Ginecología',
    'ginecologia': 'Ginecología',
    'psiquiatra': 'Psiquiatría',
    'psiquiatria': 'Psiquiatría',
    'endocrinologo': 'Endocrinología',
    'endocrinologia': 'Endocrinología'
  };

  for (const [key, value] of Object.entries(especialidadesDirectas)) {
    if (textoLimpio.includes(key)) {
      return value;
    }
  }
  return null;
}

export default async function handler(req, res) {
  console.log("🚀 Bot iniciado - método:", req.method);
  
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PATIENTS_TABLE,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  // 🔍 DEBUG: Mostrar qué variables tenemos
  console.log("🔍 Variables de entorno:", {
    OPENAI_API_KEY: !!OPENAI_API_KEY,
    AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID: !!AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE: !!AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PATIENTS_TABLE: !!AIRTABLE_PATIENTS_TABLE,
    SENDGRID_API_KEY: !!SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: !!SENDGRID_FROM_EMAIL
  });

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  console.log("📨 Mensaje recibido:", text);

  // 1) Verificar configuración básica - SOLO las absolutamente necesarias
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.log("❌ Faltan variables críticas:", {
      AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_ID: !!AIRTABLE_TABLE_ID
    });
    return res.json({ 
      text: "❌ Error de configuración básica. Contacta soporte técnico." 
    });
  }

  console.log("✅ Variables críticas OK");

  // Regex comunes
  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // --- Helper para obtener especialidades disponibles dinámicamente
  async function getEspecialidadesDisponibles() {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?fields%5B%5D=Especialidad`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      const especialidades = new Set();
      
      data.records?.forEach(record => {
        if (record.fields?.Especialidad) {
          especialidades.add(record.fields.Especialidad);
        }
      });
      
      return Array.from(especialidades).sort();
    } catch (err) {
      console.error("❌ Error obteniendo especialidades:", err);
      return ["Medicina Familiar", "Oftalmología", "Dermatología"]; // Fallback
    }
  }

  // --- Helper para obtener nombre real del médico
  async function getDoctorName(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || medicoId;
    } catch (err) {
      console.error("❌ Error buscando médico:", err);
      return medicoId;
    }
  }

  // --- Helper para crear registro de paciente
  async function crearPaciente(pacienteData) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fields: pacienteData
          })
        }
      );
      const data = await resp.json();
      return data.id;
    } catch (err) {
      console.error("❌ Error creando paciente:", err);
      return null;
    }
  }

  // 2) Saludo inicial o saludo simple
  if (greetingRe.test(text)) {
    console.log("👋 Saludo detectado");
    if (esSaludoSimple(text)) {
      return res.json({
        text:
          "¡Hola! 👋 ¿Quieres que te ayude a encontrar y reservar un sobrecupo médico?\n" +
          "Cuéntame tus síntomas, el nombre del médico o la especialidad que necesitas."
      });
    }
    return res.json({
      text:
        "¡Hola! 👋 Soy Sobrecupos IA.\n" +
        "Te ayudo a encontrar y reservar sobrecupos médicos.\n" +
        "Dime tus síntomas, el médico o la especialidad que necesitas."
    });
  }

  // 3) Agradecimientos
  if (thanksRe.test(text)) {
    console.log("🙏 Agradecimiento detectado");
    return res.json({ text: "¡De nada! Si necesitas algo más, avísame. 😊" });
  }

  console.log("🔄 Continuando con lógica principal...");

  // Para simplificar el debug, vamos a hacer una respuesta básica primero
  return res.json({
    text: `✅ Bot funcionando correctamente!\n\nRecibí tu mensaje: "${text}"\n\nSistema operativo normalmente. ¿En qué puedo ayudarte?`
  });
}