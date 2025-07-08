'use client';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const logoRef = useRef();

  useEffect(() => {
    // Animación inicial del logo
    if (logoRef.current) {
      logoRef.current.style.opacity = 1;
      logoRef.current.style.transform = "translateY(0)";
    }
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #fafdff 0%, #e8f0fb 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        padding: '0 1rem'
      }}
    >
      {/* Logo animado SVG */}
      <div
        ref={logoRef}
        style={{
          opacity: 0,
          transform: "translateY(-35px)",
          transition: "opacity 0.9s cubic-bezier(.6,.2,0,1), transform 0.8s cubic-bezier(.7,.4,0,1)",
          marginTop: '6rem',    // Más espacio superior
          marginBottom: '1.6rem'
        }}
      >
        <img
          src="/sobrecupos.svg"
          alt="Logo Sobrecupos"
          width={90}
          height={52}
          style={{ display: 'block' }}
        />
      </div>
      <h1
        style={{
          fontSize: '2.6rem',
          fontWeight: 800,
          letterSpacing: '-1.2px',
          color: '#23263b',
          marginBottom: '2.1rem',
          textShadow: '0 2px 12px #e6ecf5',
          textAlign: 'center'
        }}
      >
        Sobrecupos
      </h1>
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '3rem',
          alignItems: 'center'
        }}
      >
        <AnimatedButton onClick={() => router.push('/chat')}
          color="#23263b" bg="#fff" shadow="#23263b33"
        >
          💬 Chatea con IA
        </AnimatedButton>
        <AnimatedButton onClick={() => router.push('/especialidades')}
          color="#fff" bg="rgba(33, 150, 243, 0.92)" shadow="#2196f321"
        >
          🩺 Especialidades
        </AnimatedButton>
        <AnimatedButton onClick={() => router.push('/medicos')}
          color="#23263b" bg="#fff" shadow="#23263b18" border="#23263b"
        >
          👨‍⚕️ Médicos
        </AnimatedButton>
      </div>
      <div
        style={{
          fontSize: '1.05rem',
          color: '#9cabba',
          fontWeight: 400,
          marginTop: 'auto',
          textAlign: 'center',
          maxWidth: 340,
          marginBottom: '5.5rem', // Más espacio inferior para mejorar el estilo
        }}
      >
        ¿Tienes alguna duda o síntoma?
        <span style={{fontWeight:500}}> Chatea aquí con nuestro asistente IA y recibe ayuda en segundos.</span>
      </div>
    </main>
  );
}

// Botón animado (con animación hover/tap)
function AnimatedButton({children, onClick, color, bg, shadow, border}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1.07em 0',
        borderRadius: 20,
        border: border ? `2px solid ${border}` : 'none',
        fontSize: '1.22rem',
        fontWeight: 600,
        background: bg,
        color: color,
        cursor: 'pointer',
        boxShadow: `0 3px 18px 0 ${shadow}`,
        transition: 'background 0.17s, color 0.13s, border 0.13s, transform 0.13s',
        outline: 'none',
        willChange: 'transform',
      }}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
      onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {children}
    </button>
  )
}