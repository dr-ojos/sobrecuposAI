// Stage para elegir entre las opciones mostradas
import { BotResponse, BotSession } from '../types';
import { sessionManager } from '../services/session-manager';
import { appointmentService } from '../services/appointment-service';
import { medicalIntelligence } from '../services/medical-intelligence';

export async function handleOptionsStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): Promise<BotResponse> {
  const { selectedOptions, records, specialty } = currentSession;
  
  if (!selectedOptions || selectedOptions.length === 0) {
    return {
      text: "Hubo un error con las opciones. Por favor, reinicia la consulta.",
      session: currentSession
    };
  }

  // Detectar si el usuario rechaza las opciones
  const rejectionWords = [
    'no', 'ninguna', 'ninguno', 'no me gusta', 'no me gustan', 'no me sirve', 'no me sirven',
    'otra', 'otras', 'más opciones', 'diferentes', 'alternativas', 'no quiero',
    'busca otra', 'busca otras', 'no me convence', 'no me convencen', 'prefiero otra'
  ];
  
  const lowerText = text.toLowerCase().trim();
  const isRejection = rejectionWords.some(word => lowerText.includes(word)) || 
                     (lowerText.length > 10 && !lowerText.match(/\d/)); // Texto largo sin números

  if (isRejection) {
    return await handleOptionsRejection(text, sessionId, currentSession);
  }

  // Validar que el input sea 1 o 2
  const option = parseInt(text.trim());
  
  if (isNaN(option) || option < 1 || option > selectedOptions.length) {
    currentSession.attempts = (currentSession.attempts || 0) + 1;
    
    const maxOptions = selectedOptions.length;
    const helpMessage = currentSession.attempts >= 3 
      ? `\n\n💡 *Si ninguna opción te convence, también puedes escribir "busca otras opciones"*`
      : '';
    
    const updatedSession = sessionManager.updateSession(sessionId, currentSession);
    
    return {
      text: `Por favor, responde con el número de la opción que prefieres (${maxOptions === 1 ? '**1**' : '**1** o **2**'}) o escribe "**no me gustan**" para ver más opciones.${helpMessage}`,
      session: updatedSession || currentSession
    };
  }

  // Selección válida
  const selectedRecord = selectedOptions[option - 1];
  
  if (!selectedRecord) {
    return {
      text: "La opción seleccionada no es válida. Por favor, elige 1 o 2.",
      session: currentSession
    };
  }

  // Transicionar a pedir teléfono con el record seleccionado
  const updatedSession = sessionManager.transitionToStage(sessionId, 'getting-phone', {
    selectedRecord: selectedRecord
  });

  if (!updatedSession) {
    return {
      text: "Hubo un error procesando tu selección. Por favor intenta nuevamente.",
      session: currentSession
    };
  }

  // Confirmar selección y pedir teléfono
  const doctorName = selectedRecord.fields?.['Name (from Médico)']?.[0] || 'Médico';
  const fecha = selectedRecord.fields?.Fecha || '';
  const hora = selectedRecord.fields?.Hora || '';
  
  return {
    text: `¡Excelente elección! Has seleccionado la cita con **Dr. ${doctorName}** el **${fecha}** a las **${hora}**.\n\n📞 Para confirmar tu reserva, necesito tu número de teléfono.\n\nEjemplo: +56912345678`,
    session: updatedSession
  };
}

// Manejar rechazo empático de opciones
async function handleOptionsRejection(
  text: string,
  sessionId: string,
  currentSession: BotSession
): Promise<BotResponse> {
  const { records, specialty, selectedOptions } = currentSession;
  
  if (!records || !specialty) {
    return {
      text: "Entiendo que prefieres otras opciones. Lamentablemente hubo un error accediendo a más alternativas. Por favor reinicia la consulta.",
      session: currentSession
    };
  }

  // Detectar preferencias específicas del usuario
  const userPreferences = detectUserPreferences(text);
  console.log('🎯 Preferencias detectadas:', userPreferences);

  // Generar respuesta empática
  const emphaticResponse = await medicalIntelligence.generateEmphaticResponse(
    text, "Entiendo que estas opciones no se ajustan a lo que necesitas."
  );

  // Filtrar records según preferencias del usuario
  const filteredAlternatives = filterByUserPreferences(records, selectedOptions, userPreferences);

  if (filteredAlternatives.length === 0) {
    // No hay opciones que cumplan las preferencias
    const preferenceMessage = createPreferenceMessage(userPreferences);
    const updatedSession = sessionManager.transitionToStage(sessionId, 'asking-for-contact-data', {
      rejectedAllOptions: true,
      userPreferences
    });

    return {
      text: `${emphaticResponse}\n\nEntiendo perfectamente ${preferenceMessage}. Lamentablemente, no tengo citas disponibles de **${specialty}** que se ajusten exactamente a lo que buscas en este momento.\n\n¿Te gustaría que te contacte cuando tengamos nuevas opciones disponibles ${preferenceMessage}?`,
      session: updatedSession || currentSession
    };
  }

  // Mostrar opciones alternativas que cumplen las preferencias
  try {
    const newSelectedOptions = appointmentService.selectSmartAppointmentOptions(filteredAlternatives);
    const presentation = await appointmentService.createOptionsPresentation(newSelectedOptions, specialty);
    const preferenceMessage = createPreferenceMessage(userPreferences);
    
    const updatedSession = sessionManager.transitionToStage(sessionId, 'choosing-from-options', {
      selectedOptions: newSelectedOptions,
      previouslyRejectedOptions: [...(currentSession.previouslyRejectedOptions || []), ...(selectedOptions || [])],
      attempts: 0 // Reset attempts para las nuevas opciones
    });

    if (!updatedSession) {
      return {
        text: "Hubo un error buscando opciones alternativas. Por favor intenta nuevamente.",
        session: currentSession
      };
    }

    const responseMessage = userPreferences.hasPreferences 
      ? `¡Perfecto! He encontrado opciones de **${specialty}** ${preferenceMessage}:`
      : `¡Por supuesto! Te muestro otras opciones disponibles de **${specialty}**:`;

    return {
      text: `${emphaticResponse}\n\n${responseMessage}\n\n${presentation.text}\n\n¿Alguna de estas opciones se ajusta mejor a lo que buscas? Responde con el número (**1** o **2**).`,
      session: updatedSession
    };
    
  } catch (error) {
    console.error('❌ Error mostrando opciones alternativas:', error);
    
    return {
      text: `${emphaticResponse}\n\nEntiendo que prefieres otras opciones. En este momento estoy buscando alternativas adicionales para ti.\n\n¿Te gustaría que tome tus datos para contactarte con más opciones disponibles?`,
      session: currentSession
    };
  }
}

// Detectar preferencias específicas del usuario
function detectUserPreferences(text: string) {
  const lowerText = text.toLowerCase();
  
  // Preferencias de fecha
  const datePreferences = {
    tomorrow: lowerText.includes('mañana'),
    today: lowerText.includes('hoy'),
    nextWeek: lowerText.includes('próxima semana') || lowerText.includes('otra semana'),
    anotherDay: lowerText.includes('otro día') || lowerText.includes('otro dia'),
    weekend: lowerText.includes('fin de semana') || lowerText.includes('sábado') || lowerText.includes('domingo'),
    weekday: lowerText.includes('entre semana') || lowerText.includes('día de semana')
  };

  // Preferencias de horario
  const timePreferences = {
    morning: lowerText.includes('mañana') || lowerText.includes('temprano') || lowerText.includes('am'),
    afternoon: lowerText.includes('tarde') || lowerText.includes('pm'),
    evening: lowerText.includes('noche'),
    later: lowerText.includes('más tarde') || lowerText.includes('mas tarde'),
    earlier: lowerText.includes('más temprano') || lowerText.includes('mas temprano')
  };

  // Fechas específicas
  const specificDates = detectSpecificDates(text);
  
  return {
    hasPreferences: Object.values(datePreferences).some(Boolean) || 
                   Object.values(timePreferences).some(Boolean) || 
                   specificDates.length > 0,
    date: datePreferences,
    time: timePreferences,
    specificDates,
    originalText: text
  };
}

// Detectar fechas específicas mencionadas
function detectSpecificDates(text: string): string[] {
  const lowerText = text.toLowerCase();
  const dates: string[] = [];
  
  // Días de la semana
  const daysOfWeek = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
  daysOfWeek.forEach(day => {
    if (lowerText.includes(day)) dates.push(day);
  });
  
  // Fechas numéricas (ej: "25 de agosto", "el 30")
  const dateRegex = /(\d{1,2})\s*(de|del)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)?/g;
  let match;
  while ((match = dateRegex.exec(lowerText)) !== null) {
    dates.push(match[0]);
  }
  
  return dates;
}

// Filtrar opciones según las preferencias del usuario
function filterByUserPreferences(records: any[], selectedOptions: any[] = [], preferences: any) {
  if (!preferences.hasPreferences) {
    // Si no hay preferencias específicas, usar la lógica original
    const usedRecordIds = selectedOptions.map(option => option.id) || [];
    return records.filter(record => !usedRecordIds.includes(record.id));
  }

  // Excluir opciones ya mostradas
  const usedRecordIds = selectedOptions.map(option => option.id) || [];
  let filtered = records.filter(record => !usedRecordIds.includes(record.id));
  
  // Aplicar filtros de fecha
  if (preferences.date.tomorrow) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    filtered = filtered.filter(record => record.fields?.Fecha === tomorrowStr);
  }
  
  if (preferences.date.anotherDay) {
    // Excluir fechas de las opciones rechazadas
    const rejectedDates = selectedOptions.map(option => option.fields?.Fecha).filter(Boolean);
    filtered = filtered.filter(record => !rejectedDates.includes(record.fields?.Fecha));
  }

  // Aplicar filtros de horario
  if (preferences.time.morning) {
    filtered = filtered.filter(record => {
      const hora = record.fields?.Hora;
      if (!hora) return false;
      const hourNum = parseInt(hora.split(':')[0]);
      return hourNum < 12;
    });
  }
  
  if (preferences.time.afternoon) {
    filtered = filtered.filter(record => {
      const hora = record.fields?.Hora;
      if (!hora) return false;
      const hourNum = parseInt(hora.split(':')[0]);
      return hourNum >= 12 && hourNum < 18;
    });
  }

  if (preferences.time.later) {
    // Buscar horarios más tarde que las opciones rechazadas
    const rejectedTimes = selectedOptions.map(option => {
      const hora = option.fields?.Hora;
      return hora ? parseInt(hora.split(':')[0]) : 0;
    });
    const maxRejectedTime = Math.max(...rejectedTimes, 0);
    
    filtered = filtered.filter(record => {
      const hora = record.fields?.Hora;
      if (!hora) return false;
      const hourNum = parseInt(hora.split(':')[0]);
      return hourNum > maxRejectedTime;
    });
  }

  return filtered;
}

// Crear mensaje descriptivo de las preferencias
function createPreferenceMessage(preferences: any): string {
  if (!preferences.hasPreferences) return '';
  
  const messages: string[] = [];
  
  if (preferences.date.tomorrow) messages.push('para mañana');
  if (preferences.date.anotherDay) messages.push('para otro día');
  if (preferences.date.weekend) messages.push('para el fin de semana');
  if (preferences.time.morning) messages.push('en la mañana');
  if (preferences.time.afternoon) messages.push('en la tarde');
  if (preferences.time.later) messages.push('más tarde');
  if (preferences.specificDates.length > 0) {
    messages.push(`para ${preferences.specificDates.join(' o ')}`);
  }
  
  return messages.length > 0 ? messages.join(' y ') : '';
}