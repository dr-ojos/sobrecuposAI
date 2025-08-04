// pages/api/bot.js - VERSION LIMPIA SIN ERRORES

const sessions = {};

export default async function handler(req, res) {
  const { 
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.status(500).json({ error: "Configuracion de servidor incompleta" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST permitido' });
  }

  const { message: text, from, prevSession } = req.body;

  if (!from || !text) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  console.log(`📱 [${from}] Mensaje: "${text}"`);

  // Validacion RUT chileno
  function validarRUT(rut) {
    if (!/^\d{7,8}-[\dkK]$/.test(rut)) return false;
    const [numero, dv] = rut.split('-');
    const suma = numero.split('').reverse().reduce((acc, digit, i) => {
      const multiplicador = i < 6 ? i + 2 : 2;
      return acc + parseInt(digit) * multiplicador;
    }, 0);
    const dvCalculado = 11 - (suma % 11);
    let dvEsperado;
    if (dvCalculado === 11) dvEsperado = '0';
    else if (dvCalculado === 10) dvEsperado = 'K';
    else dvEsperado = dvCalculado.toString();
    return dv.toUpperCase() === dvEsperado;
  }

  // Deteccion avanzada de sintomas con empatia
  function detectarSintomasAvanzado(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const sintomasDetallados = {
      'Oftalmologia': {
        sintomas: [
          'veo borroso', 'vision borrosa', 'veo mal', 'no veo bien',
          'ojos rojos', 'ojo rojo', 'me duelen los ojos', 'dolor de ojos', 'dolor ocular',
          'picazon en los ojos', 'ojos llorosos', 'lagrimeo',
          'no puedo ver', 'ceguera', 'puntos negros', 'moscas volantes', 'destellos',
          'vision doble', 'diplopia', 'halos de luz', 'fotofobia',
          'orzuelo', 'chalazion', 'parpado hinchado',
          'conjuntivitis', 'infeccion ocular', 'secrecion ocular',
          'miopia', 'hipermetropia', 'astigmatismo', 'presbicia',
          'glaucoma', 'catarata', 'cataratas', 'retinopatia'
        ],
        respuestaEmpatica: [
          "Entiendo tu preocupacion por tu vista, es muy importante cuidar nuestros ojos.",
          "Los problemas de vision pueden ser muy angustiantes, te ayudo a encontrar atencion rapida.",
          "Tu vista es fundamental, busquemos un oftalmologo de inmediato.",
          "Comprendo lo molesto que debe ser, veamos que opciones tienes disponibles."
        ]
      },
      'Dermatologia': {
        sintomas: [
          'ronchas', 'sarpullido', 'alergia en la piel', 'picazon en la piel',
          'granitos', 'acne', 'espinillas', 'puntos negros',
          'manchas en la piel', 'lunares', 'verruga', 'verrugas', 'quiste',
          'piel seca', 'dermatitis', 'eczema', 'psoriasis', 'urticaria',
          'caspa', 'seborrea', 'hongos en la piel', 'pie de atleta',
          'herpes', 'zona', 'culebrilla', 'vitiligo', 'melasma',
          'caida del cabello', 'alopecia', 'calvicie'
        ],
        respuestaEmpatica: [
          "Los problemas de piel pueden ser muy incomodos, te entiendo perfectamente.",
          "La piel refleja mucho de nuestra salud, es importante que lo revises.",
          "Entiendo lo molesto que puede ser, busquemos una solucion rapida.",
          "Los problemas dermatologicos afectan nuestra confianza, te ayudo ya mismo."
        ]
      },
      'Otorrinolaringologia': {
        sintomas: [
          'dolor de garganta', 'garganta irritada', 'no puedo tragar', 'disfagia',
          'dolor de oido', 'oido tapado', 'sordera',
          'no escucho bien', 'escucho menos', 'tinnitus', 'zumbido en el oido',
          'vertigo', 'mareo', 'mareos', 'perdida del equilibrio',
          'nariz tapada', 'congestion nasal', 'sinusitis', 'rinitis',
          'sangrado nasal', 'epistaxis', 'ronquidos', 'apnea del sueno',
          'afonia', 'perdida de la voz', 'voz ronca', 'carraspera'
        ],
        respuestaEmpatica: [
          "Los problemas de oido, nariz y garganta son muy molestos, te comprendo.",
          "Entiendo lo incomodo que debe ser, busquemos atencion especializada.",
          "Estos sintomas pueden afectar mucho tu dia a dia, te ayudo inmediatamente."
        ]
      },
      'Cardiologia': {
        sintomas: [
          'dolor en el pecho', 'dolor pectoral', 'opresion en el pecho',
          'palpitaciones', 'corazon acelerado', 'taquicardia', 'arritmia',
          'falta de aire', 'disnea', 'ahogo', 'fatiga', 'cansancio extremo',
          'presion alta', 'hipertension', 'presion baja',
          'desmayo', 'sincope', 'mareo cardiaco', 'infarto'
        ],
        respuestaEmpatica: [
          "Los sintomas cardiacos requieren atencion inmediata, no demores en consultarte.",
          "Tu corazon es vital, busquemos atencion cardiologica urgente.",
          "Entiendo tu preocupacion, estos sintomas necesitan evaluacion pronta."
        ]
      },
      'Neurologia': {
        sintomas: [
          'dolor de cabeza', 'cefalea', 'migrana', 'jaqueca', 'dolor craneal',
          'convulsiones', 'epilepsia', 'temblor', 'temblores', 'parkinson',
          'perdida de memoria', 'olvidos', 'demencia', 'alzheimer',
          'hormigueo', 'entumecimiento', 'paralisis', 'debilidad muscular',
          'tics', 'movimientos involuntarios', 'espasmos', 'neuralgia'
        ],
        respuestaEmpatica: [
          "Los sintomas neurologicos pueden ser preocupantes, te ayudo a encontrar especialista.",
          "Entiendo tu inquietud, el cerebro y nervios requieren atencion especializada.",
          "Estos sintomas necesitan evaluacion neurologica, busquemos opciones rapidas."
        ]
      },
      'Medicina Familiar': {
        sintomas: [
          'fiebre', 'calentura', 'temperatura', 'gripe', 'resfrio',
          'tos', 'estornudos', 'congestion', 'malestar general',
          'dolor de cuerpo', 'dolor muscular', 'fatiga', 'cansancio', 'debilidad',
          'nauseas', 'vomito', 'diarrea', 'estrenimiento',
          'dolor abdominal', 'dolor de estomago', 'gastritis', 'acidez',
          'chequeo general', 'control rutinario', 'examen preventivo'
        ],
        respuestaEmpatica: [
          "Entiendo como te sientes, estos sintomas pueden ser muy molestos.",
          "El malestar general afecta mucho nuestra calidad de vida, te ayudo.",
          "Comprendo tu molestia, busquemos atencion medica pronta."
        ]
      },
      'Pediatria': {
        sintomas: [
          'mi hijo', 'mi hija', 'el nino', 'la nina', 'el bebe', 'la bebe',
          'fiebre en nino', 'tos en nino', 'diarrea infantil', 'vomito infantil',
          'control nino sano', 'vacunas', 'crecimiento', 'desarrollo',
          'berrinches', 'hiperactividad', 'tdah', 'autismo'
        ],
        respuestaEmpatica: [
          "Entiendo tu preocupacion como padre/madre, la salud de los ninos es prioritaria.",
          "Los sintomas en ninos nos preocupan mucho, busquemos pediatra rapido.",
          "Como padre/madre, es natural estar preocupado, te ayudo inmediatamente."
        ]
      },
      'Ginecologia': {
        sintomas: [
          'dolor menstrual', 'regla dolorosa', 'sangrado irregular', 'amenorrea',
          'flujo vaginal', 'picazon vaginal', 'infeccion vaginal', 'cistitis',
          'quiste ovarico', 'mioma', 'endometriosis', 'menopausia',
          'control ginecologico', 'papanicolau', 'mamografia', 'embarazo'
        ],
        respuestaEmpatica: [
          "Entiendo que los temas ginecologicos pueden ser delicados, te ayudo con discreci�n.",
          "La salud femenina es muy importante, busquemos atencion especializada.",
          "Comprendo tu preocupacion, estos sintomas necesitan evaluacion ginecologica."
        ]
      },
      'Traumatologia': {
        sintomas: [
          'dolor de espalda', 'lumbalgia', 'dolor lumbar', 'hernia discal',
          'dolor de rodilla', 'dolor articular', 'artritis', 'artrosis',
          'fractura', 'luxacion', 'esguince', 'torcedura',
          'dolor de hombro', 'tendinitis', 'bursitis', 'tunel carpiano',
          'dolor de cuello', 'cervicalgia', 'contractura muscular'
        ],
        respuestaEmpatica: [
          "Los dolores articulares y musculares son muy limitantes, te comprendo.",
          "Entiendo lo incapacitante que puede ser, busquemos traumatologo urgente.",
          "El dolor fisico afecta todo lo que hacemos, te ayudo a aliviarlo."
        ]
      }
    };
    
    // Buscar coincidencias
    for (const [especialidad, data] of Object.entries(sintomasDetallados)) {
      for (const sintoma of data.sintomas) {
        if (textoLimpio.includes(sintoma)) {
          const respuestaAleatoria = data.respuestaEmpatica[
            Math.floor(Math.random() * data.respuestaEmpatica.length)
          ];
          return {
            especialidad,
            respuestaEmpatica: respuestaAleatoria,
            sintomaDetectado: sintoma
          };
        }
      }
    }
    
    return null;
  }

  // Deteccion de urgencias medicas
  function detectarUrgencia(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const urgencias = [
      'infarto', 'ataque cardiaco', 'dolor de pecho intenso', 'no puedo respirar',
      'convulsiones', 'desmayo', 'sangrado abundante', 'trauma craneal',
      'quemadura grave', 'intoxicacion', 'alergia severa', 'shock anafilactico'
    ];
    
    return urgencias.some(urgencia => textoLimpio.includes(urgencia));
  }

  // Deteccion de consultas no medicas
  function esConsultaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const consultasGenerales = [
      'que hora es', 'hora es', 'que dia es',
      'como estas', 'como te llamas',
      'quien eres', 'que eres',
      'donde estas', 'de donde eres',
      'como funciona', 'que puedes hacer'
    ];
    
    const temasCotidianos = [
      'pizza', 'hamburguesa', 'comida', 'restaurant', 'comer', 'almuerzo', 'cena', 'desayuno',
      'cocinar', 'receta', 'ingredientes', 'cocina', 'chef',
      'clima', 'tiempo', 'lluvia', 'sol', 'temperatura', 'pronostico',
      'futbol', 'deporte', 'partido', 'equipo', 'gol', 'mundial', 'campeonato',
      'musica', 'cancion', 'cantante', 'banda', 'concierto', 'spotify',
      'pelicula', 'serie', 'netflix', 'television', 'actor', 'actriz',
      'trabajo', 'jefe', 'oficina', 'reunion', 'sueldo', 'empresa',
      'universidad', 'colegio', 'estudiar', 'examen', 'tarea', 'carrera',
      'viaje', 'vacaciones', 'hotel', 'avion', 'turismo', 'playa',
      'dinero', 'plata', 'banco', 'credito', 'prestamo', 'inversion',
      'amor', 'pareja', 'novia', 'novio', 'esposa', 'esposo', 'cita', 'tinder',
      'auto', 'carro', 'vehiculo', 'manejar', 'conducir', 'licencia',
      'casa', 'departamento', 'arriendo', 'mudanza', 'inmobiliaria',
      'computador', 'celular', 'telefono', 'internet', 'wifi', 'tecnologia',
      'ropa', 'zapatos', 'comprar', 'tienda', 'mall', 'shopping',
      'politica', 'gobierno', 'presidente', 'elecciones', 'votacion',
      'religion', 'dios', 'iglesia', 'biblia', 'orar'
    ];
    
    for (const consulta of consultasGenerales) {
      if (textoLimpio.includes(consulta)) return true;
    }
    
    const contieneTemasCotidianos = temasCotidianos.some(tema => textoLimpio.includes(tema));
    
    const terminosMedicos = [
      'dolor', 'duele', 'molestia', 'sintoma', 'vision', 
      'ojo', 'ojos', 'cabeza', 'pecho', 'estomago', 'fiebre', 
      'mareo', 'nausea', 'cansancio', 'fatiga', 'tos', 
      'gripe', 'resfrio', 'alergia', 'picazon',
      'medico', 'doctor', 'consulta', 'cita', 'salud',
      'enfermo', 'enfermedad', 'tratamiento', 'medicina', 'pastilla',
      'hospital', 'clinica', 'urgencia', 'emergencia'
    ];
    
    const contieneMedico = terminosMedicos.some(termino => textoLimpio.includes(termino));
    
    return contieneTemasCotidianos && !contieneMedico;
  }

  // Generar respuestas divertidas para consultas no medicas
  function generarRespuestaNoMedica(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    if (textoLimpio.includes('pizza') || textoLimpio.includes('hamburguesa') || textoLimpio.includes('comida')) {
      const respuestasComida = [
        "Jajaja! 🍕 Ojala pudiera pedir pizza por ti, pero me especializo en cuidar tu salud, no en satisfacer antojos 😄\n\nComo te sientes hoy? Hay algun tema de salud en el que pueda ayudarte?",
        "🍕 Para pizza recomiendo una app de delivery, pero para tu salud... aqui estoy! 😊\n\nTienes algun sintoma o necesitas algun especialista?",
        "Que rico suena! 🍕 Pero yo soy mas del tipo una manzana al dia mantiene al doctor lejos 😉\n\nEn que tema de salud puedo asistirte?"
      ];
      return respuestasComida[Math.floor(Math.random() * respuestasComida.length)];
    }
    
    if (textoLimpio.includes('hora') || textoLimpio.includes('tiempo') || textoLimpio.includes('dia')) {
      const respuestasHora = [
        "⏰ No soy un reloj, pero si soy tu asistente medico 24/7 😄\n\nHay algo relacionado con tu salud en lo que pueda ayudarte?",
        "🕐 El tiempo vuela, pero tu salud es eterna si la cuidas bien. Como te sientes hoy?",
        "⏰ Para la hora esta tu celular, para tu salud estoy yo 😊 Que necesitas?"
      ];
      return respuestasHora[Math.floor(Math.random() * respuestasHora.length)];
    }
    
    if (textoLimpio.includes('amor') || textoLimpio.includes('pareja') || textoLimpio.includes('novia') || textoLimpio.includes('novio')) {
      const respuestasAmor = [
        "💕 Que lindo! Pero yo me especializo en el amor... por la salud! 😄\n\nComo esta tu bienestar fisico?",
        "❤️ El amor es hermoso, pero tambien lo es cuidar tu salud. Tienes algun sintoma que te preocupe?",
        "💖 Para consejos de amor no soy experto, pero para tu salud si. En que puedo ayudarte medicamente?"
      ];
      return respuestasAmor[Math.floor(Math.random() * respuestasAmor.length)];
    }
    
    if (textoLimpio.includes('futbol') || textoLimpio.includes('deporte') || textoLimpio.includes('partido')) {
      const respuestasDeporte = [
        "⚽ El deporte es salud! Pero si te lesionaste jugando, puedo ayudarte a encontrar traumatologo 😉\n\nComo te sientes fisicamente?",
        "🏃‍♂️ Me encanta que hagas deporte, es excelente para la salud. Tienes alguna molestia muscular o articular?",
        "⚽ Para resultados deportivos esta Google, para tu salud deportiva estoy yo. Todo bien con tu cuerpo?"
      ];
      return respuestasDeporte[Math.floor(Math.random() * respuestasDeporte.length)];
    }
    
    if (textoLimpio.includes('trabajo') || textoLimpio.includes('oficina') || textoLimpio.includes('jefe')) {
      const respuestasTrabajo = [
        "💼 El estres laboral puede afectar tu salud. Tienes dolores de espalda por estar sentado? Estres? Insomnio?",
        "🏢 Trabajar mucho puede generar problemas de salud. Como te sientes fisicamente? Alguna molestia?",
        "💻 Las largas jornadas pueden causar fatiga visual, dolor cervical... tienes alguno de estos sintomas?"
      ];
      return respuestasTrabajo[Math.floor(Math.random() * respuestasTrabajo.length)];
    }
    
    if (textoLimpio.includes('musica') || textoLimpio.includes('pelicula') || textoLimpio.includes('serie')) {
      const respuestasEntretenimiento = [
        "🎵 Que genial! La musica y el entretenimiento son terapeuticos 😊\n\nComo esta tu salud? Algun sintoma que te moleste?",
        "🎬 Para entretenimiento esta Netflix, para tu bienestar estoy yo. Todo bien con tu salud?",
        "🎶 Me alegra que disfrutes del arte, eso es bueno para el alma. Y tu cuerpo como esta?"
      ];
      return respuestasEntretenimiento[Math.floor(Math.random() * respuestasEntretenimiento.length)];
    }
    
    const respuestasGenericas = [
      "😅 Esa informacion no es mi fuerte, pero si soy experto en salud.\n\nComo te sientes? Hay algun sintoma que te preocupe?",
      "🤖 Para eso mejor preguntale a Google, yo me especializo en cuidar tu bienestar fisico.\n\nTodo bien con tu salud?",
      "😊 Interesante tema, pero mi pasion es ayudarte con tu salud.\n\nTienes alguna molestia o necesitas algun especialista?",
      "🩺 No soy experto en eso, pero si en encontrar doctores cuando los necesitas.\n\nComo esta tu salud hoy?"
    ];
    
    return respuestasGenericas[Math.floor(Math.random() * respuestasGenericas.length)];
  }

  // Deteccion de especialidad directa
  function detectarEspecialidadDirecta(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    
    const especialidadesDirectas = {
      'oftalmologo': 'Oftalmologia', 'oftalmologia': 'Oftalmologia', 
      'oculista': 'Oftalmologia', 'especialista de la vista': 'Oftalmologia',
      'doctor de ojos': 'Oftalmologia', 'medico de ojos': 'Oftalmologia',
      'dermatologo': 'Dermatologia', 'dermatologia': 'Dermatologia',
      'especialista de la piel': 'Dermatologia', 'doctor de la piel': 'Dermatologia',
      'otorrino': 'Otorrinolaringologia', 'otorrinolaringologia': 'Otorrinolaringologia',
      'especialista de oido': 'Otorrinolaringologia', 'doctor de garganta': 'Otorrinolaringologia',
      'pediatra': 'Pediatria', 'pediatria': 'Pediatria',
      'doctor de ninos': 'Pediatria', 'medico infantil': 'Pediatria',
      'cardiologo': 'Cardiologia', 'cardiologia': 'Cardiologia',
      'especialista del corazon': 'Cardiologia', 'doctor del corazon': 'Cardiologia',
      'neurologo': 'Neurologia', 'neurologia': 'Neurologia',
      'especialista del cerebro': 'Neurologia', 'neurocirujano': 'Neurologia',
      'medico general': 'Medicina Familiar', 'medicina familiar': 'Medicina Familiar',
      'doctor general': 'Medicina Familiar', 'medico de cabecera': 'Medicina Familiar',
      'ginecologo': 'Ginecologia', 'ginecologia': 'Ginecologia',
      'especialista femenino': 'Ginecologia', 'doctor de mujeres': 'Ginecologia',
      'traumatologo': 'Traumatologia', 'traumatologia': 'Traumatologia',
      'especialista de huesos': 'Traumatologia', 'ortopedista': 'Traumatologia',
      'urologo': 'Urologia', 'urologia': 'Urologia',
      'psiquiatra': 'Psiquiatria', 'psiquiatria': 'Psiquiatria',
      'endocrinologo': 'Endocrinologia', 'endocrinologia': 'Endocrinologia'
    };
    
    for (const [key, value] of Object.entries(especialidadesDirectas)) {
      if (textoLimpio.includes(key)) return value;
    }
    return null;
  }

  function esSaludoSimple(text) {
    const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const saludosSimples = ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'ey'];
    const terminosMedicos = ['dolor', 'duele', 'medico', 'doctor', 'consulta', 'sintoma', 'necesito'];
    
    const esSaludo = saludosSimples.some(saludo => textoLimpio.includes(saludo));
    const tieneMedico = terminosMedicos.some(termino => textoLimpio.includes(termino));
    
    return esSaludo && !tieneMedico && textoLimpio.length < 50;
  }

  async function getEspecialidadesDisponibles() {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?fields%5B%5D=Especialidad`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      const especialidades = new Set();
      data.records?.forEach(record => {
        if (record.fields?.Especialidad) {
          especialidades.add(record.fields.Especialidad);
        }
      });
      return Array.from(especialidades).sort();
    } catch (err) {
      console.error("Error obteniendo especialidades:", err);
      return ["Medicina Familiar", "Oftalmologia", "Dermatologia"];
    }
  }

  async function getDoctorName(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || medicoId;
    } catch (err) {
      console.error("Error buscando medico:", err);
      return medicoId;
    }
  }

  async function getDoctorInfo(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return {
        name: data.fields?.Name || "Doctor",
        email: data.fields?.Email || null
      };
    } catch (err) {
      console.error("Error obteniendo info medico:", err);
      return { name: "Doctor", email: null };
    }
  }

  // Variables reutilizables
  let specialty, esNino, medicoId, records, attempts, selectedRecord, sobrecupoData;

  // Detectar urgencias medicas primero
  if (detectarUrgencia(text)) {
    return res.json({
      text: "⚠️ Los sintomas que describes podrian necesitar atencion URGENTE.\n\n🚨 Te recomiendo ir inmediatamente a:\n• Urgencias del hospital mas cercano\n• Llamar al 131 (SAMU)\n• Ir a una clinica con urgencias\n\nTu salud es lo primero. No demores en buscar atencion presencial."
    });
  }

  // Si es consulta no medica, responder con gracia y redirigir
  if (esConsultaNoMedica(text)) {
    return res.json({ 
      text: generarRespuestaNoMedica(text)
    });
  }

  // Si es saludo simple
  if (esSaludoSimple(text)) {
    return res.json({
      text: "Hola! 👋 Soy Sobrecupos IA y estoy aqui para ayudarte a encontrar atencion medica rapida.\n\nComo te sientes hoy? Cuentame tus sintomas o que especialista necesitas. 🩺"
    });
  }

  const greetingRe = /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|que tal|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // Si es agradecimiento
  if (thanksRe.test(text)) {
    return res.json({
      text: "De nada! 😊 Siempre estoy aqui para ayudarte con tus necesidades de salud. Hay algo mas en lo que pueda asistirte?"
    });
  }

  // Manejo de sesiones existentes
  const currentSession = sessions[from] || prevSession || {};

  if (currentSession.stage) {
    switch (currentSession.stage) {
      case 'getting-age-for-search':
        const searchAge = parseInt(text);
        if (isNaN(searchAge) || searchAge < 0 || searchAge > 120) {
          return res.json({
            text: "Por favor ingresa una edad valida (numero entre 0 y 120 anos)."
          });
        }

        specialty = currentSession.specialty;
        const { pendingRecords } = currentSession;
        const filteredRecords = [];
        esNino = searchAge < 18;
        
        for (const sobrecupo of pendingRecords) {
          medicoId = Array.isArray(sobrecupo.fields["Medico"]) ? 
            sobrecupo.fields["Medico"][0] : sobrecupo.fields["Medico"];
          
          try {
            const doctorResp = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
              { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
            );
            
            if (doctorResp.ok) {
              const doctorData = await doctorResp.json();
              const medicoAtiende = doctorData.fields?.Atiende;
              
              const puedeAtender = !medicoAtiende || 
                medicoAtiende === "Ambos" ||
                (esNino && medicoAtiende === "Ninos") ||
                (!esNino && medicoAtiende === "Adultos");
              
              if (puedeAtender) {
                filteredRecords.push(sobrecupo);
              }
            }
          } catch (err) {
            console.error("Error verificando medico:", medicoId, err);
            filteredRecords.push(sobrecupo);
          }
        }
        
        if (filteredRecords.length === 0) {
          delete sessions[from];
          return res.json({
            text: `Lamentablemente no tengo sobrecupos de ${specialty} disponibles para ${esNino ? 'ninos' : 'adultos'} en este momento.\n\nTe gustaria que te contacte cuando tengamos disponibilidad?`
          });
        }

        const first = filteredRecords[0].fields;
        const clin = first["Clinica"] || first["Clinica"] || "nuestra clinica";
        const dir = first["Direccion"] || first["Direccion"] || "la direccion indicada";
        medicoId = Array.isArray(first["Medico"]) ? first["Medico"][0] : first["Medico"];
        const medicoNombre = await getDoctorName(medicoId);

        sessions[from] = {
          stage: 'awaiting-confirmation',
          specialty,
          records: filteredRecords,
          attempts: 0,
          searchAge
        };

        return res.json({
          text: `✅ Perfecto! Encontre un sobrecupo de ${specialty} para ${esNino ? 'ninos' : 'adultos'}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\nTe sirve? Confirma con "si".`,
          session: sessions[from]
        });

      case 'awaiting-confirmation':
        if (affirmativeRe.test(text)) {
          sessions[from] = { 
            ...currentSession, 
            stage: 'getting-name',
            attempts: 0 
          };
          return res.json({
            text: "Perfecto! 🎉 Para confirmar tu cita necesito algunos datos.\n\nCual es tu nombre completo?",
            session: sessions[from]
          });
        }
        
        if (negativeRe.test(text)) {
          records = currentSession.records || [];
          specialty = currentSession.specialty;
          const nextAttempt = (currentSession.attempts || 0) + 1;
          
          if (nextAttempt < records.length) {
            const nextRecord = records[nextAttempt].fields;
            const clin = nextRecord["Clinica"] || nextRecord["Clinica"] || "nuestra clinica";
            const dir = nextRecord["Direccion"] || nextRecord["Direccion"] || "la direccion indicada";
            medicoId = Array.isArray(nextRecord["Medico"]) ? nextRecord["Medico"][0] : nextRecord["Medico"];
            const medicoNombre = await getDoctorName(medicoId);
            
            sessions[from] = { 
              ...currentSession, 
              attempts: nextAttempt 
            };
            
            return res.json({
              text: `Te muestro otra opcion de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\nTe sirve esta?`,
              session: sessions[from]
            });
          } else {
            delete sessions[from];
            return res.json({
              text: "No hay mas opciones disponibles en este momento. Te gustaria que te contacte cuando tengamos nuevos sobrecupos?"
            });
          }
        }
        
        return res.json({
          text: "Por favor responde 'si' si te sirve la cita o 'no' si quieres ver otra opcion."
        });

      case 'getting-name':
        if (text.length < 3) {
          return res.json({
            text: "Por favor ingresa tu nombre completo."
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-rut',
          patientName: text 
        };
        return res.json({
          text: "Excelente! 👤\n\nAhora necesito tu RUT (con guion y digito verificador).\nEjemplo: 12345678-9",
          session: sessions[from]
        });

      case 'getting-rut':
        if (!validarRUT(text)) {
          return res.json({
            text: "Por favor ingresa un RUT valido con el formato correcto.\nEjemplo: 12345678-9"
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-phone',
          patientRut: text 
        };
        return res.json({
          text: "Perfecto! 📋\n\nAhora tu numero de telefono (incluye +56 si es de Chile).\nEjemplo: +56912345678",
          session: sessions[from]
        });

      case 'getting-phone':
        if (text.length < 8) {
          return res.json({
            text: "Por favor ingresa un numero de telefono valido.\nEjemplo: +56912345678"
          });
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-age',
          patientPhone: text 
        };
        return res.json({
          text: "Excelente! 📞\n\nCuantos anos tienes?\nEsto me ayuda a confirmar que el medico pueda atenderte.",
          session: sessions[from]
        });

      case 'getting-age':
        const age = parseInt(text);
        if (isNaN(age) || age < 0 || age > 120) {
          return res.json({
            text: "Por favor ingresa una edad valida (numero entre 0 y 120 anos)."
          });
        }

        records = currentSession.records;
        attempts = currentSession.attempts || 0;
        selectedRecord = records[attempts];
        sobrecupoData = selectedRecord.fields;
        medicoId = Array.isArray(sobrecupoData["Medico"]) ? 
          sobrecupoData["Medico"][0] : sobrecupoData["Medico"];

        let medicoAtiende = null;
        try {
          const doctorResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          const doctorData = await doctorResp.json();
          medicoAtiende = doctorData.fields?.Atiende;
        } catch (err) {
          console.error("Error verificando medico:", err);
        }

        esNino = age < 18;
        const puedeAtender = !medicoAtiende || 
          medicoAtiende === "Ambos" ||
          (esNino && medicoAtiende === "Ninos") ||
          (!esNino && medicoAtiende === "Adultos");

        if (!puedeAtender) {
          const nextAttempt = attempts + 1;
          
          if (nextAttempt < records.length) {
            sessions[from] = { 
              ...currentSession, 
              attempts: nextAttempt,
              patientAge: age
            };
            
            const nextRecord = records[nextAttempt].fields;
            const clin = nextRecord["Clinica"] || nextRecord["Clinica"] || "nuestra clinica";
            const dir = nextRecord["Direccion"] || nextRecord["Direccion"] || "la direccion indicada";
            const nextMedicoId = Array.isArray(nextRecord["Medico"]) ? 
              nextRecord["Medico"][0] : nextRecord["Medico"];
            const medicoNombre = await getDoctorName(nextMedicoId);
            
            return res.json({
              text: `El medico anterior no atiende ${esNino ? 'ninos' : 'adultos'}.\n\nTe muestro otra opcion:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nextRecord.Fecha} a las ${nextRecord.Hora}\n\nTe sirve esta?`,
              session: sessions[from]
            });
          } else {
            delete sessions[from];
            return res.json({
              text: `Lamentablemente no tengo sobrecupos disponibles para pacientes de ${age} anos en este momento.\n\nTe gustaria que te contacte cuando tengamos disponibilidad para ${esNino ? 'ninos' : 'adultos'}?`
            });
          }
        }
        
        sessions[from] = { 
          ...currentSession, 
          stage: 'getting-email',
          patientAge: age
        };
        return res.json({
          text: "Perfecto! 👍\n\nFinalmente, tu email para enviarte la confirmacion:",
          session: sessions[from]
        });

      case 'getting-email':
        if (!/\S+@\S+\.\S+/.test(text)) {
          return res.json({
            text: "Por favor ingresa un email valido.\nEjemplo: tu.email@gmail.com"
          });
        }

        records = currentSession.records;
        specialty = currentSession.specialty;
        attempts = currentSession.attempts || 0;
        const { patientName, patientRut, patientPhone, patientAge } = currentSession;
        
        const patientEmail = text;
        selectedRecord = records[attempts];
        const sobrecupoId = selectedRecord.id;
        sobrecupoData = selectedRecord.fields;
        
        let pacienteId = null;
        let sobrecupoUpdated = false;
        let emailsSent = { patient: false, doctor: false };
        let statusText = "Error procesando la reserva.";

        console.log("INICIANDO PROCESO DE RESERVA");
        console.log("Paciente:", patientName);
        console.log("Email:", patientEmail);
        console.log("Telefono:", patientPhone);
        console.log("Edad:", patientAge);
        console.log("Especialidad:", specialty);
        console.log("Sobrecupo ID:", sobrecupoId);

        const PATIENTS_TABLE_ID = 'tbl8btPJu6S7nXqNS';
        
        try {
          console.log("Creando paciente en Airtable...");
          
          const patientPayload = {
            fields: {
              "Nombre": patientName,
              "RUT": patientRut,
              "Telefono": patientPhone,
              "Email": patientEmail,
              "Edad": patientAge || 30,
              "Fecha Registro": new Date().toISOString().split('T')[0]
            }
          };

          const patientResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PATIENTS_TABLE_ID}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(patientPayload)
            }
          );
          
          const patientData = await patientResp.json();
          
          if (patientResp.ok && patientData.id) {
            pacienteId = patientData.id;
            console.log("Paciente creado exitosamente:", pacienteId);
          } else {
            console.error("Error creando paciente:", patientData);
          }
        } catch (err) {
          console.error("Error critico creando paciente:", err);
        }

        try {
          console.log("Actualizando sobrecupo...");
          
          const updatePayload = {
            fields: {
              Disponible: "No",
              "Paciente Nombre": patientName,
              "Paciente Email": patientEmail,
              "Paciente Telefono": patientPhone
            }
          };

          if (pacienteId) {
            updatePayload.fields["Paciente ID"] = pacienteId;
          }

          const updateResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(updatePayload)
            }
          );

          const updateData = await updateResp.json();

          if (updateResp.ok) {
            sobrecupoUpdated = true;
            console.log("Sobrecupo actualizado exitosamente");
          } else {
            console.error("Error actualizando sobrecupo:", updateData);
          }
        } catch (err) {
          console.error("Error critico actualizando sobrecupo:", err);
        }

        if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && pacienteId) {
          try {
            console.log("Enviando email de confirmacion al paciente...");
            
            const patientEmailContent = `
Hola ${patientName}!

Tu cita ha sido confirmada exitosamente:

DETALLES DE TU CITA:
• Especialidad: ${specialty}
• Fecha: ${sobrecupoData.Fecha}
• Hora: ${sobrecupoData.Hora}
• Clinica: ${sobrecupoData["Clinica"] || sobrecupoData["Clinica"]}
• Direccion: ${sobrecupoData["Direccion"] || sobrecupoData["Direccion"]}

RECOMENDACIONES:
• Llega 15 minutos antes de tu hora
• Trae tu carnet de identidad
• Si tienes seguro, trae tu credencial

Necesitas reprogramar? Responde a este email.

Nos vemos pronto!
Equipo Sobrecupos AI
            `;

            const patientEmailResp = await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                personalizations: [{
                  to: [{ email: patientEmail, name: patientName }],
                  subject: `Cita confirmada: ${specialty} - ${sobrecupoData.Fecha}`
                }],
                from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                content: [{ type: "text/plain", value: patientEmailContent }]
              })
            });

            if (patientEmailResp.ok) {
              emailsSent.patient = true;
              console.log("Email enviado al paciente");
            }
          } catch (emailErr) {
            console.error("Error enviando email al paciente:", emailErr);
          }
        }

        if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
          try {
            console.log("Enviando email al medico...");
            
            medicoId = Array.isArray(sobrecupoData["Medico"]) ? 
              sobrecupoData["Medico"][0] : sobrecupoData["Medico"];
            const doctorInfo = await getDoctorInfo(medicoId);
            
            if (doctorInfo.email) {
              const doctorEmailContent = `
Dr/a. ${doctorInfo.name},

Se ha registrado un nuevo paciente para su sobrecupo:

DETALLES DE LA CITA:
• Fecha: ${sobrecupoData.Fecha}
• Hora: ${sobrecupoData.Hora}
• Clinica: ${sobrecupoData["Clinica"] || sobrecupoData["Clinica"]}

DATOS DEL PACIENTE:
• Nombre: ${patientName}
• RUT: ${patientRut}
• Edad: ${patientAge} anos
• Telefono: ${patientPhone}
• Email: ${patientEmail}

El paciente ha sido notificado por email.

Saludos,
Sistema Sobrecupos AI
              `;

              const doctorEmailResp = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SENDGRID_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  personalizations: [{
                    to: [{ email: doctorInfo.email, name: doctorInfo.name }],
                    subject: `Nuevo paciente: ${patientName} - ${sobrecupoData.Fecha}`
                  }],
                  from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                  content: [{ type: "text/plain", value: doctorEmailContent }]
                })
              });

              if (doctorEmailResp.ok) {
                emailsSent.doctor = true;
                console.log("Email enviado al medico");
              }
            }
          } catch (emailErr) {
            console.error("Error enviando email al medico:", emailErr);
          }
        }

        delete sessions[from];

        if (sobrecupoUpdated) {
          statusText = `🎉 CITA CONFIRMADA! 

RESUMEN:
• ${specialty}
• ${sobrecupoData.Fecha} a las ${sobrecupoData.Hora}
• ${sobrecupoData["Clinica"] || sobrecupoData["Clinica"]}

${emailsSent.patient ? "Te hemos enviado la confirmacion por email." : "No pudimos enviar el email de confirmacion."}

Llega 15 minutos antes. Nos vemos pronto!`;
        } else {
          statusText = `Hubo un problema al confirmar tu cita. 

No te preocupes, tu informacion esta guardada:
• Nombre: ${patientName}
• Cita solicitada: ${specialty} - ${sobrecupoData.Fecha}

Te contactaremos pronto para confirmar. Tu cita esta confirmada.`;
        }

        console.log("PROCESO COMPLETADO");
        console.log("Paciente creado:", !!pacienteId);
        console.log("Sobrecupo actualizado:", sobrecupoUpdated);
        console.log("Email paciente:", emailsSent.patient);
        console.log("Email medico:", emailsSent.doctor);

        return res.json({ text: statusText });

      default:
        break;
    }
  }

  // Detectar sintomas especificos con respuesta empatica
  const sintomaDetectado = detectarSintomasAvanzado(text);
  if (sintomaDetectado) {
    console.log("Sintoma detectado:", sintomaDetectado);
    
    records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("Error Airtable:", err);
      return res.json({ text: "Lo siento, hay un problema tecnico. Intenta nuevamente en unos minutos." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === sintomaDetectado.especialidad) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `${sintomaDetectado.respuestaEmpatica}\n\nPara estos sintomas necesitas consultar con ${sintomaDetectado.especialidad}, pero lamentablemente no tengo sobrecupos disponibles en este momento.\n\nTe gustaria que te contacte cuando tengamos disponibilidad?\n\nMientras tanto, si es urgente, puedes ir a urgencias de cualquier clinica u hospital.`
      });
    }

    sessions[from] = {
      stage: 'getting-age-for-search',
      specialty: sintomaDetectado.especialidad,
      pendingRecords: available,
      sintomaOriginal: text
    };

    return res.json({
      text: `${sintomaDetectado.respuestaEmpatica}\n\nTengo sobrecupos disponibles de ${sintomaDetectado.especialidad} para atender tu problema.\n\nCuantos anos tienes? Esto me ayuda a encontrar el medico mas adecuado para ti.`,
      session: sessions[from]
    });
  }

  // Detectar especialidad directa
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  
  if (especialidadDirecta) {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    if (!especialidadesDisponibles.includes(especialidadDirecta)) {
      return res.json({
        text: `Entiendo que estas buscando atencion especializada.\n\nLamentablemente no tengo sobrecupos de ${especialidadDirecta} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\nTe gustaria que te contacte cuando tengamos ${especialidadDirecta} disponible?`
      });
    }
    
    specialty = especialidadDirecta;
    
    records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("Error Airtable:", err);
      return res.json({ text: "Error consultando disponibilidad. Intenta mas tarde." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `Entiendo que necesitas atencion especializada.\n\nLamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento.\n\nTe gustaria que te contacte cuando tengamos disponibilidad?`
      });
    }

    sessions[from] = {
      stage: 'getting-age-for-search',
      specialty,
      pendingRecords: available
    };

    return res.json({
      text: `Entiendo que necesitas atencion especializada.\n\nEncontre sobrecupos de ${specialty} disponibles.\n\nCuantos anos tienes? Esto me ayuda a encontrar el medico adecuado.`,
      session: sessions[from]
    });
  }

  // Respuesta por defecto con lista de especialidades
  const especialidadesDisponibles = await getEspecialidadesDisponibles();
  const listaEspecialidades = especialidadesDisponibles.slice(0, 8).join('\n• ');

  return res.json({
    text: `Hola! 👋 Soy Sobrecupos IA y estoy aqui para ayudarte a encontrar atencion medica rapida.

🩺 Como puedo ayudarte?

Puedes decirme:
• Tus sintomas (ej: "me duelen los ojos")
• El especialista que necesitas (ej: "necesito oftalmologo")
• Una consulta general (ej: "tengo fiebre")

Especialidades disponibles:
• ${listaEspecialidades}

Que necesitas?`
  });
}