'use client';
import { useState } from "react";

export default function RegistroMedicosPage() {
  const [step, setStep] = useState("login");
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [atencion, setAtencion] = useState("");
  const [lugares, setLugares] = useState("");

  const handleGoogleLogin = async () => {
    // Aquí iría la lógica con NextAuth o Firebase
    // await signIn("google")
    setStep("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aquí guardarías en tu base de datos/Airtable
    alert("Datos guardados correctamente.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      padding: 20
    }}>
      {step === "login" && (
        <>
          <h1>Registro de Médicos</h1>
          <button
            onClick={handleGoogleLogin}
            style={{
              padding: "12px 24px",
              fontSize: "1.1rem",
              borderRadius: 8,
              background: "#4285F4",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}>
            Iniciar sesión con Google
          </button>
        </>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, width: "100%" }}>
          <h2>Completa tu información</h2>
          <label>
            Nombre completo
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 10 }}
            />
          </label>
          <label>
            Especialidad
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 10 }}
            />
          </label>
          <label>
            Atiende a
            <select
              value={atencion}
              onChange={(e) => setAtencion(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 10 }}
            >
              <option value="">Selecciona</option>
              <option value="Adultos">Adultos</option>
              <option value="Niños">Niños</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label>
            Lugares de atención
            <textarea
              value={lugares}
              onChange={(e) => setLugares(e.target.value)}
              required
              style={{ width: "100%", marginBottom: 10 }}
            />
          </label>
          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            fontSize: "1rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 6
          }}>
            Guardar datos
          </button>
        </form>
      )}
    </div>
  );
}