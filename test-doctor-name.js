#!/usr/bin/env node

// Prueba interna para identificar problema con nombre del médico

console.log('🧪 === PRUEBA INTERNA: NOMBRE DEL MÉDICO ===\n');

// 1. Simular función getDoctorName
async function mockGetDoctorName(doctorId) {
  console.log('🔍 [MOCK getDoctorName] Input doctorId:', doctorId, typeof doctorId);
  
  // Simular respuesta de Airtable
  const mockAirtableResponse = {
    id: doctorId,
    fields: {
      Name: "Valentina Gutierrez",
      Email: "valentina@ejemplo.com", 
      Especialidad: "Oftalmología"
    }
  };
  
  console.log('🔍 [MOCK getDoctorName] Simulando respuesta Airtable:', mockAirtableResponse);
  console.log('🔍 [MOCK getDoctorName] data.fields?.Name:', mockAirtableResponse.fields?.Name);
  
  const result = mockAirtableResponse.fields?.Name || doctorId;
  console.log('🔍 [MOCK getDoctorName] Final result:', result);
  
  return result;
}

// 2. Simular función procesarNombreMedico
function procesarNombreMedico(nombreCompleto) {
  console.log('🔍 [MOCK procesarNombreMedico] Input:', nombreCompleto, typeof nombreCompleto);
  
  if (!nombreCompleto || nombreCompleto.trim() === '') {
    console.log('⚠️ [MOCK procesarNombreMedico] Nombre vacío, usando fallback');
    return { titulo: 'Dr.', nombre: 'Médico' };
  }
  
  // Convertir a string y limpiar
  const nombreStr = String(nombreCompleto).trim();
  
  // Remover títulos existentes y limpiar
  const nombreLimpio = nombreStr
    .replace(/^(Dr\.|Dra\.|Doctor|Doctora)\s*/i, '')
    .trim();
  
  // Si después de limpiar no queda nada, usar el nombre original
  const nombreFinal = nombreLimpio || nombreStr;
  
  console.log('🔍 [MOCK procesarNombreMedico] Procesamiento:', {
    original: nombreStr,
    limpio: nombreLimpio,
    final: nombreFinal
  });
  
  // Detectar género por nombres comunes femeninos
  const nombresFemeninos = [
    'María', 'Carmen', 'Ana', 'Isabel', 'Pilar', 'Dolores', 'Josefa', 'Rosa', 'Antonia', 'Francisca',
    'Laura', 'Cristina', 'Marta', 'Elena', 'Teresa', 'Patricia', 'Sandra', 'Monica', 'Andrea', 'Claudia',
    'Valentina', 'Camila', 'Fernanda', 'Alejandra', 'Daniela', 'Carolina', 'Javiera', 'Constanza',
    'Esperanza', 'Soledad', 'Amparo', 'Concepción', 'Remedios', 'Encarnación', 'Asunción'
  ];
  
  const primerNombreMedico = nombreFinal.split(' ')[0];
  const esFemenino = nombresFemeninos.some(nombre => 
    primerNombreMedico.toLowerCase().includes(nombre.toLowerCase())
  );
  
  console.log('🔍 [MOCK procesarNombreMedico] Detección género:', {
    primerNombre: primerNombreMedico,
    esFemenino: esFemenino
  });
  
  const resultado = {
    titulo: esFemenino ? 'Dra.' : 'Dr.',
    nombre: nombreFinal
  };
  
  console.log('✅ [MOCK procesarNombreMedico] Resultado final:', resultado);
  return resultado;
}

// 3. Simular flujo completo
async function testCompleteFlow() {
  console.log('=== SIMULACIÓN DEL FLUJO COMPLETO ===\n');
  
  // Simular datos del sobrecupo
  const mockSobrecupoData = {
    fields: {
      "Médico": ["recVALENTINA123"], // ID de Airtable típico
      "Fecha": "2025-08-14",
      "Hora": "11:00",
      "Clínica": "Clínica Davila Las Condes"
    }
  };
  
  console.log('1. Datos del sobrecupo:', mockSobrecupoData);
  
  // Extraer ID del médico
  const medicoId = Array.isArray(mockSobrecupoData.fields["Médico"]) ? 
    mockSobrecupoData.fields["Médico"][0] : mockSobrecupoData.fields["Médico"];
  
  console.log('2. ID del médico extraído:', medicoId);
  
  // Obtener nombre del médico
  const doctorName = await mockGetDoctorName(medicoId);
  console.log('3. Nombre del médico obtenido:', doctorName);
  
  // Simular appointmentData que se envía al email
  const appointmentData = {
    doctorName: doctorName,
    specialty: "Oftalmología"
  };
  
  console.log('4. appointmentData para email:', appointmentData);
  
  // Procesar nombre para el email
  const { titulo, nombre } = procesarNombreMedico(appointmentData.doctorName);
  
  console.log('5. Resultado final para email:', {
    titulo: titulo,
    nombre: nombre,
    mensajeCompleto: `Hola Mario, yo ${titulo} ${nombre}, te autoricé Sobrecupo...`
  });
}

// 4. Casos de prueba específicos
function testEdgeCases() {
  console.log('\n=== CASOS DE PRUEBA ESPECÍFICOS ===\n');
  
  const casos = [
    "",
    null,
    undefined,
    "Valentina Gutierrez",
    "Dr. Valentina Gutierrez", 
    "Dra. Valentina Gutierrez",
    "José Peña",
    "Dr. José Peña"
  ];
  
  casos.forEach((caso, i) => {
    console.log(`--- Caso ${i + 1}: ${JSON.stringify(caso)} ---`);
    const resultado = procesarNombreMedico(caso);
    console.log(`Resultado: ${resultado.titulo} ${resultado.nombre}\n`);
  });
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testCompleteFlow();
  testEdgeCases();
  console.log('🧪 === FIN DE LAS PRUEBAS ===');
}

runAllTests().catch(console.error);