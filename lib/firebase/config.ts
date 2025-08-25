// Configuración Firebase para SobrecuposIA
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACI21jF713heFeL8baKbr-4iwA2-guGCA",
  authDomain: "sobrecupos-ia.firebaseapp.com",
  projectId: "sobrecupos-ia",
  storageBucket: "sobrecupos-ia.firebasestorage.app",
  messagingSenderId: "184948204974",
  appId: "1:184948204974:web:e245e3dd14fddd9798543f",
  measurementId: "G-57DL0CQZ3D"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;