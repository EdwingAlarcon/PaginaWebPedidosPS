# CLAUDE.md

Guia para Claude Code al trabajar en este repositorio.

## Proyecto

Purple Shop — gestion de pedidos, clientes, inventario y generacion de
rotulos. La unica app del repo vive en `apps/rotulos/` (Next.js +
Supabase, desplegada en Vercel). No hay documentacion de arquitectura
propia todavia en `apps/rotulos/`; usa `apps/rotulos/README.md` y lee el
codigo fuente ahi para entender convenciones.

**Produccion:** https://purpleshoponline.vercel.app

## Cosas explicitamente fuera de alcance / no tocar sin permiso

- **No sincronizar contra el workbook Excel real del negocio**
  ("REFERENCIAS", en OneDrive del gerente) — nunca estuvo conectado a esta
  app y no debe conectarse sin diseñar antes un importador que entienda su
  estructura real (un worksheet por mes, bloques variables por cliente).
  Ver `docs/superpowers/` para el historial de decisiones si hace falta
  mas contexto.

## Historia

Este repositorio alojo hasta 2026-07 una app legacy en la raiz
(HTML/CSS/JS plano con integracion a Excel/OneDrive via MSAL.js, servida
en GitHub Pages). Fue retirada tras migrar toda la funcionalidad a
`apps/rotulos`; el codigo y su documentacion siguen disponibles en el
historial de git anterior a ese retiro.
