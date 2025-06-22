'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Agrupa médicos por especialidad
function groupBySpecialty(doctors) {
  const groups = {};
  for (const d of doctors) {
    const esp = d.fields?.Especialidad || "Sin especialidad";
    if (!groups[esp]) groups[esp] = [];
    groups[esp].push(d);
  }
  return groups;
}

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    Name: "",
    Especialidad: "",
    WhatsApp: "",
    Email: "",
  });
  const [loading, setLoading] = useState(false);
  const [openSpecialty, setOpenSpecialty] = useState(null);
  const [openDoctor, setOpenDoctor] = useState(null);

  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setMsg("");
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setMsg("No se pudieron cargar los médicos.");
    }
  };

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error registrando médico");
      setForm({ Name: "", Especialidad: "", WhatsApp: "", Email: "" });
      fetchDoctors();
    } catch {
      setMsg("Error registrando médico.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("¿Estás seguro de eliminar este médico?")) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/doctors?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando médico");
      fetchDoctors();
    } catch {
      setMsg("Error eliminando médico.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por nombre/especialidad
  const filtered = doctors.filter(d => {
    const n = d.fields?.Name?.toLowerCase() || "";
    const e = d.fields?.Especialidad?.toLowerCase() || "";
    return (
      n.includes(filter.toLowerCase()) ||
      e.includes(filter.toLowerCase())
    );
  });

  const specialties = Object.entries(groupBySpecialty(filtered));

  // Maneja abrir/cerrar acordeón de especialidad
  const toggleSpecialty = (esp) => {
    setOpenSpecialty(openSpecialty === esp ? null : esp);
    setOpenDoctor(null); // Cierra médicos al cambiar especialidad
  };

  // Maneja abrir/cerrar acordeón de médico
  const toggleDoctor = (id) => {
    setOpenDoctor(openDoctor === id ? null : id);
  };

  return (
    <div style={{
      maxWidth: 500,
      margin: "0 auto",
      padding: 24,
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.11)",
      marginTop: 40,
      fontFamily: 'Inter, Arial, sans-serif'
    }}>
      {/* Botón de volver */}
      <button
        onClick={() => router.push("/admin")}
        style={{
          background: "#F3F6FA",
          border: "1px solid #b6c5e0",
          color: "#1D62F0",
          fontWeight: 600,
          fontSize: 15,
          padding: "8px 22px",
          borderRadius: 8,
          marginBottom: 18,
          cursor: "pointer",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: -4,
          marginBottom: 26,
          transition: "background .2s"
        }}
      >← Volver a carga de sobrecupos</button>

      <h1 style={{
        textAlign: "center",
        fontWeight: 700,
        fontSize: "2rem",
        marginBottom: 12
      }}>
        Médicos registrados
      </h1>

      <h2 style={{
        textAlign: "center",
        color: "#1D62F0",
        fontWeight: 600,
        marginBottom: 12,
        fontSize: "1.18rem",
        marginTop: 12
      }}>Agregar nuevo médico</h2>
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 20
      }}>
        <input
          type="text"
          name="Name"
          placeholder="Nombre completo"
          value={form.Name}
          onChange={handleInput}
          required
          maxLength={55}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #bbb",
            fontSize: 15
          }}
        />
        <input
          type="text"
          name="Especialidad"
          placeholder="Especialidad (ej: Oftalmología)"
          value={form.Especialidad}
          onChange={handleInput}
          required
          maxLength={40}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #bbb",
            fontSize: 15
          }}
        />
        <input
          type="text"
          name="WhatsApp"
          placeholder="WhatsApp (+569...)"
          value={form.WhatsApp}
          onChange={handleInput}
          required
          maxLength={20}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #bbb",
            fontSize: 15
          }}
        />
        <input
          type="email"
          name="Email"
          placeholder="Correo electrónico"
          value={form.Email}
          onChange={handleInput}
          required
          maxLength={60}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #bbb",
            fontSize: 15
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#1D62F0",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 17,
            padding: "12px 0",
            marginTop: 10,
            transition: "background .2s",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Guardando..." : "Agregar médico"}
        </button>
      </form>

      <input
        type="text"
        placeholder="Buscar médico por nombre, especialidad…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #bbb",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 15,
          boxSizing: "border-box"
        }}
      />

      {msg && <div style={{ color: "red", marginBottom: 12 }}>{msg}</div>}

      <ul style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        marginBottom: 24,
        maxHeight: 250,
        overflowY: "auto"
      }}>
        {specialties.length === 0 && (
          <li style={{ color: "#777", textAlign: "center" }}>
            No hay médicos registrados.
          </li>
        )}
        {specialties.map(([esp, docs]) => (
          <li key={esp} style={{
            background: "#F0F4FA",
            borderRadius: 9,
            marginBottom: 10,
            fontSize: 15,
            boxShadow: openSpecialty === esp ? "0 0 6px #d1e1fa" : undefined,
            transition: "box-shadow .2s"
          }}>
            <button
              onClick={() => toggleSpecialty(esp)}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                padding: "11px 15px",
                fontSize: 16,
                textAlign: "left",
                fontWeight: 700,
                color: "#1D62F0",
                borderRadius: 9,
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <span style={{ flex: 1 }}>{esp}</span>
              <span style={{
                fontSize: 19,
                transform: openSpecialty === esp ? "rotate(90deg)" : "rotate(0)",
                transition: "transform .2s"
              }}>
                ▶️
              </span>
            </button>
            {openSpecialty === esp && (
              <ul style={{ listStyle: "none", margin: 0, padding: "2px 0 2px 0" }}>
                {docs.map(d => (
                  <li key={d.id} style={{
                    background: "#F8F9FB",
                    borderRadius: 7,
                    margin: "7px 13px",
                    marginBottom: 7,
                    fontSize: 15,
                    position: "relative",
                    boxShadow: openDoctor === d.id ? "0 0 4px #e2e6ec" : undefined,
                    transition: "box-shadow .2s"
                  }}>
                    <button
                      onClick={() => toggleDoctor(d.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "8px 13px",
                        fontSize: 15,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontWeight: 600,
                        color: "#212121",
                        borderRadius: 7
                      }}
                    >
                      <span style={{
                        flex: 1,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        maxWidth: 140
                      }}>{d.fields?.Name}</span>
                      <span style={{
                        marginLeft: 8,
                        color: "#888",
                        fontWeight: 500,
                        fontSize: 14,
                        whiteSpace: "nowrap"
                      }}>{d.fields?.WhatsApp}</span>
                      <span style={{
                        marginLeft: 10,
                        fontSize: 18,
                        transform: openDoctor === d.id ? "rotate(90deg)" : "rotate(0)",
                        transition: "transform .2s"
                      }}>
                        ▶️
                      </span>
                    </button>
                    {openDoctor === d.id && (
                      <div style={{
                        borderTop: "1px solid #e2e8f0",
                        padding: "9px 13px",
                        background: "#f4f8fe",
                        borderRadius: "0 0 7px 7px"
                      }}>
                        <div style={{
                          marginBottom: 5,
                          fontSize: 14,
                          color: "#444",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6
                        }}>
                          <span><b>Email:</b> <span style={{ color: "#555" }}>{d.fields?.Email}</span></span>
                        </div>
                        <button
                          onClick={() => handleDelete(d.id)}
                          style={{
                            background: "#F36",
                            border: "none",
                            color: "#fff",
                            fontSize: 14,
                            borderRadius: 6,
                            padding: "5px 13px",
                            cursor: "pointer",
                            fontWeight: 600,
                            marginTop: 4,
                            marginBottom: 4
                          }}
                          disabled={loading}
                          title="Eliminar médico"
                        >Eliminar médico</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}