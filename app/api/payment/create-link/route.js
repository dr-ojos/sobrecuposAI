// app/api/payment/create-link/route.js
import { NextResponse } from 'next/server';

// Storage temporal para enlaces de pago (en producción usar base de datos)
const paymentLinks = {};

export async function POST(req) {
  try {
    const paymentData = await req.json();
    
    console.log('🔗 Creando enlace de pago corto:', paymentData);

    // Validar datos requeridos
    const requiredFields = ['sobrecupoId', 'patientName', 'patientRut', 'patientPhone', 'patientEmail', 'patientAge', 'doctorName', 'specialty', 'date', 'time', 'clinic', 'sessionId'];
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        return NextResponse.json({
          success: false,
          error: `Campo requerido faltante: ${field}`
        }, { status: 400 });
      }
    }

    // Generar ID corto único
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Guardar datos con expiración (30 minutos)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    
    paymentLinks[shortId] = {
      ...paymentData,
      amount: paymentData.amount || "2990", // Precio por defecto actualizado
      motivo: paymentData.motivo || null, // 🆕 GUARDAR MOTIVO DE CONSULTA
      fromChat: paymentData.fromChat !== undefined ? paymentData.fromChat : true, // 🆕 RESPETAR ORIGEN ESPECÍFICO
      createdAt: new Date(),
      expiresAt: expiresAt,
      used: false
    };

    // URL corta
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
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET para obtener datos de un enlace corto
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get('id');

    if (!shortId) {
      return NextResponse.json({
        success: false,
        error: 'ID de enlace requerido'
      }, { status: 400 });
    }

    const linkData = paymentLinks[shortId];

    if (!linkData) {
      return NextResponse.json({
        success: false,
        error: 'Enlace no encontrado'
      }, { status: 404 });
    }

    // Verificar expiración
    if (new Date() > new Date(linkData.expiresAt)) {
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

    return NextResponse.json({
      success: true,
      data: linkData
    });

  } catch (error) {
    console.error('❌ Error obteniendo enlace de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE para marcar un enlace como usado
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get('id');

    if (!shortId) {
      return NextResponse.json({
        success: false,
        error: 'ID de enlace requerido'
      }, { status: 400 });
    }

    if (paymentLinks[shortId]) {
      paymentLinks[shortId].used = true;
      paymentLinks[shortId].usedAt = new Date();
    }

    return NextResponse.json({
      success: true,
      message: 'Enlace marcado como usado'
    });

  } catch (error) {
    console.error('❌ Error marcando enlace como usado:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}