// Script para poblar Firebase con datos de ejemplo
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACI21jF713heFeL8baKbr-4iwA2-guGCA",
  authDomain: "sobrecupos-ia.firebaseapp.com",
  projectId: "sobrecupos-ia",
  storageBucket: "sobrecupos-ia.firebasestorage.app",
  messagingSenderId: "184948204974",
  appId: "1:184948204974:web:e245e3dd14fddd9798543f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de ejemplo para poblar Firebase
const sampleSobrecupos = [
  {
    Especialidad: 'Cardiología',
    Médico: ['rec123'],
    'Name (from Médico)': ['Dr. Juan Pérez'],
    Fecha: '2025-08-26',
    Hora: '10:00',
    Disponible: 'Si',
    Clínica: 'Clínica Las Condes',
    Dirección: 'Av. Las Condes 123',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Especialidad: 'Dermatología', 
    Médico: ['rec456'],
    'Name (from Médico)': ['Dra. María González'],
    Fecha: '2025-08-27',
    Hora: '14:00',
    Disponible: 'Si',
    Clínica: 'Clínica UC',
    Dirección: 'Av. Libertador 456',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Especialidad: 'Reumatología',
    Médico: ['rec789'],
    'Name (from Médico)': ['Dr. Carlos López'],
    Fecha: '2025-08-28', 
    Hora: '09:00',
    Disponible: 'Si',
    Clínica: 'Hospital Salvador',
    Dirección: 'Av. Salvador 789',
    createdTime: '2025-08-25T17:00:00.000Z'
  }
];

const sampleDoctors = [
  {
    Name: 'Dr. Juan Pérez',
    Especialidad: 'Cardiología',
    WhatsApp: '+56912345678',
    Email: 'juan.perez@clinica.com',
    Atiende: 'Ambos',
    Estado: 'Activo',
    Experiencia: '15 años',
    AreasInteres: 'Cardiología interventiva, Ecocardiografía',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Name: 'Dra. María González',
    Especialidad: 'Dermatología', 
    WhatsApp: '+56987654321',
    Email: 'maria.gonzalez@clinica.com',
    Atiende: 'Adultos',
    Estado: 'Activo',
    Experiencia: '10 años',
    AreasInteres: 'Dermatología oncológica, Cosmética',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Name: 'Dr. Carlos López',
    Especialidad: 'Reumatología',
    WhatsApp: '+56911223344', 
    Email: 'carlos.lopez@hospital.com',
    Atiende: 'Ambos',
    Estado: 'Activo',
    Experiencia: '20 años',
    AreasInteres: 'Artritis reumatoide, Lupus',
    createdTime: '2025-08-25T17:00:00.000Z'
  }
];

const sampleClinics = [
  {
    Name: 'Clínica Las Condes',
    Dirección: 'Av. Las Condes 123',
    Teléfono: '+56222345678',
    Email: 'info@clinicalascondes.com',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Name: 'Clínica UC',
    Dirección: 'Av. Libertador 456', 
    Teléfono: '+56233456789',
    Email: 'contacto@uc.com',
    createdTime: '2025-08-25T17:00:00.000Z'
  },
  {
    Name: 'Hospital Salvador',
    Dirección: 'Av. Salvador 789',
    Teléfono: '+56244567890', 
    Email: 'info@salvador.com',
    createdTime: '2025-08-25T17:00:00.000Z'
  }
];

// Función para poblar colección
async function seedCollection(collectionName, data) {
  try {
    const collectionRef = collection(db, collectionName);
    
    for (const item of data) {
      await addDoc(collectionRef, {
        ...item,
        migratedAt: new Date().toISOString()
      });
    }
    
    console.log(`✅ ${collectionName}: ${data.length} documentos creados`);
  } catch (error) {
    console.error(`❌ Error poblando ${collectionName}:`, error);
  }
}

// Función principal
async function seedFirebase() {
  console.log('🌱 === POBLANDO FIREBASE CON DATOS DE EJEMPLO ===');
  
  try {
    // Poblar sobrecupos
    await seedCollection('sobrecupos', sampleSobrecupos);
    
    // Poblar médicos
    await seedCollection('doctors', sampleDoctors);
    
    // Poblar clínicas
    await seedCollection('clinics', sampleClinics);
    
    console.log('\n🎉 === FIREBASE POBLADO EXITOSAMENTE ===');
    console.log('✅ Datos de ejemplo creados');
    console.log('🔥 Sistema listo para testing');
    
  } catch (error) {
    console.error('❌ Error poblando Firebase:', error);
  }
}

// Ejecutar
seedFirebase().then(() => {
  console.log('✅ Seeding completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});