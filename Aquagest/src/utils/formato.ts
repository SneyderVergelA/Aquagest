const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function moneda(valor: number | string | null | undefined): string {
  const n = Math.round(Number(valor) || 0);
  return '$ ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function cantidad(valor: number | string): string {
  const n = Number(valor) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

const dos = (n: number) => String(n).padStart(2, '0');

// Fecha local en formato YYYY-MM-DD (sin desfase de zona horaria)
export function fechaISO(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export const hoyISO = () => fechaISO(new Date());

export function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

export function dePartes(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

// '2026-10-28' → '28 oct 2026'
export function formatFecha(iso: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

export function diaSemana(d: Date): string {
  return DIAS[d.getDay()];
}

export function mesCorto(d: Date): string {
  return MESES[d.getMonth()];
}

// '14:30' → '2:30 p. m.'
export function formatHora(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dos(m)} ${sufijo}`;
}

export function formatFechaHoraDB(texto: string): string {
  // '2026-10-28 14:30:00' → '28 oct 2026, 2:30 p. m.'
  if (!texto) return '';
  const [f, h] = texto.split(' ');
  return `${formatFecha(f)}, ${formatHora((h || '').slice(0, 5))}`;
}

export const numeroFactura = (id: number) => String(id).padStart(5, '0');

export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function textoDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
