import { useState } from 'react';
import { Etiqueta, Vacio } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { vistaCobranza } from '../lib/calc.js';
import { fechaCorta } from '../lib/dates.js';
import { mx, suma } from '../lib/money.js';

export default function Pagos() {
  const { s } = useStore();
  const [filtro, setFiltro] = useState('todos');
  const nombres = Object.fromEntries((s.quincena.estado === 'preparacion' ? [] : vistaCobranza(s)).map((p) => [p.id, p.nombre]));
  const pagos = [...s.pagos].reverse().filter((p) => filtro === 'todos' || (filtro === 'vigentes' ? p.estado === 'vigente' : p.estado === 'anulado'));
  const vigentes = suma(s.pagos.filter((p) => p.estado === 'vigente').map((p) => p.importe));

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <Enlace a="/cobranza">← Relación general</Enlace>
          <h1>Historial de pagos</h1>
          <p>{s.quincena.label}. Total registrado: <strong>{mx(vigentes)}</strong>. Los pagos nunca se borran: si hay un error, se anulan o se corrigen y queda constancia.</p>
        </div>
      </div>
      <div className="filtros" role="group" aria-label="Filtrar pagos">
        {[['todos', 'Todos'], ['vigentes', 'Vigentes'], ['anulados', 'Anulados o corregidos']].map(([k, t]) => (
          <button key={k} type="button" className="filtro" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{t}</button>
        ))}
      </div>
      {pagos.length === 0 && (
        <Vacio titulo="Todavía no hay pagos" accion={<Enlace a="/cobranza" className="btn btn-primario">Ir a la relación general</Enlace>}>
          Registrar pagos es opcional. Cuando anotes uno desde la relación general, aparecerá aquí.
        </Vacio>
      )}
      <div className="lista">
        {pagos.map((p) => (
          <div className="fila" key={p.id} style={p.estado === 'anulado' ? { opacity: 0.7 } : undefined}>
            <div className="fila-main">
              <Enlace a={`/cobranza/${p.payerId}`}><strong>{nombres[p.payerId] ?? s.clientes[p.payerId]?.nombre}</strong></Enlace>
              <small>
                {fechaCorta(p.fecha)} · {p.nota || 'Sin observación'}
                {p.estado === 'anulado' && ` · ${p.motivo}`}
                {p.reemplazaA && ' · corrige un pago anterior'}
              </small>
            </div>
            <strong className="num">{mx(p.importe)}</strong>
            <Etiqueta tono={p.estado === 'vigente' ? 'ok' : 'neutro'}>{p.estado === 'vigente' ? 'Vigente' : 'Anulado'}</Etiqueta>
          </div>
        ))}
      </div>
    </div>
  );
}
