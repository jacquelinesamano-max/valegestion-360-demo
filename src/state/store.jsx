import { createContext, useContext, useEffect, useReducer } from 'react';
import { reducer } from './reducer.js';
import { avanzado, crearInicial } from './initial.js';

const CLAVE = 'valegestion360-demo-v1';
const Ctx = createContext(null);

// Reiniciar y el atajo viven aquí porque reconstruyen todo el estado.
function raiz(s, a) {
  if (a.type === 'RESET') return { ...crearInicial(), sesion: s.sesion, onboarding: false };
  if (a.type === 'ATAJO_COBRANZA_LISTA') return avanzado();
  return reducer(s, a);
}

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && guardado.v === 1) return guardado.estado;
  } catch {
    /* sin almacenamiento: la demo funciona igual, solo que no recuerda nada */
  }
  return crearInicial();
}

export function StoreProvider({ children }) {
  const [s, dispatch] = useReducer(raiz, null, cargar);
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ v: 1, estado: s }));
    } catch {
      /* ver arriba */
    }
  }, [s]);
  return <Ctx.Provider value={{ s, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
