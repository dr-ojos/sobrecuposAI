// pages/api/bot.js - VERSIÓN CORREGIDA Y OPTIMIZADA
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

  // 🔥 CORRECCIÓN CRÍTICA: Resetear sesión automáticamente después de tiempo
  const currentTime = Date.now();
  const sessionTimeout = 10 * 60 * 1000; // 10 minutos
  
  let currentSession = sessions[from] || prevSession || {};
  
  if (currentSession.lastActivity && (currentTime - currentSession.lastActivity) > sessionTimeout) {
    console.log(`🕐 Sesión expirada para ${from}, reseteando...`);
    currentSession = {};
    sessions[from] = {};
  }

  // Actualizar timestamp de actividad
  currentSession.lastActivity = currentTime;

  // === MANEJO DE SALUDOS SIMPLES ===
  if (saludoSimpleRe.test(text)) {
    // Resetear sesión en saludos
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
    // 🍕 Respuestas específicas y divertidas según el tipo de consulta
    const respuestasEspecificas = getRespuestaEspecificaNoMedica(text);
    
    if (respuestasEspecificas.length > 0) {
      const respuestaAleatoria = respuestasEspecificas[Math.floor(Math.random() * respuestasEspecificas.length)];
      return res.json({ text: respuestaAleatoria });
    }
    
    // Respuestas generales como fallback
    const respuestasGenerales = [
      "Soy tu asistente médico especializado 👩‍⚕️\n\n¿Cómo te sientes hoy? Cuéntame si tienes algún síntoma o necesitas algún especialista.",
      "Mi especialidad es cuidar tu salud 🩺\n\n¿Hay algo médico en lo que pueda ayudarte? Por ejemplo síntomas, chequeos o especialistas que necesites.",
      "Estoy aquí para temas de salud 😊\n\n¿Cómo puedo ayudarte médicamente hoy? Cuéntame tus síntomas o qué especialista buscas."
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

  // ===============================
  // 🍕 FUNCIÓN PARA RESPUESTAS ESPECÍFICAS NO MÉDICAS
  // ===============================

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

  // === DETECCIÓN INTELIGENTE DE ESPECIALIDADES ===
  
  // 1. Especialidad directa (ej: "necesito oftalmólogo")
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  if (especialidadDirecta) {
    return await buscarYResponderSobrecupos(especialidadDirecta, text, from, res);
  }

  // 2. Síntomas que mapean a especialidades (ej: "veo borroso")
  const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
  if (especialidadPorSintomas) {
    return await buscarYResponderSobrecupos(especialidadPorSintomas, text, from, res, true);
  }

  // === RESPUESTA POR DEFECTO MEJORADA ===
  const especialidadesDisponibles = await getEspecialidadesDisponibles();
  const especialidadesTexto = especialidadesDisponibles.slice(0, 6).join(', ');
  
  return res.json({
    text: `Te puedo ayudar a encontrar sobrecupos médicos 🩺\n\nCuéntame:\n• ¿Qué síntomas tienes?\n• ¿Qué especialista necesitas?\n\nEspecialidades disponibles: ${especialidadesTexto}\n\nEjemplo: "Necesito oftalmólogo" o "Tengo dolor de cabeza"`
  });

  // ===============================
  // 🛠️ FUNCIONES AUXILIARES MEJORADAS
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
      
      if (nextAttempt < records.length && nextAttempt < 3) { // Máximo 3 opciones
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
        // Se acabaron las opciones
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
    
    // Procesar reserva final
    return await procesarReservaFinal(session, edad, userId, response);
  }

  async function procesarReservaFinal(session, edad, userId, response) {
    const { selectedRecord, patientName, patientPhone, patientRUT, specialty } = session;
    
    try {
      console.log("🏥 Iniciando proceso de reserva final...");
      
      // 1. Crear paciente en Airtable
      const pacienteId = await crearPaciente({
        name: patientName,
        phone: patientPhone,
        rut: patientRUT,
        age: edad
      });
      
      // 2. Actualizar sobrecupo como reservado
      const sobrecupoActualizado = await actualizarSobrecupo(selectedRecord.id, pacienteId, patientName);
      
      // 3. Obtener información del médico
      const medicoInfo = await getDoctorInfo(selectedRecord.fields["Médico"]);
      
      // 4. Limpiar sesión
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
      // Generar respuesta empática si es síntoma
      let respuestaEmpatica = "";
      if (esSintoma && OPENAI_API_KEY) {
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

      // Buscar sobrecupos disponibles
      const records = await buscarSobrecupos(specialty);
      
      if (records.length === 0) {
        const mensaje = esSintoma 
          ? `${respuestaEmpatica}\n\nPor tus síntomas, recomiendo consultar con ${specialty}.\n\nActualmente no tengo sobrecupos disponibles. ¿Te gustaría que te contacte cuando haya disponibilidad?`
          : `No tengo sobrecupos de ${specialty} disponibles ahora.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`;
        
        return response.json({ text: mensaje });
      }

      // Mostrar primera opción
      const first = records[0].fields;
      const medicoNombre = await getDoctorName(first["Médico"]);
      
      sessions[userId] = {
        stage: 'awaiting-confirmation',
        specialty,
        records,
        selectedRecord: records[0],
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

  // === FUNCIONES DE DETECCIÓN ===

  function esConsultaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    // 🍕 CONSULTAS ESPECÍFICAS NO MÉDICAS (alta prioridad)
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
      'telefono', 'teléfono', 'contacto', 'email',
      
      // Vida cotidiana
      'trabajo', 'jefe', 'oficina', 'reunion', 'reunión',
      'universidad', 'colegio', 'estudiar', 'examen',
      'viaje', 'vacaciones', 'hotel', 'avion', 'avión',
      'dinero', 'plata', 'banco', 'credito', 'crédito',
      'auto', 'carro', 'vehiculo', 'vehículo', 'manejar',
      'casa', 'departamento', 'arriendo', 'mudanza',
      'computador', 'celular', 'telefono', 'teléfono', 'internet',
      'ropa', 'zapatos', 'comprar', 'tienda', 'mall'
    ];
    
    // 🏥 TÉRMINOS MÉDICOS QUE ANULAN LA DETECCIÓN NO MÉDICA
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
    
    // Primero verificar si contiene términos médicos (prioridad alta)
    const contieneTerminosMedicos = terminosMedicos.some(termino => 
      textoLimpio.includes(termino.toLowerCase())
    );
    
    // Si tiene términos médicos, NO es consulta no médica
    if (contieneTerminosMedicos) {
      return false;
    }
    
    // Verificar si contiene consultas específicas no médicas
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
    
    // Síntomas oftalmológicos
    const sintomasOftalmologia = [
      'vision borrosa', 'visión borrosa', 'veo borroso', 'veo mal', 'no veo bien',
      'ojo rojo', 'ojos rojos', 'irritado', 'irritados', 'ardor ojos',
      'lagrimeo', 'dolor ojos', 'duelen ojos', 'molesta luz', 'fotofobia',
      'manchas flotantes', 'moscas volantes', 'puntos negros',
      'graduacion', 'graduación', 'lentes', 'anteojos', 'revision vista'
    ];
    
    // Síntomas dermatológicos
    const sintomasDermatologia = [
      'picazon', 'picazón', 'me pica', 'comezón', 'sarpullido', 'ronchas',
      'alergia piel', 'dermatitis', 'eczema', 'lunar', 'lunares',
      'mancha piel', 'acne', 'acné', 'espinillas', 'granos'
    ];
    
    // Síntomas cardiológicos
    const sintomasCardiologia = [
      'dolor pecho', 'duele pecho', 'opresion pecho', 'palpitaciones',
      'taquicardia', 'corazon late rapido', 'falta aire', 'ahogo', 'disnea'
    ];
    
    // Síntomas neurológicos
    const sintomasNeurologia = [
      'dolor cabeza', 'duele cabeza', 'cefalea', 'migrana', 'migraña',
      'mareo', 'mareos', 'vertigo', 'vértigo', 'temblor', 'temblores'
    ];
    
    // Síntomas otorrino
    const sintomasOtorrino = [
      'dolor garganta', 'duele garganta', 'dolor oido', 'no oigo',
      'ronquera', 'afonía', 'tapado nariz', 'congestion', 'sinusitis'
    ];
    
    // Verificar cada grupo
    for (const sintoma of sintomasOftalmologia) {
      if (textoLimpio.includes(sintoma)) return 'Oftalmología';
    }
    for (const sintoma of sintomasDermatologia) {
      if (textoLimpio.includes(sintoma)) return 'Dermatología';
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
    
    return null;
  }

  // === FUNCIONES DE VALIDACIÓN ===

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

  // === FUNCIONES DE AIRTABLE ===

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

  async function buscarSobrecupos(specialty) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100&sort[0][field]=Fecha&sort[0][direction]=asc`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      
      if (!data.records) return [];
      
      return data.records.filter(record => {
        const fields = record.fields || {};
        return (
          fields.Especialidad === specialty &&
          (fields.Disponible === "Si" || fields.Disponible === true) &&
          fields.Fecha && fields.Hora
        );
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

      const record = {
        fields: {
          Nombre: patientData.name,
          Telefono: patientData.phone,
          RUT: patientData.rut,
          Edad: patientData.age,
          "Fecha Registro": new Date().toISOString().split('T')[0],
          "Registro Bot": true,
          Status: "active"
        }
      };

      console.log("📝 Creando paciente:", record);

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
        console.error("❌ Error creando paciente:", data);
        return null;
      }

      console.log("✅ Paciente creado:", data.id);
      return data.id;
    } catch (error) {
      console.error("❌ Error general creando paciente:", error);
      return null;
    }
  }

  async function actualizarSobrecupo(sobrecupoId, pacienteId, patientName) {
    try {
      const updateData = {
        fields: {
          Disponible: "No",
          "Paciente ID": pacienteId,
          "Nombre Paciente": patientName,
          "Fecha Reserva": new Date().toISOString().split('T')[0]
        }
      };

      console.log("📝 Actualizando sobrecupo:", sobrecupoId, updateData);

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
        console.error("❌ Error actualizando sobrecupo:", data);
        return false;
      }

      console.log("✅ Sobrecupo actualizado:", data.id);
      return true;
    } catch (error) {
      console.error("❌ Error general actualizando sobrecupo:", error);
      return false;
    }
  }
}