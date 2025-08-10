#!/usr/bin/env node

// Prueba interna para verificar selección de opciones del chatbot

const mockSessions = {};

// Simular selectSmartAppointmentOptions
function selectSmartAppointmentOptions(records) {
  if (!records?.length) return [];
  
  const sorted = [...records].sort((a, b) => 
    new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`) - 
    new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`)
  );

  if (sorted.length === 1) return sorted;

  const [first] = sorted;
  const firstDate = first.fields?.Fecha;
  const sameDayOptions = sorted.filter(r => r.fields?.Fecha === firstDate && r.id !== first.id);

  if (sameDayOptions.length === 0) {
    const nextDayOptions = sorted.filter(r => r.fields?.Fecha !== firstDate);
    return nextDayOptions.length > 0 ? [first, nextDayOptions[0]] : [first];
  }

  const allSameDay = [first, ...sameDayOptions];
  const getHour = (hora) => {
    if (!hora) return 0;
    const match = hora.match(/(\d+):(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  const morning = allSameDay.filter(r => getHour(r.fields?.Hora) < 14);
  const afternoon = allSameDay.filter(r => getHour(r.fields?.Hora) >= 14);

  return morning.length > 0 && afternoon.length > 0 
    ? [morning[0], afternoon[0]] 
    : [first, sameDayOptions[0]];
}

// Datos de prueba que simulan el caso real del error
const mockRecords = [
  {
    id: "rec_ENRIQUE_BECKER",
    fields: {
      "Médico": "Dr. Enrique Becker",
      "Fecha": "2025-08-13",
      "Hora": "12:00",
      "Clínica": "Clínica Dávila Maipú"
    }
  },
  {
    id: "rec_JOSE_PENA_1",
    fields: {
      "Médico": "Dr. José Peña",
      "Fecha": "2025-08-12", 
      "Hora": "12:00",
      "Clínica": "Clínica Dávila Ñuñoa"
    }
  },
  {
    id: "rec_JOSE_PENA_2",
    fields: {
      "Médico": "Dr. José Peña",
      "Fecha": "2025-08-12",
      "Hora": "13:00", 
      "Clínica": "Clínica Davila Las Condes"
    }
  }
];

console.log('🧪 === PRUEBA DE SELECCIÓN DE OPCIONES ===\n');

console.log('📋 Records disponibles:');
mockRecords.forEach((record, i) => {
  console.log(`  ${i}: ${record.fields.Médico} - ${record.fields.Fecha} ${record.fields.Hora} - ${record.fields.Clínica}`);
});

console.log('\n🔍 Ejecutando selectSmartAppointmentOptions...');
const selectedOptions = selectSmartAppointmentOptions(mockRecords);

console.log('\n✅ Opciones seleccionadas para mostrar al usuario:');
selectedOptions.forEach((option, i) => {
  console.log(`  Opción ${i + 1}: ${option.fields.Médico} - ${option.fields.Fecha} ${option.fields.Hora} - ${option.fields.Clínica}`);
  console.log(`    ID: ${option.id}`);
});

// Simular selección del usuario
console.log('\n👤 Usuario selecciona: "2"');
const chosenOption = '2';
const optionIndex = chosenOption === '1' ? 0 : chosenOption === '2' ? 1 : -1;

console.log(`📍 Option index calculado: ${optionIndex}`);

if (optionIndex !== -1 && selectedOptions[optionIndex]) {
  const chosenRecord = selectedOptions[optionIndex];
  console.log('\n🎯 Record seleccionado:');
  console.log(`  Doctor: ${chosenRecord.fields.Médico}`);
  console.log(`  Fecha: ${chosenRecord.fields.Fecha}`);
  console.log(`  Hora: ${chosenRecord.fields.Hora}`);
  console.log(`  Clínica: ${chosenRecord.fields.Clínica}`);
  console.log(`  ID: ${chosenRecord.id}`);
  
  // Verificar que sea la opción correcta
  const expectedDoctor = "Dr. José Peña";
  const expectedTime = "13:00";
  const expectedClinic = "Clínica Davila Las Condes";
  
  console.log('\n🔍 Verificación:');
  console.log(`  ✅ Doctor correcto: ${chosenRecord.fields.Médico === expectedDoctor}`);
  console.log(`  ✅ Hora correcta: ${chosenRecord.fields.Hora === expectedTime}`);
  console.log(`  ✅ Clínica correcta: ${chosenRecord.fields.Clínica === expectedClinic}`);
  
  if (chosenRecord.fields.Médico === expectedDoctor && 
      chosenRecord.fields.Hora === expectedTime && 
      chosenRecord.fields.Clínica === expectedClinic) {
    console.log('\n🎉 PRUEBA EXITOSA: Se seleccionó la opción correcta');
  } else {
    console.log('\n❌ PRUEBA FALLIDA: Se seleccionó la opción incorrecta');
  }
} else {
  console.log('\n❌ ERROR: No se pudo seleccionar la opción');
}

console.log('\n🧪 === FIN DE LA PRUEBA ===');