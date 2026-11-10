import { estadoBase } from '../data/seed.js';
import { pesos as p } from '../lib/money.js';
import { gruposPendientes } from '../lib/calc.js';
import { reducer } from './reducer.js';

// Punto de partida: la relación de Valera Alfa ya está incorporada; Beta y Gama faltan por subir.
export function crearInicial() {
  return reducer(estadoBase(), { type: 'IMPORTAR', relId: 'rel-alfa' });
}

// Atajo de la demostración: recorre el flujo con las decisiones esperadas y deja la cobranza confirmada con pagos de ejemplo.
export function avanzado() {
  let s = { ...crearInicial(), sesion: true, onboarding: false };
  const run = (a) => {
    s = reducer(s, a);
  };
  run({ type: 'DRAFT_IMPORTE', relId: 'rel-beta', rowId: 'b8', importe: p(420) });
  run({ type: 'IMPORTAR', relId: 'rel-beta' });
  run({ type: 'DRAFT_ACCION', relId: 'rel-gama', rowId: 'g2', accion: 'omitir' });
  run({ type: 'IMPORTAR', relId: 'rel-gama' });
  for (let i = 0; i < 20; i++) {
    const g = gruposPendientes(s)[0];
    if (!g) break;
    if (g.nivel === 'nuevo') {
      if (g.nombreOriginal === 'Gloria Mejía') run({ type: 'CREAR_CLIENTE', key: g.key, responsableId: 'c-carmen' });
      else run({ type: 'CREAR_CLIENTE', key: g.key });
    } else if (g.nivel === 'dudoso') {
      run({ type: 'CONFIRMAR_GRUPO', key: g.key, clienteId: 'c-jcp2' });
    } else {
      run({ type: 'CONFIRMAR_GRUPO', key: g.key, clienteId: g.candidatos[0].cliente.id });
    }
  }
  run({ type: 'CONFIRMAR_COBRANZA' });
  run({ type: 'REGISTRAR_PAGO', reqId: 'demo-1', payerId: 'c-rosa', importe: p(1150), fecha: '2026-11-16', nota: 'Pagó completo' });
  run({ type: 'REGISTRAR_PAGO', reqId: 'demo-2', payerId: 'c-laura', importe: p(700), fecha: '2026-11-16', nota: 'Primer abono' });
  run({ type: 'REGISTRAR_PAGO', reqId: 'demo-3', payerId: 'c-carmen', importe: p(1100), fecha: '2026-11-17', nota: '' });
  run({ type: 'REGISTRAR_PAGO', reqId: 'demo-4', payerId: 'c-hector', importe: p(830), fecha: '2026-11-17', nota: '' });
  const equivocado = s.pagos.find((x) => x.reqId === 'demo-4');
  run({ type: 'CORREGIR_PAGO', reqId: 'demo-5', pagoId: equivocado.id, importe: p(1030), fecha: '2026-11-17', motivo: 'Eran $1,030, no $830' });
  return s;
}
