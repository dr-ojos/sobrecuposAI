"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "¡Hola! 👋 Soy Sobrecupos IA.\nTe ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas."
    }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fix para scroll en móviles cuando aparece teclado
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 220);
    };
    window.addEventListener("focusin", handleFocus);
    return () => window.removeEventListener("focusin", handleFocus);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session }),
      });
      const data = await res.json();
      // Manejar respuestas múltiples
      if (Array.isArray(data.text)) {
        data.text.forEach((t) => {
          setMessages((msgs) => [...msgs, { from: "bot", text: t }]);
        });
      } else if (typeof data.text === "string" && data.text.includes("\n\n")) {
        data.text.split("\n\n").forEach((t) => {
          setMessages((msgs) => [...msgs, { from: "bot", text: t }]);
        });
      } else {
        setMessages((msgs) => [...msgs, { from: "bot", text: data.text }]);
      }
      setSession(data.session || {});
    } catch {
      setMessages((msgs) =>
        [...msgs, { from: "bot", text: "❌ Error de conexión. Intenta de nuevo." }]
      );
    }
    setLoading(false);
  };

  return (
    <div className="chat-bg">
      <div className="chat-container">
        <header className="chat-header">
          {/* Aquí puedes poner tu logo SVG si lo prefieres */}
          <span>Sobrecupos AI chat</span>
        </header>
        <main className="chat-main">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${msg.from === "bot" ? "bot" : "user"}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </main>
        <form className="chat-inputbar" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
            aria-label="Mensaje"
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="#3185fc" />
              <path d="M24 34V18M24 18L18 24M24 18L30 24" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
      <style>{`
        .chat-bg {
          background: linear-gradient(180deg, #f8fafc 0%, #e0e7ef 100%);
          min-height: 100vh;
          min-width: 100vw;
          display: flex;
          flex-direction: column;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          align-items: center;
          justify-content: flex-start;
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
          max-width: 600px;
          background: transparent;
          margin: 0 auto;
          align-items: stretch;
        }
        .chat-header {
          position: sticky;
          top: 0;
          width: 100%;
          background: #f8fafc;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -1px;
          text-align: center;
          color: #23272F;
          z-index: 10;
          padding: 18px 0 11px 0;
          box-shadow: 0 2px 9px #e0e7ef70;
        }
        .chat-main {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding-bottom: 82px;
        }
        .chat-messages {
          width: 100%;
          padding: 8px 0 0 0;
          box-sizing: border-box;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .chat-bubble {
          margin: 6px 13px;
          max-width: 81vw;
          font-size: 1.01rem;
          line-height: 1.45;
          padding: 11px 15px;
          border-radius: 17px;
          word-break: break-word;
          box-shadow: 0 2px 7px #e0e7ef50;
          transition: background 0.2s;
        }
        .chat-bubble.bot {
          background: #f1f5f9;
          color: #222;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 15px;
        }
        .chat-bubble.user {
          background: #3185fc;
          color: #fff;
          align-self: flex-end;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 4px;
        }
        .chat-inputbar {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          width: 100vw;
          max-width: 600px;
          display: flex;
          align-items: center;
          background: #fff;
          padding: 9px 9px 24px 9px;
          box-shadow: 0 -2px 14px #e0e7ef40;
          z-index: 12;
          gap: 11px;
          border-top: 1px solid #e2e8f0;
        }
        .chat-inputbar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.07rem;
          padding: 17px 14px;
          border-radius: 21px;
          background: #f1f5f9;
          box-shadow: 0 1px 6px #e0e7ef10;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .chat-inputbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
          margin-left: 2px;
          cursor: pointer;
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
        }
        .chat-inputbar button svg {
          display: block;
        }
        .chat-inputbar button:disabled {
          opacity: 0.55;
          cursor: wait;
        }
        @media (max-width: 600px) {
          .chat-container {
            max-width: 100vw;
          }
          .chat-header {
            max-width: 100vw;
            font-size: 1.13rem;
            padding: 14px 0 8px 0;
          }
          .chat-main {
            max-width: 100vw;
            padding-bottom: 98px;
          }
          .chat-inputbar {
            max-width: 100vw;
            left: 0;
            right: 0;
            transform: none;
            border-radius: 0;
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 13px);
            padding-top: 10px;
            padding-left: 5px;
            padding-right: 5px;
            gap: 8px;
          }
          .chat-inputbar input {
            font-size: 1.03rem;
            padding: 15px 11px;
          }
          .chat-inputbar button {
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
          }
        }
      `}</style>
    </div>
  );
}