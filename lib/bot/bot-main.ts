// Archivo principal del bot refactorizado - mantiene toda la inteligencia
import { NextResponse } from 'next/server';
import { BotResponse, BotSession } from './types';
import { 
  esSaludoSimple, 
  checkRateLimit, 
  filterFutureDates 
} from './utils';
import { sessionManager } from './services/session-manager';
import { airtableService } from './services/airtable-service';
import { medicalIntelligence } from './services/medical-intelligence';
import { appointmentService } from './services/appointment-service';

// Importar stages
import { handleNameStage } from './stages/name-stage';
import { handleRutStage } from './stages/rut-stage';
import { handleAgeStage } from './stages/age-stage';
import { handleOptionsStage } from './stages/options-stage';
import { handlePhoneStage } from './stages/phone-stage';
import { handleEmailStage } from './stages/email-stage';
import { handlePendingPaymentStage, handlePaymentCompletedStage } from './stages/payment-stage';

export class SobrecuposBot {
  
  async processMessage(message: string, sessionId: string): Promise<NextResponse> {
    const from = sessionId;
    const text = message.trim();

    console.log(`📱 Mensaje recibido: "${text}"`);

    // Rate limiting básico
    if (!checkRateLimit(from)) {
      return NextResponse.json({
        text: "Has enviado muchos mensajes muy rápido. Por favor espera un momento antes de continuar."
      }, { status: 429 });
    }

    // Obtener sesión actual
    const currentSession = sessionManager.getSession(from);
    console.log(`🔍 Sesión actual: ${currentSession ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`🔍 Stage actual: ${currentSession?.stage || 'undefined'}`);
    console.log(`🔍 SessionId usado: ${from}`);
    console.log(`🔍 Total sesiones en memoria: ${(sessionManager as any).sessions?.size || 0}`);

    try {
      // Si hay sesión activa, verificar compatibilidad de contexto antes de procesar
      if (currentSession?.stage) {
        console.log(`🎯 Procesando stage: ${currentSession.stage} con texto: "${text}"`);
        
        // DETECCIÓN INTELIGENTE: Si usuario envía síntomas/especialidades en stages inapropiados, resetear
        const isNewHealthQuery = this.detectsNewHealthQuery(text);
        const isInappropriateStage = ['getting-rut', 'getting-age', 'getting-phone', 'getting-email'].includes(currentSession.stage);
        
        if (isNewHealthQuery && isInappropriateStage) {
          console.log(`🔄 SMART RESET: Usuario envió nueva consulta médica en stage ${currentSession.stage}, reseteando sesión`);
          console.log(`📋 Texto detectado como nueva consulta: "${text}"`);
          
          // Eliminar sesión actual y procesar como mensaje inicial
          sessionManager.deleteSession(from);
          return NextResponse.json(await this.handleInitialMessage(text, from));
        }
        
        const response = await this.handleSessionStage(text, from, currentSession);
        console.log(`📤 Response del stage:`, response ? 'EXISTE' : 'NULL');
        if (response) {
          return NextResponse.json(response);
        }
        console.log(`❌ Response fue null, continuando a handleInitialMessage`);
      }

      // Sin sesión o stage no manejado - procesar mensaje inicial
      console.log(`🔄 Procesando mensaje inicial para: "${text}"`);
      return NextResponse.json(await this.handleInitialMessage(text, from));

    } catch (error) {
      console.error('❌ Error en bot route:', error);
      return NextResponse.json(
        { text: "Lo siento, hubo un error interno. Por favor, intenta nuevamente." },
        { status: 500 }
      );
    }
  }

  // Manejar stages de sesión activa
  private async handleSessionStage(
    text: string, 
    sessionId: string, 
    currentSession: BotSession
  ): Promise<BotResponse | null> {
    
    switch (currentSession.stage) {
      case 'getting-name':
        return handleNameStage(text, sessionId, currentSession);
        
      case 'getting-rut':
        return handleRutStage(text, sessionId, currentSession);
        
      case 'getting-age':
        return await handleAgeStage(text, sessionId, currentSession);

      case 'choosing-from-options':
        return await handleOptionsStage(text, sessionId, currentSession);
        
      case 'getting-phone':
        return handlePhoneStage(text, sessionId, currentSession);
        
      case 'getting-email':
        return handleEmailStage(text, sessionId, currentSession);
        
      case 'pending-payment':
        return await handlePendingPaymentStage(text, sessionId, currentSession);
        
      case 'payment-completed':
        return await handlePaymentCompletedStage(text, sessionId, currentSession);

      case 'asking-for-contact-data':
        return this.handleContactDataStage(text, sessionId, currentSession);

      // TODO: Implementar stages restantes si es necesario
      case 'confirming-appointment':
      case 'completed':
        return this.handleLegacyStage(text, sessionId, currentSession);
        
      default:
        console.warn(`⚠️ Stage no implementado: ${currentSession.stage}`);
        return null;
    }
  }

  // Manejador temporal para stages no migrados aún
  private handleLegacyStage(
    text: string, 
    sessionId: string, 
    currentSession: BotSession
  ): BotResponse {
    // Por ahora redirigir al bot original
    return {
      text: `Stage ${currentSession.stage} aún no migrado. Reiniciando conversación.`,
      session: sessionManager.resetSession(sessionId)
    };
  }

  // Manejar stage de solicitud de datos de contacto
  private handleContactDataStage(
    text: string,
    sessionId: string,
    currentSession: BotSession
  ): BotResponse {
    const respuestaContacto = text.toLowerCase().trim();
    const specialty = currentSession.specialty;
    
    if (/\b(sí|si|s|yes|ok|vale|claro|perfecto)\b/i.test(respuestaContacto)) {
      // Usuario quiere que tomemos sus datos - transicionar a getting-name
      const updatedSession = sessionManager.transitionToStage(sessionId, 'getting-name', {
        specialty: specialty,
        // Mantener otros datos importantes de la sesión
        motivo: currentSession.motivo,
        respuestaEmpatica: currentSession.respuestaEmpatica
      });

      if (!updatedSession) {
        return {
          text: "Hubo un error procesando tu solicitud. Por favor intenta nuevamente.",
          session: currentSession
        };
      }

      return {
        text: `Perfecto. Para avisarte cuando haya sobrecupos de **${specialty}** disponibles, necesito que me compartas tu nombre completo.`,
        session: updatedSession
      };
    } else {
      // Usuario no quiere que tomemos sus datos - finalizar conversación
      sessionManager.deleteSession(sessionId);
      return {
        text: `Entendido. ¡Que te mejores pronto! Si necesitas ayuda médica en el futuro, no dudes en contactarme. 🏥`
      };
    }
  }

  // Procesar mensaje inicial (sin sesión activa)
  private async handleInitialMessage(text: string, sessionId: string): Promise<BotResponse> {
    
    // Saludo simple - respuesta inicial
    if (esSaludoSimple(text)) {
      return {
        text: "¡Hola! 😊 Soy Sobrecupos IA, tu asistente médico personal.\n\n¿En qué te puedo ayudar? Cuéntame tus síntomas, el médico o especialidad que buscas y te ayudo a encontrar una hora disponible."
      };
    }

    // Detectar especialidad directa primero
    const especialidadDirecta = medicalIntelligence.detectarEspecialidadDirecta(text);
    
    if (especialidadDirecta) {
      return await this.handleDirectSpecialty(text, sessionId, especialidadDirecta);
    }

    // Evaluar síntomas
    const especialidadPorSintomas = medicalIntelligence.evaluarSintomas(text);
    
    if (especialidadPorSintomas) {
      return await this.handleSymptomBasedSpecialty(text, sessionId, especialidadPorSintomas);
    }

    // Usar OpenAI para casos complejos
    return await this.handleWithAI(text, sessionId);
  }

  // Manejar especialidad detectada directamente
  private async handleDirectSpecialty(
    text: string, 
    sessionId: string, 
    specialty: string
  ): Promise<BotResponse> {
    
    try {
      const especialidadesDisponibles = await airtableService.getAvailableSpecialties();
      
      if (!especialidadesDisponibles.includes(specialty)) {
        return {
          text: `Entiendo que estás buscando atención especializada.\n\nLamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n¿Te gustaría que te contacte cuando tengamos ${specialty} disponible?`
        };
      }
      
      // Verificar disponibilidad antes de pedir datos
      const sobrecuposDisponibles = await airtableService.fetchSobrecuposBySpecialty(specialty);
      const sobrecuposFuturos = filterFutureDates(sobrecuposDisponibles);
      
      if (sobrecuposFuturos.length === 0) {
        // No hay sobrecupos disponibles - ofrecer contacto
        const respuestaEmpatica = await medicalIntelligence.generateEmphaticResponse(
          text, "Entiendo que necesitas atención especializada."
        );
        
        const session = sessionManager.createSession(sessionId, 'asking-for-contact-data', {
          specialty: specialty,
          motivo: text,
          respuestaEmpatica: respuestaEmpatica
        });
        
        console.log(`🔧 Sesión creada para ${sessionId} en asking-for-contact-data:`, {
          stage: session.stage,
          specialty: session.specialty,
          sessionId: sessionId
        });
        
        return {
          text: `${respuestaEmpatica}\n\nPor lo que me describes, necesitas ver ${specialty}, pero lamentablemente no tengo sobrecupos disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`,
          session: session
        };
      }
      
      // HAY sobrecupos disponibles - PRIMERO pedir datos del paciente
      const respuestaEmpatica = await medicalIntelligence.generateEmphaticResponse(
        text, "Entiendo que necesitas atención especializada."
      );
      
      // Crear sesión para pedir datos del paciente
      const session = sessionManager.createSession(sessionId, 'getting-name', {
        specialty: specialty,
        records: sobrecuposFuturos,
        motivo: text,
        respuestaEmpatica: respuestaEmpatica
      });
      
      return {
        text: `${respuestaEmpatica}\n\n✅ Para lo que me describes, te recomiendo ver **${specialty}** como primera opción.\n\n¡Perfecto! Tengo sobrecupos disponibles de **${specialty}**.\n\nPara continuar, necesito algunos datos:\n\n**¿Cuál es tu nombre completo?**`,
        session: session
      };
      
    } catch (error) {
      console.error('❌ Error verificando sobrecupos para especialidad directa:', error);
      
      return {
        text: `Por lo que me describes, te recomiendo ver **${specialty}**.\n\nEn este momento estoy verificando la disponibilidad. ¿Te gustaría que tome tus datos para contactarte con las opciones disponibles?`
      };
    }
  }

  // Manejar especialidad basada en síntomas
  private async handleSymptomBasedSpecialty(
    text: string, 
    sessionId: string, 
    specialty: string
  ): Promise<BotResponse> {
    
    const alternativa = medicalIntelligence.detectarEspecialidadAlternativa(text);
    console.log(`🎯 Especialidad principal detectada: ${specialty}`);
    console.log(`🔄 Especialidad alternativa detectada: ${alternativa}`);
    
    try {
      console.log(`🔍 [DEBUG] Buscando sobrecupos para especialidad principal: ${specialty} y alternativa: ${alternativa}`);
      
      // Verificar variables de entorno críticas
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_ID) {
        console.error("❌ Variables de entorno críticas faltantes");
        return {
          text: `Por lo que me describes, te recomiendo ver primero **${specialty}**${alternativa ? `, o si prefieres un especialista, **${alternativa}**` : ''}.\n\nEn este momento estoy actualizando mi sistema de sobrecupos para ofrecerte las mejores opciones disponibles.\n\n¿Te gustaría que tome tus datos para contactarte apenas tenga nuevas opciones disponibles?`
        };
      }
      
      const sobrecuposRecords = await airtableService.fetchAllSobrecupos();
      console.log(`🔍 [DEBUG] Total records from Airtable: ${sobrecuposRecords.length}`);
      
      // Filtrar por especialidad principal
      const availableFiltered = sobrecuposRecords.filter(record => {
        const fields = record.fields || {};
        return fields.Especialidad === specialty && 
               airtableService.normalizeBoolean(fields.Disponible);
      });
      console.log(`🔍 [DEBUG] Filtered by specialty principal "${specialty}": ${availableFiltered.length} records`);

      // Filtrar por especialidad alternativa si existe
      let availableAlternativa: any[] = [];
      if (alternativa) {
        availableAlternativa = sobrecuposRecords.filter(record => {
          const fields = record.fields || {};
          return fields.Especialidad === alternativa && 
                 airtableService.normalizeBoolean(fields.Disponible);
        });
        console.log(`🔍 [DEBUG] Filtered by specialty alternativa "${alternativa}": ${availableAlternativa.length} records`);
      }

      // Filtrar solo fechas futuras para ambas especialidades
      const available = filterFutureDates(availableFiltered);
      const availableAlt = alternativa ? filterFutureDates(availableAlternativa) : [];
      console.log(`🔍 [DEBUG] Future dates - Principal: ${available.length}, Alternativa: ${availableAlt.length}`);

      // Generar respuesta empática
      const respuestaEmpatica = await medicalIntelligence.generateEmphaticResponse(
        text, "Entiendo tu preocupación."
      );

      // Lógica de respuesta según disponibilidad
      if (available.length > 0) {
        return await this.handleAvailableSpecialty(
          text, sessionId, specialty, available, respuestaEmpatica, alternativa, availableAlt
        );
      } else if (alternativa && availableAlt.length > 0) {
        return await this.handleAlternativeSpecialty(
          text, sessionId, specialty, alternativa, availableAlt, respuestaEmpatica
        );
      } else {
        return await this.handleNoAvailability(
          text, sessionId, specialty, respuestaEmpatica, alternativa
        );
      }
      
    } catch (error) {
      console.error('❌ Error buscando sobrecupos en flujo de síntomas:', error);
      return {
        text: `Por lo que me describes, te recomiendo ver **${specialty}**.\n\nEn este momento estoy verificando la disponibilidad. ¿Te gustaría que tome tus datos para contactarte con las opciones disponibles?`
      };
    }
  }

  // Manejar disponibilidad en especialidad principal
  private async handleAvailableSpecialty(
    text: string,
    sessionId: string,
    specialty: string,
    available: any[],
    respuestaEmpatica: string,
    alternativa?: string | null,
    availableAlt?: any[]
  ): Promise<BotResponse> {
    
    // Mensaje diferenciado según si hay alternativas
    let mensajeOpciones = `Para lo que me describes, te recomiendo ver **${specialty}** como primera opción.`;
    if (alternativa && availableAlt && availableAlt.length > 0) {
      mensajeOpciones += ` También tengo disponibilidad en **${alternativa}** si prefieres un especialista.`;
    } else if (alternativa) {
      mensajeOpciones += ` Si prefieres un especialista en **${alternativa}**, puedo contactarte cuando haya disponibilidad.`;
    }

    // Crear sesión para pedir datos del paciente
    const session = sessionManager.createSession(sessionId, 'getting-name', {
      specialty,
      records: available,
      motivo: text,
      respuestaEmpatica,
      alternativeSpecialty: alternativa,
      alternativeRecords: availableAlt
    });

    return {
      text: `${respuestaEmpatica}\n\n✅ ${mensajeOpciones}\n\n¡Perfecto! Tengo sobrecupos disponibles de **${specialty}**.\n\nPara continuar, necesito algunos datos:\n\n**¿Cuál es tu nombre completo?**`,
      session: session
    };
  }

  // Manejar especialidad alternativa disponible
  private async handleAlternativeSpecialty(
    text: string,
    sessionId: string,
    specialty: string,
    alternativa: string,
    availableAlt: any[],
    respuestaEmpatica: string
  ): Promise<BotResponse> {
    
    const selectedOptions = appointmentService.selectSmartAppointmentOptions(availableAlt);
    const presentation = await appointmentService.createOptionsPresentation(selectedOptions, alternativa);
    
    const session = sessionManager.createSession(sessionId, presentation.stage, {
      specialty: alternativa,
      records: availableAlt,
      motivo: text,
      respuestaEmpatica,
      selectedOptions,
      originalSpecialty: specialty,
      ...(presentation.stage === 'confirming-appointment' && { 
        doctorInfo: presentation.doctorInfo, 
        selectedRecord: selectedOptions[0] 
      })
    });

    return {
      text: `${respuestaEmpatica}\n\nPara lo que me describes, lo ideal sería **${specialty}**, pero no tengo disponibilidad en este momento.\n\n✅ Como alternativa, tengo sobrecupos disponibles de **${alternativa}**:\n\n${presentation.text}\n\n¿Te interesa alguna de estas opciones, o prefieres que te contacte cuando tenga disponibilidad de ${specialty}?`,
      session: session
    };
  }

  // Manejar cuando no hay disponibilidad
  private async handleNoAvailability(
    text: string,
    sessionId: string,
    specialty: string,
    respuestaEmpatica: string,
    alternativa?: string | null
  ): Promise<BotResponse> {
    
    const session = sessionManager.createSession(sessionId, 'asking-for-contact-data', {
      specialty: specialty,
      motivo: text,
      alternativeSpecialty: alternativa
    });

    let mensaje = `${respuestaEmpatica}\n\nPara lo que me describes, te recomiendo ver **${specialty}**`;
    if (alternativa) {
      mensaje += ` o **${alternativa}**`;
    }
    mensaje += `, pero lamentablemente no tengo sobrecupos disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`;

    return {
      text: mensaje,
      session: session
    };
  }

  // Usar OpenAI para casos complejos
  private async handleWithAI(text: string, sessionId: string): Promise<BotResponse> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return {
        text: "Para ayudarte mejor, ¿podrías contarme qué tipo de especialista necesitas o qué síntomas tienes?\n\nPor ejemplo:\n• \"Necesito un oftalmólogo\"\n• \"Tengo dolor de cabeza\"\n• \"Me duele el pecho\""
      };
    }

    try {
      // Evaluar si es consulta médica
      const isMedical = await medicalIntelligence.evaluateIfMedicalQuery(text);
      
      if (!isMedical) {
        // Generar respuesta empática y conversacional
        return await this.generateEmpathicNonMedicalResponse(text);
      }

      // Detectar especialidad con IA
      const especialidadesDisponibles = await airtableService.getAvailableSpecialties();
      const specialty = await medicalIntelligence.detectSpecialtyWithAI(text, especialidadesDisponibles);
      
      if (specialty && specialty !== "Medicina Familiar") {
        return await this.handleDirectSpecialty(text, sessionId, specialty);
      }

      // Fallback a medicina familiar
      return await this.handleDirectSpecialty(text, sessionId, "Medicina Familiar");
      
    } catch (error) {
      console.error('❌ Error en flujo OpenAI:', error);
      return {
        text: "Para ayudarte mejor, ¿podrías contarme qué tipo de especialista necesitas o qué síntomas tienes?\n\nPor ejemplo:\n• \"Necesito un oftalmólogo\"\n• \"Tengo dolor de cabeza\"\n• \"Me duele el pecho\""
      };
    }
  }

  // Generar respuesta empática para consultas no médicas
  private async generateEmpathicNonMedicalResponse(text: string): Promise<BotResponse> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return {
        text: "¡Hola! Soy especialista en ayudarte con consultas médicas y encontrar sobrecupos.\n\n¿Qué síntomas tienes o qué tipo de especialista necesitas?"
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.8,
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: "Eres Sobrecupos IA, un asistente médico amigable y empático. El usuario escribió algo que NO es una consulta médica. Responde de manera empática reconociendo lo que dijeron, luego SIEMPRE encausa la conversación hacia consultas médicas preguntando específicamente sobre: síntomas, problemas de salud, especialistas que necesita, o si requiere sobrecupos médicos. Usa emojis apropiados. Máximo 2-3 líneas. La transición debe ser natural pero directa hacia temas médicos."
            },
            {
              role: "user", 
              content: `El usuario escribió: "${text}"`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI request failed');
      }

      const data = await response.json();
      const empathicResponse = data.choices?.[0]?.message?.content?.trim();

      if (empathicResponse) {
        return {
          text: empathicResponse
        };
      }

      // Fallback si no hay respuesta de OpenAI
      return this.getFallbackEmpathicResponse(text);

    } catch (error) {
      console.error('❌ Error generando respuesta empática:', error);
      return this.getFallbackEmpathicResponse(text);
    }
  }

  // Respuestas empáticas de fallback sin OpenAI
  private getFallbackEmpathicResponse(text: string): BotResponse {
    const lowerText = text.toLowerCase();
    
    // Respuestas contextuales específicas - SIEMPRE encausar a consultas médicas
    if (lowerText.includes('pizza')) {
      return {
        text: "¡Mmm, pizza! 🍕 Espero que sea deliciosa. Cambiando de tema, soy tu asistente médico y estoy aquí para ayudarte con sobrecupos. ¿Tienes algún síntoma que te preocupe o necesitas algún especialista médico? 😊"
      };
    }
    
    if (lowerText.includes('uber') || lowerText.includes('taxi')) {
      return {
        text: "¡Espero que tengas un buen viaje! 🚗 Mientras tanto, soy Sobrecupos IA y puedo ayudarte con citas médicas. ¿Hay algún problema de salud que tengas o algún especialista que necesites ver? 😊"
      };
    }
    
    if (lowerText.includes('ropa') || lowerText.includes('comprar')) {
      return {
        text: "¡Qué bueno ir de compras! 🛍️ Hablando de cuidarse, soy tu asistente médico personal. ¿Tienes algún síntoma o problema de salud? ¿Necesitas conseguir una cita con algún especialista? 😊"
      };
    }
    
    if (lowerText.includes('clima') || lowerText.includes('tiempo')) {
      return {
        text: "¡El clima es importante para nuestro bienestar! ☀️ Hablando de salud, ¿cómo te has sentido últimamente? ¿Tienes algún síntoma o necesitas ver algún especialista médico? Puedo ayudarte a encontrar sobrecupos disponibles. 😊"
      };
    }
    
    // Respuesta genérica empática - SIEMPRE hacia consultas médicas
    return {
      text: "¡Entiendo! 😊 Soy Sobrecupos IA, tu asistente médico personal. Mi especialidad es ayudarte a encontrar citas médicas disponibles. ¿Tienes algún síntoma que te preocupe, algún problema de salud, o necesitas ver algún especialista? ✨"
    };
  }

  // Detectar si el usuario está enviando una nueva consulta médica
  private detectsNewHealthQuery(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();
    
    // Patrones de síntomas comunes
    const symptomPatterns = [
      // Síntomas visuales
      /\b(veo borroso|visión borrosa|no veo bien|vista borrosa|ojos|veo mal|visión)\b/,
      // Dolor
      /\b(duele|dolor|dolores|duelo|molestia)\b/,
      // Síntomas generales
      /\b(pican|picazón|me pica|arde|ardor|hinchazón|inflamado|sangra|sangrado)\b/,
      // Problemas específicos
      /\b(tos|fiebre|mareo|náusea|diarrea|estreñimiento|presión alta|diabetes)\b/,
      // Partes del cuerpo
      /\b(cabeza|cuello|espalda|brazos|piernas|pecho|estómago|barriga|corazón|pulmones)\b/,
    ];
    
    // Patrones de especialidades
    const specialtyPatterns = [
      /\b(cardiólogo|oftalmólogo|ginecólogo|pediatra|dermatólogo|neurólogo|psiquiatra)\b/,
      /\b(cardiología|oftalmología|ginecología|pediatría|dermatología|neurología|psiquiatría)\b/,
      /\b(necesito|busco|quiero|tengo que ver)\s+(un|una)?\s*(médico|doctor|especialista)\b/,
    ];
    
    // Verificar patrones
    const hasSymptoms = symptomPatterns.some(pattern => pattern.test(normalizedText));
    const hasSpecialty = specialtyPatterns.some(pattern => pattern.test(normalizedText));
    
    return hasSymptoms || hasSpecialty;
  }
}

// Instancia singleton del bot
export const sobrecuposBot = new SobrecuposBot();