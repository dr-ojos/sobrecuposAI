// pages/api/bot.js - VERSIÓN COMPLETA Y DEFINITIVA
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

  // 🔥 SISTEMA DE TIMEOUTS Y ANTI-LOOP
  const currentTime = Date.now();
  const sessionTimeout = 10 * 60 * 1000; // 10 minutos
  
  let currentSession = sessions[from] || prevSession || {};
  
  // Detectar loops (mismo mensaje repetido)
  if (currentSession.lastMessage === text && currentSession.lastMessageTime) {
    const timeDiff = currentTime - currentSession.lastMessageTime;
    if (timeDiff < 30000) { // Menos de 30 segundos
      console.log(`🔄 LOOP DETECTADO: Reseteando sesión para ${from}`);
      currentSession = {};
      sessions[from] = {};
    }
  }
  
  // Timeout de sesión
  if (currentSession.lastActivity && (currentTime - currentSession.lastActivity) > sessionTimeout) {
    console.log(`🕐 Sesión expirada para ${from}, reseteando...`);
    currentSession = {};
    sessions[from] = {};
  }

  // Actualizar actividad y mensaje
  currentSession.lastActivity = currentTime;
  currentSession.lastMessage = text;
  currentSession.lastMessageTime = currentTime;

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
      "Mi especialidad es cuidar tu salud 🩺\n\n¿Hay algo médico en lo que pueda ayudarte? Por ejemplo síntomas, chequeos o especialistas que necesites.",
      "Estoy aquí para temas de salud 😊\n\n¿Cómo puedo ayudarte médicamente hoy? Cuéntame tus síntomas o qué especialista buscas."
    ];
    
    return res.json({ 
      text: respuestasGenerales[Math.floor(Math.random() * respuestasGenerales.length)] 
    });
  }

  // === MANEJO DE SESIONES ACTIVAS CON PROTECCIÓN ANTI-LOOP ===
  if (currentSession.stage) {
    const result = await manejarSesionActivaConProteccion(currentSession, text, from, res);
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
    text: `Te puedo ayudar a encontrar sobrecupos médicos 🩺\n\nCuéntame:\n• ¿Qué síntomas tienes?\n• ¿Qué especialista necesitas?\n\nEspecialidades disponibles: ${especialidadesTexto}\n\nEjemplo: "Me pican los ojos" o "Necesito dermatólogo"`
  });

  // ===============================
  // 🛠️ FUNCIONES AUXILIARES COMPLETAS
  // ===============================

  async function manejarSesionActivaConProteccion(session, message, userId, response) {
    // 🔥 PROTECCIÓN ANTI-LOOP: Resetear si hay demasiados intentos
    if (session.attempts > 3) {
      console.log(`🔄 Demasiados intentos, reseteando sesión para ${userId}`);
      sessions[userId] = { lastActivity: Date.now() };
      return response.json({
        text: "Parece que hubo un problema con nuestra conversación. Empecemos de nuevo.\n\n¿En qué puedo ayudarte? Cuéntame tus síntomas o qué especialista necesitas."
      });
    }

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
    
    // Incrementar intentos en caso de respuesta no entendida
    session.attempts = (session.attempts || 0) + 1;
    sessions[userId] = { ...session, lastActivity: Date.now() };
    
    if (session.attempts >= 2) {
      sessions[userId] = { lastActivity: Date.now() };
      return response.json({
        text: "Parece que hubo confusión. Empecemos de nuevo.\n\n¿En qué puedo ayudarte? Cuéntame tus síntomas o qué especialista necesitas."
      });
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
      console.log("📋 Datos del paciente:", { patientName, patientPhone, patientRUT, edad });
      console.log("🎯 Sobrecupo seleccionado:", selectedRecord.id, selectedRecord.fields);
      
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
      
      console.log("✅ Paciente creado con ID:", pacienteId);
      
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
        
        if (!respuestaEmpatica && OPENAI_API_KEY) {
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
                    content: "Eres un asistente médico empático. Responde con 1 línea corta mostrando comprensión al paciente."
                  },
                  { role: "user", content: `Paciente dice: "${originalText}"` }
                ]
              })
            });
            const empatJson = await empatRes.json();
            respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
          } catch (err) {
            console.error("❌ Error OpenAI:", err);
          }
        }
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
  // 🔍 FUNCIONES DE DETECCIÓN COMPLETAS
  // ===============================

  function esConsultaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const consultasEspecificas = [
      // Comida y restaurantes
      'quiero pizza', 'pizza', 'hamburguesa', 'sushi', 'comida china',
      'restaurant', 'restaurante', 'comer', 'hambre', 'almuerzo', 'cena', 'desayuno',
      'delivery', 'pedidos ya', 'uber eats', 'rappi',
      
      // Información general
      'que hora es', 'qué hora es', 'hora actual', 'que día es', 'qué día es',
      'como estas', 'cómo estás', 'como esta', 'cómo está',
      'quien eres', 'quién eres', 'que eres', 'qué eres',
      
      // Entretenimiento
      'chiste', 'broma', 'cancion', 'canción', 'musica', 'música',
      'pelicula', 'película', 'serie', 'netflix', 'youtube',
      'futbol', 'fútbol', 'deporte', 'partido', 'equipo',
      
      // Servicios generales
      'clima', 'tiempo', 'lluvia', 'sol', 'temperatura',
      'precio', 'costo', 'cuanto cuesta', 'cuánto cuesta',
      'horario', 'horarios', 'abierto', 'cerrado',
      'direccion', 'dirección', 'ubicacion', 'ubicación', 'donde queda',
      'telefono', 'teléfono', 'contacto', 'email'
    ];
    
    const terminosMedicos = [
      'dolor', 'duele', 'molestia', 'sintoma', 'síntoma', 'vision', 'visión',
      'ojo', 'ojos', 'cabeza', 'pecho', 'estomago', 'estómago', 'fiebre',
      'mareo', 'nausea', 'náusea', 'cansancio', 'fatiga', 'tos', 'gripe',
      'resfriado', 'alergia', 'picazon', 'picazón', 'roncha', 'sarpullido',
      'medico', 'médico', 'doctor', 'especialista', 'consulta', 'cita',
      'urgente', 'emergencia', 'salud', 'enfermo', 'enferma', 'malestar',
      'sobrecupo', 'atencion medica', 'atención médica', 'necesito ver',
      'quiero ver doctor', 'quiero ver médico', 'busco especialista'
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
      'general': 'Medicina Familiar', 'familiar': 'Medicina Familiar',
      'traumatologo': 'Traumatología', 'traumatologia': 'Traumatología',
      'urologo': 'Urología', 'urologia': 'Urología',
      'ginecologo': 'Ginecología', 'ginecologia': 'Ginecología'
    };
    
    for (const [key, value] of Object.entries(especialidadesDirectas)) {
      if (textoLimpio.includes(key)) return value;
    }
    return null;
  }

  function detectarEspecialidadPorSintomas(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    // 👁️ SÍNTOMAS OFTALMOLÓGICOS (PRIORIDAD MÁXIMA)
    const sintomasOftalmologia = [
      // Problemas de visión
      'vision borrosa', 'visión borrosa', 'veo borroso', 'veo mal', 'no veo bien',
      'veo doble', 'vision doble', 'visión doble', 'diplopia',
      'ceguera', 'no veo nada', 'perdida vision', 'pérdida visión',
      
      // Síntomas oculares específicos
      'ojo rojo', 'ojos rojos', 'irritado', 'irritados', 'irritacion',
      'ardor en los ojos', 'quemazón ojos', 'lagrimeo', 'lagrimas',
      'dolor de ojos', 'duelen los ojos', 'ojo duele', 'dolor ocular',
      
      // 🔥 CRÍTICO: TODAS las variaciones de picazón en ojos
      'picazon ojos', 'picazón ojos', 'me pican los ojos', 'pican ojos',
      'comezon ojos', 'comezón ojos', 'ojos con picazon', 'ojos que pican',
      'picazon en los ojos', 'picazón en los ojos', 'pican mis ojos',
      'me pica el ojo', 'me pican mis ojos', 'tengo picazon en los ojos',
      
      // Sensibilidad y molestias
      'sensible a la luz', 'fotofobia', 'molesta la luz', 'luz molesta',
      'ojos secos', 'sequedad ocular', 'ojo seco',
      'cansancio visual', 'fatiga ocular', 'ojos cansados',
      
      // Fenómenos visuales
      'manchas flotantes', 'moscas volantes', 'puntos negros', 'moscas',
      'destellos', 'luces', 'halos', 'aureolas',
      
      // Problemas refractivos
      'graduacion', 'graduación', 'lentes', 'anteojos', 'gafas',
      'miopia', 'miopía', 'hipermetropia', 'astigmatismo',
      
      // Exámenes y revisiones
      'revision ojos', 'revisión ojos', 'examen vista', 'control vista',
      'fondo de ojo', 'presion ocular', 'presión ocular', 'glaucoma'
    ];
    
    // 🏥 SÍNTOMAS DERMATOLÓGICOS (SIN INCLUIR OJOS EXPLÍCITAMENTE)
    const sintomasDermatologia = [
      // Picazón corporal (EXCLUYENDO ojos explícitamente)
      'picazon piel', 'picazón piel', 'me pica la piel', 'comezón piel',
      'picazon cuerpo', 'picazón cuerpo', 'me pica el cuerpo',
      'picazon brazos', 'picazon piernas', 'picazon espalda',
      
      // Erupciones y lesiones
      'sarpullido', 'roncha', 'ronchas', 'erupcion', 'erupción',
      'alergia piel', 'dermatitis', 'eczema', 'urticaria',
      'granos', 'espinillas', 'acne', 'acné',
      
      // Lesiones específicas
      'lunar', 'lunares', 'mancha piel', 'manchas piel',
      'verruga', 'verrugas', 'quiste', 'bulto piel',
      
      // Condiciones específicas
      'psoriasis', 'vitiligo', 'herpes', 'hongos piel',
      'caspa', 'seborrea', 'rosácea', 'cuperosis'
    ];
    
    // 💓 SÍNTOMAS CARDIOLÓGICOS
    const sintomasCardiologia = [
      'dolor pecho', 'duele pecho', 'opresion pecho', 'opresión pecho',
      'palpitaciones', 'taquicardia', 'corazon late rapido', 'corazón late rápido',
      'arritmia', 'bradicardia', 'corazon irregular', 'corazón irregular',
      'falta aire', 'ahogo', 'disnea', 'fatiga', 'cansancio extremo',
      'mareo cardiaco', 'desmayo', 'sincope', 'síncope',
      'hinchazon piernas', 'hinchazón piernas', 'edema', 'retencion liquidos'
    ];
    
    // 🧠 SÍNTOMAS NEUROLÓGICOS
    const sintomasNeurologia = [
      'dolor cabeza', 'duele cabeza', 'cefalea', 'migrana', 'migraña',
      'jaqueca', 'dolor de cabeza intenso', 'dolor de cabeza fuerte',
      'mareo', 'mareos', 'vertigo', 'vértigo', 'inestabilidad',
      'temblor', 'temblores', 'convulsion', 'convulsión', 'epilepsia',
      'entumecimiento', 'hormigueo', 'adormecimiento', 'parestesia',
      'perdida memoria', 'pérdida memoria', 'olvido', 'confusion',
      'debilidad muscular', 'paralisis', 'parálisis'
    ];
    
    // 👂 SÍNTOMAS OTORRINOLARINGOLÓGICOS
    const sintomasOtorrino = [
      'dolor garganta', 'duele garganta', 'dolor de garganta',
      'dolor oido', 'duele oido', 'dolor de oído', 'otalgia',
      'no oigo', 'sordo', 'perdida auditiva', 'pérdida auditiva',
      'ronquera', 'afonía', 'voz ronca', 'sin voz',
      'tapado nariz', 'congestion', 'congestión', 'sinusitis',
      'sangrado nariz', 'epistaxis', 'hemorragia nasal',
      'zumbido oido', 'tinnitus', 'acufeno'
    ];
    
    // 🩺 SÍNTOMAS MEDICINA GENERAL/FAMILIAR
    const sintomasMedicinaGeneral = [
      'fiebre', 'temperatura', 'calentura', 'escalofrios', 'escalofríos',
      'malestar general', 'decaimiento', 'astenia', 'cansancio general',
      'nausea', 'náusea', 'vomito', 'vómito', 'gastritis',
      'dolor estomago', 'dolor de estómago', 'dolor abdominal',
      'diarrea', 'estreñimiento', 'constipacion', 'constipación',
      'tos', 'tos seca', 'tos con flemas', 'gripe', 'resfriado',
      'dolor muscular', 'dolor articular', 'artralgia', 'mialgia'
    ];
    
    // 🔍 VERIFICACIÓN JERÁRQUICA CON PRIORIDADES MÉDICAS
    
    // 1. MÁXIMA PRIORIDAD: Síntomas oftalmológicos
    for (const sintoma of sintomasOftalmologia) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma oftalmológico detectado: "${sintoma}"`);
        return 'Oftalmología';
      }
    }
    
    // 2. Síntomas cardiológicos (urgentes)
    for (const sintoma of sintomasCardiologia) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma cardiológico detectado: "${sintoma}"`);
        return 'Cardiología';
      }
    }
    
    // 3. Síntomas neurológicos
    for (const sintoma of sintomasNeurologia) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma neurológico detectado: "${sintoma}"`);
        return 'Neurología';
      }
    }
    
    // 4. Síntomas otorrinolaringológicos
    for (const sintoma of sintomasOtorrino) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma otorrino detectado: "${sintoma}"`);
        return 'Otorrinolaringología';
      }
    }
    
    // 5. Síntomas dermatológicos (después de descartar ojos)
    for (const sintoma of sintomasDermatologia) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma dermatológico detectado: "${sintoma}"`);
        return 'Dermatología';
      }
    }
    
    // 6. Medicina general como último recurso
    for (const sintoma of sintomasMedicinaGeneral) {
      if (textoLimpio.includes(sintoma)) {
        console.log(`🎯 Síntoma general detectado: "${sintoma}"`);
        return 'Medicina Familiar';
      }
    }
    
    console.log(`❓ No se detectó especialidad específica para: "${text}"`);
    return null;
  }

  function generarRespuestaEmpatica(texto, especialidad) {
    const textoLimpio = texto.toLowerCase();
    
    // 👁️ Respuestas específicas para oftalmología
    if (especialidad === 'Oftalmología') {
      if (textoLimpio.includes('pican') || textoLimpio.includes('picazon') || textoLimpio.includes('picazón')) {
        return "Entiendo que la picazón en los ojos es muy molesta.";
      }
      if (textoLimpio.includes('borroso') || textoLimpio.includes('veo mal')) {
        return "La visión borrosa puede ser preocupante, es importante revisarla.";
      }
      if (textoLimpio.includes('rojo') || textoLimpio.includes('irritado')) {
        return "Los ojos rojos e irritados necesitan atención especializada.";
      }
      if (textoLimpio.includes('dolor')) {
        return "El dolor ocular no debe ignorarse, te ayudo a encontrar atención.";
      }
      return "Los problemas oculares requieren evaluación especializada.";
    }
    
    // 💓 Respuestas para cardiología
    if (especialidad === 'Cardiología') {
      if (textoLimpio.includes('pecho')) {
        return "El dolor de pecho requiere evaluación médica urgente.";
      }
      if (textoLimpio.includes('palpitaciones')) {
        return "Las palpitaciones pueden ser preocupantes, es importante evaluarlas.";
      }
      return "Los síntomas cardíacos necesitan atención especializada.";
    }
    
    // 🧠 Respuestas para neurología
    if (especialidad === 'Neurología') {
      if (textoLimpio.includes('cabeza')) {
        return "Los dolores de cabeza persistentes merecen evaluación neurológica.";
      }
      if (textoLimpio.includes('mareo')) {
        return "Los mareos pueden tener varias causas, es importante evaluarlos.";
      }
      return "Los síntomas neurológicos requieren atención especializada.";
    }
    
    // 🏥 Respuesta genérica
    return `Es importante que evalúes estos síntomas con un especialista.`;
  }

  function getRespuestaEspecificaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    // 🍕 Comida y restaurantes
    if (textoLimpio.includes('pizza') || textoLimpio.includes('hamburguesa') || 
        textoLimpio.includes('comida') || textoLimpio.includes('restaurant') ||
        textoLimpio.includes('comer') || textoLimpio.includes('hambre')) {
      return [
        "¡Me da hambre solo de escucharte! 🍕 Pero soy tu asistente médico, no delivery 😄\n\n¿Cómo está tu salud? ¿Tienes algún síntoma o necesitas ver algún especialista?",
        "¡Qué rico! 🍽️ Pero yo me especializo en otro tipo de 'alimentación': ¡cuidar tu salud!\n\n¿Hay algo médico en lo que pueda ayudarte?",
        "Para eso mejor usa una app de delivery 📱🍕 Yo soy experto en encontrar médicos, no pizza!\n\n¿Cómo te sientes hoy? ¿Necesitas alguna consulta médica?"
      ];
    }
    
    // 🕐 Hora y tiempo
    if (textoLimpio.includes('hora') || textoLimpio.includes('dia')) {
      return [
        "No soy un reloj, ¡pero sí soy tu asistente médico! ⏰👩‍⚕️\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte?",
        "Para eso mejor mira tu celular 📱 Yo me especializo en horarios médicos.\n\n¿Necesitas algún especialista o tienes síntomas?"
      ];
    }
    
    // 🎵 Entretenimiento
    if (textoLimpio.includes('musica') || textoLimpio.includes('cancion') || 
        textoLimpio.includes('pelicula') || textoLimpio.includes('serie')) {
      return [
        "¡Me gusta el entretenimiento! 🎵 Pero mi show favorito es ayudarte con tu salud 🩺\n\n¿Cómo te sientes hoy?",
        "Para eso mejor usa Spotify o Netflix 📺 Yo soy tu asistente médico personal.\n\n¿Hay algún tema de salud en el que pueda ayudarte?"
      ];
    }
    
    // ⚽ Deportes
    if (textoLimpio.includes('futbol') || textoLimpio.includes('deporte') || 
        textoLimpio.includes('partido')) {
      return [
        "¡Los deportes son geniales para la salud! ⚽💪 Hablando de salud...\n\n¿Cómo te sientes? ¿Necesitas algún chequeo médico?",
        "Mi deporte favorito es mantener a las personas sanas 🏃‍♀️🩺\n\n¿Hay algo médico en lo que pueda ayudarte?"
      ];
    }
    
    // 🌤️ Clima
    if (textoLimpio.includes('clima') || textoLimpio.includes('tiempo') || 
        textoLimpio.includes('lluvia')) {
      return [
        "Para el clima mejor checa una app meteorológica ☀️🌧️ Yo me enfoco en el clima de tu salud.\n\n¿Cómo te sientes hoy?",
        "¡Espero que sea un buen día para cuidar tu salud! 🌟🩺\n\n¿Hay algún síntoma que te preocupe?"
      ];
    }
    
    // 🛍️ Compras y precios
    if (textoLimpio.includes('precio') || textoLimpio.includes('costo') || 
        textoLimpio.includes('comprar') || textoLimpio.includes('tienda')) {
      return [
        "No manejo precios de productos, ¡pero sí el valor de tu salud! 💰🩺\n\n¿En qué puedo ayudarte médicamente?",
        "Para compras mejor usa otra app 🛒 Yo te ayudo a 'comprar' tiempo con un médico rápido.\n\n¿Qué especialista necesitas?"
      ];
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
  // 🗄️ FUNCIONES DE AIRTABLE COMPLETAS
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