export type Aviso = { texto: string; tipo: 'exito' | 'error' | 'info' };

let escuchador: ((a: Aviso) => void) | null = null;

// Muestra un aviso breve en la parte de arriba de la pantalla (se quita solo)
export function avisar(texto: string, tipo: Aviso['tipo'] = 'exito') {
  if (escuchador) escuchador({ texto, tipo });
}

export function registrarAvisos(fn: ((a: Aviso) => void) | null) {
  escuchador = fn;
}
