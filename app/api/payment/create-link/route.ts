// app/api/payment/create-link/route.ts - API de enlaces de pago en TypeScript
import { NextRequest, NextResponse } from 'next/server';
import type { 
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  GetPaymentLinkResponse,
  StoredPaymentLink,
  PaymentLinkStorage
} from '../../../../types/payment';

// Storage temporal para enlaces de pago (en producción usar base de datos)
const paymentLinks: PaymentLinkStorage = {};

// Campos requeridos para crear un enlace de pago
const REQUIRED_FIELDS: Array<keyof CreatePaymentLinkRequest> = [
  'sobrecupoId', 
  'patientName', 
  'patientRut', 
  'patientPhone', 
  'patientEmail', 
  'patientAge', 
  'doctorName', 
  'specialty', 
  'date', 
  'time', 
  'clinic', 
  'sessionId'
];

// Constantes
const DEFAULT_AMOUNT = "2990";
const LINK_EXPIRY_MINUTES = 30;
const SHORT_ID_LENGTH = 6;

// Validación de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validación de RUT chileno básica
function isValidRUT(rut: string): boolean {
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
  return rutRegex.test(rut);
}

// Validación de teléfono chileno
function isValidChileanPhone(phone: string): boolean {
  const phoneRegex = /^(\+56)?[2-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Generar ID corto único
function generateShortId(): string {
  let shortId: string;
  do {
    shortId = Math.random().toString(36).substring(2, 2 + SHORT_ID_LENGTH).toUpperCase();
  } while (paymentLinks[shortId]); // Evitar colisiones
  
  return shortId;
}

// Limpiar enlaces expirados
function cleanupExpiredLinks(): void {
  const now = new Date();
  const expiredKeys = Object.keys(paymentLinks).filter(
    key => now > paymentLinks[key].expiresAt
  );
  
  expiredKeys.forEach(key => {
    delete paymentLinks[key];
  });
  
  if (expiredKeys.length > 0) {
    console.log(`🧹 Limpiados ${expiredKeys.length} enlaces expirados`);
  }
}

// POST: Crear enlace de pago corto
export async function POST(request: NextRequest): Promise<NextResponse<CreatePaymentLinkResponse>> {
  try {
    const paymentData: CreatePaymentLinkRequest = await request.json();
    
    console.log('🔗 Creando enlace de pago corto:', {
      sobrecupoId: paymentData.sobrecupoId,
      patientName: paymentData.patientName,
      specialty: paymentData.specialty
    });

    // Validar campos requeridos
    const missingFields = REQUIRED_FIELDS.filter(field => !paymentData[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validaciones específicas
    if (!isValidEmail(paymentData.patientEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Email del paciente no válido'
      }, { status: 400 });
    }

    if (!isValidRUT(paymentData.patientRut)) {
      return NextResponse.json({
        success: false,
        error: 'RUT del paciente no válido (formato: 12.345.678-9)'
      }, { status: 400 });
    }

    if (!isValidChileanPhone(paymentData.patientPhone)) {
      return NextResponse.json({
        success: false,
        error: 'Teléfono no válido (debe ser chileno)'
      }, { status: 400 });
    }

    if (paymentData.patientAge < 0 || paymentData.patientAge > 150) {
      return NextResponse.json({
        success: false,
        error: 'Edad del paciente no válida'
      }, { status: 400 });
    }

    // Limpiar enlaces expirados antes de crear uno nuevo
    cleanupExpiredLinks();

    // Generar ID corto único
    const shortId = generateShortId();
    
    // Calcular expiración
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_MINUTES * 60 * 1000);
    
    // Crear enlace de pago
    const storedLink: StoredPaymentLink = {
      ...paymentData,
      amount: paymentData.amount || DEFAULT_AMOUNT,
      motivo: paymentData.motivo || null,
      fromChat: paymentData.fromChat !== undefined ? paymentData.fromChat : true,
      createdAt: new Date(),
      expiresAt: expiresAt,
      used: false
    };

    // Guardar en storage
    paymentLinks[shortId] = storedLink;

    // Crear URL corta
    const shortUrl = `/p/${shortId}`;

    console.log('✅ Enlace corto creado:', shortUrl);

    return NextResponse.json({
      success: true,
      shortUrl,
      shortId,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Error creando enlace de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET: Obtener datos de un enlace corto
export async function GET(request: NextRequest): Promise<NextResponse<GetPaymentLinkResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('id');

    if (!shortId) {
      return NextResponse.json({
        success: false,
        error: 'ID de enlace requerido'
      }, { status: 400 });
    }

    console.log('🔍 Buscando enlace de pago:', shortId);

    // Limpiar enlaces expirados
    cleanupExpiredLinks();

    const linkData = paymentLinks[shortId];

    if (!linkData) {
      return NextResponse.json({
        success: false,
        error: 'Enlace no encontrado'
      }, { status: 404 });
    }

    // Verificar expiración (doble check)
    if (new Date() > linkData.expiresAt) {
      delete paymentLinks[shortId];
      return NextResponse.json({
        success: false,
        error: 'Enlace expirado'
      }, { status: 410 });
    }

    // Verificar si ya fue usado
    if (linkData.used) {
      return NextResponse.json({
        success: false,
        error: 'Enlace ya utilizado'
      }, { status: 409 });
    }

    console.log('✅ Enlace encontrado:', shortId, 'Para:', linkData.patientName);

    return NextResponse.json({
      success: true,
      data: linkData
    });

  } catch (error) {
    console.error('❌ Error obteniendo enlace de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE: Marcar enlace como usado o eliminarlo
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; message?: string; error?: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('id');
    const markAsUsed = searchParams.get('markAsUsed') === 'true';

    if (!shortId) {
      return NextResponse.json({
        success: false,
        error: 'ID de enlace requerido'
      }, { status: 400 });
    }

    console.log('🗑️ Procesando eliminación de enlace:', shortId, markAsUsed ? '(marcar como usado)' : '(eliminar)');

    const linkData = paymentLinks[shortId];

    if (!linkData) {
      return NextResponse.json({
        success: false,
        error: 'Enlace no encontrado'
      }, { status: 404 });
    }

    if (markAsUsed) {
      // Marcar como usado en lugar de eliminar
      paymentLinks[shortId].used = true;
      console.log('✅ Enlace marcado como usado:', shortId);
      
      return NextResponse.json({
        success: true,
        message: 'Enlace marcado como usado'
      });
    } else {
      // Eliminar completamente
      delete paymentLinks[shortId];
      console.log('✅ Enlace eliminado:', shortId);
      
      return NextResponse.json({
        success: true,
        message: 'Enlace eliminado'
      });
    }

  } catch (error) {
    console.error('❌ Error eliminando enlace de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Función para obtener estadísticas (útil para debugging)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    cleanupExpiredLinks();
    
    const stats = {
      totalLinks: Object.keys(paymentLinks).length,
      usedLinks: Object.values(paymentLinks).filter(link => link.used).length,
      activeLinks: Object.values(paymentLinks).filter(link => !link.used).length,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
    }, { status: 500 });
  }
}