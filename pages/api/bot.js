// /pages/api/bot.js - VERSIÓN MEJORADA CON DETECCIÓN DE SÍNTOMAS
const sessions = {};

const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

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

// NUEVA FUNCIÓN: Detectar consultas no médicas
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

// NUEVA FUNCIÓN: Detectar síntomas y mapear a especialidades
function detectarEspecialidadPorSintomas(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // Síntomas oftalmológicos
  const sintomasOftalmologia = [
    'vision borrosa', 'visión borrosa', 'borrosa', 'borroso',
    'no veo bien', 'veo mal', 'veo borroso', 'veo doble',
    'manchas flotantes', 'moscas volantes', 'puntos negros',
    'ojo rojo', 'ojos rojos', 'irritado', 'irritados',
    'ardor en los ojos', 'quemazón ojos', 'lagrimeo',
    'dolor de ojos', 'duelen los ojos', 'ojo duele',
    'sensible a la luz', 'fotofobia', 'molesta la luz',
    'graduacion', 'graduación', 'lentes', 'anteojos',
    'revision ojos', 'revisión ojos', 'examen vista'
  ];
  
  // Síntomas dermatológicos
  const sintomasDermatologia = [
    'picazon', 'picazón', 'me pica', 'comezón',
    'sarpullido', 'roncha', 'ronchas', 'eruption',
    'alergia piel', 'dermatitis', 'eczema',
    'lunar', 'lunares', 'mancha piel', 'piel',
    'acne', 'acné', 'espinillas', 'granos'
  ];
  
  // Síntomas cardiológicos
  const sintomasCardiologia = [
    'dolor pecho', 'duele pecho', 'opresion pecho',
    'palpitaciones', 'taquicardia', 'corazon late rapido',
    'falta aire', 'ahogo', 'disnea', 'cansancio al caminar'
  ];
  
  // Síntomas neurológicos
  const sintomasNeurologia = [
    'dolor cabeza', 'duele cabeza', 'cefalea', 'migrana', 'migraña',
    'mareo', 'mareos', 'vertigo', 'vértigo',
    'temblor', 'temblores', 'convulsion', 'convulsión'
  ];
  
  // Síntomas otorrino
  const sintomasOtorrino = [
    'dolor garganta', 'duele garganta', 'dolor oido',
    'no oigo', 'sordo', 'ronquera', 'afonía',
    'tapado nariz', 'congestion', 'sinusitis'
  ];
  
  // Verificar cada grupo de síntomas
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE, AIRTABLE_PATIENTS_TABLE, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.json({ text: "❌ Error de configuración básica. Contacta soporte." });
  }

  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

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
          const { records = [], specialty } = currentSession;
          const nextAttempt = (currentSession.attempts || 0) + 1;
          
          if (nextAttempt < records.length) {
            const nextRecord = records[nextAttempt].fields;
            const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
            const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
            const medicoId = Array.isArray(nextRecord["Médico"]) ? nextRecord["Médico"][0] : nextRecord["Médico"];
            const medicoNombre = await getDoctorName(medicoId);
            
            sessions[from] = { 
              ...currentSession, 
              attempts: nextAttempt 
            };
            
            return res.json({
              text: `Te muestro otra opción de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta? Confirma con "sí".`,
              session: sessions[from]
            });
          } else {
            delete sessions[from];
            return res.json({
              text: `Lo siento, esas eran todas las opciones de ${specialty} disponibles.\n\n¿Te gustaría que te contacte cuando tengamos nuevos sobrecupos disponibles?`
            });
          }
        }
        
        return res.json({
          text: "No entendí tu respuesta. ¿Te sirve esta cita? Responde \"sí\" para confirmar o \"no\" para ver otras opciones."
        });

      case 'getting-name':
        if (text.length < 2) {
          return res.json({
            text: "Por favor ingresa tu nombre completo para continuar."
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-rut',
          patientName: text 
        };
        return res.json({
          text: `Gracias ${text}! 👤\n\nAhora necesito tu RUT (con guión y dígito verificador).\nEjemplo: 12.345.678-9`,
          session: sessions[from]
        });

      case 'getting-rut':
        if (!validarRUT(text)) {
          return res.json({
            text: "El RUT no es válido. Por favor ingresa tu RUT completo con el formato correcto.\nEjemplo: 12.345.678-9"
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
          stage: 'getting-email',
          patientPhone: text 
        };
        return res.json({
          text: "Excelente! 📞\n\nFinalmente, tu email para enviarte la confirmación:",
          session: sessions[from]
        });

      case 'getting-email':
        if (!/\S+@\S+\.\S+/.test(text)) {
          return res.json({
            text: "Por favor ingresa un email válido.\nEjemplo: tu.email@gmail.com"
          });
        }

        // Registrar paciente y confirmar cita
        const { 
          records, specialty, attempts = 0, 
          patientName, patientRut, patientPhone 
        } = currentSession;
        
        const patientEmail = text;
        const selectedRecord = records[attempts];
        const sobrecupoId = selectedRecord.id;
        const sobrecupoData = selectedRecord.fields;
        
        let pacienteId = null;
        let sobrecupoUpdated = false;
        let emailsSent = { patient: false, doctor: false };
        let statusText = "❌ Error procesando la reserva.";

        // 1. Crear paciente
        if (AIRTABLE_PATIENTS_TABLE) {
          try {
            const patientResp = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  fields: {
                    "Nombre": patientName,
                    "RUT": patientRut,
                    "Teléfono": patientPhone,
                    "Email": patientEmail,
                    "Fecha Registro": new Date().toISOString().split('T')[0]
                  }
                })
              }
            );
            
            if (patientResp.ok) {
              const patientData = await patientResp.json();
              pacienteId = patientData.id;
              console.log("✅ Paciente creado:", pacienteId);
            }
          } catch (err) {
            console.error("❌ Error creando paciente:", err);
          }
        }

        // 2. Actualizar sobrecupo
        try {
          const updateFields = {
            "Disponible": "No",
            "Paciente Nombre": patientName,
            "Paciente RUT": patientRut,
            "Paciente Teléfono": patientPhone,
            "Paciente Email": patientEmail
          };
          
          if (pacienteId) {
            updateFields["Paciente ID"] = [pacienteId];
          }

          const updateResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ fields: updateFields })
            }
          );

          if (updateResp.ok) {
            sobrecupoUpdated = true;
            console.log("✅ Sobrecupo actualizado");
          }
        } catch (updateErr) {
          console.error("❌ Error actualizando sobrecupo:", updateErr);
        }

        // 3. Enviar emails
        if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
          // Email al paciente
          try {
            const patientEmailContent = `
Estimado/a ${patientName},

¡Tu cita médica ha sido confirmada! 🎉

📋 DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${sobrecupoData.Fecha}
• Hora: ${sobrecupoData.Hora}
• Clínica: ${sobrecupoData["Clínica"] || sobrecupoData["Clinica"]}
• Dirección: ${sobrecupoData["Dirección"] || sobrecupoData["Direccion"]}

📝 TUS DATOS:
• RUT: ${patientRut}
• Teléfono: ${patientPhone}

Por favor, llega 15 minutos antes de tu cita.

Saludos,
Sobrecupos AI
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
                  subject: `✅ Cita confirmada - ${sobrecupoData.Fecha} a las ${sobrecupoData.Hora}`
                }],
                from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                content: [{ type: "text/plain", value: patientEmailContent }]
              })
            });

            if (patientEmailResp.ok) {
              emailsSent.patient = true;
              console.log("✅ Email enviado al paciente");
            }
          } catch (emailErr) {
            console.error("❌ Error enviando email al paciente:", emailErr);
          }

          // Email al médico
          try {
            const medicoId = Array.isArray(sobrecupoData["Médico"]) ? sobrecupoData["Médico"][0] : sobrecupoData["Médico"];
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
• Teléfono: ${patientPhone}
• Email: ${patientEmail}

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

        // Mensaje final
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
          console.error("❌ Error final actualización sobrecupo:", updateError);
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
      text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  // NUEVA LÓGICA: Detectar síntomas y mapear a especialidades
  const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
  
  if (especialidadPorSintomas) {
    const specialty = especialidadPorSintomas;
    
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
        text: `${respuestaEmpatica}\n\nPor lo que me describes, sería bueno que veas a un especialista en ${specialty}.\n\nLamentablemente no tengo sobrecupos disponibles en este momento. ¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

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
      text: `${respuestaEmpatica}\n\nPor lo que me describes, te conviene ver a un especialista en ${specialty}.\n\n✅ Encontré un sobrecupo disponible:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
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
      return res.json({ text: "Lo siento, no entendí. ¿Puedes describirlo de otra forma?" });
    }

    const specialty = especialidadesDisponibles.includes(rawEsp) ? rawEsp : "Medicina Familiar";

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
        text: `Lo siento, no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

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
      text: `✅ Encontré un sobrecupo de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  return res.json({
    text: "¡Hola! Para ayudarte mejor, ¿puedes contarme qué especialidad médica necesitas o cuáles son tus síntomas?"
  });
}