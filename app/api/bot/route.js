import { NextResponse } from "next/server";

const saludosSimples = [
  "hola", "buenas", "buenos dias", "buenos días", "buenas tardes", "buenas noches",
  "hey", "ey", "qué tal", "que tal", "holi", "holis", "hello", "saludos"
];

function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return saludosSimples.some(s => limpio === s);
}

export async function POST(req) {
  const { message, session } = await req.json();

  // Si solo es un saludo, responde humano, sin OpenAI.
  if (esSaludoSimple(message)) {
    return NextResponse.json({
      text: "¡Hola! 👋 Cuéntame tus síntomas, el nombre del médico o la especialidad que buscas y te ayudo a encontrar y reservar un sobrecupo rápidamente."
    });
  }

  // Lógica normal: enviar a OpenAI como un asistente médico
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ text: "❌ Error de configuración de OpenAI." }, { status: 500 });
  }

  // Ejemplo básico: puedes agregar aquí tu flujo con sesión si quieres
  const prompt = [
    {
      role: "system",
      content: "Eres Sobrecupos IA, un asistente médico empático que ayuda a los pacientes a encontrar y reservar sobrecupos médicos. Sé muy amable y humano. Si el usuario describe síntomas, médico o especialidad, responde amigablemente y ofrece ayuda."
    },
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o", // o "gpt-3.5-turbo" si prefieres menos costo
      messages: prompt,
      max_tokens: 120,
      temperature: 0.7
    })
  });
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim() || "No pude procesar tu mensaje. Intenta de nuevo.";

  return NextResponse.json({
    text: answer,
    session: session || {}
  });
}