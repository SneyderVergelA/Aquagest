import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ───────────────────────────────────────────────────────────────
// URL del backend.
// • Con Expo Go se detecta sola (usa la IP del computador que corre Expo).
// • Para el APK (o si la detección falla) escribe aquí la IP de tu computador,
//   por ejemplo: 'http://192.168.1.15:3100'
// ───────────────────────────────────────────────────────────────
const URL_MANUAL = '';

function detectarUrl(): string {
  // En el navegador, el backend está en el mismo equipo desde el que se abrió la página
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3100`;
  }
  const host = (Constants.expoConfig as any)?.hostUri?.split(':')[0];
  return host ? `http://${host}:3100` : 'http://10.0.2.2:3100';
}

export const API_URL = URL_MANUAL || detectarUrl();

let token: string | null = null;
let alSesionVencida: (() => void) | null = null;

export const setToken = (t: string | null) => { token = t; };
export const setAlSesionVencida = (fn: (() => void) | null) => { alSesionVencida = fn; };

type Opciones = { method?: string; body?: any };

export async function api<T = any>(ruta: string, { method = 'GET', body }: Opciones = {}): Promise<T> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(API_URL + ruta, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    });
  } catch (e) {
    throw new Error(`No se pudo conectar con el servidor (${API_URL}). Revisa que el backend esté encendido y que el celular esté en la misma red Wi-Fi.`);
  } finally {
    clearTimeout(temporizador);
  }

  let datos: any = null;
  try { datos = await res.json(); } catch (e) { /* respuesta sin cuerpo */ }

  if (!res.ok) {
    if (res.status === 401 && token && alSesionVencida) alSesionVencida();
    throw new Error(datos?.message || 'Ocurrió un error, intenta de nuevo');
  }
  return datos as T;
}
