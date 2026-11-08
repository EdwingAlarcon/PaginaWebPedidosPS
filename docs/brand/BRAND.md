# Purple Shop — referencia de marca (v2.0, 2026-11-07)

Manual completo (PDF, 15 páginas), logos y patrón:
`C:\Users\EdwingAlarcon\OneDrive\Docs\PurpleShop\Manual de marca\` (fuera del repo).
Aquí queda solo lo que el código necesita saber.

## Dirección de marca
"Fresco, con el logo de siempre": el logo original NO se toca; alrededor van tipografía redonda,
acentos vivos y un corazón como detalle. (La v1 con #742F92 y un logo reconstruido fue rechazada
por Edwing; no volver a ella.)

## Color
- **Morado oficial: `#6E1593`** (RGB 110·21·147, CMYK 67·98·0·0). Es el morado medido en todos los
  archivos de logo originales. Es `--purple-600` / `--primary` (tema claro) en `globals.css`.
- Escala de la app: 950 `#1B0A28` · 900 `#2A0F3D` (Noche) · 800 `#45115F` · 700 `#5B137B` ·
  600 `#6E1593` · 500 `#8C43AD` · 400 `#AC74C9` · 300 `#D9B8F0` (Lila) · 200 `#E6D0F6` ·
  100 `#F1E4FA` · 50 `#FBF7FD` (Fondo).
- Acentos: Chicle `#FF6F91` (`--accent`) y Limón `#E7F76A` (`--lime`). En la app son **decorativos** (chips de ícono, punto del
  encabezado, marca del ítem activo del menú, corazón de estados vacíos); nunca como color de estado (éxito/alerta/error siguen
  siendo los semánticos) y el texto sobre ellos va en Noche (`--on-accent`). Componentes: `IconChip`, `MetricCard tone=`.
- Login: fondo morado de marca con el patrón de garabatos (`public/patron-zigzag.png`, blanco con alfa).- Tema oscuro: `--primary` = Lila `#D9B8F0`; fondos y bordes de la familia Noche (`#150A20`, `#1F1130`,
  `#3A2352`). Tema claro: texto Noche `#2A0F3D`, texto secundario `#6B4F85`, fondo `#FBF7FD`.
- PWA: `theme_color` `#6E1593`, `background_color` `#2A0F3D`; íconos `icon-192/512.png` (disco original) e
  `icon-maskable-192/512.png` (logo con aro sobre morado, dentro de la zona segura).
- **Descartados** (no volver a usarlos): `#742F92`, `#741984`, `#784D92`, `#6B1FA2`, `#7C3AED` y la
  escala violeta de Tailwind.
- Texto sobre color: blanco sobre morado/noche; Noche sobre lila/chicle/limón. Nunca blanco sobre
  chicle (2,6:1) ni sobre lila (1,7:1).

## Logo
- Tres versiones, todas a partir de los archivos originales: **con sombra** (fondos claros),
  **con aro blanco** (fondos morados, oscuros, fotos) y **una tinta** (sellos/bordado; vectores).
- En la app: sidebar, login e `icon.png` usan `public/purple-shop-logo.png` (original, con sombra).
  Todo lo que dibuja el logo **sobre fondo morado** (resúmenes de pedido PDF/imagen y catálogo PDF)
  usa `public/purple-shop-logo-aro.png`; sin el aro el disco se camufla con el fondo.
- Nunca recolorear, rotar, recortar ni dibujar el logo desde cero.

## Tipografía
Fredoka (títulos) + Nunito (texto) en piezas para clientes. En la app de gestión: **Fredoka solo en títulos y cifras**
(`--font-display`, clases `text-page-title`, `text-card-title`, `font-display`); el texto y los datos siguen en **Inter**.
Retiradas: Myriad Pro, Berlin Sans FB Demi, Champagne & Limousines, Oriflame Script, Avant Garde.

## Datos oficiales
Instagram `@purpleshop.online` (minúscula) · WhatsApp `+57 322 957 5255`.
Frase: «detalles que viajan con amor».

## Hecho
- Mensajes de WhatsApp y textos visibles con tildes y signos de apertura («Guía», «envío», «¡Gracias!»).
- Los PDF (resumen, catálogo) conservan tildes: `sanitize` ahora deja pasar Latin-1.
- Corazón de acento en resúmenes de pedido y portada del catálogo.
- Portada del catálogo de marca (logo con aro, sin fotos de terceros); se quitó `public/catalog/postal.jpg`.

## Pendientes conocidos
- Las portadas por categoría del catálogo (`public/catalog/men.jpg` y `women.jpg`) siguen siendo el diseño
  anterior: logo viejo con banda verde y fotos de perfumes de otras marcas. Reemplazar cuando haya fotos propias.
- CMYK de lila, chicle, limón y noche: confirmar con la imprenta (el del morado, 67/98/0/0, ya es oficial).
- El rótulo (preview y PDF) no se tocó: usa colores fijos (texto `#1A0630` y la imagen
  `public/label-template-bg.png`, de un violeta propio). Si se alinea, cambiar la imagen y
  `pdf.ts`/`globals.css` juntos y validar preview y PDF a la vez.
- La fila de `settings.brand_colors` en Supabase conserva el valor anterior hasta guardarla de nuevo
  en Configuración.
