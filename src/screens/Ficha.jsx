import { useState } from 'react';
import { Aviso, Boton, Campo, Etiqueta, Tarjeta, useAviso } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { listaClientes, movsActivos, nombreVisible, recomendadosDe, valeraNombre } from '../lib/calc.js';
import { mx } from '../lib/money.js';

export default function Ficha({ id }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const c = s.clientes[id];
  const [celular, setCelular] = useState(c?.celular ?? '');
  const [curp, setCurp] = useState(c?.curp ?? '');
  if (!c) return <Aviso tono="error" titulo="No encontramos a esa persona">Vuelve al directorio de clientes.</Aviso>;

  const rec = recomendadosDe(s, id);
  const tieneRec = rec.length > 0;
  const confirmada = s.quincena.estado !== 'preparacion';
  // Quién puede ser su responsable: alguien que cobre directamente, que no sea ella misma, y solo si ella no tiene personas a su cargo.
  const posibles = listaClientes(s).filter((x) => !x.responsableId && x.id !== id);
  const candidatosRec = listaClientes(s).filter((x) => x.id !== id && !x.responsableId && recomendadosDe(s, x.id).length === 0 && !c.responsableId);
  const aliases = s.aliases.filter((a) => a.clienteId === id);
  const vales = Object.entries(s.vales).filter(([, v]) => v === id).map(([k]) => k.split('|'));
  const esta = movsActivos(s).filter((m) => m.clienteId === id);

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <Enlace a="/clientes">← Todos los clientes</Enlace>
          <h1>{nombreVisible(s, id)}</h1>
          <p>{c.responsableId ? <>Recomendado: lo paga <Enlace a={`/clientes/${c.responsableId}`}>{s.clientes[c.responsableId].nombre}</Enlace></> : 'Paga directamente'}</p>
        </div>
        {c.responsableId ? <Etiqueta tono="info">Recomendado</Etiqueta> : <Etiqueta tono="primario">Responsable de pago</Etiqueta>}
      </div>

      {confirmada && (
        <Aviso tono="info" titulo="Cambios después de confirmar">
          Los avisos de cobro ya emitidos no se modifican. Lo que cambies aquí aplica desde la siguiente cobranza.
        </Aviso>
      )}

      <div className="grid-2">
        <Tarjeta titulo="¿Quién paga por esta persona?">
          {tieneRec ? (
            <Aviso tono="info">{c.nombre} tiene personas a su cargo, así que ella misma debe pagar directamente. No se permiten cadenas de recomendados.</Aviso>
          ) : (
            <Campo etiqueta="Responsable de pago" ayuda="Su deuda se queda a su nombre, pero se le cobra al responsable.">
              <select
                value={c.responsableId ?? ''}
                onChange={(e) => {
                  dispatch({ type: 'EDITAR_RESPONSABLE', clienteId: id, responsableId: e.target.value || null });
                  avisar('Guardamos el cambio.');
                }}
              >
                <option value="">Paga directamente</option>
                {posibles.map((x) => <option key={x.id} value={x.id}>{nombreVisible(s, x.id)}</option>)}
              </select>
            </Campo>
          )}
        </Tarjeta>

        <Tarjeta titulo={`Personas a su cargo (${rec.length})`}>
          {c.responsableId ? (
            <p className="suave">Quien es recomendado no puede tener personas a su cargo.</p>
          ) : (
            <>
              {rec.length === 0 && <p className="suave">Nadie. Si algún cliente paga a través de {c.nombre}, agrégalo aquí.</p>}
              <div className="lista">
                {rec.map((r) => (
                  <div className="fila" key={r.id}>
                    <Enlace a={`/clientes/${r.id}`}><strong>{nombreVisible(s, r.id)}</strong></Enlace>
                    <Boton tipo="texto" onClick={() => dispatch({ type: 'EDITAR_RESPONSABLE', clienteId: r.id, responsableId: null })}>Quitar</Boton>
                  </div>
                ))}
              </div>
              <Campo etiqueta="Agregar a alguien a su cargo">
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    dispatch({ type: 'EDITAR_RESPONSABLE', clienteId: e.target.value, responsableId: id });
                    avisar('Agregamos a la persona.');
                  }}
                >
                  <option value="">Elige un cliente…</option>
                  {candidatosRec.map((x) => <option key={x.id} value={x.id}>{nombreVisible(s, x.id)}</option>)}
                </select>
              </Campo>
            </>
          )}
        </Tarjeta>
      </div>

      <Tarjeta titulo="Esta quincena">
        {esta.length === 0 ? (
          <p className="suave">No tiene movimientos en esta quincena.</p>
        ) : (
          <table className="tabla">
            <thead><tr><th>Valera</th><th>Vale</th><th className="num">Importe</th></tr></thead>
            <tbody>
              {esta.map((m) => (
                <tr key={m.id}><td data-label="Valera">{valeraNombre(s, m.valeraId)}</td><td data-label="Vale">{m.vale}</td><td data-label="Importe" className="num">{mx(m.importe)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>

      <div className="grid-2">
        <Tarjeta titulo="Datos opcionales">
          <p className="suave">Nunca se piden. Sirven para distinguir a dos personas con el mismo nombre.</p>
          <Campo etiqueta="Celular">
            <input type="text" inputMode="tel" value={celular} onChange={(e) => setCelular(e.target.value)} />
          </Campo>
          <Campo etiqueta="CURP">
            <input type="text" value={curp} onChange={(e) => setCurp(e.target.value.toUpperCase())} />
          </Campo>
          <Boton tipo="secundario" onClick={() => { dispatch({ type: 'EDITAR_DATOS', clienteId: id, celular: celular || null, curp: curp || null }); avisar('Guardamos los datos.'); }}>
            Guardar datos
          </Boton>
        </Tarjeta>

        <Tarjeta titulo="Cómo aparece en las relaciones">
          {aliases.length === 0 && vales.length === 0 && <p className="suave">Todavía no hay nombres ni vales recordados.</p>}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {aliases.map((a) => <li key={`${a.valeraId}-${a.clave}`}>«{a.nombreOriginal}» en {valeraNombre(s, a.valeraId)}</li>)}
          </ul>
          {vales.length > 0 && <p className="suave">Vales que ya reconocemos como suyos: {vales.map(([v, n]) => `${valeraNombre(s, v)} ${n}`).join(', ')}.</p>}
        </Tarjeta>
      </div>
    </div>
  );
}
