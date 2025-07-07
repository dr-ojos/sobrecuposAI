// /pages/chat.js
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy Sobrecupos IA. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    // Enviar al backend
    const res = await fetch("/api/bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, session }),
    });
    const data = await res.json();
    // Puede venir como string o como varios mensajes separados por \n\n
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
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      padding: "0", margin: "0"
    }}>
      <div style={{
        width: "100%", maxWidth: 430, marginTop: 36, background: "#fff",
        borderRadius: 20, boxShadow: "0 8px 32px #0002", padding: "24px 0"
      }}>
        <h2 style={{
          fontWeight: 800, fontSize: 24, margin: 0, textAlign: "center", color: "#2a3342"
        }}>Sobrecupos Chat IA</h2>
        <div style={{
          maxHeight: "62vh", minHeight: 320, overflowY: "auto",
          padding: "24px 24px 0", marginTop: 10, marginBottom: 10
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              margin: "8px 0",
              textAlign: msg.from === "bot" ? "left" : "right"
            }}>
              <span style={{
                display: "inline-block",
                background: msg.from === "bot" ? "#f1f5f9" : "#3185fc",
                color: msg.from === "bot" ? "#333" : "#fff",
                borderRadius: 14,
                padding: "10px 16px",
                maxWidth: "80%",
                fontSize: 16,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
              }}>{msg.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex", alignItems: "center", padding: "0 24px 0 24px",
            borderTop: "1px solid #e2e8f0"
          }}>
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
              background: "#f1f5f9"
            }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              marginLeft: 12,
              background: "#3185fc",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16
            }}
          >Enviar</button>
        </form>
      </div>
    </div>
  );
}