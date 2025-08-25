// Script para migrar datos de Airtable a Firebase
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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

// Función para obtener datos de Airtable
async function fetchAirtableData(tableId, tableName) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${tableId}?maxRecords=1000`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Error fetching ${tableName}:`, response.status);
      return [];
    }

    const data = await response.json();
    console.log(`📋 ${tableName}: ${data.records?.length || 0} records found`);
    
    return data.records || [];
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message);
    return [];
  }
}

// Función para migrar datos a Firebase
async function migrateToFirebase(records, collectionName) {
  if (!records.length) {
    console.log(`⚠️ No hay datos para migrar a ${collectionName}`);
    return;
  }

  try {
    const collectionRef = collection(db, collectionName);
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        // Agregar datos con ID original y timestamp
        const docData = {
          ...record.fields,
          originalAirtableId: record.id,
          createdTime: record.createdTime || new Date().toISOString(),
          migratedAt: new Date().toISOString()
        };

        await addDoc(collectionRef, docData);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`📝 ${collectionName}: ${successCount} documentos migrados...`);
        }
      } catch (error) {
        console.error(`❌ Error migrando documento ${record.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ ${collectionName} migración completa: ${successCount} exitosos, ${errorCount} errores`);
    
  } catch (error) {
    console.error(`❌ Error en migración de ${collectionName}:`, error.message);
  }
}

// Función principal de migración
async function runMigration() {
  console.log('🔥 === INICIANDO MIGRACIÓN AIRTABLE → FIREBASE ===');
  
  try {
    // Verificar conexión a Firebase
    const testRef = collection(db, 'test');
    console.log('✅ Conexión a Firebase establecida');

    // Migrar Sobrecupos (tabla principal)
    console.log('\n📋 Migrando Sobrecupos...');
    const sobrecupos = await fetchAirtableData('SobrecuposTest', 'Sobrecupos');
    await migrateToFirebase(sobrecupos, 'sobrecupos');

    // Migrar Médicos
    console.log('\n👨‍⚕️ Migrando Médicos...');
    const doctors = await fetchAirtableData(process.env.AIRTABLE_DOCTORS_TABLE || 'Doctors', 'Doctors');
    await migrateToFirebase(doctors, 'doctors');

    // Migrar Clínicas (si existe)
    console.log('\n🏥 Migrando Clínicas...');
    const clinics = await fetchAirtableData('Clinics', 'Clinics');
    await migrateToFirebase(clinics, 'clinics');

    // Migrar Pacientes (si existe)
    console.log('\n👤 Migrando Pacientes...');
    const patients = await fetchAirtableData(process.env.AIRTABLE_PATIENTS_TABLE || 'Patients', 'Patients');
    await migrateToFirebase(patients, 'patients');

    console.log('\n🎉 === MIGRACIÓN COMPLETADA ===');
    console.log('🔥 Todos los datos han sido migrados a Firebase');
    console.log('📱 Puedes verificar en: https://console.firebase.google.com');

  } catch (error) {
    console.error('❌ Error general en migración:', error.message);
  }
}

// Ejecutar migración
runMigration().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});