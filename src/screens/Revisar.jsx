import { useState } from 'react';
import { Aviso, Boton, Campo, Dialogo, Etiqueta, Tarjeta, Vacio, useAviso } from '../components/ui.jsx';
import { MostrarMas, usePaginado } from '../components/Paginado.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { gruposPendientes, listaClientes, nombreVisible, valeraNombre } from '../lib/calc.js';
import { explicar, normalizar } from '../lib/names.js';
import { mx } from '../lib/money.js';

function valesConocidos(s, clienteId) {
  return Object.entries(s.vales)
    .filter(([, id]) => id === clienteId)
    .map(([k]) => {
      const [valera, vale] = k.split('|');
      return `${valeraNombre(s, valera)} · ${vale}`;
    });
}

function Movimientos({ g, s }) {
  return (
    <ul className="lista" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {g.movs.map((m) => (
        <li key={m.id} className="suave">
          Vale {m.vale} · canje {m.canje} · avance {m.avance} · <strong>{mx(m.importe)}</strong>
        </li>
      ))}
      <li><strong>{mx(g.total)} en esta quincena</strong> ({valeraNombre(s, g.valeraId)})</li>
    </ul>
  );
}

function BuscarOtro({ g, onCerrar }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const [q, setQ] = useState('');
  const lista = listaClientes(s).filter((c) => normalizar(c.nombre).includes(normalizar(q)));
  return (
    <Dialogo titulo="Buscar otro cliente" onCerrar={onCerrar}>
      <p>¿A quién corresponde «{g.nombreOriginal}»?</p>
      <input type="search" aria-label="Buscar cliente por nombre" placeholder="Escribe un nombre" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="lista">
        {lista.map((c) => (
          <div key={c.id} className="fila">
            <div className="fila-main">
              <strong>{nombreVisible(s, c.id)}</strong>
              <small>{c.responsableId ? `Lo paga ${s.clientes[c.responsableId].nombre}` : 'Paga directamente'}</small>
            </div>
            <Boton
              tipo="secundario"
              onClick={() => {
                dispatch({ type: 'CONFIRMAR_GRUPO', key: g.key, clienteId: c.id });
                avisar(`«${g.nombreOriginal}» quedó asociado a ${nombreVisible(s, c.id)}.`);
                onCerrar();
              }}
            >
              Es esta persona
            </Boton>
          </div>
        ))}
        {!lista.length && <p className="suave">Nadie se llama así. Cierra esta ventana y marca «Son personas diferentes» para crear un cliente nuevo.</p>}
      </div>
    </Dialogo>
  );
}

function Coincidencia({ g, onBuscar }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const dudoso = g.nivel === 'dudoso';
  const confirmar = (c) => {
    dispatch({ type: 'CONFIRMAR_GRUPO', key: g.key, clienteId: c.cliente.id });
    avisar(`Listo: «${g.nombreOriginal}» es ${nombreVisible(s, c.cliente.id)}. Lo recordaremos para la próxima quincena.`);
  };
  return (
    <Tarjeta>
      <div className="card-head">
        <h3>«{g.nombreOriginal}» <span className="valera-tag">{valeraNombre(s, g.valeraId)}</span></h3>
        <span className="acciones">
          {g.postergado && <Etiqueta tono="neutro">Pospuesta</Etiqueta>}
          <Etiqueta tono={dudoso ? 'error' : 'alerta'}>{dudoso ? 'Dudosa' : g.nivel === 'seguro' ? 'Segura' : 'Probable'}</Etiqueta>
        </span>
      </div>
      <Movimientos g={g} s={s} />
      <Aviso tono="info">{explicar(g.nivel, g.nombreOriginal, g.candidatos)}</Aviso>
      <div className="lista">
        {g.candidatos.map((c) => {
          const conocidos = valesConocidos(s, c.cliente.id);
          return (
            <div className="fila" key={c.cliente.id}>
              <div className="fila-main">
                <strong>{nombreVisible(s, c.cliente.id)}</strong>
                <small>
                  {c.porcentaje}% de parecido · {c.cliente.responsableId ? `lo paga ${s.clientes[c.cliente.responsableId].nombre}` : 'paga directamente'}
                  {conocidos.length > 0 && ` · vales conocidos: ${conocidos.slice(0, 3).join(', ')}`}
                </small>
              </div>
              <Boton tipo={dudoso ? 'secundario' : 'primario'} onClick={() => confirmar(c)}>
                {dudoso ? 'Es esta persona' : 'Sí, es la misma persona'}
              </Boton>
            </div>
          );
        })}
      </div>
      <div className="acciones">
        <Boton tipo="secundario" onClick={() => dispatch({ type: 'DISTINTA_PERSONA', key: g.key, clienteIds: g.candidatos.map((c) => c.cliente.id) })}>
          {dudoso ? 'Es una persona diferente' : 'Son personas diferentes'}
        </Boton>
        <Boton tipo="secundario" onClick={onBuscar}>Buscar otro cliente</Boton>
        <Boton tipo="texto" onClick={() => dispatch({ type: 'POSTERGAR_GRUPO', key: g.key })}>Revisar después</Boton>
      </div>
    </Tarjeta>
  );
}

function ClienteNuevo({ g }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const directos = listaClientes(s).filter((c) => !c.responsableId);
  const [modo, setModo] = useState('directo');
  const [responsable, setResponsable] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const creando = responsable === '__nuevo';
  const valido = modo === 'directo' || (responsable && (!creando || nombreNuevo.trim()));
  const quien = modo === 'directo' ? null : creando ? nombreNuevo.trim() : s.clientes[responsable]?.nombre;
  return (
    <Tarjeta>
      <div className="card-head">
        <h3>{g.nombreOriginal} <span className="valera-tag">{valeraNombre(s, g.valeraId)}</span></h3>
        <Etiqueta tono="info">Cliente nuevo</Etiqueta>
      </div>
      <Movimientos g={g} s={s} />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend><strong>¿Quién se hará responsable de este pago?</strong></legend>
        <div className="opciones" style={{ marginTop: 8 }}>
          <label className="opcion">
            <input type="radio" name={`modo-${g.key}`} checked={modo === 'directo'} onChange={() => setModo('directo')} />
            <span>El cliente paga directamente</span>
          </label>
          <label className="opcion">
            <input type="radio" name={`modo-${g.key}`} checked={modo === 'otro'} onChange={() => setModo('otro')} />
            <span>Lo paga otro cliente</span>
          </label>
        </div>
      </fieldset>
      {modo === 'otro' && (
        <>
          <Campo etiqueta="¿Quién lo paga?">
            <select value={responsable} onChange={(e) => setResponsable(e.target.value)}>
              <option value="">Elige un responsable…</option>
              {directos.map((c) => <option key={c.id} value={c.id}>{nombreVisible(s, c.id)}</option>)}
              <option value="__nuevo">Crear un responsable que no aparece en los archivos…</option>
            </select>
          </Campo>
          {creando && (
            <Campo etiqueta="Nombre del responsable nuevo">
              <input type="text" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
            </Campo>
          )}
        </>
      )}
      <Aviso tono="ok" titulo="Así quedará">
        {quien === null
          ? `${g.nombreOriginal} pagará directamente sus ${mx(g.total)}.`
          : quien
            ? `${g.nombreOriginal} conserva su deuda a su nombre, pero sus ${mx(g.total)} se cobrarán a ${quien}.`
            : 'Elige quién lo paga para ver cómo quedaría.'}
      </Aviso>
      <Boton
        disabled={!valido}
        onClick={() => {
          dispatch({ type: 'CREAR_CLIENTE', key: g.key, responsableId: modo === 'otro' && !creando ? responsable : null, nuevoResponsable: modo === 'otro' && creando ? nombreNuevo : null });
          avisar(`Guardamos a ${g.nombreOriginal}${quien ? `, a cargo de ${quien}` : ' como cliente directo'}.`);
        }}
      >
        Guardar
      </Boton>
    </Tarjeta>
  );
}

export default function Revisar() {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const [buscando, setBuscando] = useState(null);
  const grupos = gruposPendientes(s);
  const seguros = grupos.filter((g) => g.nivel === 'seguro' && !g.postergado);
  const coincidencias = grupos.filter((g) => g.nivel === 'probable' || g.nivel === 'dudoso' || (g.nivel === 'seguro' && g.postergado));
  const nuevos = grupos.filter((g) => g.nivel === 'nuevo');
  const grupoBuscando = grupos.find((g) => g.key === buscando);
  const pagSeguras = usePaginado(seguros, 10, String(seguros.length));
  const pagNuevos = usePaginado(nuevos, 10, String(nuevos.length));
  const pagCoinc = usePaginado(coincidencias, 10, String(coincidencias.length));

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Revisar clientes</h1>
          <p>Primero confirmamos que cada nombre sea la persona correcta; después definimos quién paga por los clientes nuevos.</p>
        </div>
        <Etiqueta tono={grupos.length ? 'alerta' : 'ok'}>{grupos.length ? `${grupos.length} por revisar` : 'Sin pendientes'}</Etiqueta>
      </div>

      {grupos.length === 0 && (
        <Vacio
          titulo="No hay nada por revisar"
          accion={<Enlace a={s.quincena.estado === 'preparacion' ? '/confirmar' : '/cobranza'} className="btn btn-primario">{s.quincena.estado === 'preparacion' ? 'Ir a confirmar la cobranza' : 'Ver la cobranza'}</Enlace>}
        >
          Cuando subas otra relación, aquí aparecerán los nombres que necesiten tu confirmación.
        </Vacio>
      )}

      {seguros.length > 0 && (
        <Tarjeta
          titulo={`Coincidencias seguras (${seguros.length})`}
          accion={
            <Boton
              onClick={() => {
                dispatch({ type: 'CONFIRMAR_SEGUROS' });
                avisar(`Confirmaste ${seguros.length} coincidencias seguras.`);
              }}
            >
              Confirmar las {seguros.length} seguras
            </Boton>
          }
        >
          <Aviso tono="info">Son nombres con las mismas palabras que un cliente que ya conoces. Mira la lista y confirma todas de una vez, o aparta la que no sea.</Aviso>
          <div className="lista">
            {pagSeguras.items.map((g) => (
              <div className="fila" key={g.key}>
                <div className="fila-main">
                  <strong>«{g.nombreOriginal}» <span className="valera-tag">{valeraNombre(s, g.valeraId)}</span></strong>
                  <small>es {nombreVisible(s, g.candidatos[0].cliente.id)} · {mx(g.total)}</small>
                </div>
                <Boton tipo="texto" onClick={() => dispatch({ type: 'POSTERGAR_GRUPO', key: g.key })}>Revisar de uno en uno</Boton>
              </div>
            ))}
          </div>
          <MostrarMas pag={pagSeguras} etiqueta="coincidencias seguras" />
        </Tarjeta>
      )}

      {coincidencias.length > 0 && (
        <section className="pagina" aria-label="Coincidencias por confirmar">
          <h2>Coincidencias por confirmar ({coincidencias.length})</h2>
          {pagCoinc.items.map((g) => <Coincidencia key={g.key} g={g} onBuscar={() => setBuscando(g.key)} />)}
          <MostrarMas pag={pagCoinc} etiqueta="coincidencias" />
        </section>
      )}

      {nuevos.length > 0 && (
        <section className="pagina" aria-label="Clientes nuevos">
          <h2>Encontramos {nuevos.length} {nuevos.length === 1 ? 'cliente nuevo' : 'clientes nuevos'} para esta quincena</h2>
          {pagNuevos.items.map((g) => <ClienteNuevo key={g.key} g={g} />)}
          <MostrarMas pag={pagNuevos} etiqueta="clientes nuevos" />
        </section>
      )}

      {grupoBuscando && <BuscarOtro g={grupoBuscando} onCerrar={() => setBuscando(null)} />}
    </div>
  );
}
