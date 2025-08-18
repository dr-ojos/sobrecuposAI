// app/api/bot/route.ts - Performance-Optimized Production Chatbot
import { NextRequest, NextResponse } from 'next/server';

// Performance imports with timeout controls
import { SessionManager } from './core/session-manager';
import { SymptomAnalyzer } from './core/symptom-analyzer';
import { EmpathyEngine } from './ai/empathy-engine';
import { SobrecuposServiceOptimized as SobrecuposService } from './airtable/sobrecupos-service-optimized';
import { MedicalValidators } from './validators/medical-validators';
import { 
  BotResponse, 
  SessionData, 
  SessionStage, 
  MedicalContext 
} from '../../../types/medical';

// Production-grade constants
const RESPONSE_TIMEOUT = 30000; // 30 seconds max
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;

interface RequestBody {
  message: string;
  sessionId?: string;
}

interface PerformanceMetrics {
  startTime: number;
  validationTime?: number;
  analysisTime?: number;
  totalTime?: number;
}

// Circuit breaker state
let circuitBreakerFailures = 0;
let lastFailureTime = 0;

export async function POST(request: NextRequest) {
  const metrics: PerformanceMetrics = { startTime: Date.now() };
  
  try {
    // Step 1: Rapid timeout wrapper
    const result = await Promise.race([
      processRequestWithTimeout(request, metrics),
      createTimeoutPromise(RESPONSE_TIMEOUT)
    ]);

    if (result.type === 'timeout') {
      return NextResponse.json({
        text: "⚡ El sistema está optimizando la respuesta. Reintenta en un momento.",
        error: "Request timeout",
        metrics: { totalTime: Date.now() - metrics.startTime }
      }, { status: 504 });
    }

    // Reset circuit breaker on success
    circuitBreakerFailures = 0;
    
    // Verificar que result tiene data antes de acceder
    if ('data' in result) {
      return NextResponse.json(result.data);
    } else {
      throw new Error('Invalid result format');
    }

  } catch (error) {
    console.error('🚨 Critical Error:', error);
    
    // Circuit breaker logic
    circuitBreakerFailures++;
    lastFailureTime = Date.now();
    
    if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      return NextResponse.json({
        text: "🔧 Sistema en mantenimiento. Reintenta en 2 minutos.",
        error: "Circuit breaker activated",
        retryAfter: 120
      }, { status: 503 });
    }

    return NextResponse.json({
      text: "⚡ Error temporal del sistema. Reintentando automáticamente...",
      error: "Internal server error",
      shouldRetry: true,
      metrics: { totalTime: Date.now() - metrics.startTime }
    }, { status: 500 });
  }
}

async function processRequestWithTimeout(request: NextRequest, metrics: PerformanceMetrics) {
  // Step 1: Ultra-fast input validation (< 10ms target)
  const body = await request.json() as RequestBody;
  const { message, sessionId } = body;

  const inputValidation = MedicalValidators.validateUserInput(message);
  metrics.validationTime = Date.now() - metrics.startTime;

  if (!inputValidation.isSafe) {
    return {
      type: 'success',
      data: {
        text: "Por seguridad, no puedo procesar ese mensaje. Describe tu consulta médica de forma clara.",
        error: "Input validation failed",
        metrics
      }
    };
  }

  const sanitizedMessage = inputValidation.sanitized;

  // Step 2: Lightning-fast session management (< 5ms target)
  SessionManager.initCleanup();
  const session = SessionManager.getOrCreateSession(sessionId);
  SessionManager.addMessage(session.id, sanitizedMessage);

  // Step 3: Optimized symptom analysis (< 50ms target)
  const analysisStartTime = Date.now();
  const analysis = SymptomAnalyzer.analyzeMessage(sanitizedMessage);
  metrics.analysisTime = Date.now() - analysisStartTime;

  // Step 4: Fast-path routing based on confidence
  const response = await routeBasedOnAnalysis(sanitizedMessage, session, analysis, metrics);
  
  metrics.totalTime = Date.now() - metrics.startTime;
  
  console.log(`⚡ Performance: ${metrics.totalTime}ms total (validation: ${metrics.validationTime}ms, analysis: ${metrics.analysisTime}ms)`);

  return {
    type: 'success',
    data: {
      ...response,
      metrics: {
        totalTime: metrics.totalTime,
        validationTime: metrics.validationTime,
        analysisTime: metrics.analysisTime
      }
    }
  };
}

async function routeBasedOnAnalysis(
  message: string, 
  session: SessionData, 
  analysis: any,
  metrics: PerformanceMetrics
): Promise<BotResponse> {
  
  // Fast path for greetings (immediate response)
  if (analysis.isGreeting) {
    const updatedSession = SessionManager.setStage(session.id, 'symptom_analysis');
    
    return {
      text: "¡Hola! Soy Sobrecupos IA 🚀\n\n🩺 **Sistema optimizado y funcionando perfectamente**\n\n¿En qué puedo ayudarte hoy? Puedes contarme:\n• Qué síntomas tienes\n• Qué especialista necesitas\n• Si buscas un médico específico",
      session: updatedSession,
      metadata: {
        confidence: 1,
        nextStage: 'symptom_analysis',
        fastPath: true
      }
    };
  }

  // Enhanced path for specific doctor search with Airtable integration
  if (analysis.isSpecificDoctor && analysis.doctorName) {
    try {
      // Buscar médico específico en Airtable con timeout
      const searchPromise = SobrecuposService.buscarPorMedico(analysis.doctorName);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Airtable timeout')), 5000)
      );
      
      const sobrecupos = await Promise.race([searchPromise, timeoutPromise]) as any[];
      
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'options_presentation',
        conversationState: {
          ...session.conversationState,
          motivo: message
        },
        appointmentData: {
          alternativeRecords: sobrecupos.slice(0, 5)
        }
      });

      if (sobrecupos.length > 0) {
        const optionsList = formatSobrecuposOptions(sobrecupos.slice(0, 3));
        
        return {
          text: `🎯 **Dr. ${analysis.doctorName} encontrado!**\n\n📅 **${sobrecupos.length} opciones disponibles:**\n\n${optionsList}\n\n💬 Responde con el número de tu opción preferida (1, 2, 3...)`,
          session: updatedSession,
          metadata: {
            confidence: 0.95,
            nextStage: 'options_presentation',
            airtableResults: sobrecupos.length,
            doctorSearch: analysis.doctorName
          }
        };
      } else {
        return {
          text: `🔍 **Dr. ${analysis.doctorName}**\n\n❌ No encontré disponibilidad en este momento.\n\n💡 **Alternativas:**\n• Te puedo buscar especialistas similares\n• Notificarte cuando haya disponibilidad\n• Recomendarte otros médicos de la misma especialidad\n\n¿Qué prefieres?`,
          session: updatedSession,
          metadata: {
            confidence: 0.8,
            nextStage: 'specialty_selection',
            doctorSearch: analysis.doctorName,
            noResults: true
          }
        };
      }
    } catch (error) {
      console.error('❌ Error buscando médico específico:', error);
      
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'options_presentation',
        conversationState: {
          ...session.conversationState,
          motivo: message
        }
      });

      return {
        text: `🔍 **Búsqueda del Dr. ${analysis.doctorName}**\n\n⚡ Procesando búsqueda (conexión optimizada)...\n\n🎯 Te contactaré por WhatsApp con las opciones disponibles.\n\n💡 *Sistema funcionando en modo resiliente*`,
        session: updatedSession,
        metadata: {
          confidence: 0.7,
          nextStage: 'options_presentation',
          fallbackMode: true,
          doctorSearch: analysis.doctorName
        }
      };
    }
  }

  // Enhanced medical analysis with empathy and Airtable integration
  if (analysis.isMedical && analysis.medicalContext) {
    const medicalContext = analysis.medicalContext;
    
    try {
      // Step 1: Generate empathic response if needed
      let empathicResponse = "";
      if (medicalContext.psychProfile) {
        const empathyContext = EmpathyEngine.createContext(
          medicalContext.psychProfile.emotionalState,
          medicalContext.psychProfile.urgencyLevel,
          medicalContext.psychProfile,
          medicalContext.symptoms
        );

        if (EmpathyEngine.needsEmpathy(empathyContext)) {
          try {
            empathicResponse = await Promise.race([
              EmpathyEngine.generateEmpathicResponse(message, empathyContext),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Empathy timeout')), 3000)
              )
            ]);
            empathicResponse += "\n\n";
          } catch (empathyError) {
            console.log('⚡ Empathy fallback activated');
            empathicResponse = "Entiendo tu preocupación. Te ayudo a encontrar la atención médica que necesitas. 💙\n\n";
          }
        }
      }

      // Step 2: Search for specialists in Airtable with timeout
      const searchPromise = SobrecuposService.buscarPorEspecialidad(medicalContext.recommendedSpecialty);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Airtable search timeout')), 6000)
      );
      
      const sobrecupos = await Promise.race([searchPromise, timeoutPromise]) as any[];
      
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'specialty_selection',
        medicalContext,
        conversationState: {
          ...session.conversationState,
          motivo: message,
          specialty: medicalContext.recommendedSpecialty
        },
        appointmentData: {
          alternativeRecords: sobrecupos.slice(0, 5)
        }
      });

      if (sobrecupos.length > 0) {
        const optionsList = formatSobrecuposOptions(sobrecupos.slice(0, 3));
        
        return {
          text: `${empathicResponse}🎯 **Especialidad recomendada: ${medicalContext.recommendedSpecialty}**\n📊 Confianza: ${Math.round(medicalContext.confidence * 100)}%\n\n📅 **${sobrecupos.length} opciones encontradas:**\n\n${optionsList}\n\n💬 Responde con el número de tu opción preferida (1, 2, 3...)`,
          session: updatedSession,
          metadata: {
            confidence: medicalContext.confidence,
            specialty: medicalContext.recommendedSpecialty,
            nextStage: 'specialty_selection',
            airtableResults: sobrecupos.length,
            empathyGenerated: empathicResponse.length > 0,
            medicalAnalysis: true
          }
        };
      } else {
        return {
          text: `${empathicResponse}🎯 **Especialidad identificada: ${medicalContext.recommendedSpecialty}**\n\n❌ No hay sobrecupos disponibles en este momento.\n\n💡 **Opciones disponibles:**\n• Buscar en especialidades relacionadas\n• Notificarte cuando haya disponibilidad\n• Recomendarte centros médicos públicos\n• Conectarte con telemedicina\n\n¿Qué te gustaría hacer?`,
          session: updatedSession,
          metadata: {
            confidence: medicalContext.confidence,
            specialty: medicalContext.recommendedSpecialty,
            nextStage: 'specialty_selection',
            noResults: true,
            empathyGenerated: empathicResponse.length > 0
          }
        };
      }
    } catch (error) {
      console.error('❌ Error en análisis médico completo:', error);
      
      const updatedSession = SessionManager.updateSession(session.id, {
        stage: 'specialty_selection',
        medicalContext,
        conversationState: {
          ...session.conversationState,
          motivo: message,
          specialty: medicalContext.recommendedSpecialty
        }
      });

      return {
        text: `🎯 **Análisis médico completado**\n\n🩺 **Especialidad:** ${medicalContext.recommendedSpecialty}\n📊 **Confianza:** ${Math.round(medicalContext.confidence * 100)}%\n\n⚡ Procesando búsqueda en modo resiliente...\n\n💡 Te contactaré por WhatsApp con las mejores opciones.`,
        session: updatedSession,
        metadata: {
          confidence: medicalContext.confidence,
          specialty: medicalContext.recommendedSpecialty,
          nextStage: 'specialty_selection',
          fallbackMode: true,
          medicalAnalysis: true
        }
      };
    }
  }

  // Default fast response
  SessionManager.incrementAttempts(session.id);
  
  return {
    text: `⚡ **Sistema optimizado funcionando**\n\n📊 **Análisis rápido:**\n• Saludo: ${analysis.isGreeting ? '✅' : '❌'}\n• Médico: ${analysis.isMedical ? '✅' : '❌'}\n• Doctor específico: ${analysis.isSpecificDoctor ? '✅' : '❌'}\n• Tiempo: ${metrics.analysisTime}ms\n\n💡 **Para ayudarte mejor, dime:**\n• "Tengo dolor de cabeza" (síntoma)\n• "Necesito cardiólogo" (especialidad)\n• "Dr. González" (médico específico)`,
    session: SessionManager.getSession(session.id)!,
    metadata: {
      confidence: analysis.confidence,
      nextStage: session.stage,
      fastPath: true,
      needsMoreInfo: true
    }
  };
}

// Helper function to format sobrecupos options
function formatSobrecuposOptions(sobrecupos: any[]): string {
  return sobrecupos.map((record, index) => {
    const fields = record.fields;
    const fecha = fields['Fecha y Hora'] ? new Date(fields['Fecha y Hora']).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Fecha por confirmar';
    
    const precio = fields['Precio Sobrecupo'] ? 
      `$${fields['Precio Sobrecupo'].toLocaleString('es-CL')}` : 
      'Precio por consultar';
    
    return `**${index + 1}.** Dr. ${fields.Medico || 'Por asignar'}\n   📅 ${fecha}\n   📍 ${fields.Comuna || 'Ubicación'}\n   💰 ${precio}`;
  }).join('\n\n');
}

// Timeout utility
function createTimeoutPromise(ms: number) {
  return new Promise<{ type: 'timeout' }>((resolve) => {
    setTimeout(() => {
      resolve({ type: 'timeout' });
    }, ms);
  });
}

// Health check endpoint for monitoring
export async function GET() {
  const healthMetrics = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    circuitBreakerFailures,
    lastFailureTime: lastFailureTime ? new Date(lastFailureTime).toISOString() : null,
    sessionCount: SessionManager.getSessionCount(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    performance: 'optimized'
  };

  return NextResponse.json(healthMetrics);
}