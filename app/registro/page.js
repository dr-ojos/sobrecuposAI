'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userType: 'patient', // Fijo como paciente
    name: '',
    phone: '',
    email: '',
    rut: '',
    birthDate: '', // Nueva: fecha de nacimiento
    acceptTerms: false,
    acceptWhatsApp: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // Empezar directamente en step 1 (datos)

  const specialties = [
    'Medicina Familiar', 'Medicina Familiar Niños', 'Medicina Familiar Adultos',
    'Oftalmología', 'Dermatología', 'Pediatría', 'Cardiología', 
    'Neurología', 'Otorrinolaringología'
  ];

  // Función para calcular edad desde fecha de nacimiento
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecialtyToggle = (specialty) => {
    // Función removida - ya no necesaria
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'El nombre es obligatorio';
    if (!formData.phone.trim()) return 'El teléfono es obligatorio';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Email válido requerido';
    if (!formData.birthDate) return 'La fecha de nacimiento es obligatoria';
    if (!formData.acceptTerms) return 'Debes aceptar los términos y condiciones';
    
    // Validar que la fecha de nacimiento sea válida
    const age = calculateAge(formData.birthDate);
    if (age === null || age < 0 || age > 120) {
      return 'Fecha de nacimiento inválida';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setMessage(`❌ ${error}`);
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // 🎯 Solo para pacientes - API única
      const endpoint = '/api/whatsapp-patients';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('✅ Registro exitoso! Te contactaremos pronto por WhatsApp');
        setStep(3); // Paso de confirmación
        
        // Simular mensaje de WhatsApp automático para desarrollo
        if (formData.acceptWhatsApp) {
          setTimeout(() => {
            const whatsappMessage = `¡Hola ${formData.name}! Bienvenido a Sobrecupos. Ya puedes recibir notificaciones de sobrecupos por WhatsApp.`;
            
            console.log('📱 WhatsApp simulado enviado:', whatsappMessage);
          }, 1000);
        }
      } else {
        setMessage(`❌ Error: ${result.error || 'No se pudo completar el registro'}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión. Intenta nuevamente.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppLink = () => {
    const phone = '56912345678'; // Número de Sobrecupos
    const message = `Hola! Me registré en Sobrecupos como paciente y quiero más información.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // 🎉 Página de éxito
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Ya estás registrado para recibir notificaciones de sobrecupos por WhatsApp.
          </p>
          
          {formData.acceptWhatsApp && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm text-green-700">
                Te enviaremos actualizaciones por WhatsApp al {formData.phone}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/chat')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Buscar Sobrecupos Ahora
            </button>
            
            <a 
              href={generateWhatsAppLink()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors inline-block"
            >
              💬 Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <div className="text-2xl font-bold mb-2">
            <span>Sobrecupos</span>
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">AI</span>
          </div>
          <h1 className="text-xl font-semibold">Únete a Sobrecupos</h1>
          <p className="text-blue-100">Menos tiempo enfermo, más tiempo sano</p>
        </div>

        {/* Progress - Solo un paso ahora */}
        <div className="flex items-center justify-center py-4 bg-blue-50">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            ✓
          </div>
          <span className="ml-3 text-sm font-semibold text-blue-600">Registro de Paciente</span>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-sm font-semibold ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-900">
              Registro de Paciente
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                👤 Nombre completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                📱 WhatsApp
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+56 9 1234 5678"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Te contactaremos por WhatsApp para coordinar
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ejemplo@correo.com"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                🆔 RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                placeholder="12.345.678-9"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                🎂 Fecha de nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]} // No fechas futuras
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.birthDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Edad: {calculateAge(formData.birthDate)} años
                </p>
              )}
            </div>

            {/* Términos y condiciones */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Acepto los <a href="/terminos" target="_blank" className="text-blue-600 underline">términos y condiciones</a>
                </span>
              </label>

              <label className="flex items-start space-x-3 text-sm cursor-pointer bg-green-50 p-3 rounded-xl">
                <input
                  type="checkbox"
                  name="acceptWhatsApp"
                  checked={formData.acceptWhatsApp}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="font-semibold">📱 Acepto recibir notificaciones por WhatsApp</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Te avisaremos sobre sobrecupos disponibles y confirmaciones
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin">⏳</div>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Registrarse para Notificaciones</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}