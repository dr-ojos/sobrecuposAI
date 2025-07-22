import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE; // Nueva variable de entorno

// GET: obtener lista de pacientes (para admin)
export async function GET() {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_PATIENTS_TABLE) {
      console.error('❌ Variables de entorno de Airtable no configuradas para pacientes');
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?sort[0][field]=Created&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ Error Airtable pacientes:', data);
      return NextResponse.json([], { status: 500 });
    }
    
    console.log('✅ Pacientes obtenidos:', data.records?.length || 0);
    return NextResponse.json(data.records || []);
  } catch (err) {
    console.error('❌ Error obteniendo pacientes:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: registrar nuevo paciente
export async function POST(req) {
  try {
    const body = await req.json();
    
    console.log('📝 Registrando nuevo paciente:', body);
    
    // Validaciones básicas
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
    }
    
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "WhatsApp es obligatorio" }, { status: 400 });
    }
    
    if (!body.email?.trim() || !body.email.includes('@')) {
      return NextResponse.json({ error: "Email válido es obligatorio" }, { status: 400 });
    }
    
    if (!body.userType || body.userType !== 'patient') {
      return NextResponse.json({ error: "Tipo de usuario inválido" }, { status: 400 });
    }
    
    if (!body.acceptTerms) {
      return NextResponse.json({ error: "Debe aceptar términos y condiciones" }, { status: 400 });
    }

    // Formatear número de WhatsApp
    const formattedPhone = formatPhoneNumber(body.phone);
    
    // Verificar si el paciente ya existe (por email o teléfono)
    const existingPatient = await checkExistingPatient(body.email, formattedPhone);
    if (existingPatient) {
      return NextResponse.json({ 
        error: "Ya existe un paciente registrado con este email o WhatsApp" 
      }, { status: 400 });
    }
    
    // Preparar datos para Airtable
    const patientData = {
      Name: body.name.trim(),
      Email: body.email.trim().toLowerCase(),
      WhatsApp: formattedPhone,
      RUT: body.rut?.trim() || "",
      AcceptTerms: body.acceptTerms,
      AcceptWhatsApp: body.acceptWhatsApp || false,
      UserType: "patient",
      Status: "active",
      Created: new Date().toISOString(),
      // Campos adicionales para segmentación
      PreferredSpecialties: body.preferredSpecialties || [],
      Location: body.location || "",
      // Campos de tracking
      RegistrationSource: "whatsapp_form",
      LastActivity: new Date().toISOString()
    };
    
    console.log('📤 Enviando paciente a Airtable:', patientData);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          fields: patientData
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error creando paciente en Airtable:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Paciente registrado exitosamente:', data.id);
    
    // 🆕 Enviar mensaje de bienvenida por WhatsApp (si acepta notificaciones)
    if (body.acceptWhatsApp) {
      try {
        await sendWelcomeWhatsApp(patientData, data.id);
      } catch (whatsappError) {
        console.error('⚠️ Error enviando WhatsApp de bienvenida:', whatsappError);
        // No fallar el registro por esto
      }
    }
    
    // Retornar datos del paciente registrado (sin información sensible)
    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Paciente registrado exitosamente",
      patient: {
        id: data.id,
        name: patientData.Name,
        email: patientData.Email,
        whatsapp: patientData.WhatsApp,
        acceptWhatsApp: patientData.AcceptWhatsApp
      }
    });
    
  } catch (err) {
    console.error('❌ Error en POST pacientes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: actualizar paciente existente
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log('📝 Actualizando paciente:', id, updateData);
    
    // Preparar datos de actualización
    const cleanData = {};
    if (updateData.name) cleanData.Name = updateData.name.trim();
    if (updateData.email) cleanData.Email = updateData.email.trim().toLowerCase();
    if (updateData.phone) cleanData.WhatsApp = formatPhoneNumber(updateData.phone);
    if (updateData.rut !== undefined) cleanData.RUT = updateData.rut?.trim() || "";
    if (updateData.preferredSpecialties) cleanData.PreferredSpecialties = updateData.preferredSpecialties;
    if (updateData.location) cleanData.Location = updateData.location.trim();
    
    // Actualizar timestamp
    cleanData.LastActivity = new Date().toISOString();
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: id,
            fields: cleanData
          }]
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error actualizando paciente:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Paciente actualizado:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error actualizando paciente:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: eliminar paciente (cambiar status a inactive)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log('🗑️ Desactivando paciente:', id);
    
    // En lugar de eliminar, cambiar status a inactive
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: id,
            fields: {
              Status: "inactive",
              LastActivity: new Date().toISOString()
            }
          }]
        }),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error desactivando paciente:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    console.log('✅ Paciente desactivado:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Paciente desactivado correctamente" 
    });
  } catch (err) {
    console.error('❌ Error desactivando paciente:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Formatear número de teléfono chileno
function formatPhoneNumber(phone) {
  if (!phone) return "";
  
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 56, mantenerlo
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  // Si empieza con 9, agregar código país
  if (cleaned.startsWith('9')) {
    return '+56' + cleaned;
  }
  
  // Si son 8 dígitos, agregar 9 y código país
  if (cleaned.length === 8) {
    return '+569' + cleaned;
  }
  
  return '+56' + cleaned;
}

// Verificar si ya existe un paciente con el mismo email o teléfono
async function checkExistingPatient(email, phone) {
  try {
    const formula = `OR({Email} = "${email.toLowerCase()}", {WhatsApp} = "${phone}")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.records && data.records.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verificando paciente existente:', error);
    return false; // En caso de error, permitir el registro
  }
}

// Enviar mensaje de bienvenida por WhatsApp
async function sendWelcomeWhatsApp(patientData, patientId) {
  try {
    console.log('📱 Enviando WhatsApp de bienvenida a:', patientData.WhatsApp);
    
    const welcomeMessage = `¡Hola ${patientData.Name}! 👋

Bienvenido/a a *Sobrecupos AI* 🩺

Tu registro fue exitoso. Ahora recibirás notificaciones automáticas cuando haya sobrecupos médicos disponibles que coincidan con tus necesidades.

✅ *¿Qué sigue?*
• Te avisaremos por WhatsApp cuando haya sobrecupos disponibles
• Podrás confirmar tu cita respondiendo a nuestros mensajes
• Sin llamadas, sin esperas

🔔 *Próximamente te notificaremos sobre:*
• Sobrecupos en tu zona
• Especialidades de tu interés
• Citas disponibles para hoy o mañana

¿Tienes alguna pregunta? Solo responde este mensaje.

_Sobrecupos AI - Más tiempo sano, menos tiempo enfermo_`;

    // Aquí integrarías con WhatsApp Business API
    // Por ahora, solo logueamos el mensaje
    console.log('📱 Mensaje WhatsApp preparado:', {
      to: patientData.WhatsApp,
      message: welcomeMessage,
      patientId: patientId
    });
    
    // TODO: Integrar con WhatsApp Business API real
    // await whatsappAPI.sendMessage({
    //   to: patientData.WhatsApp,
    //   message: welcomeMessage
    // });
    
    return true;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de bienvenida:', error);
    throw error;
  }
}