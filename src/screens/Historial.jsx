import { Aviso, Cifra, Etiqueta } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { totales } from '../lib/calc.js';
import { HISTORIAL } from '../data/seed.js';
import { mx, suma } from '../lib/money.js';
import { TONO_ESTADO } from '../components/Detalle.jsx';

const ESTADOS = { preparacion: ['Cobranza en preparación', 'alerta'], confirmada: ['Cobranza confirmada', 'primario'], cerrada: ['Quincena cerrada', 'neutro'] };

function resumen(q) {
  const total = suma(q.pagadores.map((p) => p.total));
  const cobrado = suma(q.pagadores.map((p) => p.pagado));
  return { total, cobrado, pendiente: total - cobrado };
}

export default function Historial({ id }) {
  const { s } = useStore();
  const pasada = HISTORIAL.find((q) => q.id === id);

  if (pasada) {
    const r = resumen(pasada);
    return (
      <div className="pagina">
        <div className="pagina-head">
          <div>
            <Enlace a="/historial">← Historial de quincenas</Enlace>
            <h1>{pasada.label}</h1>
            <p>Quincena cerrada: solo consulta.</p>
          </div>
          <Etiqueta tono="neutro">Quincena cerrada</Etiqueta>
        </div>
        <div className="stats">
          <Cifra etiqueta="Total cobrado a responsables" valor={mx(r.total)} />
          <Cifra etiqueta="Cobrado" valor={mx(r.cobrado)} tono="ok" />
          <Cifra etiqueta="Quedó pendiente" valor={mx(r.pendiente)} tono={r.pendiente ? 'alerta' : undefined} />
        </div>
        <table className="tabla">
          <thead><tr><th>Responsable de pago</th><th className="num">Total</th><th className="num">Pagado</th><th>Estado</th></tr></thead>
          <tbody>
            {pasada.pagadores.map((p) => {
              const estado = p.pagado >= p.total ? 'Pagado' : p.pagado > 0 ? 'Abono' : 'Pendiente';
              return (
                <tr key={p.nombre}>
                  <td data-label="Responsable"><strong>{p.nombre}</strong>{p.recomendados ? <small className="suave"> · {p.recomendados} a su cargo</small> : null}</td>
                  <td data-label="Total" className="num">{mx(p.total)}</td>
                  <td data-label="Pagado" className="num">{mx(p.pagado)}</td>
                  <td data-label="Estado"><Etiqueta tono={TONO_ESTADO[estado]}>{estado}</Etiqueta></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Aviso tono="info">Los avisos de esa quincena conservan su composición original: cambiar después un nombre o un responsable no los modifica.</Aviso>
      </div>
    );
  }

  const t = totales(s);
  const [textoActual, tonoActual] = ESTADOS[s.quincena.estado];
  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Historial de quincenas</h1>
          <p>Consulta lo que pasó en quincenas anteriores. Una cobranza pasa de «en preparación» a «confirmada» y, al final, a «cerrada».</p>
        </div>
      </div>
      <div className="lista">
        <Enlace a="/cobranza" className="fila" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="fila-main">
            <strong>{s.quincena.label}</strong>
            <small>Quincena activa · {mx(t.total)} a cobrar · {mx(t.cobrado)} registrados</small>
          </div>
          <Etiqueta tono={tonoActual}>{textoActual}</Etiqueta>
        </Enlace>
        {HISTORIAL.map((q) => {
          const r = resumen(q);
          return (
            <Enlace key={q.id} a={`/historial/${q.id}`} className="fila" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="fila-main">
                <strong>{q.label}</strong>
                <small>{mx(r.total)} a cobrar · {mx(r.cobrado)} cobrados{r.pendiente ? ` · quedaron ${mx(r.pendiente)} pendientes` : ''}</small>
              </div>
              <Etiqueta tono="neutro">Quincena cerrada</Etiqueta>
            </Enlace>
          );
        })}
      </div>
    </div>
  );
}
