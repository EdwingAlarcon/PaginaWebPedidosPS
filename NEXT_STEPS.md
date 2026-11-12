# Purple Shop — Pendientes y decisiones vigentes

> Actualizado 2026-11-11. Este archivo lista solo lo que está **abierto** y las
> decisiones que siguen mandando. El detalle de lo ya hecho está en el
> historial de git y en `CLAUDE.md` → "Estado operativo reciente"; las
> decisiones de diseño de cada función, en `docs/superpowers/specs/`.

**Producción:** https://purpleshoponline.vercel.app · Supabase `purpleshop`
(ref `enrruhuzlnqqjnsabgzq`). No hay bloqueantes: la app opera con pedidos
reales desde agosto de 2026.

## Pendiente

### Por verificar con Edwing

1. **Tarjetas en celular** (commit `ffc17d3`, 2026-11-11): Pedidos, Clientes,
   Historial, Importados y Despacho muestran una tarjeta por fila bajo 640px.
   Falta que Edwing lo confirme en su teléfono.
2. **Restauración controlada de backup** (`Configuración` → `Comparar backup
   JSON` → `Preparar restauración`): el código llegó a producción el
   2026-09-03 pero nunca se probó ahí con datos reales.
3. **Inventario vinculado a pedidos e historial de cambios del pedido**
   (migraciones `202607270003` y `202607270004`): nunca se hizo la prueba
   manual paso a paso. Hoy no aplica en la práctica porque `products` está
   vacía a propósito (ver "Decisiones"); probar solo si algún día se carga
   inventario.

### Tareas recurrentes

- **Después de cada `npm run import:excel`:** correr
  `apps/rotulos/supabase/manual/202609210002_backfill_historical_payments.sql`
  en el SQL Editor. Hasta entonces los pedidos importados nuevos salen
  "Sin registro" de pago.
- **Antes de una operación masiva** (importar, unificar varios clientes,
  restaurar): descargar el backup JSON desde `Configuración`.

### Datos por corregir a mano

- Tres pares de productos del catálogo con el mismo nombre: `PS-M-026`/`PS-M-027`
  ("CAROLINA HERRERA LEAU"), `PS-H-085`/`PS-H-086` ("JEAN PAUL GAULTIER LE
  MALE", $85.000 y $75.000) y `PS-H-130`/`PS-H-133` ("PACO RABANNE BLACK XS").
  Renombrar desde `/catalogo`.
- Clientes sin teléfono: se completan desde `Clientes` → "Completar uno por
  uno". Sin teléfono no se pueden reactivar por WhatsApp.

### Mejoras opcionales (ninguna urgente)

- **Resumen del Inicio en servidor** (RPC `dashboard_summary`): hoy
  `dashboard-stats.tsx` calcula en el navegador. Recién hace falta cuando haya
  miles de pedidos. Obliga a reescribir en SQL las reglas de despacho, cartera
  (`summarizePayment`) y coincidencia de cliente; el riesgo es que Inicio y
  Despacho muestren números distintos.
- **Restauración de backup — Fase 2** (pedidos, líneas, inventario, borrados):
  requiere aprobación nueva de Edwing. Diseño en
  `docs/superpowers/specs/2026-08-22-restauracion-controlada-backup-json-design.md`.
- **Pedido desde fotos de catálogo**: prellenar un pedido a partir de las
  fotos que el cliente manda por WhatsApp. Idea del 2026-10-28, sin diseñar.
- **Service Worker / uso sin conexión**: la PWA es instalable pero no funciona
  offline.
- **Rótulo con la marca v2**: preview y PDF usan todavía su violeta propio
  (`public/label-template-bg.png`, texto `#1A0630`). Si se alinea, cambiar
  imagen, `globals.css` y `pdf.ts` juntos y validar preview y PDF a la vez.
- **Animaciones**: ningún componente respeta `prefers-reduced-motion`; el
  sidebar anima `width` (provoca reflow) en vez de `transform`; el texto y el
  ícono del sidebar cambian de golpe al colapsar.
- **Alias CSS heredados** (`--color-primary`, `--text-primary`, …) en
  `globals.css`: siguen en uso en pantallas viejas; no agregar usos nuevos.

## Decisiones vigentes (no reabrir sin que Edwing lo pida)

- **No cargar inventario** (2026-09-22): se vende por catálogo, sin bodega.
  `product_codes` (319 productos, catálogo y pedidos) y `products` (stock,
  vacía) siguen separadas; la interfaz oculta tarjetas de stock y el ítem
  Inventario mientras no haya productos.
- **El rótulo no se cruza con los pagos** (2026-09-22): `paymentMethod` y
  `codAmount` del rótulo son instrucción para la transportadora, no registro
  contable.
- **Estado y pago son ejes independientes**: pagar no completa un pedido y
  completar no lo paga; "Marcar completado" ofrece registrar el saldo en el
  mismo diálogo. Solo los pedidos `excel_import` sin abonos cuentan como "sin
  registro"; un pedido de la app completado sin pago sigue siendo deuda.
- **Pedido completado o pagado**: para tocar líneas, descuento o envío la RPC
  `update_order` exige motivo de ajuste.
- **Guías de Interrapidísimo semi-manuales** (`/guias`): no hay API para
  clientes ni la guía viene en sus notificaciones. No volver a proponer
  automatización completa salvo que la transportadora cambie.
- **Links de WhatsApp con `api.whatsapp.com/send`**, nunca `wa.me` (rompe los
  emojis).
- **Excel "REFERENCIAS"**: el importador es manual e idempotente
  (`npm run import:excel -- <ruta.xlsx> [--commit]`). No automatizarlo.
- **Restauración de backups**: solo `customers`, `labels`, `settings` y
  `order_payments`, con preview, backup previo y confirmación escrita. Nada
  automático ni masivo.
- **Marca v2.0**: morado `#6E1593`, logo original intacto, portadas de
  perfumes del catálogo tal cual. Ver `docs/brand/BRAND.md`.
- **Cierre de cada cambio**: validar, commit, push (el push a `main` despliega
  solo) y verificar producción, salvo instrucción contraria de Edwing.

## Para no tropezar

- **Migraciones**: el CLI de Supabase no tiene sesión en este entorno; Edwing
  las aplica a mano en el SQL Editor. `supabase/manual/verificar_migraciones_pendientes.sql`
  (solo lectura) dice cuáles faltan. Ya pasó dos veces que una función se dio
  por desplegada con su migración sin aplicar.
- **`proxy.ts`**: el matcher se exporta como `config` (no `proxyConfig`). Un
  nombre equivocado hizo que el proxy redirigiera los JS a `/login` y tumbó la
  app el 2026-07-27. Después de tocarlo, abrir el sitio real.
- **`.gitignore`**: una regla `backups/` sin anclar dejó fuera de git las
  rutas `api/backups/` durante dos semanas. Si el build local pasa y el de
  Vercel no, buscar archivos sin trackear.
- **Supabase corta en 1000 filas sin avisar**: todo listado completo debe
  paginar (`src/lib/paginate.ts`, `selectAllRows`).
- **Tests en Node 26 local**: `NODE_OPTIONS=--no-experimental-webstorage`.
- **Claude no tiene sesión de la app**: no puede probar con login real ni
  escribir en producción con la service role; eso lo hace Edwing desde la UI o
  el SQL Editor.
