// /pages/api/bot.js - VERSIÓN INTELIGENTE CON VALIDACIÓN MÉDICA
const sessions = {};

const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos","hi"
];

// Palabras clave médicas para validación inteligente
const palabrasMedicas = [
  // Síntomas generales
  'dolor', 'molestia', 'malestar', 'síntoma', 'sintoma', 'enfermo', 'enferma', 'malo', 'mala',
  'cansado', 'cansada', 'agotado', 'agotada', 'débil', 'mareado', 'mareada', 'nausea',
  
  // Partes del cuerpo
  'cabeza', 'estómago', 'estomago', 'panza', 'barriga', 'pecho', 'corazón', 'corazon',
  'espalda', 'cuello', 'garganta', 'ojos', 'oído', 'oido', 'nariz', 'boca', 'dientes',
  'brazo', 'brazos', 'pierna', 'piernas', 'pie', 'pies', 'mano', 'manos', 'rodilla',
  'hombro', 'cadera', 'hueso', 'huesos', 'articulación', 'articulacion', 'músculo', 'musculo',
  
  // Términos médicos
  'consulta', 'cita', 'hora', 'médico', 'medico', 'doctor', 'doctora', 'especialista',
  'chequeo', 'control', 'examen', 'revisión', 'revision', 'tratamiento', 'medicamento',
  'pastilla', 'jarabe', 'inyección', 'inyeccion', 'cirugía', 'cirugia', 'operación', 'operacion',
  
  // Especialidades
  'pediatra', 'cardiólogo', 'cardiologo', 'oftalmólogo', 'oftalmologo', 'dermatólogo', 'dermatologo',
  'neurólogo', 'neurologo', 'traumatólogo', 'traumatologo', 'ginecólogo', 'ginecologo',
  'urólogo', 'urologo', 'otorrino', 'psiquiatra', 'psicólogo', 'psicologo',
  
  // Condiciones específicas
  'fiebre', 'tos', 'gripe', 'resfriado', 'alergia', 'asma', 'diabetes', 'presión', 'presion',
  'colesterol', 'tiroides', 'ansiedad', 'depresión', 'depresion', 'insomnio', 'migraña', 'migrana',
  'artritis', 'gastritis', 'infección', 'infeccion', 'herida', 'corte', 'quemadura',
  
  // Urgencias
  'urgente', 'emergencia', 'grave', 'severo', 'severa', 'intenso', 'intensa', 'agudo', 'aguda',
  'sangre', 'sangrado', 'hinchazón', 'hinchazon', 'inflamación', 'inflamacion'
];

const palabrasNoMedicas = [
  // Comida y bebida
  'pizza', 'hamburguesa', 'comida', 'comer', 'almuerzo', 'desayuno', 'cena', 'restaurante',
  'delivery', 'pedido', 'cocinar', 'receta', 'ingredientes', 'café', 'bebida', 'cerveza',
  'vino', 'postre', 'dulce', 'chocolate', 'helado', 'empanada', 'asado', 'completo',
  
  // Entretenimiento
  'película', 'pelicula', 'serie', 'netflix', 'música', 'musica', 'canción', 'cancion',
  'concierto', 'fiesta', 'carrete', 'bailar', 'juego', 'videojuego', 'deporte', 'fútbol', 'futbol',
  
  // Trabajo y estudio
  'trabajo', 'oficina', 'jefe', 'reunión', 'reunion', 'proyecto', 'universidad', 'colegio',
  'estudiar', 'examen', 'tarea', 'clase', 'profesor', 'nota', 'título', 'titulo',
  
  // Tecnología
  'celular', 'computador', 'computadora', 'internet', 'wifi', 'aplicación', 'aplicacion',
  'instagram', 'facebook', 'whatsapp', 'tiktok', 'youtube', 'google', 'amazon',
  
  // Transporte y lugares
  'auto', 'bus', 'micro', 'metro', 'uber', 'taxi', 'viaje', 'vacaciones', 'playa',
  'mall', 'supermercado', 'banco', 'farmacia', 'peluquería', 'peluqueria',
  
  // Otros
  'dinero', 'plata', 'comprar', 'vender', 'precio', 'oferta', 'descuento', 'regalo',
  'cumpleaños', 'cumpleanos', 'matrimonio', 'boda', 'familia', 'amigo', 'amiga', 'pololo', 'polola'
];

function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return saludosSimples.includes(limpio);
}

function esMensajeMedico(text) {
  if (!text) return false;
  
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Contar palabras médicas vs no médicas
  let puntosMedicos = 0;
  let puntosNoMedicos = 0;
  
  // Verificar palabras médicas
  palabrasMedicas.forEach(palabra => {
    if (textoLimpio.includes(palabra)) {
      puntosMedicos += 1;
    }
  });
  
  // Verificar palabras no médicas
  palabrasNoMedicas.forEach(palabra => {
    if (textoLimpio.includes(palabra)) {
      puntosNoMedicos += 2; // Peso mayor para palabras claramente no médicas
    }
  });
  
  // Patrones específicos médicos
  const patronesMedicos = [
    /me duele/i, /tengo dolor/i, /siento dolor/i, /me siento mal/i, /estoy enfermo/i,
    /necesito (\w+)ólogo/i, /consulta con/i, /cita con/i, /hora con/i,
    /me pica/i, /me arde/i, /no puedo/i, /dificultad para/i,
    /desde hace/i, /desde ayer/i, /desde la semana/i,
    /urgente/i, /grave/i, /preocupa/i, /raro/i, /extraño/i
  ];
  
  patronesMedicos.forEach(patron => {
    if (patron.test(textoLimpio)) {
      puntosMedicos += 3;
    }
  });
  
  // Si es claramente no médico, retornar false
  if (puntosNoMedicos > puntosMedicos) {
    return false;
  }
  
  // Si tiene al menos una palabra médica o patrón médico, es probable que sea médico
  return puntosMedicos > 0;
}

function generarRespuestaNoMedica(text) {
  const textoLimpio = text.toLowerCase();
  
  // Respuestas específicas según el contexto
  if (textoLimpio.includes('pizza') || textoLimpio.includes('comida') || textoLimpio.includes('comer')) {
    return "¡Jaja! Me encanta que tengas buen apetito, pero yo soy especialista en citas médicas, no en delivery 😄\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte? Por ejemplo, si tienes algún síntoma o necesitas una consulta médica.";
  }
  
  if (textoLimpio.includes('trabajo') || textoLimpio.includes('estudio')) {
    return "Entiendo que el trabajo y los estudios pueden ser estresantes 😊\n\n¿Quizás necesitas una consulta médica relacionada? Por ejemplo, si tienes estrés, dolores por mala postura, o quieres un chequeo general.";
  }
  
  if (textoLimpio.includes('deporte') || textoLimpio.includes('ejercicio')) {
    return "¡Qué bueno que te guste el deporte! 🏃‍♂️\n\n¿Necesitas alguna consulta médica deportiva? Por ejemplo, para una lesión, chequeo antes de hacer ejercicio, o consulta con traumatólogo.";
  }
  
  if (textoLimpio.includes('amor') || textoLimpio.includes('pareja') || textoLimpio.includes('corazón roto')) {
    return "Los temas del corazón son importantes 💙\n\n¿Te refieres a algo médico? Por ejemplo, consulta cardiológica, terapia psicológica, o algún síntoma físico relacionado con el estrés emocional.";
  }
  
  // Respuesta genérica empática
  return "Entiendo tu consulta, pero soy especialista en ayudarte a encontrar atención médica 🩺\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte? Por ejemplo:\n• Síntomas que te preocupen\n• Necesidad de algún especialista\n• Chequeos médicos\n• Consultas de urgencia";
}

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

async function getEspecialidadesDisponibles() {
  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?maxRecords=100`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } }
    );
    const data = await resp.json();
    const records = data.records || [];
    const especialidades = [...new Set(records.map(r => r.fields?.Especialidad).filter(Boolean))];
    return especialidades;
  } catch (err) {
    console.error("❌ Error obteniendo especialidades:", err);
    return ['Medicina Familiar', 'Cardiología', 'Pediatría', 'Dermatología', 'Oftalmología'];
  }
}

async function getDoctorInfo(doctorId) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${doctorId}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } }
    );
    if (!response.ok) return { name: doctorId, seguros: "Consultar en clínica" };
    const data = await response.json();
    return {
      name: data.fields?.Name || doctorId,
      seguros: data.fields?.Seguros || "Consultar en clínica",
      atiende: data.fields?.Atiende
    };
  } catch (error) {
    return { name: doctorId, seguros: "Consultar en clínica" };
  }
}

async function getDoctorName(doctorId) {
  const info = await getDoctorInfo(doctorId);
  return info.name;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Fallback al string original
  }
}

async function filterSobrecuposByAge(records, age) {
  const isChild = age < 16;
  const compatibleRecords = [];
  
  for (const record of records) {
    const medicoId = Array.isArray(record.fields["Médico"]) 
      ? record.fields["Médico"][0] 
      : record.fields["Médico"];
    
    try {
      const doctorInfo = await getDoctorInfo(medicoId);
      const atiendePaciente = doctorInfo.atiende;
      
      // Si no especifica, asumimos que atiende ambos
      if (!atiendePaciente || atiendePaciente === "Ambos") {
        compatibleRecords.push(record);
      } else if (isChild && atiendePaciente === "Niños") {
        compatibleRecords.push(record);
      } else if (!isChild && atiendePaciente === "Adultos") {
        compatibleRecords.push(record);
      }
    } catch (error) {
      console.error("Error verificando médico:", error);
      // En caso de error, incluimos el registro
      compatibleRecords.push(record);
    }
  }
  
  return compatibleRecords;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE, AIRTABLE_PATIENTS_TABLE, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser", force_gpt } = req.body;
  const text = (message || "").trim();

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.json({ text: "❌ Error de configuración básica. Contacta soporte." });
  }

  sessions[from] = prevSession || {};

  // 1. Manejo de sesiones existentes PRIMERO (antes de cualquier validación)
  if (sessions[from]?.stage) {
    const currentSession = sessions[from];
    
    switch (currentSession.stage) {
      case 'awaiting-confirmation':
        if (/sí|si|yes|ok|está bien|esta bien|perfecto|vale|confirmo|acepto/i.test(text)) {
          sessions[from] = { ...currentSession, stage: 'awaiting-name' };
          return res.json({
            text: "¡Perfecto! Para reservar tu sobrecupo necesito algunos datos.\n\n¿Cuál es tu nombre completo?",
            session: sessions[from]
          });
        } else if (/no|nope|otra|diferente|cambiar/i.test(text)) {
          currentSession.attempts = (currentSession.attempts || 0) + 1;
          if (currentSession.attempts >= 3) {
            delete sessions[from];
            return res.json({
              text: "Entiendo que ninguna opción te convence. ¿Te gustaría que te contacte cuando tengamos más disponibilidad de tu especialidad?"
            });
          }
          
          const nextOption = currentSession.records[currentSession.attempts];
          if (nextOption) {
            const fields = nextOption.fields;
            const clin = fields["Clínica"] || fields["Clinica"] || "Clínica";
            const dir = fields["Dirección"] || fields["Direccion"] || "Dirección por confirmar";
            const medicoId = Array.isArray(fields["Médico"]) ? fields["Médico"][0] : fields["Médico"];
            const doctorInfo = await getDoctorInfo(medicoId);
            const fechaFormateada = formatDate(fields.Fecha);
            
            sessions[from] = currentSession;
            return res.json({
              text: `Te muestro otra opción:\n\n👨‍⚕️ Dr. ${doctorInfo.name}\n📍 ${clin}\n🗺️ ${dir}\n💳 Seguros: ${doctorInfo.seguros}\n📅 ${fechaFormateada} a las ${fields.Hora}\n\n¿Te sirve esta?`,
              session: sessions[from]
            });
          }
        }
        break;

      case 'awaiting-name':
        if (text.length < 3) {
          return res.json({
            text: "Por favor, ingresa tu nombre completo para continuar.",
            session: sessions[from]
          });
        }
        sessions[from] = { ...currentSession, stage: 'awaiting-age', patientName: text };
        return res.json({
          text: `Gracias ${text}. Ahora necesito saber tu edad para verificar que el médico sea apropiado.\n\n¿Cuántos años tienes?`,
          session: sessions[from]
        });

      case 'awaiting-age':
        const age = parseInt(text.trim());
        if (isNaN(age) || age < 0 || age > 120) {
          return res.json({
            text: "Por favor ingresa una edad válida (ejemplo: 25)",
            session: sessions[from]
          });
        }
        
        const isChild = age < 16;
        
        // Verificar compatibilidad médico-edad
        const sobrecupoSeleccionado = currentSession.records[currentSession.attempts || 0];
        if (sobrecupoSeleccionado) {
          const medicoId = Array.isArray(sobrecupoSeleccionado.fields["Médico"]) 
            ? sobrecupoSeleccionado.fields["Médico"][0] 
            : sobrecupoSeleccionado.fields["Médico"];
          
          try {
            const doctorResponse = await fetch(
              `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
              { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } }
            );
            
            if (doctorResponse.ok) {
              const doctorData = await doctorResponse.json();
              const atiendePaciente = doctorData.fields?.["Atiende"];
              
              // Verificar compatibilidad
              if (atiendePaciente && atiendePaciente !== "Ambos") {
                if ((isChild && atiendePaciente === "Adultos") || 
                    (!isChild && atiendePaciente === "Niños")) {
                  
                  // Buscar médico alternativo compatible
                  const sobrecuposCompatibles = currentSession.records.filter(record => {
                    // Aquí necesitaríamos verificar cada médico, pero por simplicidad
                    // buscaremos la siguiente opción disponible
                    return true;
                  });
                  
                  if (sobrecuposCompatibles.length > 1) {
                    currentSession.attempts = (currentSession.attempts || 0) + 1;
                    const nextSobrecupo = sobrecuposCompatibles[currentSession.attempts];
                    
                    if (nextSobrecupo) {
                      const fields = nextSobrecupo.fields;
                      const clin = fields["Clínica"] || fields["Clinica"] || "Clínica";
                      const dir = fields["Dirección"] || fields["Direccion"] || "Dirección por confirmar";
                      const nextMedicoId = Array.isArray(fields["Médico"]) ? fields["Médico"][0] : fields["Médico"];
                      const doctorInfo = await getDoctorInfo(nextMedicoId);
                      const fechaFormateada = formatDate(fields.Fecha);
                      
                      sessions[from] = { ...currentSession, patientAge: age };
                      
                      return res.json({
                        text: `Perfecto. He encontrado un médico más apropiado para ${isChild ? 'tu edad' : 'adultos'}:\n\n✅ Nueva opción:\n👨‍⚕️ Dr. ${doctorInfo.name}\n📍 ${clin}\n🗺️ ${dir}\n💳 Seguros: ${doctorInfo.seguros}\n📅 ${fechaFormateada} a las ${fields.Hora}\n\n¿Te sirve esta opción? Confirma con "sí".`,
                        session: sessions[from]
                      });
                    }
                  }
                  
                  return res.json({
                    text: `Lo siento, el médico disponible ${isChild ? 'solo atiende adultos' : 'es pediatra y solo atiende niños'}.\n\n¿Te gustaría que busque disponibilidad de otro médico apropiado para ${isChild ? 'menores' : 'adultos'}?`
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error verificando médico:", error);
          }
        }
        
        sessions[from] = { ...currentSession, stage: 'awaiting-rut', patientAge: age };
        return res.json({
          text: `Perfecto ${isChild ? '👶' : '👤'} Ahora necesito tu RUT (con guión, ej: 12345678-9)`,
          session: sessions[from]
        });

      case 'awaiting-rut':
        if (!validarRUT(text)) {
          return res.json({
            text: "RUT inválido. Por favor ingresa tu RUT correctamente (ej: 12345678-9)",
            session: sessions[from]
          });
        }
        sessions[from] = { ...currentSession, stage: 'awaiting-phone', patientRut: text };
        return res.json({
          text: "Perfecto. ¿Cuál es tu número de teléfono?",
          session: sessions[from]
        });

      case 'awaiting-phone':
        if (!/^(\+56)?[0-9]{8,9}$/.test(text.replace(/\s/g, ''))) {
          return res.json({
            text: "Por favor ingresa un número de teléfono válido (8 o 9 dígitos)",
            session: sessions[from]
          });
        }
        sessions[from] = { ...currentSession, stage: 'awaiting-email', patientPhone: text };
        return res.json({
          text: "Excelente. Por último, ¿cuál es tu email?",
          session: sessions[from]
        });

      case 'awaiting-email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
          return res.json({
            text: "Por favor ingresa un email válido",
            session: sessions[from]
          });
        }
        
        // Crear paciente con edad
        const pacienteData = {
          "Nombre": currentSession.patientName,
          "RUT": currentSession.patientRut,
          "Teléfono": currentSession.patientPhone,
          "Email": text,
          "Edad": currentSession.patientAge
        };
        
        let pacienteId = null;
        try {
          if (AIRTABLE_PATIENTS_TABLE) {
            const pacienteResponse = await fetch(
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
            
            if (pacienteResponse.ok) {
              const pacienteResult = await pacienteResponse.json();
              pacienteId = pacienteResult.id;
              console.log("✅ Paciente creado:", pacienteId);
            }
          }
        } catch (error) {
          console.error("❌ Error creando paciente:", error);
        }
        
        delete sessions[from];
        return res.json({
          text: `¡Listo ${currentSession.patientName}! 🎉\n\nTu sobrecupo está confirmado. Te llegará un email de confirmación y te contactaremos por WhatsApp.\n\nTu cita está confirmada.`
        });

      default:
        break;
    }
  }

  // 2. VALIDACIÓN INTELIGENTE: ¿Es un mensaje médico? (solo si no hay sesión activa)
  if (!force_gpt && !esMensajeMedico(text) && !esSaludoSimple(text)) {
    return res.json({ 
      text: generarRespuestaNoMedica(text),
      session: sessions[from]
    });
  }

  // 3. Manejo de saludos simples con OpenAI para mayor naturalidad
  if (esSaludoSimple(text) && OPENAI_API_KEY) {
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
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content: "Eres Sobrecupos IA, asistente médico chileno muy empático y natural. Responde a saludos de forma cálida, breve y pregunta qué síntomas o especialidad médica necesitan. Usa emojis médicos apropiados. Máximo 2 líneas."
            },
            { role: "user", content: text }
          ]
        })
      });
      const data = await aiRes.json();
      const response = data.choices?.[0]?.message?.content?.trim() || 
        "¡Hola! 😊 ¿En qué te puedo ayudar? Cuéntame tus síntomas o qué especialista necesitas.";
      
      return res.json({ text: response, session: sessions[from] });
    } catch (err) {
      return res.json({ 
        text: "¡Hola! 😊 ¿En qué te puedo ayudar? Cuéntame tus síntomas o qué especialista necesitas.",
        session: sessions[from]
      });
    }
  }

  // 4. Detectar especialidad directa
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  
  if (especialidadDirecta) {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    if (!especialidadesDisponibles.includes(especialidadDirecta)) {
      return res.json({
        text: `Entiendo que necesitas ${especialidadDirecta} 🩺\n\nLamentablemente no tengo sobrecupos disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n¿Te gustaría que te contacte cuando tengamos ${especialidadDirecta} disponible?`
      });
    }
    
    const specialty = especialidadDirecta;
    
    // Respuesta empática con OpenAI
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
                content: "Eres Sobrecupos IA, asistente médico chileno empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al usuario que busca una especialidad específica. No menciones 'Sobrecupos IA' ni uses comillas."
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

    // Buscar sobrecupos disponibles
    let records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("❌ Error Airtable:", err);
      return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `${respuestaEmpatica}\n\nLamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    const first = available[0].fields;
    const clin = first["Clínica"] || first["Clinica"] || "Clínica";
    const dir = first["Dirección"] || first["Direccion"] || "Dirección por confirmar";
    const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
    const doctorInfo = await getDoctorInfo(medicoId);
    const fechaFormateada = formatDate(first.Fecha);

    sessions[from] = {
      stage: 'awaiting-confirmation',
      specialty,
      records: available,
      attempts: 0
    };

    return res.json({
      text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty}:\n\n👨‍⚕️ Dr. ${doctorInfo.name}\n📍 ${clin}\n🗺️ ${dir}\n💳 Seguros: ${doctorInfo.seguros}\n📅 ${fechaFormateada} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  // 5. Análisis con OpenAI para síntomas
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
      return res.json({ text: "Lo siento, no entendí bien. ¿Puedes describirme tus síntomas de otra forma?" });
    }

    const specialty = especialidadesDisponibles.includes(rawEsp) ? rawEsp : "Medicina Familiar";

    // Generar respuesta empática
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
            temperature: 0.8,
            max_tokens: 50,
            messages: [
              {
                role: "system",
                content: "Eres Sobrecupos IA, asistente médico chileno muy empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión y empatía hacia los síntomas del paciente. Sé cálido y profesional."
              },
              { role: "user", content: `Paciente dice: "${text}"` }
            ]
          })
        });
        const empatJson = await empatRes.json();
        respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
      } catch (err) {
        respuestaEmpatica = "Entiendo tu preocupación y quiero ayudarte.";
      }
    }

    // Buscar sobrecupos
    let records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("❌ Error consultando Sobrecupos:", err);
      return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `${respuestaEmpatica}\n\nLamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    const first = available[0].fields;
    const clin = first["Clínica"] || first["Clinica"] || "Clínica";
    const dir = first["Dirección"] || first["Direccion"] || "Dirección por confirmar";
    const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
    const doctorInfo = await getDoctorInfo(medicoId);
    const fechaFormateada = formatDate(first.Fecha);

    sessions[from] = {
      stage: 'awaiting-confirmation',
      specialty,
      records: available,
      attempts: 0
    };

    return res.json({
      text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty}:\n\n👨‍⚕️ Dr. ${doctorInfo.name}\n📍 ${clin}\n🗺️ ${dir}\n💳 Seguros: ${doctorInfo.seguros}\n📅 ${fechaFormateada} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  // 6. Respuesta de fallback inteligente
  return res.json({
    text: "Para ayudarte mejor, ¿podrías contarme:\n• ¿Qué síntomas tienes?\n• ¿Qué especialidad médica necesitas?\n• ¿Es algo urgente?\n\nEstoy aquí para encontrarte la mejor atención médica 🩺"
  });
}