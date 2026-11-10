// Cálculos de la cobranza. Todo se deriva de los movimientos, así los totales cuadran en todas las vistas.
import { buscarCandidatos, clasificar, claveNombre } from './names.js';
import { suma } from './money.js';
import { minFecha } from './dates.js';
import { ANTERIOR, HISTORIAL, RELACIONES } from '../data/seed.js';

export const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
export const listaClientes = (s) => s.ordenClientes.map((id) => s.clientes[id]);
export const valeraNombre = (s, id) => s.valeras.find((v) => v.id === id)?.nombre ?? id;

// Con cientos de clientes, estas búsquedas se guardan por «foto» del estado: mientras no cambie, no se recalculan.
const cacheClaves = new WeakMap();
const cacheRecomendados = new WeakMap();
const cacheActivos = new WeakMap();
const cachePagadores = new WeakMap();
const cacheVista = new WeakMap();

function conteoClaves(s) {
  let m = cacheClaves.get(s.clientes);
  if (!m) {
    m = new Map();
    for (const x of Object.values(s.clientes)) {
      const k = claveNombre(x.nombre);
      m.set(k, (m.get(k) || 0) + 1);
    }
    cacheClaves.set(s.clientes, m);
  }
  return m;
}

// Dos personas con el mismo nombre se distinguen con un dato opcional (por ejemplo, el celular).
export function nombreVisible(s, id) {
  const c = s.clientes[id];
  const repetidos = (conteoClaves(s).get(claveNombre(c.nombre)) || 0) > 1;
  return repetidos && c.celular ? `${c.nombre} (${c.celular})` : c.nombre;
}

export const pagadorDe = (s, id) => s.clientes[id].responsableId || id;

function mapaRecomendados(s) {
  let m = cacheRecomendados.get(s.clientes);
  if (!m) {
    m = new Map();
    for (const c of listaClientes(s)) if (c.responsableId) m.set(c.responsableId, [...(m.get(c.responsableId) || []), c]);
    cacheRecomendados.set(s.clientes, m);
  }
  return m;
}
export const recomendadosDe = (s, id) => mapaRecomendados(s).get(id) || [];

export function movsActivos(s) {
  let r = cacheActivos.get(s.movimientos);
  if (!r) {
    r = s.movimientos.filter((m) => !m.omitido && m.clienteId);
    cacheActivos.set(s.movimientos, r);
  }
  return r;
}

function movsPorPagador(s) {
  const entrada = cachePagadores.get(s.movimientos);
  if (entrada && entrada.clientes === s.clientes) return entrada.mapa;
  const mapa = new Map();
  for (const m of movsActivos(s)) {
    const id = pagadorDe(s, m.clienteId);
    if (!mapa.has(id)) mapa.set(id, []);
    mapa.get(id).push(m);
  }
  cachePagadores.set(s.movimientos, { clientes: s.clientes, mapa });
  return mapa;
}

export function fechaPagoDe(s, relId) {
  return s.importaciones.find((i) => i.relId === relId)?.fechaPago ?? null;
}

// Arma lo que se le cobra a un responsable: sus pagos propios + los de sus recomendados, cada movimiento una sola vez.
export function componer(s, payerId) {
  const movs = movsPorPagador(s).get(payerId) || [];
  const linea = (m) => ({ id: m.id, vale: m.vale, valera: valeraNombre(s, m.valeraId), importe: m.importe });
  const propias = movs.filter((m) => m.clienteId === payerId).map(linea);
  const ids = [...new Set(movs.filter((m) => m.clienteId !== payerId).map((m) => m.clienteId))];
  const recomendados = ids
    .map((id) => {
      const lineas = movs.filter((m) => m.clienteId === id).map(linea);
      return { id, nombre: nombreVisible(s, id), total: suma(lineas.map((l) => l.importe)), lineas };
    })
    .sort(porNombre);
  const propiosTotal = suma(propias.map((l) => l.importe));
  const recTotal = suma(recomendados.map((r) => r.total));
  const fechas = new Map();
  return {
    id: payerId,
    nombre: nombreVisible(s, payerId),
    propias,
    propiosTotal,
    recomendados,
    recTotal,
    total: propiosTotal + recTotal,
    nRecomendados: recomendadosDe(s, payerId).length,
    limite: minFecha(movs.map((m) => {
      if (!fechas.has(m.relId)) fechas.set(m.relId, fechaPagoDe(s, m.relId));
      return fechas.get(m.relId);
    })),
  };
}

export const pagosVigentes = (s, payerId) => s.pagos.filter((p) => p.payerId === payerId && p.estado === 'vigente');
export const pagadoDe = (s, payerId) => suma(pagosVigentes(s, payerId).map((p) => p.importe));

export function estadoDe(total, pagado) {
  if (total > 0 && pagado >= total) return 'Pagado';
  return pagado > 0 ? 'Abono' : 'Pendiente';
}

export function pagadoresVivos(s) {
  return [...movsPorPagador(s).keys()].map((id) => componer(s, id)).sort(porNombre);
}

// En preparación se calcula en vivo; ya confirmada, se lee la foto fija para que un cambio posterior no altere los avisos.
export function vistaCobranza(s) {
  const e = cacheVista.get(s.movimientos);
  if (e && e.clientes === s.clientes && e.pagos === s.pagos && e.quincena === s.quincena && e.importaciones === s.importaciones) return e.valor;
  const base = s.quincena.estado === 'preparacion' ? pagadoresVivos(s) : s.quincena.snapshot.pagadores;
  const pagadoPor = new Map();
  for (const p of s.pagos) if (p.estado === 'vigente') pagadoPor.set(p.payerId, (pagadoPor.get(p.payerId) || 0) + p.importe);
  const valor = base.map((p) => {
    const pagado = pagadoPor.get(p.id) || 0;
    return { ...p, pagado, pendiente: p.total - pagado, estado: estadoDe(p.total, pagado) };
  });
  cacheVista.set(s.movimientos, { clientes: s.clientes, pagos: s.pagos, quincena: s.quincena, importaciones: s.importaciones, valor });
  return valor;
}

export function totales(s) {
  const v = vistaCobranza(s);
  const total = suma(v.map((p) => p.total));
  const cobrado = suma(v.map((p) => p.pagado));
  return { total, cobrado, pendiente: total - cobrado, n: v.length };
}

export function valerasCargadas(s) {
  return s.valeras.map((v) => {
    const cargada = s.importaciones.some((i) => i.valeraId === v.id && !i.reemplazada);
    const sinRelacion = !cargada && Boolean(s.sinRelacion?.[v.id]);
    const enRevision = !cargada && !sinRelacion && (s.leidas || []).some((id) => RELACIONES.find((r) => r.id === id)?.valeraId === v.id);
    return { ...v, cargada, sinRelacion, enRevision };
  });
}

export const llaveGrupo = (m) => `${m.valeraId}|${claveNombre(m.nombreOriginal)}`;

// Movimientos sin cliente asignado, agrupados por valera y nombre tal como aparece. Las sugerencias se calculan al momento.
export function gruposPendientes(s) {
  const clientes = listaClientes(s);
  const mapa = new Map();
  for (const m of s.movimientos) {
    if (m.clienteId || m.omitido) continue;
    const key = llaveGrupo(m);
    if (!mapa.has(key)) mapa.set(key, { key, valeraId: m.valeraId, nombreOriginal: m.nombreOriginal, movs: [], descartados: new Set() });
    const g = mapa.get(key);
    g.movs.push(m);
    (m.descartados || []).forEach((d) => g.descartados.add(d));
  }
  return [...mapa.values()].map((g) => {
    const candidatos = buscarCandidatos(g.nombreOriginal, clientes).filter((c) => !g.descartados.has(c.cliente.id));
    return {
      ...g,
      total: suma(g.movs.map((m) => m.importe)),
      candidatos,
      nivel: clasificar(candidatos),
      postergado: g.movs.every((m) => m.postergado),
    };
  });
}

// Revisión previa a incorporar una relación: qué se leyó, qué falta y si la suma cuadra con el total del documento.
export function revisarImportacion(rel, draft = {}) {
  const vistos = new Set();
  const filas = rel.filas.map((fila) => {
    const importe = draft.importes?.[fila.id] ?? fila.importe;
    const faltante = importe == null;
    const k = `${fila.vale}|${importe}`;
    let duplicadoPosible = false;
    if (!faltante) {
      if (vistos.has(k)) duplicadoPosible = true;
      else vistos.add(k);
    }
    const accion = draft.acciones?.[fila.id] ?? null;
    const omitida = duplicadoPosible && accion === 'omitir';
    return { ...fila, importe, faltante, duplicadoPosible, accion, omitida, requiereRevision: faltante || (duplicadoPosible && !accion) };
  });
  const calculado = suma(filas.filter((x) => !x.omitida && !x.faltante).map((x) => x.importe));
  const conceptos = suma(rel.conceptos.map((c) => c.importe));
  const diferencia = rel.totalDocumento - (calculado + conceptos);
  // Cuenta personas con más de un vale distinto (un vale repetido no cuenta: ese es el posible duplicado).
  const porNombreN = {};
  filas.forEach((x) => {
    const k = claveNombre(x.nombre);
    porNombreN[k] = porNombreN[k] || new Set();
    porNombreN[k].add(x.vale);
  });
  return {
    filas,
    calculado,
    conceptos,
    totalDocumento: rel.totalDocumento,
    diferencia,
    cuadra: diferencia === 0,
    porRevisar: filas.filter((x) => x.requiereRevision).length,
    clientesConVariosVales: Object.values(porNombreN).filter((vales) => vales.size > 1).length,
  };
}

// Qué cambia si se reemplaza una importación anterior por una nueva versión del mismo documento.
export function diffReemplazo(s, relNueva, relAnteriorId) {
  const anteriores = s.movimientos.filter((m) => m.relId === relAnteriorId && !m.omitido);
  const porVale = new Map(anteriores.map((m) => [m.vale, m]));
  const cambios = [];
  const nuevos = [];
  for (const fila of relNueva.filas) {
    const ant = porVale.get(fila.vale);
    if (!ant) nuevos.push(fila);
    else if (ant.importe !== fila.importe) cambios.push({ vale: fila.vale, nombre: fila.nombre, antes: ant.importe, despues: fila.importe, clienteId: ant.clienteId });
    porVale.delete(fila.vale);
  }
  const quitados = [...porVale.values()];
  const afectados = [...new Set([...cambios.map((c) => c.clienteId), ...quitados.map((m) => m.clienteId)].filter(Boolean))].map((id) => pagadorDe(s, id));
  const conPagos = [...new Set(afectados)].filter((id) => pagadoDe(s, id) > 0).map((id) => nombreVisible(s, id));
  return { cambios, nuevos, quitados, conPagos };
}

// Compara lo que trae la valera ahora con su corte anterior, por número de vale.
export function compararConAnterior(valeraId, filas) {
  const antes = new Map((ANTERIOR[valeraId] || []).map((x) => [x.vale, x]));
  const nuevos = [];
  const cambios = [];
  for (const f of filas) {
    if (f.faltante) {
      antes.delete(f.vale); // el vale sí viene; solo falta leer su importe, así que no cuenta como «ya no aparece»
      continue;
    }
    if (f.omitida) continue;
    const ant = antes.get(f.vale);
    if (!ant) nuevos.push(f);
    else if (ant.importe !== f.importe) cambios.push({ vale: f.vale, nombre: f.nombre, antes: ant.importe, despues: f.importe });
    antes.delete(f.vale);
  }
  const ausentes = [...antes.values()];
  return { nuevos, cambios, ausentes, hayCorteAnterior: (ANTERIOR[valeraId] || []).length > 0 };
}

// Lo que quedó sin pagar en la quincena anterior. Se muestra aparte: no se suma a la cobranza actual.
export function pendienteAnterior(nombre) {
  const q = HISTORIAL[0];
  const p = q?.pagadores.find((x) => x.nombre === nombre);
  return p && p.total > p.pagado ? { quincena: q.label, importe: p.total - p.pagado } : null;
}

// Las cuatro cosas que impiden confirmar: valeras por cargar, importaciones por revisar, nombres parecidos y clientes nuevos.
export function pendientesResumen(s) {
  const valeras = valerasCargadas(s);
  const grupos = gruposPendientes(s);
  return {
    porCargar: valeras.filter((v) => !v.cargada && !v.sinRelacion && !v.enRevision),
    porRevisar: valeras.filter((v) => v.enRevision),
    parecidos: grupos.filter((g) => g.nivel !== 'nuevo'),
    nuevos: grupos.filter((g) => g.nivel === 'nuevo'),
  };
}
