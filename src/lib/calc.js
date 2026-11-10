// Cálculos de la cobranza. Todo se deriva de los movimientos, así los totales cuadran en todas las vistas.
import { buscarCandidatos, clasificar, claveNombre } from './names.js';
import { suma } from './money.js';
import { minFecha } from './dates.js';

export const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
export const listaClientes = (s) => s.ordenClientes.map((id) => s.clientes[id]);
export const valeraNombre = (s, id) => s.valeras.find((v) => v.id === id)?.nombre ?? id;

// Dos personas con el mismo nombre se distinguen con un dato opcional (por ejemplo, el celular).
export function nombreVisible(s, id) {
  const c = s.clientes[id];
  const repetidos = Object.values(s.clientes).filter((x) => claveNombre(x.nombre) === claveNombre(c.nombre)).length > 1;
  return repetidos && c.celular ? `${c.nombre} (${c.celular})` : c.nombre;
}

export const pagadorDe = (s, id) => s.clientes[id].responsableId || id;
export const recomendadosDe = (s, id) => listaClientes(s).filter((c) => c.responsableId === id);
export const movsActivos = (s) => s.movimientos.filter((m) => !m.omitido && m.clienteId);

export function fechaPagoDe(s, relId) {
  return s.importaciones.find((i) => i.relId === relId)?.fechaPago ?? null;
}

// Arma lo que se le cobra a un responsable: sus pagos propios + los de sus recomendados, cada movimiento una sola vez.
export function componer(s, payerId) {
  const movs = movsActivos(s).filter((m) => pagadorDe(s, m.clienteId) === payerId);
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
  return {
    id: payerId,
    nombre: nombreVisible(s, payerId),
    propias,
    propiosTotal,
    recomendados,
    recTotal,
    total: propiosTotal + recTotal,
    nRecomendados: recomendadosDe(s, payerId).length,
    limite: minFecha(movs.map((m) => fechaPagoDe(s, m.relId))),
  };
}

export const pagosVigentes = (s, payerId) => s.pagos.filter((p) => p.payerId === payerId && p.estado === 'vigente');
export const pagadoDe = (s, payerId) => suma(pagosVigentes(s, payerId).map((p) => p.importe));

export function estadoDe(total, pagado) {
  if (total > 0 && pagado >= total) return 'Pagado';
  return pagado > 0 ? 'Abono' : 'Pendiente';
}

export function pagadoresVivos(s) {
  const ids = [...new Set(movsActivos(s).map((m) => pagadorDe(s, m.clienteId)))];
  return ids.map((id) => componer(s, id)).sort(porNombre);
}

// En preparación se calcula en vivo; ya confirmada, se lee la foto fija para que un cambio posterior no altere los avisos.
export function vistaCobranza(s) {
  const base = s.quincena.estado === 'preparacion' ? pagadoresVivos(s) : s.quincena.snapshot.pagadores;
  return base.map((p) => {
    const pagado = pagadoDe(s, p.id);
    return { ...p, pagado, pendiente: p.total - pagado, estado: estadoDe(p.total, pagado) };
  });
}

export function totales(s) {
  const v = vistaCobranza(s);
  const total = suma(v.map((p) => p.total));
  const cobrado = suma(v.map((p) => p.pagado));
  return { total, cobrado, pendiente: total - cobrado, n: v.length };
}

export function valerasCargadas(s) {
  return s.valeras.map((v) => ({ ...v, cargada: s.importaciones.some((i) => i.valeraId === v.id && !i.reemplazada) }));
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
