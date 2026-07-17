# PurpleShop Commerce OS — Fase 1: Layout, autenticación y sistema visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a `apps/rotulos` un sistema de diseño de marca completo (tokens, tipografía, shell con sidebar/topbar), una pantalla de login con Microsoft OAuth, y gating real de rutas con allowlist — hoy ninguna de las tres cosas existe de verdad en la app.

**Architecture:** Next.js 16 App Router. Se introduce un route group `(app)` que envuelve todas las páginas privadas en `AppShell`, dejando `/login` fuera de ese layout. La autenticación usa Supabase Auth (provider `azure`) con clientes SSR de `@supabase/ssr` (uno para Server Components/Route Handlers vía `next/headers`, otro para `middleware.ts` vía `NextRequest`/`NextResponse`). La autorización es una tabla `allowed_users` en Supabase con RLS, consultada desde el middleware en cada request a una ruta privada.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, `@supabase/ssr` 0.12.3, `@supabase/supabase-js` 2.110.6, Tailwind/CSS variables (`globals.css`), lucide-react (iconos), Vitest + Testing Library (tests existentes), Playwright (e2e existente, no se añade e2e nuevo en esta fase).

## Global Constraints

- No modificar `label-canvas`, `label-preview.tsx`, `pdf.ts` ni ningún CSS del rótulo impreso (`.label-*`, bloque `@media print`) — límite ya establecido en el spec previo de unificación de diseño y reafirmado en el spec de esta fase.
- Ningún texto visible en la UI debe decir "Supabase" — usar lenguaje neutro ("Todo al día", "Sin conexión", etc.).
- Nada del shell/contenido privado se debe renderizar en el servidor antes de que el middleware valide sesión + allowlist.
- No agregar fuentes vía `<link>` a un CDN externo — usar `next/font/google` (self-hosted por Next).
- Todas las variables de color/tipografía nuevas se agregan a `apps/rotulos/src/app/globals.css`; no se crean archivos CSS nuevos ni se usa Tailwind `@apply`, siguiendo la convención ya establecida en ese archivo.
- La migración SQL de la allowlist se añade a `apps/rotulos/supabase/migrations/` pero no se aplica automáticamente (igual que las 3 migraciones existentes) — aplicarla en Supabase es un paso manual del usuario, documentado en el propio Task.
- Ejecutar `npm run lint`, `npm run typecheck` y `npm run test` (dentro de `apps/rotulos`) al final de cada tarea que toque código TypeScript/TSX.

---

### Task 1: Tokens de marca, tipografía y utilidades "glass"

**Files:**
- Modify: `apps/rotulos/src/app/globals.css`
- Modify: `apps/rotulos/src/app/layout.tsx`
- Test: `apps/rotulos/src/__tests__/design-tokens.test.ts`

**Interfaces:**
- Produces: variables CSS `--purple-50` … `--purple-950`, `--font-plus-jakarta` (vía `next/font`), clases `.text-display`, `.text-page-title`, `.text-section-title`, `.text-card-title`, `.glass`, `.glass-strong`. Todas las tareas siguientes que agregan CSS nuevo pueden usar estas variables y clases.

- [ ] **Step 1: Escribir el test que falla**

```ts
// apps/rotulos/src/__tests__/design-tokens.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf-8");

describe("design tokens de PurpleShop Commerce OS", () => {
  it("define la escala de marca purple-50..950", () => {
    expect(css).toContain("--purple-950: #2E1065");
    expect(css).toContain("--purple-900: #4C1D95");
    expect(css).toContain("--purple-800: #5B21B6");
    expect(css).toContain("--purple-700: #6D28D9");
    expect(css).toContain("--purple-600: #7C3AED");
    expect(css).toContain("--purple-500: #8B5CF6");
    expect(css).toContain("--purple-400: #A78BFA");
    expect(css).toContain("--purple-300: #C4B5FD");
    expect(css).toContain("--purple-200: #DDD6FE");
    expect(css).toContain("--purple-100: #EDE9FE");
    expect(css).toContain("--purple-50: #F5F3FF");
  });

  it("define la escala tipografica de utilidades", () => {
    expect(css).toContain(".text-display {");
    expect(css).toContain(".text-page-title {");
    expect(css).toContain(".text-section-title {");
    expect(css).toContain(".text-card-title {");
  });

  it("define utilidades glass para ambos temas", () => {
    expect(css).toContain(".glass {");
    expect(css).toContain(".glass-strong {");
    expect(css).toContain("--glass-bg: rgba(255, 255, 255, 0.72)");
    expect(css).toContain("--glass-bg: rgba(28, 23, 40, 0.72)");
  });

  it("usa la fuente Plus Jakarta Sans como principal", () => {
    expect(css).toContain("--font-sans: var(--font-plus-jakarta)");
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/design-tokens.test.ts`
Expected: FAIL — ninguna de las variables/clases existe todavía en `globals.css`.

- [ ] **Step 3: Agregar la escala de marca y redefinir los alias existentes**

En `apps/rotulos/src/app/globals.css`, dentro del bloque `:root` ya existente (antes de `--color-primary: #7c3aed;`), insertar:

```css
:root {
  color-scheme: light;

  /* Escala de marca PurpleShop Commerce OS (swatch fijo, igual en ambos temas) */
  --purple-950: #2E1065;
  --purple-900: #4C1D95;
  --purple-800: #5B21B6;
  --purple-700: #6D28D9;
  --purple-600: #7C3AED;
  --purple-500: #8B5CF6;
  --purple-400: #A78BFA;
  --purple-300: #C4B5FD;
  --purple-200: #DDD6FE;
  --purple-100: #EDE9FE;
  --purple-50: #F5F3FF;

  --color-primary: var(--purple-600);
  --color-primary-hover: var(--purple-700);
  --color-primary-active: var(--purple-800);
  --color-primary-light: var(--purple-400);
  --color-primary-soft: #f1e9fe;
  --color-secondary: #ec4899;
  --color-secondary-hover: #db2777;
  ...
```

(El resto del bloque `:root` — `--danger-color` en adelante — se deja exactamente igual; solo se insertan las 11 variables `--purple-*` y se reescriben `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-light` en términos de `var(--purple-*)`. `--color-primary-soft` se deja con su valor literal actual porque no coincide exactamente con `--purple-100` y cambiarlo alteraría un tono ya validado visualmente.)

- [ ] **Step 4: Agregar la fuente y actualizar `--font-sans`**

En `apps/rotulos/src/app/globals.css`, reemplazar:

```css
  --font-sans: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

por:

```css
  --font-sans: var(--font-plus-jakarta), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

En `apps/rotulos/src/app/layout.tsx`, agregar el import de la fuente y aplicar su variable al `<body>`:

```tsx
import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PurpleShop",
  description: "Gestion de pedidos, clientes y rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={plusJakartaSans.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Agregar la jerarquía tipográfica y las utilidades "glass"**

Al final de `apps/rotulos/src/app/globals.css`, agregar:

```css
/* ==================== TIPOGRAFIA — PurpleShop Commerce OS ==================== */
.text-display {
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 800;
  color: var(--text-primary);
}

.text-page-title {
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-primary);
}

.text-section-title {
  font-size: 1.375rem;
  line-height: 1.25;
  font-weight: 700;
  color: var(--text-primary);
}

.text-card-title {
  font-size: 1.0625rem;
  line-height: 1.3;
  font-weight: 700;
  color: var(--text-primary);
}

/* ==================== UTILIDADES GLASS ==================== */
:root {
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(124, 58, 237, 0.14);
  --glass-blur: blur(16px);
  --glass-bg-strong: rgba(255, 255, 255, 0.85);
}

[data-theme="dark"] {
  --glass-bg: rgba(28, 23, 40, 0.72);
  --glass-border: rgba(167, 139, 250, 0.18);
  --glass-bg-strong: rgba(36, 29, 51, 0.85);
}

.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}

.glass-strong {
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}
```

- [ ] **Step 6: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/design-tokens.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Verificar que el resto de la suite y el build siguen bien**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm run test && npm run build`
Expected: todo verde. (El build confirma que `next/font/google` descarga/compila bien la fuente.)

- [ ] **Step 8: Commit**

```bash
git add apps/rotulos/src/app/globals.css apps/rotulos/src/app/layout.tsx apps/rotulos/src/__tests__/design-tokens.test.ts
git commit -m "feat(rotulos): agregar escala de marca, tipografia Plus Jakarta Sans y utilidades glass"
```

---

### Task 2: Clientes Supabase con soporte de cookies (SSR)

**Files:**
- Modify: `apps/rotulos/src/lib/supabase/server.ts`
- Create: `apps/rotulos/src/lib/supabase/middleware.ts`
- Test: `apps/rotulos/src/__tests__/supabase-server-client.test.ts`
- Test: `apps/rotulos/src/__tests__/supabase-middleware-client.test.ts`

**Interfaces:**
- Consumes: `hasSupabaseEnv()` de `apps/rotulos/src/lib/supabase/client.ts:3` (ya existe).
- Produces: `createServerSupabaseClient(): Promise<SupabaseClient | null>` (para Server Components y Route Handlers) y `createMiddlewareSupabaseClient(request: NextRequest): { supabase: SupabaseClient | null; response: NextResponse }` (para `middleware.ts`). Las Tasks 4, 6 y 7 dependen de estas dos funciones.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// apps/rotulos/src/__tests__/supabase-server-client.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

describe("createServerSupabaseClient", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("retorna null si faltan las variables de entorno de Supabase", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const client = await createServerSupabaseClient();

    expect(client).toBeNull();

    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it("crea un cliente cuando las variables de entorno existen", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const client = await createServerSupabaseClient();

    expect(client).not.toBeNull();
  });
});
```

```ts
// apps/rotulos/src/__tests__/supabase-middleware-client.test.ts
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";

describe("createMiddlewareSupabaseClient", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("retorna supabase null si faltan las variables de entorno", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const request = new NextRequest("http://localhost/pedidos");

    const { supabase, response } = createMiddlewareSupabaseClient(request);

    expect(supabase).toBeNull();
    expect(response).toBeDefined();
  });

  it("crea un cliente cuando las variables de entorno existen", () => {
    const request = new NextRequest("http://localhost/pedidos");

    const { supabase } = createMiddlewareSupabaseClient(request);

    expect(supabase).not.toBeNull();
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `cd apps/rotulos && npx vitest run src/__tests__/supabase-server-client.test.ts src/__tests__/supabase-middleware-client.test.ts`
Expected: FAIL — `createServerSupabaseClient` y `createMiddlewareSupabaseClient` no existen todavía.

- [ ] **Step 3: Implementar `createServerSupabaseClient`**

Reemplazar el contenido completo de `apps/rotulos/src/lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "./client";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function createServerSupabaseClient() {
  if (!hasSupabaseEnv()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Los Server Components no pueden escribir cookies; el middleware ya refresca la sesion.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Implementar `createMiddlewareSupabaseClient`**

```ts
// apps/rotulos/src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "./client";

export function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) return { supabase: null, response };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  return { supabase, response };
}
```

- [ ] **Step 5: Correr los tests y confirmar que pasan**

Run: `cd apps/rotulos && npx vitest run src/__tests__/supabase-server-client.test.ts src/__tests__/supabase-middleware-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Lint + typecheck**

Run: `cd apps/rotulos && npm run lint && npm run typecheck`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/rotulos/src/lib/supabase/server.ts apps/rotulos/src/lib/supabase/middleware.ts apps/rotulos/src/__tests__/supabase-server-client.test.ts apps/rotulos/src/__tests__/supabase-middleware-client.test.ts
git commit -m "feat(rotulos): agregar clientes Supabase SSR con soporte de cookies para middleware y route handlers"
```

---

### Task 3: Migración SQL de la allowlist

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607170001_create_allowed_users.sql`

**Interfaces:**
- Produces: tabla `public.allowed_users(email text primary key, created_at timestamptz)`, consumida por el middleware de la Task 4.

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- apps/rotulos/supabase/migrations/202607170001_create_allowed_users.sql
create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;

create policy "usuario autenticado lee su propia fila"
  on public.allowed_users
  for select
  using (email = (auth.jwt() ->> 'email'));
```

- [ ] **Step 2: Verificar el archivo (no hay test automatizado — igual que las 3 migraciones existentes del proyecto)**

Run: `cd apps/rotulos && cat supabase/migrations/202607170001_create_allowed_users.sql`
Expected: el contenido de arriba, sin errores de sintaxis visibles.

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607170001_create_allowed_users.sql
git commit -m "feat(rotulos): agregar migracion de la tabla allowed_users"
```

**Nota para el usuario (no es un step del plan, es una acción manual tuya):** esta migración no se aplica sola. Debes correr `npx supabase db push` (o pegarla en el SQL editor del dashboard de Supabase) contra el proyecto `purpleshop`, **y luego insertar tu propio correo** en `allowed_users` antes de que el middleware de la Task 4 llegue a producción — si no, quedarás bloqueado de tu propia app.

---

### Task 4: Middleware de gating (sesión + allowlist)

**Files:**
- Create: `apps/rotulos/src/middleware.ts`
- Test: `apps/rotulos/src/__tests__/middleware.test.ts`

**Interfaces:**
- Consumes: `createMiddlewareSupabaseClient` de `apps/rotulos/src/lib/supabase/middleware.ts` (Task 2), tabla `allowed_users` (Task 3).
- Produces: función `isPublicPath(pathname: string): boolean` exportada (testeable en aislamiento) y el `middleware` de Next.js en sí.

- [ ] **Step 1: Escribir el test que falla**

```ts
// apps/rotulos/src/__tests__/middleware.test.ts
import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/middleware";

describe("isPublicPath", () => {
  it("trata /login y sus subrutas como publicas", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/algo")).toBe(true);
  });

  it("trata /auth/callback y sus subrutas como publicas", () => {
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("trata rutas privadas y rutas parecidas a /login como no publicas", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/pedidos")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/middleware.test.ts`
Expected: FAIL — `src/middleware.ts` no existe.

- [ ] **Step 3: Implementar el middleware**

```ts
// apps/rotulos/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const { supabase, response } = createMiddlewareSupabaseClient(request);
  if (!supabase) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: allowed } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?unauthorized=1", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/middleware.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint + typecheck**

Run: `cd apps/rotulos && npm run lint && npm run typecheck`
Expected: sin errores. (La lógica de sesión/allowlist en sí — líneas que llaman a `supabase.auth.getUser()` y `.from("allowed_users")` — no tiene test unitario: requiere una sesión Azure real, que el spec ya marca como no verificable en este entorno hasta que el usuario configure el provider. Se valida manualmente en la Task 10 una vez el shell esté completo.)

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/middleware.ts apps/rotulos/src/__tests__/middleware.test.ts
git commit -m "feat(rotulos): agregar middleware de gating por sesion y allowlist"
```

---

### Task 5: Separar el shell en un route group `(app)`

**Files:**
- Modify: `apps/rotulos/src/app/layout.tsx`
- Create: `apps/rotulos/src/app/(app)/layout.tsx`
- Move: `apps/rotulos/src/app/page.tsx` → `apps/rotulos/src/app/(app)/page.tsx`
- Move: `apps/rotulos/src/app/clientes/` → `apps/rotulos/src/app/(app)/clientes/`
- Move: `apps/rotulos/src/app/configuracion/` → `apps/rotulos/src/app/(app)/configuracion/`
- Move: `apps/rotulos/src/app/crear/` → `apps/rotulos/src/app/(app)/crear/`
- Move: `apps/rotulos/src/app/historial/` → `apps/rotulos/src/app/(app)/historial/`
- Move: `apps/rotulos/src/app/inventario/` → `apps/rotulos/src/app/(app)/inventario/`
- Move: `apps/rotulos/src/app/pedidos/` → `apps/rotulos/src/app/(app)/pedidos/`
- Move: `apps/rotulos/src/app/reportes/` → `apps/rotulos/src/app/(app)/reportes/`

**Interfaces:**
- Produces: `/login` (Task 7) queda fuera de `AppShell` porque solo las rutas dentro de `(app)/` lo heredan. Las URLs no cambian (los route groups de Next.js no aparecen en la URL).

- [ ] **Step 1: Mover las páginas al route group**

```bash
cd apps/rotulos
mkdir -p "src/app/(app)"
git mv src/app/page.tsx "src/app/(app)/page.tsx"
git mv src/app/clientes "src/app/(app)/clientes"
git mv src/app/configuracion "src/app/(app)/configuracion"
git mv src/app/crear "src/app/(app)/crear"
git mv src/app/historial "src/app/(app)/historial"
git mv src/app/inventario "src/app/(app)/inventario"
git mv src/app/pedidos "src/app/(app)/pedidos"
git mv src/app/reportes "src/app/(app)/reportes"
```

- [ ] **Step 2: Crear el layout del grupo con `AppShell`**

```tsx
// apps/rotulos/src/app/(app)/layout.tsx
import { AppShell } from "@/components/app-shell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 3: Quitar `AppShell` del layout raíz**

Reemplazar el contenido completo de `apps/rotulos/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PurpleShop",
  description: "Gestion de pedidos, clientes y rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={plusJakartaSans.variable}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verificar que el build resuelve las rutas correctamente**

Run: `cd apps/rotulos && npm run build`
Expected: build exitoso, y en el resumen de rutas de Next (`Route (app)`) siguen apareciendo `/`, `/pedidos`, `/pedidos/nuevo`, `/clientes`, `/inventario`, `/reportes`, `/crear`, `/historial`, `/configuracion` — sin `(app)` visible en ninguna URL.

- [ ] **Step 5: Correr la suite completa (las rutas movidas no cambian imports de componentes, así que no debería romper nada)**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm run test`
Expected: todo verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(rotulos): mover las paginas privadas a un route group (app) para aislar el shell del login"
```

---

### Task 6: Ruta de callback de OAuth

**Files:**
- Create: `apps/rotulos/src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` de la Task 2.
- Produces: endpoint `GET /auth/callback` que la Task 7 referencia como `redirectTo`.

- [ ] **Step 1: Implementar el route handler**

```ts
// apps/rotulos/src/app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `cd apps/rotulos && npm run lint && npm run typecheck`
Expected: sin errores.

(Sin test unitario: es un route handler de 10 líneas que delega el trabajo real al SDK de Supabase, y ningún route handler del proyecto tiene tests hoy — ver `src/app/api/`. Se verifica manualmente en la Task 10 junto con el flujo de login completo, una vez el usuario configure el provider Azure.)

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/src/app/auth/callback/route.ts
git commit -m "feat(rotulos): agregar el route handler de callback de OAuth"
```

---

### Task 7: Pantalla de login con Microsoft OAuth

**Files:**
- Create: `apps/rotulos/src/app/login/page.tsx`
- Create: `apps/rotulos/src/app/login/login-card.tsx`
- Create: `apps/rotulos/public/microsoft-logo.svg`
- Modify: `apps/rotulos/src/app/globals.css`
- Test: `apps/rotulos/src/__tests__/login-card.test.tsx`

**Interfaces:**
- Consumes: `createClient`/`hasSupabaseEnv` de `apps/rotulos/src/lib/supabase/client.ts` (ya existen), `/auth/callback` de la Task 6.
- Produces: ruta `/login` (fuera de `AppShell` gracias a la Task 5), a la que el middleware de la Task 4 redirige.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// apps/rotulos/src/__tests__/login-card.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginCard } from "@/app/login/login-card";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  hasSupabaseEnv: () => true,
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("LoginCard", () => {
  it("invoca signInWithOAuth con el provider azure y deshabilita el boton mientras conecta", async () => {
    signInWithOAuth.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginCard initialUnauthorized={false} />);

    const button = screen.getByRole("button", { name: /continuar con microsoft/i });
    await user.click(button);

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: { redirectTo: expect.stringContaining("/auth/callback") },
    });
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("muestra un error si el OAuth falla", async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: "boom" } });
    const user = userEvent.setup();
    render(<LoginCard initialUnauthorized={false} />);

    await user.click(screen.getByRole("button", { name: /continuar con microsoft/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/no se pudo iniciar sesion/i),
    );
  });

  it("muestra el aviso de cuenta no autorizada cuando initialUnauthorized es true", () => {
    render(<LoginCard initialUnauthorized={true} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/no tiene acceso/i);
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/login-card.test.tsx`
Expected: FAIL — `@/app/login/login-card` no existe.

- [ ] **Step 3: Crear el ícono de Microsoft**

```svg
<!-- apps/rotulos/public/microsoft-logo.svg -->
<svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
</svg>
```

- [ ] **Step 4: Implementar `LoginCard`**

```tsx
// apps/rotulos/src/app/login/login-card.tsx
"use client";

import { useState } from "react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

type LoginStatus = "idle" | "loading" | "error" | "unauthorized";

export function LoginCard({ initialUnauthorized }: { initialUnauthorized: boolean }) {
  const [status, setStatus] = useState<LoginStatus>(initialUnauthorized ? "unauthorized" : "idle");
  const supabase = createClient();

  async function signInWithMicrosoft() {
    if (!supabase) return;
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setStatus("error");
  }

  return (
    <div className="login-card">
      <h2 className="text-section-title">Bienvenido de vuelta</h2>
      <p className="login-card-subtitle">Inicia sesion con tu cuenta de Microsoft para continuar.</p>

      {!hasSupabaseEnv() ? (
        <p className="login-card-error" role="alert">
          La aplicacion no tiene configurada la conexion con la base de datos.
        </p>
      ) : (
        <button
          type="button"
          className="login-microsoft-btn"
          onClick={signInWithMicrosoft}
          disabled={status === "loading"}
        >
          <img src="/microsoft-logo.svg" alt="" width={20} height={20} aria-hidden="true" />
          {status === "loading" ? "Conectando..." : "Continuar con Microsoft"}
        </button>
      )}

      {status === "error" ? (
        <p className="login-card-error" role="alert">
          No se pudo iniciar sesion. Intenta de nuevo.
        </p>
      ) : null}

      {status === "unauthorized" ? (
        <p className="login-card-error" role="alert">
          Esta cuenta no tiene acceso a PurpleShop.
        </p>
      ) : null}

      <p className="login-card-notice">Acceso restringido a cuentas autorizadas de PurpleShop.</p>
    </div>
  );
}
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/login-card.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Implementar la página de login**

```tsx
// apps/rotulos/src/app/login/page.tsx
import type { Metadata } from "next";
import { LoginCard } from "./login-card";

export const metadata: Metadata = {
  title: "Iniciar sesion — PurpleShop",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ unauthorized?: string }>;
}) {
  const { unauthorized } = await searchParams;

  return (
    <main className="login-screen">
      <section className="login-hero">
        <div className="login-hero-brand">
          <img src="/purple-shop-logo.png" alt="Purple Shop" width={64} height={64} />
          <span>Purple Shop</span>
        </div>
        <h1 className="text-display">Gestiona pedidos, clientes y envios en un solo lugar</h1>
        <ul className="login-benefits">
          <li>Pedidos e inventario sincronizados en tiempo real</li>
          <li>Rotulos de envio listos para imprimir en segundos</li>
          <li>Reportes claros para tomar decisiones rapido</li>
        </ul>
      </section>
      <section className="login-panel">
        <LoginCard initialUnauthorized={unauthorized === "1"} />
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Agregar el CSS de la pantalla de login**

Al final de `apps/rotulos/src/app/globals.css`, agregar:

```css
/* ==================== LOGIN ==================== */
.login-screen {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 100vh;
}

.login-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 48px;
  color: var(--text-inverse);
  background: var(--gradient-brand, linear-gradient(135deg, var(--purple-800) 0%, var(--purple-600) 60%, var(--color-secondary) 100%));
}

.login-hero-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  font-weight: 800;
}

.login-hero .text-display {
  color: var(--text-inverse);
  max-width: 26ch;
}

.login-benefits {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-weight: 600;
  opacity: 0.95;
}

.login-benefits li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-benefits li::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--text-inverse);
  flex-shrink: 0;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: var(--background);
}

.login-card {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 380px;
  padding: 32px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(17, 24, 39, 0.08);
}

.login-card-subtitle {
  margin: -6px 0 4px;
  color: var(--text-secondary);
}

.login-microsoft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 700;
  cursor: pointer;
}

.login-microsoft-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-microsoft-btn:hover:not(:disabled) {
  background: var(--hover-bg);
}

.login-card-error {
  margin: 0;
  color: var(--danger-color);
  font-size: 0.88rem;
  font-weight: 700;
}

.login-card-notice {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .login-screen {
    grid-template-columns: 1fr;
  }

  .login-hero {
    padding: 32px 24px;
    min-height: 260px;
  }

  .login-hero .text-display {
    font-size: 1.5rem;
    max-width: none;
  }
}
```

- [ ] **Step 8: Lint + typecheck + build**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm run build`
Expected: sin errores; `/login` aparece en el resumen de rutas del build.

- [ ] **Step 9: Commit**

```bash
git add apps/rotulos/src/app/login apps/rotulos/public/microsoft-logo.svg apps/rotulos/src/app/globals.css apps/rotulos/src/__tests__/login-card.test.tsx
git commit -m "feat(rotulos): agregar pantalla de login con Microsoft OAuth"
```

---

### Task 8: `UserMenu` (reemplaza `AuthPanel`)

**Files:**
- Create: `apps/rotulos/src/components/user-menu.tsx`
- Modify: `apps/rotulos/src/app/globals.css`
- Test: `apps/rotulos/src/__tests__/user-menu.test.tsx`

**Interfaces:**
- Consumes: `createClient`/`hasSupabaseEnv` de `apps/rotulos/src/lib/supabase/client.ts`, `useRouter` de `next/navigation`.
- Produces: componente `UserMenu` que la Task 10 monta en el sidebar y el topbar del `AppShell`, reemplazando a `AuthPanel`.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// apps/rotulos/src/__tests__/user-menu.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/user-menu";

const getUser = vi.fn();
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
const signOut = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/supabase/client", () => ({
  hasSupabaseEnv: () => true,
  createClient: () => ({ auth: { getUser, onAuthStateChange, signOut } }),
}));

describe("UserMenu", () => {
  it("muestra el correo del usuario autenticado y sus iniciales", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "vendedor@purpleshop.co" } } });

    render(<UserMenu />);

    await waitFor(() => expect(screen.getByText("vendedor@purpleshop.co")).toBeInTheDocument());
    expect(screen.getByText("VE")).toBeInTheDocument();
  });

  it("no renderiza nada si no hay usuario autenticado", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { container } = render(<UserMenu />);

    await waitFor(() => expect(getUser).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("cierra sesion y redirige a /login al hacer click en Cerrar sesion", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "vendedor@purpleshop.co" } } });
    const user = userEvent.setup();

    render(<UserMenu />);
    await waitFor(() => expect(screen.getByText("vendedor@purpleshop.co")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /cerrar sesion/i }));

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/user-menu.test.tsx`
Expected: FAIL — `@/components/user-menu` no existe.

- [ ] **Step 3: Implementar `UserMenu`**

```tsx
// apps/rotulos/src/components/user-menu.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!hasSupabaseEnv() || !email) return null;

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="user-menu">
      <span className="user-menu-avatar" aria-hidden="true">{initials}</span>
      <span className="user-menu-email">{email}</span>
      <button type="button" className="user-menu-signout" onClick={signOut}>
        Cerrar sesion
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/user-menu.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Agregar el CSS**

Al final de `apps/rotulos/src/app/globals.css`, agregar:

```css
/* ==================== USER MENU ==================== */
.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-menu-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--purple-100);
  color: var(--purple-800);
  font-size: 0.72rem;
  font-weight: 800;
  flex-shrink: 0;
}

[data-theme="dark"] .user-menu-avatar {
  background: var(--purple-900);
  color: var(--purple-200);
}

.user-menu-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.user-menu-signout {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-primary);
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.user-menu-signout:hover {
  background: var(--hover-bg);
}
```

- [ ] **Step 6: Lint + typecheck**

Run: `cd apps/rotulos && npm run lint && npm run typecheck`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/rotulos/src/components/user-menu.tsx apps/rotulos/src/app/globals.css apps/rotulos/src/__tests__/user-menu.test.tsx
git commit -m "feat(rotulos): agregar componente UserMenu"
```

---

### Task 9: `SyncStatus`

**Files:**
- Create: `apps/rotulos/src/components/sync-status.tsx`
- Modify: `apps/rotulos/src/app/globals.css`
- Test: `apps/rotulos/src/__tests__/sync-status.test.tsx`

**Interfaces:**
- Produces: componente `SyncStatus` que la Task 10 monta en el sidebar y el topbar del `AppShell`.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// apps/rotulos/src/__tests__/sync-status.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SyncStatus } from "@/components/sync-status";

describe("SyncStatus", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("muestra 'Todo al dia' cuando hay conexion", async () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    render(<SyncStatus />);

    await waitFor(() => expect(screen.getByText("Todo al dia")).toBeInTheDocument());
  });

  it("muestra 'Sin conexion' cuando el navegador esta offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    render(<SyncStatus />);

    await waitFor(() => expect(screen.getByText("Sin conexion")).toBeInTheDocument());
  });

  it("reacciona al evento offline en tiempo real", async () => {
    render(<SyncStatus />);
    await waitFor(() => expect(screen.getByText("Todo al dia")).toBeInTheDocument());

    window.dispatchEvent(new Event("offline"));

    await waitFor(() => expect(screen.getByText("Sin conexion")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/sync-status.test.tsx`
Expected: FAIL — `@/components/sync-status` no existe.

- [ ] **Step 3: Implementar `SyncStatus`**

```tsx
// apps/rotulos/src/components/sync-status.tsx
"use client";

import { useEffect, useState } from "react";

type ConnectionState = "online" | "offline";

export function SyncStatus() {
  const [state, setState] = useState<ConnectionState>("online");

  useEffect(() => {
    setState(navigator.onLine ? "online" : "offline");
    const handleOnline = () => setState("online");
    const handleOffline = () => setState("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const label = state === "online" ? "Todo al dia" : "Sin conexion";

  return (
    <span className="sync-status" data-state={state} title={label}>
      <span className="sync-status-dot" aria-hidden="true" />
      <span className="sync-status-label">{label}</span>
    </span>
  );
}
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/sync-status.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Agregar el CSS**

Al final de `apps/rotulos/src/app/globals.css`, agregar:

```css
/* ==================== SYNC STATUS ==================== */
.sync-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.sync-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--success-color);
}

.sync-status[data-state="offline"] .sync-status-dot {
  background: var(--danger-color);
}

.sync-status-label {
  white-space: nowrap;
}
```

- [ ] **Step 6: Lint + typecheck**

Run: `cd apps/rotulos && npm run lint && npm run typecheck`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/rotulos/src/components/sync-status.tsx apps/rotulos/src/app/globals.css apps/rotulos/src/__tests__/sync-status.test.tsx
git commit -m "feat(rotulos): agregar componente SyncStatus"
```

---

### Task 10: Reescribir `AppShell` — navegación agrupada, colapso, drawer accesible, topbar contextual

**Files:**
- Modify: `apps/rotulos/src/components/app-shell.tsx`
- Delete: `apps/rotulos/src/components/auth-panel.tsx`
- Modify: `apps/rotulos/src/app/globals.css`
- Test: `apps/rotulos/src/__tests__/app-shell.test.tsx`

**Interfaces:**
- Consumes: `UserMenu` (Task 8), `SyncStatus` (Task 9), `usePathname` de `next/navigation`.
- Produces: `AppShell`, montado por `apps/rotulos/src/app/(app)/layout.tsx` (Task 5) — es el componente final visible en todas las páginas privadas.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// apps/rotulos/src/__tests__/app-shell.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/pedidos" }));
vi.mock("@/components/user-menu", () => ({ UserMenu: () => <div>UserMenu</div> }));
vi.mock("@/components/sync-status", () => ({ SyncStatus: () => <div>SyncStatus</div> }));

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marca como activo el enlace de la ruta actual", () => {
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveClass("active");
  });

  it("muestra el titulo y la descripcion contextual de la pagina en el topbar", () => {
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Consulta y gestiona los pedidos registrados",
    );
  });

  it("contrae el sidebar y persiste la preferencia en localStorage", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /contraer menu/i }));

    expect(localStorage.getItem("purpleshop.sidebar-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: /expandir menu/i })).toBeInTheDocument();
  });

  it("abre el drawer movil, lo cierra con Escape y devuelve el foco al boton que lo abrio", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    const openBtn = screen.getByRole("button", { name: /abrir menu de navegacion/i });
    await user.click(openBtn);
    expect(screen.getByRole("navigation", { name: /navegacion movil/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("navigation", { name: /navegacion movil/i })).not.toBeInTheDocument();
    expect(openBtn).toHaveFocus();
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/app-shell.test.tsx`
Expected: FAIL — el `AppShell` actual no agrupa navegación, no tiene botón de colapso ni drawer con Escape.

- [ ] **Step 3: Reescribir `AppShell`**

```tsx
// apps/rotulos/src/components/app-shell.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  ClipboardList,
  Home,
  Menu,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { SyncStatus } from "@/components/sync-status";

const COLLAPSE_STORAGE_KEY = "purpleshop.sidebar-collapsed";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/pedidos/nuevo", label: "Nuevo pedido", icon: Receipt },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/inventario", label: "Inventario", icon: Archive },
      { href: "/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Envios",
    items: [
      { href: "/crear", label: "Crear rotulo", icon: Tags },
      { href: "/historial", label: "Historial", icon: PackagePlus },
    ],
  },
  {
    label: "Sistema",
    items: [{ href: "/configuracion", label: "Configuracion", icon: Settings }],
  },
];

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "Inicio", description: "Resumen de la operacion diaria" },
  "/pedidos/nuevo": { title: "Nuevo pedido", description: "Registra un pedido para un cliente" },
  "/pedidos": { title: "Pedidos", description: "Consulta y gestiona los pedidos registrados" },
  "/clientes": { title: "Clientes", description: "Historial y datos de contacto de tus clientes" },
  "/inventario": { title: "Inventario", description: "Productos, stock y movimientos" },
  "/reportes": { title: "Reportes", description: "Ventas, productos y tendencias" },
  "/crear": { title: "Crear rotulo", description: "Genera el rotulo de envio de un pedido" },
  "/historial": { title: "Historial", description: "Rotulos generados anteriormente" },
  "/configuracion": { title: "Configuracion", description: "Ajustes de la aplicacion" },
};

const DEFAULT_PAGE_META = { title: "PurpleShop", description: "Sistema de gestion de pedidos e inventario" };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function closeMobileDrawer() {
    setMobileOpen(false);
    mobileToggleRef.current?.focus();
  }

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileDrawer();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  const pageMeta = PAGE_META[pathname ?? ""] ?? DEFAULT_PAGE_META;

  return (
    <div className="legacy-app-shell">
      <aside className={`legacy-sidebar${collapsed ? " collapsed" : ""}`}>
        <div className="legacy-sidebar-header">
          <div className="legacy-brand">
            <Image src="/purple-shop-logo.png" alt="Purple Shop" width={40} height={40} priority />
            {!collapsed && (
              <div>
                <strong>Purple Shop</strong>
                <span>Sistema de Gestion</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="legacy-nav" aria-label="Navegacion principal">
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
              {!collapsed && <p className="sidebar-group-label">{group.label}</p>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    className={`nav-link${active ? " active" : ""}`}
                    href={item.href}
                    key={item.href}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="legacy-sidebar-footer">
          <SyncStatus />
          <UserMenu />
        </div>
      </aside>

      <div className="legacy-content-wrap">
        <header className="legacy-topbar">
          <div>
            <p>{pageMeta.title}</p>
            <h1>{pageMeta.description}</h1>
          </div>
          <div className="legacy-topbar-actions">
            <SyncStatus />
            <UserMenu />
          </div>
        </header>

        <header className="legacy-mobile-header">
          <div className="legacy-mobile-header-row">
            <div className="legacy-brand compact">
              <Image src="/purple-shop-logo.png" alt="Purple Shop" width={36} height={36} />
              <strong>Purple Shop</strong>
            </div>
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu de navegacion"
              ref={mobileToggleRef}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="mobile-drawer-backdrop" onClick={closeMobileDrawer}>
            <nav
              className="mobile-drawer"
              aria-label="Navegacion movil"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={closeMobileDrawer}
                aria-label="Cerrar menu de navegacion"
              >
                <X size={20} />
              </button>
              {NAV_GROUPS.map((group) => (
                <div className="sidebar-group" key={group.label}>
                  <p className="sidebar-group-label">{group.label}</p>
                  {group.items.map((item) => (
                    <Link
                      className="mobile-nav-link"
                      href={item.href}
                      key={item.href}
                      onClick={closeMobileDrawer}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        )}

        <div className="legacy-main">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Borrar `AuthPanel` (reemplazado por `UserMenu`)**

```bash
rm apps/rotulos/src/components/auth-panel.tsx
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/app-shell.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Agregar el CSS de navegación agrupada, colapso y drawer**

Al final de `apps/rotulos/src/app/globals.css`, agregar:

```css
/* ==================== SIDEBAR — grupos, colapso, drawer ==================== */
.legacy-sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-collapse-btn:hover {
  background: var(--hover-bg);
  color: var(--color-primary);
}

.sidebar-group {
  display: grid;
  gap: 4px;
  margin-bottom: 18px;
}

.sidebar-group-label {
  margin: 0 0 4px;
  padding: 0 12px;
  color: var(--text-tertiary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav-link.active {
  background: var(--purple-50);
  color: var(--purple-700);
  border-left: 3px solid var(--purple-600);
  padding-left: 9px;
}

[data-theme="dark"] .nav-link.active {
  background: var(--purple-900);
  color: var(--purple-200);
}

.legacy-sidebar.collapsed {
  width: 88px;
  padding: 22px 12px;
}

.legacy-sidebar.collapsed ~ .legacy-content-wrap {
  padding-left: 88px;
}

.legacy-sidebar.collapsed .nav-link {
  justify-content: center;
}

.legacy-mobile-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-nav-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
}

.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--overlay, rgba(30, 20, 48, 0.5));
}

.mobile-drawer {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 41;
  width: min(84vw, 320px);
  overflow-y: auto;
  background: var(--surface);
  padding: 20px;
  box-shadow: 10px 0 30px rgba(17, 24, 39, 0.16);
}

.mobile-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
}
```

- [ ] **Step 7: Actualizar la regla responsive existente que ocultaba `.legacy-mobile-nav`**

En `apps/rotulos/src/app/globals.css`, dentro del bloque `@media (max-width: 1024px)` ya existente, la clase `.legacy-mobile-nav` y `.mobile-nav-link` (usadas por el drawer horizontal viejo) ya no se renderizan porque el nuevo drawer no usa esas clases — dejar el bloque como está (no rompe nada, simplemente queda sin efecto); no se borra código de otros módulos que no se están tocando en esta fase.

- [ ] **Step 8: Verificación completa**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm run test && npm run build`
Expected: todo verde, incluida la suite completa (los tests de `auth-panel` no existían, así que borrar el archivo no rompe nada).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(rotulos): reescribir AppShell con navegacion agrupada, colapso, drawer accesible y topbar contextual"
```

---

## Verificación manual final (no automatizable en este entorno)

Una vez el usuario haya configurado el provider `azure` en el dashboard de Supabase Auth y poblado `allowed_users` con su propio correo:

1. Entrar a `/pedidos` sin sesión → debe redirigir a `/login`.
2. Click en "Continuar con Microsoft" → completar el login real → debe volver a `/` con el shell visible.
3. Cerrar sesión desde `UserMenu` → debe volver a `/login`.
4. Probar con una cuenta Microsoft que NO esté en `allowed_users` → debe volver a `/login?unauthorized=1` con el aviso visible, y la sesión debe quedar cerrada (verificar que un refresh de `/` vuelve a pedir login).
5. Colapsar/expandir el sidebar, abrir/cerrar el drawer móvil (click y Escape), alternar claro/oscuro — en desktop y en un viewport de 375px.

## Self-Review

**Cobertura del spec:** tokens de marca (Task 1), Microsoft OAuth vía Supabase Auth (Tasks 6-7), allowlist server-side (Task 3-4), gating de rutas (Tasks 4-5), sidebar agrupado/colapsable con estado activo (Task 10), UserMenu sin mencionar "Supabase" (Task 8), SyncStatus discreto (Task 9), login split desktop/mobile con estados de carga/error/no-autorizado (Task 7) — todas las secciones del spec de Fase 1 tienen una tarea que las implementa.

**Placeholders:** ninguno — cada step tiene código completo, comandos exactos y resultado esperado.

**Consistencia de tipos/nombres:** `createServerSupabaseClient` (Task 2) se usa igual en Task 6; `createMiddlewareSupabaseClient` (Task 2) se usa igual en Task 4; `isPublicPath` (Task 4) coincide entre implementación y test; `UserMenu`/`SyncStatus` (Tasks 8-9) se importan con el mismo nombre en Task 10; `COLLAPSE_STORAGE_KEY` (`purpleshop.sidebar-collapsed`) es el mismo string en la implementación y en el test de la Task 10.
