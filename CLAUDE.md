# CLAUDE.md

Guia para Claude Code al trabajar en este repositorio.

## Proyecto

Purple Shop — gestion de pedidos, clientes, inventario y generacion de
rotulos. La unica app del repo vive en `apps/rotulos/` (Next.js +
Supabase, desplegada en Vercel). No hay documentacion de arquitectura
propia todavia en `apps/rotulos/`; usa `apps/rotulos/README.md` y lee el
codigo fuente ahi para entender convenciones.

**Produccion:** https://purpleshoponline.vercel.app

## Estado operativo reciente

- 2026-07-18 noche: la mejora importante de formularios de ubicacion ya
  esta desplegada. Los selectores de departamento/ciudad usan datos de
  Colombia; para Bogota se pide Localidad y Barrio/Sector con validacion.
  Supabase remoto ya tiene `customers.locality`.
- Exportar PDF funciona en produccion desde `Crear rotulo` y desde
  `Historial`. Se abandono la generacion con navegador/Chromium en Vercel
  y ahora el PDF se genera con `pdf-lib` en `apps/rotulos/src/lib/pdf.ts`.
- El pie del rotulo fue compactado y alineado: numero de pedido, fecha,
  transportadora, valor, paquetes y check de metodo de pago deben verse
  completos dentro de la franja inferior tanto en vista previa como en PDF.
  Coordenadas sincronizadas en `apps/rotulos/src/app/globals.css` y
  `apps/rotulos/src/lib/pdf.ts`.
- Ultimo commit funcional verificado: `35a38cd fix(rotulos): compactar textos del pie`.
- 2026-07-19: importador de data historica desde Excel (`REFERENCIAS.xlsx`)
  implementado y corrido contra produccion (23 pedidos, 9 clientes nuevos).
  Ver `NEXT_STEPS.md` seccion "Importador de data historica" para detalle
  completo y `docs/superpowers/specs/2026-07-19-importador-excel-historico-design.md`
  para el diseño. Diseño de "editar clientes" (para completar datos de los
  clientes importados) aprobado, pendiente de implementar — ver
  `NEXT_STEPS.md` seccion "Pendiente".

## Cosas explicitamente fuera de alcance / no tocar sin permiso

- **El Excel real del negocio** ("REFERENCIAS", en OneDrive del gerente)
  ya se importo una vez (2026-07-19) con un importador que entiende su
  estructura real (un worksheet por mes, bloques variables por cliente) —
  ver detalle en `NEXT_STEPS.md`. El importador es idempotente y se puede
  correr de nuevo a mano si hay meses nuevos que cargar. Lo que sigue
  fuera de alcance sin permiso explicito es **automatizar** esa
  sincronizacion (cron, webhook, etc.) — debe seguir siendo manual.

## Historia

Este repositorio alojo hasta 2026-07 una app legacy en la raiz
(HTML/CSS/JS plano con integracion a Excel/OneDrive via MSAL.js, servida
en GitHub Pages). Fue retirada tras migrar toda la funcionalidad a
`apps/rotulos`; el codigo y su documentacion siguen disponibles en el
historial de git anterior a ese retiro.
