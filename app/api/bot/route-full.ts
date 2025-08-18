// app/api/bot/route-new.ts - Orquestador principal TypeScript modular
import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from './core/session-manager';
import { SymptomAnalyzer } from './core/symptom-analyzer';
import { EmpathyEngine } from './ai/empathy-engine';
import { SobrecuposService } from './airtable/sobrecupos-service';
import { MedicalValidators } from './validators/medical-validators';
import { 
  BotResponse, 
  SessionData, 
  SessionStage, 
  MedicalContext, 
  EmotionalState, 
  UrgencyLevel 
} from '../../../types/medical';

interface RequestBody {
  message: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar limpieza de sesiones
    SessionManager.initCleanup();

    const body = await request.json() as RequestBody;
    const { message, sessionId } = body;

    // Validar entrada
    const inputValidation = MedicalValidators.validateUserInput(message);
    if (!inputValidation.isSafe) {
      return NextResponse.json({
        text: "Disculpa, no puedo procesar ese mensaje. Por favor, describe tu consulta médica de forma clara.",
        error: "Input validation failed"
      }, { status: 400 });
    }

    const sanitizedMessage = inputValidation.sanitized;

    // Obtener o crear sesión
    const session = SessionManager.getOrCreateSession(sessionId);
    SessionManager.addMessage(session.id, sanitizedMessage);

    // Procesar mensaje y generar respuesta
    const response = await processMessage(sanitizedMessage, session);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en chatbot:', error);
    return NextResponse.json({
      text: "Lo siento, ha ocurrido un error. Por favor, intenta nuevamente o contacta con soporte médico directamente.",
      error: "Internal server error"
    }, { status: 500 });
  }
}

async function processMessage(message: string, session: SessionData): Promise<BotResponse> {
  try {
    // Analizar mensaje
    const analysis = SymptomAnalyzer.analyzeMessage(message);
    
    // Actualizar contexto médico si se encuentra
    if (analysis.medicalContext) {
      SessionManager.updateSession(session.id, {
        medicalContext: analysis.medicalContext
      });
    }

    // Enrutamiento basado en análisis y etapa de sesión
    switch (session.stage) {
      case 'welcome':
        return await handleWelcomeStage(message, session, analysis);
      
      case 'symptom_analysis':
        return await handleSymptomAnalysis(message, session, analysis);
      
      case 'specialty_selection':
        return await handleSpecialtySelection(message, session, analysis);
      
      case 'options_presentation':
        return await handleOptionsPresentation(message, session, analysis);
      
      case 'appointment_confirmation':
        return await handleOptionsPresentation(message, session, analysis);
      
      case 'data_collection':
        return await handleDataCollection(message, session, analysis);
      
      case 'final_confirmation':
        return await handleFinalConfirmation(message, session, analysis);
      
      default:
        return await handleWelcomeStage(message, session, analysis);
    }

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    return {
      text: "Disculpa, hubo un problema procesando tu mensaje. ¿Podrías repetir tu consulta?",
      session: SessionManager.incrementAttempts(session.id),
      metadata: {
        confidence: 0,
        nextStage: session.stage
      }
    };
  }
}

async function handleWelcomeStage(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  // Saludo inicial
  if (analysis.isGreeting) {
    const updatedSession = SessionManager.setStage(session.id, 'symptom_analysis');
    
    return {
      text: "Hola! Soy Sobrecupos IA. ¿En qué puedo ayudarte hoy? Puedes contarme qué síntomas tienes o qué especialista necesitas.",
      session: updatedSession,
      metadata: {
        confidence: 1,
        nextStage: 'symptom_analysis'
      }
    };
  }

  // Si no es saludo, proceder directamente al análisis
  return await handleSymptomAnalysis(message, session, analysis);
}

async function handleSymptomAnalysis(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  // Búsqueda de médico específico
  if (analysis.isSpecificDoctor && analysis.doctorName) {
    return await searchSpecificDoctor(analysis.doctorName, message, session);
  }

  // Análisis médico general
  if (analysis.isMedical && analysis.medicalContext) {
    const medicalContext = analysis.medicalContext;
    
    // Generar respuesta empática si es necesaria
    let empathicResponse = "";
    if (medicalContext.psychProfile) {
      const empathyContext = EmpathyEngine.createContext(
        medicalContext.psychProfile.emotionalState,
        medicalContext.psychProfile.urgencyLevel,
        medicalContext.psychProfile,
        medicalContext.symptoms
      );

      if (EmpathyEngine.needsEmpathy(empathyContext)) {
        empathicResponse = await EmpathyEngine.generateEmpathicResponse(
          message, 
          empathyContext,
          "Entiendo tu preocupación. Te ayudo a encontrar la atención médica que necesitas."
        ) + "\n\n";
      }
    }

    // Buscar especialistas según el análisis
    const sobrecupos = await SobrecuposService.buscarPorEspecialidad(medicalContext.recommendedSpecialty);
    
    if (sobrecupos.length > 0) {
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'specialty_selection',
        conversationState: {
          ...session.conversationState,
          motivo: message,
          specialty: medicalContext.recommendedSpecialty
        },
        appointmentData: {
          alternativeRecords: sobrecupos.slice(0, 5)
        }
      });

      const optionsList = formatSobrecuposOptions(sobrecupos.slice(0, 3));
      
      return {
        text: `${empathicResponse}Basándome en lo que me cuentas, te recomiendo **${medicalContext.recommendedSpecialty}**.\n\nEncontré estas opciones disponibles:\n\n${optionsList}\n\n¿Te interesa alguna de estas opciones? Responde con el número correspondiente.`,
        session: updatedSession,
        metadata: {
          confidence: medicalContext.confidence,
          specialty: medicalContext.recommendedSpecialty,
          nextStage: 'specialty_selection',
          empathyGenerated: empathicResponse.length > 0
        }
      };
    } else {
      // No se encontraron sobrecupos para esa especialidad
      const updatedSession = SessionManager.setStage(session.id, 'specialty_selection');
      
      return {
        text: `${empathicResponse}Entiendo que necesitas atención en **${medicalContext.recommendedSpecialty}**. En este momento no tengo sobrecupos disponibles para esa especialidad, pero puedo ayudarte de otras formas:\n\n• Buscar en otras especialidades relacionadas\n• Notificarte cuando haya disponibilidad\n• Recomendarte centros médicos cercanos\n\n¿Qué prefieres?`,
        session: updatedSession,
        metadata: {
          confidence: medicalContext.confidence,
          specialty: medicalContext.recommendedSpecialty,
          nextStage: 'specialty_selection'
        }
      };
    }
  }

  // Mensaje no médico o no entendido
  SessionManager.incrementAttempts(session.id);
  
  return {
    text: "Para poder ayudarte mejor, necesito que me cuentes:\n\n• ¿Qué síntomas tienes?\n• ¿Qué especialista necesitas?\n• ¿Es urgente tu consulta?\n\nPor ejemplo: 'Tengo dolor de cabeza fuerte desde ayer' o 'Necesito un cardiólogo'",
    session: SessionManager.getSession(session.id)!,
    metadata: {
      confidence: 0.3,
      nextStage: 'symptom_analysis'
    }
  };
}

async function searchSpecificDoctor(doctorName: string, motivo: string, session: SessionData): Promise<BotResponse> {
  try {
    const sobrecupos = await SobrecuposService.buscarPorMedico(doctorName);
    
    if (sobrecupos.length > 0) {
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'options_presentation',
        conversationState: {
          ...session.conversationState,
          motivo
        },
        appointmentData: {
          alternativeRecords: sobrecupos
        }
      });

      const optionsList = formatSobrecuposOptions(sobrecupos.slice(0, 3));
      
      return {
        text: `¡Perfecto! Encontré disponibilidad para **${doctorName}**:\n\n${optionsList}\n\n¿Te interesa alguna de estas opciones? Responde con el número correspondiente.`,
        session: updatedSession,
        metadata: {
          confidence: 0.9,
          nextStage: 'options_presentation'
        }
      };
    } else {
      return {
        text: `No encontré disponibilidad para **${doctorName}** en este momento. \n\n¿Te gustaría que:\n• Busque otros especialistas de la misma área\n• Te notifique si se libera un cupo\n• Te recomiende alternativas similares\n\n¿Qué prefieres?`,
        session: SessionManager.setStage(session.id, 'specialty_selection'),
        metadata: {
          confidence: 0.8,
          nextStage: 'specialty_selection'
        }
      };
    }
  } catch (error) {
    console.error('❌ Error buscando médico específico:', error);
    return {
      text: `Hubo un problema buscando al Dr. ${doctorName}. ¿Podrías contarme qué especialidad necesitas para ayudarte de otra forma?`,
      session: SessionManager.setStage(session.id, 'symptom_analysis'),
      metadata: {
        confidence: 0.5,
        nextStage: 'symptom_analysis'
      }
    };
  }
}

async function handleSpecialtySelection(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  // Implementación de selección de especialidad
  const numberMatch = message.match(/(\d+)/);
  
  if (numberMatch && session.appointmentData?.alternativeRecords) {
    const selectedIndex = parseInt(numberMatch[1]) - 1;
    const selectedRecord = session.appointmentData.alternativeRecords[selectedIndex];
    
    if (selectedRecord) {
      return await presentSelectedOption(selectedRecord, session);
    }
  }
  
  // Si no se entiende la selección
  return {
    text: "Por favor, responde con el número de la opción que te interesa (1, 2, 3, etc.) o dime 'ninguna' si prefieres otras alternativas.",
    session,
    metadata: {
      confidence: 0.4,
      nextStage: 'specialty_selection'
    }
  };
}

async function handleOptionsPresentation(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  // Manejo de confirmación de opción seleccionada
  if (message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') || 
      message.toLowerCase().includes('confirmo') || message.toLowerCase().includes('acepto')) {
    
    const updatedSession = SessionManager.setStage(session.id, 'data_collection');
    
    return {
      text: "¡Excelente! Para confirmar tu cita necesito algunos datos:\n\n• **Nombre completo**\n• **RUT**\n• **Teléfono de contacto**\n• **Email**\n\nPuedes enviarme toda la información junta o una por una.",
      session: updatedSession,
      metadata: {
        confidence: 0.9,
        nextStage: 'data_collection'
      }
    };
  }
  
  // Si no confirma, volver a opciones
  return {
    text: "Entiendo. ¿Te gustaría ver otras opciones disponibles o prefieres que busque en una especialidad diferente?",
    session: SessionManager.setStage(session.id, 'specialty_selection'),
    metadata: {
      confidence: 0.6,
      nextStage: 'specialty_selection'
    }
  };
}

async function handleDataCollection(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  // Extracción y validación de datos del paciente
  const patientData = extractPatientData(message);
  const validation = MedicalValidators.validatePatientData(patientData);
  
  if (validation.isValid && validation.sanitized) {
    const updatedSession = SessionManager.updateSession(session.id, {
      stage: 'final_confirmation',
      patientData: {
        ...session.patientData,
        ...validation.sanitized
      }
    });
    
    return {
      text: `Perfecto, he registrado tus datos:\n\n${formatPatientData(validation.sanitized)}\n\n¿Confirmas que todo está correcto? Si es así, procederé a reservar tu cita.`,
      session: updatedSession,
      metadata: {
        confidence: 0.95,
        nextStage: 'final_confirmation'
      }
    };
  } else {
    return {
      text: `Necesito completar algunos datos:\n\n${validation.errors.join('\n')}\n\nPor favor, proporciona la información faltante.`,
      session,
      metadata: {
        confidence: 0.5,
        nextStage: 'data_collection'
      }
    };
  }
}

async function handleFinalConfirmation(message: string, session: SessionData, analysis: any): Promise<BotResponse> {
  if (message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') || 
      message.toLowerCase().includes('confirmo')) {
    
    // Procesar reserva final
    return await processFinalReservation(session);
  } else {
    return {
      text: "¿Qué te gustaría modificar? Puedo actualizar cualquier dato antes de confirmar la reserva.",
      session: SessionManager.setStage(session.id, 'data_collection'),
      metadata: {
        confidence: 0.7,
        nextStage: 'data_collection'
      }
    };
  }
}

// Funciones auxiliares

function formatSobrecuposOptions(sobrecupos: any[]): string {
  return sobrecupos.map((record, index) => {
    const fields = record.fields;
    return `**${index + 1}.** Dr. ${fields.Medico}\n   📅 ${fields['Fecha y Hora']}\n   📍 ${fields.Comuna}\n   💰 $${fields['Precio Sobrecupo']?.toLocaleString() || 'No especificado'}`;
  }).join('\n\n');
}

async function presentSelectedOption(selectedRecord: any, session: SessionData): Promise<BotResponse> {
  const fields = selectedRecord.fields;
  const updatedSession = SessionManager.updateSession(session.id, {
    stage: 'appointment_confirmation',
    appointmentData: {
      ...session.appointmentData,
      selectedRecord,
      doctorInfo: {
        name: fields.Medico,
        specialty: fields.Especialidad,
        atiende: fields.Atiende
      }
    }
  });

  return {
    text: `Has seleccionado:\n\n🩺 **Dr. ${fields.Medico}**\n📋 ${fields.Especialidad}\n📅 ${fields['Fecha y Hora']}\n📍 ${fields.Comuna} - ${fields.Ubicacion}\n💰 $${fields['Precio Sobrecupo']?.toLocaleString()}\n\n¿Confirmas esta opción?`,
    session: updatedSession,
    metadata: {
      confidence: 0.9,
      nextStage: 'appointment_confirmation'
    }
  };
}

function extractPatientData(message: string): any {
  // Implementación simple de extracción de datos
  // En producción, esto sería más sofisticado
  const data: any = {};
  
  // Extraer email
  const emailMatch = message.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  if (emailMatch) data.email = emailMatch[0];
  
  // Extraer teléfono
  const phoneMatch = message.match(/[\+]?[\d\s\-\(\)]{8,}/);
  if (phoneMatch) data.phone = phoneMatch[0];
  
  // Extraer RUT (simplificado)
  const rutMatch = message.match(/\d{7,8}-[\dkK]/);
  if (rutMatch) data.rut = rutMatch[0];
  
  return data;
}

function formatPatientData(data: any): string {
  const formatted: string[] = [];
  if (data.name) formatted.push(`👤 Nombre: ${data.name}`);
  if (data.rut) formatted.push(`🆔 RUT: ${data.rut}`);
  if (data.phone) formatted.push(`📱 Teléfono: ${data.phone}`);
  if (data.email) formatted.push(`📧 Email: ${data.email}`);
  return formatted.join('\n');
}

async function processFinalReservation(session: SessionData): Promise<BotResponse> {
  try {
    // Aquí se procesaría la reserva real
    // Por ahora, simulamos el éxito
    
    const doctorInfo = session.appointmentData?.doctorInfo;
    const selectedRecord = session.appointmentData?.selectedRecord;
    
    if (selectedRecord) {
      // Actualizar estado en Airtable
      await SobrecuposService.actualizarEstado(
        selectedRecord.id, 
        'Reservado', 
        session.conversationState.motivo
      );
    }
    
    return {
      text: `🎉 **¡Reserva confirmada!**\n\n📋 Tu cita con Dr. ${doctorInfo?.name} ha sido agendada exitosamente.\n\n📧 Recibirás la confirmación por email\n📱 Te contactaremos por WhatsApp para coordinar detalles\n\n¡Gracias por usar Sobrecupos IA! 😊`,
      session: SessionManager.updateSession(session.id, { stage: 'welcome' }),
      metadata: {
        confidence: 1,
        nextStage: 'welcome'
      }
    };
  } catch (error) {
    console.error('❌ Error procesando reserva final:', error);
    return {
      text: "Hubo un problema confirmando tu reserva. Por favor, contacta directamente con el centro médico o intenta nuevamente.",
      session,
      metadata: {
        confidence: 0.3,
        nextStage: 'final_confirmation'
      }
    };
  }
}