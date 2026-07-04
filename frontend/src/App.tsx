import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSesion, clearSesion } from './lib/auth';
import type { Sesion } from './lib/auth';
import Home   from './pages/Home';
import Editor from './pages/Editor';
import Login  from './pages/Login';

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo,  setListo]  = useState(false);

  useEffect(() => {
    setSesion(getSesion());
    setListo(true);

    // Sincronizar entre pestañas
    const onStorage = () => setSesion(getSesion());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const cerrarSesion = () => { clearSesion(); setSesion(null); };

  if (!listo) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#0d0f14', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
      🧠 Cargando…
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={sesion ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/"       element={sesion ? <Home   usuario={sesion} onCerrarSesion={cerrarSesion} /> : <Navigate to="/login" replace />} />
        <Route path="/editor" element={sesion ? <Editor usuario={sesion} onCerrarSesion={cerrarSesion} /> : <Navigate to="/login" replace />} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
