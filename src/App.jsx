import { useState } from 'react';
import { Boton, Dialogo, Icono } from './components/ui.jsx';
import { Enlace, ir, useRuta } from './router.jsx';
import { useStore } from './state/store.jsx';
import { fechaLarga, HOY } from './lib/dates.js';
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
  { a: '/cobranza', icono: 'cobranza', texto: 'Cobranza', grupo: ['cobranza', 'pagos', 'avisos', 'imprimir'] },
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

function Estructura({ grupoActivo, children }) {
  const [reiniciando, setReiniciando] = useState(false);
  return (
    <>
      <div className="demo-banner no-print" role="note">
        <span>
          <strong>Demostración</strong> con datos ficticios · lectura de archivos simulada<span className="solo-ancho"> · hoy es {fechaLarga(HOY)} (fecha de la demo)</span>
        </span>
        <button type="button" onClick={() => setReiniciando(true)}>Reiniciar demo</button>
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
            </Enlace>
          ))}
        </nav>
        <main className="app-main">{children}</main>
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
