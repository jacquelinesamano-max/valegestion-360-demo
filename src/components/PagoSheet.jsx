import { useEffect, useRef, useState } from 'react';
import { Aviso, Boton, Campo, Dialogo, Icono, useAviso } from './ui.jsx';
import { useStore } from '../state/store.jsx';
import { HOY, fechaLarga } from '../lib/dates.js';
import { leerImporte, mx } from '../lib/money.js';

const comoTexto = (c) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));
const FORMAS = ['Efectivo', 'Transferencia', 'Otro'];

// Mensajes de WhatsApp: se abren ya redactados y la persona decide si los envía. Requiere tener WhatsApp instalado.
const enlaceWa = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

// Panel de cobro: se abre al costado (hoja inferior en teléfono) sin perder el lugar en la lista.
// El importe sugerido es lo que falta; no acepta más que el saldo y avisa si quedará como abono.
export function PagoSheet({ responsable, correccion, onCerrar }) {
  const { dispatch } = useStore();
  const avisar = useAviso();
  const disponible = responsable.pendiente + (correccion ? correccion.importe : 0);
  const [texto, setTexto] = useState(comoTexto(disponible));
  const [fecha, setFecha] = useState(correccion?.fecha ?? HOY);
  const [forma, setForma] = useState(correccion?.forma ?? 'Efectivo');
  const [nota, setNota] = useState(correccion?.nota ?? '');
  const [motivo, setMotivo] = useState('');
  const [reqId] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [enviado, setEnviado] = useState(false);
  const ref = useRef(null);
  const valor = leerImporte(texto);
  const error = valor == null || valor <= 0 ? 'Escribe un importe mayor a cero, por ejemplo 1,150.' : valor > disponible ? `No puede ser mayor a lo que falta: ${mx(disponible)}.` : '';
  const restante = valor != null && !error ? disponible - valor : null;

  useEffect(() => {
    ref.current?.focus();
    const alTeclear = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const guardar = () => {
    if (error || enviado) return;
    setEnviado(true); // evita que un doble toque registre el pago dos veces
    const falta = disponible - valor;
    const texto2 = falta === 0 ? `Registraste ${mx(valor)}. ${responsable.nombre} quedó pagado.` : `Registraste ${mx(valor)}. Todavía falta ${mx(falta)}.`;
    if (correccion) {
      dispatch({ type: 'CORREGIR_PAGO', reqId, pagoId: correccion.id, importe: valor, fecha, nota, forma, motivo });
      avisar(texto2);
    } else {
      dispatch({ type: 'REGISTRAR_PAGO', reqId, payerId: responsable.id, importe: valor, fecha, nota, forma });
      // Deshacer dura 7 s: quita el pago como si nunca se hubiera registrado.
      avisar(texto2, { accion: { texto: 'Deshacer', hacer: () => dispatch({ type: 'DESHACER_PAGO', reqId }) } });
    }
    onCerrar();
  };

  const msgRecordar = `Hola ${responsable.nombre.split(' ')[0]}, te recuerdo con cariño que esta quincena faltan ${mx(disponible)} de tu cobranza. ¡Gracias!`;
  const msgComprobante = `Hola ${responsable.nombre.split(' ')[0]}, recibí tu pago de ${valor != null && !error ? mx(valor) : mx(0)}. ${restante === 0 ? 'Quedaste al corriente.' : restante > 0 ? `Todavía faltan ${mx(restante)}.` : ''} ¡Gracias!`;

  return (
    <div className="drawer-fondo no-print" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={correccion ? `Corregir pago de ${responsable.nombre}` : `Registrar pago de ${responsable.nombre}`} tabIndex={-1} ref={ref}>
        <header className="modal-head">
          <div>
            <h2>{correccion ? 'Corregir pago' : 'Registrar pago'}</h2>
            <small className="suave">{responsable.nombre}</small>
          </div>
          <button type="button" className="btn btn-texto" onClick={onCerrar}>Cerrar</button>
        </header>
        <div className="modal-body">
          <Aviso tono="info">
            Total a cobrar {mx(responsable.total)} · registrado {mx(responsable.pagado - (correccion ? correccion.importe : 0))} · falta {mx(disponible)}. Este registro es un control interno tuyo: no envía dinero a nadie.
          </Aviso>
          <Campo etiqueta="Importe que te pagó" ayuda={`Te sugerimos lo que falta (${mx(disponible)}). Puedes cambiarlo si fue un abono.`} error={texto && error ? error : ''}>
            <input type="text" inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
          </Campo>
          <div className="atajos" role="group" aria-label="Atajos de importe">
            <button type="button" className="filtro" onClick={() => setTexto(comoTexto(disponible))}>Liquidar {mx(disponible)}</button>
            <button type="button" className="filtro" onClick={() => setTexto(comoTexto(Math.floor(disponible / 200) * 100 || disponible))}>Mitad</button>
          </div>
          {restante > 0 && <Aviso tono="alerta">Quedará como <b>abono</b>: todavía faltarían {mx(restante)}.</Aviso>}
          {restante === 0 && <Aviso tono="ok">Con este pago queda <b>liquidado</b>.</Aviso>}
          <Campo etiqueta="Fecha en que pagó" ayuda={fecha ? fechaLarga(fecha) : ''}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Campo>
          <div className="field">
            <span className="field-label">Forma de pago</span>
            <div className="atajos" role="group" aria-label="Forma de pago">
              {FORMAS.map((f) => <button key={f} type="button" className="filtro" aria-pressed={forma === f} onClick={() => setForma(f)}>{f}</button>)}
            </div>
          </div>
          <Campo etiqueta="Observación (opcional)">
            <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} />
          </Campo>
          {correccion && (
            <Campo etiqueta="¿Por qué lo corriges?" ayuda="El pago anterior no se borra: queda marcado como corregido.">
              <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </Campo>
          )}
          <details className="porque">
            <summary>¿Por qué esta cantidad?</summary>
            {responsable.propias.length > 0 && (
              <div className="linea"><span>Sus vales ({responsable.propias.length})</span><span className="num">{mx(responsable.propiosTotal)}</span></div>
            )}
            {responsable.recomendados.map((r) => (
              <div className="linea" key={r.id}><span>{r.nombre}</span><span className="num">{mx(r.total)}</span></div>
            ))}
            <div className="linea total"><span>Total a cobrar</span><span className="num">{mx(responsable.total)}</span></div>
          </details>
          {!correccion && (
            <div className="wabox">
              <strong>Avisar por WhatsApp</strong>
              <div className="atajos">
                <a className="btn btn-secundario" href={enlaceWa(msgRecordar)} target="_blank" rel="noopener noreferrer"><Icono nombre="wa" tam={16} /> Recordar por WhatsApp</a>
                <a className="btn btn-secundario" href={enlaceWa(msgComprobante)} target="_blank" rel="noopener noreferrer"><Icono nombre="wa" tam={16} /> Enviar comprobante</a>
              </div>
              <small className="suave">Requiere tener WhatsApp instalado. Se abre el mensaje ya escrito y tú decides si lo envías: la app nunca manda nada por su cuenta.</small>
            </div>
          )}
        </div>
        <footer className="modal-foot">
          <Boton tipo="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton disabled={Boolean(error) || enviado} onClick={guardar}>
            {correccion ? 'Guardar corrección' : error ? 'Registrar pago' : `Registrar ${mx(valor)}`}
          </Boton>
        </footer>
      </aside>
    </div>
  );
}

export function AnularPago({ pago, onCerrar }) {
  const { dispatch } = useStore();
  const avisar = useAviso();
  const [motivo, setMotivo] = useState('');
  return (
    <Dialogo
      titulo="Anular pago"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton tipo="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            tipo="peligro"
            disabled={!motivo.trim()}
            onClick={() => {
              dispatch({ type: 'ANULAR_PAGO', pagoId: pago.id, motivo });
              avisar('Anulaste el pago. Queda en el historial.');
              onCerrar();
            }}
          >
            Anular pago de {mx(pago.importe)}
          </Boton>
        </>
      }
    >
      <p>El pago no se borra: queda en el historial como anulado y el saldo vuelve a subir.</p>
      <Campo etiqueta="Motivo">
        <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
      </Campo>
    </Dialogo>
  );
}
