'use client';
import { useState, useEffect } from "react";

export default function AdminSobrecuposPage() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [clinica, setClinica] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/doctors")
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(() => setMsg("No se pudieron cargar los médicos."));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (!doctorId) {
      setMsg("Debes seleccionar un médico.");
      setLoading(false);
      return;
    }

    try {
      const doctor = doctors.find(d => d.id === doctorId);
      const especialidad = doctor?.fields?.Especialidad || "";

      const res = await fetch("/api/sobrecupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medico: doctorId,
          especialidad,
          clinica,
          direccion,
          fecha,
          hora
        }),
      });

      if (res.ok) {
        setMsg("✅ Sobrecupo registrado correctamente.");
        setDoctorId("");
        setClinica("");
        setDireccion("");
        setFecha("");
        setHora("09:00");
      } else {
        const error = await res.json();
        setMsg("❌ Error: " + (error.error?.message || "No se pudo guardar."));
      }
    } catch (err) {
      setMsg("❌ Error en la red o el servidor.");
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-main">
      <main className="main-wrapper">
        <section className="card">
          <h1 className="title">Cargar Sobrecupos</h1>
          {msg && (
            <div className={"msg " + (msg.startsWith("✅") ? "success" : "error")}>
              {msg}
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>
                Doctor
                <select
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  required
                  disabled={loading || doctors.length === 0}
                >
                  <option value="">Selecciona un doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fields.Name} — {d.fields.Especialidad}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                Clínica
                <input
                  type="text"
                  value={clinica}
                  onChange={e => setClinica(e.target.value)}
                  required
                  placeholder="Ejemplo: Clínica Dávila"
                  disabled={loading}
                  maxLength={60}
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Dirección
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  required
                  placeholder="Ejemplo: Av. Providencia 1000"
                  disabled={loading}
                  maxLength={80}
                />
              </label>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    required
                    disabled={loading}
                  />
                </label>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Hora
                  <select
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {[
                      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
                      "15:00", "16:00", "17:00", "18:00"
                    ].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "⏳ Guardando..." : "Guardar Sobrecupo"}
            </button>
          </form>
          <div style={{ marginTop: 26, textAlign: "center" }}>
            <a href="/admin/doctors" className="return-link">
              ← Ir a página de carga de médicos
            </a>
          </div>
        </section>
      </main>
      <style>{`
        .bg-main {
          min-height: 100vh;
          background: linear-gradient(120deg,#e3effe 0%,#d7f3fc 100%);
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .main-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 4vw 2vw;
        }
        .card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px #0002;
          padding: 36px 6vw 30px 6vw;
          margin: 0 auto;
        }
        .title {
          font-size: 2rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 28px;
          color: #1b2233;
          letter-spacing: -1px;
        }
        .form-group {
          margin-bottom: 17px;
        }
        .form-group label {
          font-weight: 600;
          font-size: 1rem;
          color: #222;
          display: block;
        }
        .form-group input,
        .form-group select {
          margin-top: 5px;
          width: 100%;
          padding: 13px 12px;
          border: 1px solid #dde2ee;
          border-radius: 9px;
          font-size: 1rem;
          background: #f7fafd;
          transition: border 0.18s;
          outline: none;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus {
          border: 1.5px solid #0f83fd;
        }
        .form-row {
          display: flex;
          gap: 14px;
          margin-bottom: 13px;
        }
        .submit-btn {
          width: 100%;
          padding: 16px 0;
          font-size: 1.13rem;
          font-weight: 700;
          color: #fff;
          background: #0070f3;
          border: none;
          border-radius: 9px;
          margin-top: 2px;
          box-shadow: 0 2px 12px #0070f322;
          cursor: pointer;
          transition: background .17s;
        }
        .submit-btn:disabled {
          background: #b4daff;
          cursor: not-allowed;
        }
        .msg {
          margin-bottom: 18px;
          padding: 13px 18px;
          border-radius: 7px;
          font-weight: 600;
          font-size: 1.06rem;
          box-shadow: 0 2px 6px #0001;
          text-align: center;
        }
        .msg.success { background: #eaffea; color: #138946; }
        .msg.error { background: #ffeaea; color: #b23c3c; }
        .return-link {
          color: #0070f3;
          text-decoration: underline;
          font-weight: 500;
          font-size: 1rem;
        }
        @media (max-width: 600px) {
          .card {
            padding: 16vw 2vw 8vw 2vw;
            max-width: 99vw;
          }
          .form-row {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}