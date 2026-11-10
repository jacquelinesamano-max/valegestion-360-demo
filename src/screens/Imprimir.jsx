import { Aviso, Boton, Icono } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { vistaCobranza } from '../lib/calc.js';
import { fechaLarga, HOY } from '../lib/dates.js';
import { mx, suma } from '../lib/money.js';

// Relación general para imprimir en papel (tamaño carta, blanco y negro) y capturar los pagos después.
export default function Imprimir() {
  const { s } = useStore();
  const filas = vistaCobranza(s);
  const total = suma(filas.map((p) => p.total));
  const enPrep = s.quincena.estado === 'preparacion';

  return (
    <div className="pagina">
      <div className="pagina-head no-print">
        <div>
          <Enlace a="/cobranza">← Relación general</Enlace>
          <h1>Relación para imprimir</h1>
          <p>Para trabajar en papel: anotas lo que te pagan y después, si quieres, lo capturas.</p>
        </div>
        <Boton onClick={() => window.print()}><Icono nombre="imprimir" tam={18} /> Imprimir</Boton>
      </div>
      {enPrep && (
        <div className="no-print">
          <Aviso tono="alerta" titulo="Es una vista previa">La cobranza todavía no está confirmada; los totales pueden cambiar.</Aviso>
        </div>
      )}

      <div className="hoja">
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <h1>Relación de cobranza</h1>
            <div>{s.quincena.label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Distribuidora de demostración</div>
            <div>Generada el {fechaLarga(HOY)}</div>
          </div>
        </header>
        <table className="imprimible">
          <thead>
            <tr>
              <th>Responsable de pago</th>
              <th className="num">Total a cobrar</th>
              <th>Pago recibido</th>
              <th>Fecha</th>
              <th>✓</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong>{p.nRecomendados ? <div style={{ fontSize: '0.85em' }}>incluye {p.nRecomendados} a su cargo</div> : null}</td>
                <td className="num">{mx(p.total)}</td>
                <td className="espacio" style={{ width: '16%' }} />
                <td style={{ width: '12%' }} />
                <td style={{ width: 44, textAlign: 'center' }}><span className="casilla" /></td>
                <td style={{ width: '20%' }} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total general</th>
              <th className="num">{mx(total)}</th>
              <th colSpan={4} />
            </tr>
          </tfoot>
        </table>
        <p style={{ fontSize: '0.85rem', marginTop: 12 }}>Documento de trabajo con datos de demostración. No es un comprobante de pago.</p>
      </div>
    </div>
  );
}
