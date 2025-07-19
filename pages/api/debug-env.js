// pages/api/debug-env.js
// Verificador de Variables de Entorno

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const requiredVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID: process.env.AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE: process.env.AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PATIENTS_TABLE: process.env.AIRTABLE_PATIENTS_TABLE
  };

  const optionalVars = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL
  };

  const results = {
    configured: [],
    missing: [],
    optional: []
  };

  // Verificar variables críticas
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      results.configured.push(`${key}: ${value.substring(0, 8)}...`);
    } else {
      results.missing.push(`${key}: FALTA`);
    }
  }

  // Verificar variables opcionales
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      results.configured.push(`${key}: ${value.substring(0, 8)}...`);
    } else {
      results.optional.push(`${key}: No configurado (opcional)`);
    }
  }

  const allRequired = results.missing.length === 0;

  return res.json({
    status: allRequired ? "CONFIGURACION CORRECTA" : "FALTAN VARIABLES",
    botFunctional: allRequired,
    emailFunctional: optionalVars.SENDGRID_API_KEY && optionalVars.SENDGRID_FROM_EMAIL,
    details: results,
    nextSteps: allRequired 
      ? ["El bot debería funcionar correctamente"]
      : [
          "Verifica tu archivo .env.local",
          "Asegúrate de reiniciar el servidor después de agregar variables",
          "Revisa que no haya espacios o caracteres extraños"
        ]
  });
}