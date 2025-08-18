// app/api/bot/ai/empathy-engine.ts
import { EmpathyContext, EmotionalState, UrgencyLevel } from '../../../../types/medical';

export class EmpathyEngine {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly FALLBACK_RESPONSES: Record<EmotionalState, string[]> = {
    neutral: [
      "Entiendo tu consulta. Te ayudo a encontrar el especialista adecuado.",
      "Perfecto, vamos a buscar la mejor opción médica para ti."
    ],
    anxiety: [
      "Entiendo que puedes estar preocupado. Es normal sentirse así, pero estamos aquí para ayudarte.",
      "Comprendo tu inquietud. Vamos a encontrar una solución juntos."
    ],
    pain: [
      "Lamento que estés pasando por esta molestia. Es importante atenderte pronto.",
      "Entiendo que debe ser incómodo. Busquemos ayuda médica adecuada."
    ],
    urgency: [
      "Veo que necesitas atención pronto. Te ayudo a encontrar la opción más rápida.",
      "Entiendo la urgencia. Busquemos una cita lo antes posible."
    ],
    frustration: [
      "Comprendo tu frustración. Estamos aquí para hacer esto más fácil.",
      "Entiendo que puede ser agotador. Te ayudo a encontrar una solución."
    ],
    hope: [
      "Me alegra que busques ayuda. Vamos a encontrar el cuidado que necesitas.",
      "Perfecto, con la atención adecuada vas a mejorar. Te ayudo a encontrarla."
    ]
  };

  static async generateEmpathicResponse(
    message: string, 
    context: EmpathyContext,
    fallback?: string
  ): Promise<string> {
    // Si no hay OpenAI, usar respuestas inteligentes locales
    if (!this.OPENAI_API_KEY) {
      return this.generateLocalEmpathicResponse(context);
    }

    try {
      const prompt = this.buildContextualPrompt(context);
      const response = await this.callOpenAI(prompt, message);
      return response || this.generateLocalEmpathicResponse(context);
    } catch (error) {
      console.error('❌ Error EmpathyEngine OpenAI:', error);
      return fallback || this.generateLocalEmpathicResponse(context);
    }
  }

  private static buildContextualPrompt(context: EmpathyContext): string {
    let prompt = `Eres Carmen, una secretaria médica chilena con 15 años de experiencia. Tu misión es brindar contención emocional genuina a pacientes preocupados por su salud.

PERSONALIDAD:
- Cálida, empática y profesional
- Usa lenguaje chileno natural ("te entiendo", "qué molesto debe ser")  
- Reconoces que cada síntoma afecta la vida diaria del paciente
- Validas emociones antes de ofrecer soluciones

CONTEXTO DEL PACIENTE:`;

    // Contexto emocional
    if (context.emotionalState !== 'neutral') {
      const emotionalDescriptions = {
        anxiety: 'El paciente muestra signos de ansiedad y preocupación',
        pain: 'El paciente experimenta dolor o molestias físicas',
        urgency: 'El paciente siente urgencia por ser atendido',
        frustration: 'El paciente muestra frustración o cansancio',
        hope: 'El paciente busca ayuda con esperanza de mejorar'
      };
      prompt += `\n- ESTADO EMOCIONAL: ${emotionalDescriptions[context.emotionalState]}`;
    }

    // Contexto de urgencia
    if (context.urgency !== 'normal') {
      const urgencyDescriptions = {
        low: 'Consulta preventiva o de rutina',
        normal: 'Consulta médica estándar',
        high: 'Requiere atención prioritaria',
        critical: 'Situación que requiere atención inmediata'
      };
      prompt += `\n- URGENCIA: ${urgencyDescriptions[context.urgency]}`;
    }

    // Contexto familiar
    if (context.patientProfile.hasChildren) {
      prompt += `\n- CONTEXTO FAMILIAR: El paciente tiene hijos, considera el impacto familiar`;
    }

    // Condiciones crónicas
    if (context.patientProfile.chronicConditions?.length) {
      prompt += `\n- HISTORIAL: Menciona condiciones como ${context.patientProfile.chronicConditions.join(', ')}`;
    }

    // Síntomas médicos
    if (context.medicalSymptoms.length > 0) {
      const symptomInfo = context.medicalSymptoms[0];
      prompt += `\n- SÍNTOMAS: ${symptomInfo.description} (severidad: ${symptomInfo.severity})`;
    }

    prompt += `\n\nRESPONDE CON:
- Validación emocional genuina en 1-2 líneas
- Reconocimiento específico del impacto en su vida
- Esperanza realista sobre encontrar ayuda médica
- Máximo 3 líneas, cada palabra cuenta
- Un emoji apropiado al final (💖, 🌟, o 🤗)

EVITA:
- Diagnósticos médicos
- Minimizar síntomas  
- Respuestas robóticas
- Exceso de emojis`;

    return prompt;
  }

  private static async callOpenAI(prompt: string, userMessage: string): Promise<string | null> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 80,
          messages: [
            { role: "system", content: prompt },
            { 
              role: "user", 
              content: `Un paciente me dice: "${userMessage}". Como Carmen, respóndele con empatía genuina.` 
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error('❌ Error llamando OpenAI:', error);
      return null;
    }
  }

  private static generateLocalEmpathicResponse(context: EmpathyContext): string {
    const responses = this.FALLBACK_RESPONSES[context.emotionalState];
    let response = responses[Math.floor(Math.random() * responses.length)];

    // Personalizar basado en urgencia
    if (context.urgency === 'high' || context.urgency === 'critical') {
      response += " Te ayudo a encontrar atención prioritaria.";
    }

    // Añadir contexto específico
    if (context.medicalSymptoms.length > 0) {
      const symptom = context.medicalSymptoms[0];
      if (symptom.severity === 'severo') {
        response += " Es importante que te atiendan pronto.";
      }
    }

    // Emoji apropiado
    const emojiMap = {
      neutral: '💙',
      anxiety: '🤗',
      pain: '💖',
      urgency: '⚡',
      frustration: '🌟',
      hope: '✨'
    };

    return `${response} ${emojiMap[context.emotionalState]}`;
  }

  static createContext(
    emotionalState: EmotionalState,
    urgency: UrgencyLevel,
    patientProfile: any,
    medicalSymptoms: any[] = [],
    conversationStage: any = 'symptom_analysis'
  ): EmpathyContext {
    return {
      emotionalState,
      urgency,
      patientProfile,
      medicalSymptoms,
      conversationStage
    };
  }

  // Método para evaluar si necesita respuesta empática
  static needsEmpathy(context: EmpathyContext): boolean {
    return context.emotionalState !== 'neutral' || 
           context.urgency === 'high' || 
           context.urgency === 'critical' ||
           context.medicalSymptoms.some(s => s.severity === 'severo');
  }

  // Método para detectar palabras que requieren respuesta empática especial
  static detectSpecialConcerns(message: string): {
    hasPainWords: boolean;
    hasUrgencyWords: boolean;
    hasAnxietyWords: boolean;
    hasEmergencyWords: boolean;
  } {
    const normalizedMessage = message.toLowerCase();
    
    return {
      hasPainWords: ['dolor', 'duele', 'molesta', 'sufro'].some(word => 
        normalizedMessage.includes(word)),
      hasUrgencyWords: ['urgente', 'rapido', 'pronto', 'ya'].some(word => 
        normalizedMessage.includes(word)),
      hasAnxietyWords: ['preocupado', 'nervioso', 'miedo', 'ansioso'].some(word => 
        normalizedMessage.includes(word)),
      hasEmergencyWords: ['emergencia', 'sangre', 'desmayo', 'no puedo respirar'].some(word => 
        normalizedMessage.includes(word))
    };
  }
}