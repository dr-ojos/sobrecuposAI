// app/api/debug-env/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔧 === DEBUG VARIABLES DE ENTORNO ===');
    
    const envVars = {
      AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante', 
      AIRTABLE_TABLE_ID: process.env.AIRTABLE_TABLE_ID ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_DOCTORS_TABLE: process.env.AIRTABLE_DOCTORS_TABLE ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_PATIENTS_TABLE: process.env.AIRTABLE_PATIENTS_TABLE ? '✅ Presente' : '❌ Faltante',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✅ Presente' : '❌ Faltante',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL ? '✅ Presente' : '❌ Faltante',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Presente' : '❌ Faltante',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✅ Presente' : '❌ Faltante',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✅ Presente' : '❌ Faltante',
      WHATSAPP_PHONE_NUMBER: process.env.WHATSAPP_PHONE_NUMBER ? '✅ Presente' : '❌ Faltante'
    };

    console.log('🔧 Variables de entorno:', envVars);

    // También verificar si podemos hacer una consulta básica a Airtable
    let airtableTest = 'No probado';
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE_ID) {
      try {
        const testResponse = await fetch(
          `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?maxRecords=1`,
          {
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            },
          }
        );
        airtableTest = testResponse.ok ? '✅ Conexión exitosa' : `❌ Error ${testResponse.status}`;
      } catch (err) {
        airtableTest = `❌ Error conexión: ${err.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      environmentVariables: envVars,
      airtableConnectionTest: airtableTest
    });

  } catch (error) {
    console.error('❌ Error en debug de variables:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}