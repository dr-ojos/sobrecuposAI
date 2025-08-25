// Servicio Firebase para reemplazar Airtable
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  QuerySnapshot,
  DocumentData 
} from "firebase/firestore";
import { db } from "./config";

// Interfaces para mantener compatibilidad con código existente
export interface FirebaseRecord {
  id: string;
  createdTime: string;
  fields: {
    [key: string]: any;
  };
}

export class FirebaseService {
  
  // Convertir documento Firebase a formato compatible con Airtable
  private formatRecord(doc: any): FirebaseRecord {
    const data = doc.data();
    return {
      id: doc.id,
      createdTime: data.createdTime || new Date().toISOString(),
      fields: data
    };
  }

  // SOBRECUPOS - Obtener todos
  async fetchAllSobrecupos(): Promise<FirebaseRecord[]> {
    try {
      const sobrecuposRef = collection(db, 'sobrecupos');
      const snapshot = await getDocs(sobrecuposRef);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error('Error fetching sobrecupos:', error);
      return [];
    }
  }

  // SOBRECUPOS - Por especialidad
  async fetchSobrecuposBySpecialty(specialty: string): Promise<FirebaseRecord[]> {
    try {
      const sobrecuposRef = collection(db, 'sobrecupos');
      const q = query(sobrecuposRef, where('Especialidad', '==', specialty));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error('Error fetching sobrecupos by specialty:', error);
      return [];
    }
  }

  // MÉDICOS - Obtener todos
  async fetchAllDoctors(): Promise<FirebaseRecord[]> {
    try {
      const doctorsRef = collection(db, 'doctors');
      const snapshot = await getDocs(doctorsRef);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  // MÉDICOS - Por ID
  async fetchDoctorById(doctorId: string): Promise<FirebaseRecord | null> {
    try {
      const doctorRef = doc(db, 'doctors', doctorId);
      const docSnap = await getDoc(doctorRef);
      
      if (docSnap.exists()) {
        return this.formatRecord(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      return null;
    }
  }

  // CLÍNICAS - Obtener todas
  async fetchAllClinics(): Promise<FirebaseRecord[]> {
    try {
      const clinicsRef = collection(db, 'clinics');
      const snapshot = await getDocs(clinicsRef);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error('Error fetching clinics:', error);
      return [];
    }
  }

  // PACIENTES - Crear
  async createPatient(patientData: any): Promise<string | null> {
    try {
      const patientsRef = collection(db, 'patients');
      const docRef = await addDoc(patientsRef, {
        ...patientData,
        createdTime: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating patient:', error);
      return null;
    }
  }

  // SOBRECUPOS - Actualizar (reservar)
  async updateSobrecupo(sobrecupoId: string, updateData: any): Promise<boolean> {
    try {
      const sobrecupoRef = doc(db, 'sobrecupos', sobrecupoId);
      await updateDoc(sobrecupoRef, {
        ...updateData,
        updatedTime: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating sobrecupo:', error);
      return false;
    }
  }

  // SOLICITUDES PENDIENTES - Crear
  async createPendingRequest(requestData: any): Promise<string | null> {
    try {
      const requestsRef = collection(db, 'pending_requests');
      const docRef = await addDoc(requestsRef, {
        ...requestData,
        createdTime: new Date().toISOString(),
        Status: 'Pendiente'
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating pending request:', error);
      return null;
    }
  }

  // SOLICITUDES PENDIENTES - Obtener todas
  async fetchPendingRequests(): Promise<FirebaseRecord[]> {
    try {
      const requestsRef = collection(db, 'pending_requests');
      const q = query(requestsRef, orderBy('createdTime', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  // SOLICITUDES PENDIENTES - Eliminar
  async deletePendingRequest(requestId: string): Promise<boolean> {
    try {
      const requestRef = doc(db, 'pending_requests', requestId);
      await deleteDoc(requestRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting pending request:', error);
      return false;
    }
  }

  // ESPECIALIDADES - Obtener disponibles
  async getAvailableSpecialties(): Promise<string[]> {
    try {
      const sobrecuposRef = collection(db, 'sobrecupos');
      const snapshot = await getDocs(sobrecuposRef);
      
      const specialties = new Set<string>();
      snapshot.docs.forEach(doc => {
        const specialty = doc.data().Especialidad;
        if (specialty) {
          specialties.add(specialty);
        }
      });
      
      return Array.from(specialties);
    } catch (error) {
      console.error('Error getting specialties:', error);
      return [];
    }
  }

  // BÚSQUEDA GENERAL
  async searchRecords(collectionName: string, field: string, value: any): Promise<FirebaseRecord[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where(field, '==', value));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => this.formatRecord(doc));
    } catch (error) {
      console.error(`Error searching ${collectionName}:`, error);
      return [];
    }
  }
}

// Instancia singleton del servicio Firebase
export const firebaseService = new FirebaseService();