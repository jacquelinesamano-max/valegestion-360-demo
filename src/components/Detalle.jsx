import { useState } from 'react';
import { Aviso, Boton, Etiqueta, Tarjeta } from './ui.jsx';
import { AnularPago, PagoSheet } from './PagoSheet.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { pagosVigentes, pendienteAnterior, vistaCobranza } from '../lib/calc.js';
import { fechaCorta } from '../lib/dates.js';
import { mx } from '../lib/money.js';

export const TONO_ESTADO = { Pendiente: 'alerta', Abono: 'info', Pagado: 'ok' };

function Lineas({ lineas, mostrarValera }) {
  return lineas.map((l) => (
    <div className="linea" key={l.id}>
      <span>Vale {l.vale}{mostrarValera && <span className="valera-tag">{l.valera}</span>}</span>
      <span className="num">{mx(l.importe)}</span>
    </div>
  ));
}

export function Detalle({ id }) {
  const { s } = useStore();
  const [pagando, setPagando] = useState(null);
  const [anulando, setAnulando] = useState(null);
  const p = vistaCobranza(s).find((x) => x.id === id);
  if (!p) return <Aviso tono="error" titulo="No encontramos a ese responsable">Es posible que no tenga cobros en esta quincena.</Aviso>;
  const confirmada = s.quincena.estado === 'confirmada';
  const mostrarValera = s.ajustes.mostrarValera;
  const pagos = s.pagos.filter((x) => x.payerId === id);
  const pagoVigente = pagosVigentes(s, id);
  const anterior = pendienteAnterior(p.nombre);

  return (
    <Tarjeta className="detalle">
      <div className="card-head">
        <div>
          <h2>{p.nombre}</h2>
          <small className="suave">{p.nRecomendados ? `${p.nRecomendados} ${p.nRecomendados === 1 ? 'persona' : 'personas'} a su cargo` : 'Paga directamente'}</small>
        </div>
        <Etiqueta tono={TONO_ESTADO[p.estado]}>{p.estado}</Etiqueta>
      </div>

      <div className="desglose" aria-label="Desglose del cobro">
        <strong>Pagos propios</strong>
        {p.propias.length === 0 ? <p className="suave">No tiene vales propios en esta quincena.</p> : <Lineas lineas={p.propias} mostrarValera={mostrarValera} />}
        <div className="linea"><strong>Subtotal propios</strong><strong className="num">{mx(p.propiosTotal)}</strong></div>

        {p.recomendados.length > 0 && <strong style={{ marginTop: 8 }}>Pagos de personas a su cargo</strong>}
        {p.recomendados.map((r) => (
          <div key={r.id}>
            <div className="linea"><Enlace a={`/clientes/${r.id}`}>{r.nombre}</Enlace><strong className="num">{mx(r.total)}</strong></div>
            <div className="sub"><Lineas lineas={r.lineas} mostrarValera={mostrarValera} /></div>
          </div>
        ))}
        {p.recomendados.length > 0 && <div className="linea"><strong>Subtotal de recomendados</strong><strong className="num">{mx(p.recTotal)}</strong></div>}
        <div className="linea total"><span>Total a cobrar</span><span className="num">{mx(p.total)}</span></div>
      </div>

      {anterior && (
        <Aviso tono="info" titulo={`De la ${anterior.quincena} quedaron ${mx(anterior.importe)} sin pagar`}>
          Se muestra aparte y no se suma a este total. Si la valera lo vuelve a incluir en su relación, ya viene dentro de los importes de arriba.
        </Aviso>
      )}

      <div className="stats">
        <div className="stat"><span className="stat-label">Registrado</span><span className="stat-value">{mx(p.pagado)}</span></div>
        <div className="stat"><span className="stat-label">Falta</span><span className="stat-value">{mx(p.pendiente)}</span></div>
      </div>

      <div className="acciones">
        <Boton disabled={!confirmada || p.pendiente <= 0} onClick={() => setPagando({ responsable: p })}>Registrar pago</Boton>
        {s.quincena.estado !== 'preparacion' && <Enlace a={`/avisos/${id}`} className="btn btn-secundario">Ver aviso de cobro</Enlace>}
      </div>
      {s.quincena.estado === 'preparacion' && <p className="hint">Confirma la cobranza para registrar pagos y preparar los avisos.</p>}
      {s.quincena.estado === 'cerrada' && <p className="hint">La quincena está cerrada: ya no se registran pagos.</p>}

      <div>
        <h3>Pagos registrados</h3>
        {pagos.length === 0 && <p className="suave">Todavía no hay pagos registrados. Si llevas el control en papel, no pasa nada: esto es opcional.</p>}
        <div className="lista" style={{ marginTop: 8 }}>
          {pagos.map((x) => (
            <div className="fila" key={x.id} style={x.estado === 'anulado' ? { opacity: 0.65 } : undefined}>
              <div className="fila-main">
                <strong>{mx(x.importe)} · {fechaCorta(x.fecha)}</strong>
                <small>
                  {x.nota || 'Sin observación'}
                  {x.estado === 'anulado' && ` · ${x.motivo}`}
                  {x.reemplazaA && ' · corrige un pago anterior'}
                </small>
              </div>
              {x.estado === 'anulado' ? (
                <Etiqueta tono="neutro">Anulado</Etiqueta>
              ) : (
                confirmada && (
                  <span className="acciones">
                    <Boton tipo="texto" onClick={() => setPagando({ responsable: p, correccion: x })}>Corregir</Boton>
                    <Boton tipo="texto" onClick={() => setAnulando(x)}>Anular</Boton>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
        {pagoVigente.length > 1 && <p className="hint">Los abonos no se reparten entre valeras ni entre recomendados: se registran al responsable.</p>}
      </div>

      {pagando && <PagoSheet responsable={pagando.responsable} correccion={pagando.correccion} onCerrar={() => setPagando(null)} />}
      {anulando && <AnularPago pago={anulando} onCerrar={() => setAnulando(null)} />}
    </Tarjeta>
  );
}
