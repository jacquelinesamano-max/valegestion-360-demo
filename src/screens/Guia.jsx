import { Aviso, Boton, Tarjeta, useAviso } from '../components/ui.jsx';
import { Enlace, ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';

const GUION = [
  ['Inicio', 'Muestra la quincena activa, qué valeras ya subieron y qué falta. «Alfa ya está; faltan Beta y Gama».'],
  ['Subir Valera Beta', 'Elige el PDF de ejemplo. En la revisión: hay un importe que no se pudo leer y la suma no cuadra con el total hasta que lo completas. El préstamo personal queda fuera de lo que cobras a clientes.'],
  ['Revisar clientes', 'Confirma de golpe las coincidencias seguras. Revisa «María G. López» (probable) y a «Sofía Valdés», cliente nueva que paga directamente.'],
  ['Subir Valera Gama', 'No trae fecha de pago: se usa el calendario de la valera. Hay un movimiento repetido y dos personas llamadas Juan Carlos Pérez: el sistema no elige por ti. Gloria Mejía pasa a cargo de Carmen González.'],
  ['Confirmar y ver la relación general', 'Rosa Martínez: $650 propios + $500 de sus recomendados = $1,150. Teresa Nava no tiene vales propios y aun así se le cobra lo de su recomendado.'],
  ['Avisos de cobro e impresión', 'Abre el aviso de Rosa, prueba el interruptor de la valera e imprime. Después imprime la relación general para trabajar en papel.'],
  ['Registrar un pago', 'Pago completo, abono, y corrige uno equivocado: el original queda anulado en el historial.'],
];

const ESCENARIOS = [
  ['Cliente con vales en varias valeras', 'Rosa Martínez y Laura Hernández (Alfa y Beta)', 'Cobranza → detalle'],
  ['Variación de nombre que requiere confirmación', '«María G. López» de Beta', 'Revisar clientes'],
  ['Dos personas distintas con el mismo nombre', 'Los dos «Juan Carlos Pérez» (Gama)', 'Revisar clientes'],
  ['Cliente nuevo que paga directamente', 'Sofía Valdés (Beta)', 'Revisar clientes'],
  ['Cliente nuevo asignado como recomendado', 'Gloria Mejía, a cargo de Carmen González (Gama)', 'Revisar clientes'],
  ['Responsable con pagos propios y recomendados', 'Rosa Martínez: $650 + $500 = $1,150', 'Cobranza → detalle'],
  ['Responsable sin pagos propios', 'Teresa Nava: $465 de Alberto Cruz', 'Cobranza → detalle'],
  ['Cliente con varios movimientos en una valera', 'Laura Hernández con dos vales en Alfa', 'Cobranza → detalle'],
  ['Archivo posiblemente duplicado', 'Beta reenviada (después de incorporar Beta) y vale repetido de Pedro Ruiz en Gama', 'Subir relación'],
  ['Fila con importe faltante', 'Héctor Barrera en Beta', 'Revisión de la importación'],
  ['Relación pendiente de cargar', 'Beta y Gama al empezar', 'Inicio'],
  ['Relación sin fecha de pago', 'Gama usa el calendario de la valera', 'Revisión de la importación'],
  ['Concepto propio de la mayorista', 'Préstamo personal de Beta: no se cobra a clientes', 'Revisión de la importación'],
  ['Pago completo, abono y corrección', 'Rosa, Laura y Héctor (con el atajo de abajo)', 'Cobranza → detalle'],
  ['Quincena anterior', 'Dos quincenas cerradas', 'Historial'],
];

const SUPUESTOS = [
  'Hoy es 17 de noviembre de 2026 (fecha fija de la demostración).',
  'La fecha de pago que trae el archivo manda; el calendario de la valera solo se usa si el archivo no la trae.',
  'La quincena de cobranza se asigna por la fecha límite de pago, no por la fecha de corte.',
  'El aviso de cobro desglosa por persona; mostrar la valera en cada línea es opcional (interruptor).',
  '«Aviso de cobro» es un nombre propuesto. Es informativo: no es factura ni comprobante de pago.',
  'El préstamo personal es de la mayorista y no se cobra a clientes. Falta confirmar si la renovación de crédito también lo es.',
  'Las coincidencias de nombre se sugieren por niveles (segura, probable, dudosa) y siempre las confirma una persona; confirmar en bloque las seguras es una propuesta.',
  'Registrar pagos es opcional. Los recordatorios están apagados por defecto y «cobrado» significa «según lo registrado».',
  'Un abono no se reparte entre valeras ni entre recomendados.',
  'Las personas se reconocen por el número de vale (una vez conocido) y por el nombre. No hay CURP ni folio de cliente.',
  'No incluye cuentas auxiliares, descuento por pronto pago ni puntaje de riesgo.',
];

const SIMULADO = [
  'La lectura de archivos: Excel y PDF son ejemplos fijos; la foto es solo una posibilidad por validar.',
  'La descarga de PDF de los avisos (fase posterior).',
  'Corregir una cobranza confirmada: está diseñado pero no funciona.',
  'Los recordatorios de pago: solo se muestra un aviso en pantalla.',
];

const VALIDAR = [
  '¿La mayorista entiende por dónde empezar y reconoce qué valeras ya subió?',
  '¿Entiende qué es un responsable de pago y qué es un recomendado?',
  '¿Sabe resolver una coincidencia de nombre sin ayuda? ¿Prefiere confirmar en bloque?',
  '¿El aviso de cobro le sirve así? ¿Quiere ver la valera en cada línea?',
  '¿Llevaría el registro de pagos en el sistema o prefiere el papel? ¿Quiere recordatorios?',
  '¿Qué espera ver cuando una persona no pagó la quincena anterior?',
  '¿Imprime desde el iPad o desde otra computadora? ¿Necesita el PDF antes de lo previsto?',
  '¿Le interesaría ver el descuento por pronto pago de cada valera?',
  'Con documentos reales: ¿se leen bien los PDF de todas las valeras? ¿Aparece algún dato que identifique a la persona?',
];

export default function Guia() {
  const { dispatch } = useStore();
  const avisar = useAviso();
  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Guía de la demostración</h1>
          <p>Para presentar el producto a mayoristas en unos 10 minutos.</p>
        </div>
      </div>

      <Tarjeta titulo="Atajos">
        <div className="acciones">
          <Boton tipo="secundario" onClick={() => { dispatch({ type: 'RESET' }); avisar('Demostración reiniciada.'); ir('/inicio'); }}>Reiniciar desde el principio</Boton>
          <Boton onClick={() => { dispatch({ type: 'ATAJO_COBRANZA_LISTA' }); avisar('Listo: cobranza confirmada con pagos de ejemplo.'); ir('/cobranza'); }}>Ir a una cobranza ya confirmada, con pagos</Boton>
        </div>
        <p className="hint">El segundo atajo reemplaza lo que lleves hecho: recorre el flujo con las decisiones esperadas.</p>
      </Tarjeta>

      <Tarjeta titulo="Guion breve">
        <ol style={{ paddingLeft: 22, margin: 0, display: 'grid', gap: 10 }}>
          {GUION.map(([t, d]) => (<li key={t}><strong>{t}.</strong> {d}</li>))}
        </ol>
      </Tarjeta>

      <Tarjeta titulo="Escenarios que se pueden demostrar">
        <table className="tabla">
          <thead><tr><th>Escenario</th><th>Con qué datos</th><th>Dónde verlo</th></tr></thead>
          <tbody>
            {ESCENARIOS.map(([a, b, c]) => (<tr key={a}><td data-label="Escenario"><strong>{a}</strong></td><td data-label="Datos">{b}</td><td data-label="Dónde">{c}</td></tr>))}
          </tbody>
        </table>
      </Tarjeta>

      <div className="grid-2">
        <Tarjeta titulo="Supuestos de esta demostración">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>{SUPUESTOS.map((x) => <li key={x}>{x}</li>)}</ul>
        </Tarjeta>
        <div className="pagina">
          <Tarjeta titulo="Qué está simulado">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>{SIMULADO.map((x) => <li key={x}>{x}</li>)}</ul>
          </Tarjeta>
          <Aviso tono="alerta" titulo="Antes de desarrollar de verdad">
            Falta probar la lectura de PDF con documentos reales de varias valeras de una misma mayorista, y definir los permisos de las cuentas auxiliares.
          </Aviso>
        </div>
      </div>

      <Tarjeta titulo="Puntos a validar con mayoristas">
        <ol style={{ paddingLeft: 22, margin: 0, display: 'grid', gap: 8 }}>{VALIDAR.map((x) => <li key={x}>{x}</li>)}</ol>
      </Tarjeta>

      <Enlace a="/inicio" className="btn btn-secundario" style={{ justifySelf: 'start' }}>Volver al inicio</Enlace>
    </div>
  );
}
