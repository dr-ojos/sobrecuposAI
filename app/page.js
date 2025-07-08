"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="sobrecupos-home">
      <header className="sobrecupos-header">
        <h1>Sobrecupos</h1>
      </header>

      <div className="sobrecupos-buttons">
        <button className="sobrecupos-btn" onClick={() => router.push("/especialidades")}>
          <span>Especialidad</span>
        </button>
        <button className="sobrecupos-btn" onClick={() => router.push("/medicos")}>
          <span>Médicos</span>
        </button>
      </div>

      <footer className="sobrecupos-chat-footer">
        {/* Aquí va el chat flotante abajo */}
        {/* Puedes importar y reutilizar tu componente de chat si quieres */}
        <div className="chat-fake-bar">
          <span>Te ayudo a buscar sobrecupos</span>
        </div>
      </footer>

      <style>{`
        .sobrecupos-home {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fff;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .sobrecupos-header {
          margin-top: 40px;
          margin-bottom: 28px;
        }
        .sobrecupos-header h1 {
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -1px;
          color: #222;
          text-align: center;
        }
        .sobrecupos-buttons {
          display: flex;
          gap: 18px;
          justify-content: center;
          margin-bottom: 80px;
        }
        .sobrecupos-btn {
          background: rgba(49, 133, 252, 0.10); /* azul translúcido */
          color: #234;
          border: none;
          border-radius: 18px;
          padding: 16px 36px;
          font-size: 1.12rem;
          font-weight: 700;
          box-shadow: 0 2px 12px #e0e7ef33;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .sobrecupos-btn:active {
          background: rgba(49, 133, 252, 0.20);
          box-shadow: 0 3px 16px #3185fc18;
        }
        .sobrecupos-chat-footer {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          display: flex;
          justify-content: center;
          background: transparent;
          z-index: 15;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
        }
        .chat-fake-bar {
          background: #f6f8fa;
          border-radius: 17px;
          box-shadow: 0 1px 7px #e0e7ef33;
          padding: 13px 23px;
          font-size: 1.1rem;
          color: #333;
          font-family: inherit;
          text-align: center;
          min-width: 240px;
        }
        @media (max-width: 520px) {
          .sobrecupos-header h1 { font-size: 1.7rem; }
          .sobrecupos-btn { font-size: 1rem; padding: 13px 15vw; }
        }
      `}</style>
    </div>
  );
}