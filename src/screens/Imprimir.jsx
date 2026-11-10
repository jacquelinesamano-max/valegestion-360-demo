import { useEffect, useState } from 'react';
import { Aviso, Boton, Icono } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { vistaCobranza } from '../lib/calc.js';
import { fechaLarga, HOY } from '../lib/dates.js';
import { mx, suma } from '../lib/money.js';

const POR_HOJA = 16;
const trozos = (lista, n) => Array.from({ length: Math.ceil(lista.length / n) }, (_, i) => lista.slice(i * n, (i + 1) * n));

// Relación general para imprimir en papel (tamaño carta, blanco y negro) y capturar los pagos después.
// Se reparte por hojas: en pantalla se ven las primeras y, al imprimir, salen todas.
export default function Imprimir() {
  const { s } = useStore();
  const [verTodas, setVerTodas] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const filas = vistaCobranza(s);
  const total = suma(filas.map((p) => p.total));
  const enPrep = s.quincena.estado === 'preparacion';
  const hojas = trozos(filas, POR_HOJA);
  const visibles = verTodas || imprimiendo ? hojas : hojas.slice(0, 2);

  useEffect(() => {
    const fin = () => setImprimiendo(false);
    window.addEventListener('afterprint', fin);
    return () => window.removeEventListener('afterprint', fin);
  }, []);

  const imprimir = () => {
    setImprimiendo(true);
    window.setTimeout(() => window.print(), 150);
  };

  return (
    <div className="pagina">
      <div className="pagina-head no-print">
        <div>
          <Enlace a="/cobranza">← Relación general</Enlace>
          <h1>Relación para imprimir</h1>
          <p>Para trabajar en papel: anotas lo que te pagan y después, si quieres, lo capturas. {hojas.length} {hojas.length === 1 ? 'hoja' : 'hojas'} en total.</p>
        </div>
        <Boton onClick={imprimir}><Icono nombre="imprimir" tam={18} /> Imprimir {hojas.length > 1 ? `las ${hojas.length} hojas` : ''}</Boton>
      </div>
      {enPrep && (
        <div className="no-print">
          <Aviso tono="alerta" titulo="Es una vista previa">La cobranza todavía no está confirmada; los totales pueden cambiar.</Aviso>
        </div>
      )}

      {visibles.map((hoja, i) => {
        const ultima = i === hojas.length - 1;
        return (
          <div className="hoja hoja-corta" key={i}>
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
                {hoja.map((p) => (
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
              {ultima && (
                <tfoot>
                  <tr>
                    <th>Total general ({filas.length} responsables)</th>
                    <th className="num">{mx(total)}</th>
                    <th colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
            <div className="hoja-pie">
              <span>Documento de trabajo con datos de demostración. No es un comprobante de pago.</span>
              <span>Hoja {i + 1} de {hojas.length}</span>
            </div>
          </div>
        );
      })}

      {!verTodas && !imprimiendo && hojas.length > 2 && (
        <div className="acciones no-print" style={{ justifyContent: 'center' }}>
          <span className="suave">Mostrando 2 de {hojas.length} hojas</span>
          <Boton tipo="secundario" onClick={() => setVerTodas(true)}>Mostrar todas las hojas</Boton>
        </div>
      )}
    </div>
  );
}
