// app/api/whatsapp/route.ts - API de WhatsApp en TypeScript
import { NextRequest, NextResponse } from "next/server";
import type {
  WhatsAppPatient,
  SobrecupoNotificationData,
  WhatsAppNotificationRequest,
  WhatsAppNotificationResponse,
  WhatsAppMessageData,
  WhatsAppApiResponse,
  PatientUpdateRequest,
  WebhookVerificationParams
} from "../../../types/whatsapp";

// Environment variables con tipos
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID as string;
const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE as string;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID as string;

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID as string;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN as string;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN as string;

// Constantes
const MAX_PATIENTS_PER_NOTIFICATION = 50;
const SPAM_THRESHOLD_HOURS = 2;
const WHATSAPP_API_VERSION = "v18.0";

// Validación de configuración
function validateEnvironment(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_PATIENTS_TABLE);
}

// POST: Enviar notificación de sobrecupo a pacientes relevantes
export async function POST(request: NextRequest): Promise<NextResponse<WhatsAppNotificationResponse>> {
  try {
    if (!validateEnvironment()) {
      return NextResponse.json({
        success: false,
        error: "Configuración de Airtable incompleta"
      }, { status: 500 });
    }

    const body: WhatsAppNotificationRequest = await request.json();
    const { sobrecupoId, specialty, location, fecha, hora, clinica } = body;
    
    console.log('📱 Procesando notificación WhatsApp para sobrecupo:', sobrecupoId);
    
    // Validar datos requeridos
    if (!sobrecupoId || !specialty || !fecha || !hora || !clinica) {
      return NextResponse.json({
        success: false,
        error: "Datos de sobrecupo requeridos: sobrecupoId, specialty, fecha, hora, clinica"
      }, { status: 400 });
    }
    
    // 1. Buscar pacientes que deberían recibir esta notificación
    const targetPatients = await findTargetPatients(specialty, location);
    
    if (targetPatients.length === 0) {
      console.log('📭 No hay pacientes objetivo para esta notificación');
      return NextResponse.json({ 
        success: true, 
        message: "No hay pacientes objetivo",
        sentCount: 0,
        failedCount: 0,
        totalPatients: 0
      });
    }
    
    console.log(`📬 Enviando notificación a ${targetPatients.length} pacientes`);
    
    // 2. Enviar mensajes a cada paciente
    const results = await Promise.allSettled(
      targetPatients.map(patient => 
        sendSobrecupoNotification(patient, {
          sobrecupoId,
          specialty,
          location,
          fecha,
          hora,
          clinica
        })
      )
    );
    
    // 3. Contar éxitos y fallos
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ WhatsApp enviados: ${successful} éxitos, ${failed} fallos`);
    
    return NextResponse.json({
      success: true,
      message: "Notificaciones procesadas",
      sentCount: successful,
      failedCount: failed,
      totalPatients: targetPatients.length
    });
    
  } catch (error) {
    console.error('❌ Error procesando notificaciones WhatsApp:', error);
    return NextResponse.json({ 
      success: false,
      error: "Error enviando notificaciones",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}

// GET: Webhook verification para WhatsApp
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    
    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      console.log("✅ WhatsApp webhook verificado");
      return new Response(challenge, { status: 200 });
    }
    
    console.error("❌ Verificación de webhook fallida");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
  } catch (error) {
    console.error('❌ Error en verificación webhook:', error);
    return NextResponse.json({ 
      error: "Error interno",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Buscar pacientes que deberían recibir notificación del sobrecupo
async function findTargetPatients(specialty: string, location?: string): Promise<WhatsAppPatient[]> {
  try {
    console.log(`🔍 Buscando pacientes para: ${specialty} en ${location || 'todas las ubicaciones'}`);
    
    // Construir fórmula para filtrar pacientes activos que aceptan WhatsApp
    let formula = `AND({Status} = "active", {AcceptWhatsApp} = TRUE())`;
    
    // Si hay especialidad, filtrar por pacientes interesados
    if (specialty) {
      formula = `AND(${formula}, OR(
        FIND("${specialty}", ARRAYJOIN({PreferredSpecialties})) > 0,
        {PreferredSpecialties} = BLANK()
      ))`;
    }
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&` +
      `maxRecords=${MAX_PATIENTS_PER_NOTIFICATION}`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Error buscando pacientes: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const patients: WhatsAppPatient[] = data.records || [];
    
    console.log(`📋 Pacientes encontrados: ${patients.length}`);
    
    // Filtrar pacientes que no han recibido notificaciones recientes (evitar spam)
    const filteredPatients = patients.filter(patient => {
      const lastNotification = patient.fields?.LastNotification;
      if (!lastNotification) return true;
      
      const timeSince = Date.now() - new Date(lastNotification).getTime();
      const hoursThreshold = SPAM_THRESHOLD_HOURS * 60 * 60 * 1000;
      
      return timeSince > hoursThreshold;
    });
    
    console.log(`📬 Pacientes elegibles (sin spam reciente): ${filteredPatients.length}`);
    
    return filteredPatients;
    
  } catch (error) {
    console.error('❌ Error buscando pacientes objetivo:', error);
    return [];
  }
}

// Enviar notificación de sobrecupo a un paciente específico
async function sendSobrecupoNotification(
  patient: WhatsAppPatient, 
  sobrecupoData: SobrecupoNotificationData
): Promise<boolean> {
  try {
    const patientPhone = patient.fields?.WhatsApp;
    const patientName = patient.fields?.Name;
    
    if (!patientPhone) {
      throw new Error('Paciente sin WhatsApp');
    }
    
    console.log(`📱 Enviando a ${patientName} (${patientPhone})`);
    
    // Construir mensaje personalizado
    const message = buildSobrecupoMessage(patientName, sobrecupoData);
    
    // Enviar mensaje via WhatsApp Business API
    const sent = await sendWhatsAppMessage(patientPhone, message);
    
    if (sent) {
      // Actualizar timestamp de última notificación
      await updatePatientLastNotification(patient.id);
      console.log(`✅ Mensaje enviado a ${patientName}`);
    }
    
    return sent;
    
  } catch (error) {
    console.error(`❌ Error enviando a ${patient.fields?.Name}:`, error);
    throw error;
  }
}

// Construir mensaje de WhatsApp personalizado
function buildSobrecupoMessage(patientName: string, sobrecupoData: SobrecupoNotificationData): string {
  const { specialty, fecha, hora, clinica, location } = sobrecupoData;
  
  return `🩺 *¡Sobrecupo Disponible!*

Hola ${patientName} 👋

Tenemos un sobrecupo que podría interesarte:

📋 *Especialidad:* ${specialty}
📅 *Fecha:* ${formatDate(fecha)}
🕐 *Hora:* ${hora}
🏥 *Clínica:* ${clinica}
📍 *Ubicación:* ${location || clinica}

💬 *¿Te interesa?*
Responde *SÍ* para reservar este sobrecupo
Responde *NO* para no recibir más notificaciones hoy

⏰ *¡Rápido!* Los sobrecupos se agotan rápido.

_Sobrecupos AI - Tu salud no puede esperar_`;
}

// Enviar mensaje via WhatsApp Business API
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ WhatsApp API no configurada, simulando envío...');
      console.log(`📱 Simulated to ${phoneNumber}:`, message);
      return true; // Simular éxito para desarrollo
    }
    
    const messageData: WhatsAppMessageData = {
      messaging_product: 'whatsapp',
      to: phoneNumber.replace('+', ''),
      type: 'text',
      text: {
        body: message
      }
    };
    
    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      }
    );
    
    if (!response.ok) {
      const errorData: WhatsAppApiResponse = await response.json();
      throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const result: WhatsAppApiResponse = await response.json();
    console.log('✅ WhatsApp enviado:', result.messages?.[0]?.id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
}

// Actualizar timestamp de última notificación del paciente
async function updatePatientLastNotification(patientId: string): Promise<void> {
  try {
    const updateData: PatientUpdateRequest = {
      records: [{
        id: patientId,
        fields: {
          LastNotification: new Date().toISOString(),
          LastActivity: new Date().toISOString()
        }
      }]
    };

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`Error actualizando paciente: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error actualizando timestamp paciente:', error);
    // No fallar por esto - es un update informativo
  }
}

// Formatear fecha para mostrar en mensaje
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-CL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  } catch (error) {
    return dateString;
  }
}