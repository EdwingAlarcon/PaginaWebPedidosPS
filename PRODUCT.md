# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Edwing (dueño/desarrollador) y su gerente, operando la única app del repo
(`apps/rotulos`) desde escritorio y desde el celular (PWA instalable, junto
a WhatsApp) durante la operación diaria del negocio:
crear y editar pedidos, registrar pagos, gestionar clientes, despachar,
asignar guías, compartir el catálogo y generar rótulos de envío en PDF. No hay equipo más amplio usando el sistema hoy.

## Product Purpose

Purple Shop es el sistema de gestión operativa de una tienda: pedidos,
clientes, productos/inventario y generación de rótulos de envío. Éxito
significa reemplazar procesos manuales (Excel/copiar datos a mano) por un
flujo donde pedido, cliente y rótulo están conectados y no requieren
duplicar información.

## Positioning

A diferencia de una planilla Excel/Google Sheets, el rótulo de envío se
genera directamente desde el pedido, con los datos del cliente ya
vinculados (`customer_snapshot`) y el código de producto del catálogo —
sin copiar/pegar manual ni riesgo de que el rótulo quede desincronizado
del pedido real.

## Operating Context

Flujo diario: crear pedido → asociar o crear cliente → registrar pago →
generar rótulo PDF → despachar → asignar la guía de Interrapidísimo y
enviarla al cliente por WhatsApp. Historial de pedidos y clientes se consulta y edita
regularmente. Departamento/Ciudad Colombia con campos extra (Localidad,
Barrio/Sector) cuando la ciudad es Bogotá. Datos históricos se importan
periódicamente desde el Excel real del negocio ("REFERENCIAS", en
OneDrive del gerente) de forma manual (`npm run import:excel`).

## Capabilities and Constraints

- Auth: OAuth Microsoft + allowlist (`allowed_users`), sin acceso público.
- Todo texto de usuario se normaliza a MAYÚSCULA antes de persistir
  (datos históricos previos no se reescriben retroactivamente).
- PDF de rótulos generado con `pdf-lib` (no navegador/Chromium headless);
  preview (CSS) y PDF comparten coordenadas que deben mantenerse en
  sincronía manualmente.
- `product_codes` (catálogo para pedidos/rótulos) y `products`
  (inventario con stock real) son tablas distintas e independientes. El
  negocio vende por catálogo, sin bodega: `products` está vacía a propósito
  (decisión de Edwing, 2026-09-22) y la interfaz oculta lo de stock.
- Identidad visual: manual de marca v2.0, ver `docs/brand/BRAND.md`.
- Sincronización de Excel real del negocio es manual por decisión
  explícita — no automatizar sin permiso.
- Ver `CLAUDE.md` para reglas técnicas completas (rutas API protegidas,
  RLS, service role key, etc.) — son restricciones vigentes que todo
  trabajo de diseño debe respetar.

## Evidence on Hand

Producción real en https://purpleshoponline.vercel.app, en uso operativo
por el negocio desde 2026-07. Auditoría de producto con sesión real
(2026-09-21) y revisión móvil con capturas del celular de Edwing
(2026-09-22), ambas con hallazgos implementados. No hay testimonios, casos de
estudio ni prensa — no fabricar ninguno.

## Product Principles

- Un solo dato de verdad: cliente maestro sincroniza a pedidos vinculados;
  no duplicar edición en dos lugares.
- Reducir trabajo manual repetitivo (copiar datos, buscar cliente,
  recalcular) es más valioso que ornamentación visual.
- Consistencia preview/PDF del rótulo es un requisito funcional, no solo
  estético.
- Cambios de diseño no deben romper el flujo operativo diario de un
  negocio real en producción.

## Accessibility & Inclusion

Sin requisito formal. Base ya aplicada: un solo `h1` por página, skip link,
foco visible en todo control y contraste de texto sobre color según
`docs/brand/BRAND.md`.
