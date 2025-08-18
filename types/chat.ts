// types/chat.ts - Tipos para sistema de chat
export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
  id?: string;
}

export interface ChatSession {
  id?: string;
  userId?: string;
  startTime?: string;
  lastActivity?: string;
  context?: Record<string, any>;
}

export interface BotRequest {
  message: string;
  session: ChatSession;
  force_gpt?: boolean;
  context?: Record<string, any>;
}

export interface BotResponse {
  text: string;
  session?: ChatSession;
  error?: string;
  paymentButton?: PaymentButton;
  metadata?: {
    confidence?: number;
    specialty?: string;
    nextStage?: string;
    empathyGenerated?: boolean;
    processingTime?: number;
    source?: string;
    fastPath?: boolean;
    airtableResults?: any;
    doctorSearch?: any;
    fallbackMode?: boolean;
    noResults?: boolean;
  };
}

export interface ChatProps {
  initialMessage?: string;
  onSessionUpdate?: (session: ChatSession) => void;
}

export interface ChatState {
  messages: ChatMessage[];
  input: string;
  session: ChatSession;
  loading: boolean;
  keyboardOpen: boolean;
}

export interface ViewportChangeEvent extends Event {
  target: Window;
}

// Tipos específicos para chat page
export interface ChatPageMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
  id?: string;
  paymentButton?: PaymentButton;
}

export interface PaymentButton {
  text: string;
  amount: string;
  url: string;
}

export interface PaymentData {
  type: 'PAYMENT_SUCCESS' | 'PAYMENT_CANCELLED' | 'PAYMENT_SUCCESS_RESERVATION_ERROR';
  transactionId?: string;
  sessionId?: string;
  reservationConfirmed?: boolean;
  appointmentDetails?: {
    patientName?: string;
    doctorName?: string;
    specialty?: string;
    date?: string;
    time?: string;
    clinic?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}