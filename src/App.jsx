import { useState } from 'react';
import { Boton, Dialogo, Icono } from './components/ui.jsx';
import { Enlace, ir, useRuta } from './router.jsx';
import { useStore } from './state/store.jsx';
import { fechaLarga, HOY } from './lib/dates.js';
import { ocultarMontos } from './lib/money.js';
import { vistaCobranza } from './lib/calc.js';
import Acceso from './screens/Acceso.jsx';
import Bienvenida from './screens/Bienvenida.jsx';
import Inicio from './screens/Inicio.jsx';
import Valeras from './screens/Valeras.jsx';
import Subir from './screens/Subir.jsx';
import RevisionImport from './screens/RevisionImport.jsx';
import Revisar from './screens/Revisar.jsx';
import Directorio from './screens/Directorio.jsx';
import Ficha from './screens/Ficha.jsx';
import Confirmar from './screens/Confirmar.jsx';
import Cobranza from './screens/Cobranza.jsx';
import Pagos from './screens/Pagos.jsx';
import Avisos from './screens/Avisos.jsx';
import Imprimir from './screens/Imprimir.jsx';
import Historial from './screens/Historial.jsx';
import Mas from './screens/Mas.jsx';
import Guia from './screens/Guia.jsx';

const NAV = [
  { a: '/inicio', icono: 'inicio', texto: 'Inicio', grupo: ['', 'inicio', 'valeras', 'subir', 'revision', 'revisar', 'confirmar'] },
  { a: '/clientes', icono: 'clientes', texto: 'Clientes', grupo: ['clientes'] },
  { a: '/cobranza', icono: 'cobranza', texto: 'Cobranza', grupo: ['cobranza', 'cobrar', 'pagos', 'avisos', 'imprimir'] },
  { a: '/historial', icono: 'historial', texto: 'Historial', grupo: ['historial'] },
  { a: '/mas', icono: 'mas', texto: 'Más', grupo: ['mas', 'guia'] },
];

function Reiniciar({ onCerrar }) {
  const { dispatch } = useStore();
  return (
    <Dialogo
      titulo="Reiniciar la demostración"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton tipo="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            onClick={() => {
              dispatch({ type: 'RESET' });
              onCerrar();
              ir('/inicio');
            }}
          >
            Sí, reiniciar
          </Boton>
        </>
      }
    >
      <p>Vuelve todo al punto de partida: Valera Alfa incorporada y Beta y Gama por subir. Lo que hayas hecho en esta demostración se borra.</p>
    </Dialogo>
  );
}

const TAMANOS = [['s', 'Pequeña', 12], ['m', 'Mediana', 17], ['l', 'Grande', 24]];

// Preferencias de lectura (como en la muestra): píldoras en la cabecera de cada pantalla, no en el banner de la demo.
function Preferencias() {
  const { s, dispatch } = useStore();
  const oculto = Boolean(s.ajustes.hide);
  const fs = s.ajustes.fs || 'm';
  return (
    <div className="prefs no-print" role="group" aria-label="Preferencias de lectura">
      <button type="button" className="pref" data-tip={oculto ? 'Mostrar montos' : 'Ocultar montos'} aria-pressed={oculto} aria-label={oculto ? 'Mostrar montos' : 'Ocultar montos'} onClick={() => dispatch({ type: 'SET_AJUSTE', clave: 'hide', valor: !oculto })}>
        <Icono nombre={oculto ? 'ojo_no' : 'ojo'} tam={20} />
      </button>
      <span className="fsz" role="group" aria-label="Tamaño de letra">
        {TAMANOS.map(([k, nombre, px]) => (
          <button key={k} type="button" className="pref fsb" data-tip={nombre} aria-label={`Letra ${nombre.toLowerCase()}`} aria-pressed={fs === k} onClick={() => dispatch({ type: 'SET_AJUSTE', clave: 'fs', valor: k })}>
            <b aria-hidden="true" style={{ fontSize: px }}>Aa</b>
          </button>
        ))}
      </span>
    </div>
  );
}

function Estructura({ grupoActivo, children }) {
  const { s, dispatch } = useStore();
  const [reiniciando, setReiniciando] = useState(false);
  const [opciones, setOpciones] = useState(() => {
    try { return localStorage.getItem('vg-banner') !== 'cerrado'; } catch { return true; }
  });
  const alternarOpciones = () => {
    setOpciones((v) => {
      try { localStorage.setItem('vg-banner', v ? 'cerrado' : 'abierto'); } catch { /* sin almacenamiento */ }
      return !v;
    });
  };
  const pendientes = s.quincena.estado === 'confirmada' ? vistaCobranza(s).filter((p) => p.pendiente > 0).length : 0;
  return (
    <>
      <div className="demo-banner no-print" role="note">
        <div className="demo-top">
          <span>
            <strong>Demostración</strong> con datos ficticios · lectura de archivos simulada<span className="solo-ancho"> · hoy es {fechaLarga(HOY)} (fecha de la demo)</span>
          </span>
          <button type="button" aria-expanded={opciones} onClick={alternarOpciones}>{opciones ? 'Ocultar opciones ▲' : 'Opciones de la demo ▼'}</button>
        </div>
        {opciones && (
          <div className="demo-opciones">
            {s.quincena.estado === 'confirmada' && (
              <button type="button" onClick={() => { dispatch({ type: 'SET_PRECIERRE', valor: true }); ir('/cobranza'); }}>Demo: día antes del cierre</button>
            )}
            <button type="button" onClick={() => setReiniciando(true)}>Reiniciar demo</button>
          </div>
        )}
      </div>
      <div className="app">
        <nav className="app-nav" aria-label="Principal">
          <div className="marca">
            <span className="logo">VG</span>
            <span>ValeGestión 360</span>
          </div>
          {NAV.map((n) => (
            <Enlace key={n.a} a={n.a} aria-current={grupoActivo === n.a ? 'page' : undefined}>
              <Icono nombre={n.icono} />
              {n.texto}
              {n.a === '/cobranza' && pendientes > 0 && <span className="nbadge" aria-label={`${pendientes} pendientes`}>{pendientes}</span>}
            </Enlace>
          ))}
        </nav>
        <main className="app-main">
          <Preferencias />
          {children}
        </main>
      </div>
      {reiniciando && <Reiniciar onCerrar={() => setReiniciando(false)} />}
    </>
  );
}

export default function App() {
  const { s } = useStore();
  const ruta = useRuta();
  const [r0 = '', r1] = ruta;

  if (!s.sesion) return <Acceso />;
  if (r0 === 'bienvenida') return <Bienvenida />;

  ocultarMontos(Boolean(s.ajustes.hide) && !['avisos', 'imprimir'].includes(r0));
  document.documentElement.dataset.fs = s.ajustes.fs || 'm';

  const grupo = NAV.find((n) => n.grupo.includes(r0))?.a ?? '/inicio';
  let pantalla;
  switch (r0) {
    case '':
    case 'inicio': pantalla = <Inicio />; break;
    case 'valeras': pantalla = <Valeras />; break;
    case 'subir': pantalla = <Subir />; break;
    case 'revision': pantalla = <RevisionImport relId={r1} />; break;
    case 'revisar': pantalla = <Revisar />; break;
    case 'clientes': pantalla = r1 ? <Ficha id={r1} /> : <Directorio />; break;
    case 'confirmar': pantalla = <Confirmar />; break;
    case 'cobranza': pantalla = <Cobranza seleccionado={r1} />; break;
    case 'cobrar': pantalla = <Cobranza key={r1} valeraInicial={r1} />; break;
    case 'pagos': pantalla = <Pagos />; break;
    case 'avisos': pantalla = <Avisos seleccionado={r1} />; break;
    case 'imprimir': pantalla = <Imprimir />; break;
    case 'historial': pantalla = <Historial id={r1} />; break;
    case 'mas': pantalla = <Mas />; break;
    case 'guia': pantalla = <Guia />; break;
    default: pantalla = <Inicio />;
  }
  return <Estructura grupoActivo={grupo}>{pantalla}</Estructura>;
}
