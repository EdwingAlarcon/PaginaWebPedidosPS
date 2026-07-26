---
name: Purple Shop — apps/rotulos
description: Sistema operativo de pedidos, clientes y rótulos de envío; morado directo, superficies planas, foco en velocidad de uso repetitivo.
colors:
  violeta-purple-shop: "#7C3AED"
  violeta-purple-shop-hover: "#6D28D9"
  violeta-purple-shop-active: "#5B21B6"
  primary-foreground: "#ffffff"
  background: "#f8f7fb"
  surface: "#ffffff"
  surface-muted: "#f1eef8"
  foreground: "#16121f"
  foreground-muted: "#635d72"
  border: "#e4dff2"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
  focus-ring: "#7C3AED"
typography:
  display:
    fontFamily: "var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  card-title:
    fontFamily: "var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "var(--font-inter), 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "24px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.violeta-purple-shop}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.violeta-purple-shop-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-neutral:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground-muted}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: Purple Shop — apps/rotulos

## Overview

**Creative North Star: "El Taller Violeta"**

Purple Shop es una herramienta de taller, no un escaparate: Edwing y su
gerente la abren decenas de veces al día para crear pedidos, buscar
clientes y sacar rótulos de envío. El sistema lleva la identidad de marca
(violeta) con firmeza — aparece en cada acción primaria, cada estado
activo, cada enlace — pero se abstiene de decoración que no sirva a la
tarea. Las superficies son planas por defecto; la profundidad se reserva
para separar overlays (modales, popovers) del contenido de fondo, nunca
como adorno. La densidad es media-alta: la app asume un usuario que ya
sabe dónde está todo y valora velocidad de escaneo sobre aire visual.

Rechazo confirmado: nada de sombras decorativas en reposo, nada de
gradientes ornamentales fuera del fondo del login, nada de bordes
redondeados extremos que suavicen la sensación operativa.

**Key Characteristics:**
- Violeta como firma de marca, aplicado con moderación (acciones primarias, estados activos, foco).
- Superficies planas; sombra solo con propósito funcional (elevar overlays).
- Bordes suavizados pero contenidos (6–12px), nunca extremos.
- Tema claro y oscuro con paridad total de tokens semánticos.
- Tipografía Inter, jerarquía compacta orientada a escaneo rápido.

## Colors

Paleta de un solo acento: violeta de marca sobre neutros cálidos, con
colores de estado (éxito/alerta/peligro) reservados estrictamente a
comunicar estado, nunca decoración.

### Primary
- **Violeta Purple Shop** (`#7C3AED`): acción primaria (botones, enlaces, foco), estado activo de navegación, franja del ítem de menú seleccionado.
- **Violeta Purple Shop Hover** (`#6D28D9`): estado hover de acciones primarias.
- **Violeta Purple Shop Activo** (`#5B21B6`): texto de marca en sidebar/login (logo, encabezado), variante más oscura para contraste sobre fondos claros.

### Neutral
- **Fondo** (`#f8f7fb`): fondo general de página.
- **Superficie** (`#ffffff`): tarjetas, sidebar, topbar, inputs.
- **Superficie Atenuada** (`#f1eef8`): fondos de skeleton, hover sutil, franja de navegación activa en modo claro.
- **Texto Principal** (`#16121f`): texto de cuerpo y títulos.
- **Texto Secundario** (`#635d72`): metadatos, labels, texto de apoyo.
- **Borde** (`#e4dff2`): separadores, contornos de input y tarjeta.

### Estado
- **Éxito** (`#10b981`), **Alerta** (`#f59e0b`), **Peligro** (`#ef4444`): exclusivos para badges de estado, mensajes de validación y el punto de sincronización online/offline. Cada uno tiene variante translúcida (`-soft`, alpha 0.12–0.14) para fondos de badge.

### Named Rules
**La Regla del Acento Único.** El violeta se reserva para significar "acción primaria" o "seleccionado". No se usa como color decorativo de fondo o texto secundario — su escasez es lo que lo hace legible como llamado a la acción.

## Typography

**Body Font:** Inter (con fallback `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`)

**Character:** Una sola familia tipográfica para todo el sistema — la jerarquía se construye con peso y tamaño, no con mezcla de fuentes. Sensación neutra y funcional, pensada para lectura rápida de datos tabulares y formularios, no para expresión editorial.

### Hierarchy
- **Display** (700, 2rem / 32px, line-height 1.2): título hero, usado solo en la pantalla de login.
- **Page Title** (700, 1.75rem / 28px, line-height 1.25): título de cada pantalla principal (Pedidos, Clientes, Inventario).
- **Section Title** (600, 1.25rem / 20px, line-height 1.3): subdivisiones dentro de una pantalla.
- **Card Title** (600, 1rem / 16px, line-height 1.35): encabezado de tarjeta o métrica.
- **Body** (400, 0.875rem / 14px, line-height 1.5): texto de formularios, tablas y contenido general.
- **Label** (700, ~0.7–0.82rem, uppercase con letter-spacing ~0.04–0.06em en labels de sección/sidebar): metadatos y encabezados de grupo en mayúscula.

## Layout

Sidebar fija de 248px en escritorio (72px colapsada), contenido con
padding-left equivalente; en móvil (`≤1024px`) la sidebar se oculta y se
reemplaza por un drawer deslizante activado desde la topbar. El shell usa
`page-shell` con padding 28px (18px en `≤900px`). Formularios de creación
usan un grid de dos columnas (`creator-grid`, 0.82fr / 1fr) que colapsa a
una columna en `≤1100px`, con el panel de previsualización del rótulo
sticky en desktop. La topbar es sticky. Densidad media: gaps de formulario
de 14px, gaps de tarjeta/metric-grid mayores.

## Elevation & Depth

Sistema plano con profundidad funcional: las superficies en reposo (tarjetas, inputs, sidebar) no llevan sombra — se distinguen del fondo por color de superficie (`--surface` sobre `--background`) y borde de 1px. La sombra aparece únicamente cuando un elemento se superpone al flujo normal: popovers, dropdowns, drawer móvil y el rótulo mismo (que simula una etiqueta física impresa).

### Shadow Vocabulary
- **card** (`box-shadow: 0 1px 2px rgba(15, 11, 23, 0.06)`): sombra casi imperceptible en `Card`, apenas separa del fondo.
- **popover** (`box-shadow: 0 8px 24px rgba(15, 11, 23, 0.12)`): dropdowns, menús contextuales, modales.
- **label-canvas** (`box-shadow: 0 18px 50px rgba(17, 17, 17, 0.16)`): exclusiva del rótulo de envío en preview, para darle presencia de objeto físico separado del formulario.

### Named Rules
**La Regla Plana-por-Defecto.** Ninguna superficie lleva sombra en reposo. La sombra es siempre una respuesta a estar por encima del flujo (overlay, drawer) o a representar un objeto físico (el rótulo), nunca decoración de tarjeta.

## Shapes

Radios contenidos: `sm` (6px) para inputs y botones pequeños, `md` (8px)
para botones e inputs estándar, `lg` (12px) para tarjetas. Elementos
circulares (avatar de usuario, punto de sincronización, botón de tema)
usan `rounded-full` (9999px). Bordes de 1px en `--border` delimitan
tarjetas, inputs y separadores; no hay bordes gruesos ni dobles.

## Components

Botones, inputs y tarjetas comparten una filosofía directa y sin
fricción: bordes contenidos, transición de color simple en hover/focus,
sin efectos de escala ni sombra añadida al interactuar.

### Buttons
- **Shape:** esquinas suaves (8px, `rounded-md`).
- **Primary:** fondo Violeta Purple Shop (`#7C3AED`), texto blanco, alto 40px (`md`), padding horizontal 16px.
- **Secondary:** fondo superficie, borde 1px `--border`, texto `--foreground`.
- **Ghost:** transparente, hover con fondo `--surface-muted`.
- **Danger:** fondo `--danger`, texto blanco.
- **Link:** transparente, texto violeta, subrayado solo en hover.
- **Hover / Focus:** cambio de color de fondo sin transformación; foco con outline de 2px en `--focus-ring` con 2px de offset.
- **Estado de carga:** ícono de spinner (Loader2) antepuesto al texto, `aria-busy` activo.

### Badges
- **Style:** fondo translúcido del color de estado (`-soft`, alpha ~0.12), texto sólido del mismo color, forma píldora (`rounded-full`).
- **State:** variantes `neutral` / `primary` / `success` / `warning` / `danger`; los badges de estado de pedido y de rótulo llevan un punto (`bg-current`) antes del texto.

### Cards / Containers
- **Corner Style:** 12px (`rounded-lg`).
- **Background:** `--surface` sobre `--background`.
- **Shadow Strategy:** `card` (ver Elevation & Depth) — casi imperceptible.
- **Border:** 1px `--border`.
- **Internal Padding:** 20px.
- **MetricCard:** variante de Card para KPIs de dashboard; estado `loading` muestra placeholders `animate-pulse` en vez de spinner.

### Inputs / Fields
- **Style:** fondo `--surface`, borde 1px `--border`, radio 8px, alto 40px (excepto Textarea, altura mínima 80px).
- **Focus:** outline de 2px en `--focus-ring`, offset 2px (mismo tratamiento que botones — consistencia entre controles interactivos).
- **Disabled:** cursor `not-allowed`, opacidad 50%.

### Navigation
- Enlaces de sidebar en negrita (700), color violeta activo; el ítem activo lleva franja izquierda de 3px en `--purple-600` y fondo `--purple-50` (modo claro) / `--purple-900` (modo oscuro).
- Sidebar colapsable a 72px (solo íconos); en móvil se reemplaza por drawer con backdrop semitransparente.
- Labels de grupo en mayúscula, 0.68rem, letter-spacing 0.06em, color `--text-tertiary`.

### Rótulo de envío (Signature Component)
El `label-canvas` es el componente más distintivo del sistema: simula una
etiqueta física impresa (14×12cm o 10×9cm) superpuesta sobre una imagen
de plantilla fija (`label-template-bg.png`), con datos posicionados en
porcentaje y unidades `cqw` para escalar junto con el contenedor. Lleva
sombra elevada (`0 18px 50px`) en preview para leerse como objeto físico
separado del formulario; en impresión (`@media print`) la sombra se
retira y el tamaño se fija en cm exactos.

## Do's and Don'ts

### Do:
- **Do** usar el violeta de marca (`#7C3AED`) solo en acciones primarias, estados activos y foco — su escasez es la señal.
- **Do** mantener las superficies planas en reposo; reservar sombra para overlays y para el rótulo (objeto físico simulado).
- **Do** usar Inter en todo el sistema; construir jerarquía con peso/tamaño, no con familias tipográficas nuevas.
- **Do** mantener paridad de tokens semánticos entre modo claro y oscuro (mismo nombre de variable, distinto valor).
- **Do** usar el mismo tratamiento de foco (`outline` 2px + offset 2px en `--focus-ring`) en todo control interactivo.

### Don't:
- **Don't** agregar sombra decorativa a tarjetas o inputs en reposo — rompe la Regla Plana-por-Defecto.
- **Don't** introducir una segunda familia tipográfica o gradientes fuera del fondo del login.
- **Don't** usar radios de esquina mayores a 12px (excepto elementos circulares) — la sensación operativa se pierde con esquinas muy suaves.
- **Don't** modificar las coordenadas de `label-canvas` (`.lbl-*`) sin actualizar `src/lib/pdf.ts` en el mismo cambio — preview y PDF comparten esas coordenadas a mano.
- **Don't** introducir nuevos usos de los alias heredados (`--color-primary`, `--text-primary`, etc.) en `globals.css` — están en retiro; usar los tokens semánticos (`--primary`, `--foreground`, ...).
