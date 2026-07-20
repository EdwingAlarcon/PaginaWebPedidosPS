# Archivo — documentación de la app legacy (pre-2026-07)

Todo lo que hay en esta carpeta describe la app legacy que vivía en la raíz
del repositorio (HTML/CSS/JS plano, integración a Excel/OneDrive via
MSAL.js, servida en GitHub Pages) y su módulo de Inventarios, tal como
existían **antes** de la migración a `apps/rotulos` (Next.js + Supabase +
Vercel). Esa app fue retirada por completo el 2026-07-18 — ver la sección
"Historia" en `/README.md` y `/CLAUDE.md`.

Se movió acá en vez de borrarse (2026-07-20, depuración de documentación)
porque:

- El código que describen ya no existe en el árbol de trabajo (sigue en el
  historial de git anterior al commit `8f52271`).
- Nada de esto aplica al stack actual (`apps/rotulos`): mencionan GitHub
  Pages/Netlify/Azure como hosting, autenticación por magic link o sin
  autenticación, y una estructura de carpetas que ya no existe.
- Se conservan por si hace falta contexto histórico de decisiones viejas,
  pero **no deben usarse como referencia del estado actual de la app**.

También se archivaron acá (mismo motivo — legacy o superado):

- `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` — boilerplate genérico de
  proyecto open-source, nunca mantenido con contenido real, sin relación con
  este repo privado de un solo desarrollador.
- `project_redesign_status.md` — estado del rediseño UI/UX de la app legacy
  (sidebar/topbar en CSS/JS plano), superado por el rediseño de
  `apps/rotulos` (ver `CLAUDE.md`, sección "Estado operativo reciente").
- `apps-rotulos-PENDING_QA-2026-07-16.md` — checklist de QA de
  `apps/rotulos` del 2026-07-16, de cuando la app recién se desplegaba.
  Contradice el flujo de auth actual (decía "magic link"; hoy es OAuth de
  Microsoft + allowlist) y referencia rutas legacy ya borradas. El pendiente
  real que seguía vigente (impresión física sin validar) ya está en
  `NEXT_STEPS.md`.

También se movieron `setup-github.ps1` y `VERIFICATION_CHECKLIST.sh`
(antes en `scripts/` de la raíz) — scripts de setup de la app legacy, sin
referencia en ningún `package.json`, que apuntaban a los docs de esta
misma carpeta.

La documentación vigente de `apps/rotulos` vive en `apps/rotulos/README.md`,
`/README.md`, `/CLAUDE.md` y `/NEXT_STEPS.md`. Los planes/specs de
`docs/superpowers/` **no** se archivaron — son el registro histórico de
decisiones de diseño de `apps/rotulos` y siguen siendo la referencia
correcta para entender por qué se construyó cada feature así.
