# Recuperar el diseño ilustrado del rótulo en apps/rotulos

Fecha: 2026-07-16
Estado: Aprobado por el usuario, listo para plan de implementación.

## Contexto

Tras validar en producción (`https://rotulos-xi.vercel.app`) el corte de
GitHub Pages a Vercel/Supabase, el usuario notó que el rótulo generado no
coincide con el diseño ilustrado esperado (compartió una captura del
diseño real: fondo morado ilustrado con logo circular "PurpleShop",
código QR con burbuja "Escaneame", franjas REMITENTE/DESTINATARIO con
íconos, y barra inferior con N° de pedido / fecha / transportadora /
método de pago / valor / paquetes).

Investigando el repo se encontró que:

- `assets/images/label-template-bg.png` (1310×1201px) es exactamente esa
  imagen ilustrada, y existe en el repo desde el commit `a4e68d1`
  ("feat(labels): usar el diseno ilustrado de Edwing como fondo del
  rotulo"), aplicado en su momento al generador de rótulos legacy de la
  raíz (`src/modules/labels.js` + `css/labels.css`).
- Ese commit **no está usado por nada actualmente**: `src/modules/labels.js`
  fue reemplazado después por un simple puente que enlaza a
  `apps/rotulos` (parte del trabajo "Fixed gotcha" documentado en
  `CLAUDE.md`), sin portar el diseño ilustrado a la nueva app.
- `apps/rotulos` siempre tuvo su propio generador de rótulos
  (`label-preview.tsx` + `pdf.ts`), construido de forma independiente
  con un diseño simple de texto/bordes CSS, sin la ilustración.
- La nota en `CLAUDE.md`/memoria de que "el diseño del rótulo ya está
  validado con impresión física real, no tocar" se refería a este
  diseño simple actual, no al ilustrado — esa nota generó el spec previo
  (`2026-07-16-migracion-vercel-supabase-design.md` y
  `2026-07-16-unificar-diseno-apps-rotulos-design.md`) que explícitamente
  protegió de cambios el CSS `.label-*` de `apps/rotulos`. Este spec
  **reemplaza esa protección**: a partir de acá, `.label-*` en
  `apps/rotulos/src/app/globals.css` sí se modifica.

El commit `a4e68d1` (y el que lo precede, `acd1160`, que agregó el
selector de tamaño 10x9/14x12) contienen exactamente las posiciones en
porcentaje ya calculadas y validadas contra la imagen de 1310×1201px, así
que este trabajo es **portar**, no rediseñar desde cero.

## Decisión

Reescribir el generador de rótulos de `apps/rotulos` para usar la imagen
ilustrada como fondo, con los datos reales superpuestos como texto
posicionado en porcentajes (idéntico enfoque y valores al commit
`a4e68d1`), y recuperar el selector de tamaño de rótulo por rótulo
(10x9cm "Pequeño" / 14x12cm "Grande", default "Grande") que existía en
`acd1160`.

### Alcance

1. **Tamaño por rótulo, no global.** Se agrega `size: "10x9" | "14x12"`
   a `LabelDraft`/`LabelRecord` (default `"14x12"`), con un selector
   nuevo en el formulario (`ShipmentFields`, junto a "Transportadora").
   El campo se guarda con cada rótulo, así que reimprimir desde el
   historial respeta el tamaño con el que se creó. **No se toca**
   `LabelSettings.labelSize` (el `widthCm`/`heightCm` configurable en
   Configuración) — ese campo ya está vestigial hoy (no lo lee ni
   `label-preview.tsx` ni `pdf.ts`, que usan un tamaño fijo de 14x11cm
   hardcodeado), y se deja como está para minimizar el diff; queda
   superseded en la práctica por el nuevo selector por rótulo, pero
   removerlo de `settings-form.tsx`/`defaults.ts`/`label-store.ts`/
   `types.ts` es limpieza fuera de este alcance.

2. **Logo y QR quedan incluidos en la imagen de fondo, no como
   elementos separados.** El diseño original (commit `a4e68d1`) no
   renderiza `<img>` de logo/QR — ambos ya están dibujados en
   `label-template-bg.png`. `settings.logoUrl`/`settings.qrUrl` dejan de
   usarse en la generación del rótulo (mismo criterio que `labelSize`:
   quedan vestigiales, configurables en Configuración pero sin efecto en
   el rótulo — no se tocan esos campos de `LabelSettings` ni su UI).

3. **Posiciones exactas, reutilizadas del commit `a4e68d1`** (en % del
   contenedor, funcionan igual sin importar el tamaño porque el fondo se
   estira con `background-size: 100% 100%`):

   ```css
   .lbl-sender-name { top: 40.8%; left: 8.8%; width: 31%; font-size: 3cqw; }
   .lbl-sender-phone { top: 47.4%; left: 8.8%; width: 31%; }
   .lbl-sender-city { top: 54%; left: 8.8%; width: 31%; }
   .lbl-sender-department { top: 60.6%; left: 8.8%; width: 31%; }
   .lbl-sender-address { top: 67%; left: 8.8%; width: 31%; height: 9%; }

   .lbl-recipient-name { top: 40.2%; left: 52.3%; width: 43.5%; font-size: 3cqw; }
   .lbl-recipient-phone { top: 45.2%; left: 52.3%; width: 43.5%; }
   .lbl-recipient-department { top: 50.4%; left: 52.3%; width: 19%; }
   .lbl-recipient-city { top: 50.4%; left: 78.6%; width: 17%; }
   .lbl-recipient-address { top: 55.5%; left: 52.3%; width: 43.5%; height: 9%; }
   .lbl-recipient-neighborhood { top: 63%; left: 52.3%; width: 43.5%; }
   .lbl-recipient-reference { top: 67.6%; left: 52.3%; width: 43.5%; }
   .lbl-recipient-notes { top: 72.1%; left: 52.3%; width: 43.5%; }

   .lbl-order-number { top: 87.6%; left: 5%; width: 13%; font-size: 1.9cqw; }
   .lbl-date { top: 87.6%; left: 23%; width: 10%; font-size: 1.9cqw; }
   .lbl-carrier { top: 87.6%; left: 38.5%; width: 13.7%; font-size: 1.6cqw; }
   .lbl-value { top: 87.6%; left: 74%; width: 7%; font-size: 1.9cqw; }
   .lbl-packages { top: 87.6%; left: 88%; width: 9%; font-size: 1.9cqw; text-align: center; }
   .lbl-check-paid { top: 88.8%; left: 55.2%; font-size: 2.2cqw; width: 3%; }
   .lbl-check-cod { top: 88.8%; left: 62.3%; font-size: 2.2cqw; width: 3%; }
   ```

   Base compartida `.lbl-f` (posición absoluta, una línea, elipsis si no
   entra) y `.lbl-f.lbl-multiline` (2 líneas máximo, para direcciones)
   también se reutilizan tal cual del commit original.

4. **`apps/rotulos/src/components/label-preview.tsx`** se reescribe: un
   único `<section className="label-canvas" data-testid="label-canvas"
   data-size={draft.size}>` (sin `<header>`/`<footer>`/`<img>`) con los
   `<span className="lbl-f lbl-*">` superpuestos.

5. **`apps/rotulos/src/lib/pdf.ts`** (`renderLabelPdfHtml`) se reescribe
   con el mismo enfoque (imagen de fondo + spans posicionados), tamaño
   de página tomado de `label.size` en vez del `PDF_SIZE_CM` fijo actual
   (14x11cm). `renderLabelPdfBuffer` ajusta el viewport de Playwright
   proporcionalmente al tamaño elegido.

6. **Impresión (`window.print()` en `label-form.tsx`)**: como `@page`
   necesita un tamaño literal fijo en CSS y no puede depender de una
   clase, se inyecta/actualiza un `<style>` con
   `@page { size: {w}cm {h}cm; margin: 0; }` según `draft.size` justo
   antes de llamar a `window.print()`.

7. **`apps/rotulos/src/app/globals.css`**: se reemplazan por completo
   `.label-header`, `.label-brand`, `.label-brand img`, `.label-brand
   strong`, `.label-brand span`/`.label-social span`, `.label-social`,
   `.label-social img`, `.label-meta`, `.label-meta > *`, `.label-meta >
   *:last-child`, `.label-grid`, `.label-block` (+ variantes), `.recipient`
   (+ variantes `.recipient-address`, `.recipient-neighborhood`,
   `.recipient-reference`), `.label-footer` (+ `.recipient-notes`),
   `.cod-badge`/`.paid-badge` — por las reglas `.lbl-f`/`.lbl-*` de arriba
   más `.label-canvas` actualizado (`background-image:
   url("/label-template-bg.png"); background-size: 100% 100%;
   container-type: inline-size;` + `[data-size="10x9"] { width: 10cm;
   height: 9cm; }` / tamaño default 14x12cm) y el bloque `@media print`
   actualizado para ambos tamaños.

8. **Base de datos**: nueva migración agregando `size text not null
   default '14x12' check (size in ('10x9', '14x12'))` a `public.labels`.
   `label-store.ts` (`LabelRow`, `rowToLabel`, `labelToRow`) se actualiza
   para incluir la columna.

9. **Asset**: copiar `assets/images/label-template-bg.png` a
   `apps/rotulos/public/label-template-bg.png` (la raíz del repo se va a
   borrar en una tarea futura — Task 12 del plan de migración — así que
   el asset debe vivir ya en `apps/rotulos` antes de eso).

### Fuera de alcance

- No se toca `LabelSettings.labelSize`, `logoUrl`, `qrUrl`, ni su UI en
  `settings-form.tsx` — quedan vestigiales pero funcionando (no rompen
  nada, simplemente dejan de tener efecto visual en el rótulo).
- No se rediseña la imagen en sí (`label-template-bg.png` se usa tal
  cual, sin editarla).
- No se agregan tamaños adicionales más allá de 10x9/14x12.

## Tests a actualizar

Los tests existentes que dependen de la estructura vieja del rótulo
deben reescribirse junto con la implementación (no es opcional, la
estructura DOM cambia por completo):

- `apps/rotulos/src/__tests__/label-preview.test.tsx` — ya no hay
  `<img alt="QR de Instagram PurpleShop">` ni dos ocurrencias de texto
  "PurpleShop" (el wordmark ahora es parte de la imagen, no texto DOM).
- `apps/rotulos/src/__tests__/pdf.test.ts` — el HTML generado ya no
  contiene `<img src=".../purple-shop-logo.png">`/`qr.png`, y el tamaño
  de página varía según `label.size` en vez de estar fijo en `14cm 11cm`.
- `apps/rotulos/src/__tests__/label-form.test.tsx` — si asume el shape
  de `LabelDraft` sin `size`, se actualiza para incluir el campo nuevo.

## Riesgos aceptados

- Sin base de datos local (sin Docker en este entorno), la migración de
  la columna `size` se valida por revisión y se aplica directamente al
  proyecto Supabase remoto (mismo patrón ya usado en el plan de
  migración de inventario).
- El fondo se estira con `background-size: 100% 100%` a los dos tamaños
  posibles (10x9 y 14x12), que no coinciden exactamente con la relación
  de aspecto nativa de la imagen (1310×1201 ≈ 14:12.8). Esto ya era así
  en el diseño original validado — se acepta la misma distorsión mínima.
