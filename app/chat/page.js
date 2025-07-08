"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy Sobrecupos IA. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 250);
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
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "Enviar"}
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
          font-size: 1.7rem;
          letter-spacing: -1px;
          text-align: center;
          color: #2a3342;
          z-index: 10;
          padding: 20px 0 12px 0;
          box-shadow: 0 2px 10px #e0e7ef80;
        }
        .chat-main {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding-bottom: 82px; /* espacio para inputbar */
        }
        .chat-messages {
          width: 100%;
          padding: 12px 0 0 0;
          box-sizing: border-box;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .chat-bubble {
          margin: 7px 14px;
          max-width: 83vw;
          font-size: 1.11rem;
          line-height: 1.5;
          padding: 13px 17px;
          border-radius: 19px;
          word-break: break-word;
          box-shadow: 0 2px 7px #e0e7ef80;
          transition: background 0.2s;
        }
        .chat-bubble.bot {
          background: #f1f5f9;
          color: #233;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 16px;
        }
        .chat-bubble.user {
          background: #3185fc;
          color: #fff;
          align-self: flex-end;
          border-bottom-left-radius: 16px;
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
          padding: 10px 9px 32px 9px;
          box-shadow: 0 -2px 15px #e0e7ef55;
          z-index: 12;
          gap: 9px;
          border-top: 1px solid #e2e8f0;
        }
        .chat-inputbar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.11rem;
          padding: 15px 13px;
          border-radius: 17px;
          background: #f1f5f9;
          box-shadow: 0 1px 6px #e0e7ef22;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .chat-inputbar button {
          background: #3185fc;
          color: #fff;
          border: none;
          border-radius: 17px;
          padding: 13px 23px;
          font-weight: 700;
          font-size: 1.11rem;
          cursor: pointer;
          box-shadow: 0 2px 6px #3185fc33;
          transition: background 0.2s;
        }
        .chat-inputbar button:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        @media (max-width: 600px) {
          .chat-container {
            max-width: 100vw;
          }
          .chat-header {
            max-width: 100vw;
          }
          .chat-main {
            max-width: 100vw;
            padding-bottom: 83px;
          }
          .chat-inputbar {
            max-width: 100vw;
            left: 0;
            right: 0;
            transform: none;
            border-radius: 0;
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 15px);
          }
        }
      `}</style>
    </div>
  );
}