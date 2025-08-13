// Función para crear slugs amigables desde nombres de médicos
export function createDoctorSlug(doctorName) {
  if (!doctorName) return '';
  
  return doctorName
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales excepto espacios y guiones
    .trim()
    .replace(/\s+/g, '') // Remover todos los espacios
    .replace(/-+/g, '-') // Convertir múltiples guiones en uno solo
    .replace(/^-+|-+$/g, ''); // Remover guiones del inicio y final
}

// Función para revertir slug a nombre (para buscar en la base de datos)
export function slugToSearchTerms(slug) {
  if (!slug) return [];
  
  // Generar posibles variaciones del nombre
  const baseTerms = [
    slug,
    slug.replace(/([a-z])([A-Z])/g, '$1 $2'), // Agregar espacios antes de mayúsculas
    slug.charAt(0).toUpperCase() + slug.slice(1) // Primera letra mayúscula
  ];
  
  // Agregar variaciones con acentos comunes
  const commonAccents = {
    'a': ['á', 'à', 'ä', 'â'],
    'e': ['é', 'è', 'ë', 'ê'], 
    'i': ['í', 'ì', 'ï', 'î'],
    'o': ['ó', 'ò', 'ö', 'ô'],
    'u': ['ú', 'ù', 'ü', 'û'],
    'n': ['ñ']
  };
  
  let variations = [...baseTerms];
  
  // Generar variaciones con acentos
  baseTerms.forEach(term => {
    let withAccents = term;
    Object.keys(commonAccents).forEach(base => {
      commonAccents[base].forEach(accent => {
        if (withAccents.includes(base)) {
          variations.push(withAccents.replace(new RegExp(base, 'g'), accent));
        }
      });
    });
  });
  
  return [...new Set(variations)]; // Eliminar duplicados
}

// Función para convertir nombres comunes a slug
export function normalizeNameToSlug(name) {
  const commonNames = {
    'josé': 'jose',
    'maría': 'maria', 
    'jesús': 'jesus',
    'josé maría': 'josemaria',
    'josé luis': 'joseluis',
    'maría josé': 'mariajose'
  };
  
  const lowerName = name.toLowerCase();
  for (const [original, normalized] of Object.entries(commonNames)) {
    if (lowerName.includes(original)) {
      return createDoctorSlug(name.replace(new RegExp(original, 'gi'), normalized));
    }
  }
  
  return createDoctorSlug(name);
}