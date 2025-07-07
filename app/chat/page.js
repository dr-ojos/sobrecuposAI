'use client';
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy Sobrecupos IA.\n¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Scroll automático al enviar mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg) return;
    setMessages((msgs) => [...msgs, { from: "user", text: userMsg }]);
    setInput("");
    // Envía mensaje al backend (ajusta si tienes API)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg })
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { from: "bot", text: data.text }]);
    } catch {
      setMessages((msgs) => [...msgs, { from: "bot", text: "Ocurrió un error 😓" }]);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F9FBFC 60%, #DCF3FA 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Título siempre visible */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        padding: "16px 0 4px 0",
        textAlign: "center",
        background: "white",
        boxShadow: "0 1px 6px #eee",
        fontSize: "2rem",
        letterSpacing: "1px",
        color: "#1274B8",
        fontWeight: 700,
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
      }}>
        Sobrecupos AI chat
      </header>
      <main style={{
        flex: 1,
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        background: "rgba(255,255,255,0.7)",
        borderRadius: 16,
        marginTop: 20,
        boxShadow: "0 4px 24px #bde2fa2c"
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
              background: msg.from === "user" ? "#1274B8" : "#e3f3fc",
              color: msg.from === "user" ? "white" : "#222",
              padding: "10px 14px",
              borderRadius: "18px",
              marginBottom: 10,
              maxWidth: "78%",
              whiteSpace: "pre-line",
              fontSize: "1.1rem",
              wordBreak: "break-word",
              boxShadow: msg.from === "user"
                ? "0 2px 8px #1274B855"
                : "0 1px 6px #bde2fa22"
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px",
          background: "#fff",
          borderTop: "1px solid #eee",
          position: "sticky",
          bottom: 0,
          maxWidth: 480,
          margin: "0 auto",
          width: "100%"
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          autoFocus
          style={{
            flex: 1,
            fontSize: "1.15rem",
            padding: "12px",
            border: "1px solid #d4d7db",
            borderRadius: 18,
            marginRight: 8,
            fontFamily: "inherit",
            background: "#f7fafc"
          }}
        />
        <button
          type="submit"
          style={{
            background: "#1274B8",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "10px 18px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 6px #1274b833"
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}