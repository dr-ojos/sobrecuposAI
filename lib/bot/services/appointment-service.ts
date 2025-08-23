// Servicio para la lógica de selección y presentación de citas
import { AirtableRecord, ProcessedDoctorInfo, AppointmentPresentation } from '../types';
import { getHour, formatSpanishDate, formatClinicAddress } from '../utils';
import { airtableService } from './airtable-service';

export class AppointmentService {

  // Función optimizada para seleccionar opciones inteligentes con urgencia
  selectSmartAppointmentOptions(records: AirtableRecord[], urgency?: { esUrgente: boolean; nivel: string }): AirtableRecord[] {
    if (!records?.length) return [];
    
    // Para casos urgentes, priorizar citas del mismo día
    if (urgency?.esUrgente) {
      console.log(`🚨 Caso urgente (${urgency.nivel}) - priorizando citas del mismo día`);
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = records.filter(r => r.fields?.Fecha === today);
      
      if (todayAppointments.length > 0) {
        console.log(`✅ Encontradas ${todayAppointments.length} citas para hoy - priorizando`);
        const sortedToday = todayAppointments.sort((a, b) => {
          const hourA = this.getHourNumber(a.fields?.Hora || '00:00');
          const hourB = this.getHourNumber(b.fields?.Hora || '00:00');
          return hourA - hourB;
        });
        
        // Para casos urgentes, mostrar solo las opciones del mismo día disponibles
        return sortedToday.length === 1 ? sortedToday : [sortedToday[0], sortedToday[sortedToday.length - 1]];
      } else {
        console.log(`⚠️ No hay citas disponibles para hoy - mostrando opciones más cercanas`);
        // Si no hay citas para hoy, agregar mensaje de urgencia al contexto
      }
    }
    
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(`${a.fields?.Fecha}T${a.fields?.Hora || '00:00'}`);
      const dateB = new Date(`${b.fields?.Fecha}T${b.fields?.Hora || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Si solo hay un registro, retornar solo ese
    if (sorted.length === 1) return sorted;

    const [first] = sorted;
    const firstDate = first.fields?.Fecha;
    const sameDayOptions = sorted.filter(r => r.fields?.Fecha === firstDate && r.id !== first.id);

    // Si no hay opciones del mismo día, buscar del día siguiente
    if (sameDayOptions.length === 0) {
      const nextDayOptions = sorted.filter(r => r.fields?.Fecha !== firstDate);
      return nextDayOptions.length > 0 ? [first, nextDayOptions[0]] : [first];
    }

    // Si hay opciones del mismo día, intentar separar por mañana/tarde
    const allSameDay = [first, ...sameDayOptions];
    const morning = allSameDay.filter(r => getHour(r.fields?.Hora) < 14);
    const afternoon = allSameDay.filter(r => getHour(r.fields?.Hora) >= 14);

    // Solo mostrar 2 opciones si realmente hay mañana Y tarde diferentes
    if (morning.length > 0 && afternoon.length > 0) {
      return [morning[0], afternoon[0]];
    }

    // Si todas las citas son en el mismo período (mañana o tarde), 
    // buscar una segunda opción del día más cercano siguiente
    const nextDayOptions = sorted.filter(r => r.fields?.Fecha !== firstDate);
    return nextDayOptions.length > 0 ? [first, nextDayOptions[0]] : [first];
  }

  // Crear presentación de opciones optimizada con soporte para urgencia
  async createOptionsPresentation(
    selectedOptions: AirtableRecord[], 
    specialty: string, 
    doctorCache = new Map(),
    urgency?: { esUrgente: boolean; nivel: string }
  ): Promise<AppointmentPresentation> {
    
    if (selectedOptions.length === 1) {
      const option = selectedOptions[0];
      const doctorId = this.extractMedicoId(option.fields);
      const doctorInfo = await airtableService.getDoctorInfoCached(doctorId, doctorCache);
      const fechaFormateada = formatSpanishDate(option.fields?.Fecha!);
      const address = formatClinicAddress(option.fields);
      const atiendeTxt = this.generateAtiendeTxt(doctorInfo.atiende);

      // Agregar mensaje de urgencia si aplica
      let urgencyMessage = '';
      if (urgency?.esUrgente) {
        const isToday = option.fields?.Fecha === new Date().toISOString().split('T')[0];
        if (urgency.nivel === 'crítico' && isToday) {
          urgencyMessage = `🚨 **CITA DE URGENCIA PARA HOY** - Debido a la severidad de tus síntomas, te hemos priorizado esta cita del mismo día.\n\n`;
        } else if (urgency.esUrgente && isToday) {
          urgencyMessage = `⚠️ **Cita prioritaria para hoy** - Considerando tus síntomas, esta cita del mismo día es recomendada.\n\n`;
        } else if (urgency.esUrgente) {
          urgencyMessage = `⚠️ **Nota importante**: Por la severidad de tus síntomas, recomendamos atención urgente. Esta es la cita más cercana disponible.\n\n`;
        }
      }

      return {
        text: `${urgencyMessage}👨‍⚕️ **Dr. ${doctorInfo.name}**${atiendeTxt}\n📅 ${fechaFormateada} a las ${option.fields?.Hora}\n📍 ${address}\n\n¿Confirmas esta cita? Responde **'sí'** para continuar o **'no'** para ver otras opciones.`,
        stage: 'confirming-appointment',
        doctorInfo
      };
    }

    // Debug para 2 opciones
    console.log('🔍 [PRESENTATION DEBUG] Creating 2-option presentation:');
    selectedOptions.forEach((option, i) => {
      console.log(`  Option ${i + 1}: {
  id: '${option.id}',
  doctor: ${JSON.stringify(option.fields?.Médico)},
  fecha: '${option.fields?.Fecha}',
  hora: '${option.fields?.Hora}'
}`);
    });

    const optionsText = await Promise.all(selectedOptions.map(async (option, i) => {
      const doctorId = this.extractMedicoId(option.fields);
      const doctorInfo = await airtableService.getDoctorInfoCached(doctorId, doctorCache);
      const fechaFormateada = formatSpanishDate(option.fields?.Fecha!);
      const address = formatClinicAddress(option.fields);
      const atiendeTxt = this.generateAtiendeTxt(doctorInfo.atiende);

      return `**${i + 1}.** 👨‍⚕️ **Dr. ${doctorInfo.name}**${atiendeTxt}\n📅 ${fechaFormateada} a las ${option.fields?.Hora}\n📍 ${address}`;
    }));

    // Agregar mensaje de urgencia para múltiples opciones
    let urgencyHeader = '';
    if (urgency?.esUrgente) {
      const hasToday = selectedOptions.some(opt => opt.fields?.Fecha === new Date().toISOString().split('T')[0]);
      if (urgency.nivel === 'crítico' && hasToday) {
        urgencyHeader = `🚨 **OPCIONES PRIORITARIAS** - Debido a la severidad de tus síntomas, se incluyen citas del mismo día disponibles.\n\n`;
      } else if (urgency.esUrgente && hasToday) {
        urgencyHeader = `⚠️ **Citas prioritarias** - Por tus síntomas, se priorizan las opciones más cercanas disponibles.\n\n`;
      } else if (urgency.esUrgente) {
        urgencyHeader = `⚠️ **Atención urgente recomendada** - Estas son las citas más cercanas disponibles para tu caso.\n\n`;
      }
    }

    return {
      text: `${urgencyHeader}Te muestro las mejores opciones disponibles de **${specialty}**:\n\n${optionsText.join('\n\n')}\n\n¿Cuál opción prefieres? Responde con el número (**1** o **2**).`,
      stage: 'choosing-from-options'
    };
  }

  // Validar si un médico atiende una edad específica
  validateDoctorAge(doctorAtiende: string, patientAge: number): boolean {
    switch (doctorAtiende) {
      case "Niños":
        return patientAge < 18;
      case "Adultos":
        return patientAge >= 18;
      case "Ambos":
        return true;
      default:
        return true; // Por defecto aceptar
    }
  }

  // Filtrar médicos que atienden la edad del paciente
  async filterDoctorsByAge(
    records: AirtableRecord[], 
    patientAge: number
  ): Promise<AirtableRecord[]> {
    const validRecords: AirtableRecord[] = [];
    
    for (const record of records) {
      const doctorId = this.extractMedicoId(record.fields);
      const doctorInfo = await airtableService.getDoctorInfoCached(doctorId);
      
      if (this.validateDoctorAge(doctorInfo.atiende, patientAge)) {
        validRecords.push(record);
      }
    }
    
    return validRecords;
  }

  // Filtrar médicos por área de interés específica
  async filterDoctorsByInterestArea(
    records: AirtableRecord[], 
    medicalQuery: string
  ): Promise<AirtableRecord[]> {
    const validRecords: AirtableRecord[] = [];
    
    for (const record of records) {
      const doctorId = this.extractMedicoId(record.fields);
      const doctorInfo = await airtableService.getDoctorInfoCached(doctorId);
      
      // Si el doctor tiene areas de interés definidas
      if (doctorInfo.areasInteres) {
        const areasInteres = doctorInfo.areasInteres.toLowerCase();
        const queryLower = medicalQuery.toLowerCase();
        
        // Buscar coincidencias en las áreas de interés
        if (this.matchesInterestArea(areasInteres, queryLower)) {
          validRecords.push(record);
        }
      } else {
        // Si no tiene áreas específicas, incluir el médico (comportamiento por defecto)
        validRecords.push(record);
      }
    }
    
    return validRecords;
  }

  // Verificar si una consulta médica coincide con las áreas de interés
  private matchesInterestArea(areasInteres: string, medicalQuery: string): boolean {
    // Palabras clave por área de interés
    const interestKeywords = {
      'dolor de cabeza': ['cefalea', 'migraña', 'dolor de cabeza', 'headache'],
      'neurologia': ['neurologia', 'neurologico', 'sistema nervioso', 'convulsiones', 'epilepsia'],
      'cardiologia': ['corazon', 'cardiaco', 'presion', 'hipertension', 'arritmia'],
      'dermatologia': ['piel', 'dermatitis', 'acne', 'manchas', 'lunares'],
      'gastroenterologia': ['estomago', 'digestion', 'gastritis', 'colon', 'intestino'],
      'oftalmologia': ['ojo', 'ojos', 'vision', 'vista', 'dolor ocular'],
      'otorrinolaringologia': ['oido', 'nariz', 'garganta', 'dolor de oido', 'sinusitis'],
      'traumatologia': ['hueso', 'fractura', 'luxacion', 'articulacion', 'lesion'],
      'ginecologia': ['ginecologico', 'menstrual', 'ovario', 'utero', 'embarazo'],
      'pediatria': ['niño', 'niños', 'bebe', 'infantil', 'pediatrico'],
      'psiquiatria': ['depresion', 'ansiedad', 'stress', 'mental', 'psiquiatrico']
    };
    
    // Verificar si alguna palabra clave coincide
    for (const [area, keywords] of Object.entries(interestKeywords)) {
      if (areasInteres.includes(area)) {
        const hasMatch = keywords.some(keyword => 
          medicalQuery.includes(keyword) || areasInteres.includes(keyword)
        );
        if (hasMatch) return true;
      }
    }
    
    // Coincidencia directa con texto libre
    const queryWords = medicalQuery.split(' ').filter(word => word.length > 2);
    return queryWords.some(word => areasInteres.includes(word));
  }

  // Helpers privados
  private extractMedicoId(fields: any): string {
    return Array.isArray(fields["Médico"]) ? fields["Médico"][0] : fields["Médico"];
  }

  private getHourNumber(hora: string): number {
    const [hours, minutes] = hora.split(':').map(Number);
    return hours + (minutes / 60);
  }

  private generateAtiendeTxt(atiende: string): string {
    switch (atiende) {
      case "Niños": 
        return " (especialista en pediatría)";
      case "Adultos": 
        return " (atiende solo adultos)";
      case "Ambos": 
        return " (atiende niños y adultos)";
      default: 
        return "";
    }
  }

  // Buscar citas por médico específico
  async findAppointmentsByDoctor(doctorName: string): Promise<AirtableRecord[]> {
    try {
      const allSobrecupos = await airtableService.fetchAllSobrecupos();
      
      return allSobrecupos.filter(record => {
        const disponible = airtableService.normalizeBoolean(record.fields?.Disponible);
        const doctorNames = record.fields?.['Name (from Médico)'] || [];
        const nameMatch = Array.isArray(doctorNames) 
          ? doctorNames.some(name => name.toLowerCase().includes(doctorName.toLowerCase()))
          : false;
        
        return disponible && nameMatch;
      });
    } catch (error) {
      console.error(`❌ Error buscando citas para doctor ${doctorName}:`, error);
      return [];
    }
  }

  // Generar mensaje de no disponibilidad
  generateNoAvailabilityMessage(
    specialty: string, 
    doctorName?: string,
    alternativeSpecialty?: string
  ): string {
    let baseMessage = doctorName 
      ? `Lamentablemente no tengo sobrecupos disponibles del **Dr. ${doctorName}** en este momento.`
      : `Lamentablemente no tengo sobrecupos de **${specialty}** disponibles en este momento.`;
    
    if (alternativeSpecialty) {
      baseMessage += `\n\nComo alternativa, ¿te interesaría ver un especialista en **${alternativeSpecialty}**?`;
    } else {
      baseMessage += `\n\n¿Te gustaría que tome tus datos para contactarte cuando tengamos disponibilidad?`;
    }
    
    return baseMessage;
  }

  // Crear sesión base para continuar flujo
  createBaseSession(
    specialty: string,
    records: AirtableRecord[],
    motivo: string,
    respuestaEmpatica: string,
    selectedOptions?: AirtableRecord[],
    alternativeSpecialty?: string,
    alternativeRecords?: AirtableRecord[]
  ): any {
    return {
      specialty,
      records,
      motivo,
      respuestaEmpatica,
      attempts: 0,
      ...(selectedOptions && { selectedOptions }),
      ...(alternativeSpecialty && { alternativeSpecialty }),
      ...(alternativeRecords && { alternativeRecords })
    };
  }
}

// Instancia singleton del servicio
export const appointmentService = new AppointmentService();