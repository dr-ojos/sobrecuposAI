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

  // Fix para scroll en móviles cuando aparece teclado
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
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
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "linear-gradient(180deg, #f8fafc 0%, #e0e7ef 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 22,
          boxShadow: "0 8px 32px #0002",
          padding: 0,
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <header
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "-1px",
            textAlign: "center",
            color: "#2a3342",
            background: "#f8fafc",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: "18px 8px 10px 8px",
            boxShadow: "0 2px 10px #e0e7ef80",
            position: "sticky",
            top: 0,
            zIndex: 10,
            minHeight: 62,
            lineHeight: 1.2,
          }}
        >
          Sobrecupos AI chat
        </header>
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 6vw 0 6vw",
            marginBottom: 8,
            minHeight: 0,
            maxHeight: "100%",
            background: "transparent",
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                margin: "10px 0",
                textAlign: msg.from === "bot" ? "left" : "right",
                display: "flex",
                justifyContent: msg.from === "bot" ? "flex-start" : "flex-end",
                width: "100%",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: msg.from === "bot" ? "#f1f5f9" : "#3185fc",
                  color: msg.from === "bot" ? "#233" : "#fff",
                  borderRadius: 16,
                  padding: "13px 18px",
                  maxWidth: "85vw",
                  fontSize: 17,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  wordBreak: "break-word",
                  boxShadow:
                    msg.from === "bot"
                      ? "0 2px 7px #e0e7ef80"
                      : "0 3px 10px #3185fc33",
                  borderBottomLeftRadius: msg.from === "bot" ? 4 : 16,
                  borderBottomRightRadius: msg.from === "bot" ? 16 : 4,
                  transition: "background 0.2s",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </main>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 14px 18px 14px",
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
            borderBottomLeftRadius: 22,
            borderBottomRightRadius: 22,
            gap: 8,
            position: "sticky",
            bottom: 0,
            zIndex: 10,
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
              fontSize: 17,
              padding: "15px 14px",
              borderRadius: 16,
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              background: "#f1f5f9",
              minWidth: 0,
              boxShadow: "0 1px 6px #e0e7ef55",
            }}
            disabled={loading}
            autoFocus
            aria-label="Mensaje"
            inputMode="text"
          />
          <button
            type="submit"
            style={{
              background: "#3185fc",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding: "13px 20px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontSize: 18,
              minWidth: 82,
              boxShadow: "0 2px 6px #3185fc33",
              transition: "background 0.2s, box-shadow 0.2s",
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
          html, body {
            height: 100% !important;
            min-height: 100% !important;
            box-sizing: border-box;
          }
          body {
            overflow: hidden !important;
          }
          div[style*="maxWidth: 430"] {
            max-width: 100vw !important;
            min-width: 100vw !important;
            border-radius: 0 !important;
            height: 100vh !important;
            min-height: 100vh !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          main {
            padding-left: 3vw !important;
            padding-right: 3vw !important;
            flex: 1 !important;
            min-height: 0 !important;
            height: 100%;
            max-height: 100%;
            overflow-y: auto !important;
            box-sizing: border-box !important;
          }
        }
        ::-webkit-input-placeholder { color: #a3a3a3; }
        ::placeholder { color: #a3a3a3; }
      `}</style>
    </div>
  );
}