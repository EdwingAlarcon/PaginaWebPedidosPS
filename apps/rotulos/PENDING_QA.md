# apps/rotulos — Estado de QA y pendientes

> Rescatado del commit `5ad3e11` — este contenido vivía antes en
> `project_redesign_status.md` en la raíz del repo, pero ese archivo es
> ahora del rediseño de Purple Shop (proyecto raíz, no relacionado). Se
> movió aquí para no perder el trabajo de QA ya hecho sobre `apps/rotulos`.

Fecha de última revisión: 2026-07-16

## Estado actual

- La app principal legacy permanece en la raíz del repo (Purple Shop).
- La app de rótulos está implementada en `apps/rotulos` con Next.js, TypeScript, Tailwind, Supabase y Playwright.
- La navegación legacy ya incluye una sección de rótulos; la app Next de rótulos se ejecuta localmente en `http://localhost:3001`.
- El generador Next incluye dashboard, crear rótulo, historial, configuración, preview, impresión, PDF y numeración automática.
- La migración Supabase existe en `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`.

## Verificación ya ejecutada

- `npm --prefix apps/rotulos run lint`: pasa sin errores ni advertencias.
- `npm --prefix apps/rotulos run typecheck`: pasa.
- `npm --prefix apps/rotulos run test`: 8 archivos, 46 pruebas pasan.
- `npm --prefix apps/rotulos run build`: pasa.
- `npm --prefix apps/rotulos run test:e2e`: 6 pruebas pasan en desktop y móvil.
- QA final en modo producción (`http://localhost:3002`) con 24 combinaciones de ruta/breakpoint:
  - Breakpoints: 320, 375, 768, 1024, 1280 y 1440 px.
  - Rutas: dashboard, crear, historial y configuración.
  - Overflow horizontal: 0 fallos.
  - Contraste WCAG AA: 0 fallos.
  - Solapes entre controles interactivos: 0 fallos.
  - Navegación por teclado/foco visible: 0 fallos.
  - Ratio del rótulo 14:11: 0 fallos.
  - Regresión de flujo: crear/guardar rótulo, buscar en historial y persistir configuración pasan.
  - Comando reproducible: `QA_BASE_URL=http://localhost:3002 npm run rotulos:qa`.

## Cambios ya realizados

- Se limpió el lint de `apps/rotulos/eslint.config.mjs`.
- `LabelPreview` ahora usa `next/image` con `unoptimized` para logo y QR, manteniendo los assets tal como se imprimen/renderizan.
- Se agregó `apps/rotulos/scripts/qa-final.mjs` para repetir el QA final de breakpoints, teclado, contraste y regresión.

## Pendiente (sin iniciar)

- [ ] Definir si la sección legacy `src/modules/labels.js` (en la raíz del repo, Purple Shop) debe quedarse como generador rápido dentro de la app raíz o reemplazarse por un enlace directo a la app Next de `apps/rotulos`.
- [ ] Configurar `.env.local` con credenciales Supabase antes de validar persistencia real contra base de datos.
- [ ] Aplicar la migración Supabase (`202607150001_create_rotulos_schema.sql`) en el proyecto remoto antes de producción.
- [ ] Validar manualmente impresión física/PDF con la impresora final a escala 100%.
- [ ] Revisar por qué `apps/rotulos/next-env.d.ts` y `apps/rotulos/package-lock.json` aparecen modificados en `git status` sin diff de contenido real (solo ruido CRLF/LF) — probablemente basta con `git config core.autocrlf` o un `.gitattributes`, pero no se investigó a fondo.
