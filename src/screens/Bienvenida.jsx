import { Boton, Tarjeta } from '../components/ui.jsx';
import { ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';

const PASOS = [
  ['Tus valeras', 'Cada quincena subes la relación de cobro que te entrega cada valera. Ya dejamos tres valeras de ejemplo.'],
  ['Quién paga por quién', 'Algunos clientes pagan también por otras personas. Lo defines una vez y el sistema lo recuerda.'],
  ['Una sola cobranza', 'Sumamos todo por responsable de pago, preparas los avisos de cobro y, si quieres, anotas lo que te pagan.'],
];

export default function Bienvenida() {
  const { dispatch } = useStore();
  return (
    <div className="centrado">
      <div className="caja">
        <div>
          <h1>Bienvenida, mayorista de demostración</h1>
          <p className="suave">Así funciona en tres pasos. Puedes volver a esta guía desde «Más».</p>
        </div>
        <div className="lista">
          {PASOS.map(([t, d], i) => (
            <Tarjeta key={t}>
              <h2>{i + 1}. {t}</h2>
              <p>{d}</p>
            </Tarjeta>
          ))}
        </div>
        <Boton
          grande
          onClick={() => {
            dispatch({ type: 'FIN_ONBOARDING' });
            ir('/inicio');
          }}
        >
          Ir a mi quincena
        </Boton>
      </div>
    </div>
  );
}
