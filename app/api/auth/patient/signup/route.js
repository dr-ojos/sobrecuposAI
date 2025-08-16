import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_USUARIOS_TABLE = process.env.AIRTABLE_USUARIOS_TABLE; // Nueva tabla para usuarios registrados

export async function POST(req) {
  try {
    const body = await req.json();
    
    console.log('📝 Registrando paciente con autenticación:', body.email);
    
    // Validaciones básicas
    if (!body.nombre?.trim()) {
      return NextResponse.json({ message: "Nombre es obligatorio" }, { status: 400 });
    }
    
    if (!body.apellidos?.trim()) {
      return NextResponse.json({ message: "Apellidos son obligatorios" }, { status: 400 });
    }
    
    if (!body.email?.trim() || !body.email.includes('@')) {
      return NextResponse.json({ message: "Email válido es obligatorio" }, { status: 400 });
    }
    
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ message: "Contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    
    if (!body.telefono?.trim()) {
      return NextResponse.json({ message: "Teléfono es obligatorio" }, { status: 400 });
    }
    
    if (!body.rut?.trim()) {
      return NextResponse.json({ message: "RUT es obligatorio" }, { status: 400 });
    }

    // Formatear teléfono
    const formattedPhone = formatPhoneNumber(body.telefono);
    
    // Verificar si el paciente ya existe
    const existingPatient = await checkExistingPatient(body.email, formattedPhone);
    if (existingPatient) {
      return NextResponse.json({ 
        message: "Ya existe una cuenta registrada con este email o teléfono" 
      }, { status: 400 });
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(body.password, 12);
    
    // Preparar datos para Airtable
    const patientData = {
      Name: `${body.nombre.trim()} ${body.apellidos.trim()}`,
      Email: body.email.trim().toLowerCase(),
      WhatsApp: formattedPhone,
      RUT: body.rut.trim(),
      Password: hashedPassword,
      AcceptTerms: true,
      AcceptWhatsApp: true,
      UserType: "patient",
      Status: "active",
      Created: new Date().toISOString(),
      RegistrationSource: "web_signup",
      LastActivity: new Date().toISOString(),
      // Campos adicionales para chat personalizado
      FirstName: body.nombre.trim(),
      LastName: body.apellidos.trim(),
      IsRegisteredUser: true
    };
    
    console.log('📤 Creando usuario autenticado en Airtable');
    
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USUARIOS_TABLE}`,
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
      return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
    }
    
    console.log('✅ Paciente registrado con autenticación:', data.id);
    
    // Retornar datos seguros del paciente
    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
      patient: {
        id: data.id,
        name: patientData.Name,
        firstName: patientData.FirstName,
        email: patientData.Email,
        whatsapp: patientData.WhatsApp,
        rut: patientData.RUT,
        registeredAt: patientData.Created
      }
    });
    
  } catch (err) {
    console.error('❌ Error en signup paciente:', err);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
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
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USUARIOS_TABLE}?` +
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
    return false;
  }
}