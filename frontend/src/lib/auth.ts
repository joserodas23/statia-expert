// Auth compartido con Statia Go — misma tabla perfiles, mismo hash PBKDF2
// by Jose Rodas
import { supabase } from './supabase';

export interface Sesion {
  id: string;
  username: string;
  nombre: string;
  rol: string;
}

const SESSION_KEY = 'statia_expert_session';

export function getSesion(): Sesion | null {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function clearSesion() {
  localStorage.removeItem(SESSION_KEY);
}

async function hashPbkdf2(password: string, salt: string): Promise<string> {
  const enc    = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits   = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 200000, hash: 'SHA-256' },
    keyMat, 256,
  );
  const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return 'pbkdf2:' + hex;
}

async function hashLegacy(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'statia_2025'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(
  username: string,
  password: string,
): Promise<{ ok: boolean; msg?: string; sesion?: Sesion }> {
  const uname = username.toLowerCase().trim();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, username, password_hash, rol, nombre')
    .eq('username', uname)
    .single();

  if (error || !data) return { ok: false, msg: 'Usuario no encontrado.' };

  const hash   = data.password_hash as string;
  const computed = hash.startsWith('pbkdf2:')
    ? await hashPbkdf2(password, uname)
    : await hashLegacy(password);

  if (computed !== hash) return { ok: false, msg: 'Contraseña incorrecta.' };

  const sesion: Sesion = {
    id:       data.id,
    username: data.username as string,
    nombre:   data.nombre   as string,
    rol:      data.rol      as string,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  return { ok: true, sesion };
}
