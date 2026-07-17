# PurpleShop Commerce OS — Fase 1: layout, autenticación y sistema visual

Fecha: 2026-07-17
Estado: Aprobado por el usuario, listo para plan de implementación.

## Contexto

El usuario pidió un rediseño completo de `apps/rotulos` bajo la dirección
"PurpleShop Commerce OS" (Modern Commerce Dashboard + Soft UI + Bento +
sidebar premium), usando como referencia visual la app legacy en GitHub
Pages y conservando toda la arquitectura actual (Next.js, Supabase,
Supabase Auth, RLS). Dado el tamaño del pedido (9 módulos, modo oscuro,
responsive, accesibilidad), se decidió trocearlo en fases siguiendo el
propio orden que propuso el usuario. Este documento cubre solo la
**primera fase**: tokens visuales, shell (sidebar/topbar), login y la
capa de autenticación/autorización real que hoy no existe.

### Diagnóstico (auditoría de código, sin capturas — la extensión de
navegador no se pudo conectar en esta sesión)

- `apps/rotulos/src/app/globals.css` ya porta los tokens de marca de la
  raíz legacy (`--color-primary: #7c3aed`, etc. — ver spec previo
  `2026-07-16-unificar-diseno-apps-rotulos-design.md`, ya implementado).
  El gap visual restante es de **densidad y personalidad**, no de paleta:
  sin dashboard bento, navegación del sidebar sin agrupar, sin estado
  activo real, sin modo contraído, sin efectos "glass".
- `apps/rotulos/src/components/auth-panel.tsx` usa
  `supabase.auth.signInWithOtp` (magic link por correo). **No existe
  Microsoft OAuth** en esta app (sí existía vía MSAL en la raíz legacy,
  que se está desactivando).
- **No existe `middleware.ts`** ni ninguna otra forma de gating de rutas.
  Cualquier visitante sin sesión ve el shell completo y todas las páginas
  (`/`, `/pedidos`, `/clientes`, `/inventario`, etc.); solo las
  escrituras a Supabase fallarían sin sesión activa.
- **No existe allowlist** de cuentas permitidas (la raíz legacy sí tenía
  una, basada en hash SHA-256 de correos, ver `CLAUDE.md` de la raíz).

Estos tres últimos puntos son gaps funcionales/de seguridad, no solo
estéticos, y quedan dentro del alcance de esta fase porque la pantalla de
login y el requisito "no renderizar contenido privado antes de
autenticar" del pedido original los hacen inevitables.

## Decisiones (confirmadas con el usuario)

1. **Autenticación real**: Microsoft OAuth vía Supabase Auth (provider
   `azure`), reemplazando el magic-link actual.
2. **Autorización**: allowlist de correos permitidos (equivalente
   funcional a la de la raíz legacy, pero server-side en Supabase en vez
   de hash client-side).
3. **Gating**: middleware de Next.js que protege todas las rutas
   privadas desde esta misma fase (no se pospone).

## Alcance de la Fase 1

### 1. Tokens de diseño

Se extiende `globals.css` (no se reemplaza) añadiendo la escala de marca
que trajo el usuario en su pedido:

```css
--purple-950: #2E1065;  --purple-900: #4C1D95;  --purple-800: #5B21B6;
--purple-700: #6D28D9;  --purple-600: #7C3AED;  --purple-500: #8B5CF6;
--purple-400: #A78BFA;  --purple-300: #C4B5FD;  --purple-200: #DDD6FE;
--purple-100: #EDE9FE;  --purple-50:  #F5F3FF;
```

Estos valores coinciden exactamente con los tokens semánticos ya
existentes (`--purple-600` = `--color-primary` actual, `--purple-800` =
`--color-primary-active`, etc.), así que no hay conflicto: se agrega la
escala y los nombres semánticos existentes pasan a definirse en términos
de ella (`--color-primary: var(--purple-600)`), sin cambiar ningún valor
resuelto en pantalla.

Se añaden también, sin tocar los ya existentes:
- Tipografía **Plus Jakarta Sans** vía `next/font/google` (self-hosted
  por Next, sin `<link>` a CDN externo — cumple la restricción de no
  depender de fuentes remotas en runtime), como pila principal delante
  de `'Segoe UI'` (fallback existente se conserva).
- Jerarquía tipográfica del pedido como clases de utilidad (`.text-display`
  32px, `.text-page-title` 28px, `.text-section-title` 22px,
  `.text-card-title` 16–18px) — no un plugin de Tailwind nuevo, solo
  reglas CSS junto a las demás utilidades de `globals.css`, consistente
  con el resto del archivo (no usa `@apply` en ningún otro sitio).
- Utilidades `.glass` / `.glass-strong` portadas literalmente de
  `css/theme.css` de la raíz (mismo `backdrop-filter`), para el sidebar y
  tarjetas KPI de fases futuras.
- Modo oscuro: se mantienen los valores ya definidos en
  `[data-theme="dark"]`; se añaden los mismos nombres `--purple-*` con
  los valores oscuros ya usados por `--color-primary` en ese bloque (no
  se inventan tonos nuevos).

### 2. Shell — Sidebar y Topbar

Reescritura de `apps/rotulos/src/components/app-shell.tsx`:

- **Sidebar** agrupado en 4 secciones con encabezado de grupo (texto
  pequeño, mayúsculas, `--text-tertiary`):
  - Principal: Inicio, Nuevo pedido
  - Gestión: Pedidos, Clientes, Inventario, Reportes
  - Envíos: Crear rótulo, Historial
  - Sistema: Configuración
- Estado activo real vía `usePathname()` (fondo `--purple-50`/
  `--purple-900` según tema, texto `--purple-700`/`--purple-300`, borde
  izquierdo de 3px) — hoy no existe ningún estado activo.
- Hover ya existe (`.nav-link:hover`), se mantiene.
- **Modo contraído**: botón en la cabecera del sidebar, colapsa a
  íconos-solo (ancho 72px), tooltip con el label al hover, estado
  persistido en `localStorage` (`purpleshop.sidebar-collapsed`). Nuevo
  requisito, no existe hoy.
- **UserMenu** (nuevo componente, reemplaza `AuthPanel` en el sidebar y
  el topbar): avatar (iniciales si no hay foto de la cuenta Microsoft),
  nombre/correo, y "Cerrar sesión". No expone la palabra "Supabase" en
  ningún texto visible.
- **SyncStatus** (nuevo componente): indicador discreto (punto de color +
  tooltip con texto tipo "Todo al día" / "Sincronizando..." / "Sin
  conexión"), sin mencionar el backend. En esta fase se implementa con un
  estado derivado simple (online/offline vía `navigator.onLine` +
  eventos), sin sistema de sync en tiempo real — eso es responsabilidad
  de fases posteriores que sí escriben/leen datos.

- **Topbar**: título y descripción contextuales por página, generados
  desde un mapa estático `ruta → { título, descripción }` en
  `app-shell.tsx` (no se crea un sistema de metadata dinámico todavía —
  las páginas de esta fase son estáticas en cuanto a su título). Slot de
  acciones de página vacío por ahora (lo llenan fases futuras, ej. botón
  "Nuevo pedido" en la página de Pedidos). `SyncStatus` + `UserMenu` a la
  derecha.

- **Mobile**: se conserva el drawer existente
  (`.legacy-mobile-header`/`.legacy-mobile-nav`), pero se reestructura
  para usar los mismos grupos de navegación y se le agrega cierre con
  Escape y devolución de foco al botón que lo abrió (bug conocido y ya
  corregido una vez en la raíz legacy — se evita reintroducirlo aquí
  desde el diseño).

### 3. Login (`/login`)

Ruta nueva `apps/rotulos/src/app/login/page.tsx`, fuera del `AppShell`
(layout propio, sin sidebar/topbar).

- **Desktop**: dos columnas. Izquierda: fondo degradado
  (`--gradient-brand`, ya definido), logo PurpleShop, mensaje comercial
  corto, 2-3 bullets de beneficios (texto por definir en implementación,
  copy simple y real, no relleno). Derecha: tarjeta blanca centrada con
  el botón de acceso.
- **Mobile**: una sola columna, franja de degradado reducida arriba,
  tarjeta debajo.
- **Tarjeta de acceso**: botón "Continuar con Microsoft" (icono oficial
  de Microsoft, 4 cuadrados de color — asset estático nuevo en
  `public/`), invoca
  `supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo: '<origin>/auth/callback' } })`.
  Debajo, aviso fijo: "Acceso restringido a cuentas autorizadas de
  PurpleShop".
- **Estados**: cargando (spinner en el botón, deshabilitado), error de
  OAuth (mensaje inline, reintentar), no autorizado (mensaje distinto:
  "Esta cuenta no tiene acceso a PurpleShop", con la sesión ya cerrada
  automáticamente antes de mostrarlo — ver punto 4).

### 4. Autorización — dos capas

**Allowlist en Supabase**: tabla nueva `allowed_users`:

```sql
create table allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table allowed_users enable row level security;
create policy "usuario lee su propia fila"
  on allowed_users for select
  using (email = auth.jwt() ->> 'email');
```

Población inicial: una migración de datos con los correos que hoy están
en el allowlist client-side de la raíz (el usuario los provee al
implementar; no se hardcodean en el spec por ser datos personales, mismo
criterio que la raíz legacy).

**Middleware** (`apps/rotulos/src/middleware.ts`, nuevo archivo):
- Se ejecuta en todas las rutas excepto `/login`, `/auth/callback`,
  assets estáticos y `/api/*` (las API routes ya validan sesión donde
  corresponda; no se duplica lógica ahí en esta fase).
- Lee la sesión Supabase desde las cookies (`@supabase/ssr`, patrón
  estándar de Next.js App Router).
- Sin sesión → `redirect('/login')`.
- Con sesión pero correo fuera de `allowed_users` → se cierra la sesión
  (`supabase.auth.signOut()`) y se redirige a
  `/login?unauthorized=1`, que la página de login lee para mostrar el
  estado "no autorizado" del punto 3.
- Con sesión y correo permitido → continúa normalmente; nada del shell
  se renderiza en el servidor antes de que esta validación pase (al ser
  middleware, corre antes de cualquier render).

### 5. Ruta de callback OAuth

`apps/rotulos/src/app/auth/callback/route.ts` (route handler): intercambia
el código de OAuth por una sesión (`supabase.auth.exchangeCodeForSession`)
y redirige a `/` — patrón estándar documentado por Supabase para App
Router.

## Fuera de alcance de esta fase

- Configurar el App Registration de Azure AD y conectarlo en el panel de
  Supabase Auth: son acciones en paneles externos (Azure Portal,
  dashboard de Supabase) que debe hacer el usuario; esta fase deja el
  código listo para consumir ese provider en cuanto exista.
- Dashboard bento con datos reales (Fase 2).
- Cualquier página de módulo (Pedidos, Clientes, Inventario, Reportes,
  Rótulos, Historial, Configuración) más allá de que ahora vivan detrás
  del gating — su contenido interno no se toca en esta fase.
- Auditoría de contraste WCAG AA módulo por módulo (se hace por fase, ya
  se validó una vez para la raíz legacy y se reutilizan esos mismos
  valores de tokens).
- `MetricCard`, `DataTable`, `FormSection`, `ConfirmDialog` y el resto de
  componentes reutilizables listados en el pedido original: se crean en
  la fase que primero los necesita (Dashboard, Pedidos, etc.), no aquí.

## Riesgos / dependencias

- Esta fase queda bloqueada en su verificación end-to-end real hasta que
  el usuario configure el provider Azure en Supabase — se puede
  implementar y probar con tests/mocks, pero el flujo de login real
  contra una cuenta Microsoft no se puede validar en el entorno de
  desarrollo sin esa configuración externa.
- Si el usuario pierde acceso porque su propio correo no está aún en
  `allowed_users` al desplegar, queda bloqueado de su propia app — la
  migración de datos inicial de la allowlist debe aplicarse ANTES de
  activar el middleware en producción, no después.

## Verificación

- `npm run lint`, `npm run typecheck` (o `tsc --noEmit`), `npm run build`
  dentro de `apps/rotulos`.
- Pruebas manuales en navegador: intento de acceso a `/pedidos` sin
  sesión (debe redirigir a `/login`), login con Microsoft, logout,
  colapsar/expandir sidebar, drawer móvil con Escape, alternar
  claro/oscuro en el shell y el login.
- No se tocan `label-canvas`, `label-preview.tsx`, `pdf.ts` ni ningún CSS
  del rótulo impreso (mismo límite ya establecido en el spec previo de
  unificación de diseño).
