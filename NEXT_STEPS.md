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

## 2. apps/rotulos — Next.js/Supabase: QA de su propio alcance pasado, pero con trabajo real pendiente ⚠️

Ver detalle completo en `apps/rotulos/PENDING_QA.md`. Resumen de lo que
falta:

- [ ] Decidir si `src/modules/labels.js` (generador de rótulos legacy en
  la raíz) se mantiene como atajo rápido o se reemplaza por un enlace
  directo a `apps/rotulos`.
- [ ] Configurar `.env.local` con credenciales Supabase reales — sin esto
  no se ha validado persistencia real contra base de datos, solo mocks/local.
- [ ] Aplicar la migración `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`
  en el proyecto Supabase remoto.
- [ ] Validar impresión física/PDF con la impresora final a escala 100%
  (el QA automatizado solo verificó el ratio 14:11 en pantalla).
- [ ] Investigar por qué `apps/rotulos/next-env.d.ts` y
  `apps/rotulos/package-lock.json` aparecen modificados en `git status`
  sin diff de contenido real (ruido CRLF/LF) — quedan sin commitear desde
  antes de esta sesión.

## 3. Cosas explícitamente fuera de alcance / no tocar sin permiso

- **No sincronizar `syncInventory()`/`writeToExcel()` contra el workbook
  real del negocio** ("REFERENCIAS") — destruiría datos. Ver advertencia
  completa en `CLAUDE.md` de la raíz.
- **No hacer push sin confirmación explícita del usuario** en ninguno de
  los dos proyectos (aplica salvo que el usuario ya haya pedido push,
  como en el commit `975c5f6`).
