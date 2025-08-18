// app/api/bot/core/symptom-analyzer.ts
import { 
  MedicalSymptom, 
  PatientPsychProfile, 
  MedicalContext, 
  AnalysisResult,
  UrgencyLevel,
  EmotionalState,
  MedicalSpecialty,
  SYMPTOM_KEYWORDS,
  MEDICAL_SPECIALTIES
} from '../../../../types/medical';

export class SymptomAnalyzer {
  private static readonly GREETING_KEYWORDS = [
    'hola', 'buenas', 'buenos dias', 'buenos días', 'buenas tardes', 
    'buenas noches', 'hey', 'ey', 'qué tal', 'que tal', 'holi', 'holis', 
    'hello', 'saludos'
  ];

  private static readonly URGENCY_KEYWORDS = {
    critical: ['sangre', 'desmayo', 'no puedo respirar', 'pecho apretado', 'dolor intenso', 'emergencia'],
    high: ['dolor fuerte', 'muy mal', 'no aguanto', 'grave', 'preocupado', 'urgente'],
    normal: ['molesta', 'incomoda', 'dolor leve', 'desde hace días'],
    low: ['control', 'chequeo', 'rutina', 'preventivo']
  };

  private static readonly EMOTIONAL_INDICATORS = {
    anxiety: ['preocupado', 'nervioso', 'ansioso', 'miedo', 'asustado', 'inquieto'],
    pain: ['duele', 'dolor', 'molesta', 'incomoda', 'sufro', 'lastima'],
    urgency: ['urgente', 'rapido', 'pronto', 'necesito ya', 'no aguanto'],
    frustration: ['cansado', 'harto', 'frustrado', 'desesperado', 'no puedo más'],
    hope: ['espero', 'ojala', 'quizas', 'confio', 'mejore', 'alivio']
  };

  static analyzeMessage(message: string): AnalysisResult {
    const normalizedText = this.normalizeText(message);
    
    return {
      isGreeting: this.isGreeting(normalizedText),
      isMedical: this.isMedicalQuery(normalizedText),
      isSpecificDoctor: this.hasSpecificDoctor(message),
      medicalContext: this.extractMedicalContext(message),
      doctorName: this.extractDoctorName(message),
      confidence: this.calculateConfidence(normalizedText)
    };
  }

  static extractMedicalContext(message: string): MedicalContext | undefined {
    const normalizedText = this.normalizeText(message);
    
    if (!this.isMedicalQuery(normalizedText)) {
      return undefined;
    }

    const symptoms = this.extractSymptoms(message);
    const psychProfile = this.analyzePsychProfile(message);
    const specialty = this.recommendSpecialty(symptoms, message);
    
    if (!specialty) return undefined;

    return {
      symptoms,
      psychProfile,
      recommendedSpecialty: specialty.name,
      confidence: specialty.confidence,
      alternativeSpecialties: specialty.alternatives
    };
  }

  private static extractSymptoms(message: string): MedicalSymptom[] {
    const normalizedText = this.normalizeText(message);
    const symptoms: MedicalSymptom[] = [];
    
    // Buscar palabras clave médicas
    const foundKeywords: string[] = [];
    
    for (const [specialty, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword);
        }
      }
    }

    if (foundKeywords.length > 0) {
      symptoms.push({
        description: message,
        keywords: foundKeywords,
        severity: this.assessSeverity(message),
        urgency: this.assessUrgency(message),
        bodyPart: this.extractBodyPart(foundKeywords),
        duration: this.extractDuration(message)
      });
    }

    return symptoms;
  }

  private static analyzePsychProfile(message: string): PatientPsychProfile {
    const normalizedText = this.normalizeText(message);
    
    // Detectar estado emocional dominante
    let emotionalState: EmotionalState = 'neutral';
    let maxMatches = 0;

    for (const [emotion, keywords] of Object.entries(this.EMOTIONAL_INDICATORS)) {
      const matches = keywords.filter(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        emotionalState = emotion as EmotionalState;
      }
    }

    return {
      emotionalState,
      urgencyLevel: this.assessUrgency(message),
      communicationStyle: this.assessCommunicationStyle(message),
      keywords: this.extractEmotionalKeywords(message),
      hasChildren: this.detectChildren(message),
      chronicConditions: this.detectChronicConditions(message)
    };
  }

  private static recommendSpecialty(symptoms: MedicalSymptom[], message: string): {
    name: MedicalSpecialty;
    confidence: number;
    alternatives?: MedicalSpecialty[];
  } | undefined {
    const normalizedText = this.normalizeText(message);
    const specialtyScores: Record<string, number> = {};

    // Calcular puntajes por especialidad basado en palabras clave
    for (const [specialty, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          score += 1;
          // Bonus por múltiples coincidencias de la misma especialidad
          if (normalizedText.split(keyword.toLowerCase()).length > 2) {
            score += 0.5;
          }
        }
      }
      specialtyScores[specialty] = score;
    }

    // Encontrar la mejor especialidad
    const sortedSpecialties = Object.entries(specialtyScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a);

    if (sortedSpecialties.length === 0) return undefined;

    const [topSpecialty, topScore] = sortedSpecialties[0];
    const confidence = Math.min(topScore / 3, 1); // Normalizar a 0-1

    const alternatives = sortedSpecialties
      .slice(1, 3)
      .map(([specialty]) => specialty as MedicalSpecialty);

    return {
      name: topSpecialty as MedicalSpecialty,
      confidence,
      alternatives: alternatives.length > 0 ? alternatives : undefined
    };
  }

  private static assessSeverity(message: string): 'leve' | 'moderado' | 'severo' {
    const normalizedText = this.normalizeText(message);
    
    if (normalizedText.includes('intenso') || normalizedText.includes('insoportable') || 
        normalizedText.includes('muy fuerte') || normalizedText.includes('no aguanto')) {
      return 'severo';
    }
    
    if (normalizedText.includes('moderado') || normalizedText.includes('fuerte') ||
        normalizedText.includes('molesto') || normalizedText.includes('preocupante')) {
      return 'moderado';
    }
    
    return 'leve';
  }

  private static assessUrgency(message: string): UrgencyLevel {
    const normalizedText = this.normalizeText(message);
    
    for (const [level, keywords] of Object.entries(this.URGENCY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword)) {
          return level as UrgencyLevel;
        }
      }
    }
    
    return 'normal';
  }

  private static assessCommunicationStyle(message: string): 'direct' | 'detailed' | 'anxious' | 'confused' {
    if (message.length > 200) return 'detailed';
    if (message.includes('?') && message.split('?').length > 2) return 'confused';
    if (this.normalizeText(message).includes('ayuda') || 
        this.normalizeText(message).includes('no se')) return 'anxious';
    return 'direct';
  }

  private static extractBodyPart(keywords: string[]): string | undefined {
    const bodyParts = ['ojos', 'cabeza', 'pecho', 'estómago', 'garganta', 'oído', 'piel'];
    return keywords.find(keyword => bodyParts.includes(keyword));
  }

  private static extractDuration(message: string): string | undefined {
    const durationPatterns = [
      /desde hace (\w+)/i,
      /hace (\w+ \w+)/i,
      /(\w+) días/i,
      /(\w+) semanas/i,
      /(\w+) meses/i
    ];

    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match) return match[0];
    }

    return undefined;
  }

  private static extractEmotionalKeywords(message: string): string[] {
    const allEmotionalWords = Object.values(this.EMOTIONAL_INDICATORS).flat();
    const normalizedText = this.normalizeText(message);
    
    return allEmotionalWords.filter(word => 
      normalizedText.includes(word.toLowerCase())
    );
  }

  private static detectChildren(message: string): boolean {
    const childKeywords = ['niño', 'hijo', 'hija', 'bebé', 'menor', 'infantil'];
    const normalizedText = this.normalizeText(message);
    return childKeywords.some(keyword => normalizedText.includes(keyword));
  }

  private static detectChronicConditions(message: string): string[] {
    const conditions = ['diabetes', 'hipertensión', 'presión alta', 'artritis', 'asma'];
    const normalizedText = this.normalizeText(message);
    return conditions.filter(condition => normalizedText.includes(condition));
  }

  private static isGreeting(normalizedText: string): boolean {
    return this.GREETING_KEYWORDS.some(greeting => 
      normalizedText === greeting || normalizedText.startsWith(greeting + ' ')
    );
  }

  private static isMedicalQuery(normalizedText: string): boolean {
    const medicalKeywords = Object.values(SYMPTOM_KEYWORDS).flat();
    return medicalKeywords.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
  }

  private static hasSpecificDoctor(message: string): boolean {
    const doctorPatterns = [
      /\b(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
      /\b(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i
    ];

    return doctorPatterns.some(pattern => pattern.test(message));
  }

  private static extractDoctorName(message: string): string | undefined {
    const doctorPatterns = [
      /\b(?:dr|doctor|dra|doctora)\.?\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
      /\b(?:medico|médico)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i
    ];

    for (const pattern of doctorPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private static calculateConfidence(normalizedText: string): number {
    let confidence = 0.5; // Base confidence
    
    if (this.isMedicalQuery(normalizedText)) confidence += 0.3;
    if (normalizedText.length > 20) confidence += 0.1;
    if (normalizedText.includes('dolor') || normalizedText.includes('problema')) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }

  private static normalizeText(text: string): string {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }
}