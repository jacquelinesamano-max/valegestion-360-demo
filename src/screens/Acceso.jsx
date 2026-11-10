import { Aviso, Boton } from '../components/ui.jsx';
import { ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';

export default function Acceso() {
  const { s, dispatch } = useStore();
  return (
    <div className="centrado">
      <div className="caja">
        <span className="logo" aria-hidden="true">VG</span>
        <div>
          <h1>ValeGestión 360</h1>
          <p className="suave">Tu cobranza de la quincena, en un solo lugar.</p>
        </div>
        <Aviso tono="demo" titulo="Esto es una demostración">
          Los clientes, vales e importes son inventados. Subir un archivo solo simula la lectura: todavía no se ha probado con documentos reales de varias valeras.
        </Aviso>
        <Boton
          grande
          onClick={() => {
            dispatch({ type: 'LOGIN' });
            ir(s.onboarding ? '/bienvenida' : '/inicio');
          }}
        >
          Entrar a la demostración
        </Boton>
        <p className="hint">Nombre e imagen provisionales: no corresponden a la identidad oficial de ninguna empresa.</p>
      </div>
    </div>
  );
}
