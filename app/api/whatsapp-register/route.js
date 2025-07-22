// app/api/whatsapp-register/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Obtener datos del formulario
    const { nombre, edad, telefono } = await req.json();

    console.log('📝 Registro WhatsApp recibido:', { nombre, edad, telefono });

    // 2. Validaciones básicas
    if (!nombre?.trim() || !edad || !telefono?.trim()) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono (debe empezar con +)
    if (!telefono.startsWith('+')) {
      return NextResponse.json(
        { error: 'El teléfono debe incluir código de país (ej: +56912345678)' },
        { status: 400 }
      );
    }

    // 3. Verificar variables de entorno
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

    // 4. Verificar si el teléfono ya existe
    console.log('🔍 Verificando si el teléfono ya existe...');
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}?filterByFormula={Telefono}="${telefono}"`;
    
    const checkResponse = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (checkData.records && checkData.records.length > 0) {
        return NextResponse.json(
          { error: 'Este teléfono ya está registrado' },
          { status: 409 }
        );
      }
    }

    // 5. Crear registro en Airtable
    console.log('💾 Creando paciente en Airtable...');
    const record = {
      fields: {
        Nombre: nombre.trim(),
        Edad: parseInt(edad),
        Telefono: telefono.trim(),
        "Fecha Registro": new Date().toISOString().split('T')[0],
        "Registro WhatsApp": true,
        Email: `${telefono}@whatsapp.temp` // Email temporal para WhatsApp users
      }
    };

    const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('❌ Error creando en Airtable:', createData);
      return NextResponse.json(
        { 
          error: 'Error guardando registro',
          details: createData.error?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    console.log('✅ Paciente creado:', createData.id);

    // 6. TODO: Enviar WhatsApp de bienvenida (cuando tengas Twilio)
    console.log('📱 TODO: Enviar WhatsApp de bienvenida a:', telefono);
    
    // Por ahora, solo simular el envío
    // await sendWelcomeWhatsApp(telefono, nombre);

    // 7. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: '¡Registro exitoso! Pronto recibirás un WhatsApp de bienvenida.',
      patientId: createData.id
    });

  } catch (error) {
    console.error('❌ Error general en registro WhatsApp:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Función para enviar WhatsApp de bienvenida (implementar cuando tengas Twilio)
async function sendWelcomeWhatsApp(telefono, nombre) {
  // TODO: Implementar con Twilio
  console.log(`📱 Enviando WhatsApp a ${telefono}: ¡Hola ${nombre}! Bienvenido a Sobrecupos.`);
  
  /*
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // 'whatsapp:+14155238886'
      to: `whatsapp:${telefono}`,
      body: `¡Hola ${nombre}! 👋 Bienvenido a Sobrecupos. Te notificaremos cuando haya sobrecupos disponibles. Para buscar uno ahora, solo escríbeme aquí.`
    });

    console.log('✅ WhatsApp enviado:', message.sid);
    return message.sid;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
  */
}