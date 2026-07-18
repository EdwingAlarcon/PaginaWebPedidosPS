# Purple Shop

Sistema de gestion de pedidos, clientes, inventario y generacion de rotulos
para Purple Shop.

La aplicacion vive en [`apps/rotulos/`](apps/rotulos/README.md) (Next.js +
Supabase, desplegada en Vercel). Ese README es la fuente de verdad sobre
arquitectura, configuracion y desarrollo local.

**Produccion:** https://purpleshoponline.vercel.app

## Historia

Este repositorio alojo anteriormente una app legacy en la raiz (HTML/CSS/JS
plano con integracion a Excel/OneDrive via MSAL.js, servida en GitHub
Pages). Fue retirada tras migrar toda la funcionalidad a `apps/rotulos`;
el codigo sigue disponible en el historial de git anterior a este commit
para referencia.

## Scripts

Desde la raiz del repo (delegan a `apps/rotulos`):

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de produccion
npm run test     # tests unitarios
npm run test:e2e # tests end-to-end
npm run qa       # QA final
```
