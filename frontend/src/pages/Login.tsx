// Pantalla de login — mismas credenciales que Statia Go
// by Jose Rodas
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setCargando(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('Correo o contraseña incorrectos.');
    setCargando(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '12px 14px', color: '#f1f5f9', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0f14', fontFamily: 'Inter, sans-serif', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '36px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: '#f1f5f9' }}>
            Statia Expert
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            Sistemas expertos con IA
          </div>
        </div>

        <form onSubmit={ingresar}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Correo
            </div>
            <input
              style={inp} type="email" autoComplete="email"
              placeholder="tu@correo.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Contraseña
            </div>
            <input
              style={inp} type="password" autoComplete="current-password"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 16,
              fontSize: 12, color: '#f87171', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={cargando} style={{
            width: '100%', padding: '13px',
            background: cargando ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
            border: '1px solid rgba(99,102,241,0.5)', borderRadius: 10,
            color: '#a5b4fc', fontSize: 14, fontWeight: 700,
            cursor: cargando ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
          }}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Usa tu cuenta de Statia Go
        </div>
      </div>
    </div>
  );
}
