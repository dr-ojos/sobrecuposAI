import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_WHATSAPP_PATIENTS_TABLE = process.env.AIRTABLE_WHATSAPP_PATIENTS_TABLE || "PacientesWhatsApp";

// Types for WhatsApp Patients API
interface WhatsAppPatientFields {
  Nombre: string;
  Email: string;
  WhatsApp: string;
  RUT: string;
  FechaNacimiento: string;
  Edad: number;
  AcceptTerms: boolean;
  AcceptWhatsApp: boolean;
  UserType: string;
  Status: string;
  FechaRegistro: string;
  LastActivity: string;
  RegistrationSource: string;
  NotificationCount: number;
  ConvertedToPaciente: boolean;
}

interface WhatsAppPatientRecord {
  id: string;
  fields: WhatsAppPatientFields;
  createdTime?: string;
}

interface WhatsAppPatientRequest {
  name: string;
  phone: string;
  email: string;
  userType: string;
  acceptTerms: boolean;
  acceptWhatsApp?: boolean;
  birthDate: string;
  rut?: string;
}

interface WhatsAppPatientResponse {
  success: boolean;
  id: string;
  message: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    whatsapp: string;
    edad: number;
    acceptWhatsApp: boolean;
  };
}

interface UpdateWhatsAppPatientRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  rut?: string;
  birthDate?: string;
  acceptWhatsApp?: boolean;
  status?: string;
  convertedToPaciente?: boolean;
}

interface AirtableResponse {
  records: WhatsAppPatientRecord[];
  offset?: string;
}

interface AirtableError {
  error: {
    type: string;
    message: string;
  };
}

// Función para calcular edad
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// GET: obtener lista de registros WhatsApp
export async function GET(): Promise<NextResponse<WhatsAppPatientRecord[] | { error: string }>> {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('❌ Variables de entorno de Airtable no configuradas');
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_WHATSAPP_PATIENTS_TABLE}?sort[0][field]=FechaRegistro&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data: AirtableResponse = await res.json();
    
    if (!res.ok) {
      console.error('❌ Error Airtable registros WhatsApp:', data);
      return NextResponse.json([], { status: 500 });
    }
    
    console.log('✅ Registros WhatsApp obtenidos:', data.records?.length || 0);
    return NextResponse.json(data.records || []);
  } catch (err) {
    console.error('❌ Error obteniendo registros WhatsApp:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: registrar nuevo usuario para WhatsApp
export async function POST(req: NextRequest): Promise<NextResponse<WhatsAppPatientResponse | { error: string }>> {
  try {
    const body: WhatsAppPatientRequest = await req.json();
    
    console.log('📝 Registrando nuevo usuario WhatsApp:', body);
    
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

    if (!body.birthDate) {
      return NextResponse.json({ error: "Fecha de nacimiento es obligatoria" }, { status: 400 });
    }
    
    // Calcular edad
    const age = calculateAge(body.birthDate);
    if (age === null || age < 0 || age > 120) {
      return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
    }

    // Formatear número de WhatsApp
    const formattedPhone = formatPhoneNumber(body.phone);
    
    // Verificar si el usuario ya existe en la tabla WhatsApp
    const existingUser = await checkExistingWhatsAppUser(body.email, formattedPhone);
    if (existingUser) {
      return NextResponse.json({ 
        error: "Ya existe un registro con este email o WhatsApp" 
      }, { status: 400 });
    }
    
    // Preparar datos para la nueva tabla
    const whatsappUserData: WhatsAppPatientFields = {
      "Nombre": body.name.trim(),
      "Email": body.email.trim().toLowerCase(),
      "WhatsApp": formattedPhone,
      "RUT": body.rut?.trim() || "",
      "FechaNacimiento": body.birthDate,
      "Edad": age,
      "AcceptTerms": body.acceptTerms,
      "AcceptWhatsApp": body.acceptWhatsApp || false,
      "UserType": "patient",
      "Status": "active",
      "FechaRegistro": new Date().toISOString().split('T')[0],
      "LastActivity": new Date().toISOString().split('T')[0],
      "RegistrationSource": "whatsapp_form",
      "NotificationCount": 0,
      "ConvertedToPaciente": false
    };
    
    console.log('📤 Enviando registro WhatsApp a Airtable:', whatsappUserData);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_WHATSAPP_PATIENTS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          fields: whatsappUserData
        }),
      }
    );
    
    const data: WhatsAppPatientRecord | AirtableError = await res.json();
    
    if ('error' in data) {
      console.error('❌ Error creando registro WhatsApp en Airtable:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }
    
    console.log('✅ Usuario WhatsApp registrado exitosamente:', data.id);
    
    // 🆕 Enviar mensaje de bienvenida por WhatsApp (si acepta notificaciones)
    if (body.acceptWhatsApp) {
      try {
        await sendWelcomeWhatsApp(whatsappUserData, data.id);
      } catch (whatsappError) {
        console.error('⚠️ Error enviando WhatsApp de bienvenida:', whatsappError);
        // No fallar el registro por esto
      }
    }
    
    // Retornar datos del usuario registrado
    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Registro exitoso para notificaciones WhatsApp",
      user: {
        id: data.id,
        nombre: whatsappUserData.Nombre,
        email: whatsappUserData.Email,
        whatsapp: whatsappUserData.WhatsApp,
        edad: whatsappUserData.Edad,
        acceptWhatsApp: whatsappUserData.AcceptWhatsApp
      }
    });
    
  } catch (err) {
    console.error('❌ Error en POST registros WhatsApp:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: actualizar registro WhatsApp
export async function PUT(req: NextRequest): Promise<NextResponse<WhatsAppPatientRecord | { error: string }>> {
  try {
    const body: UpdateWhatsAppPatientRequest = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log('📝 Actualizando registro WhatsApp:', id, updateData);
    
    const cleanData: Partial<WhatsAppPatientFields> = {};
    if (updateData.name) cleanData.Nombre = updateData.name.trim();
    if (updateData.email) cleanData.Email = updateData.email.trim().toLowerCase();
    if (updateData.phone) cleanData.WhatsApp = formatPhoneNumber(updateData.phone);
    if (updateData.rut !== undefined) cleanData.RUT = updateData.rut?.trim() || "";
    if (updateData.birthDate) {
      cleanData.FechaNacimiento = updateData.birthDate;
      const age = calculateAge(updateData.birthDate);
      if (age !== null) cleanData.Edad = age;
    }
    if (updateData.acceptWhatsApp !== undefined) cleanData.AcceptWhatsApp = updateData.acceptWhatsApp;
    if (updateData.status) cleanData.Status = updateData.status;
    if (updateData.convertedToPaciente !== undefined) cleanData.ConvertedToPaciente = updateData.convertedToPaciente;
    
    // Actualizar actividad
    cleanData.LastActivity = new Date().toISOString().split('T')[0];
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_WHATSAPP_PATIENTS_TABLE}`,
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
    
    const data: AirtableResponse | AirtableError = await res.json();
    
    if ('error' in data) {
      console.error('❌ Error actualizando registro WhatsApp:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }
    
    console.log('✅ Registro WhatsApp actualizado:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error actualizando registro WhatsApp:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: desactivar registro WhatsApp
export async function DELETE(req: NextRequest): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log('🗑️ Desactivando registro WhatsApp:', id);
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_WHATSAPP_PATIENTS_TABLE}`,
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
              LastActivity: new Date().toISOString().split('T')[0]
            }
          }]
        }),
      }
    );
    
    const data: AirtableResponse | AirtableError = await res.json();
    
    if ('error' in data) {
      console.error('❌ Error desactivando registro WhatsApp:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }
    
    console.log('✅ Registro WhatsApp desactivado:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Registro WhatsApp desactivado correctamente" 
    });
  } catch (err) {
    console.error('❌ Error desactivando registro WhatsApp:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Formatear número de teléfono chileno
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('9')) {
    return '+56' + cleaned;
  }
  
  if (cleaned.length === 8) {
    return '+569' + cleaned;
  }
  
  return '+56' + cleaned;
}

// Verificar usuario WhatsApp existente
async function checkExistingWhatsAppUser(email: string, phone: string): Promise<boolean> {
  try {
    const formula = `OR({Email} = "${email.toLowerCase()}", {WhatsApp} = "${phone}")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_WHATSAPP_PATIENTS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (res.ok) {
      const data: AirtableResponse = await res.json();
      return data.records && data.records.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verificando usuario WhatsApp existente:', error);
    return false;
  }
}

// Enviar WhatsApp de bienvenida
async function sendWelcomeWhatsApp(userData: WhatsAppPatientFields, userId: string): Promise<boolean> {
  try {
    console.log('📱 Enviando WhatsApp de bienvenida a:', userData.WhatsApp);
    
    const welcomeMessage = `¡Hola ${userData.Nombre}! 👋

Bienvenido/a a *Sobrecupos AI* 🩺

Tu registro fue exitoso. Ahora recibirás notificaciones automáticas cuando haya sobrecupos médicos disponibles.

✅ *¿Qué sigue?*
• Te avisaremos por WhatsApp cuando haya sobrecupos disponibles
• Podrás confirmar tu cita respondiendo a nuestros mensajes
• Sin llamadas, sin esperas

🔔 *Te notificaremos sobre:*
• Sobrecupos para tu edad (${userData.Edad} años)
• Médicos que atienden ${userData.Edad < 18 ? 'niños' : 'adultos'}
• Citas disponibles para hoy o mañana

⚡ *Respuesta rápida:* Solo responde *SÍ* cuando te interese un sobrecupo.

¿Tienes alguna pregunta? Solo responde este mensaje.

_Sobrecupos AI - Más tiempo sano, menos tiempo enfermo_`;

    console.log('📱 Mensaje WhatsApp preparado:', {
      to: userData.WhatsApp,
      message: welcomeMessage,
      userId: userId
    });
    
    // TODO: Integrar con WhatsApp Business API real
    return true;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de bienvenida:', error);
    throw error;
  }
}