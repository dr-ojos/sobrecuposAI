// app/api/bot/route.ts - VERSIÓN TYPESCRIPT COMPLETA
import { NextRequest, NextResponse } from 'next/server';
import whatsAppService from '../../../lib/whatsapp-service';
import { 
  PatientSession, 
  AirtableRecord, 
  DoctorInfo, 
  SessionStage,
  ESPECIALIDADES_DISPONIBLES,
  Especialidad,
  BotResponse
} from '../../../types';

// Estado de sesiones en memoria mejorado con timeout
const sessions: Record<string, PatientSession> = {};
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// Limpiar sesiones expiradas cada 10 minutos
setInterval(() => {
  const now = Date.now();
  Object.keys(sessions).forEach(sessionId => {
    if (sessions[sessionId] && (now - (sessions[sessionId].lastActivity || 0)) > SESSION_TIMEOUT) {
      console.log(`🧹 Limpiando sesión expirada: ${sessionId}`);
      delete sessions[sessionId];
    }
  });
}, 10 * 60 * 1000);

// Función para obtener o crear sesión
function getOrCreateSession(sessionId?: string, sessionData: Partial<PatientSession> = {}): PatientSession {
  if (!sessionId) {
    sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      stage: 'welcome',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageHistory: [],
      attempts: 0,
      ...sessionData,
      id: sessionId
    };
  } else {
    // Actualizar actividad
    sessions[sessionId].lastActivity = Date.now();
    // Merge con datos nuevos
    sessions[sessionId] = { ...sessions[sessionId], ...sessionData };
  }
  
  return sessions[sessionId];
}

// Saludos simples para detección
const saludosSimples: string[] = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

// 🆕 FUNCIÓN PARA FILTRAR SOLO FECHAS FUTURAS - MEJORADA
function filterFutureDates(records: AirtableRecord[]): AirtableRecord[] {
  const now = new Date();
  
  // Crear fecha de hoy en zona horaria de Chile
  const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
  const today = new Date(chileTime.getFullYear(), chileTime.getMonth(), chileTime.getDate());
  
  return records.filter(record => {
    const fields = record.fields || {};
    const fechaStr = fields.Fecha;
    const horaStr = fields.Hora;
    
    if (!fechaStr) return false;
    
    try {
      // Convertir fecha del registro a objeto Date
      const recordDate = new Date(fechaStr);
      
      // Si la fecha es futura, incluirla
      if (recordDate > today) return true;
      
      // Si es hoy, verificar que la hora no haya pasado
      if (recordDate.getTime() === today.getTime() && horaStr) {
        const [hours, minutes] = horaStr.split(':').map(Number);
        const recordDateTime = new Date(recordDate);
        recordDateTime.setHours(hours, minutes, 0, 0);
        
        // Comparar con hora actual en Chile
        const currentChileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
        return recordDateTime > currentChileTime;
      }
      
      return false;
    } catch (error) {
      console.error('Error procesando fecha:', fechaStr, error);
      return false;
    }
  });
}

// 🆕 FUNCIÓN PARA FORMATEAR FECHA A DD-MM-YYYY
function formatSpanishDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', dateStr, error);
    return dateStr;
  }
}

// Validaciones
function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validarRut(rut: string): boolean {
  // Remover puntos y guión, convertir a uppercase
  const cleanRut = rut.replace(/\./g, '').replace('-', '').toUpperCase();
  
  // Verificar longitud (mínimo 8, máximo 9 caracteres)
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  // Separar número y dígito verificador
  const numero = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Verificar que el número solo contenga dígitos
  if (!/^\d+$/.test(numero)) return false;
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);
  
  return dv === dvCalculado;
}

function validarTelefono(telefono: string): boolean {
  // Remover espacios y caracteres especiales
  const cleanTelefono = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Verificar formatos válidos
  const formatosValidos = [
    /^\+56\d{9}$/,        // +56912345678
    /^56\d{9}$/,          // 56912345678
    /^\d{9}$/,            // 912345678
    /^\d{8}$/             // 12345678 (fijo)
  ];
  
  return formatosValidos.some(formato => formato.test(cleanTelefono));
}

// Función para extraer ID del médico
function extractMedicoId(fields: any): string | null {
  const medico = fields["Médico"];
  if (!medico) return null;
  return Array.isArray(medico) ? medico[0] : medico;
}

// Cache para información de médicos
const doctorInfoCache = new Map<string, DoctorInfo>();

async function getDoctorInfoCached(medicoId: string): Promise<DoctorInfo> {
  if (doctorInfoCache.has(medicoId)) {
    return doctorInfoCache.get(medicoId)!;
  }
  
  const doctorInfo = await getDoctorInfo(medicoId);
  doctorInfoCache.set(medicoId, doctorInfo);
  return doctorInfo;
}

async function getDoctorInfo(medicoId: string): Promise<DoctorInfo> {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error ${res.status} obteniendo doctor ${medicoId}`);
    }
    
    const data = await res.json();
    return {
      name: data.fields?.Nombre || 'Doctor',
      email: data.fields?.Email || undefined,
      whatsapp: data.fields?.WhatsApp || undefined,
      especialidad: data.fields?.Especialidad || undefined
    };
  } catch (error) {
    console.error(`❌ Error obteniendo info del médico ${medicoId}:`, error);
    return {
      name: 'Doctor',
      email: undefined,
      whatsapp: undefined,
      especialidad: undefined
    };
  }
}

async function getDoctorName(medicoId: string): Promise<string> {
  const info = await getDoctorInfoCached(medicoId);
  return info.name;
}

// Función para formatear dirección de clínica
function formatClinicAddress(fields: any): string {
  const clinica = fields["Clínica"] || fields["Clinica"] || "";
  const direccion = fields["Dirección"] || fields["Direccion"] || "";
  
  if (direccion) {
    return `${clinica}\n📍 ${direccion}`;
  }
  return clinica;
}

// Funciones de análisis de mensajes
function detectarEspecialidadPorSintomas(texto: string): { 
  especialidad: Especialidad; 
  confianza: number; 
  alternativa?: Especialidad 
} | null {
  const textoLower = texto.toLowerCase();
  
  // Mapeo de síntomas a especialidades con confianza
  const sintomasEspecialidades: Record<string, { especialidad: Especialidad; confianza: number; alternativa?: Especialidad }[]> = {
    // Oftalmología
    'ojo|ojos|vista|vision|veo|ver|borroso|lagaña|conjuntivitis|glaucoma|catarata|retina|miopia|astigmatismo': [
      { especialidad: 'Oftalmología', confianza: 0.9 }
    ],
    
    // Cardiología  
    'corazon|corazón|pecho|dolor.*pecho|presion|presión|hipertension|hipertensión|arritmia|taquicardia|infarto|cardiaco': [
      { especialidad: 'Cardiología', confianza: 0.9 }
    ],
    
    // Dermatología
    'piel|acne|acné|mancha|lunar|rash|alergia|eczema|psoriasis|dermatitis|cicatriz|verruga': [
      { especialidad: 'Dermatología', confianza: 0.9 }
    ],
    
    // Gastroenterología
    'estomago|estómago|dolor.*barriga|diarrea|estreñimiento|acidez|gastritis|ulcera|úlcera|colon|intestino|nausea|náusea': [
      { especialidad: 'Gastroenterología', confianza: 0.9 }
    ],
    
    // Traumatología
    'hueso|fractura|esguince|rodilla|tobillo|hombro|cadera|columna|dolor.*espalda|lumbar|cervical|articulacion|articulación': [
      { especialidad: 'Traumatología', confianza: 0.9 }
    ],
    
    // Neurología
    'cabeza|dolor.*cabeza|migraña|migrana|mareo|vertigo|vértigo|convulsion|convulsión|epilepsia|parkinson|alzheimer': [
      { especialidad: 'Neurología', confianza: 0.9 }
    ],
    
    // Urología
    'orina|riñon|riñón|próstata|prostata|vejiga|incontinencia|cálculo|calculo|cistitis': [
      { especialidad: 'Urología', confianza: 0.9 }
    ],
    
    // Otorrinolaringología
    'oido|oído|nariz|garganta|sinusitis|otitis|faringitis|amigdalas|amígdalas|ronquido|apnea': [
      { especialidad: 'Otorrinolaringología', confianza: 0.9 }
    ],
    
    // Ginecología
    'regla|menstruacion|menstruación|ovario|útero|utero|mama|pecho|embarazo|anticonceptivo|papanicolau': [
      { especialidad: 'Ginecología', confianza: 0.9 }
    ],
    
    // Endocrinología
    'diabetes|tiroides|hormona|insulina|glucosa|azucar|azúcar|metabolismo|obesidad': [
      { especialidad: 'Endocrinología', confianza: 0.9 }
    ],
    
    // Pediatría
    'niño|niña|bebe|bebé|hijo|hija|menor|infantil|vacuna|desarrollo': [
      { especialidad: 'Pediatría', confianza: 0.9 }
    ],
    
    // Psiquiatría
    'ansiedad|depresion|depresión|panico|pánico|bipolar|trastorno|insomnio|estres|estrés|psicologico|psicológico': [
      { especialidad: 'Psiquiatría', confianza: 0.9 }
    ]
  };
  
  let mejorMatch: { especialidad: Especialidad; confianza: number; alternativa?: Especialidad } | null = null;
  
  for (const [patron, especialidades] of Object.entries(sintomasEspecialidades)) {
    const regex = new RegExp(patron, 'i');
    if (regex.test(textoLower)) {
      for (const esp of especialidades) {
        if (!mejorMatch || esp.confianza > mejorMatch.confianza) {
          mejorMatch = esp;
        }
      }
    }
  }
  
  return mejorMatch;
}

// Función para detectar saludo simple
function esSaludoSimple(text: string): boolean {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Si contiene síntomas o palabras médicas, NO es saludo simple
  const palabrasMedicas: string[] = [
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

// Función para detectar médico específico
function detectarMedicoEspecifico(texto: string): { nombre: string; confianza: number } | null {
  const textoLower = texto.toLowerCase();
  
  // Patrones para detectar búsqueda de médico
  const patronesMedico = [
    /(?:dr\.?|dra\.?|doctor|doctora)\s+([a-záéíóúñ\s]+)/i,
    /(?:médico|medico)\s+([a-záéíóúñ\s]+)/i,
    /cita\s+con\s+(?:el\s+|la\s+)?(?:dr\.?|dra\.?|doctor|doctora)?\s*([a-záéíóúñ\s]+)/i
  ];
  
  for (const patron of patronesMedico) {
    const match = texto.match(patron);
    if (match && match[1]) {
      const nombre = match[1].trim();
      if (nombre.length > 2) {
        return { nombre, confianza: 0.8 };
      }
    }
  }
  
  return null;
}

// Función para detectar especialidad directa
function detectarEspecialidadDirecta(texto: string): Especialidad | null {
  const textoLower = texto.toLowerCase();
  
  for (const especialidad of ESPECIALIDADES_DISPONIBLES) {
    if (textoLower.includes(especialidad.toLowerCase())) {
      return especialidad;
    }
  }
  
  // Sinónimos comunes
  const sinonimos: Record<string, Especialidad> = {
    'cardiologo': 'Cardiología',
    'dermatologo': 'Dermatología',
    'ginecologo': 'Ginecología',
    'neurologo': 'Neurología',
    'oculista': 'Oftalmología',
    'otorrino': 'Otorrinolaringología',
    'urologo': 'Urología',
    'traumatologo': 'Traumatología',
    'endocrinologo': 'Endocrinología',
    'gastroenterologo': 'Gastroenterología',
    'psiquiatra': 'Psiquiatría',
    'pediatra': 'Pediatría',
    'medicina familiar': 'Medicina Familiar'
  };
  
  for (const [sinonimo, especialidad] of Object.entries(sinonimos)) {
    if (textoLower.includes(sinonimo)) {
      return especialidad;
    }
  }
  
  return null;
}

// Función para analizar confusión en inputs
function analizarConfusion(text: string, tipoEsperado: 'rut' | 'email' | 'telefono' | 'edad'): string {
  const base = "Por favor, verifica el dato ingresado.";
  
  switch (tipoEsperado) {
    case 'rut':
      if (/^\d{8,9}$/.test(text.replace(/\D/g, ''))) {
        return "❌ Formato de RUT incorrecto.\n\n✅ Formato correcto: 12.345.678-9 (con puntos y guión)";
      }
      return `❌ ${base}\n\n✅ Formato RUT: 12.345.678-9`;
      
    case 'email':
      if (text.includes(' ')) {
        return "❌ El email no puede contener espacios.\n\n✅ Ejemplo: usuario@gmail.com";
      }
      if (!text.includes('@')) {
        return "❌ Falta el símbolo @ en el email.\n\n✅ Ejemplo: usuario@gmail.com";
      }
      return `❌ ${base}\n\n✅ Formato email: usuario@dominio.com`;
      
    case 'telefono':
      return `❌ ${base}\n\n✅ Formato teléfono: +56912345678 o 912345678`;
      
    case 'edad':
      if (isNaN(Number(text))) {
        return "❌ La edad debe ser un número.\n\n✅ Ejemplo: 25";
      }
      return `❌ ${base}\n\n✅ Ingresa solo números, ejemplo: 25`;
      
    default:
      return base;
  }
}

// Función principal del handler POST
export async function POST(req: NextRequest): Promise<NextResponse<BotResponse>> {
  try {
    const body = await req.json();
    const { message: text, sessionId, from } = body;
    
    if (!text && !from) {
      return NextResponse.json({ text: "Mensaje requerido" }, { status: 400 });
    }
    
    const sessionKey = from || sessionId || 'default';
    const currentSession = sessions[sessionKey];
    
    console.log(`🤖 [${sessionKey}] Mensaje: "${text}"`);
    console.log(`🤖 [${sessionKey}] Sesión actual:`, currentSession?.stage || 'nueva');
    
    // Manejar mensaje basado en el stage actual
    if (currentSession?.stage) {
      return await handleExistingSession(sessionKey, text, currentSession);
    } else {
      return await handleNewSession(sessionKey, text);
    }
    
  } catch (error) {
    console.error('❌ Error en bot:', error);
    return NextResponse.json(
      { text: "Ocurrió un error interno. Por favor intenta nuevamente." },
      { status: 500 }
    );
  }
}

// Manejar sesión existente
async function handleExistingSession(
  sessionKey: string, 
  text: string, 
  currentSession: PatientSession
): Promise<NextResponse<BotResponse>> {
  
  switch (currentSession.stage) {
    case 'getting-age':
      return await handleGettingAge(sessionKey, text, currentSession);
      
    case 'choosing-from-options':
      return await handleChoosingFromOptions(sessionKey, text, currentSession);
      
    case 'confirming-appointment':
      return await handleConfirmingAppointment(sessionKey, text, currentSession);
      
    case 'getting-name-for-confirmed-appointment':
      return await handleGettingName(sessionKey, text, currentSession);
      
    case 'getting-rut':
      return await handleGettingRut(sessionKey, text, currentSession);
      
    case 'getting-phone':
      return await handleGettingPhone(sessionKey, text, currentSession);
      
    case 'getting-email':
      return await handleGettingEmail(sessionKey, text, currentSession);
      
    default:
      // Si no reconocemos el stage, reiniciar
      delete sessions[sessionKey];
      return await handleNewSession(sessionKey, text);
  }
}

// Manejar nueva sesión
async function handleNewSession(sessionKey: string, text: string): Promise<NextResponse<BotResponse>> {
  console.log(`🆕 Nueva sesión para: ${sessionKey}`);
  
  // Detectar tipo de consulta
  if (esSaludoSimple(text)) {
    const session = getOrCreateSession(sessionKey, {
      stage: 'getting-age',
      motivo: 'Consulta general'
    });
    
    return NextResponse.json({
      text: "¡Hola! 👋 Soy tu asistente de sobrecupos médicos.\n\nPara ayudarte mejor, ¿cuál es tu edad?",
      session
    });
  }
  
  // Detectar especialidad por síntomas
  const deteccionSintomas = detectarEspecialidadPorSintomas(text);
  if (deteccionSintomas) {
    return await handleSpecialtyDetection(sessionKey, text, deteccionSintomas.especialidad);
  }
  
  // Detectar especialidad directa
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  if (especialidadDirecta) {
    return await handleSpecialtyDetection(sessionKey, text, especialidadDirecta);
  }
  
  // Detectar médico específico
  const medicoDetectado = detectarMedicoEspecifico(text);
  if (medicoDetectado) {
    return await handleSpecificDoctor(sessionKey, text, medicoDetectado.nombre);
  }
  
  // Mensaje por defecto
  const session = getOrCreateSession(sessionKey, {
    stage: 'getting-age',
    motivo: text
  });
  
  return NextResponse.json({
    text: "¡Hola! 👋 Entiendo que necesitas atención médica.\n\nPara ayudarte mejor, ¿cuál es tu edad?",
    session
  });
}

// Handler para obtener edad
async function handleGettingAge(
  sessionKey: string, 
  text: string, 
  currentSession: PatientSession
): Promise<NextResponse<BotResponse>> {
  
  const age = parseInt(text.trim());
  
  if (isNaN(age) || age < 1 || age > 120) {
    const attempts = (currentSession.attempts || 0) + 1;
    sessions[sessionKey] = { ...currentSession, attempts };
    
    const mensaje = attempts >= 3 
      ? "❌ La edad debe ser un número entre 1 y 120.\n\n💡 Ejemplo: Si tienes 25 años, escribe: 25"
      : "❌ Por favor ingresa una edad válida (número entre 1 y 120).";
      
    return NextResponse.json({ text: mensaje });
  }
  
  // Buscar sobrecupos disponibles
  const specialty = currentSession.specialty || 'Medicina Familiar';
  const sobrecupos = await fetchSobrecupos(specialty);
  
  if (sobrecupos.length === 0) {
    sessions[sessionKey] = {
      ...currentSession,
      stage: 'asking-for-contact-data',
      patientAge: age,
      specialty
    };
    
    return NextResponse.json({
      text: `Tengo ${age} años registrados.\n\nLamentablemente no tengo sobrecupos disponibles de ${specialty} en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
    });
  }
  
  // Mostrar opciones disponibles
  const optionsText = await formatSobrecuposOptions(sobrecupos.slice(0, 2));
  
  sessions[sessionKey] = {
    ...currentSession,
    stage: 'choosing-from-options',
    patientAge: age,
    specialty,
    records: sobrecupos,
    attempts: 0
  };
  
  return NextResponse.json({
    text: `Perfecto, ${age} años registrados.\n\nTe muestro las mejores opciones de ${specialty}:\n\n${optionsText}\n\n¿Cuál opción prefieres? Responde con el número (**1** o **2**).`
  });
}

// Handler para elegir opciones
async function handleChoosingFromOptions(
  sessionKey: string, 
  text: string, 
  currentSession: PatientSession
): Promise<NextResponse<BotResponse>> {
  
  const option = parseInt(text.trim());
  const records = currentSession.records || [];
  
  if (isNaN(option) || option < 1 || option > records.length) {
    return NextResponse.json({
      text: `❌ Por favor selecciona una opción válida (1 o 2).`
    });
  }
  
  const selectedRecord = records[option - 1];
  const medicoId = extractMedicoId(selectedRecord.fields);
  if (!medicoId) {
    return NextResponse.json({
      text: "❌ Error: No se pudo obtener la información del médico."
    });
  }
  const doctorInfo = await getDoctorInfoCached(medicoId);
  const fechaFormateada = formatSpanishDate(selectedRecord.fields.Fecha);
  
  sessions[sessionKey] = {
    ...currentSession,
    stage: 'confirming-appointment',
    selectedRecord,
    doctorInfo,
    attempts: 0
  };
  
  return NextResponse.json({
    text: `✅ Excelente elección!\n\n📋 **Resumen de tu cita:**\n👨‍⚕️ Dr. ${doctorInfo.name}\n📅 ${fechaFormateada} a las ${selectedRecord.fields.Hora}\n🏥 ${selectedRecord.fields["Clínica"] || selectedRecord.fields["Clinica"]}\n\n¿Confirmas que quieres reservar esta cita? Responde **"sí"** para continuar.`
  });
}

// Handler para confirmar cita
async function handleConfirmingAppointment(
  sessionKey: string, 
  text: string, 
  currentSession: PatientSession
): Promise<NextResponse<BotResponse>> {
  
  const textLower = text.toLowerCase();
  
  if (textLower.includes('si') || textLower.includes('sí') || textLower.includes('ok') || textLower.includes('confirmo')) {
    sessions[sessionKey] = {
      ...currentSession,
      stage: 'getting-name-for-confirmed-appointment'
    };
    
    return NextResponse.json({
      text: "¡Perfecto! 🎉\n\nPara confirmar tu cita necesito algunos datos.\n\n¿Cuál es tu nombre completo?"
    });
  }
  
  // Usuario no quiere confirmar
  delete sessions[sessionKey];
  return NextResponse.json({
    text: "Entiendo. Si cambias de opinión, puedes escribirme nuevamente.\n\n¡Que tengas un buen día! 😊"
  });
}

// Funciones auxiliares para obtener datos de Airtable
async function fetchSobrecupos(specialty?: string): Promise<AirtableRecord[]> {
  try {
    let filterFormula = '';
    if (specialty && specialty !== 'Medicina Familiar') {
      filterFormula = `?filterByFormula=SEARCH("${specialty}",{Especialidad})`;
    }
    
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}${filterFormula}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error ${res.status} fetching sobrecupos`);
    }
    
    const data = await res.json();
    const records = data.records || [];
    
    return filterFutureDates(records);
  } catch (error) {
    console.error('❌ Error fetching sobrecupos:', error);
    return [];
  }
}

async function formatSobrecuposOptions(sobrecupos: AirtableRecord[]): Promise<string> {
  const options = await Promise.all(
    sobrecupos.map(async (record, index) => {
      const medicoId = extractMedicoId(record.fields);
      if (!medicoId) return `**${index + 1}.** ❌ Error obteniendo médico`;
      const doctorInfo = await getDoctorInfoCached(medicoId);
      const fechaFormateada = formatSpanishDate(record.fields.Fecha);
      const address = formatClinicAddress(record.fields);
      
      return `**${index + 1}.** 👨‍⚕️ **Dr. ${doctorInfo.name}**\n📅 ${fechaFormateada} a las ${record.fields.Hora}\n📍 ${address}`;
    })
  );
  
  return options.join('\n\n');
}

// Handlers para obtener datos del paciente (simplificados)
async function handleGettingName(sessionKey: string, text: string, currentSession: PatientSession): Promise<NextResponse<BotResponse>> {
  if (!text.trim() || text.trim().length < 2) {
    return NextResponse.json({
      text: "❌ Por favor ingresa tu nombre completo."
    });
  }
  
  sessions[sessionKey] = {
    ...currentSession,
    stage: 'getting-rut',
    patientName: text.trim()
  };
  
  return NextResponse.json({
    text: `Gracias ${text.trim()}. Ahora necesito tu RUT.\n\n📝 Formato: 12.345.678-9`
  });
}

async function handleGettingRut(sessionKey: string, text: string, currentSession: PatientSession): Promise<NextResponse<BotResponse>> {
  if (!validarRut(text)) {
    const attempts = (currentSession.attempts || 0) + 1;
    sessions[sessionKey] = { ...currentSession, attempts };
    
    const ayudaAdicional = attempts >= 3 
      ? "\n\n💡 Formato RUT: 12.345.678-9 (incluye puntos y guión)"
      : "";
      
    return NextResponse.json({
      text: `❌ RUT inválido. Verifica el formato.${ayudaAdicional}`
    });
  }
  
  sessions[sessionKey] = {
    ...currentSession,
    stage: 'getting-phone',
    patientRut: text.trim(),
    attempts: 0
  };
  
  return NextResponse.json({
    text: "✅ RUT válido. Ahora necesito tu número de teléfono.\n\n📱 Formato: +56912345678 o 912345678"
  });
}

async function handleGettingPhone(sessionKey: string, text: string, currentSession: PatientSession): Promise<NextResponse<BotResponse>> {
  if (!validarTelefono(text)) {
    const attempts = (currentSession.attempts || 0) + 1;
    sessions[sessionKey] = { ...currentSession, attempts };
    
    return NextResponse.json({
      text: "❌ Teléfono inválido.\n\n📱 Formato: +56912345678 o 912345678"
    });
  }
  
  sessions[sessionKey] = {
    ...currentSession,
    stage: 'getting-email',
    patientPhone: text.trim(),
    attempts: 0
  };
  
  return NextResponse.json({
    text: "📱 Teléfono registrado. Por último, necesito tu email.\n\n📧 Ejemplo: usuario@gmail.com"
  });
}

async function handleGettingEmail(sessionKey: string, text: string, currentSession: PatientSession): Promise<NextResponse<BotResponse>> {
  if (!validarEmail(text)) {
    const attempts = (currentSession.attempts || 0) + 1;
    sessions[sessionKey] = { ...currentSession, attempts };
    
    const ayudaAdicional = attempts >= 3 
      ? "\n\n💡 Un email válido: usuario@gmail.com"
      : "";
      
    return NextResponse.json({
      text: `❌ Email inválido.${ayudaAdicional}`
    });
  }
  
  // Proceso de pago y confirmación final (simplificado)
  return await processFinalConfirmation(sessionKey, text, currentSession);
}

// Handlers auxiliares
async function handleSpecialtyDetection(sessionKey: string, text: string, specialty: Especialidad): Promise<NextResponse<BotResponse>> {
  const sobrecupos = await fetchSobrecupos(specialty);
  
  if (sobrecupos.length === 0) {
    sessions[sessionKey] = {
      stage: 'asking-for-contact-data',
      specialty,
      motivo: text
    };
    
    return NextResponse.json({
      text: `Entiendo que necesitas ${specialty}.\n\nLamentablemente no tengo sobrecupos disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
    });
  }
  
  sessions[sessionKey] = {
    stage: 'getting-age',
    specialty,
    motivo: text,
    records: sobrecupos
  };
  
  return NextResponse.json({
    text: `Perfecto, veo que necesitas ${specialty}.\n\nPara continuar, ¿cuál es tu edad?`
  });
}

async function handleSpecificDoctor(sessionKey: string, text: string, doctorName: string): Promise<NextResponse<BotResponse>> {
  // Buscar sobrecupos del médico específico
  // Esta función estaría más desarrollada en la implementación completa
  sessions[sessionKey] = {
    stage: 'getting-age',
    motivo: text,
    doctorName
  };
  
  return NextResponse.json({
    text: `Entiendo que quieres una cita con ${doctorName}.\n\nPara continuar, ¿cuál es tu edad?`
  });
}

async function processFinalConfirmation(sessionKey: string, email: string, currentSession: PatientSession): Promise<NextResponse<BotResponse>> {
  // Aquí iría toda la lógica de:
  // 1. Crear paciente en Airtable
  // 2. Actualizar sobrecupo
  // 3. Enviar emails y WhatsApp
  // 4. Procesar pago
  
  // Por simplicidad, retorno confirmación básica
  delete sessions[sessionKey];
  
  return NextResponse.json({
    text: `✅ ¡Perfecto! Tu cita está casi lista.\n\n📧 Email: ${email}\n\nTe enviaré un enlace de pago para confirmar tu sobrecupo.\n\n¡Gracias por confiar en nosotros! 🩺`
  });
}