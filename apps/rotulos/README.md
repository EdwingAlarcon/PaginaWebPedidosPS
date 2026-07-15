# Rótulos de envío

App Next.js para crear, guardar, imprimir y descargar rótulos de envío de Purple Shop. La aplicación vive en `apps/rotulos` y se ejecuta localmente en `http://localhost:3001`.

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

## Supabase y migraciones

Las migraciones están en `apps/rotulos/supabase/migrations`.

Aplica la migración principal en tu proyecto Supabase:

```bash
supabase db push --workdir apps/rotulos
```

Si no usas Supabase CLI, abre el SQL de `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql` y ejecútalo en el SQL editor de Supabase.

La migración crea las tablas, políticas RLS y funciones necesarias para rótulos, clientes, configuración y numeración automática. Verifica que las políticas queden activas antes de usar la app en producción.

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

1. Crea un proyecto en Vercel apuntando a `apps/rotulos` como root directory.
2. Configura las variables de entorno de Supabase y `NEXT_PUBLIC_ROTULOS_BASE_URL` con la URL pública de Vercel.
3. Aplica las migraciones de Supabase antes de usar producción.
4. Usa el comando de build estándar:

```bash
npm run build
```

5. Después del deploy, prueba crear un rótulo, imprimirlo y descargar el PDF.

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
