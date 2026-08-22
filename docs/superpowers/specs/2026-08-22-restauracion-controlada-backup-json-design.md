# Diseño: restauración controlada de backup JSON

Estado: **diseño listo, no implementado**. Este documento toma como base el
backup JSON completo (`src/lib/backup.ts`) y el comparador solo lectura
(`src/lib/backup-compare.ts`) entregados en el sprint post-importación.

## Contexto

La app ya puede:

- Exportar un backup JSON completo desde `Configuración`.
- Generar backups automáticos por cron hacia Storage, si el bucket `backups`
  y `CRON_SECRET` están configurados en producción.
- Comparar un backup JSON anterior contra el estado actual sin subir el
  archivo ni escribir en la base.

Lo que falta, y debe tratarse como operación de alto riesgo, es restaurar
datos desde un backup hacia Supabase producción.

## Objetivo

Permitir una restauración **controlada, auditada y reversible en la práctica**
desde un backup JSON, para casos como:

- Recuperar una fila borrada por error.
- Revertir datos puntuales de clientes, pedidos, rótulos, inventario o
  configuración.
- Reconstruir información faltante después de una operación masiva.

La herramienta debe restaurar por selección explícita de tablas/filas, no por
"restaurar todo" como acción rápida.

## Fuera de alcance

- Restaurar automáticamente al detectar diferencias.
- Sobrescribir toda la base con un backup completo.
- Borrar filas actuales por defecto.
- Ejecutar restauraciones desde el cliente usando credenciales públicas.
- Automatizar restauraciones desde el bucket de backups sin intervención
  humana.

## Principios de seguridad

1. **Dry-run obligatorio**: toda restauración genera primero un plan con
   resumen de impactos. Sin plan no hay ejecución.
2. **Backup antes de tocar datos**: antes de ejecutar, la API crea un backup
   JSON nuevo del estado actual y devuelve/guarda su nombre.
3. **Permiso adicional**: además de `requireSession()`, exigir un allowlist
   específico por variable de entorno, por ejemplo
   `BACKUP_RESTORE_ALLOWED_EMAILS`.
4. **Feature flag**: la ejecución queda deshabilitada salvo que
   `BACKUP_RESTORE_ENABLED=true`.
5. **Sin borrados por defecto**: el modo inicial solo permite `insert` de
   faltantes y `update` de cambiados seleccionados. Eliminar filas extra debe
   quedar para una fase posterior.
6. **Auditoría propia**: cada intento queda registrado con usuario, fecha,
   resumen, tablas afectadas, backup previo y resultado.
7. **Selección explícita**: el usuario marca qué diferencias quiere restaurar.
   Nada queda preseleccionado si el cambio es destructivo o ambiguo.

## Modelo de datos propuesto

Nueva tabla `backup_restore_runs`:

```sql
create table public.backup_restore_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by text not null,
  requested_at timestamptz not null default now(),
  mode text not null check (mode in ('dry_run', 'execute')),
  source_backup_generated_at timestamptz,
  pre_restore_backup_filename text,
  status text not null check (status in ('planned', 'completed', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  selected_changes jsonb not null default '[]'::jsonb,
  error text
);

alter table public.backup_restore_runs enable row level security;

grant select on public.backup_restore_runs to authenticated;

create policy "Authenticated users can read backup restore runs."
  on public.backup_restore_runs for select to authenticated
  using (true);
```

No se recomienda dar `insert/update/delete` directo a `authenticated`; la ruta
API con service role debe escribir estos registros.

## API propuesta

### `POST /api/backups/restore/preview`

Protección:

- `requireSession()`.
- `BACKUP_RESTORE_ENABLED=true`.
- Email del usuario incluido en `BACKUP_RESTORE_ALLOWED_EMAILS`.

Entrada:

```ts
type RestorePreviewRequest = {
  backup: FullBackupPayload;
};
```

Salida:

```ts
type RestorePreviewResponse = {
  runId: string;
  sourceBackupGeneratedAt: string;
  currentGeneratedAt: string;
  report: BackupCompareReport;
  warnings: string[];
};
```

Comportamiento:

- Valida forma del JSON y tablas conocidas.
- Reutiliza `compareBackupSnapshots()`.
- Guarda un `backup_restore_runs` con `mode = 'dry_run'`.
- No escribe en tablas operativas.

### `POST /api/backups/restore/execute`

Protección igual que preview.

Entrada:

```ts
type RestoreExecuteRequest = {
  backup: FullBackupPayload;
  selectedChanges: {
    table: BackupTableName;
    key: string;
    action: 'insert_missing' | 'update_changed';
  }[];
  confirmation: 'RESTAURAR';
};
```

Salida:

```ts
type RestoreExecuteResponse = {
  runId: string;
  preRestoreBackupFilename: string;
  applied: { table: BackupTableName; inserted: number; updated: number }[];
};
```

Comportamiento:

- Recalcula el diff en servidor; no confía en el diff enviado por el cliente.
- Crea backup JSON actual antes de ejecutar.
- Aplica solo filas seleccionadas.
- Registra `backup_restore_runs` con `mode = 'execute'`.
- Si falla cualquier operación, registra `status = 'failed'` con `error`.

## Orden de restauración

Para evitar errores de claves foráneas, las inserciones deben seguir este
orden:

1. `customers`
2. `productCodes`
3. `products`
4. `orders`
5. `orderItems`
6. `orderEdits`
7. `stockMovements`
8. `labels`
9. `settings`

Las actualizaciones pueden agruparse por tabla, pero deben respetar el mismo
orden si cambian llaves de relación. No se deben actualizar `id`,
`created_by`, ni columnas de auditoría sensibles salvo que el diseño de la
tabla lo exija expresamente.

## Reglas por tabla

- `customers`: permitir insertar y actualizar campos de contacto. No cambiar
  `source` salvo selección explícita y visible.
- `orders`: permitir restaurar snapshot, totales, estado, fecha, notas y
  metadata de importación. No recalcular inventario desde aquí.
- `orderItems`: permitir insertar/actualizar líneas si el pedido existe.
- `products` y `stockMovements`: alto cuidado. Restaurar movimientos no debe
  recalcular stock automáticamente en la primera versión; debe quedar como
  dato histórico seleccionado.
- `labels`: permitir recuperar rótulos borrados o tracking. Si `order_id`
  apunta a un pedido inexistente, bloquear esa fila.
- `settings`: restaurar por `key`, no por `id`.

## UI propuesta

Ubicación: `Configuración` → sección `Comparar backup JSON`.

Flujo:

1. Usuario selecciona un backup JSON anterior.
2. La app muestra el comparador actual.
3. Botón nuevo: `Preparar restauración`.
4. La API genera el dry-run y devuelve diferencias validadas en servidor.
5. UI muestra una tabla por categoría:
   - Faltantes en actual: candidatos a `insert_missing`.
   - Cambiados: candidatos a `update_changed`.
   - Extras en actual: solo lectura en la primera versión.
6. Usuario selecciona filas.
7. Antes de ejecutar:
   - Mostrar resumen por tabla.
   - Mostrar que se creará backup previo.
   - Exigir escribir `RESTAURAR`.
8. Ejecutar y mostrar resultado.

La pantalla debe seguir siendo operativa y compacta: tablas con scroll
horizontal, badges de severidad y botones con iconos lucide. Nada de textos
largos dentro de la app; la explicación completa vive en documentación.

## Validación

Pruebas unitarias:

- Validador de payload rechaza JSON incompleto o tablas desconocidas.
- Preview recalcula diff y no llama escrituras operativas.
- Execute crea backup previo antes de aplicar cambios.
- Execute rechaza si falta `RESTAURAR`.
- Execute rechaza usuario fuera de `BACKUP_RESTORE_ALLOWED_EMAILS`.
- Orden de tablas respeta dependencias.
- `settings` compara/restaura por `key`.

Pruebas de componente:

- Selección de filas por tabla.
- Botón de ejecución deshabilitado sin confirmación.
- Diferencias extra en actual aparecen como solo lectura.

Validación manual obligatoria en producción:

1. Crear backup actual.
2. Usar un backup anterior con una diferencia pequeña y conocida.
3. Ejecutar preview.
4. Restaurar una sola fila no destructiva.
5. Confirmar en la app que el dato volvió.
6. Confirmar que existe registro en `backup_restore_runs`.
7. Confirmar que se generó backup previo a la restauración.

## Riesgos y mitigaciones

- **Backup viejo contra esquema nuevo**: validar versión/campos y bloquear
  columnas desconocidas.
- **Relaciones rotas**: bloquear filas con FK inexistente y mostrarlas como
  advertencia.
- **Sobrescribir correcciones recientes**: mostrar `updated_at` del backup y
  actual antes de permitir `update_changed`.
- **Inventario inconsistente**: no recalcular stock en la primera versión.
- **Error parcial**: preferir RPC/transacción SQL para ejecución por lote; si
  se usa API con varias llamadas, limitar cada ejecución a una tabla y registrar
  exactamente qué se aplicó.

## Recomendación de implementación

Implementar en dos fases:

1. **Fase 1, segura**: preview servidor + selección + restaurar únicamente
   `customers`, `labels`, `settings` y filas faltantes simples. Sin updates de
   pedidos/inventario.
2. **Fase 2, ampliada**: updates seleccionados en `orders`/`orderItems` y
   soporte para inventario, idealmente con un RPC transaccional.

No recomiendo empezar con "restaurar todo". Para Purple Shop, el caso valioso
es recuperar cambios puntuales con evidencia clara, no reemplazar la base.

