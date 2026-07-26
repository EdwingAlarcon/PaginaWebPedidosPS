---
target: apps/rotulos crear rotulo flow
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-26T22-55-14Z
slug: apps-rotulos-src-app-app-crear-page-tsx
---
Method: dual-agent (A: a4b9801e356db9321 · B: a59c8d1875697afe1)

## Hallazgo estructural previo (condiciona todo lo demás)

"Crear rótulo" (`apps/rotulos/src/app/(app)/crear/page.tsx`) NO es el flujo integrado pedido+cliente+rótulo que PRODUCT.md declara como diferenciador. Es un sistema paralelo desconectado: usa `label-store.ts` (tabla `labels`), sin `customer_id`, sin `product_codes`, sin vínculo a `orders`. El flujo que sí integra pedido+cliente vive en `pedidos/nuevo/page.tsx` (`OrderForm` → `business-store.ts`). El "Número de pedido" del rótulo es un string libre generado por patrón (`order-number.ts`), no una FK real — el operador puede imprimir un rótulo cuyo número no corresponde a ningún pedido guardado.

## Design Health Score

| # | Heurística | Score | Hallazgo clave |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | 2/4 | Botones de `LabelActions` no reciben flag `loading`; sin bloqueo visual durante `saveDraft()`/`downloadPdf()`. |
| 2 | Coincidencia con el mundo real | 2/4 | "Número de pedido" sugiere vínculo a un pedido real; es solo texto generado, sin FK a `orders.id`. |
| 3 | Control y libertad del usuario | 2/4 | Sin cancelar/descartar cambios, sin confirmación al salir con datos sin guardar, sin deshacer. |
| 4 | Consistencia y estándares | 3/4 | Buen uso de `Card`/`FormField`/`Input`; pierde puntos por divergencia estructural con `OrderForm` (mismo dominio, patrones distintos). |
| 5 | Prevención de errores | 2/4 | `maxLength` + hints de impresión excelentes; cero prevención de doble guardado, cero relación con clientes existentes. |
| 6 | Reconocimiento antes que recuerdo | 2/4 | Destinatario sin datalist (a diferencia de `OrderForm`); remitente sí se precarga bien. |
| 7 | Flexibilidad y eficiencia | 2/4 | Sin atajos, sin duplicar-último-rótulo, sin plantillas de destinatarios frecuentes pese a uso "decenas de veces al día". |
| 8 | Estética y minimalismo | 3/4 | Fiel a DESIGN.md: planas, un acento, jerarquía por peso/tamaño. |
| 9 | Recuperación de errores | 2/4 | Resumen de validación dice "revisa N campos" sin decir cuáles ni enlazar al primero; error de PDF es mensaje genérico único. |
| 10 | Ayuda y documentación | 1/4 | Sin tooltip sobre relación (inexistente) rótulo↔pedido; sin ayuda contextual de flujo. |
| **Total** | | **21/40** | **Acceptable** |

## Veredicto de Especificidad de Diseño

**LLM (Assessment A):** Parcialmente específico. `label-canvas`/`label-preview.tsx` es genuinamente anclado al producto — posicionamiento absoluto sobre plantilla real, sombra elevada exclusiva ("objeto físico"), sincronía con `pdf.ts`. Pero el formulario que lo alimenta es CRUD genérico intercambiable con cualquier SaaS de logística: sin atajos para el caso de uso real, sin copiado inteligente, con el "Número de pedido" desconectado de `orders`. La pieza más específica del producto (vínculo pedido-cliente-rótulo) falta justo en la pantalla que se supone lo encarna.

**Escaneo determinístico (Assessment B):** `detect.mjs` corrido sobre `crear/`, `components/` y `globals.css` — exit code 2, 4 findings, todos `warning`, **ninguno en los `.tsx` del flujo** (page.tsx, label-form.tsx, label-preview.tsx, sender/recipient/shipment-fields.tsx: limpios). Los 4 findings están en `globals.css`: `side-tab` (línea 715, borde de acento en `.nav-link.active`), `overused-font` (línea 285, Arial en `.label-canvas` — sí relevante al flujo, es la fuente del rótulo impreso), `layout-transition` ×2 (líneas 146/190, transición de `width`/`padding-left` en el shell del sidebar). Los tres primeros son de alcance dudoso para *este* flujo específico (pertenecen al shell global, no a "Crear rótulo"); `overused-font` sí aplica directamente porque es la tipografía del rótulo que se imprime.

**Visualización en navegador:** omitida deliberadamente en ambos assessments — la app exige OAuth Microsoft real con allowlist server-side y ninguno de los dos agentes tiene credenciales. Una sesión sin autenticar solo mostraría `/login`, así que no se generó ninguna captura falsa. No hay overlay visible en un tab `[Human]` para este run.

## Overall Impression

La superficie visual cumple con DESIGN.md (planitud, acento único, tipografía consistente) y el componente estrella (el rótulo simulando objeto físico) está bien resuelto. Pero la pantalla no es el flujo integrado que el producto promete ser — es un formulario paralelo que reescribe a mano lo que ya existe en `customers`, y no se conecta a `orders`. La mayor oportunidad no es visual: es de arquitectura de flujo.

## What's Working

1. **`validation.ts`**: límites de caracteres (`PRINTABLE_LABEL_LIMITS`) derivados del layout físico real de 14×12cm/10×9cm, con hints ("Máximo 50 caracteres para imprimirlo completo") — prevención de errores genuinamente anclada al dominio.
2. **`label-canvas` / `label-preview.tsx`**: sombra elevada exclusiva del rótulo (Regla Plana-por-Defecto de DESIGN.md) comunica "objeto físico separado" sin necesitar copy adicional.
3. **`FormField` (ui/form-field.tsx)**: accesibilidad sólida — `aria-describedby` combinando hint+error, `aria-invalid`, `role="alert"`, `useId()`.

## Priority Issues

**[P0] El "Número de pedido" del rótulo no está vinculado a `orders`, contradiciendo el diferenciador declarado del producto.**
Why it matters: PRODUCT.md promete que el rótulo "se genera directamente desde el pedido... sin riesgo de desincronización". El código permite lo contrario: un rótulo con un número que no corresponde a ningún pedido real, o que colisiona con uno creado en `/pedidos/nuevo`.
Fix: fusionar `/crear` dentro de `/pedidos/nuevo` (generar el rótulo como paso final de guardar un pedido, precargando datos reales) o agregar selector "Vincular a pedido existente" que traiga `customer_snapshot` y `orderNumber` real de `business-store.ts`.
Suggested command: /impeccable shape (replantear el flujo antes de tocar UI)

**[P1] Sin protección de doble envío en Guardar/Descargar PDF.**
Why it matters: `saveDraft()`/`downloadPdf()` son async sin flag `loading` en `LabelActions` — doble clic genera doble guardado o doble descarga de un documento que se va a imprimir.
Fix: `const [saving, setSaving] = useState(false)` en `LabelForm`, pasar `loading={saving}` y deshabilitar botones mientras uno está en curso.
Suggested command: /impeccable harden

**[P1] Sin autocompletado de destinatario desde clientes existentes.**
Why it matters: `RecipientFields` no tiene datalist contra `customers` (a diferencia de `OrderForm` línea 182). Reescribir a mano cada vez arriesga typos que rompen la "verdad única" que CLAUDE.md exige.
Fix: replicar el patrón `datalist` + `handleCustomerNameChange` de `order-form.tsx` en `recipient-fields.tsx`.
Suggested command: /impeccable clarify

**[P2] Resumen de validación no señala ni navega a los campos con error.**
Why it matters: "Revisa 3 campos" sin decir cuáles ni hacer scroll/foco al primero — con ~20 campos posibles, el usuario escanea a ciegas.
Fix: listar labels de campos con error como enlaces (`<a href="#fieldId">`) o mover foco al primer campo inválido.
Suggested command: /impeccable clarify

**[P3] Cadena de selects de ubicación sin refuerzo visual de progreso.**
Why it matters: Departamento→Ciudad→Localidad→Barrio se ven idénticos disabled/enabled; solo cambia el placeholder.
Fix: reforzar estado disabled visualmente, mover el hint de dependencia al `hint` del `FormField`.
Suggested command: /impeccable layout

## Persona Red Flags

**Alex (power user):** cada rótulo nuevo obliga a re-teclear el destinatario completo sin datalist. Para alguien que hace esto "decenas de veces al día" (PRODUCT.md), la ausencia de reutilización de destinatarios frecuentes o "duplicar último rótulo" es fricción diaria acumulada.

**Riley (stress tester):** si `fetch("/api/labels/pdf")` falla a mitad de camino, el único resultado es "No se pudo generar el PDF." — sin distinguir red/servidor/validación. Sin guardado automático de borrador: refrescar o cerrar el navegador a mitad de llenar el formulario pierde todo el trabajo tecleado.

**Sam (accesibilidad):** `LabelPreview` es un bloque de ~19 `<span>` sin estructura semántica (sin headings, sin `dl`/`dt`/`dd`) más allá de un `aria-label` genérico — un lector de pantalla recibe una lista plana de textos sin distinguir remitente de destinatario salvo por orden de lectura.

## Minor Observations

- `codAmount` usa `<Input type="number">` plano en vez del `CurrencyInput` que sí se usa en `order-form.tsx` para el mismo tipo de dato — inconsistencia de componente entre las dos pantallas del mismo dominio.
- Botón "Guardar rotulo" no distingue crear vs. actualizar (cuando se llega vía `?id=`) — mismo texto en ambos casos.
- `packageCount`/`codAmount` hacen `Number(event.target.value)` sin guard de `NaN` para campo vacío.
- Handlers `onInput` + `onChange` duplicados en varios campos (`sender-fields.tsx` 34-35, `recipient-fields.tsx` 53-54/60-61) — llaman a la misma función dos veces por evento, redundante aunque no roto.
- Los 4 findings del detector caen en `globals.css`, no en el flujo — solo `overused-font` (Arial en `.label-canvas`) es directamente relevante a esta pantalla.

## Questions to Consider

1. ¿Por qué existen dos formularios de captura de destinatario/cliente con lógica de ubicación duplicada en vez de un único flujo "pedido → rótulo"? ¿Es intencional mantener `/crear` standalone para casos sin pedido formal?
2. Si el diferenciador es "el rótulo nunca se desincroniza del pedido", ¿qué pasa hoy si alguien usa `/crear` para un pedido que ya existe en `/pedidos`? ¿Dos números de pedido para la misma venta?
3. Con solo 2 usuarios fijos y expertos, ¿vale más invertir en descubribilidad (tooltips) o directamente en fusionar los dos flujos y eliminar la reescritura manual repetida?
