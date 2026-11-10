import { Aviso, Tarjeta } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';

export default function Mas() {
  const { s, dispatch } = useStore();
  return (
    <div className="pagina">
      <div className="pagina-head">
        <h1>Más</h1>
      </div>

      <Tarjeta titulo="Avisos y recordatorios">
        <label className="interruptor">
          <span>
            <strong>Recordarme los pagos que faltan por registrar</strong>
            <br /><small className="suave">Apagado por defecto. Si llevas tu cobranza en papel, no te pediremos nada: las cifras de «cobrado» siempre dependen de lo que registres.</small>
          </span>
          <input type="checkbox" checked={s.ajustes.notif} onChange={(e) => dispatch({ type: 'SET_AJUSTE', clave: 'notif', valor: e.target.checked })} />
        </label>
        <label className="interruptor">
          <span>
            <strong>Mostrar la valera en el detalle de los avisos</strong>
            <br /><small className="suave">Cada línea del aviso indica de qué valera es el vale.</small>
          </span>
          <input type="checkbox" checked={s.ajustes.mostrarValera} onChange={(e) => dispatch({ type: 'SET_AJUSTE', clave: 'mostrarValera', valor: e.target.checked })} />
        </label>
      </Tarjeta>

      <Tarjeta titulo="Ir a">
        <div className="lista">
          <Enlace a="/valeras" className="fila" style={{ textDecoration: 'none', color: 'inherit' }}><strong>Mis valeras</strong><span className="suave">Calendario de respaldo y relaciones</span></Enlace>
          <Enlace a="/pagos" className="fila" style={{ textDecoration: 'none', color: 'inherit' }}><strong>Historial de pagos</strong><span className="suave">Pagos, abonos y correcciones</span></Enlace>
          <Enlace a="/historial" className="fila" style={{ textDecoration: 'none', color: 'inherit' }}><strong>Historial de quincenas</strong><span className="suave">Quincenas anteriores</span></Enlace>
          <Enlace a="/guia" className="fila" style={{ textDecoration: 'none', color: 'inherit' }}><strong>Guía de la demostración</strong><span className="suave">Guion, escenarios y puntos por validar</span></Enlace>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Cuentas auxiliares">
        <Aviso tono="info">Personas que trabajan tu información a tu nombre. Sus permisos todavía están por definir, por eso no forman parte de esta demostración.</Aviso>
      </Tarjeta>

      <Tarjeta titulo="Acerca de esta demostración">
        <p>ValeGestión 360 es un prototipo con datos ficticios para conversar con mayoristas. El nombre y la imagen son provisionales. Lo que hagas aquí se guarda solo en este navegador.</p>
      </Tarjeta>
    </div>
  );
}
