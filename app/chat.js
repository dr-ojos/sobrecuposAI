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
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar"
        >
          {loading ? (
            <span style={{ fontSize: 19, color: "#fff" }}>...</span>
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#23cba7" />
              <path d="M14 8V20" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"/>
              <path d="M10.5 12L14 8L17.5 12" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"/>
            </svg>
          )}
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
          min-height: 420px;
        }
        .chat-header {
          padding: 18px;
          font-weight: 700;
          font-size: 1.27rem;
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
          padding: 12px 17px;
          border-radius: 19px;
          max-width: 85%;
          line-height: 1.6;
          font-size: 1.07em;
          word-break: break-word;
          white-space: pre-wrap;
          box-shadow: 0 1px 3px #0001;
        }
        .msg.user {
          background: #5be0c1;
          color: #222;
          align-self: flex-end;
          border-bottom-right-radius: 7px;
        }
        .msg.bot {
          background: #f3f8fd;
          color: #1a212b;
          align-self: flex-start;
          border-bottom-left-radius: 7px;
        }
        .chat-form {
          display: flex;
          border-top: 1px solid #eee;
          padding: 16px 10px;
          background: #f6fafd;
          border-radius: 0 0 16px 16px;
          align-items: center;
          gap: 9px;
        }
        .chat-input {
          flex: 1;
          border: none;
          border-radius: 14px;
          padding: 18px 17px;
          font-size: 1.12em;
          margin-right: 0;
          outline: none;
          background: #fff;
          min-height: 46px;
          box-shadow: 0 1px 6px #0001;
        }
        .chat-input:disabled {
          background: #f3f3f3;
        }
        button {
          background: transparent;
          border: none;
          padding: 0;
          margin: 0 2px 0 0;
          border-radius: 50%;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: box-shadow 0.2s;
          box-shadow: none;
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
          .chat-header {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}