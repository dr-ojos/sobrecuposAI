// Sistema inteligente de detección médica
// Mapeo completo de síntomas, condiciones y términos médicos a especialidades y áreas de interés

export const MEDICAL_KNOWLEDGE_BASE = {
  // OFTALMOLOGÍA - Mapeo detallado
  oftalmologia: {
    especialidad: "Oftalmología",
    areas: {
      "Córnea": {
        keywords: [
          'cornea', 'córnea', 'problema en la cornea', 'problema en la córnea',
          'dolor en la cornea', 'dolor en la córnea', 'cornea dañada', 'córnea dañada',
          'lesion cornea', 'lesión córnea', 'ulcera corneal', 'úlcera corneal',
          'queratitis', 'queratocono', 'erosion corneal', 'erosión corneal',
          'transplante de cornea', 'transplante de córnea', 'distrofia corneal'
        ],
        symptoms: [
          'dolor intenso en el ojo', 'sensibilidad extrema a la luz',
          'vision borrosa repentina', 'ojo muy rojo', 'lagrimeo excesivo'
        ]
      },
      "Retina": {
        keywords: [
          'retina', 'problema en la retina', 'desprendimiento de retina',
          'macula', 'mácula', 'problema de macula', 'problema de mácula',
          'degeneracion macular', 'degeneración macular', 'dmae',
          'retinopatia', 'retinopatía', 'retinopatia diabetica', 'retinopatía diabética',
          'agujero macular', 'membrana epirretiniana', 'vitrectomia', 'vitrectomía'
        ],
        symptoms: [
          'veo manchas flotantes', 'moscas volantes', 'destellos de luz',
          'cortina en la vision', 'vision distorsionada', 'lineas curvas',
          'punto ciego en el centro', 'perdida de vision central'
        ]
      },
      "Glaucoma": {
        keywords: [
          'glaucoma', 'presion ocular', 'presión ocular', 'tension ocular', 'tensión ocular',
          'presion intraocular', 'presión intraocular', 'pio alta', 'campo visual',
          'perdida de campo visual', 'pérdida de campo visual'
        ],
        symptoms: [
          'perdida de vision lateral', 'vision en tunel', 'dolor de cabeza intenso',
          'halos alrededor de las luces', 'nauseas y vomitos', 'ojo duro'
        ]
      },
      "Cataratas": {
        keywords: [
          'catarata', 'cataratas', 'operacion de cataratas', 'operación de cataratas',
          'cirugia de cataratas', 'cirugía de cataratas', 'nublado en el ojo',
          'cristalino opaco', 'lente intraocular'
        ],
        symptoms: [
          'vision nublada', 'vision borrosa', 'halos en las luces',
          'colores apagados', 'dificultad para ver de noche'
        ]
      },
      "Ojos Secos": {
        keywords: [
          'ojos secos', 'sequedad ocular', 'sindrome de ojo seco', 'síndrome de ojo seco',
          'lagrimas artificiales', 'lágrimas artificiales', 'ardor en los ojos'
        ],
        symptoms: [
          'sensacion de arena en los ojos', 'ardor ocular', 'picazon en los ojos',
          'lagrimeo paradojico', 'cansancio ocular', 'vision intermitente'
        ]
      },
      "Cirugía refractiva Láser": {
        keywords: [
          'laser', 'láser', 'cirugia laser', 'cirugía láser', 'lasik',
          'cirugia refractiva', 'cirugía refractiva', 'operacion de la vista',
          'operación de la vista', 'corregir miopia', 'corregir miopía',
          'prk', 'smile', 'femtolasik'
        ],
        symptoms: [
          'quiero operarme la vista', 'no quiero usar lentes',
          'miopia alta', 'miopía alta', 'astigmatismo alto'
        ]
      },
      "Uveítis": {
        keywords: [
          'uveitis', 'uveítis', 'inflamacion del ojo', 'inflamación del ojo',
          'ojo inflamado', 'iridociclitis', 'coroiditis'
        ],
        symptoms: [
          'dolor ocular intenso', 'fotofobia severa', 'vision borrosa',
          'pupila pequeña', 'ojo muy rojo'
        ]
      },
      // Sistema lagrimal
      "Sistema Lagrimal": {
        keywords: [
          'lagrimal', 'lagrimal tapado', 'conducto lagrimal', 'dacriocistitis',
          'obstruccion lagrimal', 'obstrucción lagrimal', 'lagrimeo constante',
          'via lagrimal', 'vía lagrimal', 'dacriocistorrinostomia'
        ],
        symptoms: [
          'lagrimeo constante', 'secrecion en el ojo', 'secreción en el ojo',
          'hinchazon en el lagrimal', 'hinchazón en el lagrimal',
          'dolor en el lagrimal', 'infeccion recurrente'
        ]
      }
    }
  },

  // DERMATOLOGÍA - Mapeo detallado
  dermatologia: {
    especialidad: "Dermatología",
    areas: {
      "Acné": {
        keywords: [
          'acne', 'acné', 'espinillas', 'granos', 'puntos negros', 'comedones',
          'quistes en la cara', 'cicatrices de acne', 'cicatrices de acné',
          'tratamiento para acne', 'isotretinoina', 'isotretinoína'
        ],
        symptoms: [
          'granos en la cara', 'espinillas en la espalda', 'piel grasa',
          'puntos blancos', 'inflamacion facial', 'cicatrices en la cara'
        ]
      },
      "Láser Dermatológico": {
        keywords: [
          'laser dermatologico', 'láser dermatológico', 'depilacion laser',
          'depilación láser', 'rejuvenecimiento facial', 'manchas en la piel',
          'melasma', 'pecas', 'lunares', 'verrugas', 'tatuajes'
        ],
        symptoms: [
          'quiero depilarme', 'eliminar manchas', 'quitar verrugas',
          'borrar tatuaje', 'rejuvenecer la piel'
        ]
      },
      "Psoriasis": {
        keywords: [
          'psoriasis', 'placas en la piel', 'escamas en la piel',
          'piel descamada', 'artritis psoriasica', 'artritis psoriásica'
        ],
        symptoms: [
          'placas rojas con escamas', 'picazon intensa', 'piel seca y agrietada',
          'dolor en las articulaciones', 'uñas con hoyos'
        ]
      },
      "Dermatitis": {
        keywords: [
          'dermatitis', 'eczema', 'dermatitis atopica', 'dermatitis atópica',
          'dermatitis de contacto', 'alergia en la piel', 'ronchas'
        ],
        symptoms: [
          'picazon severa', 'piel irritada', 'ronchas rojas',
          'hinchazon en la piel', 'ampolla', 'ampollas'
        ]
      }
    }
  },

  // CARDIOLOGÍA - Mapeo detallado
  cardiologia: {
    especialidad: "Cardiología",
    areas: {
      "Ecocardiografía": {
        keywords: [
          'ecocardiografia', 'ecocardiografía', 'ecocardio', 'eco del corazon',
          'eco del corazón', 'ultrasonido del corazon', 'ultrasonido del corazón'
        ],
        symptoms: [
          'necesito eco del corazon', 'revision del corazon', 'soplo cardiaco'
        ]
      },
      "Electrocardiografía": {
        keywords: [
          'electrocardiografia', 'electrocardiografía', 'ecg', 'ekg',
          'electrocardiograma', 'ritmo cardiaco'
        ],
        symptoms: [
          'palpitaciones', 'ritmo irregular', 'taquicardia', 'bradicardia'
        ]
      },
      "Holter": {
        keywords: [
          'holter', 'monitor cardiaco', 'monitor de 24 horas',
          'holter de presion', 'holter de presión', 'mapa'
        ],
        symptoms: [
          'palpitaciones intermitentes', 'mareos esporadicos',
          'desmayos ocasionales', 'arritmias'
        ]
      },
      "Hipertensión Arterial": {
        keywords: [
          'hipertension', 'hipertensión', 'presion alta', 'presión alta',
          'tension alta', 'tensión alta', 'medicamentos para la presion'
        ],
        symptoms: [
          'dolor de cabeza matutino', 'zumbido en los oidos',
          'vision borrosa', 'sangrado nasal'
        ]
      }
    }
  },

  // GASTROENTEROLOGÍA - Mapeo detallado
  gastroenterologia: {
    especialidad: "Gastroenterología",
    areas: {
      "Endoscopía Digestiva": {
        keywords: [
          'endoscopia', 'endoscopía', 'gastroscopia', 'examen del estomago',
          'examen del estómago', 'camara al estomago', 'cámara al estómago'
        ],
        symptoms: [
          'dolor de estomago', 'acidez severa', 'dificultad para tragar',
          'nauseas constantes', 'vomitos recurrentes'
        ]
      },
      "Colonoscopía": {
        keywords: [
          'colonoscopia', 'colonoscopía', 'examen del colon',
          'camara al intestino', 'cámara al intestino', 'polipectomia'
        ],
        symptoms: [
          'sangre en las heces', 'cambio en habitos intestinales',
          'dolor abdominal bajo', 'diarrea cronica'
        ]
      }
    }
  },

  // OTORRINOLARINGOLOGÍA - Mapeo detallado
  otorrinolaringologia: {
    especialidad: "Otorrinolaringología",
    areas: {
      "Oídos": {
        keywords: [
          'oidos', 'oídos', 'dolor de oido', 'dolor de oído', 'otitis',
          'cerumen', 'cera en el oido', 'cera en el oído',
          'perdida auditiva', 'pérdida auditiva', 'sordera'
        ],
        symptoms: [
          'dolor de oido intenso', 'supuracion del oido', 'zumbido en el oido',
          'perdida de audicion', 'sensacion de oido tapado'
        ]
      },
      "Vértigo y Mareos": {
        keywords: [
          'vertigo', 'vértigo', 'mareos', 'mareo', 'equilibrio',
          'inestabilidad', 'meniere', 'ménière', 'vppb'
        ],
        symptoms: [
          'sensacion de que todo gira', 'perdida del equilibrio',
          'nauseas con mareo', 'caidas frecuentes'
        ]
      }
    }
  }
};

// Función inteligente para detectar síntomas y áreas específicas
export function detectMedicalCondition(userText) {
  const text = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const results = [];
  
  // Buscar en todas las especialidades
  for (const [specialtyKey, specialtyData] of Object.entries(MEDICAL_KNOWLEDGE_BASE)) {
    for (const [areaName, areaData] of Object.entries(specialtyData.areas)) {
      let score = 0;
      let matchedTerms = [];
      
      // Buscar keywords exactas (peso alto)
      for (const keyword of areaData.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 10;
          matchedTerms.push(keyword);
        }
      }
      
      // Buscar síntomas (peso medio)
      for (const symptom of areaData.symptoms || []) {
        if (text.includes(symptom.toLowerCase())) {
          score += 5;
          matchedTerms.push(symptom);
        }
      }
      
      if (score > 0) {
        results.push({
          especialidad: specialtyData.especialidad,
          area: areaName,
          score: score,
          matchedTerms: matchedTerms,
          confidence: score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low'
        });
      }
    }
  }
  
  // Ordenar por score y devolver los mejores matches
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Top 3 matches
}

// Función para generar respuesta personalizada
export function generateMedicalResponse(detections, hasAvailability = false) {
  if (detections.length === 0) {
    return {
      message: "Cuéntame más sobre tus síntomas para poder ayudarte mejor.",
      specialty: null,
      area: null
    };
  }
  
  const best = detections[0];
  const area = best.area;
  const specialty = best.especialidad;
  
  let personalizedMessage = "";
  
  // Mensajes específicos por área
  const areaMessages = {
    "Córnea": "Entiendo tu preocupación con la córnea. Es importante que un especialista la evalúe.",
    "Retina": "Los problemas retinianos requieren atención especializada. Te ayudo a encontrar el especialista adecuado.",
    "Glaucoma": "El glaucoma es una condición seria que requiere monitoreo especializado.",
    "Sistema Lagrimal": "Los problemas del sistema lagrimal pueden ser muy molestos. Te conecto con un especialista.",
    "Acné": "Entiendo lo molesto que puede ser el acné. Te ayudo a encontrar tratamiento especializado.",
    "Láser Dermatológico": "Para tratamientos láser dermatológicos, necesitas un especialista experimentado.",
    "Holter": "Para estudios Holter necesitas un cardiólogo especializado en monitoreo cardíaco.",
    "Endoscopía Digestiva": "Los estudios endoscópicos requieren un gastroenterólogo especializado."
  };
  
  personalizedMessage = areaMessages[area] || `Te ayudo a encontrar un especialista en ${area}.`;
  
  if (hasAvailability) {
    return {
      message: `${personalizedMessage} ¡Perfecto! He encontrado médicos especialistas en ${area} con disponibilidad.`,
      specialty: specialty,
      area: area
    };
  } else {
    return {
      message: `${personalizedMessage} Déjame buscar especialistas en ${specialty} con experiencia en ${area}.`,
      specialty: specialty,
      area: area
    };
  }
}

export default { MEDICAL_KNOWLEDGE_BASE, detectMedicalCondition, generateMedicalResponse };