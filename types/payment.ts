// types/payment.ts - Tipos para sistema de pagos
export interface PaymentData {
  sobrecupoId: string;
  patientName: string;
  patientRut: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  clinic: string;
  sessionId: string;
  amount?: string;
  motivo?: string | null;
  fromChat?: boolean;
}

export interface StoredPaymentLink extends PaymentData {
  amount: string;
  motivo: string | null;
  fromChat: boolean;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface CreatePaymentLinkRequest extends PaymentData {}

export interface CreatePaymentLinkResponse {
  success: boolean;
  shortUrl?: string;
  shortId?: string;
  expiresAt?: string;
  error?: string;
}

export interface GetPaymentLinkResponse {
  success: boolean;
  data?: StoredPaymentLink;
  error?: string;
}

export interface PaymentLinkStorage {
  [shortId: string]: StoredPaymentLink;
}

export interface PaymentConfirmation {
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  paymentMethod?: string;
  confirmedAt?: Date;
}

export interface PaymentWebhookData {
  type: 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  paymentId: string;
  transactionId?: string;
  amount?: number;
  status: string;
  metadata?: Record<string, any>;
}