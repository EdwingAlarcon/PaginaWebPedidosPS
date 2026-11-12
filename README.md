# Purple Shop

Sistema de gestión de **Purple Shop**: pedidos, pagos, clientes, catálogo,
despacho y rótulos de envío. Reemplaza el Excel del negocio por un flujo
donde el pedido, el cliente, el pago y el rótulo están conectados.

**Producción:** https://purpleshoponline.vercel.app (acceso solo para
usuarios autorizados)

## Qué hace

- **Pedidos**: alta con cliente nuevo o existente, autocompletar productos
  por nombre o código, edición con historial de cambios y línea de tiempo.
- **Pagos**: abonos por pedido, saldo y cartera "Por cobrar" con
  recordatorio por WhatsApp.
- **Clientes**: ficha con historial unificado, detección de duplicados,
  unificación y alertas de clientes inactivos.
- **Despacho**: bandeja de pedidos por despachar, con acciones en lote.
- **Rótulos**: se generan desde el pedido, con vista previa y PDF idénticos
  (10×9 cm y 14×12 cm).
- **Guías**: asignación del número de guía de Interrapidísimo y envío al
  cliente por WhatsApp.
- **Catálogo**: 319 productos con foto y precio, PDF de marca para compartir.
- **Reportes**: ventas por cliente y producto, comparativo mensual, histórico.
- **Respaldo**: exportación CSV/JSON, backup diario automático y restauración
  controlada.
- **Celular**: PWA instalable; las tablas se muestran como tarjetas.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase
(Postgres, Auth con Microsoft, Row Level Security) · pdf-lib · Vitest y
Playwright · Vercel.

## Estructura

```
apps/rotulos/        la aplicación (única app del repo)
docs/brand/          referencia de marca para el código
docs/arquitectura.html   diagrama de arquitectura (2026-10-06; abrir en el navegador)
docs/superpowers/    specs: decisiones de diseño de cada función
CLAUDE.md            guía técnica y reglas que no se deben romper
NEXT_STEPS.md        pendientes y decisiones vigentes
PRODUCT.md           contexto de producto
DESIGN.md            sistema visual de la interfaz
```

## Empezar

```bash
npm --prefix apps/rotulos install
npm run dev          # http://localhost:3001
```

Sin variables de Supabase la app arranca con datos en `localStorage`, útil
para probar la interfaz. Configuración, variables de entorno, migraciones y
despliegue: [`apps/rotulos/README.md`](apps/rotulos/README.md).

Desde la raíz también están `npm run build`, `npm test`, `npm run test:e2e` y
`npm run qa`; todos delegan en `apps/rotulos`.

## Historia

Hasta julio de 2026 este repositorio alojó una app en HTML/CSS/JS plano
integrada con Excel/OneDrive y servida en GitHub Pages. Se retiró al migrar
todo a `apps/rotulos`; ese código y su documentación siguen en el historial
de git.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
