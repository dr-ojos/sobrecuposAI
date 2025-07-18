import { useState } from 'react';

export default function DebugLogin() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const diagnose = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔍 Diagnóstico Login - Sobrecupos</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="email"
          placeholder="Ingresa tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            padding: '0.5rem', 
            width: '300px', 
            marginRight: '1rem',
            fontSize: '16px'
          }}
        />
        <button 
          onClick={diagnose}
          disabled={loading || !email}
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#007aff', 
            color: 'white', 
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Diagnosticando...' : 'Diagnosticar'}
        </button>
      </div>

      {result && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <h3>📋 Resultado del Diagnóstico:</h3>
          <pre style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}