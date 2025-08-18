import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import {
  PatientSignInRequest,
  PatientSignInResponse,
  AirtablePatientRecord,
  AirtableListResponse,
  ApiErrorResponse
} from "@/types/patient";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_USUARIOS_TABLE = process.env.AIRTABLE_USUARIOS_TABLE;

export async function POST(req: NextRequest): Promise<NextResponse<PatientSignInResponse | ApiErrorResponse>> {
  try {
    const body: PatientSignInRequest = await req.json();
    
    console.log('🔐 Intentando login paciente:', body.email);
    
    // Validaciones básicas
    if (!body.email?.trim()) {
      return NextResponse.json({ message: "Email es obligatorio" }, { status: 400 });
    }
    
    if (!body.password?.trim()) {
      return NextResponse.json({ message: "Contraseña es obligatoria" }, { status: 400 });
    }
    
    // Buscar paciente por email
    const patient = await findPatientByEmail(body.email.trim().toLowerCase());
    
    if (!patient) {
      return NextResponse.json({ 
        message: "Email o contraseña incorrectos" 
      }, { status: 401 });
    }
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(body.password, patient.fields.Password);
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        message: "Email o contraseña incorrectos" 
      }, { status: 401 });
    }
    
    // Verificar que la cuenta esté activa
    if (patient.fields.Status !== 'active') {
      return NextResponse.json({ 
        message: "Esta cuenta ha sido desactivada. Contacta soporte." 
      }, { status: 401 });
    }
    
    // Actualizar última actividad
    await updateLastActivity(patient.id);
    
    console.log('✅ Login exitoso para paciente:', patient.id);
    
    // Retornar datos seguros del paciente
    return NextResponse.json({
      success: true,
      message: "Inicio de sesión exitoso",
      patient: {
        id: patient.id,
        name: patient.fields.Name,
        firstName: patient.fields.FirstName || patient.fields.Name.split(' ')[0],
        lastName: patient.fields.LastName || '',
        email: patient.fields.Email,
        whatsapp: patient.fields.WhatsApp,
        rut: patient.fields.RUT,
        registeredAt: patient.fields.Created,
        preferredSpecialties: patient.fields.PreferredSpecialties || [],
        location: patient.fields.Location || ''
      }
    });
    
  } catch (err) {
    console.error('❌ Error en signin paciente:', err);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Buscar paciente por email
async function findPatientByEmail(email: string): Promise<AirtablePatientRecord | null> {
  try {
    const formula = `{Email} = "${email}"`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USUARIOS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (res.ok) {
      const data: AirtableListResponse = await res.json();
      return data.records && data.records.length > 0 ? data.records[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error buscando paciente por email:', error);
    return null;
  }
}

// Actualizar última actividad del paciente
async function updateLastActivity(patientId: string): Promise<void> {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USUARIOS_TABLE}`,
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
              LastActivity: new Date().toISOString()
            }
          }]
        }),
      }
    );
    
    if (res.ok) {
      console.log('✅ Última actividad actualizada para paciente:', patientId);
    }
  } catch (error) {
    console.error('❌ Error actualizando última actividad:', error);
    // No fallar el login por esto
  }
}