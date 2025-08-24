// API de diagnóstico completo para notificaciones
import { NextResponse } from 'next/server';

interface LogEntry {
  mensaje: string;
  tipo: 'info' | 'error' | 'warning';
  timestamp: string;
}

export async function POST(req) {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    etapas: [] as LogEntry[],
    errores: [] as LogEntry[],
    warnings: [] as LogEntry[],
    success: false,
    resultadoFinal: null as any
  };

  function log(mensaje: string, tipo: 'info' | 'error' | 'warning' = 'info') {
    const entry = { mensaje, tipo, timestamp: new Date().toISOString() };
    if (tipo === 'error') diagnostico.errores.push(entry);
    else if (tipo === 'warning') diagnostico.warnings.push(entry);
    else diagnostico.etapas.push(entry);
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }

  try {
    const { doctorId, testData } = await req.json();
    
    log('🚨 === DIAGNÓSTICO COMPLETO DE NOTIFICACIONES ===');
    log(`📋 Doctor ID a probar: ${doctorId}`);

    // 1. VERIFICAR VARIABLES DE ENTORNO
    log('🔧 === VERIFICANDO VARIABLES DE ENTORNO ===');
    const envVars = {
      AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
      AIRTABLE_DOCTORS_TABLE: process.env.AIRTABLE_DOCTORS_TABLE,
      AIRTABLE_PATIENTS_TABLE: process.env.AIRTABLE_PATIENTS_TABLE,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (key.includes('KEY') || key.includes('TOKEN') || key.includes('SID')) {
        log(`🔧 ${key}: ${value ? '✅ CONFIGURADA' : '❌ FALTA'}`, value ? 'info' : 'error');
      } else {
        log(`🔧 ${key}: ${value || '❌ NO CONFIGURADA'}`, value ? 'info' : 'warning');
      }
    });

    if (!envVars.AIRTABLE_API_KEY) {
      log('❌ CRÍTICO: AIRTABLE_API_KEY no configurada', 'error');
      return NextResponse.json({ ...diagnostico, success: false });
    }

    if (!envVars.SENDGRID_API_KEY) {
      log('❌ CRÍTICO: SENDGRID_API_KEY no configurada', 'error');
      return NextResponse.json({ ...diagnostico, success: false });
    }

    // 2. PROBAR BÚSQUEDA DE MÉDICO
    log('👨‍⚕️ === PROBANDO BÚSQUEDA DE MÉDICO ===');
    const DOCTOR_TABLES = [envVars.AIRTABLE_DOCTORS_TABLE, 'Doctors', 'Médicos', 'Medicos', 'Doctor'].filter(Boolean);
    log(`🔧 Tablas a probar: ${DOCTOR_TABLES.join(', ')}`);

    let doctorData: any = null;
    let foundInTable = null;

    for (const tableName of DOCTOR_TABLES) {
      try {
        log(`🔍 Probando tabla: ${tableName}`);
        const response = await fetch(
          `https://api.airtable.com/v0/${envVars.AIRTABLE_BASE_ID}/${tableName}/${doctorId}`,
          { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } }
        );

        const responseText = await response.text();
        
        if (response.ok) {
          doctorData = JSON.parse(responseText);
          foundInTable = tableName;
          log(`✅ Médico encontrado en tabla: ${tableName}`, 'info');
          log(`📋 Nombre: ${doctorData.fields?.Name || 'N/A'}`, 'info');
          log(`📧 Email: ${doctorData.fields?.Email || 'NO CONFIGURADO'}`, doctorData.fields?.Email ? 'info' : 'warning');
          log(`📱 WhatsApp: ${doctorData.fields?.WhatsApp || 'NO CONFIGURADO'}`, doctorData.fields?.WhatsApp ? 'info' : 'warning');
          break;
        } else {
          log(`❌ Error en tabla ${tableName} (${response.status}): ${responseText.substring(0, 100)}`, 'error');
        }
      } catch (error: any) {
        log(`❌ Excepción en tabla ${tableName}: ${error.message}`, 'error');
      }
    }

    if (!doctorData) {
      log('❌ CRÍTICO: No se pudo encontrar el médico en ninguna tabla', 'error');
      return NextResponse.json({ ...diagnostico, success: false });
    }

    // 3. PROBAR ENVÍO DE EMAIL
    if (doctorData.fields?.Email && envVars.SENDGRID_API_KEY) {
      log('📧 === PROBANDO SENDGRID EMAIL ===');
      try {
        const emailPayload = {
          personalizations: [{
            to: [{ email: doctorData.fields.Email }],
            subject: `🚨 TEST - Diagnóstico SobrecuposIA - ${new Date().toISOString()}`
          }],
          from: { 
            email: envVars.SENDGRID_FROM_EMAIL, 
            name: "SobrecuposIA Debug" 
          },
          content: [{
            type: "text/html",
            value: `<h1>Test de Diagnóstico</h1><p>Este es un email de prueba para verificar que SendGrid funciona correctamente.</p><p>Timestamp: ${new Date().toISOString()}</p>`
          }]
        };

        log('📧 Enviando email de prueba...', 'info');
        const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload)
        });

        const emailResponseText = await emailResponse.text();
        
        if (emailResponse.ok) {
          log('✅ Email enviado exitosamente via SendGrid', 'info');
          log(`📧 Response: ${emailResponseText || 'Sin contenido (normal)'}`, 'info');
        } else {
          log(`❌ SendGrid falló (${emailResponse.status}): ${emailResponseText}`, 'error');
        }
      } catch (error: any) {
        log(`❌ Error enviando email: ${error.message}`, 'error');
      }
    } else {
      log('⚠️ No se puede probar email: Email no configurado o SendGrid no disponible', 'warning');
    }

    // 4. PROBAR WHATSAPP
    if (doctorData.fields?.WhatsApp && envVars.TWILIO_ACCOUNT_SID) {
      log('📱 === PROBANDO WHATSAPP TWILIO ===');
      try {
        log('📱 Importando servicio WhatsApp...', 'info');
        const { default: whatsAppService } = await import('../../../lib/whatsapp-service.js');
        
        const testMessage = `🚨 TEST DIAGNÓSTICO
        
Dr/a. ${doctorData.fields.Name || 'Doctor'}

Este es un mensaje de prueba del sistema de diagnóstico de SobrecuposIA.

Timestamp: ${new Date().toISOString()}

Si recibes este mensaje, WhatsApp está funcionando correctamente.

_Sistema de Diagnóstico SobrecuposIA_`;

        log(`📱 Enviando WhatsApp de prueba a: ${doctorData.fields.WhatsApp}`, 'info');
        
        const whatsappResult = await whatsAppService.sendMessage(doctorData.fields.WhatsApp, testMessage);
        
        if (whatsappResult.success) {
          log('✅ WhatsApp enviado exitosamente', 'info');
          log(`📱 Message ID: ${whatsappResult.messageId}`, 'info');
          log(`📱 Status: ${whatsappResult.status}`, 'info');
        } else {
          log(`❌ WhatsApp falló: ${whatsappResult.error}`, 'error');
        }
      } catch (error: any) {
        log(`❌ Error crítico con WhatsApp: ${error.message}`, 'error');
        log(`❌ Stack: ${error.stack}`, 'error');
      }
    } else {
      log('⚠️ No se puede probar WhatsApp: WhatsApp no configurado o Twilio no disponible', 'warning');
    }

    // 5. RESULTADO FINAL
    const tieneErroresCriticos = diagnostico.errores.length > 0;
    diagnostico.success = !tieneErroresCriticos;
    
    log(`🎯 === DIAGNÓSTICO COMPLETADO ===`, 'info');
    log(`✅ Éxito: ${diagnostico.success}`, 'info');
    log(`❌ Errores: ${diagnostico.errores.length}`, diagnostico.errores.length > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${diagnostico.warnings.length}`, diagnostico.warnings.length > 0 ? 'warning' : 'info');

    diagnostico.resultadoFinal = {
      doctorEncontrado: !!doctorData,
      tablaEncontrada: foundInTable,
      datosDoctor: doctorData?.fields,
      variablesEntorno: envVars,
      resumen: `Diagnóstico ${diagnostico.success ? 'EXITOSO' : 'FALLIDO'}: ${diagnostico.errores.length} errores, ${diagnostico.warnings.length} warnings`
    };

    return NextResponse.json(diagnostico);

  } catch (error: any) {
    log(`❌ ERROR CRÍTICO DEL DIAGNÓSTICO: ${error.message}`, 'error');
    log(`❌ Stack completo: ${error.stack}`, 'error');
    
    return NextResponse.json({
      ...diagnostico,
      success: false,
      errorCritico: {
        mensaje: error.message,
        stack: error.stack
      }
    });
  }
}