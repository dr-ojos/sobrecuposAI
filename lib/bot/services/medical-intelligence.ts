// Servicio de inteligencia médica - mantiene toda la lógica inteligente del bot
import { searchAreas } from '../../areas-interes';
import { detectMedicalCondition, generateMedicalResponse } from '../../medical-intelligence';
import { MedicalDetection, PatientInsights } from '../types';

export class MedicalIntelligenceService {
  
  // Detectar especialidad directa desde el texto
  detectarEspecialidadDirecta(text: string): string | null {
    const especialidadesPatrones = {
      "Oftalmología": [
        'oftalmólogo', 'oftalmología', 'ojos', 'vista', 'visión', 'ver', 'veo', 'mirar',
        'ceguera', 'ciego', 'borroso', 'difuso', 'enfoque', 'cristalino',
        'retina', 'córnea', 'pupila', 'iris', 'párpado', 'pestañas',
        'lagañas', 'conjuntivitis', 'orzuelo', 'chalazión',
        'glaucoma', 'cataratas', 'miopía', 'hipermetropía', 'astigmatismo',
        'lentes', 'anteojos', 'gafas'
      ],
      "Dermatología": [
        'dermatólogo', 'dermatología', 'piel', 'cutis', 'dermis', 'epidermis',
        'acné', 'granos', 'espinillas', 'barros', 'manchas', 'lunares', 'nevus',
        'erupciones', 'sarpullido', 'ronchas', 'urticaria', 'eczema', 'dermatitis',
        'psoriasis', 'rosácea', 'melasma', 'vitíligo', 'alopecia', 'calvicie',
        'caspa', 'seborrea', 'hongos', 'micosis', 'verrugas', 'queratosis'
      ],
      "Cardiología": [
        'cardiólogo', 'cardiología', 'corazón', 'cardíaco', 'cardiac',
        'palpitaciones', 'taquicardia', 'bradicardia', 'arritmia',
        'dolor pecho', 'angina', 'infarto', 'presión alta', 'hipertensión',
        'soplo', 'electrocardiograma', 'ecocardiograma', 'holter'
      ],
      "Neurología": [
        'neurólogo', 'neurología', 'cerebro', 'neurológico', 'neural',
        'dolor cabeza', 'cefalea', 'migraña', 'mareos', 'vértigo',
        'convulsiones', 'epilepsia', 'parkinson', 'alzheimer', 'demencia',
        'esclerosis múltiple', 'ictus', 'avc', 'derrame cerebral'
      ],
      "Gastroenterología": [
        'gastroenterólogo', 'gastroenterología', 'estómago', 'gastro',
        'digestión', 'digestivo', 'intestino', 'colon', 'recto', 'ano',
        'náuseas', 'vómitos', 'diarrea', 'estreñimiento', 'acidez',
        'reflujo', 'gastritis', 'úlcera', 'colitis', 'crohn',
        'endoscopia', 'colonoscopia', 'hígado', 'vesícula'
      ],
      "Traumatología": [
        'traumatólogo', 'traumatología', 'huesos', 'fracturas', 'luxación',
        'esguince', 'articulaciones', 'rodilla', 'hombro', 'cadera',
        'columna', 'espalda', 'lumbar', 'cervical', 'muñeca', 'tobillo',
        'ortopedia', 'prótesis', 'ligamentos', 'tendones', 'músculos'
      ],
      "Ginecología": [
        'ginecólogo', 'ginecología', 'útero', 'ovarios', 'vagina',
        'menstruación', 'regla', 'período', 'embarazo', 'parto',
        'menopausia', 'anticonceptivos', 'citología', 'papanicolau'
      ],
      "Urología": [
        'urólogo', 'urología', 'riñones', 'vejiga', 'próstata', 'testículos',
        'pene', 'uretra', 'orina', 'micción', 'incontinencia',
        'infección urinaria', 'cistitis', 'cálculos renales', 'piedras riñón'
      ],
      "Otorrinolaringología": [
        'otorrino', 'otorrinolaringólogo', 'oídos', 'nariz', 'garganta',
        'sordera', 'hipoacusia', 'tinnitus', 'acúfenos', 'vértigo',
        'sinusitis', 'rinitis', 'amigdalitis', 'faringitis', 'laringitis',
        'ronquera', 'afonía', 'ronquidos', 'apnea sueño'
      ],
      "Endocrinología": [
        'endocrinólogo', 'endocrinología', 'hormonas', 'tiroides',
        'diabetes', 'insulina', 'glucosa', 'azúcar', 'obesidad',
        'sobrepeso', 'metabolismo', 'hipotiroidismo', 'hipertiroidismo'
      ]
    };

    const textLower = text.toLowerCase();
    
    for (const [especialidad, patrones] of Object.entries(especialidadesPatrones)) {
      if (patrones.some(patron => textLower.includes(patron))) {
        console.log(`🎯 Especialidad detectada directamente: ${especialidad} para texto: "${text}"`);
        return especialidad;
      }
    }
    
    return null;
  }

  // Evaluar síntomas usando lógica avanzada
  evaluarSintomas(text: string): string | null {
    console.log('🔍 Evaluando síntomas. Texto original:', text);
    const normalizedText = text.toLowerCase().trim();
    console.log('🔍 Texto normalizado:', normalizedText);

    // DOLOR DE CABEZA - Mejorado con más patrones y múltiples especialidades
    const sintomasCefalea = [
      'dolor de cabeza', 'cefalea', 'jaqueca', 'migraña', 'migrana',
      'dolor cabeza', 'me duele la cabeza', 'tengo dolor de cabeza',
      'cabeza me duele', 'dolor en la cabeza', 'cabezazo', 'punchazo cabeza',
      'presión en la cabeza', 'tensión cabeza', 'dolor temporal',
      'dolor frente', 'dolor frontal', 'dolor occipital', 'dolor parietal'
    ];

    for (const sintoma of sintomasCefalea) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas de cefalea detectados: ${sintoma}`);
        // Detectar severidad para decidir especialidad
        const esSevero = this.detectarSeveridadCefalea(normalizedText);
        return esSevero ? "Neurología" : "Medicina Familiar";
      }
    }

    // OFTALMOLOGÍA - Síntomas visuales (mejorados)
    const sintomasOftalmologicos = [
      'borroso', 'difuso', 'nublado', 'empañado',
      'no veo bien', 'veo mal', 'visión borrosa',
      'dolor ojo', 'dolor en el ojo', 'dolor ocular', 'ojo me duele',
      'ojos rojos', 'lagrimeo', 'picazón ojos', 'ardor ojos', 
      'sequedad ojos', 'ojos secos', 'moscas volantes', 'destellos', 'halos',
      'pérdida visión', 'ceguera', 'punto ciego',
      // Síntomas de dolor ocular severo
      'dolor intenso ojo', 'dolor fuerte ojo', 'dolor severo ojo',
      'ojo duele mucho', 'dolor insoportable ojo', 'ojo muy adolorido'
    ];

    for (const sintoma of sintomasOftalmologicos) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas oftalmológicos detectados: ${sintoma}`);
        return "Oftalmología";
      }
    }

    // OTORRINOLARINGOLOGÍA - Síntomas de oído, nariz y garganta (mejorados)
    const sintomasOtorrino = [
      'dolor oído', 'dolor en el oído', 'dolor de oído', 'oído me duele',
      'oído duele', 'otalgia', 'dolor auricular', 'oreja duele',
      'dolor oreja', 'dolor en la oreja', 'infección oído', 'otitis',
      'zumbido oído', 'pitido oído', 'tinnitus', 'acúfeno',
      'sordera', 'no escucho', 'pérdida auditiva', 'hipoacusia',
      'mareo', 'vértigo', 'equilibrio', 'inestabilidad',
      'dolor garganta', 'garganta duele', 'dolor al tragar', 'faringitis',
      'amigdalitis', 'angina', 'ronquera', 'afonía', 'sin voz',
      'congestión nasal', 'nariz tapada', 'sinusitis', 'rinitis',
      // Síntomas severos de oído
      'dolor intenso oído', 'dolor fuerte oído', 'dolor severo oído',
      'oído duele mucho', 'dolor insoportable oído', 'oído muy adolorido'
    ];

    for (const sintoma of sintomasOtorrino) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas otorrinolaringológicos detectados: ${sintoma}`);
        return "Otorrinolaringología";
      }
    }

    // DERMATOLOGÍA
    const sintomasDermatologicos = [
      'picazón', 'comezón', 'sarpullido', 'erupciones', 'ronchas',
      'manchas piel', 'granos', 'acné', 'espinillas',
      'piel seca', 'piel grasa', 'descamación',
      'hongos piel', 'infección piel'
    ];

    for (const sintoma of sintomasDermatologicos) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas dermatológicos detectados: ${sintoma}`);
        return "Dermatología";
      }
    }

    // CARDIOLOGÍA
    const sintomasCardiologicos = [
      'dolor pecho', 'palpitaciones', 'taquicardia',
      'falta aire', 'disnea', 'fatiga', 'cansancio extremo',
      'mareos cardíacos', 'desmayo', 'síncope'
    ];

    for (const sintoma of sintomasCardiologicos) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas cardiológicos detectados: ${sintoma}`);
        return "Cardiología";
      }
    }

    // GASTROENTEROLOGÍA
    const sintomasGastroenterologicos = [
      'dolor estómago', 'dolor abdominal', 'acidez',
      'náuseas', 'vómito', 'diarrea', 'estreñimiento',
      'distensión abdominal', 'gases', 'flatulencia'
    ];

    for (const sintoma of sintomasGastroenterologicos) {
      if (normalizedText.includes(sintoma)) {
        console.log(`✅ Síntomas gastroenterológicos detectados: ${sintoma}`);
        return "Gastroenterología";
      }
    }

    console.log('❌ No se detectaron síntomas específicos');
    return null;
  }

  // Detectar severidad de cefalea para decidir entre Medicina Familiar vs Neurología
  detectarSeveridadCefalea(text: string): boolean {
    const indicadoresSeveridad = [
      // Intensidad
      'severo', 'intenso', 'fuerte', 'insoportable', 'terrible', 'horrible',
      'muy fuerte', 'muy intenso', 'extremo', 'agudo',
      
      // Frecuencia/duración
      'constante', 'permanente', 'todo el tiempo', 'siempre', 'crónico',
      'diario', 'todos los días', 'frecuente', 'recurrente',
      'más de una semana', 'semanas', 'meses',
      
      // Síntomas neurológicos asociados
      'migraña', 'migrana', 'jaqueca', 'cefalea tensional',
      'náuseas', 'vómito', 'fotofobia', 'sensibilidad luz',
      'fonofobia', 'sensibilidad ruido', 'aura',
      'visión borrosa', 'mareos', 'vértigo',
      
      // Impacto funcional
      'no puedo trabajar', 'no puedo estudiar', 'incapacitante',
      'me despierta', 'no puedo dormir', 'afecta sueño',
      'tengo que acostarme', 'me quedo en cama'
    ];

    for (const indicador of indicadoresSeveridad) {
      if (text.includes(indicador)) {
        console.log(`⚠️ Cefalea severa detectada por: ${indicador} → Neurología`);
        return true;
      }
    }

    console.log(`ℹ️ Cefalea leve/moderada → Medicina Familiar`);
    return false;
  }

  // Detectar urgencia para dolor ocular severo (para implementar same-day logic)
  detectarUrgenciaOcular(text: string): { esUrgente: boolean; nivel: string } {
    const indicadoresUrgencia = {
      'crítico': [
        'dolor insoportable', 'dolor severo', 'dolor intenso',
        'no puedo abrir', 'no puedo ver', 'pérdida súbita',
        'súbita', 'repentino', 'de repente', 'emergencia'
      ],
      'alto': [
        'dolor fuerte', 'muy doloroso', 'duele mucho',
        'empeorando', 'peor', 'aumentando', 'cada vez más'
      ],
      'moderado': [
        'dolor constante', 'todo el día', 'no mejora',
        'persiste', 'continuo'
      ]
    };

    for (const [nivel, indicadores] of Object.entries(indicadoresUrgencia)) {
      for (const indicador of indicadores) {
        if (text.includes(indicador)) {
          const esUrgente = nivel === 'crítico' || nivel === 'alto';
          console.log(`🚨 Urgencia ocular ${nivel} detectada: ${indicador} - Urgente: ${esUrgente}`);
          return { esUrgente, nivel };
        }
      }
    }

    return { esUrgente: false, nivel: 'normal' };
  }

  // Detectar especialidad alternativa
  detectarEspecialidadAlternativa(text: string): string | null {
    // Lógica para sugerir especialidades relacionadas
    const textLower = text.toLowerCase();
    
    if (textLower.includes('dolor cabeza') || textLower.includes('migraña')) {
      return "Medicina Familiar"; // Como alternativa a Neurología
    }
    
    if (textLower.includes('dolor espalda') || textLower.includes('lumbar')) {
      return "Medicina Familiar"; // Como alternativa a Traumatología
    }
    
    return null;
  }

  // Buscar médicos por área de interés
  async buscarMedicosPorAreaInteres(areaText: string): Promise<any[]> {
    console.log(`🔍 Buscando médicos por área de interés: "${areaText}"`);
    
    try {
      // Usar el sistema existente de áreas de interés
      const areas = this.extraerAreasInteres(areaText);
      console.log(`🎯 Áreas específicas detectadas: ${JSON.stringify(areas)}`);
      
      if (areas.length === 0) {
        console.log(`❌ No se detectaron áreas específicas en: "${areaText}"`);
        return [];
      }
      
      // Aquí se conectaría con el servicio de Airtable para buscar médicos
      // Por ahora retornamos array vacío para mantener la funcionalidad existente
      return [];
    } catch (error) {
      console.error(`❌ Error buscando médicos por área:`, error);
      return [];
    }
  }

  // Extraer áreas de interés específicas del texto
  extraerAreasInteres(texto: string): string[] {
    console.log(`🧠 [ALGORITMO] Analizando texto: "${texto}"`);
    
    // PASO 1: Usar el sistema de inteligencia médica avanzado
    const deteccionesMedicas = detectMedicalCondition(texto);
    console.log(`🎯 [ALGORITMO] Detecciones médicas:`, deteccionesMedicas);
    
    // PASO 2: Sistema legacy usando searchAreas
    const areasEncontradas = searchAreas(texto);
    console.log(`🎯 [ALGORITMO] Áreas finales detectadas: ${JSON.stringify(areasEncontradas)}`);
    
    // Combinar resultados
    const todasLasAreas: string[] = [];
    
    // Agregar detecciones médicas
    if (Array.isArray(deteccionesMedicas)) {
      deteccionesMedicas.forEach(deteccion => {
        if (deteccion.area) {
          todasLasAreas.push(deteccion.area);
        }
      });
    }
    
    // Agregar áreas encontradas por searchAreas
    if (Array.isArray(areasEncontradas)) {
      areasEncontradas.forEach(resultado => {
        if (resultado.areas) {
          todasLasAreas.push(...resultado.areas);
        }
      });
    }
    
    // Eliminar duplicados
    return [...new Set(todasLasAreas)];
  }

  // Generar respuesta empática usando OpenAI si está disponible
  async generateEmphaticResponse(
    text: string, 
    fallback: string = "Entiendo tu preocupación.", 
    patientContext: any = {}
  ): Promise<string> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return fallback;
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
          temperature: 0.7,
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content: "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión hacia el usuario. Usa un tono cálido pero profesional. No menciones 'Sobrecupos IA' ni uses comillas."
            },
            { 
              role: "user", 
              content: `Usuario dice: "${text}". Contexto emocional: ${JSON.stringify(patientContext)}` 
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || fallback;
    } catch (error) {
      console.error('[EMPATHIC_RESPONSE_ERROR]:', error);
      return fallback;
    }
  }

  // Evaluar si es consulta médica usando OpenAI
  async evaluateIfMedicalQuery(text: string): Promise<boolean> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      // Fallback: detectar palabras médicas básicas
      const palabrasMedicas = [
        'dolor', 'síntoma', 'enfermedad', 'molestia', 'problema',
        'médico', 'doctor', 'especialista', 'consulta', 'cita'
      ];
      
      const textLower = text.toLowerCase();
      return palabrasMedicas.some(palabra => textLower.includes(palabra));
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
          temperature: 0.3,
          max_tokens: 10,
          messages: [
            {
              role: "system",
              content: "Determina si el texto es una consulta médica o de salud. Responde únicamente 'SI' si es médico/salud, 'NO' si es otra cosa (saludo, pregunta general, etc.)."
            },
            { role: "user", content: text }
          ]
        })
      });

      if (!response.ok) return true; // En caso de error, asumir que sí es médico

      const data = await response.json();
      const resultado = data.choices?.[0]?.message?.content?.trim()?.toUpperCase();
      return resultado === 'SI';
    } catch (error) {
      console.error('[MEDICAL_EVALUATION_ERROR]:', error);
      return true; // En caso de error, asumir que sí es médico
    }
  }

  // Detectar especialidad usando OpenAI
  async detectSpecialtyWithAI(text: string, availableSpecialties: string[]): Promise<string | null> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return null;
    }

    try {
      const especialidadesString = availableSpecialties.join(", ");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 20,
          messages: [
            {
              role: "system",
              content: `Eres un asistente médico. Basándote en los síntomas descritos, responde ÚNICAMENTE con el nombre exacto de UNA especialidad de esta lista: ${especialidadesString}. Si no estás seguro o no corresponde a ninguna, responde "Medicina Familiar".`
            },
            { role: "user", content: text }
          ]
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      const rawEsp = data.choices?.[0]?.message?.content?.trim() || "";
      
      // Validar que la especialidad esté en la lista disponible
      return availableSpecialties.includes(rawEsp) ? rawEsp : "Medicina Familiar";
    } catch (error) {
      console.error('[SPECIALTY_DETECTION_ERROR]:', error);
      return null;
    }
  }

  // Obtener insights del paciente
  analyzePatientInsights(text: string): PatientInsights {
    const textLower = text.toLowerCase();
    
    // Detectar urgencia
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (textLower.includes('urgente') || textLower.includes('grave') || textLower.includes('dolor fuerte')) {
      urgency = 'high';
    } else if (textLower.includes('molesto') || textLower.includes('preocupado')) {
      urgency = 'medium';
    }

    // Detectar estado emocional
    let emotionalState = 'neutral';
    if (textLower.includes('preocupado') || textLower.includes('ansioso')) {
      emotionalState = 'worried';
    } else if (textLower.includes('dolor') || textLower.includes('molesto')) {
      emotionalState = 'uncomfortable';
    }

    // Extraer síntomas
    const symptoms = this.extractSymptoms(text);

    return {
      urgency,
      emotionalState,
      symptoms
    };
  }

  // Extraer síntomas del texto
  private extractSymptoms(text: string): string[] {
    const commonSymptoms = [
      'dolor', 'molestia', 'picazón', 'ardor', 'hinchazón',
      'fiebre', 'tos', 'fatiga', 'mareo', 'náusea'
    ];
    
    const textLower = text.toLowerCase();
    return commonSymptoms.filter(symptom => textLower.includes(symptom));
  }
}

// Instancia singleton del servicio
export const medicalIntelligence = new MedicalIntelligenceService();