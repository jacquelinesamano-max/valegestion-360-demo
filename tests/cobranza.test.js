import test from 'node:test';
import assert from 'node:assert/strict';
import { pesos as p } from '../src/lib/money.js';
import { reducer } from '../src/state/reducer.js';
import { crearInicial, avanzado } from '../src/state/initial.js';
import { RELACIONES } from '../src/data/seed.js';
import { componer, diffReemplazo, gruposPendientes, movsActivos, pagadorDe, revisarImportacion, totales, vistaCobranza } from '../src/lib/calc.js';
import { buscarCandidatos, clasificar, claveNombre } from '../src/lib/names.js';
import { listaClientes } from '../src/lib/calc.js';

const suma = (xs) => xs.reduce((t, x) => t + x, 0);

test('el punto de partida trae Alfa incorporada y todo asignado', () => {
  const s = crearInicial();
  assert.equal(s.movimientos.length, 11);
  assert.equal(gruposPendientes(s).length, 0);
  assert.equal(totales(s).total, p(4565));
});

test('Beta no cuadra con el total del documento mientras falta un importe', () => {
  const rel = RELACIONES.find((r) => r.id === 'rel-beta');
  const sin = revisarImportacion(rel, {});
  assert.equal(sin.porRevisar, 1);
  assert.equal(sin.cuadra, false);
  assert.equal(sin.diferencia, p(420));
  const con = revisarImportacion(rel, { importes: { b8: p(420) } });
  assert.equal(con.porRevisar, 0);
  assert.equal(con.cuadra, true);
  assert.equal(con.conceptos, p(1100)); // el préstamo personal es de la mayorista, no de un cliente
});

test('Gama marca un posible duplicado y cuadra solo cuando la persona decide omitirlo', () => {
  const rel = RELACIONES.find((r) => r.id === 'rel-gama');
  const sin = revisarImportacion(rel, {});
  assert.equal(sin.porRevisar, 1);
  assert.equal(sin.cuadra, false);
  const con = revisarImportacion(rel, { acciones: { g2: 'omitir' } });
  assert.equal(con.cuadra, true);
  assert.equal(con.porRevisar, 0);
});

test('un cliente con varios vales en la misma valera no es duplicado', () => {
  const rel = RELACIONES.find((r) => r.id === 'rel-alfa');
  const r = revisarImportacion(rel, {});
  assert.equal(r.filas.some((x) => x.duplicadoPosible), false);
  assert.ok(r.clientesConVariosVales >= 1);
});

test('las sugerencias de nombre se clasifican y nunca eligen entre homónimos', () => {
  const s = crearInicial();
  const c = listaClientes(s);
  assert.equal(clasificar(buscarCandidatos('Sofía Valdés', c)), 'nuevo');
  assert.equal(clasificar(buscarCandidatos('María G. López', c)), 'probable');
  assert.equal(clasificar(buscarCandidatos('Mónica Fuentes', c)), 'seguro');
  assert.equal(clasificar(buscarCandidatos('Juan Carlos Pérez', c)), 'dudoso');
  assert.equal(clasificar(buscarCandidatos('Ana María López', c)), 'nuevo', 'comparten apellido: no se sugiere');
  assert.equal(claveNombre('PÉREZ  JUAN CARLOS'), claveNombre('juan carlos perez'), 'el orden y los acentos no importan');
});

test('al incorporar Beta se pide revisión solo donde hace falta', () => {
  let s = crearInicial();
  s = reducer(s, { type: 'DRAFT_IMPORTE', relId: 'rel-beta', rowId: 'b8', importe: p(420) });
  s = reducer(s, { type: 'IMPORTAR', relId: 'rel-beta' });
  const niveles = Object.fromEntries(gruposPendientes(s).map((g) => [g.nombreOriginal, g.nivel]));
  assert.equal(niveles['María G. López'], 'probable');
  assert.equal(niveles['Sofía Valdés'], 'nuevo');
  assert.equal(niveles['Rosa Martínez'], 'seguro');
  assert.equal(niveles['Laura Hernández'], 'seguro');
});

test('no se incorpora una relación con un importe faltante', () => {
  const s = reducer(crearInicial(), { type: 'IMPORTAR', relId: 'rel-beta' });
  assert.equal(s.movimientos.filter((m) => m.relId === 'rel-beta').length, 0);
});

test('el ejemplo obligatorio: Rosa paga $650 propios + $500 de recomendados = $1,150', () => {
  const s = avanzado();
  const rosa = componer(s, 'c-rosa');
  assert.equal(rosa.propiosTotal, p(650));
  assert.equal(rosa.recTotal, p(500));
  assert.equal(rosa.total, p(1150));
  assert.deepEqual(rosa.recomendados.map((r) => r.nombre), ['Ana López', 'Pedro Ruiz']);
  const ids = vistaCobranza(s).map((x) => x.id);
  assert.equal(ids.includes('c-ana'), false, 'Ana no aparece como responsable independiente');
  assert.equal(ids.includes('c-pedro'), false);
});

test('Teresa no tiene vales propios pero se le cobra lo de su recomendado', () => {
  const s = avanzado();
  const t = componer(s, 'c-teresa');
  assert.equal(t.propiosTotal, 0);
  assert.equal(t.total, p(465));
});

test('cada movimiento se cuenta una sola vez y todas las vistas suman lo mismo', () => {
  const s = avanzado();
  const activos = movsActivos(s);
  assert.equal(new Set(activos.map((m) => m.id)).size, activos.length);
  const porMovimientos = suma(activos.map((m) => m.importe));
  const porResponsables = suma(vistaCobranza(s).map((x) => x.total));
  assert.equal(porMovimientos, p(8610));
  assert.equal(porResponsables, porMovimientos);
  assert.equal(totales(s).total, porMovimientos);
  // el desglose de cada aviso suma su total
  for (const x of vistaCobranza(s)) assert.equal(x.propiosTotal + x.recTotal, x.total);
  // cada movimiento activo pertenece a un solo responsable
  const dueños = activos.map((m) => pagadorDe(s, m.clienteId));
  assert.equal(dueños.length, activos.length);
});

test('hay 3 valeras, 16 clientes y el posible duplicado queda a la vista (no se borra)', () => {
  const s = avanzado();
  assert.equal(s.valeras.length, 3);
  assert.equal(Object.keys(s.clientes).length, 16);
  const omitidos = s.movimientos.filter((m) => m.omitido);
  assert.equal(omitidos.length, 1);
  assert.match(omitidos[0].motivoOmitido, /duplicado/i);
});

test('no se confirma con revisiones pendientes', () => {
  let s = crearInicial();
  s = reducer(s, { type: 'DRAFT_IMPORTE', relId: 'rel-beta', rowId: 'b8', importe: p(420) });
  s = reducer(s, { type: 'IMPORTAR', relId: 'rel-beta' });
  s = reducer(s, { type: 'CONFIRMAR_COBRANZA' });
  assert.equal(s.quincena.estado, 'preparacion');
});

test('no hay cadenas ni relaciones circulares de recomendados', () => {
  const s = crearInicial();
  // Ana ya es recomendada de Rosa: Pedro no puede quedar a cargo de Ana
  assert.equal(reducer(s, { type: 'EDITAR_RESPONSABLE', clienteId: 'c-pedro', responsableId: 'c-ana' }), s);
  // Rosa tiene recomendados: no puede pasar a ser recomendada de Laura
  assert.equal(reducer(s, { type: 'EDITAR_RESPONSABLE', clienteId: 'c-rosa', responsableId: 'c-laura' }), s);
  // nadie es responsable de sí mismo
  assert.equal(reducer(s, { type: 'EDITAR_RESPONSABLE', clienteId: 'c-laura', responsableId: 'c-laura' }), s);
  // un cambio válido sí se aplica
  const t = reducer(s, { type: 'EDITAR_RESPONSABLE', clienteId: 'c-daniela', responsableId: 'c-laura' });
  assert.equal(t.clientes['c-daniela'].responsableId, 'c-laura');
});

test('cambiar un responsable después de confirmar no altera los avisos ya emitidos', () => {
  let s = avanzado();
  const antes = vistaCobranza(s).find((x) => x.id === 'c-rosa');
  s = reducer(s, { type: 'EDITAR_RESPONSABLE', clienteId: 'c-pedro', responsableId: 'c-laura' });
  const despues = vistaCobranza(s).find((x) => x.id === 'c-rosa');
  assert.equal(despues.total, antes.total);
  assert.equal(despues.folio, antes.folio);
});

test('pagos: completo, abono, sobrepago rechazado, doble toque ignorado y corrección con historial', () => {
  const s = avanzado();
  const v = (id) => vistaCobranza(s).find((x) => x.id === id);
  assert.equal(v('c-rosa').estado, 'Pagado');
  assert.equal(v('c-laura').estado, 'Abono');
  assert.equal(v('c-laura').pendiente, p(1420) - p(700));
  assert.equal(v('c-hector').estado, 'Pagado');
  assert.equal(s.pagos.filter((x) => x.payerId === 'c-hector').length, 2, 'el pago equivocado se conserva anulado');
  assert.equal(s.pagos.filter((x) => x.estado === 'anulado').length, 1);

  const sobre = reducer(s, { type: 'REGISTRAR_PAGO', reqId: 'x1', payerId: 'c-laura', importe: p(5000) });
  assert.equal(sobre.pagos.length, s.pagos.length, 'no acepta más que el saldo');

  const uno = reducer(s, { type: 'REGISTRAR_PAGO', reqId: 'x2', payerId: 'c-laura', importe: p(100) });
  const dos = reducer(uno, { type: 'REGISTRAR_PAGO', reqId: 'x2', payerId: 'c-laura', importe: p(100) });
  assert.equal(dos.pagos.length, uno.pagos.length, 'el mismo envío no se registra dos veces');
});

test('no se registran pagos antes de confirmar la cobranza', () => {
  const s = reducer(crearInicial(), { type: 'REGISTRAR_PAGO', reqId: 'y', payerId: 'c-rosa', importe: p(100) });
  assert.equal(s.pagos.length, 0);
});

test('una corrección inválida no anula el pago original', () => {
  const s = avanzado();
  const pago = s.pagos.find((x) => x.payerId === 'c-laura' && x.estado === 'vigente');
  const t = reducer(s, { type: 'CORREGIR_PAGO', reqId: 'z', pagoId: pago.id, importe: p(99999), fecha: '2026-11-17', motivo: 'x' });
  assert.equal(t, s);
});

test('reemplazar una relación muestra qué cambia y no deja movimientos viejos', () => {
  let s = crearInicial();
  s = reducer(s, { type: 'DRAFT_IMPORTE', relId: 'rel-beta', rowId: 'b8', importe: p(420) });
  s = reducer(s, { type: 'IMPORTAR', relId: 'rel-beta' });
  const nueva = RELACIONES.find((r) => r.id === 'rel-beta-2');
  const d = diffReemplazo(s, nueva, 'rel-beta');
  assert.equal(d.cambios.length, 1);
  assert.equal(d.cambios[0].antes, p(420));
  assert.equal(d.cambios[0].despues, p(430));
  assert.equal(d.quitados.length, 0);

  const agregado = reducer(s, { type: 'IMPORTAR', relId: 'rel-beta-2', decision: 'agregar' });
  assert.equal(agregado.movimientos.filter((m) => m.relId === 'rel-beta-2').length, 0, 'agregar solo suma vales que no estaban');

  const reemplazado = reducer(s, { type: 'IMPORTAR', relId: 'rel-beta-2', decision: 'reemplazar' });
  assert.equal(reemplazado.movimientos.filter((m) => m.relId === 'rel-beta').length, 0);
  assert.equal(reemplazado.movimientos.filter((m) => m.relId === 'rel-beta-2').length, 8);
  assert.equal(reemplazado.importaciones.find((i) => i.relId === 'rel-beta').reemplazada, true);
});

test('el clientes con varios vales no cuenta un vale repetido', () => {
  const rel = RELACIONES.find((r) => r.id === 'rel-gama');
  assert.equal(revisarImportacion(rel, {}).clientesConVariosVales, 0);
});
