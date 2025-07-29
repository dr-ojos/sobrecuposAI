'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ChatComponent() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hola. Soy tu asistente médico. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
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
      }, 800);
    } else {
      console.log('❌ No initial message or already processed:', { initialMessage, hasProcessedInitial });
    }
  }, [searchParams, hasProcessedInitial]);

  const processInitialMessage = async (message) => {
    setLoading(true);
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
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
          }, index * 400);
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
          }, index * 400);
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
        text: "Disculpa, hay un problema de conexión. Intenta nuevamente.",
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
          text: "Cuéntame tus síntomas o qué especialista necesitas.",
          timestamp: new Date()
        }]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

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
      await new Promise(resolve => setTimeout(resolve, 600));
      
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
          }, index * 400);
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
          }, index * 400);
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
          text: "Error de conexión. Intenta nuevamente.",
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
    "Oftalmólogo",
    "Cardiólogo", 
    "Dolor de cabeza",
    "Chequeo médico",
    "Dermatólogo"
  ];

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <main className="chat-container">
      {/* Header Minimalista */}
      <header className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={handleBackClick} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-text">
              <div className="header-title-row">
                <h1 className="header-title">Sobrecupos</h1>
                <span className="header-subtitle">AI</span>
              </div>
              <div className="status-info">
                <div className="status-dot"></div>
                <span className="status-text">
                  {isTyping ? "Escribiendo..." : "En línea"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <section className="chat-messages">
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.from}`}>
              <div className="message-content">
                <div className={`message-bubble ${msg.from}`}>
                  <p>{msg.text}</p>
                </div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-content">
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={endRef} />
        </div>
      </section>

      {/* Input Area */}
      <footer className="chat-input-area">
        {messages.length <= 2 && !hasProcessedInitial && (
          <div className="suggestions-section">
            <p className="suggestions-label">Prueba preguntando:</p>
            <div className="suggestions-list">
              {quickSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-pill"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Describe tus síntomas..."
              className="chat-input"
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              onClick={sendMessage}
              className={`send-button ${input.trim() ? 'active' : ''}`}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .chat-container {
          height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
          font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .chat-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e5e5;
          padding: env(safe-area-inset-top, 0) 0 0 0;
        }

        .header-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .back-button {
          width: 36px;
          height: 36px;
          background: none;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          margin-top: 0.25rem;
        }

        .back-button:hover {
          border-color: #171717;
          background: #f9fafb;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .header-title-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #171717;
          margin: 0;
        }

        .header-subtitle {
          font-size: 1rem;
          font-weight: 300;
          color: #666;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #34c759;
          border-radius: 50%;
        }

        .status-text {
          font-size: 0.75rem;
          color: #666;
          font-weight: 400;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .messages-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-wrapper {
          display: flex;
          width: 100%;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-wrapper.bot {
          justify-content: flex-start;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          max-width: 70%;
          gap: 0.25rem;
        }

        .message-wrapper.user .message-content {
          align-items: flex-end;
        }

        .message-wrapper.bot .message-content {
          align-items: flex-start;
        }

        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 16px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .message-bubble.bot {
          background: white;
          border: 1px solid #e5e5e5;
          color: #171717;
        }

        .message-bubble.user {
          background: #171717;
          color: white;
        }

        .message-bubble p {
          margin: 0;
          font-size: 0.9rem;
          white-space: pre-line;
        }

        .message-time {
          font-size: 0.7rem;
          color: #999;
          margin: 0 0.5rem;
        }

        .typing-bubble {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 1rem;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dots div {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #666;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dots div:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots div:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }

        /* Input Area */
        .chat-input-area {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid #e5e5e5;
          padding: 1rem;
          padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
        }

        .suggestions-section {
          max-width: 800px;
          margin: 0 auto 1rem auto;
        }

        .suggestions-label {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 400;
        }

        .suggestions-list {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestions-list::-webkit-scrollbar {
          display: none;
        }

        .suggestion-pill {
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
        }

        .suggestion-pill:hover {
          background: #e5e5e5;
          border-color: #d4d4d4;
          color: #171717;
        }

        .suggestion-pill:active {
          transform: scale(0.98);
        }

        .input-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 0.75rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .input-wrapper:focus-within {
          border-color: #171717;
          box-shadow: 0 0 0 1px #171717;
        }

        .chat-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 0.9rem;
          color: #171717;
          font-family: inherit;
          resize: none;
          min-height: 20px;
          max-height: 100px;
          line-height: 1.4;
          padding-right: 2.5rem;
        }

        .chat-input::placeholder {
          color: #999;
        }

        .chat-input:disabled {
          opacity: 0.6;
        }

        .send-button {
          width: 36px;
          height: 36px;
          background: #171717;
          border: none;
          border-radius: 18px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: absolute;
          bottom: 0.75rem;
          right: 0.75rem;
          opacity: 0.3;
          transform: scale(0.9);
        }

        .send-button.active {
          opacity: 1;
          transform: scale(1);
        }

        .send-button:hover.active {
          background: #000;
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            padding: 0.75rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .back-button {
            width: 32px;
            height: 32px;
          }

          .messages-container {
            padding: 0 0.75rem;
          }

          .message-content {
            max-width: 85%;
          }

          .chat-input-area {
            padding: 0.75rem;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
          }

          .input-wrapper {
            padding: 0.6rem;
          }

          .chat-input {
            font-size: 16px;
            padding-right: 2.2rem;
          }

          .send-button {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            bottom: 0.6rem;
            right: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .message-content {
            max-width: 90%;
          }

          .message-bubble {
            padding: 0.6rem 0.8rem;
          }

          .message-bubble p {
            font-size: 0.85rem;
          }

          .input-wrapper {
            padding: 0.5rem;
          }

          .chat-input {
            font-size: 16px;
            padding-right: 2rem;
          }

          .send-button {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            bottom: 0.5rem;
            right: 0.5rem;
          }

          .suggestion-pill {
            font-size: 0.75rem;
            padding: 0.35rem 0.7rem;
          }
        }

        @media (max-width: 375px) {
          .header-title {
            font-size: 1.1rem;
          }

          .input-wrapper {
            border-radius: 10px;
          }

          .send-button {
            width: 26px;
            height: 26px;
            border-radius: 13px;
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .chat-header {
            padding-top: max(0px, env(safe-area-inset-top));
          }
          
          .chat-input-area {
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="chat-loading">
        <div className="loading-container">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p>Cargando chat...</p>
        </div>
        <style jsx>{`
          .chat-loading {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #e5e5e5 100%);
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          }
          .loading-container {
            text-align: center;
            color: #666;
          }
          .loading-dots {
            display: flex;
            gap: 4px;
            justify-content: center;
            margin-bottom: 1rem;
          }
          .loading-dots div {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #666;
            animation: loading 1.4s infinite ease-in-out;
          }
          .loading-dots div:nth-child(2) {
            animation-delay: 0.2s;
          }
          .loading-dots div:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes loading {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.3;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
          p {
            font-size: 0.9rem;
            margin: 0;
          }
        `}</style>
      </div>
    }>
      <ChatComponent />
    </Suspense>
  );
}