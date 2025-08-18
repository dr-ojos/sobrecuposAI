// app/api/bot/validators/medical-validators.ts
import { PatientPsychProfile, MedicalSymptom, SessionData, UrgencyLevel, EmotionalState } from '../../../../types/medical';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: any;
}

interface PatientFormData {
  name?: string;
  rut?: string;
  phone?: string;
  email?: string;
  age?: number;
}

export class MedicalValidators {
  
  // Validación de datos del paciente
  static validatePatientData(data: PatientFormData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized: PatientFormData = {};

    // Validar nombre
    if (data.name) {
      const nameResult = this.validateName(data.name);
      if (nameResult.isValid) {
        sanitized.name = nameResult.sanitized;
      } else {
        errors.push(...nameResult.errors);
      }
    }

    // Validar RUT
    if (data.rut) {
      const rutResult = this.validateRUT(data.rut);
      if (rutResult.isValid) {
        sanitized.rut = rutResult.sanitized;
      } else {
        errors.push(...rutResult.errors);
      }
    }

    // Validar teléfono
    if (data.phone) {
      const phoneResult = this.validatePhone(data.phone);
      if (phoneResult.isValid) {
        sanitized.phone = phoneResult.sanitized;
      } else {
        errors.push(...phoneResult.errors);
      }
    }

    // Validar email
    if (data.email) {
      const emailResult = this.validateEmail(data.email);
      if (emailResult.isValid) {
        sanitized.email = emailResult.sanitized;
      } else {
        errors.push(...emailResult.errors);
      }
    }

    // Validar edad
    if (data.age !== undefined) {
      const ageResult = this.validateAge(data.age);
      if (ageResult.isValid) {
        sanitized.age = ageResult.sanitized;
      } else {
        errors.push(...ageResult.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  // Validación de nombre
  static validateName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('El nombre es requerido');
      return { isValid: false, errors, warnings: [] };
    }

    const sanitized = name.trim().replace(/\s+/g, ' ');
    
    if (sanitized.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (sanitized.length > 50) {
      errors.push('El nombre no puede exceder 50 caracteres');
    }
    
    if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/.test(sanitized)) {
      errors.push('El nombre solo puede contener letras y espacios');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      sanitized
    };
  }

  // Validación de RUT chileno
  static validateRUT(rut: string): ValidationResult {
    const errors: string[] = [];
    
    if (!rut || rut.trim().length === 0) {
      errors.push('El RUT es requerido');
      return { isValid: false, errors, warnings: [] };
    }

    // Limpiar RUT
    let cleanRut = rut.replace(/[^0-9kK]/g, '').toLowerCase();
    
    if (cleanRut.length < 8 || cleanRut.length > 9) {
      errors.push('El RUT debe tener entre 8 y 9 caracteres');
      return { isValid: false, errors, warnings: [] };
    }

    // Separar número y dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const verifierDigit = cleanRut.slice(-1);
    
    // Calcular dígito verificador
    const expectedVerifier = this.calculateRutVerifier(rutNumber);
    
    if (verifierDigit !== expectedVerifier) {
      errors.push('El RUT ingresado no es válido');
      return { isValid: false, errors, warnings: [] };
    }

    // Formatear RUT
    const formattedRut = `${rutNumber.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}-${verifierDigit.toUpperCase()}`;

    return {
      isValid: true,
      errors: [],
      warnings: [],
      sanitized: formattedRut
    };
  }

  // Validación de teléfono chileno
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!phone || phone.trim().length === 0) {
      errors.push('El teléfono es requerido');
      return { isValid: false, errors, warnings };
    }

    // Limpiar teléfono
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Patrones para teléfonos chilenos
    const patterns = [
      /^(\+56)?9\d{8}$/,  // Celular: +569XXXXXXXX o 9XXXXXXXX
      /^(\+56)?2\d{8}$/,  // Fijo Santiago: +5622XXXXXXX o 22XXXXXXX
      /^(\+56)?\d{2}\d{7}$/ // Otros fijos: +56YYXXXXXXX
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
      errors.push('El formato del teléfono no es válido para Chile');
      return { isValid: false, errors, warnings };
    }

    // Formatear según tipo
    let formatted = cleanPhone;
    if (cleanPhone.startsWith('+56')) {
      formatted = cleanPhone;
    } else if (cleanPhone.startsWith('56')) {
      formatted = `+${cleanPhone}`;
    } else {
      formatted = `+56${cleanPhone}`;
    }

    // Advertencias
    if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
      warnings.push('Se asume teléfono celular chileno');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      sanitized: formatted
    };
  }

  // Validación de email
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('El email es requerido');
      return { isValid: false, errors, warnings: [] };
    }

    const sanitized = email.trim().toLowerCase();
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(sanitized)) {
      errors.push('El formato del email no es válido');
    }

    if (sanitized.length > 254) {
      errors.push('El email es demasiado largo');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      sanitized
    };
  }

  // Validación de edad
  static validateAge(age: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (age < 0 || age > 120) {
      errors.push('La edad debe estar entre 0 y 120 años');
    }

    if (age < 18) {
      warnings.push('Paciente menor de edad - puede requerir autorización');
    }

    if (age > 80) {
      warnings.push('Paciente mayor - considerar necesidades especiales');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: Math.round(age)
    };
  }

  // Validación de motivo de consulta
  static validateMotivoConsulta(motivo: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!motivo || motivo.trim().length === 0) {
      errors.push('El motivo de consulta es requerido');
      return { isValid: false, errors, warnings };
    }

    const sanitized = motivo.trim();
    
    if (sanitized.length < 5) {
      errors.push('El motivo debe tener al menos 5 caracteres');
    }
    
    if (sanitized.length > 500) {
      errors.push('El motivo no puede exceder 500 caracteres');
    }

    // Detectar palabras de emergencia
    const emergencyWords = ['sangre', 'desmayo', 'no puedo respirar', 'dolor intenso'];
    const hasEmergency = emergencyWords.some(word => 
      sanitized.toLowerCase().includes(word)
    );
    
    if (hasEmergency) {
      warnings.push('Se detectaron síntomas que pueden requerir atención inmediata');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  // Validación de perfil psicológico
  static validatePsychProfile(profile: Partial<PatientPsychProfile>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const validEmotionalStates: EmotionalState[] = ['neutral', 'anxiety', 'pain', 'urgency', 'frustration', 'hope'];
    const validUrgencyLevels: UrgencyLevel[] = ['low', 'normal', 'high', 'critical'];
    
    if (profile.emotionalState && !validEmotionalStates.includes(profile.emotionalState)) {
      errors.push('Estado emocional no válido');
    }
    
    if (profile.urgencyLevel && !validUrgencyLevels.includes(profile.urgencyLevel)) {
      errors.push('Nivel de urgencia no válido');
    }

    // Advertencias por combinaciones específicas
    if (profile.emotionalState === 'anxiety' && profile.urgencyLevel === 'critical') {
      warnings.push('Combinación de ansiedad y urgencia crítica - requiere manejo especial');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: profile
    };
  }

  // Validación de síntomas médicos
  static validateMedicalSymptoms(symptoms: MedicalSymptom[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(symptoms)) {
      errors.push('Los síntomas deben ser un array');
      return { isValid: false, errors, warnings };
    }

    const sanitizedSymptoms: MedicalSymptom[] = [];
    
    for (const [index, symptom] of symptoms.entries()) {
      const symptomErrors: string[] = [];
      
      if (!symptom.description || symptom.description.trim().length === 0) {
        symptomErrors.push(`Síntoma ${index + 1}: descripción requerida`);
      }
      
      if (!['leve', 'moderado', 'severo'].includes(symptom.severity)) {
        symptomErrors.push(`Síntoma ${index + 1}: severidad debe ser leve, moderado o severo`);
      }
      
      if (!['low', 'normal', 'high', 'critical'].includes(symptom.urgency)) {
        symptomErrors.push(`Síntoma ${index + 1}: urgencia no válida`);
      }

      if (symptomErrors.length === 0) {
        sanitizedSymptoms.push({
          ...symptom,
          description: symptom.description.trim()
        });
      } else {
        errors.push(...symptomErrors);
      }
    }

    // Advertencias
    const severeSymptoms = sanitizedSymptoms.filter(s => s.severity === 'severo');
    if (severeSymptoms.length > 0) {
      warnings.push(`Se detectaron ${severeSymptoms.length} síntoma(s) severo(s)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: sanitizedSymptoms
    };
  }

  // Validación de datos de sesión
  static validateSessionData(session: Partial<SessionData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!session.id || session.id.trim().length === 0) {
      errors.push('ID de sesión requerido');
    }

    const validStages = ['welcome', 'symptom_analysis', 'specialty_selection', 'options_presentation', 'appointment_confirmation', 'data_collection', 'final_confirmation'];
    if (session.stage && !validStages.includes(session.stage)) {
      errors.push('Etapa de sesión no válida');
    }

    if (session.conversationState?.attempts && session.conversationState.attempts > 5) {
      warnings.push('Alto número de intentos en la conversación');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: session
    };
  }

  // Método helper para calcular dígito verificador del RUT
  private static calculateRutVerifier(rutNumber: string): string {
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const verifier = 11 - remainder;
    
    if (verifier === 11) return '0';
    if (verifier === 10) return 'k';
    return verifier.toString();
  }

  // Método para sanitizar entrada de texto general
  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Prevenir XSS básico
  }

  // Método para validar entrada de usuario en tiempo real
  static validateUserInput(input: string): {
    isSafe: boolean;
    sanitized: string;
    concerns: string[];
  } {
    const concerns: string[] = [];
    
    // Detectar contenido potencialmente problemático
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      pattern.test(input)
    );
    
    if (hasSuspiciousContent) {
      concerns.push('Contenido potencialmente malicioso detectado');
    }
    
    // Sanitizar
    const sanitized = this.sanitizeText(input, 2000);
    
    return {
      isSafe: concerns.length === 0,
      sanitized,
      concerns
    };
  }
}