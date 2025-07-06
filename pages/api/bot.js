// /pages/api/bot.js
const sessions = {};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });
  const {
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text  = (message || "").trim();
  const lower = text.toLowerCase();

  // Regex
  const greetingRe    = /\b(hola|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|ey|hey)\b/i;
  const thanksRe      = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe    = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // --- FUNCION AUXILIAR ---
  async function getDoctorName(medicoId) {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${medicoId}`,
        { headers: { "Authorization": `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await res.json();
      return data.fields?.Name || medicoId;
    } catch (err) {
      console.error("❌ Error buscando nombre del médico:", err);
      return medicoId;
    }
  }

  // 1) Validar config
  if (![OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL]
       .every(Boolean)) {
    return res.json({ text: "❌ Error de configuración. Contacta soporte." });
  }

  // 2) SALUDO
  if (greetingRe.test(text)) {
    delete sessions[from];
    return res.json({
      text:
        "¡Hola! 👋 Soy Sobrecupos IA.\n" +
        "Te ayudo a encontrar y reservar sobrecupos médicos.\n" +
        "Dime tus síntomas o la especialidad que necesitas.",
      session: {}
    });
  }

  // 3) AGRADECIMIENTOS
  if (thanksRe.test(text)) {
    return res.json({
      text: "¡De nada! Si necesitas algo más, avísame. 😊"
    });
  }

  // 4) SESIÓN ACTIVA
  let session = prevSession || sessions[from];
  if (session) {
    switch (session.stage) {
      case 'awaiting-confirmation':
        if (affirmativeRe.test(text)) {
          session.stage = 'collect-name';
          sessions[from] = session;
          return res.json({
            text: "¡Perfecto! Dime tu nombre completo para completar la reserva.",
            session
          });
        } else if (negativeRe.test(text)) {
          session.attempts++;
          if (session.attempts < session.records.length) {
            const nxt  = session.records[session.attempts].fields;
            const clin = nxt["Clínica"]   || nxt["Clinica"]   || "nuestra clínica";
            const dir  = nxt["Dirección"] || nxt["Direccion"] || "la dirección indicada";
            let medicoNombre = "";
            if (Array.isArray(nxt["Médico"])) {
              medicoNombre = await getDoctorName(nxt["Médico"][0]);
            } else if (nxt["Médico"]) {
              medicoNombre = await getDoctorName(nxt["Médico"]);
            } else {
              medicoNombre = nxt["Nombre"] || "";
            }
            sessions[from] = session;
            return res.json({
              text:
                `🔄 Otra opción de ${session.specialty}:\n` +
                `${clin} (${dir})\n` +
                `con Dr. ${medicoNombre} el ${nxt.Fecha} a las ${nxt.Hora}\n` +
                "¿Te sirve? ¿Te la reservo? Si escribes \"no\" u \"otra\", buscaré otra opción para ti",
              session
            });
          } else {
            delete sessions[from];
            return res.json({
              text: "Lo siento, no hay más sobrecupos disponibles.",
              session: {}
            });
          }
        } else {
          return res.json({
            text: "Por favor responde \"sí\" para reservar o \"no/otra\" para ver otra opción.",
            session
          });
        }

      case 'collect-name':
        session.patient = { name: text };
        session.stage   = 'collect-phone';
        sessions[from] = session;
        return res.json({
          text: "Gracias. Ahora indícame tu teléfono (con código país).",
          session
        });

      case 'collect-phone':
        session.patient.phone = text;
        session.stage         = 'collect-email';
        sessions[from] = session;
        return res.json({
          text: "¡Perfecto! Por último, tu email para enviarte la confirmación.",
          session
        });

      case 'collect-email': {
        session.patient.email = text;
        const rec = session.records[session.attempts];
        const chosen = rec.fields;

        // Detectar campos Airtable
        const allFields  = Object.keys(chosen);
        const nameField  = allFields.find(f=>/nombre/i.test(f))    || "Nombre";
        const dispField  = allFields.find(f=>/disponible/i.test(f))|| "Disponible";
        const phoneField = allFields.find(f=>/tel(e|é)fono/i.test(f));
        const emailField = allFields.find(f=>/email/i.test(f))     || "Email";

        // Preparar PATCH
        const patchFields = {
          [dispField]: typeof chosen[dispField] === "boolean" ? false : "No",
          [nameField]: session.patient.name,
          [emailField]: session.patient.email
        };
        if (phoneField) patchFields[phoneField] = session.patient.phone;

        try {
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
            {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type":  "application/json"
              },
              body: JSON.stringify({
                records: [{ id: rec.id, fields: patchFields }]
              })
            }
          );
        } catch(err) {
          console.error("❌ Error PATCH Airtable:", err);
        }

        // --- BUSCAR NOMBRE REAL DEL MÉDICO para correo y Web ---
        let medicoNombre = "";
        if (Array.isArray(chosen["Médico"])) {
          medicoNombre = await getDoctorName(chosen["Médico"][0]);
        } else if (chosen["Médico"]) {
          medicoNombre = await getDoctorName(chosen["Médico"]);
        } else {
          medicoNombre = chosen["Nombre"] || "";
        }

        // Enviar email con frase autorizatoria
        const emailPayload = {
          personalizations: [{ to: [{ email: session.patient.email }] }],
          from: { email: SENDGRID_FROM_EMAIL },
          subject: "Confirmación de tu SobreCupo Médico",
          content: [{
            type: "text/plain",
            value:
              `Hola ${session.patient.name},\n\n` +
              `Yo, Dr. ${medicoNombre}, te he autorizado el sobrecupo.\n\n` +
              `Tu sobrecupo de ${session.specialty} ha sido confirmado:\n` +
              `Clínica: ${chosen["Clínica"]||chosen["Clinica"]}\n` +
              `Dirección: ${chosen["Dirección"]||chosen["Direccion"]}\n` +
              `Dr/a: Dr. ${medicoNombre}\n` +
              `Fecha: ${chosen.Fecha} a las ${chosen.Hora}\n\n` +
              `¡Que te mejores pronto!\n` +
              `Sobrecupos IA`
          }]
        };
        try {
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type":  "application/json"
            },
            body: JSON.stringify(emailPayload)
          });
        } catch(err) {
          console.error("❌ Error SendGrid:", err);
        }

        delete sessions[from];
        return res.json({
          text:
            `✅ ¡Listo, ${session.patient.name}! Tu sobrecupo está reservado.\n` +
            `📍 ${chosen["Clínica"]||chosen["Clinica"]}, ${chosen["Dirección"]||chosen["Direccion"]}\n` +
            `🗓️ ${chosen.Fecha} a las ${chosen.Hora}\n` +
            `Te envié confirmación a ${session.patient.email}.`,
          session: {}
        });
      }
    }
  }

  // 5) Detección OpenAI de especialidad
  let rawEsp = "";
  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model:       "gpt-4o-mini",
        temperature: 0,
        max_tokens:  16,
        messages: [
          {
            role: "system",
            content:
              "Eres Sobrecupos IA, asistente médico empático.\n" +
              "Responde SOLO con EXACTA una de estas:\n" +
              "Oftalmología, Medicina Familiar, Dermatología, Pediatría.\n" +
              "Si mencionan un niño, elige Pediatría."
          },
          { role: "user", content: `Paciente: "${text}"` }
        ]
      })
    });
    const j = await aiRes.json();
    rawEsp = j.choices?.[0]?.message?.content?.trim() || "";
  } catch(err) {
    console.error("❌ Error OpenAI:", err);
    return res.json({ text: "Lo siento, no entendí tus síntomas. ¿Puedes describirlos diferente?" });
  }

  // 5b) Generar respuesta empática personalizada con OpenAI
  let respuestaEmpatica = "";
  try {
    const empatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 45,
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente médico chileno, humano y empático llamado Sobrecupos IA. " +
              "Siempre responde con una frase breve empática (máximo 2 líneas) al malestar del paciente, como si fueras un amigo cercano. No ofrezcas aún ninguna hora ni especialista, solo expresa comprensión al síntoma que describe el usuario. Nunca pongas comillas ni digas 'Sobrecupos IA'."
          },
          { role: "user", content: `Paciente: "${text}"` }
        ]
      })
    });
    const empatJson = await empatRes.json();
    respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("❌ Error OpenAI Empático:", err);
    respuestaEmpatica = "";
  }

  // 6) Mapear y filtrar Airtable
  const normalize = s =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
     .replace(/[^a-zA-Z\s]/g,"").toLowerCase().trim();
  const mapSpec = {
    oftalmologia:       "Oftalmología",
    "medicina familiar":"Medicina Familiar",
    dermatologia:       "Dermatología",
    pediatria:          "Pediatría"
  };
  const specialty = mapSpec[ normalize(rawEsp) ];
  if (!specialty) {
    return res.json({
      text:
        "No reconocí esa especialidad. Elige una de:\n" +
        "• Oftalmología\n• Medicina Familiar\n• Dermatología\n• Pediatría"
    });
  }

  // 7) Leer Airtable - sobrecupos
  let records = [];
  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
      { headers: { "Authorization": `Bearer ${AIRTABLE_API_KEY}` } }
    );
    const data = await resp.json();
    records = data.records || [];
  } catch(err) {
    console.error("❌ Error Airtable:", err);
    return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
  }

  // 8) Filtrar disponibles Y SOLO FECHAS A FUTURO
  const today = new Date();
  const available = records.filter(r => {
    const esp  = normalize(r.fields.Especialidad||"");
    const disp = normalize(r.fields.Disponible   ||"");
    const fecha = r.fields.Fecha;
    if (!fecha) return false;
    const dateObj = new Date(fecha);
    return esp === normalize(specialty) && disp === "si" && dateObj >= today;
  });

  if (!available.length) {
    return res.json({
      text: (respuestaEmpatica ? respuestaEmpatica + "\n" : "") +
        `Lo siento, no hay sobrecupos para ${specialty} con fecha vigente.`
    });
  }

  // 9) Ofrecer y guardar sesión (mostrando el nombre real del médico)
  session = {
    records:   available,
    attempts:  0,
    specialty: specialty,
    stage:     'awaiting-confirmation',
    patient:   {}
  };
  sessions[from] = session;
  const first = available[0].fields;
  const clin  = first["Clínica"]   || first["Clinica"]   || "nuestra clínica";
  const dir   = first["Dirección"] || first["Direccion"] || "la dirección indicada";
  let medicoNombre = "";
  if (Array.isArray(first["Médico"])) {
    medicoNombre = await getDoctorName(first["Médico"][0]);
  } else if (first["Médico"]) {
    medicoNombre = await getDoctorName(first["Médico"]);
  } else {
    medicoNombre = first["Nombre"] || "";
  }

  // Primer mensaje empático
  return res.json({
    text: [
      respuestaEmpatica,
      `✅ He encontrado un sobrecupo de ${specialty} en ${clin} (${dir})\n` +
      `con Dr. ${medicoNombre} el ${first.Fecha} a las ${first.Hora}.`,
      "¿Te sirve? ¿Te la reservo? Me confirmas con un \"sí\".",
      "o escríbeme un \"no\" y te busco otra opción."
    ].filter(Boolean).join("\n\n"),
    session
  });
}