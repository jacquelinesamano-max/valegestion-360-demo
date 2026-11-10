// Reducer puro de la demostración. No toca red ni disco: todo es simulado.
import { RELACIONES } from '../data/seed.js';
import { addDays, HOY } from '../lib/dates.js';
import { claveNombre } from '../lib/names.js';
import { PREFIJO_CLIENTE, PREFIJO_MOV, TOTAL_VOLUMEN, clientesVolumen, movimientosVolumen } from '../data/volumen.js';
import {
  gruposPendientes, listaClientes, llaveGrupo, pagadoresVivos, pagadoDe, recomendadosDe, vistaCobranza,
} from '../lib/calc.js';

const nuevoId = (prefijo, existentes) => `${prefijo}-${existentes + 1}`;
// Identificador nuevo que no choca aunque se hayan quitado clientes (por ejemplo, al apagar la simulación de volumen).
const siguienteId = (prefijo, ids) => `${prefijo}-${1 + Math.max(0, ...ids.filter((i) => i.startsWith(`${prefijo}-`)).map((i) => Number(i.slice(prefijo.length + 1)) || 0))}`;

// Asigna un cliente a movimientos y recuerda la decisión: el vale y (si no es ambiguo) el nombre tal como aparece.
function asignar(s, movs, clienteId) {
  if (!movs.length) return s;
  const ids = new Set(movs.map((m) => m.id));
  const vales = { ...s.vales };
  movs.forEach((m) => {
    vales[`${m.valeraId}|${m.vale}`] = clienteId;
  });
  const m0 = movs[0];
  const clave = claveNombre(m0.nombreOriginal);
  const homonimos = listaClientes(s).filter((c) => claveNombre(c.nombre) === clave).length > 1;
  let aliases = s.aliases;
  if (!homonimos && !aliases.some((a) => a.valeraId === m0.valeraId && a.clave === clave && a.clienteId === clienteId)) {
    aliases = [...aliases, { valeraId: m0.valeraId, clave, clienteId, nombreOriginal: m0.nombreOriginal }];
  }
  return { ...s, vales, aliases, movimientos: s.movimientos.map((m) => (ids.has(m.id) ? { ...m, clienteId, postergado: false } : m)) };
}

function resolver(s, valeraId, fila) {
  const porVale = s.vales[`${valeraId}|${fila.vale}`];
  if (porVale) return porVale;
  const clave = claveNombre(fila.nombre);
  const alias = s.aliases.filter((a) => a.valeraId === valeraId && a.clave === clave);
  return alias.length === 1 ? alias[0].clienteId : null;
}

function importar(s, a) {
  const rel = RELACIONES.find((r) => r.id === a.relId);
  if (!rel || rel.foto) return s;
  if (s.quincena.estado !== 'preparacion') return s;
  const draft = s.drafts[rel.id] || {};
  const valera = s.valeras.find((v) => v.id === rel.valeraId);
  const fechaPago = rel.fechaPagoArchivo || addDays(rel.corte, valera.diasPago);
  const fechaOrigen = rel.fechaPagoArchivo ? 'archivo' : 'calendario';

  let movimientos = s.movimientos;
  let importaciones = s.importaciones;
  if (rel.reemplazaA && a.decision === 'reemplazar') {
    movimientos = movimientos.filter((m) => m.relId !== rel.reemplazaA);
    importaciones = importaciones.map((i) => (i.relId === rel.reemplazaA ? { ...i, reemplazada: true } : i));
  }
  const yaTiene = new Set(movimientos.filter((m) => m.valeraId === rel.valeraId).map((m) => m.vale));

  let t = { ...s, movimientos, importaciones };
  const nuevos = [];
  for (const fila of rel.filas) {
    const importe = draft.importes?.[fila.id] ?? fila.importe;
    if (importe == null) return s; // no se incorpora con importes faltantes
    if (rel.reemplazaA && a.decision === 'agregar' && yaTiene.has(fila.vale)) continue;
    const omitir = draft.acciones?.[fila.id] === 'omitir';
    nuevos.push({
      id: `m-${rel.id}-${fila.id}`,
      relId: rel.id,
      valeraId: rel.valeraId,
      nombreOriginal: fila.nombre,
      vale: fila.vale,
      canje: fila.canje,
      avance: fila.avance,
      importe,
      clienteId: omitir ? null : resolver(t, rel.valeraId, fila),
      omitido: omitir,
      motivoOmitido: omitir ? 'Posible duplicado: la persona decidió omitirlo' : null,
      postergado: false,
      descartados: [],
    });
  }
  const drafts = { ...s.drafts };
  delete drafts[rel.id];
  const resultado = {
    ...s,
    drafts,
    leidas: (s.leidas || []).filter((id) => id !== rel.id),
    movimientos: [...movimientos, ...nuevos],
    importaciones: [
      ...importaciones.filter((i) => i.relId !== rel.id),
      { relId: rel.id, valeraId: rel.valeraId, archivo: rel.archivo, fecha: HOY, fechaPago, fechaOrigen, corte: rel.corte, conceptos: rel.conceptos, reemplazada: false },
    ],
  };
  return conVolumen(resultado, rel.valeraId, rel.id, rel.corte);
}

// Reparte los clientes de volumen en una valera ya cargada (solo la primera vez que se incorpora).
function conVolumen(s, valeraId, relId, corte) {
  if (!s.volumen) return s;
  if (s.movimientos.some((m) => m.id.startsWith(`${PREFIJO_MOV}${valeraId}-`))) return s;
  const clientes = s.ordenClientes.filter((id) => id.startsWith(PREFIJO_CLIENTE)).map((id) => s.clientes[id]);
  const idx = s.valeras.findIndex((v) => v.id === valeraId);
  return { ...s, movimientos: [...s.movimientos, ...movimientosVolumen(clientes, valeraId, idx, relId, corte)] };
}

function activarVolumen(s) {
  const faltan = Math.max(0, TOTAL_VOLUMEN - s.ordenClientes.length);
  const nuevos = clientesVolumen(faltan);
  const clientes = { ...s.clientes };
  nuevos.forEach((c) => (clientes[c.id] = c));
  let t = { ...s, clientes, ordenClientes: [...s.ordenClientes, ...nuevos.map((c) => c.id)], volumen: true };
  for (const imp of s.importaciones.filter((i) => !i.reemplazada)) t = conVolumen(t, imp.valeraId, imp.relId, imp.corte);
  return t;
}

function quitarVolumen(s) {
  const clientes = Object.fromEntries(Object.entries(s.clientes).filter(([id]) => !id.startsWith(PREFIJO_CLIENTE)));
  return {
    ...s,
    clientes,
    ordenClientes: s.ordenClientes.filter((id) => !id.startsWith(PREFIJO_CLIENTE)),
    movimientos: s.movimientos.filter((m) => !m.id.startsWith(PREFIJO_MOV)),
    volumen: false,
  };
}

function crearCliente(s, a) {
  const g = gruposPendientes(s).find((x) => x.key === a.key);
  if (!g) return s;
  let t = s;
  let responsableId = null;
  if (a.nuevoResponsable?.trim()) {
    responsableId = siguienteId('c-n', Object.keys(t.clientes));
    t = {
      ...t,
      clientes: { ...t.clientes, [responsableId]: { id: responsableId, nombre: a.nuevoResponsable.trim(), responsableId: null, celular: null, curp: null } },
      ordenClientes: [...t.ordenClientes, responsableId],
    };
  } else if (a.responsableId) {
    const r = t.clientes[a.responsableId];
    if (!r || r.responsableId) return s; // el responsable debe cobrar directamente: no hay cadenas
    responsableId = a.responsableId;
  }
  const id = siguienteId('c-n', Object.keys(t.clientes));
  t = {
    ...t,
    clientes: { ...t.clientes, [id]: { id, nombre: a.nombre?.trim() || g.nombreOriginal, responsableId, celular: null, curp: null } },
    ordenClientes: [...t.ordenClientes, id],
  };
  return asignar(t, g.movs, id);
}

function editarResponsable(s, clienteId, responsableId) {
  const c = s.clientes[clienteId];
  if (!c) return s;
  if (responsableId) {
    const r = s.clientes[responsableId];
    if (!r || responsableId === clienteId) return s; // nadie es responsable de sí mismo
    if (r.responsableId) return s; // el responsable no puede ser recomendado de otro (sin cadenas)
    if (recomendadosDe(s, clienteId).length) return s; // quien tiene recomendados no puede ser recomendado
  }
  return { ...s, clientes: { ...s.clientes, [clienteId]: { ...c, responsableId: responsableId || null } } };
}

const pendienteDe = (s, payerId) => {
  const p = vistaCobranza(s).find((x) => x.id === payerId);
  return p ? p.total - pagadoDe(s, payerId) : 0;
};

function registrarPago(s, a) {
  if (s.quincena.estado !== 'confirmada') return s;
  if (s.reqIds[a.reqId]) return s; // un doble toque no registra dos veces
  const pend = pendienteDe(s, a.payerId);
  if (!(a.importe > 0) || a.importe > pend) return s;
  const pago = {
    id: nuevoId('pg', s.pagos.length), payerId: a.payerId, importe: a.importe, fecha: a.fecha || HOY, nota: a.nota || '',
    estado: 'vigente', reemplazaA: a.reemplazaA || null, motivo: null, reqId: a.reqId,
  };
  return { ...s, pagos: [...s.pagos, pago], reqIds: { ...s.reqIds, [a.reqId]: true } };
}

function anularPago(s, pagoId, motivo) {
  return { ...s, pagos: s.pagos.map((p) => (p.id === pagoId && p.estado === 'vigente' ? { ...p, estado: 'anulado', motivo: motivo || 'Sin motivo' } : p)) };
}

export function reducer(s, a) {
  switch (a.type) {
    case 'LOGIN':
      return { ...s, sesion: true };
    case 'FIN_ONBOARDING':
      return { ...s, onboarding: false };
    case 'SET_AJUSTE':
      return { ...s, ajustes: { ...s.ajustes, [a.clave]: a.valor } };

    case 'AGREGAR_VALERA': {
      const nombre = a.nombre?.trim();
      if (!nombre) return s;
      return { ...s, valeras: [...s.valeras, { id: `v-${s.valeras.length + 1}`, nombre, formato: a.formato || 'PDF', diasPago: 10 }] };
    }
    case 'SET_DIAS_PAGO':
      return { ...s, valeras: s.valeras.map((v) => (v.id === a.valeraId ? { ...v, diasPago: Math.max(1, Math.min(30, a.dias)) } : v)) };

    case 'DRAFT_IMPORTE': {
      const d = s.drafts[a.relId] || {};
      return { ...s, drafts: { ...s.drafts, [a.relId]: { ...d, importes: { ...d.importes, [a.rowId]: a.importe } } } };
    }
    case 'DRAFT_ACCION': {
      const d = s.drafts[a.relId] || {};
      return { ...s, drafts: { ...s.drafts, [a.relId]: { ...d, acciones: { ...d.acciones, [a.rowId]: a.accion } } } };
    }
    case 'IMPORTAR':
      return importar(s, a);
    case 'LEER_RELACION': {
      const rel = RELACIONES.find((r) => r.id === a.relId);
      if (!rel || rel.foto || s.quincena.estado !== 'preparacion' || s.importaciones.some((i) => i.relId === rel.id && !i.reemplazada)) return s;
      return (s.leidas || []).includes(rel.id) ? s : { ...s, leidas: [...(s.leidas || []), rel.id] };
    }
    case 'MARCAR_SIN_RELACION': {
      if (s.quincena.estado !== 'preparacion' || s.importaciones.some((i) => i.valeraId === a.valeraId && !i.reemplazada)) return s;
      return { ...s, sinRelacion: { ...(s.sinRelacion || {}), [a.valeraId]: Boolean(a.valor) } };
    }
    case 'SET_VOLUMEN': {
      if (s.quincena.estado !== 'preparacion' || Boolean(a.activo) === Boolean(s.volumen)) return s;
      return a.activo ? activarVolumen(s) : quitarVolumen(s);
    }

    case 'CONFIRMAR_GRUPO': {
      const g = gruposPendientes(s).find((x) => x.key === a.key);
      return g && s.clientes[a.clienteId] ? asignar(s, g.movs, a.clienteId) : s;
    }
    case 'CONFIRMAR_SEGUROS': {
      let t = s;
      for (const g of gruposPendientes(s).filter((x) => x.nivel === 'seguro' && !x.postergado)) {
        t = asignar(t, g.movs, g.candidatos[0].cliente.id);
      }
      return t;
    }
    case 'DISTINTA_PERSONA': {
      const key = a.key;
      return {
        ...s,
        movimientos: s.movimientos.map((m) =>
          !m.clienteId && !m.omitido && llaveGrupo(m) === key ? { ...m, descartados: [...new Set([...(m.descartados || []), ...a.clienteIds])], postergado: false } : m),
      };
    }
    case 'POSTERGAR_GRUPO':
      return { ...s, movimientos: s.movimientos.map((m) => (!m.clienteId && !m.omitido && llaveGrupo(m) === a.key ? { ...m, postergado: true } : m)) };
    case 'CREAR_CLIENTE':
      return crearCliente(s, a);

    case 'AGREGAR_CLIENTE_MANUAL': {
      const nombre = a.nombre?.trim();
      if (!nombre) return s;
      if (a.responsableId && (!s.clientes[a.responsableId] || s.clientes[a.responsableId].responsableId)) return s;
      const id = siguienteId('c-n', Object.keys(s.clientes));
      return {
        ...s,
        clientes: { ...s.clientes, [id]: { id, nombre, responsableId: a.responsableId || null, celular: null, curp: null } },
        ordenClientes: [...s.ordenClientes, id],
      };
    }
    case 'EDITAR_RESPONSABLE':
      return editarResponsable(s, a.clienteId, a.responsableId);
    case 'EDITAR_DATOS': {
      const c = s.clientes[a.clienteId];
      return c ? { ...s, clientes: { ...s.clientes, [a.clienteId]: { ...c, celular: a.celular ?? c.celular, curp: a.curp ?? c.curp } } } : s;
    }

    case 'CONFIRMAR_COBRANZA': {
      if (s.quincena.estado !== 'preparacion' || gruposPendientes(s).length) return s;
      const vivos = pagadoresVivos(s);
      if (!vivos.length) return s;
      const pagadores = vivos.map((p, i) => ({ ...p, folio: `AV-${s.quincena.id.slice(2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`, version: 1 }));
      return { ...s, quincena: { ...s.quincena, estado: 'confirmada', confirmadaEl: HOY, snapshot: { pagadores } } };
    }
    case 'CERRAR_QUINCENA':
      return s.quincena.estado === 'confirmada' ? { ...s, quincena: { ...s.quincena, estado: 'cerrada', cerradaEl: HOY } } : s;

    case 'REGISTRAR_PAGO':
      return registrarPago(s, a);
    case 'ANULAR_PAGO':
      return anularPago(s, a.pagoId, a.motivo);
    case 'CORREGIR_PAGO': {
      const viejo = s.pagos.find((p) => p.id === a.pagoId && p.estado === 'vigente');
      if (!viejo || s.reqIds[a.reqId]) return s;
      const t = anularPago(s, a.pagoId, `Corregido: ${a.motivo || 'importe equivocado'}`);
      const hecho = registrarPago(t, { ...a, payerId: viejo.payerId, reemplazaA: viejo.id });
      return hecho === t ? s : hecho; // si el nuevo importe no es válido, no se anula nada
    }
    default:
      return s;
  }
}
