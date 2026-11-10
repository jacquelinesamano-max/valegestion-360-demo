const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fecha fija de la demostración, para que la historia sea la misma cada vez.
export const HOY = '2026-11-17';

export function parse(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(iso, n) {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function fechaLarga(iso) {
  const d = parse(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function fechaCorta(iso) {
  const d = parse(iso);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

// La quincena de cobranza se asigna por la fecha de pago (no por la fecha de corte).
export function quincenaDe(iso) {
  const d = parse(iso);
  const mitad = d.getDate() <= 15 ? 1 : 2;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return {
    id: `q-${d.getFullYear()}-${mm}-${mitad === 1 ? 'a' : 'b'}`,
    label: `${mitad}.ª quincena de ${MESES[d.getMonth()]} ${d.getFullYear()}`,
  };
}

export const minFecha = (fechas) => fechas.filter(Boolean).sort()[0] ?? null;
