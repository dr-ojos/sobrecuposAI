import { useRef, useState, useEffect } from "react";

const SALUDO_REGEX = /\b(hola|buenas|hello|hey|qué tal|que tal|buenos días|buenos dias|buenas tardes|buenas noches)\b/i;

export default function Chat() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy Sobrecupos IA. Te ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas." }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detectar cuando se abre/cierra el teclado en móviles
  useEffect(() => {
    let initialHeight = window.innerHeight;
    
    const handleViewportChange = () => {
      if (typeof window !== 'undefined') {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        setKeyboardOpen(heightDifference > 150);
      }
    };

    const handleLoad = () => {
      initialHeight = window.innerHeight;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('orientationchange', handleLoad);
      window.addEventListener('load', handleLoad);
      
      return () => {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleLoad);
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

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
      <form className={`chat-form ${keyboardOpen ? 'keyboard-open' : ''}`} onSubmit={sendMessage}>
        <textarea
          className="chat-input"
          placeholder="Escribe tu mensaje…"
          autoFocus
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          disabled={loading}
          style={{ 
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            height: Math.min(Math.max(50, (input.split('\n').length) * 24 + 26), 120) + 'px'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar"
        >
          {loading ? (
            <div style={{ width: 20, height: 20, color: "#fff" }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 12 12;360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 19V5M5 12l7-7 7 7" 
                stroke="#fff" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
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
          border-top: 1px solid #e5e5e7;
          padding: 16px 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 0 0 16px 16px;
          align-items: flex-end;
          gap: 8px;
          position: sticky;
          bottom: 0;
          z-index: 1000;
          transition: transform 0.3s ease;
        }
        .chat-input {
          flex: 1;
          border: 1px solid #e5e5e7;
          border-radius: 20px;
          padding: 16px 20px;
          font-size: 1.1em;
          line-height: 1.3;
          outline: none;
          background: #fff;
          min-height: 50px;
          max-height: 120px;
          resize: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          overflow-y: auto;
        }
        .chat-input:focus {
          border-color: #007aff;
          box-shadow: 0 2px 12px rgba(0, 122, 255, 0.15);
        }
        .chat-input:disabled {
          background: #f3f3f3;
          opacity: 0.7;
        }
        button {
          background: #007aff;
          border: none;
          padding: 0;
          margin: 0;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
          flex-shrink: 0;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        @media (max-width: 650px) {
          .chat-outer {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
            min-height: 100vh;
            max-width: 100vw;
            position: relative;
          }
          .chat-header {
            border-radius: 0;
          }
          .chat-form {
            padding: 12px;
            border-radius: 0;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            transform: translateY(0);
            transition: transform 0.3s ease;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border-top: 1px solid #e5e5e7;
            z-index: 1000;
          }
          .chat-messages {
            padding-bottom: 100px;
          }
          /* Mantener input sobre el teclado en iOS */
          .chat-form.keyboard-open {
            transform: translateY(0);
            position: fixed;
            bottom: env(keyboard-inset-height, 0);
          }
        }
      `}</style>
    </div>
  );
}