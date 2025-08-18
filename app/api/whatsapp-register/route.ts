// app/api/whatsapp-register/route.ts
// 🚀 VERSIÓN CORREGIDA - Arregla el error de registro de pacientes

import { NextRequest, NextResponse } from 'next/server';

// Types for WhatsApp Register API
interface WhatsAppRegisterRequest {
  nombre: string;
  edad: number;
  telefono: string;
  rut?: string;
}

interface WhatsAppRegisterResponse {
  success: boolean;
  message: string;
  patientId: string;
  details: {
    nombre: string;
    edad: number;
    telefono: string;
  };
}

interface WhatsAppRegisterError {
  error: string;
  details?: string;
  message?: string;
}

interface AirtablePatientFields {
  Nombre: string;
  Edad: number;
  Telefono: string;
  Rut: string;
  Email: string;
  "Fecha Registro": string;
  "Registro WhatsApp": boolean;
  Estado: string;
  Fuente: string;
}

interface AirtableCreateResponse {
  id: string;
  fields: AirtablePatientFields;
  createdTime: string;
}

interface AirtableErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

interface AirtableListResponse {
  records: AirtableCreateResponse[];
  offset?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<WhatsAppRegisterResponse | WhatsAppRegisterError>> {
  try {
    // 1. Obtener datos del formulario
    const { nombre, edad, telefono, rut }: WhatsAppRegisterRequest = await req.json();

    console.log('📝 Registro WhatsApp recibido:', { nombre, edad, telefono, rut });

    // 2. Validaciones básicas mejoradas
    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    if (!edad || edad < 1 || edad > 120) {
      return NextResponse.json(
        { error: 'La edad debe estar entre 1 y 120 años' },
        { status: 400 }
      );
    }

    if (!telefono?.trim()) {
      return NextResponse.json(
        { error: 'El teléfono es obligatorio' },
        { status: 400 }
      );
    }

    // 3. Formatear teléfono chileno
    const formattedPhone = formatPhoneNumber(telefono.trim());
    
    // 4. Formatear RUT chileno si se proporciona
    const formattedRut = rut?.trim() || '';

    // 5. Verificar variables de entorno
    const {
      AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID,
      AIRTABLE_PATIENTS_TABLE
    } = process.env;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_PATIENTS_TABLE) {
      console.error('❌ Variables de Airtable no configuradas');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // 6. Verificar si el teléfono ya existe
    console.log('🔍 Verificando si el teléfono ya existe...');
    const existingPatient = await checkExistingPatient(formattedPhone);
    
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Este teléfono ya está registrado en nuestro sistema' },
        { status: 409 }
      );
    }

    // 7. ✅ ESTRUCTURA CORREGIDA - Usar nombres de campos exactos de Airtable
    console.log('💾 Creando paciente en Airtable...');
    const record = {
      fields: {
        // ✅ Usar nombres exactos que existen en Airtable
        "Nombre": nombre.trim(),
        "Edad": parseInt(edad.toString()),
        "Telefono": formattedPhone,
        "Rut": formattedRut, // ✅ "Rut" no "RUT"
        "Email": `${formattedPhone.replace('+', '')}@whatsapp.sobrecupos.com`, // Email único
        "Fecha Registro": new Date().toISOString().split('T')[0],
        "Registro WhatsApp": true,
        "Estado": "Activo",
        "Fuente": "Bot WhatsApp"
      }
    };

    console.log('📤 Enviando registro:', record);

    const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    const createData: AirtableCreateResponse | AirtableErrorResponse = await createResponse.json();

    if (!createResponse.ok) {
      console.error('❌ Error detallado de Airtable:', createData);
      
      // Mensaje de error más específico
      const errorMsg = 'error' in createData ? createData.error?.message || 'Error desconocido' : 'Error desconocido';
      
      if (errorMsg.includes('field')) {
        console.error('💡 Probable error de campo:', errorMsg);
      }
      
      return NextResponse.json(
        { 
          error: 'Error guardando tu registro. Intenta nuevamente.',
          details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
        },
        { status: 500 }
      );
    }

    const successData = createData as AirtableCreateResponse;
    console.log('✅ Paciente creado exitosamente:', successData.id);

    // 8. Enviar WhatsApp de confirmación
    await sendConfirmationWhatsApp(formattedPhone, nombre.trim(), successData.id);

    // 9. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: '¡Registro exitoso! Ya puedes recibir notificaciones de sobrecupos.',
      patientId: successData.id,
      details: {
        nombre: nombre.trim(),
        edad: parseInt(edad.toString()),
        telefono: formattedPhone
      }
    });

  } catch (error) {
    console.error('❌ Error general en registro WhatsApp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        error: 'Error interno del servidor. Intenta nuevamente.',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// 🔧 FUNCIONES AUXILIARES MEJORADAS

// Formatear número de teléfono chileno
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si ya tiene código de país chileno
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  // Si empieza con 9 (celular chileno)
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return '+56' + cleaned;
  }
  
  // Si son 8 dígitos, asumir celular sin el 9
  if (cleaned.length === 8) {
    return '+569' + cleaned;
  }
  
  // Si son 9 dígitos y empieza con 9
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return '+56' + cleaned;
  }
  
  // Default: agregar código país
  return '+56' + cleaned;
}

// Verificar si ya existe un paciente con el mismo teléfono
async function checkExistingPatient(phone: string): Promise<boolean> {
  try {
    const formula = `{Telefono} = "${phone}"`;
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PATIENTS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });
    
    if (res.ok) {
      const data: AirtableListResponse = await res.json();
      return data.records && data.records.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verificando paciente existente:', error);
    return false; // En caso de error, permitir el registro
  }
}

// Enviar WhatsApp de confirmación (cuando tengas Twilio configurado)
async function sendConfirmationWhatsApp(telefono: string, nombre: string, patientId: string): Promise<boolean> {
  try {
    console.log('📱 Enviando confirmación WhatsApp a:', telefono);
    
    // TODO: Implementar con Twilio cuando esté configurado
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${telefono}`,
      body: `¡Hola ${nombre}! 🎉

✅ *Registro exitoso en Sobrecupos AI*

Ahora recibirás notificaciones automáticas cuando haya sobrecupos médicos disponibles.

🔔 *Te avisaremos sobre:*
• Sobrecupos disponibles hoy y mañana
• Especialidades que te puedan interesar
• Citas canceladas de último minuto

⚡ *Respuesta rápida:* Solo responde *SÍ* cuando te interese un sobrecupo.

¡Bienvenido al futuro de la salud! 🩺`
    });

    console.log('✅ WhatsApp confirmación enviado:', message.sid);
    return message.sid;
    */
    
    // Por ahora solo log
    console.log(`📱 [SIMULADO] Confirmación para ${nombre} (${telefono}): Registro exitoso`);
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de confirmación:', error);
    // No fallar el registro por esto
    return false;
  }
}