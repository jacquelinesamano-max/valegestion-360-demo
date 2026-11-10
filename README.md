# ValeGestión 360 · prototipo de demostración

Prototipo navegable para conversar con mayoristas. **Todo es ficticio**: clientes, vales e importes están inventados, y la lectura de archivos está **simulada**. No es un producto terminado ni se conecta a ningún sistema.

> El nombre y la imagen son provisionales. No corresponden a la identidad oficial de ninguna empresa.

## Cómo verlo

```bash
cd valegestion-360-demo
pnpm install
pnpm dev        # http://localhost:5180
```

Otros comandos: `pnpm test` (reglas de cálculo), `pnpm build`.

En la app, **Más → Guía de la demostración** trae el guion de 10 minutos, la lista de escenarios, los supuestos y los puntos por validar. Ahí también están los atajos para reiniciar o saltar a una cobranza ya confirmada con pagos.

Lo que hagas se guarda solo en el navegador (localStorage), únicamente para la demo. «Reiniciar demo» lo borra.

## Compartirlo con un enlace público

`pnpm build` genera la carpeta `dist/` (también viene empaquetada en `valegestion-360-demo.zip`). Son archivos estáticos con rutas relativas, así que funcionan en cualquier servicio de alojamiento estático y en cualquier subcarpeta:

- **Netlify:** entra a `app.netlify.com/drop` y arrastra la carpeta `dist/`. Para que el sitio no caduque hay que crear una cuenta.
- **Vercel o Cloudflare Pages:** sube `dist/` como sitio estático (sin comando de build) o conecta el repositorio con `pnpm build` y carpeta de salida `dist`.
- **GitHub Pages:** publica el contenido de `dist/` en la rama `gh-pages` o desde una acción.

La demo no guarda nada en un servidor: el avance vive en el navegador de cada persona. Incluye `noindex`, así que los buscadores no la listan, pero cualquiera con el enlace la puede abrir. Los datos son ficticios.

## Qué se puede probar de verdad

- Flujo completo: subir relación → revisar lo leído → coincidencias de clientes → quién paga → confirmar → avisos de cobro → relación general → registrar pagos → historial.
- Totales derivados de los movimientos: el desglose de cada aviso, la relación general y el resumen siempre suman lo mismo (26 pruebas automáticas).
- Reglas: cada movimiento se cuenta una vez; un recomendado tiene un solo responsable (sin cadenas ni ciclos); un responsable sin vales propios sigue recibiendo la cobranza de sus recomendados; un abono no se reparte entre valeras.
- Volumen: en Más → Volumen se simula una mayorista con unos 600 clientes. Las listas tienen búsqueda, filtros, orden y «Mostrar más», y la relación impresa se reparte por hojas.
- Comparación con el corte anterior al revisar una relación (vales nuevos, vales que ya no aparecen e importes que cambiaron), y el pendiente de la quincena anterior, que se muestra aparte y no se suma.
- «No recibí relación de esta valera» (Valera Delta no tiene archivo) y el resumen antes de confirmar con cuatro pendientes y botón «Atender».
- Impresión: avisos de cobro (uno o todos) y relación general en tamaño carta, blanco y negro. Se prueba con el botón de imprimir del navegador.

## Qué está simulado o por definir

- Lectura de Excel, PDF y foto: son archivos de ejemplo fijos. La foto es solo una posibilidad por validar.
- Descarga de PDF de los avisos (fase posterior).
- Corregir una cobranza ya confirmada: está diseñado (ventana explicativa) pero no funciona.
- Recordatorios de pago: solo se muestra un aviso en pantalla.
- Cuentas auxiliares: sin permisos definidos, no forman parte de la demo.
- No incluye descuento por pronto pago ni puntaje de riesgo.

## Supuestos que conviene confirmar

Están listados en la Guía de la demostración. Los más importantes: la fecha de pago del archivo manda y el calendario de la valera es solo respaldo; la quincena se asigna por la fecha límite de pago; el aviso desglosa por persona y la valera es opcional; el préstamo personal es de la mayorista y no se cobra a clientes; las coincidencias de nombre se confirman siempre por una persona (confirmar en bloque las seguras es una propuesta).

## Estructura

```
src/
  data/seed.js        datos ficticios (valeras, clientes, relaciones de ejemplo)
  lib/                dinero, fechas, comparación de nombres y cálculos de la cobranza
  state/              reducer puro, estado inicial y atajo, y el almacén de React
  screens/            una carpeta de pantallas por tarea
  components/         piezas compartidas (diálogos, registro de pago, detalle)
tests/                pruebas de las reglas de consolidación y de pagos
```
