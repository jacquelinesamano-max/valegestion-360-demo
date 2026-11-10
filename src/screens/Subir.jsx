import { useState } from 'react';
import { Aviso, Boton, Etiqueta, Tarjeta } from '../components/ui.jsx';
import { ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { RELACIONES } from '../data/seed.js';
import { valerasCargadas } from '../lib/calc.js';

export default function Subir() {
  const { s } = useStore();
  const valeras = valerasCargadas(s);
  const primera = valeras.find((v) => !v.cargada) ?? valeras[0];
  const [valeraId, setValeraId] = useState(primera.id);
  const [relId, setRelId] = useState(null);
  const [leyendo, setLeyendo] = useState(false);

  const incorporada = (id) => s.importaciones.some((i) => i.relId === id && !i.reemplazada);
  const archivos = RELACIONES.filter((r) => r.valeraId === valeraId).filter((r) => !r.reemplazaA || incorporada(r.reemplazaA));
  const confirmada = s.quincena.estado !== 'preparacion';

  const leer = () => {
    setLeyendo(true);
    window.setTimeout(() => ir(`/revision/${relId}`), 900);
  };

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Subir relación de cobro</h1>
          <p>Elige la valera y el archivo que te entregó. Lo revisarás antes de que se incorpore.</p>
        </div>
      </div>

      <Aviso tono="demo" titulo="Demostración: la lectura está simulada">
        Elige uno de los archivos de ejemplo. Excel y PDF son los formatos que se quieren soportar; la foto es una posibilidad por validar y aquí no se lee.
      </Aviso>
      {confirmada && (
        <Aviso tono="alerta" titulo="La cobranza ya está confirmada">
          Para cambiar los importes de una cobranza confirmada hay que corregirla (ver «Corregir cobranza» en Cobranza). En la demo no se pueden subir más relaciones.
        </Aviso>
      )}

      <Tarjeta titulo="1. ¿De qué valera es?">
        <div className="opciones" role="radiogroup" aria-label="Valera">
          {valeras.map((v) => (
            <label key={v.id} className="opcion">
              <input type="radio" name="valera" checked={valeraId === v.id} onChange={() => { setValeraId(v.id); setRelId(null); }} />
              <span>
                <strong>{v.nombre}</strong> {v.cargada ? <Etiqueta tono="ok">Ya cargada</Etiqueta> : <Etiqueta tono="alerta">Por cargar</Etiqueta>}
              </span>
            </label>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="2. Elige un archivo de ejemplo">
        {archivos.length === 0 && <p className="suave">Esta valera no tiene archivos de ejemplo en la demostración.</p>}
        <div className="opciones" role="radiogroup" aria-label="Archivo">
          {archivos.map((r) => {
            const yaEsta = r.principal && incorporada(r.id);
            const bloqueado = r.foto || yaEsta || confirmada;
            return (
              <label key={r.id} className={`opcion ${bloqueado ? 'desactivada' : ''}`}>
                <input type="radio" name="archivo" disabled={bloqueado} checked={relId === r.id} onChange={() => setRelId(r.id)} />
                <span>
                  <strong>{r.archivo}</strong> <Etiqueta tono={r.foto ? 'alerta' : 'info'}>{r.formato}</Etiqueta>
                  <br />
                  <small className="suave">
                    {r.foto && 'Posibilidad por validar: en la demo las fotos no se leen.'}
                    {yaEsta && 'Ya la incorporaste en esta quincena.'}
                    {r.reemplazaA && !yaEsta && 'Misma valera y quincena que una relación que ya incorporaste: tendrás que decidir si la reemplaza.'}
                    {r.principal && !yaEsta && !r.reemplazaA && (r.fechaPagoArchivo ? 'Trae su fecha de pago.' : 'No trae fecha de pago: se usará el calendario de la valera.')}
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      </Tarjeta>

      <div className="acciones">
        <Boton grande disabled={!relId || leyendo} onClick={leer}>{leyendo ? 'Leyendo el archivo (simulado)…' : 'Leer relación'}</Boton>
        <Boton tipo="secundario" onClick={() => ir('/inicio')}>Cancelar</Boton>
      </div>
      <p className="solo-lectores" aria-live="polite">{leyendo ? 'Leyendo el archivo' : ''}</p>
    </div>
  );
}
