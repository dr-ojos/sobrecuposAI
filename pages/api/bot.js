const sessions = {};

const saludosSimples = [
  "hola", "buenas", "buenos dias", "buenos días", "buenas tardes", "buenas noches",
  "hey", "ey", "qué tal", "que tal", "holi", "holis", "hello", "saludos"
];

function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return saludosSimples.includes(limpio);
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ text: "Método no permitido" });

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  async function getDoctorName(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || medicoId;
    } catch {
      return medicoId;
    }
  }

  if (![AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL].every(Boolean)) {
    return res.json({ text: "Error de configuración. Contacta soporte." });
  }

  if (greetingRe.test(text)) {
    if (esSaludoSimple(text)) {
      return res.json({
        text: "¡Hola! ¿Qué especialidad, médico o síntomas buscas?"
      });
    }
    return res.json({
      text: "¡Hola! Soy Sobrecupos IA. Dime qué especialidad, médico o síntomas buscas."
    });
  }

  if (thanksRe.test(text)) {
    return res.json({ text: "De nada. Si necesitas algo más, avísame." });
  }

  let session = prevSession || sessions[from];

  if (!session) {
    const specialty = text;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=AND({Especialidad}="${specialty}", {Reservado}!="Sí")&maxRecords=5&view=Grid%20view`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await resp.json();

    if (!data.records || data.records.length === 0) {
      return res.json({
        text: `No encontré sobrecupos disponibles para "${specialty}". Puedes intentar con otra especialidad.`
      });
    }

    const rec = data.records[0].fields;
    const clin = rec["Clínica"] || rec["Clinica"] || "la clínica";
    const dir = rec["Dirección"] || rec["Direccion"] || "la dirección";
    const medicoId = Array.isArray(rec["Médico"]) ? rec["Médico"][0] : rec["Médico"];
    const medicoNombre = await getDoctorName(medicoId);

    sessions[from] = {
      stage: "awaiting-confirmation",
      specialty,
      records: data.records,
      attempts: 0
    };

    return res.json({
      text:
        `Encontré esta opción:\n` +
        `📍 ${clin} (${dir})\n` +
        `👨‍⚕️ Dr. ${medicoNombre}\n` +
        `🗓️ ${rec.Fecha} a las ${rec.Hora}\n\n` +
        `¿Te interesa reservarla? Responde "sí" o "no".`,
      session: sessions[from]
    });
  }

  switch (session.stage) {
    case "awaiting-confirmation":
      if (affirmativeRe.test(text)) {
        session.stage = "collect-name";
        return res.json({
          text: "Perfecto. Dime tu nombre completo.",
          session
        });
      } else if (negativeRe.test(text)) {
        session.attempts++;
        if (session.attempts < session.records.length) {
          const nxt = session.records[session.attempts].fields;
          const clin = nxt["Clínica"] || nxt["Clinica"] || "la clínica";
          const dir = nxt["Dirección"] || nxt["Direccion"] || "la dirección";
          const medicoId = Array.isArray(nxt["Médico"]) ? nxt["Médico"][0] : nxt["Médico"];
          const medicoNombre = await getDoctorName(medicoId);
          return res.json({
            text:
              `Otra opción:\n` +
              `📍 ${clin} (${dir})\n` +
              `👨‍⚕️ Dr. ${medicoNombre}\n` +
              `🗓️ ${nxt.Fecha} a las ${nxt.Hora}\n\n` +
              `¿Te interesa reservarla?`,
            session
          });
        } else {
          delete sessions[from];
          return res.json({ text: "No hay más sobrecupos disponibles." });
        }
      } else {
        return res.json({ text: "Por favor responde \"sí\" o \"no\".", session });
      }

    case "collect-name":
      session.patient = { name: text };
      session.stage = "collect-phone";
      return res.json({
        text: "Gracias. Ahora tu teléfono (con código país).",
        session
      });

    case "collect-phone":
      session.patient.phone = text;
      session.stage = "collect-email";
      return res.json({
        text: "Perfecto. Por último tu email para enviarte confirmación.",
        session
      });

    case "collect-email": {
      session.patient.email = text;
      const rec = session.records[session.attempts];
      const patchFields = {
        "Reservado": "Sí",
        "Paciente": session.patient.name,
        "Teléfono": session.patient.phone,
        "Email": session.patient.email,
        "Reservado por": from
      };

      try {
        const patchRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${rec.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: patchFields })
          }
        );
        if (patchRes.status !== 200) {
          delete sessions[from];
          return res.json({ text: "Error al registrar la reserva. Intenta más tarde." });
        }
      } catch {
        delete sessions[from];
        return res.json({ text: "Error al reservar el sobrecupo. Intenta más tarde." });
      }

      const emailPayload = {
        personalizations: [
          {
            to: [{ email: session.patient.email }],
            subject: "Confirmación de sobrecupo"
          }
        ],
        from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos IA" },
        content: [
          {
            type: "text/plain",
            value:
              `Hola, ${session.patient.name}.\n\n` +
              `Tu sobrecupo está reservado:\n` +
              `Especialidad: ${session.specialty}\n` +
              `Clínica: ${rec["Clínica"]}\n` +
              `Dirección: ${rec["Dirección"]}\n` +
              `Fecha: ${rec.Fecha}\n` +
              `Hora: ${rec.Hora}\n\n` +
              `Gracias por usar Sobrecupos IA.`
          }
        ]
      };

      try {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(emailPayload)
        });
      } catch {}

      delete sessions[from];
      return res.json({
        text:
          `✅ Listo, ${session.patient.name}. Tu sobrecupo está reservado.\n` +
          `Te envié confirmación a tu correo.`
      });
    }

    default:
      delete sessions[from];
      return res.json({ text: "No entendí. Por favor intenta de nuevo." });
  }
}
