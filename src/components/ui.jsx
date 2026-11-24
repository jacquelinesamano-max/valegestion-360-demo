import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export const Icono = ({ nombre, tam = 22 }) => {
  const rutas = {
    inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    clientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    cobranza: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    historial: 'M12 7v5l3 2M21 12a9 9 0 1 1-9-9',
    mas: 'M5 12h.01M12 12h.01M19 12h.01',
    ok: 'M5 13l4 4L19 7',
    alerta: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    imprimir: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
    buscar: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
    mas_: 'M12 5v14M5 12h14',
    flecha: 'M9 6l6 6-6 6',
    archivo: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
    ojo: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    ojo_no: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22',
    wa: 'M21 12a9 9 0 0 1-13.4 7.9L3 21l1.1-4.5A9 9 0 1 1 21 12z',
    info: 'M12 16v-4M12 8h.01M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
  };
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={rutas[nombre]} />
    </svg>
  );
};

const INICIALES_IGNORADAS = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
export function Avatar({ nombre }) {
  const palabras = String(nombre).split(/\s+/).filter((w) => w && !INICIALES_IGNORADAS.has(w.toLowerCase()) && /^[\p{L}]/u.test(w));
  const iniciales = ((palabras[0]?.[0] ?? '?') + (palabras[1]?.[0] ?? '')).toUpperCase();
  const tono = [...String(nombre)].reduce((t, ch) => t + ch.charCodeAt(0), 0) % 4;
  return <span className={`avatar tono-${tono}`} aria-hidden="true">{iniciales}</span>;
}

export const Boton = ({ tipo = 'primario', grande, children, className = '', ...p }) => (
  <button type="button" className={`btn btn-${tipo} ${grande ? 'btn-lg' : ''} ${className}`} {...p}>
    {children}
  </button>
);

export const Etiqueta = ({ tono = 'neutro', children }) => <span className={`chip chip-${tono}`}>{children}</span>;

export const Tarjeta = ({ titulo, accion, children, className = '', id }) => (
  <section className={`card ${className}`} id={id}>
    {(titulo || accion) && (
      <header className="card-head">
        {titulo && <h2>{titulo}</h2>}
        {accion}
      </header>
    )}
    {children}
  </section>
);

export const Aviso = ({ tono = 'info', titulo, children }) => (
  <div className={`notice notice-${tono}`} role={tono === 'error' ? 'alert' : 'note'}>
    <Icono nombre={tono === 'ok' ? 'ok' : tono === 'info' ? 'info' : 'alerta'} />
    <div>
      {titulo && <strong>{titulo}</strong>}
      <div>{children}</div>
    </div>
  </div>
);

export const Campo = ({ etiqueta, ayuda, error, children }) => (
  <label className="field">
    <span className="field-label">{etiqueta}</span>
    {children}
    {ayuda && !error && <span className="hint">{ayuda}</span>}
    {error && <span className="field-error">{error}</span>}
  </label>
);

export const Cifra = ({ etiqueta, valor, nota, tono }) => (
  <div className={`stat ${tono ? `stat-${tono}` : ''}`}>
    <span className="stat-label">{etiqueta}</span>
    <span className="stat-value">{valor}</span>
    {nota && <span className="stat-note">{nota}</span>}
  </div>
);

export const Vacio = ({ titulo, children, accion }) => (
  <div className="empty">
    <h3>{titulo}</h3>
    <p>{children}</p>
    {accion}
  </div>
);

export function Dialogo({ titulo, onCerrar, children, pie }) {
  const ref = useRef(null);
  useEffect(() => {
    const previo = document.activeElement;
    ref.current?.focus();
    const alTeclear = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      previo?.focus?.();
    };
  }, [onCerrar]);
  return (
    <div className="modal-fondo no-print" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <header className="modal-head">
          <h2>{titulo}</h2>
          <button type="button" className="btn btn-texto" onClick={onCerrar} aria-label="Cerrar">
            Cerrar
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {pie && <footer className="modal-foot">{pie}</footer>}
      </div>
    </div>
  );
}

const CtxToast = createContext(() => {});
export const useAviso = () => useContext(CtxToast);

export function AvisosProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const temp = useRef(null);
  // mostrar(texto) o mostrar(texto, { accion: { texto, hacer }, segundos }): con acción, el aviso dura 7 s y muestra una cuenta regresiva.
  const mostrar = useCallback((texto, opciones = {}) => {
    window.clearTimeout(temp.current);
    const ms = opciones.accion ? (opciones.segundos ?? 7) * 1000 : 4200;
    setMsg({ texto, accion: opciones.accion, ms, k: Date.now() });
    temp.current = window.setTimeout(() => setMsg(null), ms);
  }, []);
  const cerrar = () => {
    window.clearTimeout(temp.current);
    setMsg(null);
  };
  return (
    <CtxToast.Provider value={mostrar}>
      {children}
      <div className="toast-zona no-print" aria-live="polite">
        {msg && (
          <div className="toast" key={msg.k}>
            <span>{msg.texto}</span>
            {msg.accion && (
              <button type="button" className="toast-deshacer" onClick={() => { msg.accion.hacer(); cerrar(); }}>
                {msg.accion.texto}
              </button>
            )}
            {msg.accion && <span className="toast-barra" style={{ animationDuration: `${msg.ms}ms` }} aria-hidden="true" />}
          </div>
        )}
      </div>
    </CtxToast.Provider>
  );
}
