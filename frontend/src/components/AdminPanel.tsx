// Panel de administración de usuarios — visible solo para super_admin
// by Jose Rodas
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Usuario {
  id: string;
  username: string;
  nombre: string;
  rol: string;
  email_recuperacion: string | null;
}

const ROL_COLORES: Record<string, string> = {
  super_admin: '#f87171',
  supervisor:  '#f87171',
  director:    '#f87171',
  docente:     '#a78bfa',
  estudiante:  'rgba(255,255,255,0.3)',
};

function iniciales(nombre: string) {
  return nombre.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [busqueda, setBusqueda]   = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [detalle, setDetalle]     = useState<Usuario | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      const { data, error: e } = await supabase
        .from('perfiles')
        .select('id, username, nombre, rol, email_recuperacion')
        .order('nombre');
      if (e) throw e;
      setUsuarios(data || []);
    } catch { setError('No se pudo cargar la lista de usuarios.'); }
    finally { setCargando(false); }
  }

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || u.nombre.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.email_recuperacion || '').toLowerCase().includes(q);
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    return matchQ && matchRol;
  });

  const roles = ['todos', ...Array.from(new Set(usuarios.map(u => u.rol)))];

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8,
    padding: '8px 12px', color: '#f1f5f9', fontSize: 12,
    boxSizing: 'border-box', outline: 'none',
  };
  const btn = (color = '#6366f1'): React.CSSProperties => ({
    fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
    background: `${color}1a`, border: `1px solid ${color}55`, color: color,
    whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
      }} />

      {/* panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: '#0a0c13', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}>

        {/* cabecera */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>
            Usuarios — Statia Expert
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 99,
            padding: '1px 8px', fontVariantNumeric: 'tabular-nums',
          }}>
            {usuarios.length}
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1,
            padding: '2px 6px', borderRadius: 6,
          }}>✕</button>
        </div>

        {/* búsqueda y filtro */}
        <div style={{ padding: '10px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <input
            style={{ ...inp, marginBottom: 8 }}
            placeholder="Buscar por nombre, usuario o correo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {roles.map(r => (
              <button key={r} onClick={() => setFiltroRol(r)} style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 10, cursor: 'pointer', border: '1px solid',
                background: filtroRol === r ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderColor: filtroRol === r ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                color: filtroRol === r ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando && (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Cargando…
            </div>
          )}
          {error && (
            <div style={{ padding: 20, textAlign: 'center', color: '#f87171', fontSize: 12 }}>{error}</div>
          )}
          {!cargando && !error && filtrados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Sin resultados
            </div>
          )}
          {filtrados.map(u => (
            <div key={u.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setDetalle(detalle?.id === u.id ? null : u)}
            >
              {/* avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `${ROL_COLORES[u.rol] || '#6366f1'}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: ROL_COLORES[u.rol] || '#a5b4fc',
              }}>
                {iniciales(u.nombre)}
              </div>

              {/* info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e8f0' }}>{u.nombre}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                  @{u.username}
                  {!u.email_recuperacion && (
                    <span style={{ marginLeft: 6, color: '#fbbf24', fontSize: 9 }}>sin email</span>
                  )}
                </div>
              </div>

              {/* rol badge */}
              <span style={{
                fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '2px 7px', borderRadius: 99,
                background: `${ROL_COLORES[u.rol] || '#6366f1'}18`,
                color: ROL_COLORES[u.rol] || '#a5b4fc',
                flexShrink: 0,
              }}>
                {u.rol}
              </span>

              {/* acciones inline */}
              <button
                onClick={e => { e.stopPropagation(); alert(`Reset contraseña: ${u.username}`); }}
                style={btn('#6366f1')}
              >
                Reset clave
              </button>
            </div>
          ))}
        </div>

        {/* detalle expandido */}
        {detalle && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '14px 22px 16px', flexShrink: 0,
            background: 'rgba(99,102,241,0.05)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Detalle — {detalle.nombre}</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setDetalle(null)}>✕</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 11, marginBottom: 12 }}>
              {[
                ['Usuario', `@${detalle.username}`],
                ['Rol', detalle.rol],
                ['Email', detalle.email_recuperacion || '—'],
                ['ID', detalle.id.slice(0, 8) + '…'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                  <div style={{ color: '#e2e8f0', fontFamily: k === 'Usuario' || k === 'ID' ? 'monospace' : 'inherit' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btn('#6366f1')} onClick={() => alert(`Reset contraseña: ${detalle.username}`)}>
                🔑 Reset contraseña
              </button>
              <button style={btn('#f87171')} onClick={() => alert(`Desactivar: ${detalle.username}`)}>
                Desactivar cuenta
              </button>
            </div>
          </div>
        )}

        {/* pie */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 22px', fontSize: 10.5, color: 'rgba(255,255,255,0.25)',
          display: 'flex', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span>{filtrados.length} de {usuarios.length} usuarios</span>
          <span>Statia Admin · Expert</span>
        </div>
      </div>
    </>
  );
}
