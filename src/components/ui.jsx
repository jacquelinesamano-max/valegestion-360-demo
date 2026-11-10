import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export const Icono = ({ nombre, tam = 22 }) => {
  const rutas = {
    inicio: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    clientes: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
    cobranza: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    historial: 'M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
    mas: 'M5 12h.01M12 12h.01M19 12h.01',
    ok: 'M5 13l4 4L19 7',
    alerta: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    imprimir: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
    buscar: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
    mas_: 'M12 5v14M5 12h14',
    flecha: 'M9 6l6 6-6 6',
    archivo: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
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
  const mostrar = useCallback((texto) => {
    setMsg(texto);
    window.clearTimeout(mostrar.t);
    mostrar.t = window.setTimeout(() => setMsg(null), 4200);
  }, []);
  return (
    <CtxToast.Provider value={mostrar}>
      {children}
      <div className="toast-zona no-print" aria-live="polite">
        {msg && <div className="toast">{msg}</div>}
      </div>
    </CtxToast.Provider>
  );
}
