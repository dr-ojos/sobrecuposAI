// pages/api/bot.js - FIX CRÍTICO COMPLETO
const sessions = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Método no permitido" });
  }

  const {
    OPENAI_API_KEY, 
    AIRTABLE_API_KEY, 
    AIRTABLE_BASE_ID, 
    AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE, 
    AIRTABLE_PATIENTS_TABLE
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  // Validación crítica de configuración
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error("❌ Variables de entorno faltantes");
    return res.json({ 
      text: "❌ Servicio temporalmente no disponible. Contacta soporte." 
    });
  }

  // Validación de mensaje vacío
  if (!text) {
    return res.json({ 
      text: "¡Hola! 👋 Soy Sobrecupos IA.\n\n¿En qué puedo ayudarte? Cuéntame tus síntomas o qué especialista necesitas." 
    });
  }

  console.log(`📨 Mensaje recibido de ${from}: "${text}"`);

  // Expresiones regulares optimizadas
  const saludoSimpleRe = /^(hola|buenas|buenos?\s*(dias?|tardes?|noches?)|hey|ey|qué tal|que tal|cómo estás|como estas)$/i;
  const agradecimientoRe = /^(gracias|muchas gracias|thanks|thx)$/i;
  const afirmativoRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|acepto|me sirve)$/i;
  const negativoRe = /^(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente|otro|otra opción|otra opcion)$/i;

  // SISTEMA DE TIMEOUTS
  const currentTime = Date.now();
  const sessionTimeout = 10 * 60 * 1000; // 10 minutos
  
  let currentSession = sessions[from] || prevSession || {};
  
  if (currentSession.lastActivity && (currentTime - currentSession.lastActivity) > sessionTimeout) {
    console.log(`🕐 Sesión expirada para ${from}, reseteando...`);
    currentSession = {};
    sessions[from] = {};
  }

  currentSession.lastActivity = currentTime;

  // === MANEJO DE SALUDOS SIMPLES ===
  if (saludoSimpleRe.test(text)) {
    sessions[from] = { lastActivity: currentTime };
    return res.json({
      text: "¡Hola! 👋 Soy Sobrecupos IA, tu asistente médico.\n\n¿En qué puedo ayudarte hoy? Puedes contarme:\n• Síntomas que tienes\n• Especialista que necesitas\n• Urgencias médicas"
    });
  }

  // === MANEJO DE AGRADECIMIENTOS ===
  if (agradecimientoRe.test(text)) {
    return res.json({
      text: "¡De nada! 😊 Siempre estoy aquí para ayudarte con tu salud.\n\n¿Hay algo más en lo que pueda asistirte?"
    });
  }

  // === DETECCIÓN DE CONSULTAS NO MÉDICAS ===
  if (esConsultaNoMedica(text)) {
    const respuestasEspecificas = getRespuestaEspecificaNoMedica(text);
    
    if (respuestasEspecificas.length > 0) {
      const respuestaAleatoria = respuestasEspecificas[Math.floor(Math.random() * respuestasEspecificas.length)];
      return res.json({ text: respuestaAleatoria });
    }
    
    const respuestasGenerales = [
      "Soy tu asistente médico especializado 👩‍⚕️\n\n¿Cómo te sientes hoy? Cuéntame si tienes algún síntoma o necesitas algún especialista.",
      "Mi especialidad es cuidar tu salud 🩺\n\n¿Hay algo médico en lo que pueda ayudarte? Por ejemplo síntomas, chequeos o especialistas que necesites."
    ];
    
    return res.json({ 
      text: respuestasGenerales[Math.floor(Math.random() * respuestasGenerales.length)] 
    });
  }

  // === MANEJO DE SESIONES ACTIVAS ===
  if (currentSession.stage) {
    const result = await manejarSesionActiva(currentSession, text, from, res);
    if (result) return result;
  }

  // === DETECCIÓN INTELIGENTE DE ESPECIALIDADES ===
  
  // 1. Especialidad directa (ej: "necesito oftalmólogo")
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  if (especialidadDirecta) {
    return await buscarYResponderSobrecupos(especialidadDirecta, text, from, res);
  }

  // 2. Síntomas que mapean a especialidades (ej: "me pican los ojos")
  const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
  if (especialidadPorSintomas) {
    console.log(`🎯 Síntoma detectado: "${text}" → ${especialidadPorSintomas}`);
    return await buscarYResponderSobrecupos(especialidadPorSintomas, text, from, res, true);
  }

  // === RESPUESTA POR DEFECTO MEJORADA ===
  const especialidadesDisponibles = await getEspecialidadesDisponibles();
  const especialidadesTexto = especialidadesDisponibles.slice(0, 6).join(', ');
  
  return res.json({
    text: `Te puedo ayudar a encontrar sobrecupos médicos 🩺\n\nCuéntame:\n• ¿Qué síntomas tienes?\n• ¿Qué especialista necesitas?\n\nEspecialidades disponibles: ${especialidadesTexto}\n\nEjemplo: "Necesito oftalmólogo" o "Me pican los ojos"`
  });

  // ===============================
  // 🛠️ FUNCIONES AUXILIARES
  // ===============================

  async function manejarSesionActiva(session, message, userId, response) {
    switch (session.stage) {
      case 'awaiting-confirmation':
        return await manejarConfirmacion(session, message, userId, response);
      case 'getting-name':
        return await manejarNombre(session, message, userId, response);
      case 'getting-phone':
        return await manejarTelefono(session, message, userId, response);
      case 'getting-rut':
        return await manejarRUT(session, message, userId, response);
      case 'getting-age':
        return await manejarEdad(session, message, userId, response);
    }
    return null;
  }

  async function manejarConfirmacion(session, message, userId, response) {
    if (afirmativoRe.test(message)) {
      sessions[userId] = { 
        ...session, 
        stage: 'getting-name',
        attempts: 0,
        lastActivity: Date.now()
      };
      return response.json({
        text: "¡Perfecto! 🎉 Para confirmar tu cita necesito algunos datos.\n\n¿Cuál es tu nombre completo?",
        session: sessions[userId]
      });
    }
    
    if (negativoRe.test(message)) {
      const { records = [], specialty } = session;
      const nextAttempt = (session.attempts || 0) + 1;
      
      if (nextAttempt < records.length && nextAttempt < 3) {
        const nextRecord = records[nextAttempt].fields;
        const medicoNombre = await getDoctorName(nextRecord["Médico"]);
        
        sessions[userId] = { 
          ...session, 
          attempts: nextAttempt,
          lastActivity: Date.now()
        };
        
        return response.json({
          text: `Te muestro otra opción de ${specialty}:\n\n🏥 ${nextRecord["Clínica"]}\n📍 ${nextRecord["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta? Responde *sí* o *no*`,
          session: sessions[userId]
        });
      } else {
        sessions[userId] = { lastActivity: Date.now() };
        return response.json({
          text: `Entiendo. Por ahora no tengo más sobrecupos de ${specialty} disponibles.\n\n¿Te gustaría que te contacte cuando tengamos nuevas opciones disponibles?\n\nTambién puedes preguntarme por otra especialidad. 😊`
        });
      }
    }
    
    return response.json({
      text: "No entendí tu respuesta. Por favor responde *sí* si te sirve el sobrecupo o *no* si quieres ver otra opción."
    });
  }

  async function manejarNombre(session, message, userId, response) {
    const nombre = message.trim();
    
    if (nombre.length < 2) {
      return response.json({
        text: "Por favor ingresa tu nombre completo (mínimo 2 caracteres)."
      });
    }
    
    sessions[userId] = { 
      ...session, 
      stage: 'getting-phone',
      patientName: nombre,
      lastActivity: Date.now()
    };
    
    return response.json({
      text: `Perfecto, ${nombre}. 👍\n\nAhora necesito tu número de WhatsApp (incluye +56).\n\nEjemplo: +56912345678`,
      session: sessions[userId]
    });
  }

  async function manejarTelefono(session, message, userId, response) {
    const telefono = message.trim();
    
    if (!validarTelefono(telefono)) {
      return response.json({
        text: "Formato de teléfono incorrecto. Debe incluir +56 y tener 9 dígitos después.\n\nEjemplo: +56912345678"
      });
    }
    
    sessions[userId] = { 
      ...session, 
      stage: 'getting-rut',
      patientPhone: telefono,
      lastActivity: Date.now()
    };
    
    return response.json({
      text: "📱 Teléfono registrado.\n\nAhora tu RUT (sin puntos, con guión).\n\nEjemplo: 12345678-9",
      session: sessions[userId]
    });
  }

  async function manejarRUT(session, message, userId, response) {
    const rut = message.trim();
    
    if (!validarRUT(rut)) {
      return response.json({
        text: "RUT inválido. Por favor ingresa tu RUT sin puntos y con guión.\n\nEjemplo: 12345678-9"
      });
    }
    
    sessions[userId] = { 
      ...session, 
      stage: 'getting-age',
      patientRUT: rut,
      lastActivity: Date.now()
    };
    
    return response.json({
      text: "✅ RUT registrado.\n\nFinalmente, ¿cuál es tu edad?",
      session: sessions[userId]
    });
  }

  async function manejarEdad(session, message, userId, response) {
    const edad = parseInt(message.trim());
    
    if (isNaN(edad) || edad < 1 || edad > 120) {
      return response.json({
        text: "Por favor ingresa una edad válida (entre 1 y 120 años)."
      });
    }
    
    return await procesarReservaFinal(session, edad, userId, response);
  }

  async function procesarReservaFinal(session, edad, userId, response) {
    const { records, specialty, attempts, patientName, patientPhone, patientRUT } = session;
    
    const selectedRecord = records[attempts || 0];
    
    if (!selectedRecord) {
      console.error("❌ No hay sobrecupo seleccionado");
      sessions[userId] = { lastActivity: Date.now() };
      return response.json({
        text: "❌ Error: No se encontró el sobrecupo seleccionado. Por favor intenta nuevamente."
      });
    }
    
    try {
      console.log("🏥 Iniciando proceso de reserva final...");
      
      const pacienteId = await crearPaciente({
        name: patientName,
        phone: patientPhone,
        rut: patientRUT,
        age: edad
      });
      
      if (!pacienteId) {
        console.error("❌ Error creando paciente");
        sessions[userId] = { lastActivity: Date.now() };
        return response.json({
          text: "❌ Hubo un problema creando tu registro de paciente. Por favor intenta nuevamente."
        });
      }
      
      const sobrecupoActualizado = await actualizarSobrecupo(selectedRecord.id, pacienteId, patientName);
      
      const medicoIds = selectedRecord.fields["Médico"];
      const medicoId = Array.isArray(medicoIds) ? medicoIds[0] : medicoIds;
      const medicoInfo = await getDoctorInfo(medicoId);
      
      sessions[userId] = { lastActivity: Date.now() };
      
      if (sobrecupoActualizado && pacienteId) {
        return response.json({
          text: `✅ ¡Cita confirmada exitosamente!\n\n📋 Detalles de tu cita:\n👤 Paciente: ${patientName}\n🩺 Especialidad: ${specialty}\n👨‍⚕️ Médico: Dr. ${medicoInfo.name}\n📅 Fecha: ${selectedRecord.fields.Fecha}\n🕐 Hora: ${selectedRecord.fields.Hora}\n🏥 Clínica: ${selectedRecord.fields["Clínica"]}\n📍 Dirección: ${selectedRecord.fields["Dirección"]}\n\n💡 Llega 15 minutos antes. ¡Nos vemos pronto!`
        });
      } else {
        return response.json({
          text: `❌ Hubo un problema técnico confirmando tu cita.\n\nTu información está guardada:\n• ${patientName}\n• ${specialty} - ${selectedRecord.fields.Fecha}\n\nTe contactaremos pronto para confirmar.`
        });
      }
      
    } catch (error) {
      console.error("❌ Error en reserva final:", error);
      sessions[userId] = { lastActivity: Date.now() };
      
      return response.json({
        text: "❌ Error procesando tu reserva. Por favor intenta nuevamente o contacta soporte."
      });
    }
  }

  async function buscarYResponderSobrecupos(specialty, originalText, userId, response, esSintoma = false) {
    try {
      let respuestaEmpatica = "";
      if (esSintoma) {
        respuestaEmpatica = generarRespuestaEmpatica(originalText, specialty);
      }

      const records = await buscarSobrecupos(specialty);
      
      if (records.length === 0) {
        const mensaje = esSintoma 
          ? `${respuestaEmpatica}\n\nPor tus síntomas, recomiendo consultar con ${specialty}.\n\nActualmente no tengo sobrecupos disponibles. ¿Te gustaría que te contacte cuando haya disponibilidad?`
          : `No tengo sobrecupos de ${specialty} disponibles ahora.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`;
        
        return response.json({ text: mensaje });
      }

      const first = records[0].fields;
      const medicoNombre = await getDoctorName(first["Médico"]);
      
      sessions[userId] = {
        stage: 'awaiting-confirmation',
        specialty,
        records,
        attempts: 0,
        lastActivity: Date.now()
      };

      const mensaje = esSintoma
        ? `${respuestaEmpatica}\n\nTe recomiendo ver a un especialista en ${specialty}.\n\n✅ Encontré un sobrecupo disponible:\n\n🏥 ${first["Clínica"]}\n📍 ${first["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Responde *sí* para reservar o *no* para ver otra opción.`
        : `✅ Encontré un sobrecupo de ${specialty}:\n\n🏥 ${first["Clínica"]}\n📍 ${first["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Responde *sí* para reservar.`;

      return response.json({
        text: mensaje,
        session: sessions[userId]
      });

    } catch (error) {
      console.error("❌ Error buscando sobrecupos:", error);
      return response.json({
        text: "Error consultando disponibilidad. Por favor intenta más tarde."
      });
    }
  }

  // ===============================
  // 🔍 FUNCIONES DE DETECCIÓN
  // ===============================

  function esConsultaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const consultasEspecificas = [
      'quiero pizza', 'pizza', 'hamburguesa', 'sushi', 'comida china',
      'restaurant', 'restaurante', 'comer', 'hambre', 'almuerzo', 'cena', 'desayuno',
      'que hora es', 'qué hora es', 'hora actual', 'que día es', 'qué día es',
      'como estas', 'cómo estás', 'quien eres', 'quién eres',
      'chiste', 'broma', 'cancion', 'canción', 'musica', 'música',
      'futbol', 'fútbol', 'deporte', 'partido', 'clima', 'tiempo'
    ];
    
    const terminosMedicos = [
      'dolor', 'duele', 'molestia', 'sintoma', 'síntoma', 'vision', 'visión',
      'ojo', 'ojos', 'cabeza', 'pecho', 'estomago', 'estómago', 'fiebre',
      'medico', 'médico', 'doctor', 'especialista', 'consulta', 'cita',
      'urgente', 'emergencia', 'salud', 'enfermo', 'enferma', 'picazon', 'picazón'
    ];
    
    const contieneTerminosMedicos = terminosMedicos.some(termino => 
      textoLimpio.includes(termino.toLowerCase())
    );
    
    if (contieneTerminosMedicos) {
      return false;
    }
    
    const contieneConsultaNoMedica = consultasEspecificas.some(consulta => 
      textoLimpio.includes(consulta.toLowerCase())
    );
    
    return contieneConsultaNoMedica;
  }

  function detectarEspecialidadDirecta(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const especialidadesDirectas = {
      'oftalmologo': 'Oftalmología', 'oftalmologia': 'Oftalmología',
      'dermatologo': 'Dermatología', 'dermatologia': 'Dermatología',
      'pediatra': 'Pediatría', 'pediatria': 'Pediatría',
      'cardiologo': 'Cardiología', 'cardiologia': 'Cardiología',
      'neurologo': 'Neurología', 'neurologia': 'Neurología',
      'otorrino': 'Otorrinolaringología', 'otorrinolaringologia': 'Otorrinolaringología',
      'medicina familiar': 'Medicina Familiar', 'medico general': 'Medicina Familiar',
      'general': 'Medicina Familiar', 'familiar': 'Medicina Familiar'
    };
    
    for (const [key, value] of Object.entries(especialidadesDirectas)) {
      if (textoLimpio.includes(key)) return value;
    }
    return null;
  }

  // 🎯 FUNCIÓN CRÍTICA CORREGIDA
  function detectarEspecialidadPorSintomas(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    // 👁️ SÍNTOMAS OFTALMOLÓGICOS (PRIORIDAD MÁXIMA)
    const sintomasOftalmologia = [
      'vision borrosa', 'visión borrosa', 'veo borroso', 'veo mal', 'no veo bien',
      'ojo rojo', 'ojos rojos', 'irritado', 'irritados', 'irritacion',
      'ardor en los ojos', 'quemazón ojos', 'lagrimeo', 'lagrimas',
      'dolor de ojos', 'duelen los ojos', 'ojo duele', 'dolor ocular',
      // 🔥 CRÍTICO: Incluir TODAS las variaciones de picazón en ojos
      'picazon ojos', 'picazón ojos', 'me pican los ojos', 'pican ojos',
      'comezon ojos', 'comezón ojos', 'ojos con picazon', 'ojos que pican',
      'picazon en los ojos', 'picazón en los ojos', 'pican mis ojos',
      'sensible a la luz', 'fotofobia', 'molesta la luz',
      'manchas flotantes', 'moscas volantes', 'puntos negros',
      'graduacion', 'graduación', 'lentes', 'anteojos'
    ];
    
    // 🏥 SÍNTOMAS DERMATOLÓGICOS (SIN INCLUIR OJOS)
    const sintomasDermatologia = [
      'picazon piel', 'picazón piel', 'me pica la piel', 'comezón piel',
      'picazon cuerpo', 'picazón cuerpo', 'me pica el cuerpo',
      'sarpullido', 'roncha', 'ronchas', 'erupcion', 'erupción',
      'alergia piel', 'dermatitis', 'eczema', 'granos', 'acne', 'acné'
    ];
    
    // 💓 SÍNTOMAS CARDIOLÓGICOS
    const sintomasCardiologia = [
      'dolor pecho', 'duele pecho', 'opresion pecho', 'palpitaciones',
      'taquicardia', 'falta aire', 'ahogo', 'disnea'
    ];
    
    // 🧠 SÍNTOMAS NEUROLÓGICOS
    const sintomasNeurologia = [
      'dolor cabeza', 'duele cabeza', 'cefalea', 'migrana', 'migraña',
      'mareo', 'mareos', 'vertigo', 'vértigo', 'temblor'
    ];
    
    // 👂 SÍNTOMAS OTORRINO
    const sintomasOtorrino = [
      'dolor garganta', 'duele garganta', 'dolor oido', 'no oigo',
      'ronquera', 'afonía', 'tapado nariz', 'congestion'
    ];
    
    // 🔍 VERIFICACIÓN JERÁRQUICA (OFTALMOLOGÍA PRIMERO)
    for (const sintoma of sintomasOftalmologia) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma oftalmológico detectado: "${sintoma}"`);
        return 'Oftalmología';
      }
    }
    
    for (const sintoma of sintomasCardiologia) {
      if (textoLimpio.includes(sintoma)) return 'Cardiología';
    }
    
    for (const sintoma of sintomasNeurologia) {
      if (textoLimpio.includes(sintoma)) return 'Neurología';
    }
    
    for (const sintoma of sintomasOtorrino) {
      if (textoLimpio.includes(sintoma)) return 'Otorrinolaringología';
    }
    
    for (const sintoma of sintomasDermatologia) {
      if (textoLimpio.includes(sintoma)) return 'Dermatología';
    }
    
    return null;
  }

  function generarRespuestaEmpatica(texto, especialidad) {
    const textoLimpio = texto.toLowerCase();
    
    if (especialidad === 'Oftalmología') {
      if (textoLimpio.includes('pican') || textoLimpio.includes('picazon')) {
        return "Entiendo que la picazón en los ojos es muy molesta.";
      }
      if (textoLimpio.includes('borroso')) {
        return "La visión borrosa puede ser preocupante, es importante revisarla.";
      }
      return "Los problemas oculares requieren evaluación especializada.";
    }
    
    return "Es importante que evalúes estos síntomas con un especialista.";
  }

  function getRespuestaEspecificaNoMedica(text) {
    const textoLimpio = text.toLowerCase();
    
    if (textoLimpio.includes('pizza') || textoLimpio.includes('comida')) {
      return ["¡Me da hambre solo de escucharte! 🍕 Pero soy tu asistente médico, no delivery 😄\n\n¿Cómo está tu salud? ¿Tienes algún síntoma o necesitas ver algún especialista?"];
    }
    
    if (textoLimpio.includes('hora')) {
      return ["No soy un reloj, ¡pero sí soy tu asistente médico! ⏰👩‍⚕️\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte?"];
    }
    
    return [];
  }

  // ===============================
  // 🔧 FUNCIONES DE VALIDACIÓN
  // ===============================

  function validarTelefono(telefono) {
    const pattern = /^\+56[0-9]{9}$/;
    return pattern.test(telefono);
  }

  function validarRUT(rut) {
    try {
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
    } catch {
      return false;
    }
  }

  // ===============================
  // 🗄️ FUNCIONES DE AIRTABLE
  // ===============================

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
      return ["Medicina Familiar", "Oftalmología", "Dermatología"];
    }
  }

  async function getDoctorName(medicoId) {
    try {
      const doctorIdArray = Array.isArray(medicoId) ? medicoId[0] : medicoId;
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorIdArray}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || "Médico";
    } catch (err) {
      console.error("❌ Error obteniendo nombre médico:", err);
      return "Médico";
    }
  }

  async function getDoctorInfo(medicoId) {
    try {
      const doctorIdArray = Array.isArray(medicoId) ? medicoId[0] : medicoId;
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorIdArray}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return {
        name: data.fields?.Name || "Médico",
        email: data.fields?.Email || null
      };
    } catch (err) {
      console.error("❌ Error obteniendo info médico:", err);
      return { name: "Médico", email: null };
    }
  }

  // 🔥 FUNCIÓN CRÍTICA: FILTRAR FECHAS PASADAS
  async function buscarSobrecupos(specialty) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100&sort[0][field]=Fecha&sort[0][direction]=asc`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      
      if (!data.records) return [];
      
      // 📅 FILTRAR FECHAS FUTURAS Y DISPONIBLES
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fecha
      
      return data.records.filter(record => {
        const fields = record.fields || {};
        
        // Verificar especialidad y disponibilidad
        const esEspecialidadCorrecta = fields.Especialidad === specialty;
        const estaDisponible = fields.Disponible === "Si" || fields.Disponible === true;
        
        if (!esEspecialidadCorrecta || !estaDisponible) {
          return false;
        }
        
        // 🔥 VERIFICAR QUE LA FECHA SEA FUTURA
        if (fields.Fecha) {
          try {
            const fechaSobrecupo = new Date(fields.Fecha);
            fechaSobrecupo.setHours(0, 0, 0, 0);
            
            // Solo incluir si la fecha es hoy o futura
            const esFechaValida = fechaSobrecupo >= hoy;
            
            if (!esFechaValida) {
              console.log(`🗓️ Excluyendo sobrecupo con fecha pasada: ${fields.Fecha}`);
            }
            
            return esFechaValida;
          } catch (err) {
            console.error(`❌ Error procesando fecha: ${fields.Fecha}`, err);
            return false; // Excluir si la fecha no se puede procesar
          }
        }
        
        return false; // Excluir si no tiene fecha
      });
    } catch (err) {
      console.error("❌ Error consultando sobrecupos:", err);
      return [];
    }
  }

  async function crearPaciente(patientData) {
    try {
      if (!AIRTABLE_PATIENTS_TABLE) {
        console.error("❌ AIRTABLE_PATIENTS_TABLE no configurada");
        return null;
      }

      if (!patientData.name || !patientData.phone || !patientData.rut || !patientData.age) {
        console.error("❌ Datos de paciente incompletos:", patientData);
        return null;
      }

      const record = {
        fields: {
          Nombre: patientData.name.trim(),
          Telefono: patientData.phone.trim(),
          RUT: patientData.rut.trim(),
          Edad: parseInt(patientData.age),
          "Fecha Registro": new Date().toISOString().split('T')[0],
          "Registro Bot": true,
          Status: "active"
        }
      };

      console.log("📝 Creando paciente en Airtable:", record);

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error respuesta Airtable:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        return null;
      }

      console.log("✅ Paciente creado exitosamente:", data.id);
      return data.id;
    } catch (error) {
      console.error("❌ Error general creando paciente:", error);
      return null;
    }
  }

  async function actualizarSobrecupo(sobrecupoId, pacienteId, patientName) {
    try {
      console.log("📝 Actualizando sobrecupo:", {
        sobrecupoId,
        pacienteId, 
        patientName
      });

      const updateData = {
        fields: {
          Disponible: "No",
          "Paciente ID": pacienteId,
          "Nombre Paciente": patientName,
          "Fecha Reserva": new Date().toISOString().split('T')[0]
        }
      };

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error actualizando sobrecupo:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        return false;
      }

      console.log("✅ Sobrecupo actualizado exitosamente:", data.id);
      return true;
    } catch (error) {
      console.error("❌ Error general actualizando sobrecupo:", error);
      return false;
    }
  }
}