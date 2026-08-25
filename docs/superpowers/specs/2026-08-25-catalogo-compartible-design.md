# Catálogo compartible (PDF + imagen WhatsApp)

Fecha: 2026-08-25
Estado: aprobado, pendiente de plan de implementación

## Objetivo

Generar un catálogo de perfumes que Edwing pueda compartir con clientes,
con foto, precio, datos del negocio y redes sociales. Salida en dos
formatos: PDF descargable/imprimible e imagen larga para WhatsApp.
Inspiración visual: catálogo web de referencia (grid por categoría,
buscador, header con marca) compartido por el usuario como artifact.

## Alcance

Incluye:
- Campo de foto en el catálogo de productos (`product_codes`).
- Página nueva de gestión del catálogo (no existe hoy una pantalla para
  editar `product_codes` fuera del alta implícita en `Nuevo pedido`).
- Extensión de `Configuración` con correo, Facebook y TikTok del negocio.
- Generador de PDF (`catalog-pdf.ts`) y de imagen (`catalog-image.ts`).
- Botones de descarga/envío en la nueva página de catálogo.

Fuera de alcance:
- Selección manual de qué productos van al catálogo (siempre es el
  catálogo activo completo, ordenado por categoría).
- Dirección física del negocio (tienda 100% virtual, confirmado).
- Cambios a `products` (inventario real) — el catálogo se arma desde
  `product_codes`, que es lo que se vende por revista sin stock físico
  propio.
- Catálogo público en la web (fuera de la app autenticada). Solo
  exportación PDF/imagen para compartir manualmente.

## Datos

### Migración: agregar foto a `product_codes`

```sql
alter table public.product_codes
  add column if not exists image_url text;
```

`image_url` nullable: productos sin foto todavía usan un placeholder en
el catálogo generado (silueta/ícono genérico), no bloquean la
generación.

### Migración: bucket de fotos de producto

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
```

Público (a diferencia de `backups`, privado) porque la foto debe poder
renderizarse en `<canvas>` (imagen WhatsApp) y en `pdf-lib` sin fricción
de sesión/CORS, igual que el logo actual servido desde `/public`.
Políticas RLS del bucket: `insert`/`update`/`delete` solo
`authenticated`; `select` público (bucket marcado `public: true` ya
cubre lectura).

### Migración: datos de contacto del negocio en `settings`

```sql
alter table public.settings
  add column if not exists email text not null default '',
  add column if not exists facebook_user text not null default '',
  add column if not exists tiktok_user text not null default '';
```

Se reutilizan `instagram_user` y el teléfono de `default_sender`
(WhatsApp) que ya existen — no se duplican.

## Tipos (`business-types.ts`)

```ts
export type ProductCode = {
  id: string;
  code: string;
  productName: string;
  category: string;
  unitPrice: number;
  imageUrl: string | null; // nuevo
  createdAt: string;
  updatedAt: string;
};

export type ProductCodePatch = Partial<
  Pick<ProductCode, "productName" | "category" | "unitPrice" | "imageUrl">
>;
```

`business-store.ts` gana `updateProductCode(id, patch)` y
`deleteProductCode(id)` en ambos stores (Supabase y localStorage) — hoy
solo existe `saveProductCode` (alta/upsert por `code`), no hay edición
ni borrado independientes.

`LabelSettings` (`types.ts`) gana `email: string`, `facebookUser: string`,
`tiktokUser: string`, con defaults `''`. `business-store.ts` /
`defaults.ts` actualizan el mapeo Supabase ↔️ tipo.

## UI nueva: página `/catalogo`

No existe hoy pantalla para editar `product_codes` fuera del alta
implícita en `Nuevo pedido` (el código/nombre/precio se crean al
escribir un producto nuevo en una línea de pedido). Se agrega una
página `Catálogo` en el menú lateral:

- Tabla de productos del catálogo: foto (thumbnail o placeholder),
  nombre, código, categoría, precio — mismo patrón visual que
  `products-table.tsx`.
- Edición por fila (drawer, igual patrón que `inventario`): nombre,
  categoría, precio, subir/reemplazar foto. Subir foto = input file →
  sube a bucket `product-images` → guarda `image_url` con
  `updateProductCode`.
- Borrar producto del catálogo (con confirmación) si ya no se vende.
- Sección superior: "Generar catálogo" con dos botones — **Descargar
  PDF** y **Descargar imagen** (WhatsApp vía `buildWhatsAppLink` de
  `whatsapp.ts`, adjuntando la imagen generada como el usuario ya hace
  hoy con el resumen de compra: se descarga y se adjunta manualmente, no
  hay envío automático de archivos por WhatsApp Web).

## Generación de PDF (`src/lib/catalog-pdf.ts`)

Mismo patrón que `order-summary-pdf.ts` (`pdf-lib`, tamaño carta,
paleta morada de marca ya definida ahí). Estructura:

1. **Portada**: logo, `brandPhrase`, WhatsApp (`default_sender.phone`),
   Instagram (`instagram_user`), correo, Facebook/TikTok si están
   llenos (se omite la línea si el campo está vacío).
2. **Páginas de productos**: agrupados por `category` (orden alfabético
   de categoría, productos alfabético dentro de cada una). Grid de
   tarjetas: foto (o placeholder), nombre, precio (`formatCop`). Salto
   de página automático cuando no cabe la siguiente fila.
3. Fotos: se descargan (`fetch` + `arrayBuffer`) y se embeben con
   `doc.embedJpg`/`embedPng` según tipo de contenido; si falla la
   descarga de una foto puntual, se usa el placeholder para esa tarjeta
   sin abortar el PDF completo.

## Generación de imagen (`src/lib/catalog-image.ts`)

Mismo patrón que `order-summary-image.ts` (canvas 2D, `EXPORT_SCALE =
2`, `toDataURL`/`toBlob` PNG). Una sola imagen larga: header con datos
del negocio (igual contenido que la portada del PDF), luego el grid por
categoría en vertical continuo. Alto del canvas se calcula en dos
pasadas (medir cuántas filas por categoría → alto total) antes de
dibujar, igual que ya hace `ReceiptBuilder`.

## Testing

- Unit: `catalog-pdf.test.ts` / `catalog-image.test.ts` — construir con
  1) catálogo vacío, 2) productos sin foto (placeholder), 3) productos
  con foto simulada (mock de `fetch`), 4) múltiples categorías (verificar
  agrupación/orden). Mismo estilo que `order-summary-image.test.ts`.
- Unit: `business-store.test.ts` — `updateProductCode`,
  `deleteProductCode`, defaults de `email`/`facebookUser`/`tiktokUser`.
- Manual en navegador (sin Chromium): generar catálogo con 0, 1 y varios
  productos, con y sin foto, verificar PDF e imagen resultantes, y que
  `Configuración` guarda/muestra los campos nuevos.

## Riesgos / decisiones aceptadas

- Bucket de fotos público: aceptado porque son fotos de producto para
  mostrar a clientes, no información sensible (a diferencia de
  `backups`, que si es privado).
- Sin selección manual de productos por corrida: si en el futuro se
  necesita (p. ej. descontinuar un perfume sin borrarlo), se agrega un
  campo `activeInCatalog boolean` — no se construye ahora (YAGNI).
- `product_codes` nunca tuvo pantalla de edición propia; esta spec la
  agrega como prerequisito de la foto, no como proyecto aparte.
