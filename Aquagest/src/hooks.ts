import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Carga datos cada vez que la pantalla se muestra y permite "jalar para actualizar".
// `cargar` puede cambiar en cada render: se guarda en una referencia para no repetir la carga.
export function useCarga<T>(cargar: () => Promise<T>, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState('');
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  const ejecutar = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    try {
      setError('');
      setDatos(await cargarRef.current());
    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { ejecutar(); }, [ejecutar]));

  return {
    datos,
    cargando,
    recargando,
    error,
    recargar: () => ejecutar(true),
    reintentar: () => ejecutar(),
    setDatos,
  };
}
