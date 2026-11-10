import { useState } from 'react';
import { Avatar, Boton, Campo, Dialogo, Etiqueta, Icono, Vacio, useAviso } from '../components/ui.jsx';
import { MostrarMas, Orden, usePaginado } from '../components/Paginado.jsx';
import { Enlace } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { listaClientes, nombreVisible, porNombre, recomendadosDe } from '../lib/calc.js';
import { normalizar } from '../lib/names.js';

function NuevoCliente({ onCerrar }) {
  const { s, dispatch } = useStore();
  const avisar = useAviso();
  const [nombre, setNombre] = useState('');
  const [resp, setResp] = useState('');
  const directos = listaClientes(s).filter((c) => !c.responsableId);
  return (
    <Dialogo
      titulo="Nuevo cliente"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton tipo="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            disabled={!nombre.trim()}
            onClick={() => {
              dispatch({ type: 'AGREGAR_CLIENTE_MANUAL', nombre, responsableId: resp || null });
              avisar(`Agregaste a ${nombre.trim()}.`);
              onCerrar();
            }}
          >
            Guardar cliente
          </Boton>
        </>
      }
    >
      <Campo etiqueta="Nombre completo">
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      </Campo>
      <Campo etiqueta="¿Quién paga por esta persona?" ayuda="Si ella misma paga, deja «Paga directamente».">
        <select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Paga directamente</option>
          {directos.map((c) => <option key={c.id} value={c.id}>{nombreVisible(s, c.id)}</option>)}
        </select>
      </Campo>
    </Dialogo>
  );
}

export default function Directorio() {
  const { s } = useStore();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [nuevo, setNuevo] = useState(false);
  const [orden, setOrden] = useState('nombre');
  const todos = listaClientes(s).sort(porNombre);
  const lista = todos
    .filter((c) => normalizar(c.nombre).includes(normalizar(q)))
    .filter((c) => (filtro === 'directos' ? !c.responsableId : filtro === 'recomendados' ? c.responsableId : filtro === 'conRecomendados' ? recomendadosDe(s, c.id).length > 0 : true))
    .sort((a, b) => (orden === 'cargo' ? recomendadosDe(s, b.id).length - recomendadosDe(s, a.id).length || porNombre(a, b) : porNombre(a, b)));
  const pag = usePaginado(lista, 25, `${q}|${filtro}|${orden}`);
  const directos = todos.filter((c) => !c.responsableId).length;

  return (
    <div className="pagina">
      <div className="pagina-head">
        <div>
          <h1>Mis clientes</h1>
          <p>{todos.length} personas: {directos} pagan directamente y {todos.length - directos} están a cargo de otra persona.</p>
        </div>
        <Boton onClick={() => setNuevo(true)}><Icono nombre="mas_" tam={18} /> Nuevo cliente</Boton>
      </div>
      <div className="acciones">
        <div className="buscador">
          <Icono nombre="buscar" tam={20} />
          <input type="search" aria-label="Buscar cliente por nombre" placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Orden valor={orden} onCambio={setOrden} opciones={[['nombre', 'Nombre (A–Z)'], ['cargo', 'Más personas a su cargo']]} />
      </div>
      <div className="filtros" role="group" aria-label="Filtrar clientes">
        {[['todos', 'Todos'], ['directos', 'Pagan directamente'], ['recomendados', 'Recomendados'], ['conRecomendados', 'Con personas a su cargo']].map(([k, t]) => (
          <button key={k} type="button" className="filtro" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{t}</button>
        ))}
      </div>
      {lista.length === 0 && <Vacio titulo="Nadie coincide">Prueba con otro nombre o quita el filtro.</Vacio>}
      <div className="lista">
        {pag.items.map((c) => {
          const n = recomendadosDe(s, c.id).length;
          return (
            <Enlace key={c.id} a={`/clientes/${c.id}`} className="fila" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Avatar nombre={c.nombre} />
              <div className="fila-main">
                <strong>{nombreVisible(s, c.id)}</strong>
                <small>{c.responsableId ? `Lo paga ${s.clientes[c.responsableId].nombre}` : n ? `Paga directamente · ${n} ${n === 1 ? 'persona' : 'personas'} a su cargo` : 'Paga directamente'}</small>
              </div>
              {c.responsableId ? <Etiqueta tono="info">Recomendado</Etiqueta> : <Etiqueta tono="primario">Responsable de pago</Etiqueta>}
            </Enlace>
          );
        })}
      </div>
      <MostrarMas pag={pag} etiqueta="clientes" />
      {nuevo && <NuevoCliente onCerrar={() => setNuevo(false)} />}
    </div>
  );
}
