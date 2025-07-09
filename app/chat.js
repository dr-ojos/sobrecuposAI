import { useRef, useState, useEffect } from "react";

const SALUDO_REGEX = /\b(hola|buenas|hello|hey|qué tal|que tal|buenos días|buenos dias|buenas tardes|buenas noches)\b/i;

export default function Chat() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy Sobrecupos IA. Te ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas." }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const myMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, myMsg]);
    setLoading(true);

    // Si solo es saludo sin síntomas/especialidad/médico, responde con un mensaje humanizado
    if (
      SALUDO_REGEX.test(input.trim().toLowerCase()) &&
      !/\b(dolor|siento|busco|especialidad|médico|doctor|ojos|cita|hora|molestia|síntoma|consulta|atención|agendar|oftalmología|pediatría|familiar|dermatología|alergia|asma|resfriado|gripe|cuerpo|cabeza|panza|estómago|enfermo|enferma|reservar|necesito)\b/i.test(
        input.trim().toLowerCase()
      )
    ) {
      // Usar OpenAI para hacer la respuesta más empática y humana
      try {
        const aiRes = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Responde de forma muy humana, cercana y breve a un usuario que solo te ha saludado, e invítalo a contar su problema o pedir un sobrecupo médico.`,
            session,
            force_gpt: true
          }),
        });
        const data = await aiRes.json();
        setMessages((msgs) => [
          ...msgs,
          {
            from: "bot",
            text:
              (data.text ||
                "¡Hola! 😊 ¿En qué te puedo ayudar? Cuéntame tus síntomas, el médico o especialidad que buscas y te ayudo a encontrar una hora disponible."),
          },
        ]);
        setSession(data.session || {});
      } catch {
        setMessages((msgs) => [
          ...msgs,
          {
            from: "bot",
            text:
              "¡Hola! 😊 ¿En qué te puedo ayudar? Cuéntame tus síntomas, el médico o especialidad que buscas y te ayudo a encontrar una hora disponible.",
          },
        ]);
      }
      setInput("");
      setLoading(false);
      return;
    }

    // Flujo normal para mensajes con síntomas/solicitudes
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session })
      });
      const data = await res.json();
      if (data.text) {
        // Puede devolver varias líneas, sepáralas
        const parts = data.text.split(/\n{2,}/).filter(Boolean);
        setMessages((msgs) =>
          [...msgs, ...parts.map(text => ({ from: "bot", text }))]
        );
      }
      setSession(data.session || {});
    } catch {
      setMessages((msgs) =>
        [...msgs, { from: "bot", text: "❌ Error de conexión. Intenta de nuevo." }]
      );
    }
    setInput("");
    setLoading(false);
  }

  return (
    <div className="chat-outer">
      <div className="chat-header">
        <span role="img" aria-label="bot">🤖</span> Sobrecupos IA
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg ${msg.from === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          className="chat-input"
          placeholder="Escribe tu mensaje…"
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
      <style jsx>{`
        .chat-outer {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          max-width: 450px;
          margin: 24px auto;
          border-radius: 16px;
          box-shadow: 0 4px 32px #0002;
          background: #fafbff;
          display: flex;
          flex-direction: column;
          height: 80vh;
          min-height: 400px;
        }
        .chat-header {
          padding: 18px;
          font-weight: 700;
          font-size: 1.2rem;
          border-bottom: 1px solid #eee;
          background: linear-gradient(90deg, #5be0c1 30%, #9bcffb 100%);
          color: #222;
          border-radius: 16px 16px 0 0;
          letter-spacing: 1px;
          text-align: center;
        }
        .chat-messages {
          flex: 1;
          padding: 16px 8px 8px;
          overflow-y: auto;
          background: #fff;
        }
        .msg {
          margin-bottom: 10px;
          padding: 10px 14px;
          border-radius: 18px;
          max-width: 85%;
          line-height: 1.5;
          font-size: 1.05em;
          word-break: break-word;
          white-space: pre-wrap;
          box-shadow: 0 1px 3px #0001;
        }
        .msg.user {
          background: #5be0c1;
          color: #222;
          align-self: flex-end;
          border-bottom-right-radius: 6px;
        }
        .msg.bot {
          background: #f3f8fd;
          color: #1a212b;
          align-self: flex-start;
          border-bottom-left-radius: 6px;
        }
        .chat-form {
          display: flex;
          border-top: 1px solid #eee;
          padding: 12px;
          background: #f6fafd;
          border-radius: 0 0 16px 16px;
        }
        .chat-input {
          flex: 1;
          border: none;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 1em;
          margin-right: 10px;
          outline: none;
          background: #fff;
          box-shadow: 0 1px 6px #0001;
        }
        .chat-input:disabled {
          background: #f3f3f3;
        }
        button {
          background: #23cba7;
          color: #fff;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          padding: 0 18px;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 650px) {
          .chat-outer {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
            min-height: 100vh;
            max-width: 100vw;
          }
        }
      `}</style>
    </div>
  );
}