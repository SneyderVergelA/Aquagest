import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, setAlSesionVencida, setToken } from '../services/api';
import { avisar } from '../utils/aviso';

export const ROLES = { ADMIN: 1, EMPLEADO: 2, CLIENTE: 3 };
export const NOMBRE_ROL: Record<number, string> = { 1: 'Administrador', 2: 'Empleado', 3: 'Cliente' };

export type Usuario = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  tipo_documento: string;
  numero_documento: string;
  genero: string;
  correo: string;
  telefono: string;
  fk_pk_id_rol: number;
};

type AuthValue = {
  usuario: Usuario | null;
  cargando: boolean;
  esAdmin: boolean;
  esEmpleado: boolean;
  esCliente: boolean;
  esPersonal: boolean; // empleado o administrador
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  registrarCliente: (datos: Record<string, any>) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const CLAVE = 'aquagest_sesion';

// En el celular la sesión va al almacenamiento seguro; en el navegador (donde no existe) a localStorage
const almacen = {
  async leer(k: string): Promise<string | null> {
    if (Platform.OS === 'web') return window.localStorage.getItem(k);
    return SecureStore.getItemAsync(k);
  },
  async guardar(k: string, v: string) {
    if (Platform.OS === 'web') window.localStorage.setItem(k, v);
    else await SecureStore.setItemAsync(k, v);
  },
  async borrar(k: string) {
    if (Platform.OS === 'web') window.localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  },
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const guardarSesion = useCallback(async (token: string, u: Usuario) => {
    setToken(token);
    setUsuario(u);
    try { await almacen.guardar(CLAVE, JSON.stringify({ token, usuario: u })); } catch (e) { /* sin almacenamiento seguro */ }
  }, []);

  const cerrarSesion = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    try { await almacen.borrar(CLAVE); } catch (e) { /* nada que borrar */ }
  }, []);

  // Recupera la sesión guardada para no iniciar sesión cada vez que se abre la app
  useEffect(() => {
    setAlSesionVencida(() => { avisar('Tu sesión venció, inicia sesión de nuevo', 'error'); cerrarSesion(); });
    (async () => {
      try {
        const guardada = await almacen.leer(CLAVE);
        if (guardada) {
          const { token, usuario: u } = JSON.parse(guardada);
          setToken(token);
          setUsuario(u);
        }
      } catch (e) { /* sesión no disponible */ }
      setCargando(false);
    })();
    return () => setAlSesionVencida(null);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const r = await api('/login', { method: 'POST', body: { correo: correo.trim(), contrasena } });
    await guardarSesion(r.token, r.usuario);
    avisar(`¡Bienvenido, ${r.usuario.nombre}!`);
  }, [guardarSesion]);

  const registrarCliente = useCallback(async (datos: Record<string, any>) => {
    const r = await api('/registro', { method: 'POST', body: datos });
    await guardarSesion(r.token, r.usuario);
    avisar('Cuenta creada con éxito. ¡Bienvenido!');
  }, [guardarSesion]);

  const rol = usuario?.fk_pk_id_rol;
  const value = useMemo<AuthValue>(() => ({
    usuario,
    cargando,
    esAdmin: rol === ROLES.ADMIN,
    esEmpleado: rol === ROLES.EMPLEADO,
    esCliente: rol === ROLES.CLIENTE,
    esPersonal: rol === ROLES.ADMIN || rol === ROLES.EMPLEADO,
    iniciarSesion,
    registrarCliente,
    cerrarSesion,
  }), [usuario, cargando, rol, iniciarSesion, registrarCliente, cerrarSesion]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
