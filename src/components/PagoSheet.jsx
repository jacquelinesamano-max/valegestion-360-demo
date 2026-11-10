import { useState } from 'react';
import { Aviso, Boton, Campo, Dialogo, useAviso } from './ui.jsx';
import { useStore } from '../state/store.jsx';
import { HOY, fechaLarga } from '../lib/dates.js';
import { leerImporte, mx } from '../lib/money.js';

const comoTexto = (c) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));

// Registrar un pago (o corregir uno). El importe sugerido es lo que falta; no acepta más que el saldo.
export function PagoSheet({ responsable, correccion, onCerrar }) {
  const { dispatch } = useStore();
  const avisar = useAviso();
  const disponible = responsable.pendiente + (correccion ? correccion.importe : 0);
  const [texto, setTexto] = useState(comoTexto(disponible));
  const [fecha, setFecha] = useState(correccion?.fecha ?? HOY);
  const [nota, setNota] = useState(correccion?.nota ?? '');
  const [motivo, setMotivo] = useState('');
  const [reqId] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [enviado, setEnviado] = useState(false);
  const valor = leerImporte(texto);
  const error = valor == null || valor <= 0 ? 'Escribe un importe mayor a cero, por ejemplo 1,150.' : valor > disponible ? `No puede ser mayor a lo que falta: ${mx(disponible)}.` : '';

  const guardar = () => {
    if (error || enviado) return;
    setEnviado(true); // evita que un doble toque registre el pago dos veces
    if (correccion) dispatch({ type: 'CORREGIR_PAGO', reqId, pagoId: correccion.id, importe: valor, fecha, nota, motivo });
    else dispatch({ type: 'REGISTRAR_PAGO', reqId, payerId: responsable.id, importe: valor, fecha, nota });
    const falta = disponible - valor;
    avisar(falta === 0 ? `Registraste ${mx(valor)}. ${responsable.nombre} quedó pagado.` : `Registraste ${mx(valor)}. Todavía falta ${mx(falta)}.`);
    onCerrar();
  };

  return (
    <Dialogo
      titulo={correccion ? `Corregir pago de ${responsable.nombre}` : `Registrar pago de ${responsable.nombre}`}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton tipo="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton disabled={Boolean(error) || enviado} onClick={guardar}>{correccion ? 'Guardar corrección' : 'Guardar pago'}</Boton>
        </>
      }
    >
      <Aviso tono="info">
        Total a cobrar {mx(responsable.total)} · registrado {mx(responsable.pagado - (correccion ? correccion.importe : 0))} · falta {mx(disponible)}. Este registro es un control interno tuyo: no envía dinero a nadie.
      </Aviso>
      <Campo etiqueta="Importe que te pagó" ayuda={`Te sugerimos lo que falta (${mx(disponible)}). Puedes cambiarlo si fue un abono.`} error={texto && error ? error : ''}>
        <input type="text" inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
      </Campo>
      <Campo etiqueta="Fecha en que pagó" ayuda={fecha ? fechaLarga(fecha) : ''}>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
      <Campo etiqueta="Observación (opcional)">
        <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} />
      </Campo>
      {correccion && (
        <Campo etiqueta="¿Por qué lo corriges?" ayuda="El pago anterior no se borra: queda marcado como corregido.">
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
      )}
    </Dialogo>
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
