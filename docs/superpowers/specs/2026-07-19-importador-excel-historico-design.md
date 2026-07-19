# Importador de data histórica desde Excel (REFERENCIAS.xlsx)

Fecha: 2026-07-19
Estado: aprobado, pendiente de implementación

## Contexto

Antes de `apps/rotulos`, los pedidos se llevaban en un Excel (`REFERENCIAS.xlsx`,
en Descargas/OneDrive del gerente) con una pestaña por mes (`SEPT 2025` ...
`JULIO 2026`, 10 hojas). Cada hoja contiene uno o varios bloques de pedido
(uno por cliente), con esta forma:

```
REF     | CLIENTE | DESCRIPCION              | CANTIDAD | TALLA | PRECIO UNITARIO | PRECIO TOTAL
Z1335   | ANDREA  | SET 3 ARETES BAILIN...   | 1        |       |                  | 13500
...
        |         | SUBTOTAL                  |          |       |                  | 100000
        |         | ENVIO                      |          |       |                  | 8500
        |         | TOTAL                      |          |       |                  | 108500
```

Hallazgos reales al inspeccionar el archivo (`SEPT 2025`, `JUNIO 2026`):

- Encabezado se repite arriba de cada bloque de cliente, no solo una vez por hoja.
- `TALLA` y `PRECIO UNITARIO` casi siempre vacíos; el precio real vive en
  `PRECIO TOTAL` (columna G), que la hoja trata como total de línea.
- Al menos un caso (`ACC448`, cantidad=2) tiene `PRECIO TOTAL` que no equivale
  a cantidad×precio unitario real, pero el `SUBTOTAL` de la hoja se calculó
  sumando la columna G literal — la hoja es internamente consistente aunque
  el dato de captura tenga error.
- Al menos un caso (`JUNIO 2026`, fila 48) tiene un `TOTAL` final de hoja que
  no cuadra con la suma de los subtotales de sus bloques — inconsistencia
  real del negocio, no del importador.
- Columnas extra ocasionales con datos sueltos fuera del layout esperado
  (ej. columna J duplicando REF en un bloque).
- Cantidad de columnas varía por hoja (8, 9 o 10).
- Cliente identificado solo por primer nombre/apodo (`ZAIDA`, `ANDREA`,
  `CARO`, `PILI`), sin teléfono ni dirección.

Se busca importar esta data histórica a Supabase sin dañar datos existentes
y con revisión humana antes de escribir nada.

Ver `CLAUDE.md` raíz del repo: este Excel nunca estuvo conectado a la app
anterior; cualquier importador debe entender su estructura real (confirmado
arriba) antes de tocar Supabase.

## Modelo de datos actual (relevante)

- `customers`: `id`, `full_name`, `phone` (unique parcial `where phone<>''`),
  `email`, `department`, `city`, `locality`, `neighborhood`, `address`.
  Sin campo de trazabilidad de origen.
- `orders`: `id`, `customer_id` (FK, nullable), `customer_snapshot` (jsonb),
  `order_date` (date, not null), `status` (`pending`/`completed`/`cancelled`),
  `notes`, `discount`, `shipping_cost`, `subtotal`, `total`, `created_by`
  (default `auth.uid()`, RLS lo exige en insert normal).
- `order_items`: `id`, `order_id` (FK cascade), `product_code`,
  `product_name`, `category`, `quantity`, `unit_price`, `total`.
- `product_codes`: catálogo vivo de productos (`code` unique, `unit_price`
  actual). No se toca en este import (decisión abajo).
- Normalización de texto a mayúscula: `apps/rotulos/src/lib/normalize.ts`,
  función `normalizeText()`. Reusar la misma en el importador.
- RLS en `orders`/`order_items` exige `created_by = auth.uid()` en insert
  normal → el importador corre con `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS).

No existe hoy ningún campo `source`/`metadata` en `orders` — se agrega en
este diseño (ver migración).

## Decisiones (confirmadas con el usuario)

1. **Clientes**: crear un `customer` placeholder por nombre único detectado
   en el Excel, con `phone=''`. No se cruza contra clientes reales
   existentes por nombre (evita fusionar por error dos personas distintas
   con el mismo apodo). Deuda aceptada: si el negocio ya tiene una "ZAIDA"
   real en la app, quedará duplicada; corrección manual futura si hace falta.
2. **Desajustes de totales** (ej. el caso de `JUNIO 2026` fila 48): se
   reportan como advertencia en el preview, pero el bloque se importa igual.
   Solo se excluyen bloques con datos rotos (cliente vacío, ítem sin
   cantidad/precio, bloque sin ítems).
3. **Fecha de pedido**: día 1 del mes de la hoja (`JUNIO 2026` →
   `2026-06-01`). `orders.notes` incluye el nombre de hoja original para
   trazabilidad legible.
4. **Status**: `completed` (son pedidos históricos ya cerrados).
5. **Catálogo de productos**: NO se seedea `product_codes` desde el Excel.
   `product_code`/`product_name` quedan solo en cada `order_item`, igual que
   hace la app hoy con pedidos manuales. Evita pisar precios vigentes del
   catálogo con precios históricos.
6. **Trazabilidad / anti-duplicados**: migración aditiva a `orders`:
   - `source text not null default 'app' check (source in ('app','excel_import'))`
   - `import_batch_id uuid` (agrupa todo lo insertado en una corrida, permite
     revertir con `DELETE ... WHERE import_batch_id = X`)
   - `import_row_key text` (clave determinística del bloque original: hoja +
     nombre cliente + índice de bloque en la hoja + subtotal declarado),
     unique parcial `where source = 'excel_import'`. Antes de insertar un
     bloque se verifica si ya existe ese `import_row_key`; si existe, se
     salta (script idempotente, correrlo N veces da el mismo resultado).
7. **Modo de ejecución**: script CLI local en
   `apps/rotulos/scripts/import-excel.mjs`, corrido a mano por el usuario
   con `SUPABASE_SERVICE_ROLE_KEY` en su entorno local. No se agrega ninguna
   pantalla nueva a la app en producción.

## Arquitectura: dos fases

**Fase A — parse + preview (sin flag, default)**

- Lee el `.xlsx` con una librería de parsing (a elegir en implementación,
  ej. `exceljs`), sin ninguna llamada a Supabase.
- Detecta bloques por hoja (ver algoritmo abajo).
- Normaliza texto con `normalizeText()`.
- Calcula y valida totales.
- Imprime reporte en consola y escribe un JSON de preview a disco (fuera de
  git, ej. bajo `apps/rotulos/scripts/.import-preview.json`, agregado a
  `.gitignore`).
- No escribe nada en Supabase.

**Fase B — commit (`--commit`)**

- Vuelve a parsear (o lee el JSON de preview ya revisado) y, por cada
  bloque válido, hace upsert de `customer` (si no existe ya el mismo nombre
  dentro de esta corrida), insert de `order` con `import_row_key` calculado,
  e insert de sus `order_items`.
- Antes de cada insert de `order`, chequea si ese `import_row_key` ya existe
  en Supabase; si sí, lo saltea (log "ya importado, omitido").
- Todo lo insertado en la corrida comparte el mismo `import_batch_id`.

Separar preview de commit es la barrera de seguridad central: nunca se
escribe en Supabase sin que el usuario haya visto el reporte primero.

## Algoritmo de detección de bloques

Por cada hoja del workbook:

1. Recorrer filas de arriba hacia abajo.
2. Reconocer fila de encabezado por patrón flexible (case-insensitive, trim)
   que matchee `REF`, `CLIENTE`, `DESCRIPCION`, `CANTIDAD` en las primeras
   columnas. Marca inicio de un nuevo bloque candidato.
3. Filas siguientes son ítems del bloque, hasta que la columna `CANTIDAD`
   (posicional, la 4ta columna con header reconocido) contenga literalmente
   `SUBTOTAL` (case-insensitive) — ahí se lee el valor de subtotal desde la
   columna `PRECIO TOTAL` de esa misma fila y se cierra la lista de ítems.
4. Después de `SUBTOTAL` pueden venir filas `ENVIO` y `TOTAL` (mismo
   mecanismo posicional). Si no aparecen, `shipping_cost = 0` y
   `total = subtotal` (o `subtotal + shipping_cost` si sí hay envío).
5. Filas totalmente vacías se saltan sin cerrar el bloque.
6. Nombre de cliente = valor de columna `CLIENTE` de la primera fila de
   ítem del bloque. Si alguna fila del bloque tiene un nombre distinto, el
   bloque entero se marca como error (no se importa).
7. Datos en columnas fuera del layout reconocido (ej. columna extra con
   valores sueltos) se listan en el reporte como "columna inesperada,
   ignorada — revisar", nunca se descartan en silencio.
8. Un nuevo header de bloque cierra cualquier bloque anterior abierto.

## Mapeo Excel → tablas

| Excel | Destino | Notas |
|---|---|---|
| Nombre de hoja (`JUNIO 2026`) | `orders.order_date` = día 1 de ese mes; también queda en `orders.notes` como `HOJA: JUNIO 2026` | |
| `CLIENTE` (bloque) | `customers.full_name` (normalizado mayúscula) | placeholder, `phone=''`, dedupe solo intra-corrida |
| `REF` | `order_items.product_code` (mayúscula, sin alterar formato alfanumérico) | |
| `DESCRIPCION` | `order_items.product_name` (normalizado mayúscula) | |
| `CANTIDAD` | `order_items.quantity` | |
| `PRECIO TOTAL` (línea) | `order_items.total` (valor literal, no recalculado) | `unit_price = total / quantity` (aproximado si hay error de captura upstream) |
| `SUBTOTAL` del bloque | `orders.subtotal` | |
| `ENVIO` del bloque | `orders.shipping_cost` | 0 si falta |
| `TOTAL` del bloque | `orders.total` | si falta, `subtotal + shipping_cost` |
| (fijo) | `orders.status = 'completed'`, `orders.source = 'excel_import'`, `orders.import_batch_id`, `orders.import_row_key` | |
| customer creado | `orders.customer_snapshot` | copia del customer |

## Validación de totales

Por bloque:

- `subtotal_calculado = Σ(order_items.total)` comparado contra `SUBTOTAL`
  declarado en la hoja. Coincide → OK. No coincide → advertencia (no
  bloquea), con la diferencia en $ en el reporte.
- `SUBTOTAL + ENVIO` comparado contra `TOTAL` declarado, mismo criterio.
- El total general al pie de la hoja (cuando existe) se reporta pero NO se
  usa como fuente de verdad — se usan siempre los `SUBTOTAL`/`TOTAL` por
  bloque, más confiables que el total de hoja (visto que puede no cuadrar).

Bloques excluidos del import (van a sección "errores", no "advertencias"):

- Nombre de cliente vacío o inconsistente dentro del bloque.
- Ítem sin cantidad o sin precio total.
- Bloque sin ningún ítem (solo header seguido de SUBTOTAL).

## Reporte de previsualización

Por hoja y resumen global, formato:

```
HOJA: JUNIO 2026
  Bloques detectados: 4 (ZAIDA, ANDREA, CARO, PILI)
  Clientes nuevos a crear: 4
  Ítems detectados: 32
  ADVERTENCIA Bloque ANDREA (fila 21): ENVIO vacío, asumido $0
  ADVERTENCIA Bloque PILI (fila 38): TOTAL de hoja no cuadra con suma de bloques (diferencia $X) — no bloquea
  ERROR Columna inesperada con dato en fila 28-34 (col J) — ignorada, revisar manualmente

RESUMEN GLOBAL
  Hojas leídas: 10
  Clientes nuevos: N
  Pedidos a crear: N
  Ítems a crear: N
  Advertencias: N
  Errores (bloques excluidos): N
  Total $ a importar: $X
```

También se escribe el mismo detalle en el JSON de preview (gitignored) para
poder correr Fase B sin re-parsear si el usuario ya lo revisó.

## Riesgos

- Nombres de cliente ambiguos entre distintas personas con el mismo apodo
  (aceptado, ver decisión 1).
- `unit_price` derivado no es 100% fiel al precio unitario real histórico en
  filas con error de captura (aceptado, se prioriza fidelidad del total).
- El Excel real puede tener variaciones no cubiertas por las 2 hojas
  muestreadas (`SEPT 2025`, `JUNIO 2026`) — el parser debe fallar visible
  (listar en errores), nunca inventar datos silenciosamente.
- Migración es aditiva, no rompe pedidos existentes (default `'app'`).

## Archivos a tocar

- Nuevo: `apps/rotulos/supabase/migrations/202607190001_add_excel_import_tracking.sql`
- Nuevo: `apps/rotulos/scripts/import-excel.mjs`
- Nuevo (gitignored): `apps/rotulos/scripts/.import-preview.json`
- Ningún archivo de `apps/rotulos/src/` (app en vivo) se toca.

## Fases de implementación

1. Migración SQL (`source`, `import_batch_id`, `import_row_key`).
2. Parser + detección de bloques (Fase A) — sin Supabase, solo lectura
   Excel → JSON + consola.
3. Validación de totales + reporte de advertencias/errores.
4. Usuario revisa el reporte contra el Excel real.
5. Commit a Supabase (Fase B, `--commit`), dedupe vía `import_row_key`.
6. Verificación post-import: conteo de pedidos por hoja, chequeo visual en
   la app.
