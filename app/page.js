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
      {/* Logo animado SVG centrado, más grande */}
      <div
        ref={logoRef}
        style={{
          opacity: 0,
          transform: "translateY(-35px)",
          transition: "opacity 0.9s cubic-bezier(.6,.2,0,1), transform 0.8s cubic-bezier(.7,.4,0,1)",
          marginTop: '6rem',    // Más espacio superior
          marginBottom: '2.8rem',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <img
          src="/sobrecupos.svg"
          alt="Logo Sobrecupos"
          style={{ width: 190, height: "auto", maxWidth: "85vw", display: 'block' }}
        />
      </div>
      {/* Eliminar <h1> Sobrecupos </h1> */}

      <div
        style={{
          width: '100%',
          maxWidth: 340,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
          marginBottom: '3rem',
          alignItems: 'center'
        }}
      >
        <AnimatedButton onClick={() => router.push('/chat')}
          color="#23263b" bg="#fff" shadow="#23263b22"
          small
        >
          💬 Chatea con IA
        </AnimatedButton>
        <AnimatedButton onClick={() => router.push('/especialidades')}
          color="#fff" bg="rgba(33, 150, 243, 0.92)" shadow="#2196f321"
          small
        >
          🩺 Especialidades
        </AnimatedButton>
        <AnimatedButton onClick={() => router.push('/medicos')}
          color="#23263b" bg="#fff" shadow="#23263b10" border="#23263b"
          small
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

// Botón animado más estilizado y pequeño
function AnimatedButton({children, onClick, color, bg, shadow, border, small}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: small ? '0.72em 0' : '1.07em 0',
        borderRadius: 18,
        border: border ? `2px solid ${border}` : 'none',
        fontSize: small ? '1.09rem' : '1.22rem',
        fontWeight: 600,
        background: bg,
        color: color,
        cursor: 'pointer',
        boxShadow: `0 2px 10px 0 ${shadow}`,
        transition: 'background 0.17s, color 0.13s, border 0.13s, transform 0.13s',
        outline: 'none',
        willChange: 'transform',
        minHeight: 46,
        letterSpacing: '-0.01em'
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