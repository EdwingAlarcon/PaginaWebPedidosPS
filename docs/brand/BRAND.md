# Purple Shop — referencia de marca (v1.0, 2026-11-07)

Manual completo (PDF, 15 páginas) y todos los logos/patrón:
`C:\Users\EdwingAlarcon\OneDrive\Docs\PurpleShop\Manual de marca\` (fuera del repo).
Aquí queda solo lo que el código necesita saber.

## Color
- **Morado oficial: `#742F92`** (RGB 116·47·146, CMYK 67·98·0·0). Es `--purple-600` en
  `apps/rotulos/src/app/globals.css` y `--primary` en tema claro.
- Escala de la app: 950 `#260740` · 900 `#3B0A57` (Noche) · 800 `#4F176C` · 700 `#62237F` ·
  600 `#742F92` · 500 `#8F50B1` · 400 `#B57EDC` (Lila) · 300 `#CCA5E8` · 200 `#E0CAF1` ·
  100 `#ECE2F0` (Lavanda) · 50 `#F7F2FA`. Papel `#F5F5F7`, Tinta `#111111`.
- Tema oscuro: `--primary` = Lila `#B57EDC`.
- Valores **descartados** (no volver a usarlos): `#741984`, `#784D92`, `#6B1FA2`, `#7C3AED`
  y el resto de la escala violeta anterior (Tailwind).
- Colores por categoría (propuesta, aún no aplicada en la app): Perfumes `#A3318A`, Medias
  `#5B3FC4`, Accesorios `#B03A5F`, Camisetas `#2F6FB0`, Chaquetas `#1F7A6D`, Monturas `#8A5A12`.

## Logo
- Archivos en esta carpeta: `purpleshop-logo-color.svg`, `-color-aro.svg` (fotos, fondos
  oscuros y morados), `-1color-blanco.svg`.
- La app conserva su logo anterior (con sombra) en `public/purple-shop-logo.png` e `icon.png`
  hasta cerrar el logo definitivo: los SVG de esta carpeta (sin sombra) **no** fueron aprobados
  por Edwing; se está rehaciendo con el look original (sombra suave y profundidad).
- Las letras P, l, e, S y p se salen del círculo. Sin la sombra/aro del logo original el borde
  queda abierto y se ve incompleto sobre blanco.

## Tipografía
Myriad Pro (impresión) · Inter (pantalla, la de la app) · Source Sans 3 (sustituta gratuita de
Myriad, p. ej. en Canva). Retiradas: Berlin Sans FB Demi, Champagne & Limousines, Oriflame
Script, Avant Garde.

## Datos oficiales
Instagram `@purpleshop.online` (minúscula) · WhatsApp `+57 322 957 5255`.
Frase: «Detalles que viajan con amor».

## Pendiente conocido
Los mensajes de WhatsApp de la app salen sin tildes («Guia», «envio», «confirmanos»); el tono
de marca los pide con tildes. El rótulo (preview y PDF) no se tocó: usa colores fijos (texto `#1A0630` y la imagen
`public/label-template-bg.png`, de un violeta propio), no las variables de globals.css. Si algún día
se quiere alinear al morado oficial, cambiar la imagen y `pdf.ts`/`globals.css` juntos y validar
preview y PDF a la vez.
