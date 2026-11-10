// Todo lo de este archivo es ficticio. Los nombres, vales e importes no vienen de ningún documento real.
import { pesos as p } from '../lib/money.js';
import { claveNombre } from '../lib/names.js';

export const VALERAS = [
  { id: 'alfa', nombre: 'Valera Alfa', formato: 'Excel', diasPago: 10 },
  { id: 'beta', nombre: 'Valera Beta', formato: 'PDF', diasPago: 12 },
  { id: 'gama', nombre: 'Valera Gama', formato: 'PDF', diasPago: 10 },
];

// [id, nombre, responsable (null = paga directamente), dato opcional que distingue homónimos]
const CLIENTES = [
  ['c-rosa', 'Rosa Martínez', null],
  ['c-ana', 'Ana López', 'c-rosa'],
  ['c-pedro', 'Pedro Ruiz', 'c-rosa'],
  ['c-laura', 'Laura Hernández', null],
  ['c-ernesto', 'Ernesto Salas', 'c-laura'],
  ['c-carmen', 'Carmen González', null],
  ['c-teresa', 'Teresa Nava', null],
  ['c-alberto', 'Alberto Cruz', 'c-teresa'],
  ['c-monica', 'Mónica Fuentes', null],
  ['c-mgl', 'María Guadalupe López', null],
  ['c-hector', 'Héctor Barrera', null],
  ['c-jcp1', 'Juan Carlos Pérez', null, 'cel. ••4821'],
  ['c-jcp2', 'Juan Carlos Pérez', null, 'cel. ••7305'],
  ['c-daniela', 'Daniela Ortega', null],
];

const f = (id, nombre, vale, canje, avance, importe) => ({ id, nombre, vale, canje, avance, importe: importe == null ? null : p(importe) });

const FILAS_ALFA = [
  f('a1', 'Rosa Martínez', 'A-0101', '2026-03-04', '8 de 12', 400),
  f('a2', 'Ana López', 'A-0102', '2026-04-10', '6 de 10', 300),
  f('a3', 'Laura Hernández', 'A-0103', '2026-02-18', '9 de 12', 520),
  f('a4', 'Laura Hernández', 'A-0104', '2026-06-02', '4 de 12', 380),
  f('a5', 'Carmen González', 'A-0105', '2026-05-14', '5 de 10', 450),
  f('a6', 'Alberto Cruz', 'A-0106', '2026-07-21', '3 de 8', 275),
  f('a7', 'Héctor Barrera', 'A-0107', '2026-03-30', '7 de 12', 610),
  f('a8', 'María Guadalupe López', 'A-0108', '2026-04-25', '6 de 12', 340),
  f('a9', 'Juan Carlos Pérez', 'A-0109', '2026-01-19', '10 de 12', 500),
  f('a10', 'Juan Carlos Pérez', 'A-0111', '2026-08-03', '3 de 10', 430),
  f('a11', 'Mónica Fuentes', 'A-0110', '2026-06-16', '4 de 8', 360),
];

const FILAS_BETA = [
  f('b1', 'Rosa Martínez', 'B-2201', '2026-05-05', '5 de 10', 250),
  f('b2', 'María G. López', 'B-2202', '2026-04-12', '6 de 12', 410),
  f('b3', 'Laura Hernández', 'B-2203', '2026-07-07', '3 de 8', 300),
  f('b4', 'Ernesto Salas', 'B-2204', '2026-06-23', '4 de 8', 220),
  f('b5', 'Carmen González', 'B-2205', '2026-02-26', '8 de 12', 390),
  f('b6', 'Daniela Ortega', 'B-2206', '2026-03-17', '7 de 10', 480),
  f('b7', 'Sofía Valdés', 'B-2207', '2026-09-01', '2 de 10', 330),
];

const FILAS_GAMA = [
  f('g1', 'Pedro Ruiz', 'C-3301', '2026-06-11', '4 de 8', 200),
  f('g2', 'Pedro Ruiz', 'C-3301', '2026-06-11', '4 de 8', 200), // misma fila repetida: posible movimiento duplicado
  f('g3', 'Juan Carlos Pérez', 'C-3302', '2026-09-15', '2 de 10', 280),
  f('g4', 'Mónica Fuentes', 'C-3303', '2026-05-20', '5 de 8', 315),
  f('g5', 'Gloria Mejía', 'C-3304', '2026-08-28', '2 de 8', 260),
  f('g6', 'Alberto Cruz', 'C-3305', '2026-07-30', '3 de 8', 190),
];

// Relaciones de cobro de ejemplo que la persona puede «subir». Lo que traen es ficticio.
export const RELACIONES = [
  {
    id: 'rel-alfa', principal: true, valeraId: 'alfa', archivo: 'relacion_alfa_nov2026.xlsx', formato: 'Excel',
    corte: '2026-11-06', fechaPagoArchivo: '2026-11-22', conceptos: [], totalDocumento: p(4565), filas: FILAS_ALFA,
  },
  {
    id: 'rel-beta', principal: true, valeraId: 'beta', archivo: 'relacion_beta_nov2026.pdf', formato: 'PDF',
    corte: '2026-11-07', fechaPagoArchivo: '2026-11-19',
    conceptos: [{ folio: 'P-2201', descripcion: 'Préstamo personal de la mayorista', importe: p(1100) }],
    totalDocumento: p(3900),
    filas: [...FILAS_BETA, f('b8', 'Héctor Barrera', 'B-2208', '2026-08-14', '2 de 12', null)], // el importe no se pudo leer
  },
  {
    id: 'rel-beta-2', valeraId: 'beta', reemplazaA: 'rel-beta', archivo: 'relacion_beta_reenviada.pdf', formato: 'PDF',
    corte: '2026-11-07', fechaPagoArchivo: '2026-11-19',
    conceptos: [{ folio: 'P-2201', descripcion: 'Préstamo personal de la mayorista', importe: p(1100) }],
    totalDocumento: p(3910),
    filas: [...FILAS_BETA, f('b8', 'Héctor Barrera', 'B-2208', '2026-08-14', '2 de 12', 430)],
  },
  {
    id: 'rel-gama', principal: true, valeraId: 'gama', archivo: 'relacion_gama_nov2026.pdf', formato: 'PDF',
    corte: '2026-11-09', fechaPagoArchivo: null, conceptos: [], totalDocumento: p(1245), filas: FILAS_GAMA,
  },
  { id: 'foto-gama', foto: true, valeraId: 'gama', archivo: 'foto_relacion_gama.jpg', formato: 'Foto' },
];

// Quincenas anteriores (cerradas). Cada fila: [responsable, total, pagado, personas a su cargo]
const hist = (filas) => filas.map(([nombre, total, pagado, rec]) => ({ nombre, total: p(total), pagado: p(pagado), recomendados: rec }));
export const HISTORIAL = [
  {
    id: 'q-2026-11-a', label: '1.ª quincena de noviembre 2026', estado: 'cerrada',
    pagadores: hist([
      ['Rosa Martínez', 980, 980, 2], ['Laura Hernández', 1310, 1310, 1], ['Carmen González', 760, 760, 0],
      ['Teresa Nava', 540, 540, 1], ['Héctor Barrera', 1000, 1000, 0], ['María Guadalupe López', 700, 700, 0],
      ['Mónica Fuentes', 640, 640, 0], ['Daniela Ortega', 480, 480, 0], ['Juan Carlos Pérez (cel. ••4821)', 800, 800, 0],
    ]),
  },
  {
    id: 'q-2026-10-b', label: '2.ª quincena de octubre 2026', estado: 'cerrada',
    pagadores: hist([
      ['Rosa Martínez', 900, 900, 2], ['Laura Hernández', 1250, 1250, 1], ['Carmen González', 700, 700, 0],
      ['Teresa Nava', 480, 480, 1], ['Héctor Barrera', 950, 530, 0], ['María Guadalupe López', 660, 660, 0],
      ['Mónica Fuentes', 600, 600, 0], ['Daniela Ortega', 700, 700, 0], ['Juan Carlos Pérez (cel. ••7305)', 700, 700, 0],
    ]),
  },
];

export function estadoBase() {
  const clientes = {};
  const ordenClientes = [];
  for (const [id, nombre, responsableId, celular] of CLIENTES) {
    clientes[id] = { id, nombre, responsableId, celular: celular ?? null, curp: null };
    ordenClientes.push(id);
  }
  // Lo que ya se conoce de la quincena anterior: qué vale es de quién y cómo aparecen los nombres en Alfa.
  const vales = {
    'alfa|A-0101': 'c-rosa', 'alfa|A-0102': 'c-ana', 'alfa|A-0103': 'c-laura', 'alfa|A-0104': 'c-laura',
    'alfa|A-0105': 'c-carmen', 'alfa|A-0106': 'c-alberto', 'alfa|A-0107': 'c-hector', 'alfa|A-0108': 'c-mgl',
    'alfa|A-0109': 'c-jcp1', 'alfa|A-0111': 'c-jcp2', 'alfa|A-0110': 'c-monica',
  };
  const aliases = [];
  for (const [id, nombre] of CLIENTES) {
    if (nombre === 'Juan Carlos Pérez') continue; // homónimos: se distinguen por vale, nunca por nombre
    if (['c-ernesto', 'c-pedro', 'c-teresa', 'c-daniela'].includes(id)) continue;
    aliases.push({ valeraId: 'alfa', clave: claveNombre(nombre), clienteId: id, nombreOriginal: nombre });
  }
  return {
    sesion: false,
    onboarding: true,
    ajustes: { notif: false, mostrarValera: true },
    valeras: VALERAS.map((v) => ({ ...v })),
    clientes,
    ordenClientes,
    aliases,
    vales,
    importaciones: [],
    movimientos: [],
    drafts: {},
    quincena: { id: 'q-2026-11-b', label: '2.ª quincena de noviembre 2026', estado: 'preparacion', snapshot: null, confirmadaEl: null, cerradaEl: null },
    pagos: [],
    reqIds: {},
  };
}
