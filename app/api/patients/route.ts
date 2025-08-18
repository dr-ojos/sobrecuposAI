// app/api/patients/route.ts - API de pacientes en TypeScript
import { NextRequest, NextResponse } from "next/server";
import type {
  Patient,
  PatientFields,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientResponse,
  PatientListResponse,
  AirtablePatientRecord,
  AirtablePatchRequest,
  WelcomeWhatsAppData
} from "../../../types/patient";

// Environment variables con tipos
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID as string;
const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE as string;

// Validación de configuración
function validateEnvironment(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_PATIENTS_TABLE);
}

// Validación de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// GET: obtener lista de pacientes (para admin)
export async function GET(): Promise<NextResponse<PatientListResponse | { error: string }>> {
  try {
    if (!validateEnvironment()) {
      console.error('❌ Variables de entorno de Airtable no configuradas para pacientes');
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?maxRecords=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ Error Airtable pacientes:', data);
      return NextResponse.json({ error: "Error obteniendo pacientes" }, { status: 500 });
    }
    
    const patients: Patient[] = data.records || [];
    console.log('✅ Pacientes obtenidos:', patients.length);
    
    return NextResponse.json({
      success: true,
      patients: patients
    });
  } catch (err) {
    console.error('❌ Error obteniendo pacientes:', err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: registrar nuevo paciente
export async function POST(request: NextRequest): Promise<NextResponse<PatientResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        message: "Configuración de base de datos incompleta"
      }, { status: 500 });
    }

    const body: CreatePatientRequest = await request.json();
    
    console.log('📝 Registrando nuevo paciente:', body);
    
    // Validaciones básicas
    if (!body.name?.trim()) {
      return NextResponse.json({
        success: false,
        message: "Nombre es obligatorio"
      }, { status: 400 });
    }
    
    if (!body.phone?.trim()) {
      return NextResponse.json({
        success: false,
        message: "WhatsApp es obligatorio"
      }, { status: 400 });
    }
    
    if (!body.email?.trim() || !isValidEmail(body.email)) {
      return NextResponse.json({
        success: false,
        message: "Email válido es obligatorio"
      }, { status: 400 });
    }
    
    if (!body.userType || body.userType !== 'patient') {
      return NextResponse.json({
        success: false,
        message: "Tipo de usuario inválido"
      }, { status: 400 });
    }
    
    if (!body.acceptTerms) {
      return NextResponse.json({
        success: false,
        message: "Debe aceptar términos y condiciones"
      }, { status: 400 });
    }

    // Formatear número de WhatsApp
    const formattedPhone = formatPhoneNumber(body.phone);
    
    // Verificar si el paciente ya existe (por email o teléfono)
    const existingPatient = await checkExistingPatient(body.email, formattedPhone);
    if (existingPatient) {
      return NextResponse.json({
        success: false,
        message: "Ya existe un paciente registrado con este email o WhatsApp"
      }, { status: 400 });
    }
    
    // Preparar datos para Airtable
    const patientData: PatientFields = {
      Name: body.name.trim(),
      Email: body.email.trim().toLowerCase(),
      WhatsApp: formattedPhone,
      RUT: body.rut?.trim() || "",
      AcceptTerms: body.acceptTerms,
      AcceptWhatsApp: body.acceptWhatsApp || false,
      UserType: "patient",
      Status: "active",
      Created: new Date().toISOString(),
      PreferredSpecialties: body.preferredSpecialties || [],
      Location: body.location || "",
      RegistrationSource: "whatsapp_form",
      LastActivity: new Date().toISOString()
    };
    
    console.log('📤 Enviando paciente a Airtable:', patientData);
    
    const airtableData = {
      fields: patientData
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(airtableData),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error creando paciente en Airtable:', data.error);
      return NextResponse.json({
        success: false,
        message: data.error.message || "Error creando paciente"
      }, { status: 500 });
    }
    
    console.log('✅ Paciente registrado exitosamente:', data.id);
    
    // Enviar mensaje de bienvenida por WhatsApp (si acepta notificaciones)
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
      message: "Paciente registrado exitosamente",
      patient: {
        id: data.id,
        fields: patientData,
        createdTime: data.createdTime
      }
    });
    
  } catch (err) {
    console.error('❌ Error en POST pacientes:', err);
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : "Error interno del servidor"
    }, { status: 500 });
  }
}

// PUT: actualizar paciente existente
export async function PUT(request: NextRequest): Promise<NextResponse<Patient | { error: string }>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({ error: "Configuración de base de datos incompleta" }, { status: 500 });
    }

    const body: UpdatePatientRequest = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log('📝 Actualizando paciente:', id, updateData);
    
    // Preparar datos de actualización
    const cleanData: Partial<PatientFields> = {};
    if (updateData.name) cleanData.Name = updateData.name.trim();
    if (updateData.email) {
      if (!isValidEmail(updateData.email)) {
        return NextResponse.json({ error: "Email no válido" }, { status: 400 });
      }
      cleanData.Email = updateData.email.trim().toLowerCase();
    }
    if (updateData.phone) cleanData.WhatsApp = formatPhoneNumber(updateData.phone);
    if (updateData.rut !== undefined) cleanData.RUT = updateData.rut?.trim() || "";
    if (updateData.preferredSpecialties) cleanData.PreferredSpecialties = updateData.preferredSpecialties;
    if (updateData.location) cleanData.Location = updateData.location.trim();
    
    // Actualizar timestamp
    cleanData.LastActivity = new Date().toISOString();
    
    const patchData: AirtablePatchRequest = {
      records: [{
        id: id,
        fields: cleanData
      }]
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchData),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error actualizando paciente:', data.error);
      return NextResponse.json({ 
        error: data.error.message || "Error actualizando paciente" 
      }, { status: 500 });
    }
    
    console.log('✅ Paciente actualizado:', id);
    return NextResponse.json(data.records[0]);
  } catch (err) {
    console.error('❌ Error actualizando paciente:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Error interno del servidor" 
    }, { status: 500 });
  }
}

// DELETE: eliminar paciente (cambiar status a inactive)
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; message?: string; error?: string }>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        message: "Configuración de base de datos incompleta"
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "ID requerido"
      }, { status: 400 });
    }
    
    console.log('🗑️ Desactivando paciente:', id);
    
    // En lugar de eliminar, cambiar status a inactive
    const patchData: AirtablePatchRequest = {
      records: [{
        id: id,
        fields: {
          Status: "inactive",
          LastActivity: new Date().toISOString()
        }
      }]
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchData),
      }
    );
    
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Error desactivando paciente:', data.error);
      return NextResponse.json({
        success: false,
        message: data.error.message || "Error desactivando paciente"
      }, { status: 500 });
    }
    
    console.log('✅ Paciente desactivado:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Paciente desactivado correctamente" 
    });
  } catch (err) {
    console.error('❌ Error desactivando paciente:', err);
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : "Error interno del servidor"
    }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Formatear número de teléfono chileno
function formatPhoneNumber(phone: string): string {
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
async function checkExistingPatient(email: string, phone: string): Promise<boolean> {
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
async function sendWelcomeWhatsApp(patientData: PatientFields, patientId: string): Promise<boolean> {
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

    const welcomeData: WelcomeWhatsAppData = {
      to: patientData.WhatsApp,
      message: welcomeMessage,
      patientId: patientId
    };

    // Aquí integrarías con WhatsApp Business API
    // Por ahora, solo logueamos el mensaje
    console.log('📱 Mensaje WhatsApp preparado:', welcomeData);
    
    // TODO: Integrar con WhatsApp Business API real
    // await whatsappAPI.sendMessage(welcomeData);
    
    return true;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de bienvenida:', error);
    throw error;
  }
}