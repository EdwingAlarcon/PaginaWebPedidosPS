# PurpleShop

App Next.js para operar PurpleShop desde web y movil: pedidos, clientes, rótulos de envío, historial, configuración e impresión/PDF. La aplicación vive en `apps/rotulos` y se ejecuta localmente en `http://localhost:3001`.

Producción: `https://purpleshoponline.vercel.app`

Supabase producción: proyecto `purpleshop`, ref `enrruhuzlnqqjnsabgzq`.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Proyecto de Supabase para persistencia.
- Vercel CLI opcional para despliegues desde terminal.

## Instalación

Desde la raíz del repositorio:

```bash
npm install --prefix apps/rotulos
```

También puedes entrar a la carpeta de la app:

```bash
cd apps/rotulos
npm install
```

## Desarrollo

Desde la raíz:

```bash
npm run rotulos:dev
```

O desde `apps/rotulos`:

```bash
npm run dev
```

Abre `http://localhost:3001`. La app raíz enlaza a esa URL desde la navegación principal.

## Variables de entorno

Copia el ejemplo y completa los valores:

```bash
cp apps/rotulos/.env.example apps/rotulos/.env.local
```

Variables usadas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROTULOS_BASE_URL=http://localhost:3001
```

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: llave pública anon para el cliente.
- `SUPABASE_SERVICE_ROLE_KEY`: llave service role para operaciones del servidor; no la expongas en el navegador.
- `NEXT_PUBLIC_ROTULOS_BASE_URL`: URL pública o local de la app para enlaces y generación de PDF.

## Acceso

La app usa Supabase Auth con enlace por correo. En producción, configura en Supabase los correos/usuarios permitidos y la URL pública de Vercel como redirect URL. Sin variables Supabase, la app muestra "Modo local de desarrollo" y usa almacenamiento local solo para pruebas.

## Supabase y migraciones

Las migraciones están en `apps/rotulos/supabase/migrations`.

Aplica la migración principal en tu proyecto Supabase:

```bash
supabase db push --workdir apps/rotulos
```

Si no usas Supabase CLI, abre el SQL de `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql` y ejecútalo en el SQL editor de Supabase.

La migración crea las tablas, políticas RLS y funciones necesarias para pedidos, items de pedido, clientes, códigos de producto, rótulos, configuración y numeración automática. Verifica que las políticas queden activas antes de usar la app en producción.

Tablas principales:

- `customers`: clientes centralizados.
- `orders`: encabezado de pedidos.
- `order_items`: productos/líneas de cada pedido.
- `product_codes`: códigos rápidos de productos.
- `labels`: rótulos de envío.
- `settings` y `order_sequences`: configuración y numeración.

## Scripts

Desde la raíz del repositorio:

```bash
npm run rotulos:dev
npm run rotulos:build
npm run rotulos:test
npm run rotulos:e2e
```

Desde `apps/rotulos`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:e2e
npm run test:e2e:headed
```

## PDF e impresión

El rótulo usa tamaño físico fijo de `14cm x 11cm`. La vista previa, la impresión del navegador y el PDF comparten el mismo diseño para mantener consistencia.

Recomendaciones de impresión:

- Papel o etiqueta configurada en `14cm x 11cm`.
- Escala al 100%.
- Márgenes desactivados o en cero.
- Orientación horizontal si el diálogo de impresión lo solicita.
- Desactivar encabezados y pies de página del navegador.

Para descargar PDF, guarda primero el rótulo y usa la acción de PDF. El endpoint del servidor genera el archivo con Playwright respetando `14cm x 11cm`.

## Despliegue en Vercel

1. Proyecto Vercel: `edwingalarcons-projects/rotulos`.
2. URL pública estable: `https://purpleshoponline.vercel.app`.
3. Configura las variables de entorno de Supabase y `NEXT_PUBLIC_ROTULOS_BASE_URL` con la URL pública de Vercel.
4. Aplica las migraciones de Supabase antes de usar producción.
5. Usa el comando de build estándar:

```bash
npm run build
```

6. Después del deploy, prueba crear un pedido, verificar que aparezca en clientes/pedidos, crear un rótulo, imprimirlo y descargar el PDF.

## Verificación local

Ejecuta al menos:

```bash
npm --prefix apps/rotulos run typecheck
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run build
```

Para el flujo completo con navegador:

```bash
npm --prefix apps/rotulos run test:e2e
```
