import { Aviso, Boton, Etiqueta, Icono, Tarjeta } from '../components/ui.jsx';
import { Enlace, ir } from '../router.jsx';
import { useStore } from '../state/store.jsx';
import { gruposPendientes, movsActivos, totales, valerasCargadas, vistaCobranza } from '../lib/calc.js';
import { fechaLarga, minFecha } from '../lib/dates.js';
import { mx, suma } from '../lib/money.js';

const ESTADOS = { preparacion: ['Cobranza en preparación', 'alerta'], confirmada: ['Cobranza confirmada', 'primario'], cerrada: ['Quincena cerrada', 'neutro'] };

export default function Inicio() {
  const { s } = useStore();
  const t = totales(s);
  const grupos = gruposPendientes(s);
  const valeras = valerasCargadas(s);
  const faltan = valeras.filter((v) => !v.cargada && !v.sinRelacion);
  const q = s.quincena;
  const [textoEstado] = ESTADOS[q.estado];
  const limite = minFecha(s.importaciones.filter((i) => !i.reemplazada).map((i) => i.fechaPago));
  const enPrep = q.estado === 'preparacion';
  const pct = t.total ? Math.round((t.cobrado / t.total) * 100) : 0;
  const activos = movsActivos(s);
  const porValera = (id) => {
    const movs = activos.filter((m) => m.valeraId === id);
    return { total: suma(movs.map((m) => m.importe)), vales: movs.length };
  };

  const principal = faltan.length
    ? { texto: `Subir la relación de ${faltan[0].nombre}`, a: '/subir' }
    : grupos.length
      ? { texto: 'Revisar clientes', a: '/revisar' }
      : enPrep
        ? { texto: 'Confirmar cobranza', a: '/confirmar' }
        : { texto: 'Ver la relación de cobranza', a: '/cobranza' };

  const pasos = [
    { t: 'Subir relaciones', hecho: !faltan.length, d: `${valeras.filter((v) => v.cargada).length} de ${valeras.length} valeras cargadas${valeras.some((v) => v.sinRelacion) ? ` · ${valeras.filter((v) => v.sinRelacion).length} sin relación` : ''}`, a: '/subir' },
    { t: 'Revisar clientes y quién paga', hecho: !faltan.length && !grupos.length, d: grupos.length ? `${grupos.length} por revisar` : 'Sin revisiones pendientes', a: '/revisar' },
    { t: 'Confirmar cobranza', hecho: !enPrep, d: enPrep ? 'Falta confirmar' : 'Confirmada', a: '/confirmar' },
    { t: 'Preparar avisos de cobro', hecho: false, d: enPrep ? 'Disponibles al confirmar' : 'Listos para imprimir', a: enPrep ? '/confirmar' : '/avisos' },
    { t: 'Registrar pagos (opcional)', hecho: t.cobrado > 0, d: t.cobrado > 0 ? `${mx(t.cobrado)} registrados` : 'Solo si quieres llevar el seguimiento', a: '/cobranza' },
  ];
  const actual = pasos.findIndex((p) => !p.hecho);
  const pendientesSinRegistro = vistaCobranza(s).filter((p) => p.pagado === 0).length;

  return (
    <div className="pagina">
      <div className="cabecera-saludo">
        <span className="logo" aria-hidden="true">VG</span>
        <div>
          <small>{q.label}</small>
          <h1 style={{ fontSize: '1.45rem' }}>Hola, mayorista de demostración</h1>
        </div>
      </div>

      <section className="hero" aria-label="Resumen de la quincena">
        <span className="hero-eyebrow">{enPrep ? 'Total a cobrar · vista previa' : 'Total a cobrar'}</span>
        <div className="hero-cifra">{mx(t.total)}</div>
        <div className="hero-mint">{t.n} responsables de pago · {textoEstado}</div>
        <div className="progreso hero-barra" role="img" aria-label={`${pct}% registrado como cobrado`}><span style={{ width: `${pct}%` }} /></div>
        <div className="hero-pie">
          <span><strong>{mx(t.cobrado)}</strong> cobrado, según lo que registres</span>
          <span>{limite ? `Fecha límite: ${fechaLarga(limite)}` : 'Aún sin fecha límite'}</span>
        </div>
      </section>

      <div className="seccion-titulo">
        <h2>Por valera</h2>
        <Enlace a="/valeras">Ver valeras</Enlace>
      </div>
      <div className="empresas">
        {valeras.map((v, i) => {
          const r = porValera(v.id);
          const sigla = v.nombre.replace(/^Valera\s+/i, '').slice(0, 2).toUpperCase();
          return (
            <Enlace a={v.cargada || v.sinRelacion ? '/valeras' : '/subir'} className="empresa" key={v.id}>
              <span className={`sigla tono-${i % 4}`}>{sigla}</span>
              <strong>{v.nombre}</strong>
              {v.cargada ? (
                <>
                  <strong className="monto">{mx(r.total)}</strong>
                  <small>{r.vales} movimientos</small>
                </>
              ) : v.sinRelacion ? (
                <>
                  <strong className="monto" style={{ color: 'var(--suave)' }}>Sin relación</strong>
                  <small>Indicaste que no la recibiste</small>
                </>
              ) : (
                <>
                  <strong className="monto" style={{ color: 'var(--alerta)' }}>Por cargar</strong>
                  <small>Toca para subir su relación</small>
                </>
              )}
            </Enlace>
          );
        })}
      </div>

      <div className="accesos" aria-label="Accesos rápidos">
        <Enlace a="/subir" className="acceso tono-0"><Icono nombre="archivo" />Subir relación</Enlace>
        <Enlace a="/clientes" className="acceso tono-1"><Icono nombre="clientes" />Mis clientes</Enlace>
        <Enlace a={enPrep ? '/confirmar' : '/avisos'} className="acceso tono-2"><Icono nombre="imprimir" />Avisos de cobro</Enlace>
        <Enlace a="/cobranza" className="acceso tono-3"><Icono nombre="cobranza" />Registrar pago</Enlace>
      </div>

      {grupos.length > 0 ? (
        <Enlace a="/revisar" className="foco">
          <span className="icono"><Icono nombre="alerta" /></span>
          <span>
            <small>Revisiones pendientes</small>
            <strong>{grupos.length} {grupos.length === 1 ? 'nombre necesita' : 'nombres necesitan'} tu confirmación</strong>
            <div className="suave">Hay {mx(suma(grupos.map((g) => g.total)))} sin responsable definido.</div>
          </span>
        </Enlace>
      ) : (
        <div className="foco ok">
          <span className="icono"><Icono nombre="ok" /></span>
          <span>
            <small>Revisiones</small>
            <strong>Todo al día</strong>
            <div className="suave">No hay coincidencias ni clientes nuevos por resolver.</div>
          </span>
        </div>
      )}

      <Boton grande onClick={() => ir(principal.a)} style={{ justifySelf: 'start' }}>{principal.texto}</Boton>

      {s.ajustes.notif && q.estado === 'confirmada' && pendientesSinRegistro > 0 && (
        <Aviso tono="info" titulo="Recordatorio de pagos (activaste los avisos)">
          Hay {pendientesSinRegistro} responsables sin pagos registrados. Puedes anotarlos ahora o seguir llevándolo en papel. Los avisos se desactivan en «Más».
        </Aviso>
      )}

      <Tarjeta titulo="Tu quincena paso a paso" accion={<Etiqueta tono={ESTADOS[q.estado][1]}>{textoEstado}</Etiqueta>}>
        <div className="pasos">
          {pasos.map((p, i) => (
            <Enlace key={p.t} a={p.a} className={`paso ${p.hecho ? 'hecho' : ''} ${i === actual ? 'actual' : ''}`}>
              <span className="marca">{p.hecho ? <Icono nombre="ok" tam={18} /> : i + 1}</span>
              <span>
                <strong>{p.t}</strong>
                <small>{p.d}</small>
              </span>
            </Enlace>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
