// Endpoint de prueba para email con médica femenina

import { NextResponse } from 'next/server';

function formatSpanishDate(dateString) {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Santiago'
    };
    return date.toLocaleDateString('es-CL', options);
  } catch (error) {
    return dateString;
  }
}

export async function GET() {
  // Datos de muestra con médica femenina
  const patientData = {
    name: "Ana María Rodríguez",
    rut: "12345678-9", 
    phone: "+56912345678",
    email: "ana.rodriguez@email.com",
    age: "45"
  };
  
  const appointmentData = {
    specialty: "Cardiología",
    doctorName: "Dra. María Elena González" // Médica femenina de prueba
  };
  
  const sobrecupoFields = {
    Fecha: "2025-08-15",
    Hora: "10:30",
    "Clínica": "Clínica Las Condes",
    "Dirección": "Lo Fontecilla 441"
  };
  
  const motivo = "Control cardiológico";
  
  const fechaFormateada = formatSpanishDate(sobrecupoFields.Fecha);
  const primerNombre = patientData.name.split(' ')[0];
  const nombreClinica = sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"] || "Clínica";
  const direccionClinica = sobrecupoFields["Dirección"] || sobrecupoFields["Direccion"] || "";
  
  // 🏥 FUNCIÓN PARA MANEJAR TÍTULO DEL MÉDICO
  function procesarNombreMedico(nombreCompleto) {
    if (!nombreCompleto) return { titulo: 'Dr.', nombre: 'Médico' };
    
    // Remover títulos existentes y limpiar
    const nombreLimpio = nombreCompleto
      .replace(/^(Dr\.|Dra\.|Doctor|Doctora)\s*/i, '')
      .trim();
    
    // Detectar género por nombres comunes femeninos
    const nombresFemeninos = [
      'María', 'Carmen', 'Ana', 'Isabel', 'Pilar', 'Dolores', 'Josefa', 'Rosa', 'Antonia', 'Francisca',
      'Laura', 'Cristina', 'Marta', 'Elena', 'Teresa', 'Patricia', 'Sandra', 'Monica', 'Andrea', 'Claudia',
      'Valentina', 'Camila', 'Fernanda', 'Alejandra', 'Daniela', 'Carolina', 'Javiera', 'Constanza',
      'Esperanza', 'Soledad', 'Amparo', 'Concepción', 'Remedios', 'Encarnación', 'Asunción'
    ];
    
    const primerNombreMedico = nombreLimpio.split(' ')[0];
    const esFemenino = nombresFemeninos.some(nombre => 
      primerNombreMedico.toLowerCase().includes(nombre.toLowerCase())
    );
    
    return {
      titulo: esFemenino ? 'Dra.' : 'Dr.',
      nombre: nombreLimpio
    };
  }
  
  const { titulo, nombre } = procesarNombreMedico(appointmentData.doctorName);
  
  const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Confirmada - SobrecuposIA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #171717 0%, #404040 100%); color: white; padding: 2rem; text-align: center;">
      <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em;">
        🩺 SobrecuposIA
      </h1>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">
        Tu cita médica confirmada
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Mensaje Personal del Médico -->
      <div style="margin-bottom: 1.5rem; background: #f8fafc; border-left: 4px solid #ec4899; padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 500;">
          Hola ${primerNombre}, yo ${titulo} ${nombre}, te autoricé Sobrecupo para el día ${fechaFormateada} a las ${sobrecupoFields.Hora} en ${nombreClinica} que queda ${direccionClinica}.
        </p>
        <p style="margin: 0.75rem 0 0 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 600;">
          Recuerda mostrar esto en caja y pagar tu consulta.
        </p>
      </div>

      <!-- Status de Confirmación -->
      <div style="margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #666; font-size: 1rem; line-height: 1.5;">
          Tu pago ha sido procesado exitosamente y tu cita está confirmada.
        </p>
      </div>

      <!-- Success Badge -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
        <span style="color: #166534; font-size: 1rem; font-weight: 600;">
          ✅ ¡Cita Confirmada Exitosamente!
        </span>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          📅 Detalles de tu Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${appointmentData.specialty}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Médico:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${titulo} ${nombre}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Fecha:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${fechaFormateada}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${sobrecupoFields.Hora}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${nombreClinica}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Dirección:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem; text-decoration: underline;">${direccionClinica}</td>
          </tr>
        </table>
      </div>

      <!-- Contact Information -->
      <div style="background: #f9fafb; border-top: 1px solid #e5e5e5; padding: 1.5rem; text-align: center;">
        <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
          Si tienes alguna consulta, escríbenos a
        </p>
        <p style="margin: 0 0 0.5rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">
          contacto@sobrecupos.com
        </p>
        <p style="margin: 0; color: #171717; font-size: 0.9rem; font-weight: 600;">
          Equipo Sobrecupos
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  return new Response(emailContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}