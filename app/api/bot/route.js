// app/api/bot/route.js
// 🤖 BOT PARA CHAT WEB - App Router

import { NextResponse } from 'next/server';

// Variables de entorno
const {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_ID,
  AIRTABLE_DOCTORS_TABLE,
  AIRTABLE_PATIENTS_TABLE
} = process.env;

// Sistema de sesiones en memoria
const sessions = {};

export async function POST(req) {
  try {
    const { message, session: prevSession, from = "webuser" } = await req.json();
    const text = (message || "").trim();

    // Validación básica
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.error("❌ Variables de entorno faltantes");
      return NextResponse.json({ 
        text: "❌ Servicio temporalmente no disponible. Contacta soporte." 
      });
    }

    if (!text) {
      return NextResponse.json({ 
        text: "¡Hola! 👋 Soy Sobrecupos IA.\n\n¿En qué puedo ayudarte? Cuéntame tus síntomas o qué especialista necesitas." 
      });
    }

    console.log(`📨 Mensaje recibido: "${text}"`);

    // Obtener sesión actual
    let currentSession = sessions[from] || prevSession || {};

    // Sistema anti-timeout
    const currentTime = Date.now();
    const sessionTimeout = 10 * 60 * 1000; // 10 minutos
    
    if (currentSession.lastActivity && (currentTime - currentSession.lastActivity) > sessionTimeout) {
      console.log(`🕐 Sesión expirada para ${from}, reseteando...`);
      currentSession = {};
      sessions[from] = {};
    }

    currentSession.lastActivity = currentTime;

    // Expresiones regulares
    const saludoSimpleRe = /^(hola|buenas|buenos?\s*(dias?|tardes?|noches?)|hey|ey|qué tal|que tal|cómo estás|como estas)$/i;
    const afirmativoRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|acepto|me sirve)$/i;
    const negativoRe = /^(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente|otro|otra opción|otra opcion)$/i;

    // === MANEJO DE SALUDOS SIMPLES ===
    if (saludoSimpleRe.test(text)) {
      sessions[from] = { lastActivity: currentTime };
      return NextResponse.json({
        text: "¡Hola! 👋 Soy Sobrecupos IA, tu asistente médico.\n\n¿En qué puedo ayudarte hoy? Puedes contarme:\n• Síntomas que tienes\n• Especialista que necesitas\n• Urgencias médicas"
      });
    }

    // === MANEJO DE SESIONES ACTIVAS ===
    if (currentSession.stage) {
      const result = await manejarSesionActiva(currentSession, text, from);
      if (result) return result;
    }

    // === DETECCIÓN DE ESPECIALIDADES ===
    const especialidadDirecta = detectarEspecialidadDirecta(text);
    if (especialidadDirecta) {
      return await buscarYResponderSobrecupos(especialidadDirecta, text, from, false);
    }

    const especialidadPorSintomas = detectarEspecialidadPorSintomas(text);
    if (especialidadPorSintomas) {
      console.log(`🎯 Síntoma detectado: "${text}" → ${especialidadPorSintomas}`);
      return await buscarYResponderSobrecupos(especialidadPorSintomas, text, from, true);
    }

    // === RESPUESTA POR DEFECTO ===
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    const especialidadesTexto = especialidadesDisponibles.slice(0, 6).join(', ');
    
    return NextResponse.json({
      text: `Te puedo ayudar a encontrar sobrecupos médicos 🩺\n\nCuéntame:\n• ¿Qué síntomas tienes?\n• ¿Qué especialista necesitas?\n\nEspecialidades disponibles: ${especialidadesTexto}\n\nEjemplo: "Me pican los ojos" o "Necesito dermatólogo"`
    });

  } catch (error) {
    console.error('❌ Error en bot:', error);
    return NextResponse.json({
      text: "Disculpa, hubo un error técnico. Por favor intenta nuevamente."
    });
  }
}

// ===============================
// 🛠️ FUNCIONES AUXILIARES
// ===============================

async function manejarSesionActiva(session, message, userId) {
  const afirmativoRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|acepto|me sirve)$/i;
  const negativoRe = /^(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente|otro|otra opción|otra opcion)$/i;

  switch (session.stage) {
    case 'awaiting-confirmation':
      return await manejarConfirmacion(session, message, userId);
    case 'getting-name':
      return await manejarNombre(session, message, userId);
    case 'getting-phone':
      return await manejarTelefono(session, message, userId);
    case 'getting-rut':
      return await manejarRUT(session, message, userId);
    case 'getting-email':
      return await manejarEmail(session, message, userId);
  }
  return null;
}

async function manejarConfirmacion(session, message, userId) {
  const afirmativoRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|acepto|me sirve)$/i;
  const negativoRe = /^(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente|otro|otra opción|otra opcion)$/i;

  if (afirmativoRe.test(message)) {
    sessions[userId] = { 
      ...session, 
      stage: 'getting-name',
      lastActivity: Date.now()
    };
    return NextResponse.json({
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
      
      return NextResponse.json({
        text: `Te muestro otra opción de ${specialty}:\n\n🏥 ${nextRecord["Clínica"]}\n📍 ${nextRecord["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\n¿Te sirve esta? Responde *sí* o *no*`,
        session: sessions[userId]
      });
    } else {
      sessions[userId] = { lastActivity: Date.now() };
      return NextResponse.json({
        text: `Entiendo. Por ahora no tengo más sobrecupos de ${specialty} disponibles.\n\n¿Te gustaría que te contacte cuando tengamos nuevas opciones disponibles?`
      });
    }
  }
  
  return NextResponse.json({
    text: "No entendí tu respuesta. Por favor responde *sí* si te sirve el sobrecupo o *no* para ver otra opción."
  });
}

async function manejarNombre(session, message, userId) {
  const nombre = message.trim();
  
  if (nombre.length < 2) {
    return NextResponse.json({
      text: "Por favor ingresa tu nombre completo (mínimo 2 caracteres)."
    });
  }
  
  sessions[userId] = { 
    ...session, 
    stage: 'getting-phone',
    patientName: nombre,
    lastActivity: Date.now()
  };
  
  return NextResponse.json({
    text: `Perfecto, ${nombre}. 👍\n\nAhora necesito tu número de WhatsApp (incluye +56).\n\nEjemplo: +56912345678`,
    session: sessions[userId]
  });
}

async function manejarTelefono(session, message, userId) {
  const telefono = message.trim();
  
  if (!validarTelefono(telefono)) {
    return NextResponse.json({
      text: "Formato de teléfono incorrecto. Debe incluir +56 y tener 9 dígitos después.\n\nEjemplo: +56912345678"
    });
  }
  
  sessions[userId] = { 
    ...session, 
    stage: 'getting-rut',
    patientPhone: telefono,
    lastActivity: Date.now()
  };
  
  return NextResponse.json({
    text: "📱 Teléfono registrado.\n\nAhora tu RUT (sin puntos, con guión).\n\nEjemplo: 12345678-9",
    session: sessions[userId]
  });
}

async function manejarRUT(session, message, userId) {
  const rut = message.trim();
  
  if (!validarRUT(rut)) {
    return NextResponse.json({
      text: "RUT inválido. Por favor ingresa tu RUT sin puntos y con guión.\n\nEjemplo: 12345678-9"
    });
  }
  
  sessions[userId] = { 
    ...session, 
    stage: 'getting-email',
    patientRUT: rut,
    lastActivity: Date.now()
  };
  
  return NextResponse.json({
    text: "✅ RUT registrado.\n\nFinalmente, tu email para confirmaciones:\n\nEjemplo: juan@email.com",
    session: sessions[userId]
  });
}

async function manejarEmail(session, message, userId) {
  const email = message.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return NextResponse.json({
      text: "Email inválido. Por favor ingresa un email válido:\n\nEjemplo: juan@email.com"
    });
  }
  
  // ✅ PROCESAR RESERVA FINAL
  return await procesarReservaFinal(session, email, userId);
}

async function procesarReservaFinal(session, email, userId) {
  const { records, specialty, attempts, patientName, patientPhone, patientRUT } = session;
  
  const selectedRecord = records[attempts || 0];
  
  if (!selectedRecord) {
    console.error("❌ No hay sobrecupo seleccionado");
    sessions[userId] = { lastActivity: Date.now() };
    return NextResponse.json({
      text: "❌ Error: No se encontró el sobrecupo seleccionado. Por favor intenta nuevamente."
    });
  }
  
  try {
    console.log("🏥 Iniciando proceso de reserva final...");
    
    const pacienteId = await crearPaciente({
      name: patientName,
      phone: patientPhone,
      rut: patientRUT,
      email: email
    });
    
    if (!pacienteId) {
      sessions[userId] = { lastActivity: Date.now() };
      return NextResponse.json({
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
      return NextResponse.json({
        text: `✅ ¡Cita confirmada exitosamente!\n\n📋 Detalles de tu cita:\n👤 Paciente: ${patientName}\n🩺 Especialidad: ${specialty}\n👨‍⚕️ Médico: Dr. ${medicoInfo.name}\n📅 Fecha: ${selectedRecord.fields.Fecha}\n🕐 Hora: ${selectedRecord.fields.Hora}\n🏥 Clínica: ${selectedRecord.fields["Clínica"]}\n📧 Email: ${email}\n\n💡 Llega 15 minutos antes. ¡Nos vemos pronto!`
      });
    } else {
      return NextResponse.json({
        text: `❌ Hubo un problema técnico confirmando tu cita.\n\nTu información está guardada:\n• ${patientName}\n• ${specialty} - ${selectedRecord.fields.Fecha}\n\nTe contactaremos pronto para confirmar.`
      });
    }
    
  } catch (error) {
    console.error("❌ Error en reserva final:", error);
    sessions[userId] = { lastActivity: Date.now() };
    
    return NextResponse.json({
      text: "❌ Error procesando tu reserva. Por favor intenta nuevamente o contacta soporte."
    });
  }
}

// ===============================
// 🔍 FUNCIONES DE DETECCIÓN
// ===============================

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

function detectarEspecialidadPorSintomas(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  
  // 👁️ SÍNTOMAS OFTALMOLÓGICOS
  const sintomasOftalmologia = [
    'vision borrosa', 'visión borrosa', 'veo borroso', 'veo mal', 'no veo bien',
    'ojo rojo', 'ojos rojos', 'irritado', 'irritados', 'irritacion',
    'picazon ojos', 'picazón ojos', 'me pican los ojos', 'pican ojos',
    'dolor de ojos', 'duelen los ojos', 'ojo duele', 'dolor ocular',
    'lagrimeo', 'lagrimas', 'ardor en los ojos', 'quemazón ojos'
  ];
  
  // 🏥 SÍNTOMAS DERMATOLÓGICOS
  const sintomasDermatologia = [
    'picazon piel', 'picazón piel', 'me pica la piel', 'comezón piel',
    'sarpullido', 'roncha', 'ronchas', 'erupcion', 'erupción',
    'alergia piel', 'dermatitis', 'eczema', 'urticaria'
  ];
  
  // Verificar síntomas
  for (const sintoma of sintomasOftalmologia) {
    if (textoLimpio.includes(sintoma)) return 'Oftalmología';
  }
  
  for (const sintoma of sintomasDermatologia) {
    if (textoLimpio.includes(sintoma)) return 'Dermatología';
  }
  
  return null;
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

async function buscarYResponderSobrecupos(specialty, originalText, userId, esSintoma = false) {
  try {
    const records = await buscarSobrecupos(specialty);
    
    if (records.length === 0) {
      const mensaje = esSintoma 
        ? `Por tus síntomas, recomiendo consultar con ${specialty}.\n\nActualmente no tengo sobrecupos disponibles. ¿Te gustaría que te contacte cuando haya disponibilidad?`
        : `No tengo sobrecupos de ${specialty} disponibles ahora.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`;
      
      return NextResponse.json({ text: mensaje });
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
      ? `Por tus síntomas, te recomiendo ver a un especialista en ${specialty}.\n\n✅ Encontré un sobrecupo disponible:\n\n🏥 ${first["Clínica"]}\n📍 ${first["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Responde *sí* para reservar o *no* para ver otra opción.`
      : `✅ Encontré un sobrecupo de ${specialty}:\n\n🏥 ${first["Clínica"]}\n📍 ${first["Dirección"]}\n👨‍⚕️ Dr. ${medicoNombre}\n📅 ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Responde *sí* para reservar.`;

    return NextResponse.json({
      text: mensaje,
      session: sessions[userId]
    });

  } catch (error) {
    console.error("❌ Error buscando sobrecupos:", error);
    return NextResponse.json({
      text: "Error consultando disponibilidad. Por favor intenta más tarde."
    });
  }
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
    
    // Filtrar fechas futuras y disponibles
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return data.records.filter(record => {
      const fields = record.fields || {};
      
      const esEspecialidadCorrecta = fields.Especialidad === specialty;
      const estaDisponible = fields.Disponible === "Si" || fields.Disponible === true;
      
      if (!esEspecialidadCorrecta || !estaDisponible) {
        return false;
      }
      
      if (fields.Fecha) {
        try {
          const fechaSobrecupo = new Date(fields.Fecha);
          fechaSobrecupo.setHours(0, 0, 0, 0);
          return fechaSobrecupo >= hoy;
        } catch (err) {
          return false;
        }
      }
      
      return false;
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
        Nombre: patientData.name?.trim() || "",
        Telefono: patientData.phone?.trim() || "",
        Rut: patientData.rut?.trim() || "",  // ✅ "Rut" no "RUT"
        Email: patientData.email?.trim() || "",
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
      console.error("❌ Error Airtable:", data.error);
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

    if (!response.ok) {
      console.error("❌ Error actualizando sobrecupo:", response.status);
      return false;
    }

    console.log("✅ Sobrecupo actualizado");
    return true;
  } catch (error) {
    console.error("❌ Error general actualizando sobrecupo:", error);
    return false;
  }
}