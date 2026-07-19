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
