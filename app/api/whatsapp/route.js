import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_PATIENTS_TABLE = process.env.AIRTABLE_PATIENTS_TABLE;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID; // Tabla de sobrecupos

// Configuración WhatsApp Business API
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// POST: Enviar notificación de sobrecupo a pacientes relevantes
export async function POST(req) {
  try {
    const body = await req.json();
    const { sobrecupoId, specialty, location, fecha, hora, clinica } = body;
    
    console.log('📱 Procesando notificación WhatsApp para sobrecupo:', sobrecupoId);
    
    if (!sobrecupoId || !specialty) {
      return NextResponse.json({ error: "Datos de sobrecupo requeridos" }, { status: 400 });
    }
    
    // 1. Buscar pacientes que deberían recibir esta notificación
    const targetPatients = await findTargetPatients(specialty, location);
    
    if (targetPatients.length === 0) {
      console.log('📭 No hay pacientes objetivo para esta notificación');
      return NextResponse.json({ 
        success: true, 
        message: "No hay pacientes objetivo",
        sentCount: 0
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
      error: "Error enviando notificaciones",
      details: error.message 
    }, { status: 500 });
  }
}

// GET: Webhook verification para WhatsApp
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Buscar pacientes que deberían recibir notificación del sobrecupo
async function findTargetPatients(specialty, location) {
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
      `maxRecords=50`; // Límite para evitar spam masivo
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Error buscando pacientes: ${res.status}`);
    }
    
    const data = await res.json();
    const patients = data.records || [];
    
    console.log(`📋 Pacientes encontrados: ${patients.length}`);
    
    // Filtrar pacientes que no han recibido notificaciones recientes (evitar spam)
    const filteredPatients = patients.filter(patient => {
      const lastNotification = patient.fields?.LastNotification;
      if (!lastNotification) return true;
      
      const timeSince = Date.now() - new Date(lastNotification).getTime();
      const hoursThreshold = 2 * 60 * 60 * 1000; // 2 horas
      
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
async function sendSobrecupoNotification(patient, sobrecupoData) {
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
function buildSobrecupoMessage(patientName, sobrecupoData) {
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
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ WhatsApp API no configurada, simulando envío...');
      console.log(`📱 Simulated to ${phoneNumber}:`, message);
      return true; // Simular éxito para desarrollo
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''),
          type: 'text',
          text: {
            body: message
          }
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ WhatsApp enviado:', result.messages?.[0]?.id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
}

// Actualizar timestamp de última notificación del paciente
async function updatePatientLastNotification(patientId) {
  try {
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: patientId,
            fields: {
              LastNotification: new Date().toISOString(),
              LastActivity: new Date().toISOString()
            }
          }]
        }),
      }
    );
  } catch (error) {
    console.error('❌ Error actualizando timestamp paciente:', error);
    // No fallar por esto
  }
}

// Formatear fecha para mostrar en mensaje
function formatDate(dateString) {
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

// Función movida a lib/whatsapp-notification.ts para evitar problemas con Next.js routes