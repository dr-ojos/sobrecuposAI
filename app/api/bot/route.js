// app/api/bot/route.js - MIGRACIÓN COMPLETA DE FUNCIONALIDAD DEL BOT
import { NextResponse } from 'next/server';

// Estado de sesiones en memoria
const sessions = {};

// Saludos simples para detección
const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

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

// Función para detectar especialidad por síntomas
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
    'falta aire', 'sin aire', 'agitacion', 'cansancio extremo'
  ];
  
  // Síntomas neurológicos
  const sintomasNeurologia = [
    'dolor cabeza', 'dolor de cabeza', 'cefalea', 'migrana',
    'mareo', 'vertigo', 'vértigo', 'desmayo',
    'hormigueo', 'entumecimiento', 'adormecimiento',
    'perdida memoria', 'olvidos', 'confusion'
  ];
  
  // Síntomas pediátricos
  const sintomasPediatria = [
    'niño', 'niña', 'bebe', 'bebé', 'hijo', 'hija',
    'mi hijo', 'mi hija', 'mi bebe', 'mi bebé',
    'menor', 'pequeño', 'pequeña', 'infante'
  ];
  
  // Evaluar síntomas
  if (sintomasOftalmologia.some(s => textoLimpio.includes(s))) return 'Oftalmología';
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
      return { name: doctorId, email: null };
    }

    const data = await response.json();
    return {
      name: data.fields?.Name || doctorId,
      email: data.fields?.Email || null
    };
  } catch (error) {
    console.error(`Error obteniendo info del médico ${doctorId}:`, error);
    return { name: doctorId, email: null };
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
      AIRTABLE_PACIENTES_TABLE,
      OPENAI_API_KEY,
      SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL
    } = process.env;

    const text = message.trim();
    const from = currentSession?.from || "user";

    console.log(`📱 Mensaje recibido: "${text}"`);

    // Respuestas a consultas no médicas
    if (esConsultaNoMedica(text)) {
      const respuestasNoMedicas = [
        "Soy Sobrecupos IA, tu asistente médico especializado. Estoy aquí para ayudarte a encontrar sobrecupos médicos disponibles. 😊\n\n¿Tienes algún síntoma o necesitas ver algún especialista?",
        "Actualmente me especializo en ayudarte con temas de salud y sobrecupos médicos. 🩺\n\n¿En qué puedo ayudarte con tu salud hoy?",
        "Estoy aquí para conectarte con médicos y especialistas disponibles. 👨‍⚕️\n\n¿Qué tipo de consulta médica necesitas?"
      ];
      
      const respuestaAleatoria = respuestasNoMedicas[Math.floor(Math.random() * respuestasNoMedicas.length)];
      return NextResponse.json({ text: respuestaAleatoria });
    }

    // Manejo de sesiones existentes
    if (currentSession?.stage) {
      const { stage, specialty, records, attempts = 0, patientName, patientRut, patientPhone, patientEmail } = currentSession;

      switch (stage) {
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
            
            if (nextAttempt < availableRecords.length) {
              const nextRecord = availableRecords[nextAttempt].fields;
              const clin = nextRecord["Clínica"] || nextRecord["Clinica"] || "nuestra clínica";
              const dir = nextRecord["Dirección"] || nextRecord["Direccion"] || "la dirección indicada";
              const medicoId = Array.isArray(nextRecord["Médico"]) ? 
                nextRecord["Médico"][0] : nextRecord["Médico"];
              const medicoNombre = await getDoctorName(medicoId);
              
              sessions[from] = { 
                ...currentSession, 
                attempts: nextAttempt 
              };
              
              return NextResponse.json({
                text: `Te muestro otra opción de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta? Confirma con "sí".`,
                session: sessions[from]
              });
            } else {
              delete sessions[from];
              return NextResponse.json({
                text: `Lo siento, esas eran todas las opciones de ${specialty} disponibles.\n\n¿Te gustaría que te contacte cuando tengamos nuevos sobrecupos disponibles?`
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
            return NextResponse.json({
              text: "El RUT no es válido. Por favor ingresa tu RUT completo con el formato correcto.\nEjemplo: 12.345.678-9"
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-phone',
            patientRut: text 
          };
          return NextResponse.json({
            text: "Perfecto! 📋\n\nAhora tu número de teléfono (incluye +56 si es de Chile).\nEjemplo: +56912345678",
            session: sessions[from]
          });

        case 'getting-phone':
          if (text.length < 8) {
            return NextResponse.json({
              text: "Por favor ingresa un número de teléfono válido.\nEjemplo: +56912345678"
            });
          }
          
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-email',
            patientPhone: text 
          };
          return NextResponse.json({
            text: "Excelente! 📞\n\nFinalmente, tu email para enviarte la confirmación:",
            session: sessions[from]
          });

        case 'getting-email':
          if (!text.includes('@') || !text.includes('.')) {
            return NextResponse.json({
              text: "Por favor ingresa un email válido.\nEjemplo: nombre@email.com"
            });
          }

          // PROCESO DE CONFIRMACIÓN FINAL
          const sobrecupoData = records[0]?.fields;
          let statusText = "";
          let sobrecupoUpdated = false;
          let updateError = null;
          const emailsSent = { patient: false, doctor: false };

          // 1. Crear paciente en Airtable
          let pacienteId = null;
          try {
            console.log("👤 Creando paciente...");
            const pacienteResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: {
                    Nombre: patientName,
                    RUT: patientRut,
                    Telefono: patientPhone,
                    Email: text,
                    Edad: 0 // Valor por defecto
                  }
                }),
              }
            );

            if (pacienteResponse.ok) {
              const pacienteData = await pacienteResponse.json();
              pacienteId = pacienteData.id;
              console.log("✅ Paciente creado:", pacienteId);
            } else {
              console.error("❌ Error creando paciente:", await pacienteResponse.text());
            }
          } catch (err) {
            console.error("❌ Error creando paciente:", err);
          }

          // 2. Actualizar sobrecupo
          try {
            console.log("📅 Actualizando sobrecupo...");
            const updateData = {
              fields: {
                Disponible: false,
                Paciente: pacienteId ? [pacienteId] : undefined,
                RUT: patientRut,
                Edad: 0
              }
            };

            // Limpiar campos undefined
            Object.keys(updateData.fields).forEach(key => {
              if (updateData.fields[key] === undefined) {
                delete updateData.fields[key];
              }
            });

            const updateResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${records[0].id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
              }
            );

            if (updateResponse.ok) {
              sobrecupoUpdated = true;
              console.log("✅ Sobrecupo actualizado");
            } else {
              const errorData = await updateResponse.text();
              updateError = errorData;
              console.error("❌ Error actualizando sobrecupo:", errorData);
            }
          } catch (err) {
            updateError = err.message;
            console.error("❌ Error actualizando sobrecupo:", err);
          }

          // 3. Enviar email al paciente
          if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
            try {
              const emailContent = `
¡Hola ${patientName}!

Tu cita médica ha sido confirmada exitosamente.

📅 DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${sobrecupoData.Fecha}
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
Equipo Sobrecupos AI
              `;

              const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SENDGRID_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  personalizations: [{
                    to: [{ email: text, name: patientName }],
                    subject: `🩺 Cita confirmada: ${specialty} - ${sobrecupoData.Fecha}`
                  }],
                  from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                  content: [{ type: "text/plain", value: emailContent }]
                })
              });

              if (emailResponse.ok) {
                emailsSent.patient = true;
                console.log("✅ Email enviado al paciente");
              }
            } catch (emailErr) {
              console.error("❌ Error enviando email al paciente:", emailErr);
            }
          }

          // 4. Enviar email al médico
          if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
            try {
              const medicoId = Array.isArray(sobrecupoData["Médico"]) ? 
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
• Teléfono: ${patientPhone}
• Email: ${text}

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

    // Detectar especialidad directa (ej: "necesito oftalmólogo")
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
        return NextResponse.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
      }

      const available = records.filter(r => {
        const fields = r.fields || {};
        return (
          (fields.Especialidad === specialty) &&
          (fields.Disponible === "Si" || fields.Disponible === true)
        );
      });

      if (available.length === 0) {
        return NextResponse.json({
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

      return NextResponse.json({
        text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
        session: sessions[from]
      });
    }

    // Detectar síntomas y mapear a especialidades
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
        return NextResponse.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
      }

      const available = records.filter(r => {
        const fields = r.fields || {};
        return (
          (fields.Especialidad === specialty) &&
          (fields.Disponible === "Si" || fields.Disponible === true)
        );
      });

      if (available.length === 0) {
        return NextResponse.json({
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

      return NextResponse.json({
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
        return NextResponse.json({ text: "Lo siento, no entendí. ¿Puedes describirlo de otra forma?" });
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
        return NextResponse.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
      }

      const available = records.filter(r => {
        const fields = r.fields || {};
        return (
          (fields.Especialidad === specialty) &&
          (fields.Disponible === "Si" || fields.Disponible === true)
        );
      });

      if (available.length === 0) {
        return NextResponse.json({
          text: "Entiendo que necesitas atención médica.\n\nLamentablemente no tengo sobrecupos disponibles en este momento que coincidan con tu consulta.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?"
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

      return NextResponse.json({
        text: `Por lo que me describes, sería recomendable que veas a un especialista en ${specialty}.\n\n✅ Encontré un sobrecupo disponible:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
        session: sessions[from]
      });
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