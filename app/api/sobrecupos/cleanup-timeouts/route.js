import { NextResponse } from 'next/server';

// API para limpiar sobrecupos con timeout vencido
export async function POST() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' }, 
        { status: 500 }
      );
    }

    console.log('🧹 Iniciando limpieza de sobrecupos vencidos...');
    
    // 1. Obtener todos los sobrecupos con reserva temporal
    const listResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={Disponible}="Reserva Temporal"`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error('Error obteniendo sobrecupos temporales');
    }

    const data = await listResponse.json();
    const sobrecuposTemporales = data.records || [];

    console.log(`📋 Encontrados ${sobrecuposTemporales.length} sobrecupos temporales`);

    if (sobrecuposTemporales.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay sobrecupos temporales para limpiar',
        cleaned: 0
      });
    }

    // 2. Filtrar sobrecupos vencidos
    const now = new Date();
    const sobrecuposVencidos = sobrecuposTemporales.filter(sobrecupo => {
      const paymentTimeout = sobrecupo.fields['Payment Timeout'];
      if (!paymentTimeout) {
        // Si no tiene timeout, asumir que está vencido (por seguridad)
        return true;
      }
      
      const timeoutDate = new Date(paymentTimeout);
      const vencido = now > timeoutDate;
      
      console.log(`⏰ Sobrecupo ${sobrecupo.id}: timeout=${paymentTimeout}, vencido=${vencido}`);
      return vencido;
    });

    console.log(`🗑️ Sobrecupos vencidos para limpiar: ${sobrecuposVencidos.length}`);

    // 3. Liberar sobrecupos vencidos (actualizar a disponible)
    const cleanupResults = [];
    
    for (const sobrecupo of sobrecuposVencidos) {
      try {
        const updateData = {
          fields: {
            Disponible: "Si", // Volver a disponible
            "Session ID": null,
            "Payment Timeout": null,
            "Reserva Timestamp": null,
            // Limpiar datos del paciente si los había
            Nombre: null,
            Email: null,
            Telefono: null,
            RUT: null,
            Edad: null,
            "Motivo Consulta": null
          }
        };

        // Limpiar campos null que pueden causar problemas
        Object.keys(updateData.fields).forEach(key => {
          if (updateData.fields[key] === null) {
            delete updateData.fields[key];
          }
        });

        const updateResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupo.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        );

        if (updateResponse.ok) {
          cleanupResults.push({
            id: sobrecupo.id,
            success: true,
            sessionId: sobrecupo.fields['Session ID']
          });
          console.log(`✅ Sobrecupo liberado: ${sobrecupo.id}`);
        } else {
          const errorData = await updateResponse.json();
          cleanupResults.push({
            id: sobrecupo.id,
            success: false,
            error: errorData.error?.message
          });
          console.error(`❌ Error liberando sobrecupo ${sobrecupo.id}:`, errorData);
        }
      } catch (error) {
        cleanupResults.push({
          id: sobrecupo.id,
          success: false,
          error: error.message
        });
        console.error(`❌ Error procesando sobrecupo ${sobrecupo.id}:`, error);
      }
    }

    const successCount = cleanupResults.filter(r => r.success).length;
    const errorCount = cleanupResults.filter(r => !r.success).length;

    console.log(`🎯 Limpieza completada: ${successCount} exitosos, ${errorCount} errores`);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${successCount} sobrecupos liberados`,
      cleaned: successCount,
      errors: errorCount,
      results: cleanupResults
    });

  } catch (error) {
    console.error('❌ Error en cleanup de timeouts:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

// GET para verificar estado de sobrecupos temporales
export async function GET() {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' }, 
        { status: 500 }
      );
    }

    // Obtener sobrecupos con reserva temporal
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={Disponible}="Reserva Temporal"`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error obteniendo sobrecupos temporales');
    }

    const data = await response.json();
    const sobrecuposTemporales = data.records || [];

    // Analizar estado de cada uno
    const now = new Date();
    const analysis = sobrecuposTemporales.map(sobrecupo => {
      const paymentTimeout = sobrecupo.fields['Payment Timeout'];
      const sessionId = sobrecupo.fields['Session ID'];
      const reservaTimestamp = sobrecupo.fields['Reserva Timestamp'];
      
      let status = 'unknown';
      let remainingMinutes = 0;
      
      if (paymentTimeout) {
        const timeoutDate = new Date(paymentTimeout);
        const diffMs = timeoutDate.getTime() - now.getTime();
        remainingMinutes = Math.ceil(diffMs / (1000 * 60));
        status = diffMs > 0 ? 'active' : 'expired';
      }

      return {
        id: sobrecupo.id,
        sessionId,
        paymentTimeout,
        reservaTimestamp,
        status,
        remainingMinutes: Math.max(0, remainingMinutes)
      };
    });

    const activeCount = analysis.filter(a => a.status === 'active').length;
    const expiredCount = analysis.filter(a => a.status === 'expired').length;

    return NextResponse.json({
      total: sobrecuposTemporales.length,
      active: activeCount,
      expired: expiredCount,
      sobrecupos: analysis
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de timeouts:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}