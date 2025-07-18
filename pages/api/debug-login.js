// 🚨 SISTEMA DE DIAGNÓSTICO PARA LOGIN
// pages/api/debug-login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email } = req.body;

  try {
    // 1. Verificar variables de entorno
    const envCheck = {
      AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
      AIRTABLE_DOCTORS_TABLE: !!process.env.AIRTABLE_DOCTORS_TABLE,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };

    // 2. Buscar médico en Airtable
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}?filterByFormula={Email}="${email}"`;
    
    const airtableResponse = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    const airtableData = await airtableResponse.json();

    // 3. Información detallada del médico
    const doctor = airtableData.records?.[0];
    
    const doctorInfo = doctor ? {
      id: doctor.id,
      email: doctor.fields?.Email,
      name: doctor.fields?.Name,
      hasPassword: !!doctor.fields?.Password,
      passwordLength: doctor.fields?.Password?.length || 0,
      especialidad: doctor.fields?.Especialidad,
      allFields: Object.keys(doctor.fields || {})
    } : null;

    // 4. Respuesta completa de diagnóstico
    return res.status(200).json({
      success: true,
      diagnosis: {
        environmentVariables: envCheck,
        airtableConnection: airtableResponse.ok,
        airtableUrl: airtableUrl,
        doctorFound: !!doctor,
        doctorInfo: doctorInfo,
        rawAirtableResponse: airtableData,
        recommendations: [
          !envCheck.AIRTABLE_API_KEY && "❌ Falta AIRTABLE_API_KEY",
          !envCheck.AIRTABLE_BASE_ID && "❌ Falta AIRTABLE_BASE_ID", 
          !envCheck.AIRTABLE_DOCTORS_TABLE && "❌ Falta AIRTABLE_DOCTORS_TABLE",
          !doctor && "❌ Médico no encontrado en Airtable",
          doctor && !doctor.fields?.Password && "❌ Campo Password no existe o está vacío",
          doctor && doctor.fields?.Password && "✅ Todo parece correcto"
        ].filter(Boolean)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}