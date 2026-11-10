import { useState } from 'react';
import { Aviso, Avatar, Boton, Cifra, Dialogo, Etiqueta, Icono, Vacio, useAviso } from '../components/ui.jsx';
import { Detalle, TONO_ESTADO } from '../components/Detalle.jsx';
import { MostrarMas, Orden, usePaginado } from '../components/Paginado.jsx';
import { PagoSheet } from '../components/PagoSheet.jsx';
import { Enlace, ir, useAncho } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { totales, vistaCobranza } from '../lib/calc.js';
import { normalizar } from '../lib/names.js';
import { mx } from '../lib/money.js';

const ESTADOS_COBRANZA = { preparacion: ['Cobranza en preparación', 'alerta'], confirmada: ['Cobranza confirmada', 'primario'], cerrada: ['Quincena cerrada', 'neutro'] };

// Diseño de referencia: cómo se vería corregir una cobranza ya confirmada. No es funcional todavía.
function CorregirCobranza({ onCerrar }) {
  const { s } = useStore();
  const conPagos = s.pagos.some((p) => p.estado === 'vigente');
  return (
    <Dialogo titulo="Corregir una cobranza confirmada" onCerrar={onCerrar} pie={<Boton onClick={onCerrar}>Entendido</Boton>}>
      <Aviso tono="demo" titulo="Esto es un diseño, no funciona todavía">
        Se muestra para validar cómo lo entienden las mayoristas. Se implementa en una fase posterior.
      </Aviso>
      <ol style={{ paddingLeft: 20, display: 'grid', gap: 8, margin: 0 }}>
        <li>Eliges qué cambió: un importe, un cliente o quién paga por quién.</li>
        <li>Ves lado a lado la versión 1 (la confirmada) y la versión 2 (la corregida), con los totales de cada responsable.</li>
        <li>Al confirmar, se crea la versión 2 y los avisos nuevos llevan el mismo folio con «versión 2». Los avisos anteriores se conservan.</li>
      </ol>
      <Aviso tono={conPagos ? 'alerta' : 'info'} titulo="Si ya hay pagos registrados">
        {conPagos
          ? 'Hoy hay pagos registrados en esta cobranza. Se conservarían tal cual y te mostraríamos qué responsables pasan a tener saldo a favor o saldo pendiente.'
          : 'Si hubiera pagos registrados, se conservarían tal cual y te avisaríamos de los saldos que cambian.'}
      </Aviso>
    </Dialogo>
  );
}

export default function Cobranza({ seleccionado }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const ancho = useAncho('(min-width: 1180px)');
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [orden, setOrden] = useState('nombre');
  const [pagando, setPagando] = useState(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const t = totales(s);
  const todos = vistaCobranza(s);
  const estado = s.quincena.estado;
  const lista = todos
    .filter((p) => normalizar(p.nombre).includes(normalizar(q)))
    .filter((p) => filtro === 'Todos' || p.estado === filtro)
    .sort((a, b) => (orden === 'total' ? b.total - a.total : orden === 'falta' ? b.pendiente - a.pendiente : a.nombre.localeCompare(b.nombre, 'es')));
  const pag = usePaginado(lista, 25, `${q}|${filtro}|${orden}`);
  const idDetalle = seleccionado || (ancho ? lista[0]?.id : null);
  const soloDetalle = Boolean(seleccionado) && !ancho;
  const [textoEstado, tono] = ESTADOS_COBRANZA[estado];
  const contar = (e) => todos.filter((p) => p.estado === e).length;

  if (soloDetalle) {
    return (
      <div className="pagina">
        <Enlace a="/cobranza">← Relación general</Enlace>
        <Detalle id={seleccionado} />
      </div>
    );
  }

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Relación general de cobranza</h1>
          <p>{s.quincena.label}</p>
        </div>
        <Etiqueta tono={tono}>{textoEstado}</Etiqueta>
      </div>

      {estado === 'preparacion' && (
        <Aviso tono="alerta" titulo="Vista previa: todavía no está confirmada">
          Así quedaría tu cobranza con lo que has subido hasta ahora. Para generar avisos y registrar pagos, primero confírmala.{' '}
          <Enlace a="/confirmar">Ir a confirmar</Enlace>
        </Aviso>
      )}

      <div className="stats">
        <Cifra etiqueta="Total a cobrar" valor={mx(t.total)} nota={`${t.n} responsables de pago`} />
        <Cifra etiqueta="Cobrado" valor={mx(t.cobrado)} tono="ok" nota="Según lo registrado" />
        <Cifra etiqueta="Pendiente de cobrar" valor={mx(t.pendiente)} tono="alerta" nota={`${contar('Pendiente')} sin pago · ${contar('Abono')} con abono`} />
      </div>

      <div className="acciones">
        <Enlace a="/imprimir" className="btn btn-secundario"><Icono nombre="imprimir" tam={18} /> Imprimir relación</Enlace>
        <Enlace a="/avisos" className="btn btn-secundario" aria-disabled={estado === 'preparacion'} onClick={(e) => estado === 'preparacion' && (e.preventDefault(), avisar('Confirma la cobranza para preparar los avisos.'))}>Preparar avisos de cobro</Enlace>
        <Enlace a="/pagos" className="btn btn-texto">Historial de pagos</Enlace>
        {estado !== 'preparacion' && <Boton tipo="texto" onClick={() => setCorrigiendo(true)}>Corregir cobranza</Boton>}
        {estado === 'confirmada' && <Boton tipo="texto" onClick={() => setCerrando(true)}>Cerrar quincena</Boton>}
      </div>

      <div className="acciones">
        <div className="buscador">
          <Icono nombre="buscar" tam={20} />
          <input type="search" aria-label="Buscar responsable por nombre" placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Orden valor={orden} onCambio={setOrden} opciones={[['nombre', 'Nombre (A–Z)'], ['total', 'Total a cobrar (mayor)'], ['falta', 'Lo que falta (mayor)']]} />
      </div>
      <div className="filtros" role="group" aria-label="Filtrar por estado">
        {['Todos', 'Pendiente', 'Abono', 'Pagado'].map((f) => (
          <button key={f} type="button" className="filtro" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{f}{f !== 'Todos' ? ` (${contar(f)})` : ''}</button>
        ))}
      </div>

      <div className={ancho ? 'partido' : ''}>
        <div className="lista" aria-label="Responsables de pago">
          {lista.length === 0 && <Vacio titulo="Nadie coincide">Prueba con otro nombre o con otro estado.</Vacio>}
          {pag.items.map((p) => (
            <div key={p.id} className={`fila ${ancho && idDetalle === p.id ? 'activa' : ''}`}>
              <Avatar nombre={p.nombre} />
              <div className="fila-main">
                <Enlace a={`/cobranza/${p.id}`}><strong>{p.nombre}</strong></Enlace>
                <small>
                  {p.nRecomendados ? `${p.nRecomendados} ${p.nRecomendados === 1 ? 'recomendado' : 'recomendados'} · ` : ''}
                  Total {mx(p.total)} · Pagado {mx(p.pagado)} · Falta {mx(p.pendiente)}
                </small>
              </div>
              <Etiqueta tono={TONO_ESTADO[p.estado]}>{p.estado}</Etiqueta>
              <span className="acciones">
                <Enlace a={`/cobranza/${p.id}`} className="btn btn-texto">Ver detalle</Enlace>
                <Boton tipo="secundario" disabled={estado !== 'confirmada' || p.pendiente <= 0} onClick={() => setPagando(p)}>Registrar pago</Boton>
              </span>
            </div>
          ))}
          <MostrarMas pag={pag} etiqueta="responsables" />
        </div>
        {ancho && idDetalle && <div className="sticky"><Detalle key={idDetalle} id={idDetalle} /></div>}
      </div>

      {pagando && <PagoSheet responsable={pagando} onCerrar={() => setPagando(null)} />}
      {corrigiendo && <CorregirCobranza onCerrar={() => setCorrigiendo(false)} />}
      {cerrando && (
        <Dialogo
          titulo="Cerrar la quincena"
          onCerrar={() => setCerrando(false)}
          pie={
            <>
              <Boton tipo="secundario" onClick={() => setCerrando(false)}>Todavía no</Boton>
              <Boton
                onClick={() => {
                  dispatch({ type: 'CERRAR_QUINCENA' });
                  setCerrando(false);
                  avisar('Cerraste la quincena. Queda en tu historial.');
                  ir('/historial');
                }}
              >
                Cerrar quincena
              </Boton>
            </>
          }
        >
          <p>Cuando la cierras, la quincena queda de solo consulta: ya no se registran pagos ni se cambia nada. Hoy faltan por cobrar {mx(t.pendiente)}.</p>
        </Dialogo>
      )}
    </div>
  );
}
