import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Home   from './pages/Home';
import Editor from './pages/Editor';
import Login  from './pages/Login';

export default function App() {
  const [usuario, setUsuario]  = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCargando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0f14', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
      🧠 Cargando…
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/"       element={usuario ? <Home usuario={usuario} />   : <Navigate to="/login" replace />} />
        <Route path="/editor" element={usuario ? <Editor usuario={usuario} /> : <Navigate to="/login" replace />} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
