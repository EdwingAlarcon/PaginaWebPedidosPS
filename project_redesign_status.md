# Project Redesign Status

Fecha de revision: 2026-07-16

## Estado actual

- La app principal legacy permanece en la raiz del repo.
- La app de rotulos esta implementada en `apps/rotulos` con Next.js, TypeScript, Tailwind, Supabase y Playwright.
- La navegacion legacy ya incluye una seccion de rotulos; la app Next de rotulos se ejecuta localmente en `http://localhost:3001`.
- El generador Next incluye dashboard, crear rotulo, historial, configuracion, preview, impresion, PDF y numeracion automatica.
- La migracion Supabase existe en `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`.

## Verificacion ejecutada

- `npm --prefix apps/rotulos run lint`: pasa sin errores ni advertencias.
- `npm --prefix apps/rotulos run typecheck`: pasa.
- `npm --prefix apps/rotulos run test`: 8 archivos, 46 pruebas pasan.
- `npm --prefix apps/rotulos run build`: pasa.
- `npm --prefix apps/rotulos run test:e2e`: 6 pruebas pasan en desktop y movil.
- Bloque 8 QA final completado en modo produccion (`http://localhost:3002`) con 24 combinaciones de ruta/breakpoint:
  - Breakpoints: 320, 375, 768, 1024, 1280 y 1440 px.
  - Rutas: dashboard, crear, historial y configuracion.
  - Overflow horizontal: 0 fallos.
  - Contraste WCAG AA: 0 fallos.
  - Solapes entre controles interactivos: 0 fallos.
  - Navegacion por teclado/foco visible: 0 fallos.
  - Ratio del rotulo 14:11: 0 fallos.
  - Regresion de flujo: crear/guardar rotulo, buscar en historial y persistir configuracion pasan.
  - Comando reproducible: `QA_BASE_URL=http://localhost:3002 npm run rotulos:qa`.

## Cambios realizados en esta revision

- Se limpio el lint de `apps/rotulos/eslint.config.mjs`.
- `LabelPreview` ahora usa `next/image` con `unoptimized` para logo y QR, manteniendo los assets tal como se imprimen/renderizan.
- Se instalaron dependencias locales y Chromium de Playwright para poder ejecutar la verificacion completa.
- Se agrego `apps/rotulos/scripts/qa-final.mjs` para repetir el QA final de breakpoints, teclado, contraste y regresion.

## Pendiente recomendado

- Definir si la seccion legacy `src/modules/labels.js` debe quedarse como generador rapido dentro de la app raiz o reemplazarse por un enlace directo a la app Next de `apps/rotulos`.
- Configurar `.env.local` con Supabase antes de validar persistencia real contra base de datos.
- Aplicar la migracion Supabase en el proyecto remoto antes de produccion.
- Validar manualmente impresion fisica/PDF con la impresora final a escala 100%.
