// pages/api/bot.js - CÓDIGO COMPLETO CORREGIDO SIN VARIABLES DUPLICADAS

const sessions = {};

export default async function handler(req, res) {
  const { 
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.status(500).json({ error: "Configuración de servidor incompleta" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST permitido' });
  }

  const { message: text, from, prevSession } = req.body;

  if (!from || !text) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  console.log(`📱 [${from}] Mensaje: "${text}"`);

  // Validación RUT chileno
  function validarRUT(rut) {
    if (!/^\d{7,8}-[\dkK]$/.test(rut)) return false;
    const [numero, dv] = rut.split('-');
    const suma = numero.split('').reverse().reduce((acc, digit, i) => {
      const multiplicador = i < 6 ? i + 2 : 2;
      return acc + parseInt(digit) * multiplicador;
    }, 0);
    const dvCalculado = 11 - (suma % 11);
    let dvEsperado;
    if (dvCalculado === 11) dvEsperado = '0';
    else if (dvCalculado === 10) dvEsperado = 'K';
    else dvEsperado = dvCalculado.toString();
    return dv.toUpperCase() === dvEsperado;
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

  function esConsultaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const consultasGenerales = [
      'que hora es', 'qué hora es', 'hora es', 'que dia es', 'qué día es',
      'como estas', 'cómo estás', 'como te llamas', 'cómo te llamas',
      'quien eres', 'quién eres', 'que eres', 'qué eres',
      'donde estas', 'dónde estás', 'de donde eres', 'de dónde eres'
    ];
    
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
    
    const contieneTemasCotidianos = temasCotidianos.some(tema => textoLimpio.includes(tema));
    
    const terminosMedicos = [
      'dolor', 'duele', 'molestia', 'sintoma', 'síntoma', 'vision', 'visión', 
      'ojo', 'ojos', 'cabeza', 'pecho', 'estomago', 'estómago', 'fiebre', 
      'mareo', 'nausea', 'náusea', 'cansancio', 'fatiga', 'tos', 
      'gripe', 'resfrio', 'resfrío', 'alergia', 'picazon', 'picazón',
      'medico', 'médico', 'doctor', 'consulta', 'cita', 'salud'
    ];
    
    const contieneMedico = terminosMedicos.some(termino => textoLimpio.includes(termino));
    
    return contieneTemasCotidianos && !contieneMedico;
  }

  function esSaludoSimple(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const saludosSimples = ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'ey'];
    const terminosMedicos = ['dolor', 'duele', 'medico', 'doctor', 'consulta', 'sintoma', 'necesito'];
    
    const esSaludo = saludosSimples.some(saludo => textoLimpio.includes(saludo));
    const tieneMedico = terminosMedicos.some(termino => textoLimpio.includes(termino));
    
    return esSaludo && !tieneMedico && textoLimpio.length < 50;
  }

  function detectarEspecialidadPorSintomas(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const sintomasEspecialidades = {
      'Oftalmología': ['ojo', 'ojos', 'vision', 'visión', 'vista', 'ver', 'veo', 'ceguera', 'ciego'],
      'Dermatología': ['piel', 'ronchas', 'alergia', 'picazon', 'picazón', 'granitos', 'acne', 'acné'],
      'Otorrinolaringología': ['oido', 'oído', 'garganta', 'nariz', 'sordo', 'escucho'],
      'Cardiología': ['corazón', 'corazon', 'pecho', 'presion', 'presión'],
      'Neurología': ['cabeza', 'mareo', 'convulsion', 'convulsión'],
      'Medicina Familiar': ['fiebre', 'gripe', 'resfrio', 'resfrío', 'cansancio', 'fatiga']
    };
    
    for (const [especialidad, sintomas] of Object.entries(sintomasEspecialidades)) {
      if (sintomas.some(sintoma => textoLimpio.includes(sintoma))) {
        return especialidad;
      }
    }
    return null;
  }

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

  async function getDoctorInfo(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return {
        name: data.fields?.Name || "Doctor",
        email: data.fields?.Email || null
      };
    } catch (err) {
      console.error("❌ Error obteniendo info médico:", err);
      return { name: "Doctor", email: null };
    }
  }

  // Declarar variables reutilizables al inicio
  let specialty, esNiño, medicoId, records, attempts, selectedRecord, sobrecupoData;

  // Si es consulta no médica, redirigir amablemente
  if (esConsultaNoMedica(text)) {
    const respuestasAmables = [
      "No soy un reloj, pero sí soy tu asistente médico 😄\n\n¿Hay algo relacionado con tu salud en lo que pueda ayudarte? Por ejemplo:\n• Síntomas que te preocupen\n• Necesidad de algún especialista\n• Chequeos médicos\n• Consultas de urgencia",
      "¡Jaja! Para eso tienes tu celular 📱 Yo me especializo en cuidar tu salud.\n\n¿Cómo te sientes hoy? ¿Necesitas alguna consulta médica?",
      "Esa información la tiene mejor tu teléfono 😅 Yo soy experto en encontrar sobrecupos médicos.\n\n¿Hay algún tema de salud en el que pueda ayudarte? Cuéntame si tienes algún síntoma o necesitas ver algún especialista."
    ];
    const respuestaAleatoria = respuestasAmables[Math.floor(Math.random() * respuestasAmables.length)];
    return res.json({ text: respuestaAleatoria });
  }

  // Si es saludo simple (sin términos médicos), responder con bienvenida
  if (esSaludoSimple(text)) {
    return res.json({
      text: "¡Hola! 👋 Soy Sobrecupos IA y estoy aquí para ayudarte a encontrar atención médica rápida.\n\n¿Cómo te sientes hoy? Cuéntame tus síntomas o qué especialista necesitas. 🩺"
    });
  }

  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // Si es agradecimiento
  if (thanksRe.test(text)) {
    return res.json({
      text: "¡De nada! 😊 Siempre estoy aquí para ayudarte con tus necesidades de salud. ¿Hay algo más en lo que pueda asistirte?"
    });
  }

  // Manejo de sesiones existentes
  const currentSession = sessions[from] || prevSession || {};

  if (currentSession.stage) {
    switch (currentSession.stage) {
      case 'getting-age-for-search':
        const searchAge = parseInt(text);
        if (isNaN(searchAge) || searchAge < 0 || searchAge > 120) {
          return res.json({
            text: "Por favor ingresa una edad válida (número entre 0 y 120 años)."
          });
        }

        // Filtrar sobrecupos por edad
        specialty = currentSession.specialty;
        const { pendingRecords } = currentSession;
        const filteredRecords = [];
        esNiño = searchAge < 18;
        
        // Filtrar sobrecupos por edad del médico
        for (const sobrecupo of pendingRecords) {
          medicoId = Array.isArray(sobrecupo.fields["Médico"]) ? 
            sobrecupo.fields["Médico"][0] : sobrecupo.fields["Médico"];
          
          try {
            const doctorResp = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            
            if (doctorResp.ok) {
              const doctorData = await doctorResp.json();
              const medicoAtiende = doctorData.fields?.Atiende;
              
              // Verificar si el médico puede atender pacientes de esta edad
              const puedeAtender = !medicoAtiende || 
                medicoAtiende === "Ambos" ||
                (esNiño && medicoAtiende === "Niños") ||
                (!esNiño && medicoAtiende === "Adultos");
              
              if (puedeAtender) {
                filteredRecords.push(sobrecupo);
              }
            }
          } catch (err) {
            console.error("❌ Error verificando médico:", medicoId, err);
            // En caso de error, incluir el sobrecupo
            filteredRecords.push(sobrecupo);
          }
        }
        
        if (filteredRecords.length === 0) {
          delete sessions[from];
          return res.json({
            text: `Lamentablemente no tengo sobrecupos de ${specialty} disponibles para ${esNiño ? 'niños' : 'adultos'} en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
          });
        }

        const first = filteredRecords[0].fields;
        const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
        const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
        medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
        const medicoNombre = await getDoctorName(medicoId);

        sessions[from] = {
          stage: 'awaiting-confirmation',
          specialty,
          records: filteredRecords,
          attempts: 0,
          searchAge
        };

        return res.json({
          text: `✅ Perfecto! Encontré un sobrecupo de ${specialty} para ${esNiño ? 'niños' : 'adultos'}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
          session: sessions[from]
        });

      case 'awaiting-confirmation':
        if (affirmativeRe.test(text)) {
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-name',
            attempts: 0 
          };
          return res.json({
            text: "¡Perfecto! 🎉 Para confirmar tu cita necesito algunos datos.\n\n¿Cuál es tu nombre completo?",
            session: sessions[from]
          });
        }
        
        if (negativeRe.test(text)) {
          records = currentSession.records || [];
          specialty = currentSession.specialty;
          const nextAttempt = (currentSession.attempts || 0) + 1;
          
          if (nextAttempt < records.length) {
            const nextRecord = records[nextAttempt].fields;
            const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
            const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
            medicoId = Array.isArray(nextRecord["Médico"]) ? nextRecord["Médico"][0] : nextRecord["Médico"];
            const medicoNombre = await getDoctorName(medicoId);
            
            sessions[from] = { 
              ...currentSession, 
              attempts: nextAttempt 
            };
            
            return res.json({
              text: `Te muestro otra opción de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta?`,
              session: sessions[from]
            });
          } else {
            delete sessions[from];
            return res.json({
              text: "No hay más opciones disponibles en este momento. ¿Te gustaría que te contacte cuando tengamos nuevos sobrecupos?"
            });
          }
        }
        
        return res.json({
          text: "Por favor responde 'sí' si te sirve la cita o 'no' si quieres ver otra opción."
        });

      case 'getting-name':
        if (text.length < 3) {
          return res.json({
            text: "Por favor ingresa tu nombre completo."
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-rut',
          patientName: text 
        };
        return res.json({
          text: "Excelente! 👤\n\nAhora necesito tu RUT (con guión y dígito verificador).\nEjemplo: 12345678-9",
          session: sessions[from]
        });

      case 'getting-rut':
        if (!validarRUT(text)) {
          return res.json({
            text: "Por favor ingresa un RUT válido con el formato correcto.\nEjemplo: 12345678-9"
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-phone',
          patientRut: text 
        };
        return res.json({
          text: "Perfecto! 📋\n\nAhora tu número de teléfono (incluye +56 si es de Chile).\nEjemplo: +56912345678",
          session: sessions[from]
        });

      case 'getting-phone':
        if (text.length < 8) {
          return res.json({
            text: "Por favor ingresa un número de teléfono válido.\nEjemplo: +56912345678"
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-age',
          patientPhone: text 
        };
        return res.json({
          text: "Excelente! 📞\n\n¿Cuántos años tienes?\nEsto me ayuda a confirmar que el médico pueda atenderte.",
          session: sessions[from]
        });

      case 'getting-age':
        const age = parseInt(text);
        if (isNaN(age) || age < 0 || age > 120) {
          return res.json({
            text: "Por favor ingresa una edad válida (número entre 0 y 120 años)."
          });
        }

        // Verificar si el médico del sobrecupo seleccionado puede atender esta edad
        records = currentSession.records;
        attempts = currentSession.attempts || 0;
        selectedRecord = records[attempts];
        sobrecupoData = selectedRecord.fields;
        medicoId = Array.isArray(sobrecupoData["Médico"]) ? 
          sobrecupoData["Médico"][0] : sobrecupoData["Médico"];

        // Verificar si el médico atiende pacientes de esta edad
        let medicoAtiende = null;
        try {
          const doctorResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          const doctorData = await doctorResp.json();
          medicoAtiende = doctorData.fields?.Atiende;
        } catch (err) {
          console.error("❌ Error verificando médico:", err);
        }

        // Verificar compatibilidad de edad
        esNiño = age < 18;
        const puedeAtender = !medicoAtiende || 
          medicoAtiende === "Ambos" ||
          (esNiño && medicoAtiende === "Niños") ||
          (!esNiño && medicoAtiende === "Adultos");

        if (!puedeAtender) {
          // El médico no puede atender pacientes de esta edad, buscar otro
          const nextAttempt = attempts + 1;
          
          if (nextAttempt < records.length) {
            // Intentar con el siguiente sobrecupo disponible
            sessions[from] = { 
              ...currentSession, 
              attempts: nextAttempt,
              patientAge: age
            };
            
            const nextRecord = records[nextAttempt].fields;
            const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
            const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
            const nextMedicoId = Array.isArray(nextRecord["Médico"]) ? 
              nextRecord["Médico"][0] : nextRecord["Médico"];
            const medicoNombre = await getDoctorName(nextMedicoId);
            
            return res.json({
              text: `El médico anterior no atiende ${esNiño ? 'niños' : 'adultos'}.\n\nTe muestro otra opción:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta?`,
              session: sessions[from]
            });
          } else {
            // No hay más opciones disponibles
            delete sessions[from];
            return res.json({
              text: `Lamentablemente no tengo sobrecupos disponibles para pacientes de ${age} años en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad para ${esNiño ? 'niños' : 'adultos'}?`
            });
          }
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-email',
          patientAge: age
        };
        return res.json({
          text: "Perfecto! 👍\n\nFinalmente, tu email para enviarte la confirmación:",
          session: sessions[from]
        });

      case 'getting-email':
        if (!/\S+@\S+\.\S+/.test(text)) {
          return res.json({
            text: "Por favor ingresa un email válido.\nEjemplo: tu.email@gmail.com"
          });
        }

        // Registrar paciente y confirmar cita
        records = currentSession.records;
        specialty = currentSession.specialty;
        attempts = currentSession.attempts || 0;
        const { patientName, patientRut, patientPhone, patientAge } = currentSession;
        
        const patientEmail = text;
        selectedRecord = records[attempts];
        const sobrecupoId = selectedRecord.id;
        sobrecupoData = selectedRecord.fields;
        
        let pacienteId = null;
        let sobrecupoUpdated = false;
        let emailsSent = { patient: false, doctor: false };
        let statusText = "❌ Error procesando la reserva.";
        let updateError = null;

        console.log("🏥 ======================");
        console.log("🏥 INICIANDO PROCESO DE RESERVA");
        console.log("🏥 Paciente:", patientName);
        console.log("🏥 Email:", patientEmail);
        console.log("🏥 Teléfono:", patientPhone);
        console.log("🏥 Edad:", patientAge);
        console.log("🏥 Especialidad:", specialty);
        console.log("🏥 Sobrecupo ID:", sobrecupoId);
        console.log("🏥 ======================");

        // 1. CREAR PACIENTE - CORREGIDO
        const PATIENTS_TABLE_ID = 'tbl8btPJu6S7nXqNS'; // ID directo de tu tabla
        
        try {
          console.log("👤 Creando paciente en Airtable...");
          
          const patientPayload = {
            fields: {
              "Nombre": patientName,
              "RUT": patientRut,           // ← CONFIRMADO: "RUT" en mayúsculas
              "Telefono": patientPhone,    // ← CONFIRMADO: "Telefono" 
              "Email": patientEmail,
              "Edad": patientAge || 30,    // ← USAR LA EDAD REAL DEL PACIENTE
              "Fecha Registro": new Date().toISOString().split('T')[0]
            }
          };

          console.log("📤 Payload del paciente:", JSON.stringify(patientPayload, null, 2));

          const patientResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(patientPayload)
            }
          );
          
          const patientData = await patientResp.json();
          
          console.log(`📡 Respuesta Airtable paciente: ${patientResp.status}`);
          console.log("📊 Datos respuesta:", JSON.stringify(patientData, null, 2));
          
          if (patientResp.ok && patientData.id) {
            pacienteId = patientData.id;
            console.log("✅ Paciente creado exitosamente:", pacienteId);
          } else {
            console.error("❌ Error creando paciente:", patientData);
            console.error("❌ Status:", patientResp.status);
            console.error("❌ Error details:", patientData.error);
          }
        } catch (err) {
          console.error("❌ Error crítico creando paciente:", err);
          console.error("❌ Stack:", err.stack);
        }

        // 2. ACTUALIZAR SOBRECUPO - MEJORADO
        try {
          console.log("📅 Actualizando sobrecupo...");
          
          const updatePayload = {
            fields: {
              Disponible: "No",
              "Paciente Nombre": patientName,
              "Paciente Email": patientEmail,
              "Paciente Teléfono": patientPhone
            }
          };

          // Agregar ID del paciente si se creó exitosamente
          if (pacienteId) {
            updatePayload.fields["Paciente ID"] = pacienteId;
          }

          console.log("📤 Payload sobrecupo:", JSON.stringify(updatePayload, null, 2));

          const updateResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(updatePayload)
            }
          );

          const updateData = await updateResp.json();
          
          console.log(`📡 Respuesta actualización sobrecupo: ${updateResp.status}`);
          console.log("📊 Datos actualización:", JSON.stringify(updateData, null, 2));

          if (updateResp.ok) {
            sobrecupoUpdated = true;
            console.log("✅ Sobrecupo actualizado exitosamente");
          } else {
            updateError = updateData.error?.message || `HTTP ${updateResp.status}`;
            console.error("❌ Error actualizando sobrecupo:", updateData);
          }
        } catch (err) {
          updateError = err.message;
          console.error("❌ Error crítico actualizando sobrecupo:", err);
        }

        // 3. ENVIAR EMAIL AL PACIENTE
        if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && pacienteId) {
          try {
            console.log("📧 Enviando email de confirmación al paciente...");
            
            const patientEmailContent = `
¡Hola ${patientName}!

Tu cita ha sido confirmada exitosamente:

📅 DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${sobrecupoData.Fecha}
• Hora: ${sobrecupoData.Hora}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}
• Dirección: ${sobrecupoData["Dirección"] || sobrecupoData["Direccion"]}

📋 RECOMENDACIONES:
• Llega 15 minutos antes de tu hora
• Trae tu carnet de identidad
• Si tienes seguro, trae tu credencial

¿Necesitas reprogramar? Responde a este email.

¡Nos vemos pronto!
Equipo Sobrecupos AI
            `;

            const patientEmailResp = await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                personalizations: [{
                  to: [{ email: patientEmail, name: patientName }],
                  subject: `✅ Cita confirmada: ${specialty} - ${sobrecupoData.Fecha}`
                }],
                from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                content: [{ type: "text/plain", value: patientEmailContent }]
              })
            });

            if (patientEmailResp.ok) {
              emailsSent.patient = true;
              console.log("✅ Email enviado al paciente");
            } else {
              const emailError = await patientEmailResp.json();
              console.error("❌ Error enviando email:", emailError);
            }
          } catch (emailErr) {
            console.error("❌ Error enviando email al paciente:", emailErr);
          }
        }

        // 4. ENVIAR EMAIL AL MÉDICO
        if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
          try {
            console.log("📧 Enviando email al médico...");
            
            medicoId = Array.isArray(sobrecupoData["Médico"]) ? 
              sobrecupoData["Médico"][0] : sobrecupoData["Médico"];
            const doctorInfo = await getDoctorInfo(medicoId);
            
            if (doctorInfo.email) {
              const doctorEmailContent = `
Dr/a. ${doctorInfo.name},

Se ha registrado un nuevo paciente para su sobrecupo:

📅 DETALLES DE LA CITA:
• Fecha: ${sobrecupoData.Fecha}
• Hora: ${sobrecupoData.Hora}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}

👤 DATOS DEL PACIENTE:
• Nombre: ${patientName}
• RUT: ${patientRut}
• Edad: ${patientAge} años
• Teléfono: ${patientPhone}
• Email: ${patientEmail}

El paciente ha sido notificado por email.

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
                    subject: `🩺 Nuevo paciente: ${patientName} - ${sobrecupoData.Fecha}`
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

        // 5. MENSAJE FINAL
        if (sobrecupoUpdated) {
          statusText = `🎉 ¡CITA CONFIRMADA! 

📋 RESUMEN:
• ${specialty}
• ${sobrecupoData.Fecha} a las ${sobrecupoData.Hora}
• ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}

${emailsSent.patient ? "📧 Te hemos enviado la confirmación por email." : "⚠️ No pudimos enviar el email de confirmación."}

💡 Llega 15 minutos antes. ¡Nos vemos pronto!`;
        } else {
          statusText = `❌ Hubo un problema al confirmar tu cita. 

No te preocupes, tu información está guardada:
• Nombre: ${patientName}
• Cita solicitada: ${specialty} - ${sobrecupoData.Fecha}

Te contactaremos pronto para confirmar. Tu cita está confirmada.`;
        }

        console.log("🏥 ======================");
        console.log("🏥 PROCESO COMPLETADO");
        console.log("🏥 Paciente creado:", !!pacienteId);
        console.log("🏥 Sobrecupo actualizado:", sobrecupoUpdated);
        console.log("🏥 Email paciente:", emailsSent.patient);
        console.log("🏥 Email médico:", emailsSent.doctor);
        console.log("🏥 ======================");

        return res.json({ text: statusText });

      default:
        break;
    }
  }

  // Detectar especialidad directa (ej: "necesito oftalmólogo")
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  
  if (especialidadDirecta) {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    if (!especialidadesDisponibles.includes(especialidadDirecta)) {
      return res.json({
        text: `Entiendo que estás buscando atención especializada.\n\nLamentablemente no tengo sobrecupos de ${especialidadDirecta} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n¿Te gustaría que te contacte cuando tengamos ${especialidadDirecta} disponible?`
      });
    }
    
    specialty = especialidadDirecta;
    
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

    records = [];
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

    sessions[from] = {
      stage: 'getting-age-for-search',
      specialty,
      pendingRecords: available // Guardar records sin filtrar
    };

    return res.json({
      text: `${respuestaEmpatica}\n\n✅ Encontré sobrecupos de ${specialty} disponibles.\n\n¿Cuántos años tienes? Esto me ayuda a encontrar el médico adecuado.`,
      session: sessions[from]
    });
  }

  // NUEVA LÓGICA: Detectar síntomas y mapear a especialidades
  const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
  
  if (especialidadPorSintomas) {
    specialty = especialidadPorSintomas;
    
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
                content: "Eres Sobrecupos IA, asistente médico chileno empático. Responde con comprensión a síntomas del usuario (máx 2 líneas). No menciones 'Sobrecupos IA'."
              },
              { role: "user", content: `Usuario dice: "${text}"` }
            ]
          })
        });
        const empatJson = await empatRes.json();
        respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "Entiendo tu preocupación.";
      } catch (err) {
        respuestaEmpatica = "Entiendo tu preocupación.";
      }
    }

    records = [];
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
        text: `${respuestaEmpatica}\n\nPara esos síntomas recomiendo consultar con ${specialty}, pero no tengo sobrecupos disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    sessions[from] = {
      stage: 'getting-age-for-search',
      specialty,
      pendingRecords: available
    };

    return res.json({
      text: `${respuestaEmpatica}\n\nPara esos síntomas recomiendo consultar con ${specialty}.\n\n¿Cuántos años tienes? Esto me ayuda a encontrar el médico adecuado.`,
      session: sessions[from]
    });
  }

  // Respuesta por defecto con lista de especialidades
  const especialidadesDisponibles = await getEspecialidadesDisponibles();
  const listaEspecialidades = especialidadesDisponibles.slice(0, 8).join('\n• ');

  return res.json({
    text: `Hola! 👋 Soy Sobrecupos IA y estoy aquí para ayudarte a encontrar atención médica rápida.

🩺 **¿Cómo puedo ayudarte?**

Puedes decirme:
• Tus síntomas (ej: "me duelen los ojos")
• El especialista que necesitas (ej: "necesito oftalmólogo")
• Una consulta general (ej: "tengo fiebre")

📋 **Especialidades disponibles:**
• ${listaEspecialidades}

¿Qué necesitas?`
  });
}