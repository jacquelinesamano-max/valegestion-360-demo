import { useEffect, useState } from 'react';
import { Aviso, Boton, Cifra, Etiqueta, Tarjeta } from '../components/ui.jsx';
import { ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { RELACIONES } from '../data/seed.js';
import { compararConAnterior, diffReemplazo, revisarImportacion } from '../lib/calc.js';
import { addDays, fechaLarga, quincenaDe } from '../lib/dates.js';
import { leerImporte, mx } from '../lib/money.js';
import { useAviso } from '../components/ui.jsx';

function ImporteFaltante({ fila, relId, dispatch }) {
  const [texto, setTexto] = useState('');
  const valor = leerImporte(texto);
  return (
    <span className="acciones" style={{ justifyContent: 'flex-end' }}>
      <input
        type="text"
        inputMode="decimal"
        aria-label={`Importe de ${fila.nombre}, vale ${fila.vale}`}
        placeholder="Importe"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={{ width: 130 }}
      />
      <Boton tipo="secundario" disabled={valor == null || valor <= 0} onClick={() => dispatch({ type: 'DRAFT_IMPORTE', relId, rowId: fila.id, importe: valor })}>
        Guardar
      </Boton>
    </span>
  );
}

export default function RevisionImport({ relId }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const rel = RELACIONES.find((r) => r.id === relId && !r.foto);
  const [decision, setDecision] = useState(null);
  const idRel = rel?.id;
  useEffect(() => {
    if (idRel) dispatch({ type: 'LEER_RELACION', relId: idRel }); // queda como «importación por revisar» hasta que se incorpore
  }, [idRel, dispatch]);
  if (!rel) return <Aviso tono="error" titulo="No encontramos ese archivo">Vuelve a «Subir relación» y elige uno de los ejemplos.</Aviso>;

  const valera = s.valeras.find((v) => v.id === rel.valeraId);
  const draft = s.drafts[rel.id] || {};
  const r = revisarImportacion(rel, draft);
  const fechaPago = rel.fechaPagoArchivo || addDays(rel.corte, valera.diasPago);
  const q = quincenaDe(fechaPago);
  const esReemplazo = Boolean(rel.reemplazaA) && s.importaciones.some((i) => i.relId === rel.reemplazaA && !i.reemplazada);
  const confirmada = s.quincena.estado !== 'preparacion';
  const diff = esReemplazo ? diffReemplazo(s, rel, rel.reemplazaA) : null;
  const yaIncorporada = s.importaciones.some((i) => i.relId === rel.id && !i.reemplazada);
  const cmp = compararConAnterior(rel.valeraId, r.filas);
  const bloqueadaPorReemplazo = esReemplazo && !decision;
  const puedeIncorporar = !confirmada && !yaIncorporada && r.porRevisar === 0 && !bloqueadaPorReemplazo;

  const incorporar = () => {
    dispatch({ type: 'IMPORTAR', relId: rel.id, decision });
    avisar(`Se incorporaron los movimientos de ${valera.nombre}.`);
    ir('/revisar');
  };

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Revisa lo que leímos</h1>
          <p>{valera.nombre} · {rel.archivo}</p>
        </div>
        <Etiqueta tono="alerta">Lectura simulada</Etiqueta>
      </div>

      <Tarjeta titulo="Fechas del documento">
        <div className="grid-2">
          <div>
            <span className="suave">Fecha de corte del documento</span>
            <p><strong>{fechaLarga(rel.corte)}</strong></p>
            <small className="suave">Cuando la valera emitió la relación con los vales del periodo.</small>
          </div>
          <div>
            <span className="suave">Fecha límite de pago</span>
            <p><strong>{fechaLarga(fechaPago)}</strong></p>
            <small className="suave">
              {rel.fechaPagoArchivo ? 'Tomada del archivo.' : `El archivo no la trae: la calculamos con el calendario de ${valera.nombre} (${valera.diasPago} días después del corte).`}
            </small>
          </div>
          <div>
            <span className="suave">Quincena de cobranza en la que se agrupa</span>
            <p><strong>{q.label}</strong></p>
            <small className="suave">{q.id === s.quincena.id ? 'Es la quincena que estás trabajando.' : 'No es la quincena activa.'}</small>
          </div>
        </div>
      </Tarjeta>

      <div className="stats">
        <Cifra etiqueta="Movimientos leídos" valor={String(rel.filas.length)} nota={r.clientesConVariosVales ? `${r.clientesConVariosVales} ${r.clientesConVariosVales === 1 ? 'cliente con varios vales' : 'clientes con varios vales'} (es válido)` : 'Ningún cliente repite vale'} />
        <Cifra etiqueta="Suma de los clientes" valor={mx(r.calculado)} />
        {r.conceptos > 0 && <Cifra etiqueta="Conceptos de la mayorista" valor={mx(r.conceptos)} nota="No se cobran a tus clientes" />}
        <Cifra etiqueta="Total del documento" valor={mx(r.totalDocumento)} tono={r.cuadra ? 'ok' : 'alerta'} />
      </div>

      {r.cuadra ? (
        <Aviso tono="ok" titulo="La suma cuadra con el documento">
          {mx(r.calculado)} de clientes{r.conceptos > 0 ? ` + ${mx(r.conceptos)} de conceptos de la mayorista` : ''} = {mx(r.totalDocumento)}.
        </Aviso>
      ) : (
        <Aviso tono="alerta" titulo="La suma todavía no cuadra">
          {r.diferencia > 0
            ? `Faltan ${mx(r.diferencia)} para llegar al total del documento. Completa el importe de la fila marcada.`
            : `Las filas suman ${mx(-r.diferencia)} más que el documento. Revisa la fila marcada como posible duplicado.`}
        </Aviso>
      )}

      {rel.conceptos.length > 0 && (
        <Aviso tono="info" titulo="Este documento trae conceptos propios de la mayorista">
          {rel.conceptos.map((c) => `${c.descripcion} (${c.folio}): ${mx(c.importe)}`).join(' · ')}. Forman parte de lo que tú pagas a la valera, pero no de lo que cobras a tus clientes, así que no entran en la cobranza.
        </Aviso>
      )}

      {esReemplazo && (
        <Tarjeta titulo="Ya subiste una relación de esta valera y quincena">
          <p>Dile al sistema qué hacer con esta nueva versión. Nada cambia hasta que lo confirmes.</p>
          <div className="opciones" role="radiogroup">
            <label className="opcion">
              <input type="radio" name="decision" checked={decision === 'reemplazar'} onChange={() => setDecision('reemplazar')} />
              <span><strong>Reemplazar la importación anterior</strong><br /><small className="suave">Los movimientos anteriores se sustituyen por los de este archivo.</small></span>
            </label>
            <label className="opcion">
              <input type="radio" name="decision" checked={decision === 'agregar'} onChange={() => setDecision('agregar')} />
              <span><strong>Agregar solo lo que no esté</strong><br /><small className="suave">Se conserva lo anterior y se suman únicamente vales que no estaban.</small></span>
            </label>
          </div>
          <div>
            <strong>Qué cambiaría</strong>
            <ul>
              {diff.cambios.map((c) => <li key={c.vale}>{c.nombre}, vale {c.vale}: de {mx(c.antes)} a {mx(c.despues)}</li>)}
              {diff.quitados.map((m) => <li key={m.id}>Se quitaría el vale {m.vale} ({m.nombreOriginal})</li>)}
              {!diff.cambios.length && !diff.quitados.length && <li>Ningún importe cambia.</li>}
            </ul>
          </div>
          {diff.conPagos.length > 0 && (
            <Aviso tono="alerta" titulo="Hay pagos registrados">
              Ya registraste pagos de: {diff.conPagos.join(', ')}. Se conservarían, pero los saldos cambiarían.
            </Aviso>
          )}
          {confirmada && (
            <Aviso tono="alerta" titulo="La cobranza ya está confirmada">
              Reemplazar una importación de una cobranza confirmada es una corrección: se haría una versión 2 y se conservarían los avisos anteriores. Esa parte se resuelve en una fase posterior.
            </Aviso>
          )}
        </Tarjeta>
      )}

      {cmp.hayCorteAnterior && !esReemplazo && (
        <Tarjeta titulo="Comparado con el corte anterior">
          <div className="stats">
            <Cifra etiqueta="Vales nuevos" valor={String(cmp.nuevos.length)} nota={cmp.nuevos.length ? mx(cmp.nuevos.reduce((t, x) => t + x.importe, 0)) : undefined} />
            <Cifra etiqueta="Ya no aparecen" valor={String(cmp.ausentes.length)} nota={cmp.ausentes.length ? mx(cmp.ausentes.reduce((t, x) => t + x.importe, 0)) : undefined} />
            <Cifra etiqueta="Importe que cambió" valor={String(cmp.cambios.length)} />
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            {cmp.nuevos.map((x) => <li key={x.id}>Vale nuevo: {x.vale} ({x.nombre}), {mx(x.importe)}</li>)}
            {cmp.ausentes.map((x) => <li key={x.vale}>Ya no aparece: {x.vale} ({x.nombre}), antes {mx(x.importe)}. Suele estar liquidado.</li>)}
            {cmp.cambios.map((x) => <li key={x.vale}>Cambió el importe de {x.vale} ({x.nombre}): de {mx(x.antes)} a {mx(x.despues)}</li>)}
            {!cmp.nuevos.length && !cmp.ausentes.length && !cmp.cambios.length && <li>Es igual al corte anterior.</li>}
          </ul>
          <p className="hint">Es solo informativo: no suma ni resta nada de la cobranza.</p>
        </Tarjeta>
      )}

      <Tarjeta titulo="Movimientos" accion={r.porRevisar ? <Etiqueta tono="alerta">{r.porRevisar} por revisar</Etiqueta> : <Etiqueta tono="ok">Todo revisado</Etiqueta>}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Cliente (como viene en el documento)</th>
              <th>Vale</th>
              <th>Canje</th>
              <th>Avance</th>
              <th className="num">Importe de la quincena</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {r.filas.map((f) => (
              <tr key={f.id} className={f.requiereRevision ? 'marcada' : f.omitida ? 'tenue' : ''}>
                <td data-label="Cliente"><strong>{f.nombre}</strong></td>
                <td data-label="Vale">{f.vale}</td>
                <td data-label="Canje">{f.canje}</td>
                <td data-label="Avance">{f.avance}</td>
                <td data-label="Importe" className="num">
                  {f.faltante ? <Etiqueta tono="error">Falta el importe</Etiqueta> : mx(f.importe)}
                </td>
                <td data-label="Estado">
                  {f.faltante && <ImporteFaltante fila={f} relId={rel.id} dispatch={dispatch} />}
                  {f.duplicadoPosible && (
                    <span>
                      <Etiqueta tono="alerta">Posible movimiento duplicado</Etiqueta>
                      <select
                        aria-label={`Qué hacer con el vale repetido ${f.vale}`}
                        value={f.accion || ''}
                        onChange={(e) => dispatch({ type: 'DRAFT_ACCION', relId: rel.id, rowId: f.id, accion: e.target.value || null })}
                        style={{ marginTop: 6 }}
                      >
                        <option value="">Elige qué hacer…</option>
                        <option value="omitir">Es un duplicado: no contarlo</option>
                        <option value="conservar">Son dos movimientos: conservar ambos</option>
                      </select>
                    </span>
                  )}
                  {!f.faltante && !f.duplicadoPosible && <Etiqueta tono="ok">Leído</Etiqueta>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Ninguna fila se elimina en silencio: si decides no contar una, queda visible y marcada.</p>
      </Tarjeta>

      <div className="acciones">
        <Boton grande disabled={!puedeIncorporar} onClick={incorporar}>Incorporar movimientos</Boton>
        <Boton tipo="secundario" onClick={() => { avisar('Guardamos tu avance. Puedes continuar después.'); ir('/inicio'); }}>Guardar y salir</Boton>
        {!puedeIncorporar && !yaIncorporada && !confirmada && (
          <span className="suave">{r.porRevisar ? 'Resuelve las filas marcadas para continuar.' : 'Elige qué hacer con la relación anterior.'}</span>
        )}
        {yaIncorporada && <Etiqueta tono="ok">Esta relación ya está incorporada</Etiqueta>}
      </div>
    </div>
  );
}
