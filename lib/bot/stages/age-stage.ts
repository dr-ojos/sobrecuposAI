// Stage para recolectar edad y validar con médicos disponibles
import { BotResponse, BotSession } from '../types';
import { filterFutureDates } from '../utils';
import { sessionManager } from '../services/session-manager';
import { appointmentService } from '../services/appointment-service';
import { MedicalIntelligenceService } from '../services/medical-intelligence';

export async function handleAgeStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): Promise<BotResponse> {
  const age = parseInt(text);
  
  if (isNaN(age) || age < 1 || age > 120) {
    return {
      text: "Por favor ingresa tu edad en números (ejemplo: 30).",
      session: currentSession
    };
  }

  // Edad válida, ahora validar que los médicos disponibles atiendan esta edad
  const { records = [], specialty, motivo } = currentSession;
  
  try {
    // Filtrar médicos que atienden la edad del paciente
    const ageFilteredRecords = await appointmentService.filterDoctorsByAge(records, age);
    
    // Filtrar por áreas de interés si existe una consulta médica específica
    let validRecords = ageFilteredRecords;
    if (motivo) {
      validRecords = await appointmentService.filterDoctorsByInterestArea(ageFilteredRecords, motivo);
      
      // Si el filtro por áreas de interés no arroja resultados, mantener el filtro por edad solamente
      if (validRecords.length === 0) {
        console.log(`🔍 No doctors with specific interest areas for "${motivo}", using age-filtered doctors`);
        validRecords = ageFilteredRecords;
      }
    }
    
    const futureValidRecords = filterFutureDates(validRecords);

    if (futureValidRecords.length === 0) {
      // No hay médicos que atiendan esta edad
      const ageGroup = age < 18 ? 'pediátrica' : 'adultos';
      const updatedSession = sessionManager.updateSession(sessionId, {
        stage: 'asking-for-contact-data',
        patientAge: age
      });

      return {
        text: `Entiendo. Para pacientes de ${age} años, necesitamos especialistas en atención ${ageGroup}.\n\nLamentablemente no tengo disponibilidad de **${specialty}** para tu grupo de edad en este momento.\n\n¿Te gustaría que tome tus datos para contactarte cuando tengamos disponibilidad adecuada?`,
        session: updatedSession || currentSession
      };
    }

    // Detectar urgencia para casos oculares severos y otros
    const medicalIntelligence = new MedicalIntelligenceService();
    let urgency: { esUrgente: boolean; nivel: string } | undefined = undefined;
    
    if (specialty === 'Oftalmología' && motivo) {
      urgency = medicalIntelligence.detectarUrgenciaOcular(motivo);
      if (urgency?.esUrgente) {
        console.log(`🚨 Urgencia ocular detectada: ${urgency.nivel} para "${motivo}"`);
      }
    }

    // Hay médicos disponibles que atienden esta edad, mostrar opciones
    const selectedOptions = appointmentService.selectSmartAppointmentOptions(futureValidRecords, urgency);
    const presentation = await appointmentService.createOptionsPresentation(selectedOptions, specialty!, new Map(), urgency);
    
    const updatedSession = sessionManager.transitionToStage(sessionId, presentation.stage, {
      patientAge: age,
      selectedOptions,
      records: futureValidRecords,
      ...(presentation.stage === 'confirming-appointment' && { 
        doctorInfo: presentation.doctorInfo, 
        selectedRecord: selectedOptions[0] 
      })
    });

    if (!updatedSession) {
      return {
        text: "Hubo un error procesando tu edad. Por favor intenta nuevamente.",
        session: currentSession
      };
    }

    // Mensaje personalizado según la edad
    const ageMessage = age < 18 
      ? `Perfecto! He encontrado especialistas que atienden pacientes jóvenes de ${age} años.`
      : `Excelente! He encontrado especialistas disponibles para pacientes de ${age} años.`;

    return {
      text: `${ageMessage}\n\n${presentation.text}`,
      session: updatedSession
    };
    
  } catch (error) {
    console.error('❌ Error validating age against doctors:', error);
    
    return {
      text: "Hubo un error verificando la disponibilidad para tu edad. Por favor intenta nuevamente en un momento.",
      session: currentSession
    };
  }
}