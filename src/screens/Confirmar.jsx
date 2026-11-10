import { useState } from 'react';
import { Aviso, Boton, Cifra, Etiqueta, Icono, Tarjeta, useAviso } from '../components/ui.jsx';
import { MostrarMas, usePaginado } from '../components/Paginado.jsx';
import { Enlace, ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { RELACIONES } from '../data/seed.js';
import { movsActivos, pagadoresVivos, pendientesResumen, valerasCargadas, vistaCobranza } from '../lib/calc.js';
import { normalizar } from '../lib/names.js';
import { mx, suma } from '../lib/money.js';

function Pendiente({ hecho, titulo, detalle, instruccion, accion, a }) {
  return (
    <div className={`fila ${hecho ? '' : 'activa'}`}>
      <span className={`avatar ${hecho ? 'tono-1' : 'tono-2'}`} aria-hidden="true">{hecho ? <Icono nombre="ok" tam={20} /> : '!'}</span>
      <div className="fila-main">
        <strong>{titulo}</strong>
        <small>{hecho ? 'Nada pendiente.' : detalle}</small>
        {!hecho && <small>{instruccion}</small>}
      </div>
      {hecho ? <Etiqueta tono="ok">Listo</Etiqueta> : <Boton tipo="secundario" onClick={() => ir(a)}>{accion}</Boton>}
    </div>
  );
}

export default function Confirmar() {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const [entiendo, setEntiendo] = useState(false);
  const [q, setQ] = useState('');
  const enPrep = s.quincena.estado === 'preparacion';
  const pend = pendientesResumen(s);
  const valeras = valerasCargadas(s);
  const faltan = pend.porCargar;
  const sinRelacion = valeras.filter((v) => v.sinRelacion);
  const filas = enPrep ? pagadoresVivos(s) : vistaCobranza(s);
  const visibles = filas.filter((p) => normalizar(p.nombre).includes(normalizar(q)));
  const pag = usePaginado(visibles, 15, q);
  const total = suma(filas.map((p) => p.total));
  const omitidos = s.movimientos.filter((m) => m.omitido);
  const conceptos = s.importaciones.filter((i) => !i.reemplazada).flatMap((i) => i.conceptos.map((c) => ({ ...c, valeraId: i.valeraId })));
  const hayBloqueo = pend.porRevisar.length + pend.parecidos.length + pend.nuevos.length > 0;
  const sinResponsable = suma([...pend.parecidos, ...pend.nuevos].map((g) => g.total));
  const puede = enPrep && !hayBloqueo && filas.length > 0 && (faltan.length === 0 || entiendo);
  const primeraRevisada = pend.porRevisar[0] && (s.leidas || []).find((id) => RELACIONES.find((r) => r.id === id)?.valeraId === pend.porRevisar[0].id);

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Resumen antes de confirmar</h1>
          <p>{s.quincena.label}. Revisa que todo esté completo: al confirmar se guardan los avisos de cobro.</p>
        </div>
        {!enPrep && <Etiqueta tono="primario">Cobranza ya confirmada</Etiqueta>}
      </div>

      <div className="stats">
        <Cifra etiqueta="Valeras cargadas" valor={`${valeras.filter((v) => v.cargada).length} de ${valeras.length}`} tono={faltan.length ? 'alerta' : 'ok'} nota={sinRelacion.length ? `${sinRelacion.length} sin relación esta quincena` : undefined} />
        <Cifra etiqueta="Movimientos que se cobran" valor={String(movsActivos(s).length)} />
        <Cifra etiqueta="Responsables de pago" valor={String(filas.length)} />
        <Cifra etiqueta="Total a cobrar" valor={mx(total)} />
      </div>

      {enPrep && (
        <Tarjeta titulo="Antes de confirmar">
          <div className="lista">
            <Pendiente
              hecho={faltan.length === 0}
              titulo={`Valeras por cargar${faltan.length ? ` (${faltan.length})` : ''}`}
              detalle={faltan.map((v) => v.nombre).join(', ')}
              instruccion="Sube su relación, o márcala como «No recibí relación» si no te la entregó."
              accion="Atender"
              a="/valeras"
            />
            <Pendiente
              hecho={pend.porRevisar.length === 0}
              titulo={`Importaciones por revisar${pend.porRevisar.length ? ` (${pend.porRevisar.length})` : ''}`}
              detalle={pend.porRevisar.map((v) => v.nombre).join(', ')}
              instruccion="Abriste la relación pero todavía no la incorporas."
              accion="Atender"
              a={primeraRevisada ? `/revision/${primeraRevisada}` : '/subir'}
            />
            <Pendiente
              hecho={pend.parecidos.length === 0}
              titulo={`Nombres parecidos${pend.parecidos.length ? ` (${pend.parecidos.length})` : ''}`}
              detalle="Hay nombres que se parecen a clientes que ya tienes."
              instruccion="Decide si es la misma persona. No la unimos sin tu confirmación."
              accion="Atender"
              a="/revisar"
            />
            <Pendiente
              hecho={pend.nuevos.length === 0}
              titulo={`Clientes nuevos por definir${pend.nuevos.length ? ` (${pend.nuevos.length})` : ''}`}
              detalle="Falta saber quién se hará responsable de su pago."
              instruccion="Elige si pagan directamente o a través de otro cliente."
              accion="Atender"
              a="/revisar"
            />
          </div>
        </Tarjeta>
      )}

      {hayBloqueo && enPrep && (
        <Aviso tono="error" titulo="Todavía no se puede confirmar">
          {sinResponsable > 0 ? `Hay ${mx(sinResponsable)} sin responsable definido. ` : ''}No se genera una cobranza final con importes sin responsable ni con una relación a medias.
        </Aviso>
      )}

      {enPrep && faltan.length > 0 && !hayBloqueo && (
        <Aviso tono="alerta" titulo={`Falta subir: ${faltan.map((v) => v.nombre).join(', ')}`}>
          La cobranza quedaría sin esos importes. Puedes marcar «No recibí relación» en <Enlace a="/valeras">Valeras</Enlace> o confirmar así.
          <label className="interruptor" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
            <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
            <span>Entiendo que falta esa relación y quiero confirmar así.</span>
          </label>
        </Aviso>
      )}

      {(omitidos.length > 0 || conceptos.length > 0 || sinRelacion.length > 0) && (
        <Tarjeta titulo="Lo que no entra en la cobranza (a la vista)">
          {sinRelacion.map((v) => (
            <p key={v.id}>{v.nombre}: indicaste que no recibiste su relación esta quincena.</p>
          ))}
          {omitidos.map((m) => (
            <p key={m.id}>Movimiento omitido por decisión tuya: {m.nombreOriginal}, vale {m.vale}, {mx(m.importe)}.</p>
          ))}
          {conceptos.map((c) => (
            <p key={c.folio}>{c.descripcion} ({c.folio}): {mx(c.importe)}. Es tuyo, no de un cliente.</p>
          ))}
        </Tarjeta>
      )}

      <Tarjeta titulo="Quién paga cuánto">
        <div className="buscador">
          <Icono nombre="buscar" tam={20} />
          <input type="search" aria-label="Buscar responsable por nombre" placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <table className="tabla">
          <thead><tr><th>Responsable de pago</th><th className="num">Personas a su cargo</th><th className="num">Pagos propios</th><th className="num">De recomendados</th><th className="num">Total</th></tr></thead>
          <tbody>
            {pag.items.map((p) => (
              <tr key={p.id}>
                <td data-label="Responsable"><strong>{p.nombre}</strong></td>
                <td data-label="A su cargo" className="num">{p.nRecomendados}</td>
                <td data-label="Propios" className="num">{mx(p.propiosTotal)}</td>
                <td data-label="Recomendados" className="num">{mx(p.recTotal)}</td>
                <td data-label="Total" className="num">{mx(p.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td data-label="">Total general ({filas.length} responsables)</td><td /><td /><td /><td className="num" data-label="Total">{mx(total)}</td></tr></tfoot>
        </table>
        <MostrarMas pag={pag} etiqueta="responsables" />
      </Tarjeta>

      {enPrep ? (
        <>
          <Aviso tono="info" titulo="Qué pasa al confirmar">
            Se guardan los avisos de cobro con su folio. Cambiar después un nombre o un responsable no modifica los avisos ya emitidos.
          </Aviso>
          <div className="acciones">
            <Boton
              grande
              disabled={!puede}
              onClick={() => {
                dispatch({ type: 'CONFIRMAR_COBRANZA' });
                avisar('Cobranza confirmada. Ya puedes preparar los avisos y registrar pagos.');
                ir('/cobranza');
              }}
            >
              Confirmar cobranza
            </Boton>
            <Boton tipo="secundario" onClick={() => ir('/inicio')}>Volver al inicio</Boton>
          </div>
        </>
      ) : (
        <div className="acciones">
          <Enlace a="/avisos" className="btn btn-primario btn-lg">Preparar avisos de cobro</Enlace>
          <Enlace a="/cobranza" className="btn btn-secundario">Ver la relación de cobranza</Enlace>
        </div>
      )}
    </div>
  );
}
