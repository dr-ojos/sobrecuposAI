import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;

export async function POST(req) {
  try {
    const body = await req.json();
    
    console.log('🩺 Intentando login médico:', body.email);
    
    // Validaciones básicas
    if (!body.email?.trim()) {
      return NextResponse.json({ message: "Email es obligatorio" }, { status: 400 });
    }
    
    if (!body.password?.trim()) {
      return NextResponse.json({ message: "Contraseña es obligatoria" }, { status: 400 });
    }
    
    // Buscar médico por email
    const doctor = await findDoctorByEmail(body.email.trim().toLowerCase());
    
    if (!doctor) {
      return NextResponse.json({ 
        message: "Email o contraseña incorrectos" 
      }, { status: 401 });
    }
    
    // Verificar que el médico esté activo
    if (doctor.fields.Status !== 'active') {
      return NextResponse.json({ 
        message: "Esta cuenta ha sido desactivada. Contacta al administrador." 
      }, { status: 401 });
    }
    
    // Verificar contraseña
    let isValidPassword = false;
    if (doctor.fields.Password) {
      // Si ya tiene contraseña hasheada, verificar con bcrypt
      isValidPassword = await bcrypt.compare(body.password, doctor.fields.Password);
    } else {
      // Compatibilidad temporal: si no tiene password hasheado, verificar directamente
      // TODO: Esto debe removerse después de migrar todas las passwords
      isValidPassword = body.password === doctor.fields.TemporaryPassword;
    }
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        message: "Email o contraseña incorrectos" 
      }, { status: 401 });
    }
    
    // Actualizar última actividad
    await updateLastActivity(doctor.id);
    
    console.log('✅ Login exitoso para médico:', doctor.id);
    
    // Retornar datos seguros del médico
    return NextResponse.json({
      success: true,
      message: "Inicio de sesión exitoso",
      doctor: {
        id: doctor.id,
        name: doctor.fields.Name,
        email: doctor.fields.Email,
        specialty: doctor.fields.Specialty,
        clinic: doctor.fields.Clinic,
        status: doctor.fields.Status,
        registeredAt: doctor.fields.Created
      }
    });
    
  } catch (err) {
    console.error('❌ Error en signin médico:', err);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔧 Funciones auxiliares

// Buscar médico por email
async function findDoctorByEmail(email) {
  try {
    const formula = `AND({Email} = "${email}", {Status} = "active")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?` +
      `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.records && data.records.length > 0 ? data.records[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error buscando médico por email:', error);
    return null;
  }
}

// Actualizar última actividad del médico
async function updateLastActivity(doctorId) {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            id: doctorId,
            fields: {
              LastActivity: new Date().toISOString()
            }
          }]
        }),
      }
    );
    
    if (res.ok) {
      console.log('✅ Última actividad actualizada para médico:', doctorId);
    }
  } catch (error) {
    console.error('❌ Error actualizando última actividad:', error);
    // No fallar el login por esto
  }
}