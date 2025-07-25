'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ChatComponent() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "¡Hola! 👋 Soy tu asistente de Sobrecupos y estoy aquí para ayudarte a encontrar la atención médica que necesitas.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const initialMessage = searchParams.get('initial');
    console.log('🔍 URL completa:', window.location.href);
    console.log('🔍 SearchParams:', searchParams.toString());
    console.log('🔍 Initial message from URL:', initialMessage);
    
    if (initialMessage && !hasProcessedInitial) {
      console.log('✅ Processing initial message:', initialMessage);
      setHasProcessedInitial(true);
      
      const userMsg = {
        from: "user",
        text: initialMessage,
        timestamp: new Date()
      };
      
      console.log('📤 Adding user message:', userMsg);
      setMessages((msgs) => {
        console.log('💬 Current messages:', msgs);
        console.log('💬 Adding message:', userMsg);
        return [...msgs, userMsg];
      });
      
      setTimeout(() => {
        console.log('⏰ Processing message after delay');
        processInitialMessage(initialMessage);
      }, 1000);
    } else {
      console.log('❌ No initial message or already processed:', { initialMessage, hasProcessedInitial });
    }
  }, [searchParams, hasProcessedInitial]);

  const processInitialMessage = async (message) => {
    setLoading(true);
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          session: {}
        }),
      });
      
      const data = await res.json();
      
      setIsTyping(false);
      
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
          text: data.text || "¿En qué puedo ayudarte?",
          timestamp: new Date()
        }]);
      }
      setSession(data.session || {});
    } catch (error) {
      console.error('❌ Error processing initial message:', error);
      setIsTyping(false);
      setMessages((msgs) => [...msgs, { 
        from: "bot", 
        text: "Me disculpo, parece que hay un problema de conexión. No te preocupes, puedes intentar nuevamente y estaré aquí para ayudarte. 💙",
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar segundo mensaje de bienvenida después de un delay
  useEffect(() => {
    if (messages.length === 1) {
      const timer = setTimeout(() => {
        setMessages(msgs => [...msgs, {
          from: "bot",
          text: "¿Cómo te sientes hoy? Cuéntame qué tipo de consulta médica estás buscando o si tienes algún síntoma que te preocupe. Estoy aquí para escucharte y ayudarte. 🩺💙",
          timestamp: new Date()
        }]);
      }, 1500); // Delay de 1.5 segundos

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

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

    const handleFocus = () => {
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
      setTimeout(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ 
            behavior: "auto", 
            block: "end" 
          });
        }
      }, 50);
    };

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
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleLoad);
    window.addEventListener("load", handleLoad);
    window.addEventListener("touchstart", preventZoom, { passive: false });
    
    preventViewportChange();
    
    return () => {
      window.removeEventListener("focusin", handleFocus);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleLoad);
      window.removeEventListener("load", handleLoad);
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input, 
          session 
        }),
      });
      const data = await res.json();
      
      setIsTyping(false);
      
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
          text: "Lo siento, parece que tengo dificultades para conectarme en este momento. Por favor, inténtalo de nuevo. Estoy aquí para ayudarte. 🤗",
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

  const quickSuggestions = [
    "Necesito un oftalmólogo urgente 👁️",
    "Busco consulta con cardiólogo ❤️", 
    "Tengo dolor de cabeza frecuente 🤕",
    "Quiero un chequeo médico general 🩺",
    "Necesito ver un dermatólogo 🧴"
  ];

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
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
                    <p style={{whiteSpace: 'pre-line'}}>{msg.text}</p>
                  </div>
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
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
      </main>

      <footer className={`chat-input-container ${keyboardOpen ? 'keyboard-open' : ''}`}>
        {messages.length === 1 && !hasProcessedInitial && (
          <div className="simple-suggestions">
            <p className="suggestions-label">💬 Cuéntame, ¿en qué puedo ayudarte?</p>
            <div className="suggestions-carousel">
              {quickSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="chat-form" onSubmit={sendMessage}>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Cuéntame qué necesitas..."
              className="chat-input"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className={`send-button ${input.trim() ? 'active' : ''}`}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="arrow-up"></div>
              )}
            </button>
          </div>
        </form>
      </footer>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chat-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 1rem 1.5rem;
          padding-top: calc(1rem + env(safe-area-inset-top, 0px));
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .bot-avatar {
          position: relative;
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
          font-size: 1.5rem;
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
        }

        .header-info {
          flex: 1;
        }

        .bot-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
          line-height: 1.2;
        }

        .bot-status {
          font-size: 0.85rem;
          color: #8e8e93;
          margin: 0;
          line-height: 1.2;
        }

        .header-menu {
          background: none;
          border: none;
          color: #8e8e93;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-menu:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1d1d1f;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: calc(90px + env(safe-area-inset-top, 0px)) 0 140px 0;
          -webkit-overflow-scrolling: touch;
        }

        .messages-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .message-wrapper {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          max-width: 85%;
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
          flex-shrink: 0;
          font-size: 1rem;
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
          background: white;
          border-radius: 20px;
          padding: 0.875rem 1.125rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
          max-width: 100%;
          word-wrap: break-word;
        }

        .message.user .message-bubble {
          background: linear-gradient(135deg, #007aff, #5856d6);
          color: white;
          border: none;
        }

        .message-bubble p {
          margin: 0;
          line-height: 1.4;
          font-size: 0.95rem;
          color: #1d1d1f;
        }

        .message.user .message-bubble p {
          color: white;
        }

        .message-time {
          font-size: 0.75rem;
          color: #8e8e93;
          margin: 0 0.5rem;
        }

        .typing-indicator {
          background: white;
          border-radius: 20px;
          padding: 1rem 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.05);
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

        .simple-suggestions {
          margin-bottom: 1rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .suggestions-label {
          font-size: 0.8rem;
          color: #8e8e93;
          margin: 0 0 0.5rem;
          font-weight: 400;
          text-align: center;
        }

        .suggestions-carousel {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem 0;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestions-carousel::-webkit-scrollbar {
          display: none;
        }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 0.5rem 0.875rem;
          font-size: 0.8rem;
          color: #6e6e73;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 400;
          font-family: inherit;
        }

        .suggestion-chip:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.15);
          color: #1d1d1f;
        }

        .suggestion-chip:active {
          transform: scale(0.98);
        }

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
          box-sizing: border-box;
          transition: transform 0.3s ease;
        }

        .chat-input-container.keyboard-open {
          transform: translateY(0);
          bottom: env(keyboard-inset-height, 0);
        }

        .chat-form {
          max-width: 800px;
          margin: 0 auto;
        }

        /* NUEVO DISEÑO DEL INPUT - COMO EN LA PÁGINA PRINCIPAL */
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 1rem;
          min-height: 60px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.06),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .input-wrapper:focus-within {
          border-color: rgba(0, 122, 255, 0.3);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 8px 32px rgba(0, 122, 255, 0.12),
            0 2px 8px rgba(0, 122, 255, 0.06),
            0 0 0 4px rgba(0, 122, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .chat-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 1rem;
          color: #1d1d1f;
          font-family: inherit;
          resize: none;
          min-height: 40px;
          max-height: 120px;
          line-height: 1.5;
          padding: 0;
          padding-right: 3rem;
          vertical-align: top;
        }

        .chat-input::placeholder {
          color: #a0aec0;
          font-size: 1rem;
        }

        .chat-input:disabled {
          opacity: 0.6;
        }

        /* BOTÓN FLOTANTE DENTRO DEL INPUT */
        .send-button {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          flex-shrink: 0;
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          opacity: 0.6;
          transform: scale(0.9);
          box-shadow: 
            0 4px 16px rgba(0, 122, 255, 0.3),
            0 1px 4px rgba(0, 122, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .send-button.active {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: white;
          opacity: 1;
          transform: scale(1);
          box-shadow: 
            0 6px 24px rgba(0, 122, 255, 0.4),
            0 2px 8px rgba(0, 122, 255, 0.3);
        }

        .send-button:hover.active {
          transform: scale(1.05);
          box-shadow: 
            0 8px 32px rgba(0, 122, 255, 0.5),
            0 4px 12px rgba(0, 122, 255, 0.4);
        }

        .send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .arrow-up {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid currentColor;
        }

        .loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 0.75rem 1rem;
            padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
          }

          .header-content {
            gap: 0.75rem;
          }

          .avatar-gradient {
            width: 40px;
            height: 40px;
          }

          .bot-icon {
            font-size: 1.3rem;
          }

          .bot-name {
            font-size: 1rem;
          }

          .bot-status {
            font-size: 0.8rem;
          }

          .messages-container {
            padding: 0 1rem;
          }

          .message {
            max-width: 90%;
          }

          .message-bubble {
            padding: 0.75rem 1rem;
          }

          .message-bubble p {
            font-size: 0.9rem;
          }

          .chat-input-container {
            padding: 0.75rem 1rem;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          }

          .input-wrapper {
            min-height: 56px;
            padding: 0.8rem;
            border-radius: 18px;
          }

          .chat-input {
            font-size: 0.95rem;
            min-height: 36px;
            padding-right: 2.5rem;
          }

          .send-button {
            width: 32px;
            height: 32px;
            bottom: 0.8rem;
            right: 0.8rem;
          }

          .suggestion-chip {
            font-size: 0.75rem;
            padding: 0.4rem 0.75rem;
          }

          .chat-messages {
            padding-bottom: 160px;
          }
        }

        @media (max-width: 480px) {
          .message {
            max-width: 95%;
          }

          .message-bubble {
            padding: 0.7rem 0.9rem;
          }

          .message-bubble p {
            font-size: 0.85rem;
          }

          .chat-input-container {
            padding: 0.5rem;
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
          }

          .input-wrapper {
            min-height: 52px;
            padding: 0.7rem;
            border-radius: 16px;
          }

          .chat-input {
            font-size: 0.9rem;
            min-height: 32px;
            padding-right: 2.2rem;
          }

          .send-button {
            width: 28px;
            height: 28px;
            bottom: 0.7rem;
            right: 0.7rem;
          }

          .chat-messages {
            padding-bottom: 140px;
          }
        }

        @media (max-width: 375px) {
          .input-wrapper {
            min-height: 48px;
            padding: 0.6rem;
            border-radius: 14px;
          }

          .chat-input {
            font-size: 0.85rem;
            min-height: 28px;
            padding-right: 2rem;
          }

          .send-button {
            width: 26px;
            height: 26px;
            bottom: 0.6rem;
            right: 0.6rem;
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .chat-header {
            padding-top: max(1rem, env(safe-area-inset-top));
          }
          
          .chat-input-container {
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="chat-loading">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Cargando chat...</p>
        </div>
        <style jsx>{`
          .chat-loading {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%);
          }
          .loading-container {
            text-align: center;
            color: #8e8e93;
          }
          .loading-spinner-large {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(0, 122, 255, 0.2);
            border-top: 3px solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <ChatComponent />
    </Suspense>
  );
}