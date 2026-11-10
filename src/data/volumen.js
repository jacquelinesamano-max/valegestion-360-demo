// Datos ficticios para probar la demo con una mayorista de unos 600 clientes.
// Todo se deriva del índice, así que es siempre igual y no usa datos reales.
import { pesos } from '../lib/money.js';

const NOMBRES = [
  'Abigail', 'Adrián', 'Alejandra', 'Alfonso', 'Andrea', 'Arturo', 'Beatriz', 'Bruno', 'Camila', 'César',
  'Diana', 'Diego', 'Elisa', 'Emilio', 'Fabiola', 'Felipe', 'Gabriela', 'Gerardo', 'Hilda', 'Iván',
  'Jimena', 'Joaquín', 'Karina', 'Leonel', 'Lucía', 'Marcos', 'Nadia', 'Octavio', 'Paola', 'Rafael',
  'Samanta', 'Tomás', 'Úrsula', 'Valentina', 'Wendy', 'Ximena', 'Yolanda', 'Zoe', 'Mateo', 'Renata',
];
const APELLIDOS = [
  'Aguilar', 'Barrios', 'Cabrera', 'Domínguez', 'Escobar', 'Figueroa', 'Galindo', 'Huerta', 'Ibarra', 'Jiménez',
  'Lara', 'Medina', 'Naranjo', 'Olvera', 'Pacheco', 'Quintero', 'Rangel', 'Sandoval', 'Treviño', 'Uribe',
  'Vargas', 'Zamora', 'Acosta', 'Bravo', 'Cisneros', 'Durán', 'Espinosa', 'Fuentes', 'Guerrero', 'Hidalgo',
  'Ibáñez', 'Juárez', 'Landa', 'Montes', 'Núñez', 'Ochoa', 'Peralta', 'Robles', 'Salinas', 'Trejo',
];

export const TOTAL_VOLUMEN = 600;
export const PREFIJO_CLIENTE = 'c-v-';
export const PREFIJO_MOV = 'm-v-';

function nombreDe(i) {
  const n = NOMBRES[i % NOMBRES.length];
  const a1 = APELLIDOS[(i * 7 + Math.floor(i / NOMBRES.length)) % APELLIDOS.length];
  const a2 = APELLIDOS[(i * 11 + 5 + Math.floor(i / APELLIDOS.length)) % APELLIDOS.length];
  return `${n} ${a1} ${a2}`;
}

// Clientes extra. De cada grupo de nueve, dos pagan a través del primero (en grupos alternos).
export function clientesVolumen(cantidad) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    const base = i - (i % 9);
    const esRecomendado = i % 9 >= 1 && i % 9 <= 2 && Math.floor(i / 9) % 2 === 0;
    lista.push({
      id: `${PREFIJO_CLIENTE}${i + 1}`,
      nombre: nombreDe(i),
      responsableId: esRecomendado ? `${PREFIJO_CLIENTE}${base + 1}` : null,
      celular: null,
      curp: null,
    });
  }
  return lista;
}

const PREFIJOS_VALE = { alfa: 'A', beta: 'B', gama: 'C', delta: 'D' };

// Movimientos de esos clientes en una valera. La primera valera los trae casi a todos; las demás, a algunos.
export function movimientosVolumen(clientes, valera, indiceValera, relId, corte) {
  const movs = [];
  clientes.forEach((c, i) => {
    const incluye = indiceValera === 0 ? i % 5 !== 0 : (i + indiceValera) % 3 === 0;
    if (!incluye) return;
    movs.push({
      id: `${PREFIJO_MOV}${valera}-${i + 1}`,
      relId,
      valeraId: valera,
      nombreOriginal: c.nombre,
      vale: `${PREFIJOS_VALE[valera] ?? 'X'}-V${String(i + 1).padStart(4, '0')}`,
      canje: '2026-06-01',
      avance: `${(i % 8) + 2} de 12`,
      importe: pesos(200 + (((i * 37 + indiceValera * 91) % 36) * 20)),
      clienteId: c.id,
      omitido: false,
      motivoOmitido: null,
      postergado: false,
      descartados: [],
      corte,
    });
  });
  return movs;
}
