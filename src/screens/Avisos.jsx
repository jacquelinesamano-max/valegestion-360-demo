import { useEffect } from 'react';
import { Aviso as Nota, Avatar, Boton, Etiqueta, Icono, Tarjeta, Vacio } from '../components/ui.jsx';
import { Enlace, useAncho } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { vistaCobranza } from '../lib/calc.js';
import { fechaLarga, HOY } from '../lib/dates.js';
import { mx } from '../lib/money.js';

// Aviso de cobro: documento informativo para que el responsable sepa cuánto debe pagar. No es factura ni comprobante de pago.
export function AvisoDeCobro({ p, activo, mostrarValera, version, quincena }) {
  const lineas = (ls) => ls.map((l) => (
    <div className="linea" key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span>Vale {l.vale}{mostrarValera ? ` · ${l.valera}` : ''}</span>
      <span>{mx(l.importe)}</span>
    </div>
  ));
  return (
    <article className={`aviso ${activo ? 'activo' : ''}`} aria-label={`Aviso de cobro de ${p.nombre}`}>
      <header className="aviso-cabeza">
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>Aviso de cobro</h2>
          <div>Distribuidora de demostración</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Folio {p.folio}</strong></div>
          <div>Versión {version}</div>
        </div>
      </header>
      <div><strong>Para:</strong> {p.nombre}</div>
      <div>
        <strong>Pagar a más tardar:</strong> {p.limite ? fechaLarga(p.limite) : 'según tu relación'} · <strong>Quincena:</strong> {quincena}
      </div>

      <div>
        <strong>Pagos propios</strong>
        {p.propias.length ? lineas(p.propias) : <div>Sin vales propios en esta quincena</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #999', marginTop: 4, paddingTop: 4 }}><span>Subtotal propios</span><strong>{mx(p.propiosTotal)}</strong></div>
      </div>

      {p.recomendados.length > 0 && (
        <div>
          <strong>Personas a su cargo</strong>
          {p.recomendados.map((r) => (
            <div key={r.id} style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{r.nombre}</span><strong>{mx(r.total)}</strong></div>
              <div style={{ paddingLeft: 14, fontSize: '0.9em' }}>{lineas(r.lineas)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #999', marginTop: 4, paddingTop: 4 }}><span>Subtotal de personas a su cargo</span><strong>{mx(p.recTotal)}</strong></div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px double #111', paddingTop: 8, fontSize: '1.25rem' }}>
        <strong>Total a pagar</strong>
        <strong>{mx(p.total)}</strong>
      </div>
      <div className="anotaciones">Anotaciones:</div>
      <p className="legal">Documento informativo. No es una factura ni un comprobante de pago. Generado el {fechaLarga(HOY)} con datos de demostración.</p>
    </article>
  );
}

export default function Avisos({ seleccionado }) {
  const { s, dispatch } = useStore();
  const ancho = useAncho('(min-width: 1180px)');
  const confirmada = s.quincena.estado !== 'preparacion';
  const lista = confirmada ? vistaCobranza(s) : [];
  const sel = lista.find((p) => p.id === seleccionado) ?? (ancho ? lista[0] : null);

  useEffect(() => {
    const limpiar = () => document.body.classList.remove('solo-uno');
    window.addEventListener('afterprint', limpiar);
    return () => window.removeEventListener('afterprint', limpiar);
  }, []);

  const imprimir = (uno) => {
    document.body.classList.toggle('solo-uno', uno);
    window.setTimeout(() => window.print(), 60);
  };

  if (!confirmada) {
    return (
      <div className="pagina">
        <h1>Avisos de cobro</h1>
        <Vacio titulo="Todavía no hay avisos" accion={<Enlace a="/confirmar" className="btn btn-primario">Ir a confirmar la cobranza</Enlace>}>
          Los avisos se preparan cuando confirmas la cobranza, para que su folio y su contenido ya no cambien.
        </Vacio>
      </div>
    );
  }

  const vista = sel ?? null;
  if (!ancho && seleccionado && vista) {
    return (
      <div className="pagina">
        <div className="no-print"><Enlace a="/avisos">← Todos los avisos</Enlace></div>
        <Tarjeta>
          <div className="acciones no-print">
            <Etiqueta tono="neutro">Vista previa</Etiqueta>
            <Boton onClick={() => imprimir(true)}><Icono nombre="imprimir" tam={18} /> Imprimir este aviso</Boton>
          </div>
          <AvisoDeCobro p={vista} activo mostrarValera={s.ajustes.mostrarValera} version={vista.version ?? 1} quincena={s.quincena.label} />
        </Tarjeta>
        <div className="print-only">
          <AvisoDeCobro p={vista} activo mostrarValera={s.ajustes.mostrarValera} version={vista.version ?? 1} quincena={s.quincena.label} />
        </div>
      </div>
    );
  }
  return (
    <div className="pagina">
      <div className="pagina-head no-print">
        <div>
          <h1>Avisos de cobro</h1>
          <p>Un aviso por responsable de pago, con el detalle de sus recomendados. Es informativo: no es factura ni comprobante.</p>
        </div>
        <div className="acciones">
          <Boton onClick={() => imprimir(false)}><Icono nombre="imprimir" tam={18} /> Imprimir todos</Boton>
          <Boton tipo="secundario" disabled title="Se implementa en una fase posterior">Descargar PDF (fase posterior)</Boton>
        </div>
      </div>

      <label className="interruptor no-print">
        <span>
          <strong>Mostrar el nombre de la valera en el detalle</strong>
          <br /><small className="suave">Cada línea indica de qué valera es el vale. Apágalo si prefieres un aviso más corto.</small>
        </span>
        <input type="checkbox" checked={s.ajustes.mostrarValera} onChange={(e) => dispatch({ type: 'SET_AJUSTE', clave: 'mostrarValera', valor: e.target.checked })} />
      </label>

      <div className={`${ancho ? 'partido' : ''} no-print`}>
        <div className="lista">
          {lista.map((p) => (
            <Enlace key={p.id} a={`/avisos/${p.id}`} className={`fila ${vista?.id === p.id ? 'activa' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Avatar nombre={p.nombre} />
              <div className="fila-main">
                <strong>{p.nombre}</strong>
                <small>{p.folio} · {mx(p.total)}</small>
              </div>
              <Icono nombre="flecha" tam={18} />
            </Enlace>
          ))}
        </div>
        <div className="sticky">
          {vista ? (
            <Tarjeta>
              <div className="acciones">
                <Etiqueta tono="neutro">Vista previa</Etiqueta>
                <Boton onClick={() => imprimir(true)}><Icono nombre="imprimir" tam={18} /> Imprimir este aviso</Boton>
                <Boton tipo="texto" onClick={() => imprimir(true)}>Reimprimir (mismo folio)</Boton>
              </div>
              <AvisoDeCobro p={vista} activo mostrarValera={s.ajustes.mostrarValera} version={vista.version ?? 1} quincena={s.quincena.label} />
            </Tarjeta>
          ) : (
            <Nota tono="info">Elige un responsable de la lista para ver su aviso.</Nota>
          )}
        </div>
      </div>

      {/* Todos los avisos para imprimir. Se acomodan según su tamaño y ninguno se corta entre páginas. */}
      <div className="print-only">
        {lista.map((p) => <AvisoDeCobro key={p.id} p={p} activo={vista?.id === p.id} mostrarValera={s.ajustes.mostrarValera} version={p.version ?? 1} quincena={s.quincena.label} />)}
      </div>
    </div>
  );
}
