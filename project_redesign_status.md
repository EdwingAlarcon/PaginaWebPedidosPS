# Purple Shop — Estado del rediseño UI/UX

> Este documento describe el rediseño completo de la interfaz de Purple Shop
> (sidebar + topbar, dashboard, modo oscuro real, iconos SVG). No confundir
> con `apps/rotulos` (proyecto Next.js/Supabase independiente) — ese proyecto
> tiene su propio ciclo de QA y no se toca aquí.

## Bloques 0–7 (completados, commits previos a esta sesión)

| Bloque | Contenido | Commit |
|---|---|---|
| 0–3 | Fundaciones: sidebar + topbar, sistema de diseño (`css/theme.css`), iconos SVG (`window.Icons`), dashboard inicial | `89b15f4`..`40242fb` |
| 4 | Layout de 2 columnas en Nuevo Pedido con resumen sticky | `40242fb` |
| 5 | Vista de Pedidos funcional: tabla, filtros, detalle | `af4999c` |
| 6 | Vista de Clientes funcional con alta en modal | `bd3b2ca` |
| 7 | Vista de Reportes funcional + pulido oscuro de Inventarios/Rótulos (parcial, ver hallazgos abajo) | `adbc1c0` |

## Bloque 8 — QA final (ejecutado 2026-07-16)

QA end-to-end en navegador real (Playwright), sirviendo la app con
`python -m http.server 8000`, sobre los 4 ejes acordados: responsive,
accesibilidad, regresión funcional completa, y claro/oscuro. **No se hizo
commit** — todos los cambios quedan en el working tree para revisión.

### 1. Responsive (320 / 375 / 768 / 1024 / 1366 / 1440 px)

Verificado en las 7 vistas (Dashboard, Nuevo Pedido, Pedidos, Clientes,
Inventario, Reportes, Rótulos de envío) × 6 breakpoints (42 combinaciones):
sin overflow horizontal en ninguna (`document.documentElement.scrollWidth`
vs `clientWidth`, diferencia ≤ 1px en todos los casos, antes y después de
los fixes). Drawer móvil (sidebar) probado a 320px: abre/cierra
correctamente, backdrop, sin overlap.

**Bug encontrado y corregido:** a 320px, el botón flotante de "atajos de
teclado" (`.shortcuts-help-btn`, esquina inferior derecha, fijo en toda la
app) tapaba el total del pedido en las tarjetas de la vista Pedidos en modo
tarjeta (mobile). Corregido en `src/utils/form-optimizations.js` — el botón
ahora solo se muestra en la pestaña "Nuevo Pedido" (que es además donde
sus atajos realmente funcionan; ver hallazgo de accesibilidad relacionado).

### 2. Accesibilidad

- **Navegación por teclado**: Tab/Shift+Tab recorre correctamente sidebar,
  topbar, KPIs del dashboard, tablas y formularios. Foco visible en todos
  los elementos probados (outline sólido 1.6–2.4px, contraste claro contra
  cualquier fondo).
- **Escape**:
  - *Bug encontrado y corregido*: al presionar Escape con el modal "Ver
    detalle" de un pedido abierto (un `<dialog>` nativo con `showModal()`),
    no se cerraba — en su lugar disparaba el atajo global "Limpiar
    formulario" del formulario de Nuevo Pedido (aunque esa pestaña no
    estuviera activa), porque un listener de `keydown` en `document`
    (`src/utils/form-optimizations.js`) interceptaba *todo* Escape de la
    página con `preventDefault()`, sin comprobar si había un modal abierto
    ni si la pestaña activa era la correcta. Corregido: los atajos ahora
    ignoran la tecla si hay un `<dialog>` abierto o si "Nuevo Pedido" no es
    la pestaña activa — el Escape nativo del `<dialog>` vuelve a funcionar.
  - *Bug encontrado y corregido*: el drawer de navegación móvil no se
    cerraba con Escape (solo con click en el overlay o al cambiar de
    pestaña). Corregido en `src/main.js` (`_setupSidebar`): Escape ahora
    cierra el drawer y devuelve el foco al botón que lo abrió.
- **Contraste WCAG AA** (calculado con luminancia relativa real vía
  `getComputedStyle` + composición alfa manual, no solo lectura de CSS):
  - *Bug encontrado y corregido*: los badges de estado (`.badge-pending`,
    `.badge-completed`, en Pedidos/Dashboard/Reportes) tenían, en **modo
    claro**, un contraste real de **3.18:1** (completado) y **2.71:1**
    (pendiente) — por debajo del 4.5:1 mínimo para texto normal. En modo
    oscuro esos mismos badges ya daban ~8:1 (sin problema). Corregido en
    `css/theme.css`: se añadieron variables `--badge-*-text` dedicadas,
    más oscuras solo en modo claro (`--badge-success-text: #065f46`,
    `--badge-warning-text: #92400e`, etc.), sin tocar `--success-hover` /
    `--warning-hover` (usadas en otros sitios, como hover de botones, donde
    sí funcionan bien). Verificado tras el fix: 6.48:1 y 6.18:1.
  - El resto de combinaciones muestreadas (encabezados, texto de tabla,
    botones primarios, KPIs, labels) pasa cómodamente en ambos temas.

### 3. Regresión funcional completa

Probado creando datos reales de punta a punta (no solo lectura de código):

- **Nuevo Pedido**: pedido con 1 producto (Camisetas, con sus 5 campos
  dinámicos incluyendo Diseño/Estampado) y pedido con 2 productos
  (Accesorios + Medias, cada categoría con sus propios campos dinámicos
  correctos). Descuento 10% + envío $5.000 sobre subtotal $80.000 → total
  $77.000 (verificado exacto). Guardado confirmado en
  `window.InventoryManager.getAll()`: las 2 líneas del pedido multi-producto
  comparten el mismo `orderGroupId`. Sincronización con Excel falla
  correctamente de forma no bloqueante (no autenticado) sin romper el guardado.
- **Pedidos**: tabla, filtro por estado, filtro por cliente, "Limpiar
  filtros", ver detalle (modal), cambiar estado a "Completado", paginación
  visible.
- **Clientes**: alta manual vía modal (guardado y reflejado en tabla), y
  clientes derivados automáticamente de los pedidos ya creados (con
  "Último pedido" correcto).
- **Inventario**: alta de producto, ajuste de stock (entrada +10,
  reflejado en KPI y en el registro de Movimientos), reporte de inventario
  (resumen general, top productos, análisis por categoría — cifras
  correctas: $300.000 = 30 unidades × $10.000 costo).
- **Rótulos**: generación y guardado de un rótulo completo (remitente +
  destinatario + transportadora), aparece en historial con acciones
  (Editar/Duplicar/Imprimir/Eliminar). Nota: el formulario exige
  remitente/destinatario/dirección/transportadora completos antes de
  habilitar "Guardar" — esto es validación esperada, no un bug (al
  principio se intentó guardar con el formulario incompleto y el sistema
  correctamente no persistió el rótulo, mostrando el mensaje explicativo).
- **Dashboard**: KPIs reflejan exactamente los datos creados en las
  pruebas (ventas $117.000, 2 pedidos, 1 pendiente, 2 clientes únicos,
  ticket promedio $58.500, pedidos recientes, productos más vendidos,
  clientes frecuentes).
- **Reportes**: filtro por cliente funcional (aísla correctamente ventas y
  conteo del cliente seleccionado), tendencia de ventas, productos más
  vendidos, detalle de pedidos — todo con datos reales.

**Bug encontrado y corregido (transversal, afecta todas las vistas
anteriores):** el `orderDate` elegido en el formulario (ej. `2026-07-16`)
se normalizaba a medianoche UTC (`2026-07-16T00:00:00.000Z`) al guardar
(`src/modules/order-form.js`), y `Format.date()`
(`src/utils/format.js`) lo formateaba con la zona horaria **local** del
navegador (comportamiento por defecto de `Intl.DateTimeFormat`, sin
`timeZone` explícito). En cualquier huso horario detrás de UTC —
**incluida Colombia (UTC-5), el mercado objetivo de esta app** — esto
mostraba sistemáticamente el pedido un día antes del elegido, en TODAS las
vistas que muestran fecha de pedido (Pedidos, detalle de pedido, Dashboard,
Reportes, "último pedido" de Clientes, exportación a PDF). Corregido:
`Format.date()` ahora fuerza `timeZone: 'UTC'` (las fechas de pedido son
fechas-calendario, no instantes con hora real, así que esto es correcto
independientemente de dónde esté el usuario). De paso se cambió el modal
de detalle de pedido de `Format.dateTime()` a `Format.date()` para esa
misma fecha (mostrar "12:00 a.m." fijo no aportaba información real).

### 4. Claro/oscuro

Alternado el toggle de tema y revisadas visualmente (screenshot) las 7
vistas en ambos modos.

- Dashboard, Nuevo Pedido, Pedidos, Clientes, Reportes, Rótulos de envío:
  ya estaban correctamente tematizados (Bloques 0–7); sin regresiones.
- **Bug encontrado y corregido (el más grande de esta sesión):** el módulo
  de **Inventario** (`css/inventory.css`, el código heredado de
  `src/core/inventory.js` + `src/core/inventory-ui.js`) nunca fue
  adaptado a modo oscuro pese a que el historial (`CLAUDE.md`, Bloque 7)
  documenta un "pulido oscuro de Inventarios/Rótulos" — en la práctica solo
  Rótulos quedó tematizado; Inventario seguía con `.inventory-module {
  background: #fff }` hardcodeado y ~15 reglas de texto/fondo con colores
  fijos (`#374151`, `#1f2937`, `#111827`, `#666`, `#999`, `background:
  white`, etc.) que no reaccionaban al cambio de tema. El resultado en modo
  oscuro era una tarjeta blanca estridente en medio de un shell oscuro, con
  varias combinaciones texto-oscuro-sobre-fondo-oscuro potencialmente
  ilegibles (tabs, labels de filtros/formularios, ítems de alerta, modales).
  Corregido:
  - `css/inventory.css`: `.inventory-module` ahora usa `var(--surface, #fff)`
    en vez de `#fff` fijo (el resto del módulo ya usaba parcialmente
    variables con fallback, así que heredaba el tema correctamente una vez
    resuelto este cuello de botella).
  - `css/theme.css`: se añadió un bloque `[data-theme="dark"] .inventory-module
    ...` con ~15 reglas scopeadas (encabezado, tabs, inputs de
    búsqueda/filtro, labels, ítems de alerta, botón de cerrar modal, fondo
    de modal) que sustituyen los colores hardcodeados por las variables de
    tema ya existentes (`--text-primary`, `--text-secondary`,
    `--text-tertiary`, `--surface`, `--surface-elevated`,
    `--background-secondary`, `--color-primary`), sin tocar nada fuera de
    `.inventory-module` (siguiendo la convención ya establecida de
    selectores scopeados para este módulo).
  - Verificado visualmente: Dashboard de Inventario, tabla de Productos
    (con búsqueda/filtros), y modal "Agregar Nuevo Producto" — los tres
    ahora renderizan con fondo y texto correctos en modo oscuro.
  - **Deuda técnica pendiente** (no bloqueante, documentada abajo): quedan
    combinaciones de menor visibilidad sin auditar exhaustivamente (ej.
    colores dentro de `.status-badge`/`.movement-badge`, que usan pares
    fijos claro-de-fondo + oscuro-de-texto — estos SÍ son legibles de forma
    autónoma en cualquier tema, pero visualmente son "chips claros" sobre
    un módulo ahora oscuro, una inconsistencia de estilo menor, no un bug
    de contraste).

### 5. Limpieza de datos de prueba

Confirmado con `browser_evaluate`: `localStorage.clear()` ejecutado y
recarga completa verificada — `Object.keys(localStorage)` devuelve `[]`,
`window.InventoryManager.getAll().length === 0`, tema vuelto a `light`
(default), Dashboard muestra el estado vacío original ("No hay pedidos
todavía", etc.). No quedan clientes, pedidos, productos, movimientos de
inventario, ni rótulos de las pruebas de este Bloque 8.

## Resumen de bugs encontrados y corregidos (Bloque 8)

| # | Bug | Archivo(s) | Severidad |
|---|---|---|---|
| 1 | Fecha de pedido se muestra un día antes en zonas horarias detrás de UTC (incluida Colombia) | `src/utils/format.js`, `src/modules/orders-view.js` | Alta — afecta todas las vistas con fecha de pedido, en el mercado objetivo real |
| 2 | Escape no cierra el modal "Ver detalle" de Pedidos; en su lugar dispara "Limpiar formulario" de otra pestaña | `src/utils/form-optimizations.js` | Alta — accesibilidad de teclado rota |
| 3 | Módulo de Inventario sin tematizar en modo oscuro (tarjeta blanca + texto ilegible) | `css/inventory.css`, `css/theme.css` | Alta — visual, toda la pestaña |
| 4 | Badges de estado con contraste 2.7–3.2:1 en modo claro (bajo el 4.5:1 de WCAG AA) | `css/theme.css` | Media — accesibilidad visual |
| 5 | Botón flotante de atajos de teclado tapa contenido a 320px en vistas fuera de "Nuevo Pedido" | `src/utils/form-optimizations.js` | Media — responsive/overlap |
| 6 | Drawer de navegación móvil no se cierra con Escape | `src/main.js` | Baja-media — accesibilidad de teclado |

## Archivos modificados en este Bloque 8

- `css/inventory.css`
- `css/theme.css`
- `index.html` (solo bump de `?v=` en los `<script>`/`<link>` para invalidar caché de desarrollo, de `20260716j` a `20260716p`; ningún cambio funcional)
- `src/main.js`
- `src/modules/orders-view.js`
- `src/utils/form-optimizations.js`
- `src/utils/format.js`

Ningún cambio toca `apps/rotulos` (proyecto Next.js/Supabase separado).

## Deuda técnica (no introducida por este rediseño, solo reportada)

- **404 preexistente en consola**: `pwa/assets/images/logo-purple-shop.png`
  no existe — el manifest/HTML de la PWA referencia un ícono que nunca se
  subió al repo. No forma parte del rediseño UI/UX; se deja documentado
  para que se resuelva por separado (falta solo el archivo de imagen).
- **Colores hardcodeados residuales en `css/inventory.css`**: fuera del
  bloque de overrides añadido en esta sesión, quedan selectores con
  colores fijos de menor impacto visual (chips de estado
  `.status-badge`/`.movement-badge`, algunos textos secundarios dentro de
  `.category-report`/`.report-table`) que no se auditaron exhaustivamente
  uno por uno. Ninguno de los muestreados resultó en un problema de
  contraste real, pero una auditoría completa línea por línea de ese
  archivo (1084 líneas) queda fuera del alcance razonable de este QA.

## Entregable

Todos los cambios quedan en el working tree, **sin commit ni push**, para
revisión del usuario antes de integrarlos.
