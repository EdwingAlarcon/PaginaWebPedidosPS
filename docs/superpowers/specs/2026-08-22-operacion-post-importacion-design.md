# Operacion Post Importacion Design

## Contexto

El 2026-08-22 se cargaron pedidos historicos desde `Copia de REFERENCIAS-2024-2025.xlsx` contra produccion. El importador creo 73 pedidos nuevos y omitio 2 existentes por idempotencia. Despues se unificaron alias de clientes en produccion con `merge_customers`: JOHANNA -> JOHANNA CICACHA, ZAIDA -> ZAIDA SUAREZ, LINA -> LINA GONZALEZ, PAULA -> PAULA BAJONERO, ANDREA UBAQUE duplicado y PILAR CONGOTE duplicado. La verificacion final dejo 14 clientes, 99 pedidos, 766 lineas de pedido, sin nombres exactos duplicados.

Commits base:

- `5c9e8e4 fix(rotulos): soportar historicos excel 2024`
- `35c365b fix(rotulos): ordenar clientes alfabeticamente`

Backups locales antes de operaciones masivas:

- `backups/backup-before-historical-import-2026-08-22T00-31-43-138Z.json`
- `backups/backup-before-client-alias-merge-2026-08-22T00-42-18-330Z.json`

## Objetivo

Construir un sprint de mejoras operativas para controlar la data historica importada, prevenir nuevos duplicados y dar herramientas de diagnostico antes de cualquier restauracion de backups.

## Alcance

1. Vista "Pedidos importados" para revisar pedidos `orders.source = 'excel_import'`.
2. Mapa de alias para que el importador reutilice clientes canonicos conocidos.
3. Detector de posibles clientes duplicados en `Clientes`.
4. Reporte historico 2024/2025 para medir ventas, pedidos, clientes y productos importados.
5. Comparador de backup JSON contra la data actual, sin escribir en base de datos.

## Fuera de alcance

- Restaurar datos automaticamente desde JSON.
- Automatizar lectura del Excel real del negocio.
- Cambiar el modelo de inventario o enlazar productos historicos a stock real.
- Revertir o borrar pedidos historicos ya cargados.
- Cambiar clientes existentes sin accion explicita del usuario.

## Requisitos funcionales

- Las pantallas nuevas deben usar los stores existentes (`getBusinessStore`, `getLabelStore`, `getInventoryStore`) o rutas API protegidas con `requireSession()` cuando necesiten service role.
- Todo dato de cliente mostrado en listas debe ordenarse alfabeticamente por nombre, usando criterio consistente con `business-store.ts`.
- El importador debe conservar idempotencia por `import_row_key`.
- Los alias deben normalizar a mayuscula y aplicarse antes de crear o buscar cliente.
- El detector de duplicados debe sugerir, no ejecutar, fusiones de clientes.
- El comparador de backup JSON debe ser solo lectura: carga archivo local en navegador o recibe payload JSON y muestra diferencias.
- Las diferencias de backup deben agruparse por tabla y severidad: faltante en actual, extra en actual, cambiado.
- Ninguna ruta API nueva puede quedar publica; toda API bajo `src/app/api/` debe llamar `requireSession()` al inicio.

## Requisitos de UI

- Interfaces operativas, densas y escaneables; nada de landing pages.
- Usar iconos lucide en botones cuando exista icono apropiado.
- No poner tarjetas dentro de tarjetas.
- Mantener componentes compactos y responsivos; tablas con `overflow-x-auto`.
- No mostrar texto instructivo largo dentro de la app; copy breve y accionable.

## Validacion

Cada tarea de codigo debe cerrar con:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si toca UI, validar visualmente en navegador local o produccion despues del deploy. Si no hay credenciales para sesion autenticada, dejarlo explicitamente documentado.

## Criterio de cierre del sprint

- Todas las tareas tienen tests relevantes.
- La app queda en `main`, limpia, pusheada y desplegada.
- `CLAUDE.md` y `NEXT_STEPS.md` quedan actualizados con lo implementado, pendientes reales y cualquier limitacion.
