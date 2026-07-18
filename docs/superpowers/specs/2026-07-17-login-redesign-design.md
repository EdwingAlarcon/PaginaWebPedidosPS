# Rediseño de /login — PurpleShop (apps/rotulos)

## Alcance

Único alcance de esta iteración: `apps/rotulos/src/app/login/page.tsx`, `apps/rotulos/src/app/login/login-card.tsx`, el bloque `/* ==================== LOGIN ==================== */` de `apps/rotulos/src/app/globals.css`, y una corrección de una línea en `apps/rotulos/src/app/layout.tsx`.

No se modifica: autenticación Microsoft/Supabase, callbacks, middleware, rutas, lista de usuarios autorizados, ni ningún otro módulo, componente compartido o pantalla (dashboard, pedidos, clientes, inventario, reportes, rótulos, historial, configuración, AppShell).

## Diagnóstico

1. **Bug de tipografía (causa raíz):** en `layout.tsx`, la clase de la fuente Inter (`inter.variable`) se aplica en `<body>`, pero `globals.css` define `--font-sans: var(--font-inter), ...` en `:root` (`<html>`, ancestro de `<body>`). Como `--font-inter` no existe en `:root`, `--font-sans` se computa inválido ahí y ese valor inválido se hereda hacia todos los descendientes — aunque `<body>` sí defina `--font-inter` correctamente. Resultado verificado en producción (`purpleshoponline.vercel.app/login`): `getComputedStyle` devuelve `font-family: "Times New Roman"` en `html` y `body`, es decir, **Inter nunca se aplica en todo el sitio**, no solo en el login.
2. **Composición actual:** panel de gradiente morado (~40%) + contenido promocional + tarjeta aislada a la derecha + mucho espacio vacío. Confirmado visualmente contra producción.
3. **Referencia real de marca** (`edwingalarcon.github.io/PaginaWebPedidosPS/`): el morado-a-rosa aparece únicamente como sidebar angosta (~248px) sobre fondo blanco/neutro — nunca como panel de gradiente grande. Un layout dividido con gradiente dominante no es, en rigor, una evolución fiel de esa identidad.

## Decisiones

- **Fix de tipografía:** mover `className={inter.variable}` de `<body>` a `<html>` en `layout.tsx`. Cambio de una línea, resuelve la causa raíz, no toca módulos internos.
- **Composición:** Opción A — tarjeta central premium sobre fondo neutro, morado como acento (no como fondo dominante). Justificación: fiel a la referencia real (que no usa paneles de gradiente), resuelve el espacio vacío excesivo de un solo golpe, evita la sensación de plantilla SaaS genérica de un layout 40/60.
- **Tipografía:** Inter (ya configurada vía `next/font/google`, solo necesitaba el fix de herencia). Pesos: 400 texto normal, 500 etiquetas/auxiliar, 600 botón, 600 títulos (nunca 700+/800/900 en este flujo). Sin display, sin redondeado forzado.
- **Clases CSS:** las clases compartidas `.text-display`, `.text-section-title`, `.text-card-title`, `.text-page-title` (usadas en `modal.tsx`, `drawer.tsx`, `card.tsx`, `confirm-dialog.tsx`, `(app)/page.tsx`) **no se modifican**. El login usa clases propias en el bloque `LOGIN` de `globals.css` (namespace exclusivo, confirmado por grep) o utilidades Tailwind inline.

## Estructura de la pantalla

Un único componente centrado, sin panel dividido:

- **Fondo:** `var(--background)` neutro claro con una textura de marca extremadamente sutil — wash radial de `--purple-50`/`--purple-100` al 15–20% de opacidad detrás de la tarjeta, puro CSS (sin imagen ni asset nuevo). En modo oscuro: glow radial de `--purple-900` a muy baja opacidad sobre el `--background` oscuro existente (`#0f0b17`, ya neutro, no negro puro).
- **Tarjeta:** centrada, máx. 440px de ancho, `bg-surface` + `border-border` + `shadow-card` (tokens existentes, sin tokens nuevos), padding 32–40px. En móvil (<480px aprox.), la tarjeta pierde borde/sombra si ocupa casi todo el ancho de pantalla (regla explícita del usuario).
- **Contenido de la tarjeta**, de arriba a abajo:
  1. Logo + "PurpleShop" en una sola línea (lockup), sin duplicar la marca en otra zona de la pantalla.
  2. Mensaje de marca: "Gestiona tus pedidos, clientes, inventario y envíos desde un solo lugar." — 16px, `foreground-muted`, peso 400. No se usa como título grande (un H1 de 30–38px con esa frase se vería sobredimensionado en una tarjeta de 440px).
  3. (Opcional, se mantiene) 3 bullets de beneficios, compactos: ícono 16px + texto 13–14px, peso 500, `foreground-muted`.
     - Controla pedidos e inventario en tiempo real.
     - Genera rótulos listos para imprimir.
     - Consulta información clara de tu operación.
  4. Separador visual sutil (border-top o spacing, sin línea dura si no aporta).
  5. Título del formulario: "Inicia sesión" — 24–28px, peso 600.
  6. Texto de ayuda: "Accede con tu cuenta Microsoft autorizada para continuar." — 14–16px, `foreground-muted`.
  7. Botón "Continuar con Microsoft": 48px alto, ancho completo de la tarjeta, ícono oficial de Microsoft, variant `secondary` existente + override de altura. Estados: hover (ya soportado por `buttonVariants`), focus-visible (ya soportado), loading (ya soportado vía prop `loading` + `Loader2`), disabled (ya soportado). Texto en loading: "Conectando...". Sin gradiente, sin peso >600.
  8. Texto auxiliar: "Acceso exclusivo para personal autorizado de PurpleShop." — 12–13px, centrado, `foreground-muted`.
  9. Alertas de error/no autorizado: se mantienen los componentes `Alert` existentes (`danger`/`warning`), sin cambios de comportamiento.
- **Theme toggle:** se mantiene, esquina superior derecha de la pantalla (fuera de la tarjeta), sin cambios de comportamiento — mismo componente `ThemeToggle`.

## Responsive

Validar en 375×812, 390×844, 768×1024, 1366×768, 1440×900, 1920×1080:
- Desktop: tarjeta centrada vertical y horizontalmente, textura de fondo visible pero sutil.
- Móvil: una sola columna (ya es el caso al ser una tarjeta centrada, sin grid dividido que colapsar), tarjeta ocupa casi todo el ancho con padding lateral en vez de borde/sombra completos, sin scroll vertical innecesario, botón accesible (48px), logo centrado.

## Copy (corregido con tildes)

- Marca: PurpleShop
- Mensaje: "Gestiona tus pedidos, clientes, inventario y envíos desde un solo lugar."
- Beneficios: "Controla pedidos e inventario en tiempo real." / "Genera rótulos listos para imprimir." / "Consulta información clara de tu operación."
- Título formulario: "Inicia sesión"
- Texto formulario: "Accede con tu cuenta Microsoft autorizada para continuar."
- Botón: "Continuar con Microsoft" (loading: "Conectando...")
- Texto auxiliar: "Acceso exclusivo para personal autorizado de PurpleShop."
- Se elimina "Bienvenido de vuelta" (genérico, sin identidad).

## Validación antes de entrega

- `npm run lint`, typecheck (`tsc --noEmit` o script equivalente del proyecto), tests relacionados (`design-tokens.test.ts` referencia `.text-display`/`.text-section-title`, que no se tocan, así que debe seguir pasando), build.
- Capturas reales (sin devtools/overlays) en 1440×900 claro/oscuro y 390×844 claro/oscuro.
- Confirmación explícita de que no se tocó autenticación Microsoft/Supabase.

## Fuera de alcance (no hacer en esta iteración)

- Cualquier otra pantalla o componente compartido más allá del fix puntual de `layout.tsx`.
- Nuevas dependencias.
- Placeholders o contenido de relleno.
