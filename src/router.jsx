import { useEffect, useState } from 'react';

const leer = () => window.location.hash.replace(/^#/, '') || '/';

export function useRuta() {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const alCambiar = () => {
      setRuta(leer());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  return ruta.split('/').filter(Boolean);
}

export const ir = (ruta) => {
  window.location.hash = ruta;
};

export function Enlace({ a, children, ...resto }) {
  return (
    <a href={`#${a}`} {...resto}>
      {children}
    </a>
  );
}

export function useAncho(consulta) {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const f = () => setCoincide(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [consulta]);
  return coincide;
}
