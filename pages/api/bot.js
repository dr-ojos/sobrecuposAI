// /pages/api/bot.js
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
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Esta será "Sobrecupostest"
    AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PACIENTES_TABLE,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

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
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}`,
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

  // 1) Verificar configuración
  if (![OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID, AIRTABLE_DOCTORS_TABLE, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL].every(Boolean)) {
    return res.json({ text: "❌ Error de configuración. Contacta soporte." });
  }

  // 2) Saludo inicial o saludo simple
  if (greetingRe.test(text)) {
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
    return res.json({ text: "¡De nada! Si necesitas algo más, avísame. 😊" });
  }

  // 4) Sesión activa (confirmaciones, reintentos, datos de paciente, etc.)
  let session = prevSession || sessions[from];
  if (session) {
    switch (session.stage) {
      case 'awaiting-confirmation':
        if (affirmativeRe.test(text)) {
          session.stage = 'collect-name';
          return res.json({
            text: '¡Perfecto! Para completar la reserva necesito algunos datos.\n\nPrimero, dime tu nombre completo:',
            session
          });
        } else if (negativeRe.test(text)) {
          session.attempts++;
          if (session.attempts < session.records.length) {
            const nxt = session.records[session.attempts].fields;
            const clin = nxt["Clínica"] || nxt["Clinica"] || "nuestra clínica";
            const dir = nxt["Dirección"] || nxt["Direccion"] || "la dirección indicada";
            const medicoId = Array.isArray(nxt["Médico"]) ? nxt["Médico"][0] : nxt["Médico"];
            const medicoNombre = await getDoctorName(medicoId);
            return res.json({
              text:
                `🔄 Otra opción de ${session.specialty}:\n` +
                `📍 ${clin} (${dir})\n` +
                `👨‍⚕️ Dr. ${medicoNombre}\n` +
                `🗓️ ${nxt.Fecha} a las ${nxt.Hora}\n\n` +
                `¿Te sirve? Confirma con "sí" o dime "no" para otra opción.`,
              session
            });
          } else {
            delete sessions[from];
            return res.json({ 
              text: 'Lo siento, no hay más sobrecupos disponibles para esta especialidad en este momento.\n\n¿Te gustaría que te contacte cuando tengamos nueva disponibilidad?' 
            });
          }
        } else {
          return res.json({ text: 'Por favor responde con "sí" u "no".', session });
        }

      case 'collect-name':
        session.patient = { name: text };
        session.stage = 'collect-age';
        sessions[from] = session;
        return res.json({ text: 'Gracias. Ahora dime tu edad:', session });

      case 'collect-age':
        const age = parseInt(text);
        if (isNaN(age) || age < 0 || age > 120) {
          return res.json({ text: 'Por favor ingresa una edad válida (número entre 0 y 120):', session });
        }
        session.patient.age = age;
        session.stage = 'collect-rut';
        sessions[from] = session;
        return res.json({ text: 'Perfecto. Ahora necesito tu RUT (ej: 12345678-9):', session });

      case 'collect-rut':
        if (!validarRUT(text)) {
          return res.json({ text: 'El RUT ingresado no es válido. Por favor ingresa un RUT chileno válido (ej: 12345678-9):', session });
        }
        session.patient.rut = text.replace(/[.\-]/g, '').toUpperCase();
        session.stage = 'collect-phone';
        sessions[from] = session;
        return res.json({ text: 'Excelente. Ahora tu teléfono (con código país):', session });

      case 'collect-phone':
        session.patient.phone = text;
        session.stage = 'collect-email';
        sessions[from] = session;
        return res.json({ text: 'Por último, tu email para enviarte la confirmación:', session });

      case 'collect-email':
        session.patient.email = text;
        session.stage = 'final-confirmation';
        sessions[from] = session;

        // Crear registro de paciente en tabla Pacientes
        const pacienteId = await crearPaciente({
          Nombre: session.patient.name,
          Edad: session.patient.age,
          RUT: session.patient.rut,
          Telefono: session.patient.phone,
          Email: session.patient.email,
          "Fecha Registro": new Date().toISOString().split('T')[0]
        });

        // Marcar sobrecupo como no disponible en tabla Sobrecupostest
        const chosen = session.records[session.attempts].fields;
        const chosenId = session.records[session.attempts].id;
        
        const updateFields = {
          Disponible: false,
          Nombre: session.patient.name,
          Edad: session.patient.age,
          RUT: session.patient.rut,
          Telefono: session.patient.phone,
          Email: session.patient.email
        };

        // Si se creó el paciente, añadir la relación
        if (pacienteId) {
          updateFields.Paciente = [pacienteId];
        }
        
        try {
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                fields: updateFields
              })
            }
          );
          console.log("✅ Sobrecupo actualizado en Sobrecupostest");
        } catch (err) {
          console.error("❌ Error actualizando Sobrecupostest:", err);
        }

        // Enviar email de confirmación
        const medicoId = Array.isArray(chosen["Médico"]) ? chosen["Médico"][0] : chosen["Médico"];
        const medicoNombre = await getDoctorName(medicoId);
        
        const emailPayload = {
          from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos IA" },
          personalizations: [{
            to: [{ email: session.patient.email }],
            subject: `Sobrecupo confirmado - ${session.specialty}`,
          }],
          content: [{
            type: "text/plain",
            value:
              `Hola ${session.patient.name}, tu sobrecupo ha sido confirmado.\n\n` +
              `📋 Detalles de tu cita:\n` +
              `Especialidad: ${session.specialty}\n` +
              `Clínica: ${chosen["Clínica"]||chosen["Clinica"]}\n` +
              `Dirección: ${chosen["Dirección"]||chosen["Direccion"]}\n` +
              `Médico: Dr. ${medicoNombre}\n` +
              `Fecha: ${chosen.Fecha}\n` +
              `Hora: ${chosen.Hora}\n` +
              `RUT: ${session.patient.rut}\n\n` +
              `¡Que te mejores pronto!\n` +
              `Sobrecupos IA`
          }]
        };
        
        try {
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
          });
        } catch (err) {
          console.error("❌ Error SendGrid:", err);
        }

        delete sessions[from];
        return res.json({
          text:
            `✅ ¡Listo, ${session.patient.name}! Tu sobrecupo está confirmado.\n\n` +
            `📍 ${chosen["Clínica"]||chosen["Clinica"]}\n` +
            `📍 ${chosen["Dirección"]||chosen["Direccion"]}\n` +
            `👨‍⚕️ Dr. ${medicoNombre}\n` +
            `🗓️ ${chosen.Fecha} a las ${chosen.Hora}\n\n` +
            `📧 Te envié la confirmación a ${session.patient.email}`
        });

      default:
        break;
    }
  }

  // 5) Detectar especialidad directa primero
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  
  if (especialidadDirecta) {
    console.log(`🎯 Especialidad detectada directamente: ${especialidadDirecta}`);
    
    // Obtener especialidades disponibles dinámicamente
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    // Si la especialidad NO está disponible en nuestros médicos
    if (!especialidadesDisponibles.includes(especialidadDirecta)) {
      return res.json({
        text:
          `Entiendo que estás buscando atención especializada y es completamente normal sentirse preocupado por tu salud.\n\n` +
          `Lamentablemente no tengo sobrecupos de ${especialidadDirecta} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n` +
          `¿Te gustaría que te contacte cuando tengamos ${especialidadDirecta} disponible?`
      });
    }
    
    // Si la especialidad SÍ está disponible, continuar con la búsqueda
    const specialty = especialidadDirecta;
    
    // Generar respuesta empática
    let respuestaEmpatica = "";
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
              content:
                "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al usuario que busca una especialidad específica. No menciones 'Sobrecupos IA' ni uses comillas."
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

    // Filtrar por especialidad y disponibilidad
    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text:
          `${respuestaEmpatica}\n\n` +
          `Lamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n` +
          `¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    // Mostrar primera opción disponible
    const first = available[0].fields;
    const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
    const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
    const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
    const medicoNombre = await getDoctorName(medicoId);

    sessions[from] = {
      stage: 'awaiting-confirmation',
      specialty,
      records: available,
      attempts: 0
    };

    return res.json({
      text:
        `${respuestaEmpatica}\n\n` +
        `✅ Encontré un sobrecupo de ${specialty}:\n` +
        `📍 ${clin}\n` +
        `📍 ${dir}\n` +
        `👨‍⚕️ Dr. ${medicoNombre}\n` +
        `🗓️ ${first.Fecha} a las ${first.Hora}\n\n` +
        `¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  // 6) Si no detectamos especialidad directa, usar OpenAI para analizar síntomas
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
            content:
              `Eres Sobrecupos IA, asistente médico empático. Dado un síntoma o consulta médica, responde SOLO con EXACTAMENTE una de las siguientes especialidades disponibles (y nada más): ${especialidadesString}. Elige la especialidad que con mayor probabilidad se encarga de ese síntoma. Si mencionan un niño, elige Pediatría. Si no puedes determinar una especialidad específica, elige Medicina Familiar.`
          },
          { role: "user", content: `Paciente: "${text}"` }
        ]
      })
    });
    const j = await aiRes.json();
    rawEsp = j.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("❌ Error OpenAI:", err);
    return res.json({ text: "Lo siento, no entendí. ¿Puedes describirlo de otra forma?" });
  }

  // 7) Respuesta empática al síntoma
  let respuestaEmpatica = "";
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
            content:
              "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al malestar del paciente. No menciones 'Sobrecupos IA' ni uses comillas."
          },
          { role: "user", content: `Paciente: "${text}"` }
        ]
      })
    });
    const empatJson = await empatRes.json();
    respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    respuestaEmpatica = "";
  }

  // 8) Verificar que la especialidad detectada esté disponible
  const specialty = especialidadesDisponibles.includes(rawEsp) ? rawEsp : "Medicina Familiar";

  // 9) Buscar sobrecupos en tabla Sobrecupostest
  let records = [];
  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    const data = await resp.json();
    records = data.records || [];
  } catch (err) {
    console.error("❌ Error consultando Sobrecupostest:", err);
    return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
  }

  // 10) Filtrar por especialidad y disponibilidad
  const available = records.filter(r => {
    const fields = r.fields || {};
    return (
      (fields.Especialidad === specialty) &&
      (fields.Disponible === "Si" || fields.Disponible === true)
    );
  });

  if (available.length === 0) {
    return res.json({
      text:
        `${respuestaEmpatica ? respuestaEmpatica + '\n\n' : ''}` +
        `Lo siento, no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n` +
        `¿Te gustaría que te contacte cuando tengamos disponibilidad?`
    });
  }

  // 11) Mostrar primera opción
  const first = available[0].fields;
  const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
  const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
  const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
  const medicoNombre = await getDoctorName(medicoId);

  sessions[from] = {
    stage: 'awaiting-confirmation',
    specialty,
    records: available,
    attempts: 0
  };

  return res.json({
    text:
      `${respuestaEmpatica ? respuestaEmpatica + '\n\n' : ''}` +
      `✅ Encontré un sobrecupo de ${specialty}:\n` +
      `📍 ${clin}\n` +
      `📍 ${dir}\n` +
      `👨‍⚕️ Dr. ${medicoNombre}\n` +
      `🗓️ ${first.Fecha} a las ${first.Hora}\n\n` +
      `¿Te sirve? Confirma con "sí".`,
    session: sessions[from]
  });
}