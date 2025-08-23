// Utilidades y helpers para el bot
import { AirtableRecord } from './types';

// Helper para timezone de Chile
export function getChileTime(date = new Date()): Date {
  return new Date(date.toLocaleString("en-US", {timeZone: "America/Santiago"}));
}

export function getChileToday(): Date {
  const now = getChileTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Funciones utilitarias optimizadas
export const extractMedicoId = (fields: any): string => 
  Array.isArray(fields["Médico"]) ? fields["Médico"][0] : fields["Médico"];

export const getHour = (horaStr?: string): number => 
  parseInt(horaStr?.split(':')[0] || '0');

export const formatClinicAddress = (fields: any): string => {
  const clinic = fields?.["Clínica"] || fields?.["Clinica"] || "Clínica";
  const address = fields?.["Dirección"] || fields?.["Direccion"] || "";
  return address ? `${clinic}, ${address}` : clinic;
};

// Filtrar solo fechas futuras
export function filterFutureDates(records: AirtableRecord[]): AirtableRecord[] {
  const today = getChileToday();
  
  return records.filter(record => {
    const fields = record.fields || {};
    const fechaStr = fields.Fecha;
    const horaStr = fields.Hora;
    
    if (!fechaStr) return false;
    
    try {
      const fechaCita = new Date(fechaStr + 'T00:00:00');
      
      // Si es día futuro, incluir
      if (fechaCita > today) return true;
      
      // Si es hoy, verificar que la hora sea futura
      if (fechaCita.toDateString() === today.toDateString()) {
        if (!horaStr) return false;
        
        const now = getChileTime();
        const [horaNum, minutoNum] = horaStr.split(':').map(Number);
        const horaCita = new Date(now);
        horaCita.setHours(horaNum, minutoNum, 0, 0);
        
        // Dar margen de 30 minutos
        const margen = 30 * 60 * 1000;
        return horaCita.getTime() > (now.getTime() + margen);
      }
      
      return false;
    } catch (error) {
      console.error(`Error parsing date ${fechaStr}:`, error);
      return false;
    }
  });
}

// Formatear fecha en español
export function formatSpanishDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
  } catch (error) {
    console.error(`Error formatting date ${dateStr}:`, error);
    return dateStr;
  }
}

// Validaciones
export function validarTelefono(telefono: string): boolean {
  // Limpiar el teléfono de espacios y caracteres especiales
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Patrones válidos chilenos
  const patronesCL = [
    /^\+569\d{8}$/,        // +56912345678 (celular)
    /^569\d{8}$/,          // 56912345678 (celular sin +)
    /^9\d{8}$/,            // 912345678 (celular)
    /^\+562\d{7,8}$/,      // +56221234567 (fijo Santiago)
    /^2\d{7,8}$/,          // 221234567 (fijo Santiago)
    /^\d{7,8}$/            // 12345678 (fijo genérico)
  ];
  
  return patronesCL.some(patron => patron.test(telefonoLimpio));
}

export function validarRUT(rut: string): boolean {
  // Limpiar RUT
  const rutLimpio = rut.replace(/[.\-\s]/g, '');
  
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
  
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(cuerpo)) return false;
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto < 2 ? resto.toString() : resto === 10 ? 'K' : (11 - resto).toString();
  
  return dv === dvCalculado;
}

export function validarEmail(email: string): boolean {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patron.test(email);
}

// Detección de saludos simples
export function esSaludoSimple(text: string): boolean {
  const saludos = [
    'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos',
    'hi', 'hello', 'hey', 'buenas', 'qué tal', 'como estas', 'como estás'
  ];
  
  const textLower = text.toLowerCase().trim();
  return saludos.some(saludo => 
    textLower === saludo || 
    textLower.startsWith(saludo + ' ') || 
    textLower.startsWith(saludo + ',')
  );
}

// Rate limiting básico
const rateLimiter = new Map<string, number[]>();

export function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const attempts = rateLimiter.get(sessionId) || [];
  const recentAttempts = attempts.filter(time => now - time < 60000); // 1 minuto
  
  if (recentAttempts.length > 20) {
    return false; // Bloqueado
  }
  
  rateLimiter.set(sessionId, [...recentAttempts, now]);
  return true;
}

// Análisis de confusión en inputs
export function analizarConfusion(input: string, expectedType: string): string {
  const inputLower = input.toLowerCase();
  
  switch (expectedType) {
    case 'telefono':
      if (inputLower.includes('email') || inputLower.includes('@')) {
        return "Parece que ingresaste un email. Necesito tu **número de teléfono**.";
      }
      if (inputLower.includes('rut') || inputLower.includes('cedula')) {
        return "Parece que ingresaste un RUT. Necesito tu **número de teléfono**.";
      }
      return "El formato de teléfono no es válido.";
      
    case 'email':
      if (/^\d+$/.test(input)) {
        return "Parece que ingresaste un número. Necesito tu **correo electrónico**.";
      }
      if (inputLower.includes('telefono') || inputLower.includes('celular')) {
        return "Parece que mencionas teléfono. Necesito tu **correo electrónico**.";
      }
      return "El formato de email no es válido.";
      
    case 'rut':
      if (inputLower.includes('@')) {
        return "Parece que ingresaste un email. Necesito tu **RUT**.";
      }
      if (validarTelefono(input)) {
        return "Parece que ingresaste un teléfono. Necesito tu **RUT**.";
      }
      return "El formato de RUT no es válido.";
      
    default:
      return "El formato no es válido.";
  }
}

// Función para extraer solo el primer nombre (más humano)
export function getFirstName(fullName: string): string {
  if (!fullName) return '';
  
  const nombres = fullName.trim().split(' ');
  return nombres[0] || '';
}

// Función para saludar de manera humanizada
export function createFriendlyGreeting(firstName: string): string {
  const greetings = [
    `¡Hola ${firstName}! 😊`,
    `Perfecto, ${firstName}! 👍`,
    `¡Excelente, ${firstName}! ✨`,
    `¡Genial, ${firstName}! 🌟`,
    `Muy bien, ${firstName}! 👌`
  ];
  
  // Seleccionar saludo aleatorio para variedad
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
}