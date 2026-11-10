import { useState } from 'react';
import { Boton, Campo, Etiqueta, Tarjeta } from '../components/ui.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { valerasCargadas } from '../lib/calc.js';
import { fechaLarga } from '../lib/dates.js';

export default function Valeras() {
  const { s, dispatch } = useStore();
  const [nombre, setNombre] = useState('');
  const valeras = valerasCargadas(s);
  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Mis valeras</h1>
          <p>Las empresas cuyos vales repartes. Cada una entrega su propia relación de cobro.</p>
        </div>
        <Enlace a="/subir" className="btn btn-primario">Subir una relación</Enlace>
      </div>

      <div className="lista">
        {valeras.map((v) => {
          const imp = s.importaciones.find((i) => i.valeraId === v.id && !i.reemplazada);
          return (
            <Tarjeta key={v.id}>
              <div className="card-head">
                <div>
                  <h2>{v.nombre}</h2>
                  <p className="suave">Formato habitual: {v.formato}</p>
                </div>
                {v.cargada ? <Etiqueta tono="ok">Cargada esta quincena</Etiqueta> : <Etiqueta tono="alerta">Por cargar</Etiqueta>}
              </div>
              {imp && (
                <p>
                  Archivo: <strong>{imp.archivo}</strong> · fecha de corte {fechaLarga(imp.corte)} · fecha límite de pago {fechaLarga(imp.fechaPago)}
                  {imp.fechaOrigen === 'calendario' && ' (tomada del calendario de esta valera porque el archivo no la trae)'}
                </p>
              )}
              <Campo
                etiqueta="Calendario de respaldo: días del corte al pago"
                ayuda="Solo se usa si el archivo no trae fecha de pago. Si la trae, siempre se respeta la del archivo."
              >
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={v.diasPago}
                  onChange={(e) => dispatch({ type: 'SET_DIAS_PAGO', valeraId: v.id, dias: Number(e.target.value) || 1 })}
                />
              </Campo>
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta titulo="Agregar otra valera">
        <Campo etiqueta="Nombre de la valera">
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Por ejemplo: Valera Delta" />
        </Campo>
        <Boton
          disabled={!nombre.trim()}
          onClick={() => {
            dispatch({ type: 'AGREGAR_VALERA', nombre });
            setNombre('');
          }}
        >
          Agregar valera
        </Boton>
        <p className="hint">En la demostración, una valera nueva queda «por cargar» y no tiene archivo de ejemplo.</p>
      </Tarjeta>
    </div>
  );
}
