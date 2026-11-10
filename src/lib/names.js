// Comparación de nombres para sugerir coincidencias. Nunca une a nadie por sí sola:
// solo clasifica la sugerencia y la persona decide.
const STOP = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
const ABREVIATURAS = { ma: 'maria' };

export function normalizar(nombre) {
  return String(nombre)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(nombre) {
  return normalizar(nombre)
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .map((t) => ABREVIATURAS[t] ?? t);
}

// Clave que no depende del orden de las palabras (hay valeras que ponen apellidos primero).
export const claveNombre = (nombre) => tokens(nombre).sort().join(' ');

function puntajeToken(a, b) {
  if (a === b) return 1;
  if (a.length === 1 && b.startsWith(a)) return 0.8; // inicial: «G.» ~ «Guadalupe»
  if (b.length === 1 && a.startsWith(b)) return 0.8;
  if (a.length >= 3 && b.startsWith(a)) return 0.85; // nombre cortado por la valera
  if (b.length >= 3 && a.startsWith(b)) return 0.85;
  return 0;
}

export function comparar(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return { porcentaje: 0, tipo: 'ninguna' };
  if (claveNombre(a) === claveNombre(b)) return { porcentaje: 100, tipo: 'exacta' };
  const [corto, largo] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const usados = new Set();
  let total = 0;
  for (const t of corto) {
    let mejor = 0;
    let idx = -1;
    largo.forEach((u, i) => {
      if (usados.has(i)) return;
      const p = puntajeToken(t, u);
      if (p > mejor) {
        mejor = p;
        idx = i;
      }
    });
    if (idx < 0) return { porcentaje: 0, tipo: 'ninguna' };
    usados.add(idx);
    total += mejor;
  }
  const porcentaje = Math.round((100 * total) / largo.length);
  return porcentaje >= 75 ? { porcentaje, tipo: 'parcial' } : { porcentaje, tipo: 'ninguna' };
}

export function buscarCandidatos(nombre, clientes) {
  return clientes
    .map((cliente) => ({ cliente, ...comparar(nombre, cliente.nombre) }))
    .filter((c) => c.tipo !== 'ninguna')
    .sort((x, y) => y.porcentaje - x.porcentaje);
}

// seguro: una sola persona con las mismas palabras · probable: una sola con abreviatura o nombre cortado
// dudoso: varias posibles (no se elige ninguna) · nuevo: nadie se parece
export function clasificar(candidatos) {
  if (!candidatos.length) return 'nuevo';
  if (candidatos.length === 1) return candidatos[0].tipo === 'exacta' ? 'seguro' : 'probable';
  return 'dudoso';
}

export function explicar(nivel, nombreOriginal, candidatos) {
  if (nivel === 'seguro') return 'Tiene las mismas palabras que un cliente que ya conoces (puede cambiar el orden, los acentos o los espacios).';
  if (nivel === 'probable') return `Se parece a un solo cliente, pero el nombre viene abreviado o cortado en el documento («${nombreOriginal}»).`;
  if (nivel === 'dudoso') {
    const exactos = candidatos.filter((c) => c.tipo === 'exacta').length;
    return exactos > 1
      ? 'Hay dos clientes con este mismo nombre. No elegimos uno por ti.'
      : 'Se parece a varios clientes. No elegimos uno por ti.';
  }
  return 'No se parece a ningún cliente que ya conoces.';
}
