// lib/whatsapp-notification.ts
// Función para notificar sobrecupos automáticamente

export async function notifyNewSobrecupo(sobrecupoData: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sobrecupoData)
    });
    
    const result = await response.json();
    console.log('📱 Notificación automática enviada:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error enviando notificación automática:', error);
    return { success: false, error: error.message };
  }
}