// Los importes se guardan en centavos (enteros) para no arrastrar errores de punto flotante.
export const pesos = (n) => Math.round(n * 100);

export function mx(centavos) {
  const neg = centavos < 0;
  const abs = Math.abs(centavos);
  const enteros = Math.floor(abs / 100);
  const frac = abs % 100;
  const txt = enteros.toLocaleString('es-MX');
  return `${neg ? '-' : ''}$${txt}${frac ? '.' + String(frac).padStart(2, '0') : ''}`;
}

// Convierte lo que teclea la persona ("1,030", "$ 1030.50") a centavos. Devuelve null si no es válido.
export function leerImporte(texto) {
  const limpio = String(texto ?? '').replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  return Math.round(parseFloat(limpio) * 100);
}

export const suma = (lista) => lista.reduce((t, x) => t + x, 0);
