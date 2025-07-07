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
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          marginTop: 24,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 32px #0002",
          padding: "24px 0 0 0",
          minHeight: "70vh",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontWeight: 800,
            fontSize: 24,
            margin: 0,
            textAlign: "center",
            color: "#2a3342",
            background: "#f8fafc",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: "16px 12px 8px 12px",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          Sobrecupos AI chat
        </h2>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 14px 0 14px",
            marginBottom: 10,
            minHeight: 260,
            maxHeight: "60vh",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                margin: "8px 0",
                textAlign: msg.from === "bot" ? "left" : "right",
                display: "flex",
                justifyContent: msg.from === "bot" ? "flex-start" : "flex-end",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: msg.from === "bot" ? "#f1f5f9" : "#3185fc",
                  color: msg.from === "bot" ? "#333" : "#fff",
                  borderRadius: 14,
                  padding: "10px 16px",
                  maxWidth: "85vw",
                  fontSize: 16,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  wordBreak: "break-word",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px 16px 12px",
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              padding: "12px 14px",
              borderRadius: 14,
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              background: "#f1f5f9",
              minWidth: 0,
            }}
            disabled={loading}
            autoFocus
            aria-label="Mensaje"
          />
          <button
            type="submit"
            style={{
              background: "#3185fc",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontSize: 16,
              minWidth: 70,
            }}
            disabled={loading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            {loading ? "..." : "Enviar"}
          </button>
        </form>
      </div>
      <style>{`
        @media (max-width: 600px) {
          div[style*="maxWidth: 430"] {
            max-width: 100vw !important;
            border-radius: 0 !important;
            height: 100vh !important;
            min-height: 100vh !important;
          }
          h2 {
            font-size: 21px !important;
            padding-top: 16px !important;
            padding-bottom: 8px !important;
          }
          form {
            padding-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}