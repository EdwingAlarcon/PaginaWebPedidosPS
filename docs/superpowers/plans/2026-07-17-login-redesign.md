# Rediseño de /login (apps/rotulos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la pantalla `/login` de `apps/rotulos` a una composición de tarjeta central premium sobre fondo neutro, corrigiendo el bug de herencia de `--font-sans` que hace que todo el sitio caiga a Times New Roman en vez de Inter.

**Architecture:** Cambio de una línea en `layout.tsx` (mueve la clase de fuente de `<body>` a `<html>`) + reescritura de `login/page.tsx` y `login/login-card.tsx` (nueva composición, copy corregido) + reemplazo del bloque `LOGIN` en `globals.css` (fondo con wash radial sutil, sin el panel de gradiente grande). Sin nuevas dependencias, sin tocar autenticación ni otras pantallas.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 3, TypeScript, Supabase (`@supabase/ssr`), Vitest.

## Global Constraints

- No modificar autenticación Microsoft/Supabase, callbacks, middleware, rutas ni la lista de usuarios autorizados.
- No modificar ningún módulo/pantalla fuera de `login/page.tsx`, `login/login-card.tsx`, el bloque `LOGIN` de `globals.css`, y la línea de `layout.tsx` descrita abajo.
- No modificar las clases compartidas `.text-display`, `.text-page-title`, `.text-section-title`, `.text-card-title` (usadas por `modal.tsx`, `drawer.tsx`, `card.tsx`, `confirm-dialog.tsx`, `(app)/page.tsx`).
- Sin nuevas dependencias npm.
- Sin placeholders de contenido.
- Copy exacto (con tildes correctas) según el spec: `docs/superpowers/specs/2026-07-17-login-redesign-design.md`.
- Botón Microsoft: 44–48px de alto (usar `Button size="lg"` existente = 44px, ya cumple el rango; no crear una variante nueva).
- Pesos tipográficos en el login: 400 texto normal, 500 etiquetas/auxiliares, 600 botón y títulos — nunca 700+/800/900.

---

### Task 1: Fix del bug de herencia de `--font-sans`

**Files:**
- Modify: `apps/rotulos/src/app/layout.tsx:20`

**Interfaces:**
- Consumes: nada (cambio autocontenido).
- Produces: `--font-inter` disponible en `:root` (`<html>`), de donde `globals.css:42` (`--font-sans: var(--font-inter), ...`) ya lo consume. No cambia ninguna API pública.

**Contexto del bug:** `globals.css` línea 42 define `--font-sans: var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;` dentro de `:root`. Pero `layout.tsx` aplica la clase que define `--font-inter` en `<body>`, un descendiente de `:root`. Como las custom properties CSS heredan el *valor computado*, y `--font-inter` no existe todavía en `:root` cuando se computa `--font-sans` ahí, `--font-sans` se computa inválido en `:root` y ese valor inválido es lo que hereda `<body>` — aunque `<body>` sí defina `--font-inter` correctamente, ya es tarde. Verificado en producción: `getComputedStyle(document.body).fontFamily` devuelve `"Times New Roman"`.

- [ ] **Step 1: Leer el archivo actual para confirmar el estado**

El contenido actual de `apps/rotulos/src/app/layout.tsx` es:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PurpleShop",
  description: "Gestion de pedidos, clientes y rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Mover `inter.variable` de `<body>` a `<html>`**

Reemplazar las líneas 19–23 completas por:

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar con typecheck que no rompe tipos**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores (0 exit code).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/layout.tsx
git commit -m "fix(rotulos): mover la clase de Inter a <html> para que --font-sans herede --font-inter correctamente

--font-sans se definia en :root referenciando --font-inter, pero --font-inter
solo existia en <body> (descendiente de :root). Las custom properties CSS
heredan el valor computado, asi que --font-sans se computaba invalido en
:root y ese valor invalido era lo que heredaba todo el arbol, cayendo a la
fuente serif por defecto del navegador en todo el sitio."
```

---

### Task 2: Reescribir el bloque `LOGIN` de `globals.css`

**Files:**
- Modify: `apps/rotulos/src/app/globals.css:869-945` (bloque completo `/* ==================== LOGIN ==================== */` hasta el cierre de su media query, justo antes de `/* ==================== USER MENU ==================== */`)
- Test: `apps/rotulos/src/__tests__/design-tokens.test.ts` (regresión, no se modifica)

**Interfaces:**
- Consumes: tokens existentes `--background`, `--purple-100`, `--purple-50`, `--purple-900`, `--purple-950`.
- Produces: clases `.login-screen`, `.login-theme-toggle`, `.login-card` — consumidas por Task 4 (`login/page.tsx`).

- [ ] **Step 1: Confirmar que ninguna otra pantalla usa las clases que se van a borrar**

Run: `cd apps/rotulos && grep -rn "login-hero\|login-benefits\|login-panel" src --include="*.tsx"`
Expected: únicamente coincidencias dentro de `src/app/login/page.tsx` (que se reescribe en Task 4). Si aparece algo en otro archivo, detenerse y no continuar esta tarea.

- [ ] **Step 2: Reemplazar el bloque `LOGIN` completo**

Buscar en `apps/rotulos/src/app/globals.css` el bloque que empieza en:

```css
/* ==================== LOGIN ==================== */
.login-screen {
```

y termina justo antes de:

```css
/* ==================== USER MENU ==================== */
```

Reemplazar todo ese rango (incluye `.login-screen`, `.login-theme-toggle`, `.login-hero`, `.login-hero-brand`, `.login-hero .text-display`, `.login-benefits`, `.login-benefits li`, `.login-panel`, y su `@media (max-width: 900px)`) por:

```css
/* ==================== LOGIN ==================== */
.login-screen {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
  background: var(--background);
}

.login-screen::before {
  content: "";
  position: absolute;
  inset: -20%;
  z-index: 0;
  background:
    radial-gradient(circle at 28% 22%, var(--purple-100) 0%, transparent 45%),
    radial-gradient(circle at 78% 78%, var(--purple-50) 0%, transparent 42%);
  opacity: 0.8;
  pointer-events: none;
}

[data-theme="dark"] .login-screen::before {
  background:
    radial-gradient(circle at 28% 22%, var(--purple-900) 0%, transparent 45%),
    radial-gradient(circle at 78% 78%, var(--purple-950) 0%, transparent 42%);
  opacity: 0.4;
}

.login-theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
}

.login-card {
  position: relative;
  z-index: 1;
}

@media (max-width: 480px) {
  .login-screen {
    padding: 0;
  }

  .login-card {
    max-width: none;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
```

- [ ] **Step 3: Correr la suite de tests existente (regresión)**

Run: `cd apps/rotulos && npm run test`
Expected: `design-tokens.test.ts` sigue en verde (no referencia clases de login, solo tokens y `.text-*` globales que no se tocaron). Todo el resto de la suite también debe seguir pasando (esta tarea no toca componentes ni lógica).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/globals.css
git commit -m "feat(rotulos): reemplazar el panel de gradiente del login por una tarjeta central con fondo neutro"
```

---

### Task 3: Reescribir `login/login-card.tsx`

**Files:**
- Modify: `apps/rotulos/src/app/login/login-card.tsx` (archivo completo)

**Interfaces:**
- Consumes: `createClient`/`hasSupabaseEnv` de `@/lib/supabase/client`, `Button` de `@/components/ui/button` (variant `secondary`, size `lg` = 44px), `Alert` de `@/components/ui/alert` (variants `danger`/`warning`).
- Produces: `export function LoginCard({ initialUnauthorized }: { initialUnauthorized: boolean })` — misma firma que antes (no rompe a quien la consume). **Ya no renderiza su propio contenedor de tarjeta** (antes tenía `<div className="w-full max-w-[440px] rounded-lg border ...">` como raíz) — ahora renderiza solo el contenido interno, porque Task 4 mueve el contenedor de tarjeta a `page.tsx` para poder anteponerle el lockup de marca y los beneficios dentro de la misma tarjeta.

- [ ] **Step 1: Reemplazar el archivo completo**

Contenido completo de `apps/rotulos/src/app/login/login-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
    <div>
      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.01em] text-foreground">
        Inicia sesión
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Accede con tu cuenta Microsoft autorizada para continuar.
      </p>

      <div className="mt-6">
        {!hasSupabaseEnv() ? (
          <Alert variant="danger">La aplicación no tiene configurada la conexión con la base de datos.</Alert>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={signInWithMicrosoft}
            disabled={status === "loading"}
            loading={status === "loading"}
          >
            {status !== "loading" && (
              <img src="/microsoft-logo.svg" alt="" width={18} height={18} aria-hidden="true" className="size-[18px]" />
            )}
            {status === "loading" ? "Conectando..." : "Continuar con Microsoft"}
          </Button>
        )}
      </div>

      {status === "error" ? (
        <div className="mt-4">
          <Alert variant="danger">No se pudo iniciar sesión. Intenta de nuevo.</Alert>
        </div>
      ) : null}

      {status === "unauthorized" ? (
        <div className="mt-4">
          <Alert variant="warning">Esta cuenta no tiene acceso a PurpleShop.</Alert>
        </div>
      ) : null}

      <p className="mt-5 text-center text-xs font-medium text-foreground-muted">
        Acceso exclusivo para personal autorizado de PurpleShop.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores. (El componente `LoginPage` en `page.tsx` todavía no se actualizó en este punto — se actualiza en Task 4 — así que puede haber un desajuste visual temporal, pero no de tipos, ya que la firma de `LoginCard` no cambió.)

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/src/app/login/login-card.tsx
git commit -m "feat(rotulos): simplificar LoginCard a solo el formulario, boton de 44px y copy con tildes corregidas"
```

---

### Task 4: Reescribir `login/page.tsx`

**Files:**
- Modify: `apps/rotulos/src/app/login/page.tsx` (archivo completo)

**Interfaces:**
- Consumes: `LoginCard` de `./login-card` (Task 3), `ThemeToggle` de `@/components/theme-toggle`, clases `.login-screen`/`.login-theme-toggle`/`.login-card` de `globals.css` (Task 2), iconos `PackageCheck`/`Tags`/`BarChart3` de `lucide-react`.
- Produces: `export default async function LoginPage(...)` — misma firma que antes (Next.js App Router page, recibe `searchParams: Promise<{ unauthorized?: string }>`).

- [ ] **Step 1: Reemplazar el archivo completo**

Contenido completo de `apps/rotulos/src/app/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PackageCheck, Tags, BarChart3 } from "lucide-react";
import { LoginCard } from "./login-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión — PurpleShop",
};

const BENEFITS = [
  { icon: PackageCheck, label: "Controla pedidos e inventario en tiempo real." },
  { icon: Tags, label: "Genera rótulos listos para imprimir." },
  { icon: BarChart3, label: "Consulta información clara de tu operación." },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ unauthorized?: string }>;
}) {
  const { unauthorized } = await searchParams;

  return (
    <main className="login-screen">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-card w-full max-w-[440px] rounded-lg border border-border bg-surface p-9 shadow-card">
        <div className="flex items-center gap-2.5">
          <img
            src="/purple-shop-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-[10px] object-contain"
          />
          <span className="text-lg font-semibold text-foreground">PurpleShop</span>
        </div>

        <p className="mt-3.5 text-base leading-relaxed text-foreground-muted">
          Gestiona tus pedidos, clientes, inventario y envíos desde un solo lugar.
        </p>

        <ul className="mt-4 grid gap-2">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13px] font-medium text-foreground-muted">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <hr className="my-6 border-border" />

        <LoginCard initialUnauthorized={unauthorized === "1"} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores.

- [ ] **Step 3: Lint**

Run: `cd apps/rotulos && npm run lint`
Expected: sin errores (0 exit code).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/login/page.tsx
git commit -m "feat(rotulos): nueva composicion de tarjeta central para /login (opcion A del spec)"
```

---

### Task 5: Suite completa + build

**Files:** ninguno (solo verificación, no debería requerir cambios de código si las tareas 1-4 se hicieron bien; si algo falla, corregir el archivo correspondiente de las tareas 1-4 y volver a correr).

**Interfaces:** N/A — tarea de verificación.

- [ ] **Step 1: Test suite completa**

Run: `cd apps/rotulos && npm run test`
Expected: todos los tests en verde, incluido `design-tokens.test.ts`.

- [ ] **Step 2: Typecheck completo**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores.

- [ ] **Step 3: Lint completo**

Run: `cd apps/rotulos && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Build de producción**

Run: `cd apps/rotulos && npm run build`
Expected: build exitoso, sin errores de compilación ni de tipos. Confirma que `/login` compila con la nueva composición.

- [ ] **Step 5: Commit (solo si algún paso anterior requirió un fix)**

Si Steps 1-4 pasaron sin cambios de código, no hay nada que commitear en este paso — continuar a Task 6. Si hubo que corregir algo, commitear ese fix puntual con un mensaje que describa qué se corrigió.

---

### Task 6: Verificación visual y entrega

**Files:** ninguno (verificación manual vía navegador; no se escribe código en esta tarea).

**Interfaces:** N/A.

- [ ] **Step 1: Levantar el servidor de desarrollo**

Run (en background): `cd apps/rotulos && npm run dev`
Expected: servidor arriba en `http://localhost:3001`.

- [ ] **Step 1b: Validar (sin capturar) 375×812, 768×1024, 1366×768 y 1920×1080**

Redimensionar la ventana a cada uno de estos 4 tamaños y confirmar visualmente que no hay scroll horizontal, la tarjeta se mantiene centrada y legible, y a 375×812 aplica la misma media query de `.login-card` que a 390×844 (ambos están por debajo de los 480px del breakpoint). No hace falta guardar captura de estos 4 — el spec solo exige capturas de los 4 combos del Step 2 en adelante; esto es solo para cumplir "validar obligatoriamente" en las 6 resoluciones listadas en el spec.

- [ ] **Step 2: Capturar 1440×900 modo claro**

Navegar a `http://localhost:3001/login`, ventana 1440×900, tema claro (default u forzando `localStorage.setItem('purpleshop.theme','light')` + reload). Tomar captura sin devtools/overlays. Confirmar: tarjeta centrada máx. 440px, fondo neutro con wash sutil visible, sin panel de gradiente grande, título "Inicia sesión", botón Microsoft de ~44px con icono, texto auxiliar con tildes correctas.

- [ ] **Step 3: Capturar 1440×900 modo oscuro**

Mismo tamaño, forzar `localStorage.setItem('purpleshop.theme','dark')` + reload. Confirmar: fondo oscuro neutro (`#0f0b17`, no negro puro), glow morado sutil, buen contraste, tarjeta `#1c1728`.

- [ ] **Step 4: Capturar 390×844 modo claro**

Redimensionar a 390×844. Confirmar: una sola columna, tarjeta sin borde/sombra ocupando casi toda la pantalla (por la media query de `.login-card` a 480px), sin scroll vertical innecesario, botón accesible.

- [ ] **Step 5: Capturar 390×844 modo oscuro**

Mismo tamaño, tema oscuro. Confirmar consistencia con el paso 3.

- [ ] **Step 6: Verificar estados del botón**

Con Supabase configurado o simulando: hover (cambia a `bg-surface-muted` por `variant="secondary"`), focus-visible (outline morado por `buttonVariants`), loading (spinner + "Conectando...", ya soportado por la prop `loading` del `Button`), disabled (opacidad reducida, ya soportado). No requiere código nuevo — son estados que ya provee `buttonVariants` en `button.tsx`; solo confirmar visualmente que se ven bien con el nuevo tamaño de tarjeta.

- [ ] **Step 7: Confirmar que la autenticación no cambió**

Revisar que `login-card.tsx` sigue llamando exactamente a `supabase.auth.signInWithOAuth({ provider: "azure", options: { redirectTo: ... } })` sin cambios de lógica — solo el layout/copy alrededor cambió.

- [ ] **Step 8: Detener el servidor de desarrollo**

Run: detener el proceso en background iniciado en el Step 1.

- [ ] **Step 9: Entregar resumen**

Reportar al usuario: capturas de las 4 combinaciones (tamaño × tema), lista de archivos modificados (`layout.tsx`, `login/page.tsx`, `login/login-card.tsx`, `globals.css`), tipografía usada (Inter, ya configurada — el cambio fue corregir su herencia), decisiones de composición (Opción A, resumen breve), resultados de `test`/`typecheck`/`lint`/`build`, y confirmación explícita de que Supabase/Azure OAuth no se tocó. Detenerse ahí — no continuar con ninguna otra pantalla sin aprobación visual explícita del usuario.
