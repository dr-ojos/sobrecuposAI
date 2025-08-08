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

  // Función para renderizar Markdown básico
  const renderMarkdown = (text, paymentButton = null) => {
    if (!text) return '';
    
    let html = text
      // Convertir **texto** a <strong>texto</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convertir *texto* a <em>texto</em>
      .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
      // Convertir URLs en enlaces clickeables (detectar /p/, /pago, http, https)
      .replace(/(https?:\/\/[^\s<]+|\/p\/[A-Z0-9]+|\/pago\?[^\s<]+)/gi, '<a href="$1" target="_blank" class="payment-link">$1</a>')
      // Convertir saltos de línea a <br>
      .replace(/\n/g, '<br>');
    
    // Si hay un botón de pago, hacer clickeable el texto relacionado con pago
    if (paymentButton) {
      // Detectar y hacer clickeable frases de pago
      html = html
        .replace(
          /(💰.*?Confirmar pago.*?)(<br>|$)/g, 
          `<span class="payment-trigger-text" data-payment-url="${paymentButton.url}">$1</span>$2`
        )
        .replace(
          /(Último paso.*?pago.*?)(<br>|$)/gi, 
          `<span class="payment-trigger-text" data-payment-url="${paymentButton.url}">$1</span>$2`
        )
        .replace(
          /(Valor.*?autorización.*?CLP.*?)(<br>|$)/gi, 
          `<span class="payment-trigger-text" data-payment-url="${paymentButton.url}">$1</span>$2`
        );
    }
    
    return html;
  };

  // Función para manejar clicks en texto de pago
  const handlePaymentTextClick = (event) => {
    const paymentUrl = event.target.getAttribute('data-payment-url');
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
    }
  };

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
          paymentButton: data.paymentButton || null,
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

  // Escuchar mensajes de la ventana de pago
  useEffect(() => {
    console.log('🔧 === REGISTRANDO LISTENER DE POSTMESSAGE ===');
    console.log('🔧 Window location:', window.location.origin);
    console.log('🔧 Timestamp:', new Date().toISOString());
    
    const handlePaymentMessage = (event) => {
      console.log('📨 === MENSAJE RECIBIDO ===');
      console.log('📨 Origin:', event.origin);
      console.log('📨 Data:', event.data);
      console.log('📨 Data type:', typeof event.data);
      console.log('📨 Data keys:', Object.keys(event.data || {}));
      console.log('📨 Expected origin:', window.location.origin);
      
      // Verificar que el mensaje viene del dominio correcto o es localhost
      const isValidOrigin = event.origin === window.location.origin || 
                           event.origin.includes('localhost') || 
                           event.origin === 'null'; // Para casos de file://
      
      if (!isValidOrigin) {
        console.log('❌ Mensaje rechazado: origen incorrecto');
        console.log('📨 Origins comparison:', {
          received: event.origin,
          expected: window.location.origin,
          isLocalhost: event.origin.includes('localhost')
        });
        return;
      }

      console.log('💳 Mensaje de pago recibido:', event.data);

      if (event.data.type === 'PAYMENT_SUCCESS') {
        console.log('✅ === PROCESANDO PAGO EXITOSO ===');
        console.log('✅ Transaction ID:', event.data.transactionId);
        console.log('✅ Session ID:', event.data.sessionId);
        console.log('✅ Reservation confirmed:', event.data.reservationConfirmed);
        
        // 🆘 DEBUG TEMPORAL - Alert para confirmar que llega el mensaje
        alert('🎉 PAGO EXITOSO RECIBIDO! Verifica consola.');
        
        // Pago exitoso - mostrar mensaje de confirmación con detalles completos
        const appointment = event.data.appointmentDetails || {};
        const successMessage = {
          from: "bot",
          text: `🎉 ¡Pago confirmado exitosamente!\n\n💳 **TRANSACCIÓN COMPLETADA**\nID: ${event.data.transactionId}\n\n📋 **DETALLES DE TU CITA CONFIRMADA**\n👤 Paciente: ${appointment.patientName || 'N/A'}\n👨‍⚕️ Doctor: ${appointment.doctorName || 'N/A'}\n🏥 Especialidad: ${appointment.specialty || 'N/A'}\n📅 Fecha: ${appointment.date || 'N/A'}\n🕐 Hora: ${appointment.time || 'N/A'}\n🏨 Clínica: ${appointment.clinic || 'N/A'}\n\n📧 **PRÓXIMOS PASOS**\n✅ Recibirás un email de confirmación con todos los detalles\n📍 Llega 15 minutos antes a la clínica\n🆔 No olvides traer tu cédula de identidad\n💊 El pago ya está procesado\n\n¡Nos vemos en tu cita! 👩‍⚕️👨‍⚕️`,
          timestamp: new Date()
        };

        console.log('📝 Añadiendo mensaje de éxito al chat:', successMessage);
        console.log('📝 Mensajes estado antes de actualizar:', messages.length);
        
        setMessages(msgs => {
          console.log('📝 === CALLBACK SETMESSAGES ===');
          console.log('📝 Mensajes previos:', msgs.length);
          const newMessages = [...msgs, successMessage];
          console.log('📝 Nuevos mensajes:', newMessages.length);
          console.log('📝 Último mensaje añadido:', newMessages[newMessages.length - 1]);
          
          // Forzar scroll después de actualizar
          setTimeout(() => {
            const container = document.querySelector('.messages-container');
            if (container) {
              container.scrollTop = container.scrollHeight;
              console.log('📜 Scroll forzado al final');
            }
          }, 100);
          
          return newMessages;
        });

        console.log('📝 setMessages callback ejecutado');

        // Limpiar la sesión después del pago exitoso
        setSession({});

      } else if (event.data.type === 'PAYMENT_CANCELLED') {
        // Pago cancelado
        const cancelledMessage = {
          from: "bot",
          text: `⚠️ Pago cancelado.\n\nPuedes intentar nuevamente cuando estés listo. Escribe "enlace" para obtener nuevamente el enlace de pago.`,
          timestamp: new Date()
        };

        setMessages(msgs => [...msgs, cancelledMessage]);

      } else if (event.data.type === 'PAYMENT_SUCCESS_RESERVATION_ERROR') {
        // Pago exitoso pero error en reserva
        const errorMessage = {
          from: "bot",
          text: `💳 Pago procesado exitosamente (ID: ${event.data.transactionId})\n\n⚠️ Pero hubo un problema confirmando tu reserva.\n\nPor favor contacta soporte con tu ID de transacción.`,
          timestamp: new Date()
        };

        setMessages(msgs => [...msgs, errorMessage]);
      }
    };

    // Añadir event listener
    window.addEventListener('message', handlePaymentMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handlePaymentMessage);
    };
  }, []);

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
          paymentButton: data.paymentButton || null,
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
    "Veo borroso",
    "Necesito control de lentes", 
    "Me pican los ojos",
    "Veo manchas flotantes",
    "Tengo el ojo irritado"
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
                  {msg.from === 'bot' ? (
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text, msg.paymentButton) }}
                      onClick={handlePaymentTextClick}
                    />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  {msg.paymentButton && (
                    <div className="payment-button-container">
                      <button
                        onClick={() => window.open(msg.paymentButton.url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes')}
                        className="payment-button"
                      >
                        <span className="button-icon">💳</span>
                        <div className="button-content">
                          <span className="button-text">{msg.paymentButton.text}</span>
                          <span className="button-amount">{msg.paymentButton.amount}</span>
                        </div>
                        <span className="button-arrow">→</span>
                      </button>
                    </div>
                  )}
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

      {/* Input Area - NUEVO ESTILO COMO HOMEPAGE */}
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
          <div className="input-wrapper-hero">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Ej: Tengo los ojos rojos y me pican..."
              className="chat-input-hero"
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              onClick={sendMessage}
              className={`send-button-hero ${input.trim() ? 'active' : ''}`}
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

        .message-text {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .message-text strong {
          font-weight: 600;
          color: inherit;
        }

        .message-text em {
          font-style: italic;
          color: inherit;
        }

        .payment-trigger-text {
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
          position: relative;
        }

        .payment-trigger-text:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          transform: translateY(-1px);
        }

        .payment-trigger-text:active {
          transform: translateY(0);
          background: rgba(16, 185, 129, 0.2);
        }

        .payment-trigger-text::after {
          content: ' 👆';
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 0.8em;
        }

        .payment-trigger-text:hover::after {
          opacity: 1;
        }

        .payment-link {
          color: #007AFF !important;
          text-decoration: underline;
          font-weight: 600;
          transition: all 0.2s ease;
          display: inline-block;
          padding: 2px 4px;
          border-radius: 4px;
          background: rgba(0, 122, 255, 0.1);
          margin: 2px 0;
          word-break: break-all;
        }

        .payment-link:hover {
          color: #0051D0 !important;
          background: rgba(0, 122, 255, 0.2);
          transform: translateY(-1px);
          text-decoration: underline;
        }

        .payment-link:active {
          transform: translateY(0);
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

        /* Input Area - NUEVO ESTILO HERO */
        .chat-input-area {
          background: transparent;
          padding: 1.5rem;
          padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
        }

        .suggestions-section {
          max-width: 640px;
          margin: 0 auto 1.5rem auto;
        }

        .suggestions-label {
          font-size: 0.875rem;
          color: #999;
          margin-bottom: 1rem;
          font-weight: 400;
          text-align: left;
        }

        .suggestions-list {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestions-list::-webkit-scrollbar {
          display: none;
        }

        .suggestion-pill {
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-size: 0.875rem;
          color: #666;
          font-weight: 400;
          white-space: nowrap;
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
          max-width: 640px;
          margin: 0 auto;
        }

        /* NUEVO INPUT HERO STYLE - Igual que homepage */
        .input-wrapper-hero {
          display: flex;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 1rem;
          min-height: 80px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.06),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          position: relative;
        }

        .input-wrapper-hero:focus-within {
          border-color: rgba(0, 122, 255, 0.3);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 8px 32px rgba(0, 122, 255, 0.12),
            0 2px 8px rgba(0, 122, 255, 0.06),
            0 0 0 4px rgba(0, 122, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .chat-input-hero {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 1rem;
          color: #1d1d1f;
          font-family: inherit;
          resize: none;
          min-height: 48px;
          line-height: 1.5;
          padding: 0;
          padding-right: 3rem;
          font-weight: 400;
        }

        .chat-input-hero::placeholder {
          color: #999;
          font-weight: 400;
        }

        .chat-input-hero:disabled {
          opacity: 0.6;
        }

        .send-button-hero {
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
          flex-shrink: 0;
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          opacity: 0.3;
          transform: scale(0.9);
        }

        .send-button-hero.active {
          opacity: 1;
          transform: scale(1);
        }

        .send-button-hero:hover.active {
          background: #000;
          transform: scale(1.05);
        }

        .send-button-hero:disabled {
          opacity: 0.2;
          cursor: not-allowed;
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
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
          }

          .input-wrapper-hero {
            min-height: 70px;
            padding: 0.8rem;
          }

          .chat-input-hero {
            font-size: 16px;
            min-height: 40px;
            padding-right: 2.5rem;
          }

          .send-button-hero {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            bottom: 0.8rem;
            right: 0.8rem;
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

          .message-text {
            font-size: 0.85rem;
          }

          .chat-input-area {
            padding: 0.75rem;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
          }

          .input-wrapper-hero {
            min-height: 65px;
            padding: 0.7rem;
            border-radius: 16px;
          }

          .chat-input-hero {
            font-size: 16px;
            min-height: 35px;
            padding-right: 2.2rem;
          }

          .send-button-hero {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            bottom: 0.7rem;
            right: 0.7rem;
          }

          .suggestion-pill {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
        }

        @media (max-width: 375px) {
          .header-title {
            font-size: 1.1rem;
          }

          .input-wrapper-hero {
            border-radius: 14px;
            min-height: 60px;
            padding: 0.6rem;
          }

          .send-button-hero {
            width: 26px;
            height: 26px;
            border-radius: 13px;
            bottom: 0.6rem;
            right: 0.6rem;
          }
        }

        /* Payment Button Styles */
        .payment-button-container {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .payment-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          animation: pulseGlow 2s infinite;
        }

        .payment-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .payment-button:active {
          transform: translateY(0);
        }

        .button-icon {
          font-size: 1.5rem;
          color: white;
        }

        .button-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .button-text {
          color: white;
          font-weight: 600;
          font-size: 1rem;
          line-height: 1;
        }

        .button-amount {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .button-arrow {
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          opacity: 0.8;
          transition: transform 0.2s ease;
        }

        .payment-button:hover .button-arrow {
          transform: translateX(4px);
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5);
          }
        }

        /* Safe area para iPhone con notch */
        @supports (padding: max(0px)) {
          .chat-header {
            padding-top: max(0px, env(safe-area-inset-top));
          }
          
          .chat-input-area {
            padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
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