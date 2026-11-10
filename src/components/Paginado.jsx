import { useEffect, useState } from 'react';
import { Boton } from './ui.jsx';

// «Mostrar más» en lugar de pantallas larguísimas. Vuelve al principio cuando cambia la búsqueda, el filtro o el orden.
export function usePaginado(lista, tam = 25, clave = '') {
  const [visibles, setVisibles] = useState(tam);
  useEffect(() => setVisibles(tam), [clave, tam]);
  return {
    items: lista.slice(0, visibles),
    total: lista.length,
    hayMas: lista.length > visibles,
    restantes: Math.max(0, lista.length - visibles),
    mostrarMas: () => setVisibles((v) => v + tam),
    mostrarTodo: () => setVisibles(lista.length),
  };
}

export function MostrarMas({ pag, etiqueta = 'resultados' }) {
  if (pag.total === 0) return null;
  return (
    <div className="acciones" style={{ justifyContent: 'center' }}>
      <span className="suave" aria-live="polite">Mostrando {Math.min(pag.items.length, pag.total)} de {pag.total} {etiqueta}</span>
      {pag.hayMas && (
        <>
          <Boton tipo="secundario" onClick={pag.mostrarMas}>Mostrar más ({Math.min(pag.restantes, 25)})</Boton>
          {pag.restantes > 25 && <Boton tipo="texto" onClick={pag.mostrarTodo}>Mostrar todos</Boton>}
        </>
      )}
    </div>
  );
}

export function Orden({ valor, onCambio, opciones }) {
  return (
    <label className="orden">
      <span className="suave">Ordenar por</span>
      <select value={valor} onChange={(e) => onCambio(e.target.value)} aria-label="Ordenar la lista">
        {opciones.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
    </label>
  );
}
