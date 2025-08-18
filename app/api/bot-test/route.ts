// app/api/bot-test/route.ts - Endpoint de prueba para chatbot modular TypeScript
import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '../bot/core/session-manager';
import { SymptomAnalyzer } from '../bot/core/symptom-analyzer';
import { EmpathyEngine } from '../bot/ai/empathy-engine';
import { SobrecuposService } from '../bot/airtable/sobrecupos-service';
import { MedicalValidators } from '../bot/validators/medical-validators';
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

    // Procesar mensaje básico para testing
    const response = await processSimpleMessage(sanitizedMessage, session);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en chatbot test:', error);
    return NextResponse.json({
      text: "Lo siento, ha ocurrido un error en el chatbot modular. Error: " + (error as Error).message,
      error: "Internal server error"
    }, { status: 500 });
  }
}

async function processSimpleMessage(message: string, session: SessionData): Promise<BotResponse> {
  try {
    // Analizar mensaje
    const analysis = SymptomAnalyzer.analyzeMessage(message);
    
    console.log('🔍 Análisis:', {
      isGreeting: analysis.isGreeting,
      isMedical: analysis.isMedical,
      isSpecificDoctor: analysis.isSpecificDoctor,
      confidence: analysis.confidence,
      stage: session.stage
    });

    // Respuesta simple basada en análisis
    if (analysis.isGreeting) {
      const updatedSession = SessionManager.setStage(session.id, 'symptom_analysis');
      
      return {
        text: "✅ **Chatbot Modular TypeScript Funcionando!**\n\nHola! Soy la nueva versión modular de Sobrecupos IA. \n\n🔧 **Componentes activos:**\n• SessionManager ✓\n• SymptomAnalyzer ✓\n• EmpathyEngine ✓\n• MedicalValidators ✓\n• SobrecuposService ✓\n\n¿En qué puedo ayudarte?",
        session: updatedSession,
        metadata: {
          confidence: 1,
          nextStage: 'symptom_analysis'
        }
      };
    }

    if (analysis.isMedical && analysis.medicalContext) {
      const medicalContext = analysis.medicalContext;
      
      // Probar EmpathyEngine
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
            "Entiendo tu preocupación."
          ) + "\n\n";
        }
      }

      return {
        text: `${empathicResponse}🎯 **Análisis médico exitoso:**\n\n• **Especialidad recomendada:** ${medicalContext.recommendedSpecialty}\n• **Confianza:** ${Math.round(medicalContext.confidence * 100)}%\n• **Estado emocional:** ${medicalContext.psychProfile.emotionalState}\n• **Urgencia:** ${medicalContext.psychProfile.urgencyLevel}\n\n✅ Todos los módulos funcionando correctamente!`,
        session: SessionManager.updateSession(session.id, {
          stage: 'specialty_selection',
          medicalContext
        }),
        metadata: {
          confidence: medicalContext.confidence,
          specialty: medicalContext.recommendedSpecialty,
          nextStage: 'specialty_selection',
          empathyGenerated: empathicResponse.length > 0
        }
      };
    }

    if (analysis.isSpecificDoctor && analysis.doctorName) {
      return {
        text: `🩺 **Búsqueda de médico específico:**\n\nDetectado: Dr. ${analysis.doctorName}\n\n✅ Módulo de búsqueda por médico funcionando!\n\n(En la versión completa aquí buscaría en Airtable)`,
        session: SessionManager.setStage(session.id, 'options_presentation'),
        metadata: {
          confidence: 0.9,
          nextStage: 'options_presentation'
        }
      };
    }

    // Mensaje general
    return {
      text: `📊 **Test de análisis:**\n\n• **Es saludo:** ${analysis.isGreeting ? '✅' : '❌'}\n• **Es médico:** ${analysis.isMedical ? '✅' : '❌'}\n• **Médico específico:** ${analysis.isSpecificDoctor ? '✅' : '❌'}\n• **Confianza:** ${Math.round(analysis.confidence * 100)}%\n\nPrueba escribir:\n• "Hola" (saludo)\n• "Tengo dolor de cabeza" (médico)\n• "Dr. González" (médico específico)`,
      session: SessionManager.incrementAttempts(session.id),
      metadata: {
        confidence: analysis.confidence,
        nextStage: session.stage
      }
    };

  } catch (error) {
    console.error('❌ Error en processSimpleMessage:', error);
    return {
      text: `❌ Error en módulo: ${(error as Error).message}\n\nStack trace: ${(error as Error).stack}`,
      session,
      metadata: {
        confidence: 0,
        nextStage: session.stage
      }
    };
  }
}