"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "¡Hola! 👋 Soy Sobrecupos IA.\nTe ayudo a encontrar y reservar sobrecupos médicos. Dime tus síntomas, el médico o la especialidad que necesitas.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fix para scroll en móviles cuando aparece teclado
  useEffect(() => {
    const handleFocus = () => {
      // Prevenir scroll automático
      setTimeout(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest"
          });
        }
      }, 100);
    };

    const handleResize = () => {
      // Mantener posición al cambiar tamaño de ventana
      setTimeout(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ 
            behavior: "auto", 
            block: "end" 
          });
        }
      }, 50);
    };

    // Prevenir zoom en iOS
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventViewportChange = () => {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    };
    
    window.addEventListener("focusin", handleFocus);
    window.addEventListener("resize", handleResize);
    window.addEventListener("touchstart", preventZoom, { passive: false });
    
    preventViewportChange();
    
    return () => {
      window.removeEventListener("focusin", handleFocus);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("touchstart", preventZoom);
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { 
      from: "user", 
      text: input,
      timestamp: new Date()
    };
    
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      // Simular typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, session }),
      });
      const data = await res.json();
      
      setIsTyping(false);
      
      // Manejar respuestas múltiples
      if (Array.isArray(data.text)) {
        data.text.forEach((t, index) => {
          setTimeout(() => {
            setMessages((msgs) => [...msgs, { 
              from: "bot", 
              text: t,
              timestamp: new Date()
            }]);
          }, index * 500);
        });
      } else if (typeof data.text === "string" && data.text.includes("\n\n")) {
        const parts = data.text.split("\n\n");
        parts.forEach((t, index) => {
          setTimeout(() => {
            setMessages((msgs) => [...msgs, { 
              from: "bot", 
              text: t,
              timestamp: new Date()
            }]);
          }, index * 500);
        });
      } else {
        setMessages((msgs) => [...msgs, { 
          from: "bot", 
          text: data.text,
          timestamp: new Date()
        }]);
      }
      setSession(data.session || {});
    } catch {
      setIsTyping(false);
      setMessages((msgs) =>
        [...msgs, { 
          from: "bot", 
          text: "❌ Error de conexión. Intenta de nuevo.",
          timestamp: new Date()
        }]
      );
    }
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Sugerencias rápidas
  const quickSuggestions = [
    "Necesito oftalmólogo urgente",
    "Dolor de cabeza fuerte",
    "Chequeo médico general"
  ];

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      {/* Header mejorado */}
      <header className="chat-header">
        <div className="header-content">
          <div className="bot-avatar">
            <div className="avatar-gradient">
              <span className="bot-icon">🤖</span>
            </div>
            <div className="status-indicator"></div>
          </div>
          <div className="header-info">
            <h1 className="bot-name">Sobrecupos AI</h1>
            <p className="bot-status">
              {isTyping ? "Escribiendo..." : "En línea"}
            </p>
          </div>
          <button className="header-menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="19" cy="12" r="1" fill="currentColor"/>
              <circle cx="5" cy="12" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Área de mensajes */}
      <main className="chat-messages">
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.from}`}>
              <div className={`message ${msg.from}`}>
                {msg.from === "bot" && (
                  <div className="message-avatar">
                    <span>🤖</span>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                  </div>
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Indicador de typing */}
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message bot">
                <div className="message-avatar">
                  <span>🤖</span>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={endRef} />
        </div>

        {/* Sugerencias rápidas */}
        {messages.length === 1 && (
          <div className="quick-suggestions">
            <p className="suggestions-title">Prueba preguntando:</p>
            <div className="suggestions-grid">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input mejorado */}
      <footer className="chat-input-container">
        <div className="chat-form">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              disabled={loading}
              className="message-input"
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()} 
              className="send-button"
            >
              {loading ? (
                <div className="loading-spinner">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height for mobile */
          width: 100vw;
          max-width: 100vw;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          overflow: hidden;
          box-sizing: border-box;
          touch-action: manipulation;
        }

        /* Header */
        .chat-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 1rem 1.5rem;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 1px 10px rgba(0, 0, 0, 0.05);
          height: 70px;
          box-sizing: border-box;
        }

        .header-content {
          display: flex;
          align-items: center;
          max-width: 800px;
          margin: 0 auto;
          gap: 1rem;
        }

        .bot-avatar {
          position: relative;
          width: 44px;
          height: 44px;
        }

        .avatar-gradient {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }

        .bot-icon {
          font-size: 20px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #34c759;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .header-info {
          flex: 1;
        }

        .bot-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
          line-height: 1.2;
        }

        .bot-status {
          font-size: 0.85rem;
          color: #34c759;
          margin: 0;
          font-weight: 500;
        }

        .header-menu {
          background: none;
          border: none;
          color: #6e6e73;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-menu:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1d1d1f;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-top: 70px;
          padding-bottom: 80px;
          display: flex;
          flex-direction: column;
          position: relative;
          -webkit-overflow-scrolling: touch;
        }

        .messages-container {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
          padding: 0 1.5rem;
          flex: 1;
        }

        .message-wrapper {
          margin-bottom: 1rem;
          display: flex;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          max-width: 75%;
          align-items: flex-end;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .message.user .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          padding: 0.875rem 1.125rem;
          border-radius: 20px;
          position: relative;
          word-wrap: break-word;
          max-width: 100%;
        }

        .message.bot .message-bubble {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-bottom-left-radius: 6px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .message.user .message-bubble {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border-bottom-right-radius: 6px;
          box-shadow: 0 2px 12px rgba(0, 122, 255, 0.3);
        }

        .message-bubble p {
          margin: 0;
          line-height: 1.4;
          font-size: 0.95rem;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          max-width: 100%;
          word-break: normal;
        }

        .message.bot .message-bubble p {
          color: #1d1d1f;
        }

        .message-time {
          font-size: 0.75rem;
          color: #8e8e93;
          font-weight: 500;
          padding: 0 0.5rem;
        }

        /* Typing indicator */
        .typing-indicator {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          border-bottom-left-radius: 6px;
          padding: 1rem 1.25rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #007aff;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        /* Quick suggestions */
        .quick-suggestions {
          margin-top: 1.5rem;
          padding: 0 0.5rem;
        }

        .suggestions-title {
          font-size: 0.9rem;
          color: #6e6e73;
          margin-bottom: 0.75rem;
          font-weight: 500;
          padding-left: 0.25rem;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.5rem;
        }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #1d1d1f;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-weight: 500;
        }

        .suggestion-chip:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 122, 255, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Input */
        .chat-input-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding: 1rem 1.5rem;
          padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          min-height: 80px;
          box-sizing: border-box;
        }

        .chat-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 24px;
          padding: 0.5rem 0.75rem;
          gap: 0.75rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: rgba(0, 122, 255, 0.3);
          box-shadow: 0 2px 16px rgba(0, 122, 255, 0.15);
        }

        .message-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 1rem;
          padding: 0.75rem 0.5rem;
          color: #1d1d1f;
          font-family: inherit;
          min-width: 0;
          resize: none;
          -webkit-appearance: none;
          -webkit-user-select: text;
        }

        .message-input::placeholder {
          color: #8e8e93;
        }

        .message-input:focus {
          -webkit-user-select: text;
        }

        .send-button {
          background: linear-gradient(135deg, #007aff, #5856d6);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .chat-container {
            height: 100vh;
            height: 100dvh;
            position: fixed;
            overflow: hidden;
          }

          .chat-header {
            padding: 0.75rem 0.75rem;
            height: 65px;
          }

          .chat-messages {
            padding-top: 65px;
            padding-bottom: 85px;
          }

          .chat-input-container {
            padding: 0.75rem 0.5rem;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
            min-height: 85px;
          }

          .header-content {
            gap: 0.75rem;
            padding: 0 0.25rem;
          }

          .bot-avatar {
            width: 40px;
            height: 40px;
          }

          .avatar-gradient {
            width: 40px;
            height: 40px;
          }

          .bot-icon {
            font-size: 18px;
          }

          .messages-container {
            padding: 1rem 0.25rem;
          }

          .message-wrapper {
            padding: 0 0.25rem;
          }

          .message {
            max-width: calc(100% - 0.5rem);
            gap: 0.5rem;
          }

          .message-content {
            max-width: calc(100% - 2.5rem);
          }

          .message-bubble {
            padding: 0.75rem 0.875rem;
            word-break: normal;
            overflow-wrap: break-word;
            hyphens: auto;
            font-size: 0.9rem;
          }

          .message-bubble p {
            font-size: 0.9rem;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .suggestions-grid {
            grid-template-columns: 1fr;
            padding: 0 0.5rem;
            gap: 0.75rem;
          }

          .suggestions-title {
            padding-left: 0.75rem;
          }

          .suggestion-chip {
            margin: 0 0.25rem;
            word-break: break-word;
            font-size: 0.9rem;
            padding: 0.875rem 1rem;
          }

          .input-wrapper {
            border-radius: 20px;
            padding: 0.4rem 0.75rem;
            gap: 0.5rem;
          }

          .message-input {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 0.6rem 0.25rem;
            -webkit-appearance: none;
            -webkit-user-select: text;
          }

          .send-button {
            width: 38px;
            height: 38px;
            flex-shrink: 0;
          }
        }

        @media (max-width: 480px) {
          .chat-container {
            overflow-x: hidden;
            width: 100vw;
            box-sizing: border-box;
            position: fixed;
            height: 100vh;
            height: 100dvh;
          }

          .chat-header {
            height: 60px;
            padding: 0.6rem 0.5rem;
          }

          .chat-messages {
            padding-top: 60px;
            padding-bottom: 90px;
          }

          .chat-input-container {
            padding: 0.6rem 0.4rem;
            padding-bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
            min-height: 90px;
          }

          .messages-container {
            padding: 1rem 0.15rem;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .message-wrapper {
            padding: 0 0.15rem;
            box-sizing: border-box;
          }

          .message {
            max-width: calc(100% - 0.3rem);
            gap: 0.4rem;
          }

          .message-content {
            max-width: calc(100% - 2rem);
          }

          .message-bubble {
            padding: 0.65rem 0.75rem;
            font-size: 0.85rem;
            line-height: 1.4;
            word-break: normal;
            overflow-wrap: break-word;
            hyphens: auto;
            border-radius: 16px;
          }

          .message-bubble p {
            font-size: 0.85rem;
            word-break: normal;
            overflow-wrap: break-word;
            line-height: 1.4;
          }

          .send-button {
            width: 36px;
            height: 36px;
          }

          .input-wrapper {
            padding: 0.35rem 0.6rem;
          }

          .message-input {
            font-size: 16px;
            padding: 0.55rem 0.2rem;
            -webkit-appearance: none;
            -webkit-user-select: text;
          }

          .quick-suggestions {
            margin-top: 1rem;
            padding: 0 0.15rem;
          }

          .suggestions-title {
            padding-left: 0.4rem;
          }

          .suggestion-chip {
            font-size: 0.8rem;
            padding: 0.75rem 0.875rem;
            word-break: break-word;
            margin: 0 0.15rem;
          }
        }

        @media (max-width: 375px) {
          .chat-header {
            height: 58px;
            padding: 0.55rem 0.4rem;
          }

          .chat-messages {
            padding-top: 58px;
            padding-bottom: 92px;
          }

          .chat-input-container {
            min-height: 92px;
            padding: 0.5rem 0.3rem;
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
          }

          .message-wrapper {
            padding: 0 0.1rem;
          }

          .message {
            max-width: calc(100% - 0.2rem);
            gap: 0.35rem;
          }

          .message-content {
            max-width: calc(100% - 1.75rem);
          }

          .message-bubble {
            padding: 0.6rem 0.7rem;
            font-size: 0.8rem;
            border-radius: 14px;
          }

          .message-bubble p {
            font-size: 0.8rem;
            line-height: 1.35;
          }
        }

        @media (max-width: 320px) {
          .message-bubble {
            padding: 0.55rem 0.65rem;
            font-size: 0.78rem;
          }

          .message-bubble p {
            font-size: 0.78rem;
          }
        }
      `}</style>
    </div>
  );
}