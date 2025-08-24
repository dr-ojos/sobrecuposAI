# Sistema de Notificaciones Médicas - Configuración

## 📋 Checklist de Variables de Entorno

### Variables Requeridas (ya configuradas en el proyecto)

```bash
# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=contacto@sobrecupos.com

# Twilio WhatsApp  
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # Tu número Twilio WhatsApp

# Airtable (Base de datos)
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_DOCTORS_TABLE=Doctors  # Nombre de tabla de médicos
```

### Variables Nuevas para Control del Sistema

```bash
# Feature Flag - Activar/desactivar sistema
FEATURE_NOTIFY_DOCTOR=true  # 'true' para activar, 'false' para desactivar

# Modo Sandbox - Para testing seguro
NOTIFY_SANDBOX=1  # '1' para modo test, '0' para producción

# Emails/teléfonos de sandbox (solo si NOTIFY_SANDBOX=1)
SANDBOX_EMAIL=test@example.com
SANDBOX_PHONE=+56912345678

# URL base para links de booking (opcional)
NEXT_PUBLIC_BASE_URL=https://sobrecupos.com
```

## 🚀 Activación del Sistema

### Paso 1: Configurar Variables
```bash
# En Vercel Dashboard o .env.local
FEATURE_NOTIFY_DOCTOR=true
NOTIFY_SANDBOX=1  # Para empezar en modo test
SANDBOX_EMAIL=tu-email-de-pruebas@example.com
```

### Paso 2: Verificar Configuración
```bash
curl https://tu-dominio.vercel.app/api/notify-doctor-cli
```

Debe retornar:
```json
{
  "service": "Doctor Notification CLI",
  "status": "ready",
  "environment": {
    "FEATURE_NOTIFY_DOCTOR": "true",
    "NOTIFY_SANDBOX": "1",
    "SENDGRID_CONFIGURED": true,
    "TWILIO_CONFIGURED": true,
    "AIRTABLE_CONFIGURED": true
  }
}
```

## 🧪 Testing y Debugging

### Test Básico (Datos Simulados)
```bash
curl -X POST https://tu-dominio.vercel.app/api/notify-doctor-cli \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123", 
    "mode": "test"
  }'
```

### Test Completo (Con Airtable Real)
```bash
curl -X POST https://tu-dominio.vercel.app/api/notify-doctor-cli \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-456", 
    "mode": "booking",
    "payload": {
      "sobrecupoId": "recFj7aKdC9zBDwxu",
      "patientName": "Test Patient"
    }
  }'
```

### Test del Flujo de Pago Real
```bash
curl -X POST https://tu-dominio.vercel.app/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "NOTIFICATION_TEST",
    "sessionId": "test-session",
    "paymentData": {
      "sobrecupoId": "recFj7aKdC9zBDwxu",
      "patientName": "Test Patient",
      "patientEmail": "patient@test.com",
      "doctorName": "Dr. Test",
      "date": "2025-08-25",
      "time": "10:00 AM",
      "specialty": "Medicina General",
      "clinic": "Clínica Test",
      "motivo": "Test de notificaciones"
    }
  }'
```

## 🔍 Monitoreo y Logs

### Logs a Revisar
1. **Vercel Function Logs**: Para errores de ejecución
2. **SendGrid Activity**: Para entrega de emails
3. **Twilio Console**: Para entrega de WhatsApp

### Logs Específicos del Sistema
Busca estos patrones en los logs:
```
🚀 === INICIANDO SISTEMA PROFESIONAL DE NOTIFICACIONES MÉDICAS ===
[NOTIFY-DOCTOR:booking-id] 🚀 Iniciando notificación médica
✅ Sistema profesional: Email al médico enviado
✅ Sistema profesional: WhatsApp al médico enviado
```

### Debugging Común
```bash
# Ver estado de configuración
curl https://tu-dominio.vercel.app/api/notify-doctor-cli

# Test específico de un médico
curl -X POST https://tu-dominio.vercel.app/api/notify-doctor-cli \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "debug-789",
    "mode": "custom",
    "payload": {
      "bookingId": "debug-789",
      "doctorName": "Dr. Específico",
      "doctorEmail": "doctor-real@clinic.com",
      "patientName": "Paciente Debug",
      "appointmentDateTime": "2025-08-25 10:00",
      "appointmentTimezone": "America/Santiago",
      "specialty": "Cardiología",
      "clinicName": "Clínica Debug"
    }
  }'
```

## 🛡️ Seguridad y Producción

### Migrar de Sandbox a Producción
1. **Cambiar variables**:
   ```bash
   NOTIFY_SANDBOX=0  # Deshabilitar modo sandbox
   ```

2. **Verificar emails/teléfonos reales**: El sistema usará los datos reales de Airtable

3. **Monitorear entregas**: Revisar SendGrid y Twilio por fallos

### Rollback si Hay Problemas
```bash
# Deshabilitar sistema completo
FEATURE_NOTIFY_DOCTOR=false

# O volver a sandbox
NOTIFY_SANDBOX=1
```

## 📊 Métricas y Éxito

### Criterios de Aceptación
- ✅ Email al médico recibido con datos correctos
- ✅ WhatsApp al médico recibido con template correcto  
- ✅ Sin duplicados en re-ejecuciones
- ✅ Logs legibles con booking_id y estados
- ✅ Idempotencia funcionando (mismo booking_id no se duplica)

### Tests de Rendimiento
- ✅ Reintentos automáticos en fallos temporales
- ✅ Detención en errores permanentes (4xx)
- ✅ Backoff exponencial: 1s, 5s, 25s

## 🔧 Troubleshooting

### Error: "Feature NOTIFY_DOCTOR deshabilitada"
**Solución**: `FEATURE_NOTIFY_DOCTOR=true`

### Error: "Credenciales SendGrid no configuradas"
**Solución**: Verificar `SENDGRID_API_KEY` y `SENDGRID_FROM_EMAIL`

### Error: "Credenciales Twilio no configuradas"
**Solución**: Verificar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`

### Error: "Se require al menos doctorEmail o doctorWhatsApp"
**Solución**: Verificar datos en tabla Doctors de Airtable

### Email/WhatsApp no llega
1. **Revisar logs**: Buscar errores específicos
2. **Verificar sandbox**: Si `NOTIFY_SANDBOX=1`, revisa `SANDBOX_EMAIL/SANDBOX_PHONE`
3. **Verificar Airtable**: Confirma que el médico tiene Email/WhatsApp válidos
4. **Test directo**: Usar `/api/notify-doctor-cli` con datos específicos

### Performance/Timeouts
- Los reintentos pueden tardar hasta ~30 segundos (1s + 5s + 25s)
- El sistema no bloquea el flujo principal de pago
- Los fallos de notificación no afectan la confirmación de pago

## 🚀 Comandos NPM (Opcionales)

```json
{
  "scripts": {
    "notify:doctor": "curl -X POST https://tu-dominio.vercel.app/api/notify-doctor-cli",
    "test:notifications": "npm run notify:doctor -- -d '{\"bookingId\":\"test-123\",\"mode\":\"test\"}'"
  }
}
```

## 📞 Soporte

Para problemas específicos:
1. Revisar logs de Vercel
2. Verificar configuración con `/api/notify-doctor-cli`
3. Probar con datos específicos usando el CLI
4. Verificar estado de SendGrid y Twilio

**Sistema implementado por**: Claude Code siguiendo las mejores prácticas de idempotencia, reintentos y logging del proyecto SobrecuposIA.