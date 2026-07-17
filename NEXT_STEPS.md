# Purple Shop — Próximos pasos / handoff

> Este archivo existe para que cualquier herramienta o sesión futura
> (Codex, otra sesión de Claude Code, etc.) sepa dónde quedó el trabajo
> sin tener que leer memoria interna de ningún agente en particular.
> Última actualización: 2026-07-16.

Este repo contiene **dos proyectos independientes**:

1. **Raíz del repo** — Purple Shop, la app legacy HTML/CSS/JS sin build
   (gestión de pedidos/inventario). Ver `CLAUDE.md` en la raíz para su
   arquitectura completa.
2. **`apps/rotulos/`** — app Next.js/TypeScript/Tailwind/Supabase separada
   para generación de rótulos de envío. No comparte código ni build con
   la raíz; la raíz solo enlaza a ella desde la navegación legacy.

No confundir el estado de una con la otra — han tenido, por coincidencia,
QAs finales llamados "Bloque 8" cada una, sobre features distintas.

## 1. Purple Shop (raíz) — rediseño UI/UX: COMPLETADO ✅

Los 9 bloques (0-8, incluyendo QA final) están terminados, commiteados y
pusheados a `origin/main` (commit `975c5f6`). Detalle completo en
`project_redesign_status.md` (raíz del repo).

**Deuda técnica pendiente (menor, no bloqueante):**
- [ ] Falta el archivo `pwa/assets/images/logo-purple-shop.png` referenciado
  por el manifest de la PWA — causa un 404 en consola. Solo hace falta
  subir la imagen.
- [ ] `css/inventory.css` (1084 líneas) tiene colores hardcodeados
  residuales de menor impacto sin auditar exhaustivamente (chips
  `.status-badge`/`.movement-badge`, algunos textos secundarios en
  `.category-report`/`.report-table`). Ninguno confirmado como problema
  de contraste real, pero no se revisó línea por línea.

No hay ningún bloque de trabajo grande pendiente en este proyecto —
próximas tareas aquí serían features nuevas, no continuación del rediseño.

## 2. apps/rotulos — Next.js/Supabase/Vercel: producción inicial desplegada ⚠️

Ver detalle completo en `apps/rotulos/PENDING_QA.md`. Resumen de lo que
falta:

- [x] `src/modules/labels.js` ya no mantiene un generador legacy duplicado;
  ahora la pestaña de Purple Shop enlaza a la app dedicada en
  `http://localhost:3001`.
- [x] Producción Vercel configurada con variables Supabase reales. Localmente
  `.env.local` sigue opcional; sin ese archivo la app usa fallback local de
  desarrollo.
- [x] Migración `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`
  aplicada en Supabase remoto.
- [ ] Validar impresión física/PDF con la impresora final a escala 100%
  (el QA automatizado solo verificó el ratio 14:11 en pantalla).
- [x] Se agregó `.gitattributes` con LF para neutralizar el ruido CRLF/LF de
  `apps/rotulos/next-env.d.ts` y `apps/rotulos/package-lock.json`.
- [x] `apps/rotulos` empezó la migración a app principal Vercel/Supabase:
  rutas `pedidos`, `pedidos/nuevo` y `clientes`, más tablas Supabase para
  pedidos, items y códigos de producto.
- [x] Producción creada en Vercel: `https://rotulos-xi.vercel.app`.
- [x] Supabase dedicado creado: proyecto `purpleshop`, ref
  `enrruhuzlnqqjnsabgzq`; migración aplicada y variables configuradas en
  Vercel.
- [x] La app de Vercel ya usa una shell visual tipo Purple Shop legacy:
  sidebar con logo, topbar, Dashboard, Nuevo Pedido, Pedidos, Clientes,
  Inventario, Reportes, Rótulos e Historial.
- [ ] Validar manualmente el magic link y crear un pedido real desde
  producción.
- [ ] Profundizar la migración 1:1 de Inventario y Reportes; por ahora esas
  rutas existen en la app Next, pero Inventario conserva una pantalla base
  preparada para conectar stock/movimientos.
- [ ] Revocar el Supabase access token compartido durante la sesión desde
  Supabase Account Settings → Access Tokens. El token no fue guardado en el
  repo, pero sí quedó expuesto en el chat.
- [x] Inventario de stock (productos, movimientos, alertas) migrado a
  Supabase (`products`, `stock_movements`), con UI en `apps/rotulos/src/app/inventario`
  y métricas agregadas en Reportes.
- [ ] Aplicar la migración `202607161000_create_inventory_schema.sql` en
  el proyecto Supabase remoto `purpleshop`.
- [ ] Validar en producción el flujo completo de inventario (crear
  producto, registrar entrada/salida, ver alertas).
- [ ] Apagar GitHub Pages y borrar el codigo legacy de la raiz una vez
  validado el corte.

## 3. Cosas explícitamente fuera de alcance / no tocar sin permiso

- **No sincronizar `syncInventory()`/`writeToExcel()` contra el workbook
  real del negocio** ("REFERENCIAS") — destruiría datos. Ver advertencia
  completa en `CLAUDE.md` de la raíz.
- **No hacer push sin confirmación explícita del usuario** en ninguno de
  los dos proyectos (aplica salvo que el usuario ya haya pedido push,
  como en el commit `975c5f6`).
