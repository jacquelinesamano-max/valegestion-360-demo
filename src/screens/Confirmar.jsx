import { useState } from 'react';
import { Aviso, Boton, Cifra, Etiqueta, Tarjeta, useAviso } from '../components/ui.jsx';
import { Enlace, ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { gruposPendientes, movsActivos, pagadoresVivos, valerasCargadas, vistaCobranza } from '../lib/calc.js';
import { mx, suma } from '../lib/money.js';

export default function Confirmar() {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const [entiendo, setEntiendo] = useState(false);
  const enPrep = s.quincena.estado === 'preparacion';
  const grupos = gruposPendientes(s);
  const valeras = valerasCargadas(s);
  const faltan = valeras.filter((v) => !v.cargada);
  const filas = enPrep ? pagadoresVivos(s) : vistaCobranza(s);
  const total = suma(filas.map((p) => p.total));
  const omitidos = s.movimientos.filter((m) => m.omitido);
  const conceptos = s.importaciones.filter((i) => !i.reemplazada).flatMap((i) => i.conceptos.map((c) => ({ ...c, valeraId: i.valeraId })));
  const sinResponsable = suma(grupos.map((g) => g.total));
  const puede = enPrep && grupos.length === 0 && filas.length > 0 && (faltan.length === 0 || entiendo);

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
        <Cifra etiqueta="Valeras cargadas" valor={`${valeras.length - faltan.length} de ${valeras.length}`} tono={faltan.length ? 'alerta' : 'ok'} />
        <Cifra etiqueta="Movimientos que se cobran" valor={String(movsActivos(s).length)} />
        <Cifra etiqueta="Responsables de pago" valor={String(filas.length)} />
        <Cifra etiqueta="Total a cobrar" valor={mx(total)} />
      </div>

      {grupos.length > 0 && (
        <Aviso tono="error" titulo={`No se puede confirmar: ${grupos.length} revisiones pendientes`}>
          Hay {mx(sinResponsable)} sin responsable definido. No se genera una cobranza final con importes sin responsable.{' '}
          <Enlace a="/revisar">Resolver ahora</Enlace>
        </Aviso>
      )}

      {faltan.length > 0 && (
        <Aviso tono="alerta" titulo={`Falta subir: ${faltan.map((v) => v.nombre).join(', ')}`}>
          La cobranza quedaría sin esos importes. <Enlace a="/subir">Subir relación</Enlace>
          <label className="interruptor" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
            <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
            <span>Entiendo que falta esa relación y quiero confirmar así.</span>
          </label>
        </Aviso>
      )}

      {(omitidos.length > 0 || conceptos.length > 0) && (
        <Tarjeta titulo="Lo que no entra en la cobranza (a la vista)">
          {omitidos.map((m) => (
            <p key={m.id}>Movimiento omitido por decisión tuya: {m.nombreOriginal}, vale {m.vale}, {mx(m.importe)}.</p>
          ))}
          {conceptos.map((c) => (
            <p key={c.folio}>{c.descripcion} ({c.folio}): {mx(c.importe)}. Es tuyo, no de un cliente.</p>
          ))}
        </Tarjeta>
      )}

      <Tarjeta titulo="Quién paga cuánto">
        <table className="tabla">
          <thead><tr><th>Responsable de pago</th><th className="num">Personas a su cargo</th><th className="num">Pagos propios</th><th className="num">De recomendados</th><th className="num">Total</th></tr></thead>
          <tbody>
            {filas.map((p) => (
              <tr key={p.id}>
                <td data-label="Responsable"><strong>{p.nombre}</strong></td>
                <td data-label="A su cargo" className="num">{p.nRecomendados}</td>
                <td data-label="Propios" className="num">{mx(p.propiosTotal)}</td>
                <td data-label="Recomendados" className="num">{mx(p.recTotal)}</td>
                <td data-label="Total" className="num">{mx(p.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td data-label="">Total general</td><td /><td /><td /><td className="num" data-label="Total">{mx(total)}</td></tr></tfoot>
        </table>
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
