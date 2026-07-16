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

## Resuelto localmente

- [x] La sección legacy `src/modules/labels.js` en la raíz dejó de duplicar el generador. Ahora muestra un puente hacia la app Next en `http://localhost:3001`.
- [x] El ruido CRLF/LF de `apps/rotulos/next-env.d.ts` y `apps/rotulos/package-lock.json` se resolvió agregando `.gitattributes` en la raíz con LF.
- [x] Se amplió `apps/rotulos` como base de app central Next/Supabase con rutas iniciales para pedidos y clientes.
- [x] La migración Supabase ahora incluye `orders`, `order_items` y `product_codes`, además de clientes/rótulos/configuración.
- [x] Se agregó panel de acceso con Supabase Auth por magic link para que producción use usuarios autenticados antes de guardar datos centrales.
- [x] Se creó proyecto Vercel `edwingalarcons-projects/rotulos` y quedó en producción en `https://rotulos-xi.vercel.app`.
- [x] Se creó proyecto Supabase dedicado `purpleshop` (`enrruhuzlnqqjnsabgzq`), se aplicó la migración y se configuraron variables Supabase en Vercel.
- [x] Se actualizó la shell de Next para parecerse a Purple Shop legacy: logo, sidebar, topbar, Dashboard, Nuevo Pedido, Pedidos, Clientes, Inventario, Reportes, Rótulos e Historial.

## Pendiente externo / requiere credenciales o hardware

- [x] Configurar `.env.local`/Vercel con credenciales Supabase antes de validar persistencia real contra base de datos. En Vercel ya está configurado; local sigue usando fallback si no existe `.env.local`.
- [x] Configurar en Supabase Auth la URL de Vercel como redirect URL.
- [x] Aplicar la migración Supabase (`202607150001_create_rotulos_schema.sql`) en el proyecto remoto antes de producción.
- [ ] Validar manualmente login por magic link y creación real de pedido/rótulo desde `https://rotulos-xi.vercel.app`.
- [ ] Completar migración 1:1 de Inventario y Reportes contra Supabase; las rutas ya existen, pero Inventario está como base inicial.
- [ ] Validar manualmente impresión física/PDF con la impresora final a escala 100%.
