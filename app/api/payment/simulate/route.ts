// app/api/payment/simulate/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Payment simulation request types
interface PatientData {
  name: string;
  rut?: string;
  phone?: string;
  email?: string;
  age?: number;
}

interface AppointmentData {
  specialty?: string;
  doctor?: string;
  doctorName?: string;
  amount?: string;
}

interface PaymentSimulateRequest {
  sobrecupoId: string;
  patientData: PatientData;
  appointmentData: AppointmentData;
  paymentAmount?: string;
}

// Payment simulation response types
interface PaymentDetails {
  amount: string;
  currency: string;
  method: string;
  timestamp: string;
}

interface PaymentSimulateSuccessResponse {
  success: true;
  transactionId: string;
  paymentDetails: PaymentDetails;
  message: string;
}

interface PaymentSimulateErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}

type PaymentSimulateResponse = PaymentSimulateSuccessResponse | PaymentSimulateErrorResponse;

// Payment status response types
interface PaymentStatusResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  timestamp?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<PaymentSimulateResponse>> {
  try {
    const body: PaymentSimulateRequest = await req.json();
    const { 
      sobrecupoId, 
      patientData, 
      appointmentData, 
      paymentAmount = "2990" // Precio por defecto actualizado
    } = body;

    console.log('💳 Simulando pago:', {
      sobrecupoId,
      amount: paymentAmount,
      patient: patientData.name
    });

    // Validar datos requeridos
    if (!sobrecupoId || !patientData || !paymentAmount) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos para el pago'
      }, { status: 400 });
    }

    // Validar estructura mínima de patientData
    if (!patientData.name) {
      return NextResponse.json({
        success: false,
        error: 'Nombre del paciente es requerido'
      }, { status: 400 });
    }

    // Simular delay de procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular éxito del pago (100% para testing - cambiar a Math.random() > 0.05 en producción)
    const paymentSuccess = true; // Math.random() > 0.05;

    if (paymentSuccess) {
      // Generar ID de transacción simulado
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      console.log('✅ Pago simulado exitoso:', transactionId);

      const response: PaymentSimulateSuccessResponse = {
        success: true,
        transactionId,
        paymentDetails: {
          amount: paymentAmount,
          currency: 'CLP',
          method: 'Tarjeta simulada',
          timestamp: new Date().toISOString()
        },
        message: '¡Pago procesado exitosamente!'
      };

      return NextResponse.json(response);

    } else {
      console.log('❌ Pago simulado falló');
      
      const errorResponse: PaymentSimulateErrorResponse = {
        success: false,
        error: 'Error procesando el pago. Intenta nuevamente.',
        errorCode: 'PAYMENT_DECLINED'
      };

      return NextResponse.json(errorResponse, { status: 402 });
    }

  } catch (error) {
    console.error('❌ Error en simulación de pago:', error);
    
    const errorResponse: PaymentSimulateErrorResponse = {
      success: false,
      error: 'Error interno del servidor'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET para verificar estado de pago
export async function GET(req: NextRequest): Promise<NextResponse<PaymentStatusResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'ID de transacción requerido'
      }, { status: 400 });
    }

    // Simular consulta de estado
    const response: PaymentStatusResponse = {
      success: true,
      transactionId,
      status: 'APPROVED',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error consultando estado de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error consultando estado de pago'
    }, { status: 500 });
  }
}